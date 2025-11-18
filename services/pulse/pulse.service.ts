// src/services/pulse/pulse.service.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  runTransaction,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import type {
  PulsePost,
  PulseReaction,
  PulseListPage,
  PulseCategory,
  ToggleResult,
} from "../../interfaces/pulse";
import { ApiResponse } from "../../interfaces/apiResponse";
import { mapFirebaseErrorToHttp } from "../../utils/errorMap";
import { validatePostInput } from "../../utils/validators/pulseValidation";
import { uploadPulseImage, deletePulseImageByUrl } from "./pulseImage.service";

// ---------- Local helpers (mirroring authService style) ----------

function baseSuccess<T>(
  statusCode: number,
  message: string,
  data?: T
): ApiResponse<T> {
  return { success: true, statusCode, message, data };
}

function baseError<T>(
  statusCode: number,
  message: string,
  error?: string
): ApiResponse<T> {
  return { success: false, statusCode, message, error };
}

const POSTS = collection(db, "pulsePosts");

// Optional super-light client-side rate limit (best effort; enforce properly server-side)
const _rateLimiter = new Map<string, number>();
function rateLimitGuard(userId: string, action: string, ms = 3000) {
  const key = `${userId}::${action}`;
  const now = Date.now();
  const prev = _rateLimiter.get(key) ?? 0;
  if (now - prev < ms)
    return { allowed: false, retryAfterMs: ms - (now - prev) };
  _rateLimiter.set(key, now);
  return { allowed: true as const };
}

// ---------- Shape utilities ----------

function toPulsePost(id: string, d: DocumentData): PulsePost {
  return {
    id,
    authorId: d.authorId,
    title: d.title,
    description: d.description,
    category: d.category,
    media: d.media ?? {},
    edited: !!d.edited,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    pulseCount: d.pulseCount,
    lastActivityAt: d.lastActivityAt,
  };
}

// ---------- A) POSTS (CRUD) ----------

export async function createPost(params: {
  authorId: string; // typically auth.currentUser!.uid
  title: string;
  description?: string;
  category: PulseCategory;
  localPhotoUri?: string; // optional single image to upload (0–1)
}): Promise<ApiResponse<{ postId: string }>> {
  try {
    // Auth check
    const current = auth.currentUser;
    if (!current || current.uid !== params.authorId) {
      return baseError(401, "Not authenticated or invalid author");
    }

    // Validation
    const { valid, errors } = validatePostInput(params);
    if (!valid)
      return baseError(400, "Validation failed", JSON.stringify(errors));

    // Rate limit (soft)
    const rl = rateLimitGuard(current.uid, "createPost", 3000);
    if (!rl.allowed) {
      return baseError(429, "Too many attempts. Please wait and try again.");
    }

    // Prepare doc
    const newRef = doc(POSTS);
    const now = serverTimestamp();
    let photoUrl: string | undefined;

    // Upload image first (so the post always references a valid URL)
    if (params.localPhotoUri) {
      photoUrl = await uploadPulseImage(newRef.id, params.localPhotoUri);
    }

    // Build payload, only including description if it has a value
    const trimmedDescription = (params.description ?? "").trim();
    const payload: Omit<PulsePost, "id"> = {
      authorId: params.authorId,
      title: params.title.trim(),
      ...(trimmedDescription && { description: trimmedDescription }),
      category: params.category,
      media: photoUrl ? { photoUrl } : {},
      edited: false,
      createdAt: now,
      updatedAt: now,
      // pulseCount: 0, // add only if you enable "Top Pulses"
      // lastActivityAt: now,
    };

    await setDoc(newRef, payload);
    return baseSuccess(201, "Pulse created", { postId: newRef.id });
  } catch (err: any) {
    console.error("[createPost] error:", err);
    const { statusCode, message } = mapFirebaseErrorToHttp(err);
    return baseError(statusCode, "Failed to create pulse", message);
  }
}

