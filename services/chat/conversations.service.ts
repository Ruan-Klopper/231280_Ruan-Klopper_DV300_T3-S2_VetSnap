// services/chat/conversations.service.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db, storage } from "../../config/firebase";
import { ref, deleteObject } from "firebase/storage";
import {
  ok,
  fail,
  CONV_COL,
  MSGS_SUB,
  currentUid,
  membersKeyFor,
} from "./common";
import type { ApiResponse } from "../../interfaces/apiResponse";
import type { Conversation } from "../../interfaces/chat";
import { getUserById } from "../user/user.service";

export const getExistingConversation = async (
  uidA: string,
  uidB: string
): Promise<ApiResponse<Conversation | null>> => {
  try {
    const key = membersKeyFor(uidA, uidB);
    const q = query(
      collection(db, CONV_COL),
      where("membersKey", "==", key),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return ok<Conversation | null>(null);
    const d = snap.docs[0];
    return ok<Conversation>({ id: d.id, ...(d.data() as any) } as Conversation);
  } catch (e: any) {
    return fail<Conversation | null>(
      e?.message ?? "Failed to fetch conversation",
      500
    );
  }
};

export const createConversation = async (
  vetId: string
): Promise<ApiResponse<Conversation>> => {
  try {
    const userId = currentUid();
    const [me, vet] = await Promise.all([
      getUserById(userId),
      getUserById(vetId),
    ]);
    if (!me.success || !me.data)
      return fail<Conversation>(me.message, me.statusCode);
    if (!vet.success || !vet.data)
      return fail<Conversation>(vet.message, vet.statusCode);

    if (me.data.role === "vet")
      return fail<Conversation>("Vets cannot initiate conversations", 403);
    if (vet.data.role !== "vet")
      return fail<Conversation>("Target user is not a veterinarian", 400);

    const existing = await getExistingConversation(userId, vetId);
    if (!existing.success)
      return fail<Conversation>(existing.message, existing.statusCode);
    if (existing.data)
      return ok<Conversation>(existing.data, "Existing conversation");

    const key = membersKeyFor(userId, vetId);
    const refDoc = await addDoc(collection(db, CONV_COL), {
      members: [userId, vetId],
      membersKey: key,
      lastMessage: null,
      updatedAt: serverTimestamp(),
      read: { [userId]: serverTimestamp(), [vetId]: serverTimestamp() },
      unread: { [userId]: 0, [vetId]: 0 },
    });

    const snap = await getDoc(refDoc);
    return ok<Conversation>(
      { id: snap.id, ...(snap.data() as any) } as Conversation,
      "Created",
      201
    );
  } catch (e: any) {
    return fail<Conversation>(
      e?.message ?? "Failed to create conversation",
      500
    );
  }
};

export const getOrCreateConversation = async (
  vetId: string
): Promise<ApiResponse<Conversation>> => {
  const existing = await getExistingConversation(currentUid(), vetId);
  if (!existing.success)
    return fail<Conversation>(existing.message, existing.statusCode);
  if (existing.data) return ok<Conversation>(existing.data, "Existing");
  return createConversation(vetId);
};

// services/chat/conversations.service.ts

export const listenToConversations = (
  userId: string,
  onChange: (conversations: Conversation[]) => void
): ApiResponse<() => void> => {
  try {
    // ⬇️ remove orderBy(...) to avoid composite index requirement
    const q = query(
      collection(db, CONV_COL),
      where("members", "array-contains", userId)
    );

    const toMillis = (ts: any): number => {
      // supports Firestore Timestamp or plain millis/seconds-ish objects
      if (!ts) return 0;
      if (typeof ts.toMillis === "function") return ts.toMillis();
      if (typeof ts === "number") return ts;
      if (typeof ts._seconds === "number") return ts._seconds * 1000;
      return 0;
    };

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as Conversation[];

      // ⬇️ client‑side sort by updatedAt desc
      list.sort(
        (a: any, b: any) => toMillis(b?.updatedAt) - toMillis(a?.updatedAt)
      );

      onChange(list);
    });

    return ok<() => void>(unsub);
  } catch (e: any) {
    return fail<() => void>(
      e?.message ?? "Failed to listen to conversations",
      500
    );
  }
};

export const deleteConversation = async (
  conversationId: string
): Promise<ApiResponse<null>> => {
  try {
    // delete messages (and images) in batches
    const msgsCol = collection(db, CONV_COL, conversationId, MSGS_SUB);

    const deleteBatchPage = async (): Promise<boolean> => {
      const pageQ = query(msgsCol, orderBy("createdAt", "asc"), limit(100));
      const pageSnap = await getDocs(pageQ);
      if (pageSnap.empty) return false;

      const batch = writeBatch(db);
      for (const d of pageSnap.docs) {
        const data = d.data() as any;
        if (data?.imageUrl) {
          try {
            const sref = ref(storage, data.imageUrl);
            await deleteObject(sref);
          } catch {}
        }
        batch.delete(d.ref);
      }
      await batch.commit();
      return pageSnap.size === 100;
    };

    while (await deleteBatchPage()) {}
    await deleteDoc(doc(db, CONV_COL, conversationId));
    return ok<null>(null, "Deleted");
  } catch (e: any) {
    return fail<null>(e?.message ?? "Failed to delete conversation", 500);
  }
};

/** Mark conversation read (zero unread for current user) */
export const markConversationRead = async (
  conversationId: string
): Promise<ApiResponse<null>> => {
  try {
    const uid = currentUid();
    const convRef = doc(db, CONV_COL, conversationId);
    await runTransaction(db, async (trx) => {
      const snap = await trx.get(convRef);
      if (!snap.exists()) throw new Error("Conversation not found");
      const conv = snap.data() as any;

      const unread = { ...(conv.unread || {}) };
      unread[uid] = 0;

      const read = { ...(conv.read || {}) };
      read[uid] = serverTimestamp();

      trx.update(convRef, { unread, read });
    });
    return ok<null>(null, "Marked as read");
  } catch (e: any) {
    return fail<null>(e?.message ?? "Failed to mark as read", 500);
  }
};

/** Internal: used by messages.service to bump lastMessage/unread */
export const postSendUpdateConversation = async (
  conversationId: string,
  payload: { text?: string | null; imageUrl?: string | null; senderId: string }
): Promise<void> => {
  const convRef = doc(db, CONV_COL, conversationId);
  await runTransaction(db, async (trx) => {
    const snap = await trx.get(convRef);
    if (!snap.exists()) throw new Error("Conversation not found");
    const conv = snap.data() as any;
    const members: string[] = conv.members || [];
    const unread = { ...(conv.unread || {}) };
    for (const m of members)
      unread[m] = m === payload.senderId ? 0 : (unread[m] || 0) + 1;

    trx.update(convRef, {
      lastMessage: {
        text: payload.text || null,
        imageUrl: payload.imageUrl || null,
        senderId: payload.senderId,
        createdAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
      unread,
    });
  });
};