export async function updatePost(params: {
  postId: string;
  changes: Partial<Pick<PulsePost, "title" | "description" | "category">>;
  replacePhotoWithUri?: string | null;
}): Promise<ApiResponse<{ postId: string }>> {
  try {
    const current = auth.currentUser;
    if (!current) return baseError(401, "Not authenticated");

    const refDoc = doc(db, "pulsePosts", params.postId);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return baseError(404, "Pulse not found");

    const existing = toPulsePost(snap.id, snap.data());
    if (existing.authorId !== current.uid) {
      return baseError(403, "You can only edit your own pulse");
    }

    // Validate (only check fields present)
    const { valid, errors } = validatePostInput({
      title: params.changes.title ?? existing.title,
      description: params.changes.description ?? existing.description,
      category: params.changes.category ?? existing.category,
    });
    if (!valid)
      return baseError(400, "Validation failed", JSON.stringify(errors));

    // Handle image decision tree
    let mediaUpdates: Record<string, any> | undefined;

    if (params.replacePhotoWithUri === null) {
      // Remove existing image
      if (existing.media?.photoUrl) {
        await deletePulseImageByUrl(existing.media.photoUrl);
      }
      mediaUpdates = { media: {} };
    } else if (typeof params.replacePhotoWithUri === "string") {
      // Replace with new image
      if (existing.media?.photoUrl) {
        await deletePulseImageByUrl(existing.media.photoUrl);
      }
      const newUrl = await uploadPulseImage(
        params.postId,
        params.replacePhotoWithUri
      );
      mediaUpdates = { media: { photoUrl: newUrl } };
    }

    // Build updates object, only including fields that have values
    const updates: Record<string, any> = {
      ...(mediaUpdates ?? {}),
      edited: true,
      updatedAt: serverTimestamp(),
    };

    // Only add description if it has a value (omit if empty)
    if ("description" in params.changes) {
      const trimmedDesc = params.changes.description?.trim();
      if (trimmedDesc) {
        updates.description = trimmedDesc;
      }
    }

    // Add other fields if they exist
    if ("title" in params.changes && params.changes.title) {
      updates.title = params.changes.title.trim();
    }
    if ("category" in params.changes && params.changes.category) {
      updates.category = params.changes.category;
    }

    await updateDoc(refDoc, updates);
    return baseSuccess(200, "Pulse updated", { postId: params.postId });
  } catch (err: any) {
    console.error("[updatePost] error:", err);
    const { statusCode, message } = mapFirebaseErrorToHttp(err);
    return baseError(statusCode, "Failed to update pulse", message);
  }
}

export async function deletePost(
  postId: string
): Promise<ApiResponse<{ postId: string }>> {
  try {
    const current = auth.currentUser;
    if (!current) return baseError(401, "Not authenticated");

    const refDoc = doc(db, "pulsePosts", postId);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return baseError(404, "Pulse not found");

    const data = toPulsePost(snap.id, snap.data());
    if (data.authorId !== current.uid) {
      return baseError(403, "You can only delete your own pulse");
    }

    // 1) Delete subcollection /pulses
    const pulsesCol = collection(db, `pulsePosts/${postId}/pulses`);
    const pulses = await getDocs(pulsesCol);
    const batchDeletes = pulses.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(batchDeletes);

    // 2) Delete storage image (if any)
    if (data.media?.photoUrl) {
      await deletePulseImageByUrl(data.media.photoUrl);
    }

    // 3) Delete post document
    await deleteDoc(refDoc);

    return baseSuccess(200, "Pulse deleted", { postId });
  } catch (err: any) {
    console.error("[deletePost] error:", err);
    const { statusCode, message } = mapFirebaseErrorToHttp(err);
    return baseError(statusCode, "Failed to delete pulse", message);
  }
}

export async function getPost(
  postId: string
): Promise<ApiResponse<PulsePost | null>> {
  try {
    const snap = await getDoc(doc(db, "pulsePosts", postId));
    if (!snap.exists()) return baseSuccess(200, "Not found", null);
    return baseSuccess(200, "OK", toPulsePost(snap.id, snap.data()));
  } catch (err: any) {
    const { statusCode, message } = mapFirebaseErrorToHttp(err);
    return baseError(statusCode, "Failed to fetch pulse", message);
  }
}

// ---------- B) LISTS & REALTIME ----------

type SortMode = "Recent" | "Top"; // "Top" only if pulseCount enabled, not integrated to screen component, will integrate in the future

export function subscribeAllPosts(
  opts: {
    category?: PulseCategory | "All";
    sort?: SortMode; // default: "Recent"
    pageSize?: number; // default: 20
  },
  onUpdate: (page: PulseListPage) => void,
  onError?: (e: any) => void
) {
  const pageSize = opts.pageSize ?? 20;
  const sort = opts.sort ?? "Recent";

  const constraints: any[] = [];
  if (opts.category && opts.category !== "All") {
    constraints.push(where("category", "==", opts.category));
  }
  if (sort === "Top") {
    constraints.push(
      orderBy("pulseCount", "desc"),
      orderBy("createdAt", "desc")
    );
  } else {
    constraints.push(orderBy("createdAt", "desc"));
  }
  constraints.push(limit(pageSize));

  const q = query(POSTS, ...constraints);

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => toPulsePost(d.id, d.data()));
      const cursor = snap.docs.length
        ? (snap.docs[snap.docs.length - 1] as QueryDocumentSnapshot)
        : null;
      onUpdate({ items, cursor });
    },
    (err) => onError?.(err)
  );
}

export function subscribeMyPosts(
  opts: { userId: string; pageSize?: number },
  onUpdate: (page: PulseListPage) => void,
  onError?: (e: any) => void
) {
  const pageSize = opts.pageSize ?? 20;
  const qUser = query(
    POSTS,
    where("authorId", "==", opts.userId),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );

  return onSnapshot(
    qUser,
    (snap) => {
      const items = snap.docs.map((d) => toPulsePost(d.id, d.data()));
      const cursor = snap.docs.length
        ? (snap.docs[snap.docs.length - 1] as QueryDocumentSnapshot)
        : null;
      onUpdate({ items, cursor });
    },
    (err) => onError?.(err)
  );
}

export async function fetchMore(opts: {
  category?: PulseCategory | "All";
  sort?: SortMode;
  pageSize?: number;
  cursor: QueryDocumentSnapshot<DocumentData>;
}): Promise<ApiResponse<PulseListPage>> {
  try {
    const pageSize = opts.pageSize ?? 20;
    const sort = opts.sort ?? "Recent";

    const constraints: any[] = [];
    if (opts.category && opts.category !== "All") {
      constraints.push(where("category", "==", opts.category));
    }
    if (sort === "Top") {
      constraints.push(
        orderBy("pulseCount", "desc"),
        orderBy("createdAt", "desc")
      );
    } else {
      constraints.push(orderBy("createdAt", "desc"));
    }
    constraints.push(startAfter(opts.cursor), limit(pageSize));

    const qMore = query(POSTS, ...constraints);
    const snap = await getDocs(qMore);

    const items = snap.docs.map((d) => toPulsePost(d.id, d.data()));
    const cursor = snap.docs.length
      ? (snap.docs[snap.docs.length - 1] as QueryDocumentSnapshot)
      : null;

    return baseSuccess(200, "OK", { items, cursor });
  } catch (err: any) {
    console.error("[fetchMore] error:", err);
    const { statusCode, message } = mapFirebaseErrorToHttp(err);
    return baseError(statusCode, "Failed to fetch more", message);
  }
}

// ---------- C) REACTIONS (per-user Pulse toggle) ----------

export async function getMyPulseState(
  postId: string,
  userId: string
): Promise<ApiResponse<{ isPulsed: boolean }>> {
  try {
    const ref = doc(db, `pulsePosts/${postId}/pulses`, userId);
    const snap = await getDoc(ref);
    return baseSuccess(200, "OK", { isPulsed: snap.exists() });
  } catch (err: any) {
    const { statusCode, message } = mapFirebaseErrorToHttp(err);
    return baseError(statusCode, "Failed to get pulse state", message);
  }
}

export function subscribeMyPulseState(
  postId: string,
  userId: string,
  onUpdate: (v: { isPulsed: boolean }) => void,
  onError?: (e: any) => void
) {
  const ref = doc(db, `pulsePosts/${postId}/pulses`, userId);
  return onSnapshot(
    ref,
    (snap) => onUpdate({ isPulsed: snap.exists() }),
    (err) => onError?.(err)
  );
}

export async function togglePulse(postId: string, userId: string) {
  try {
    const rl = rateLimitGuard(userId, `toggle::${postId}`, 800);
    if (!rl.allowed)
      return baseError(429, "Too many taps. Please wait a moment.");

    const pulseRef = doc(db, `pulsePosts/${postId}/pulses`, userId);
    const postRef = doc(db, "pulsePosts", postId);

    let finalState = false;

    await runTransaction(db, async (tx) => {
      const pulseSnap = await tx.get(pulseRef);
      const postSnap = await tx.get(postRef);
      if (!postSnap.exists()) throw new Error("not-found");
      const currentCount = Number(postSnap.data().pulseCount ?? 0);

      if (pulseSnap.exists()) {
        tx.delete(pulseRef);
        finalState = false;
        tx.update(postRef, {
          pulseCount: Math.max(0, currentCount - 1),
          lastActivityAt: serverTimestamp(),
        });
      } else {
        tx.set(pulseRef, { userId, createdAt: serverTimestamp() });
        finalState = true;
        tx.update(postRef, {
          pulseCount: currentCount + 1,
          lastActivityAt: serverTimestamp(),
        });
      }
    });

    return baseSuccess(200, "Toggled", { isPulsed: finalState });
  } catch (err: any) {
    if (err?.message === "not-found") return baseError(404, "Pulse not found");
    const { code, message } = mapFirebaseErrorToHttp(err);
    return baseError(code, "Failed to toggle pulse", message);
  }
}

export async function batchGetMyPulseStates(
  postIds: string[],
  userId: string
): Promise<ApiResponse<Record<string, boolean>>> {
  try {
    // Firestore doesn't do IN on subcollections directly; fetch one by one (fine for page-size lists).
    const pairs = await Promise.all(
      postIds.map(async (pid) => {
        const ref = doc(db, `pulsePosts/${pid}/pulses`, userId);
        const snap = await getDoc(ref);
        return [pid, snap.exists()] as const;
      })
    );

    const map: Record<string, boolean> = {};
    pairs.forEach(([pid, state]) => (map[pid] = state));
    return baseSuccess(200, "OK", map);
  } catch (err: any) {
    const { statusCode, message } = mapFirebaseErrorToHttp(err);
    return baseError(statusCode, "Failed to batch pulse states", message);
  }
}

// ---------- D) Uploads & Utilities ----------

/** Formats a PulsePost + myPulseMap into a UI-ready card view-model */
export function formatForCard(
  post: PulsePost,
  myPulseMap: Record<string, boolean>
) {
  const isAlert = post.category === "alert";
  const isPulsedByMe = !!myPulseMap[post.id];

  return {
    postId: post.id,
    authorId: post.authorId,
    title: post.title,
    description: post.description,
    category: post.category,
    photoUrl: post.media?.photoUrl || null,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    edited: post.edited,
    isPulsedByMe,
    isMine: auth.currentUser?.uid === post.authorId,
    variant: isAlert ? "alert" : "standard",
  };
}
