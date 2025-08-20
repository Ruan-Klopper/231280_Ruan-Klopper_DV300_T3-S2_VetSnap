// services/chat/presence.service.ts
import {
  getDatabase,
  ref as rtdbRef,
  onValue,
  onDisconnect,
  set as rtdbSet,
  serverTimestamp as rtdbServerTimestamp,
  Database,
} from "firebase/database";
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  serverTimestamp as fsServerTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { ok, fail, currentUid } from "./common";
import type { ApiResponse } from "../../interfaces/apiResponse";

/**
 * Firestore mirror document shape (presence/{userId})
 * We keep this minimal & decoupled from AppUser to avoid interface changes.
 */
export interface UserPresenceDoc {
  online: boolean;
  lastSeen: any; // Firestore timestamp
}

/** Firestore presence doc ref */
const presenceDocRef = (userId: string) => doc(db, "presence", userId);

/**
 * Start presence tracking for the current user.
 * - Uses RTDB to set online/offline with onDisconnect()
 * - Mirrors into Firestore: presence/{uid} { online, lastSeen }
 *
 * Returns: ApiResponse<() => void> (unsubscribe the .info/connected listener)
 */
export function startPresenceTracking(): ApiResponse<() => void> {
  try {
    const uid = currentUid();
    const rtdb: Database = getDatabase(); // default app

    // RTDB paths
    const connectedRef = rtdbRef(rtdb, ".info/connected");
    const statusRef = rtdbRef(rtdb, `status/${uid}`);

    // Helper to mirror into Firestore
    const mirrorToFirestore = async (online: boolean) => {
      await setDoc(
        presenceDocRef(uid),
        {
          online,
          lastSeen: fsServerTimestamp(),
        },
        { merge: true }
      );
    };

    // Listen to RTDB connection state
    const unsub = onValue(connectedRef, async (snap) => {
      const isConnected = snap.val() === true;

      if (!isConnected) {
        // Not connected: just mirror offline (don't touch onDisconnect here)
        await mirrorToFirestore(false);
        return;
      }

      // When connected: prepare onDisconnect to set offline
      await onDisconnect(statusRef).set({
        state: "offline",
        lastChanged: rtdbServerTimestamp(),
      });

      // Mark online now in RTDB
      await rtdbSet(statusRef, {
        state: "online",
        lastChanged: rtdbServerTimestamp(),
      });

      // Mirror online in Firestore
      await mirrorToFirestore(true);
    });

    // Return unsubscribe for the .info/connected listener
    return ok<() => void>(unsub, "Presence tracking started");
  } catch (e: any) {
    return fail<() => void>(
      e?.message ?? "Failed to start presence tracking",
      500
    );
  }
}

/**
 * Manually set the current user offline (e.g., on sign‑out).
 * This only mirrors Firestore; RTDB onDisconnect will also flip it after disconnect.
 */
export async function setSelfOffline(): Promise<ApiResponse<null>> {
  try {
    const uid = currentUid();
    await setDoc(
      presenceDocRef(uid),
      { online: false, lastSeen: fsServerTimestamp() },
      { merge: true }
    );
    return ok<null>(null, "Set offline");
  } catch (e: any) {
    return fail<null>(e?.message ?? "Failed to set offline", 500);
  }
}

/** Read a user's presence once */
export async function getUserPresence(
  userId: string
): Promise<ApiResponse<UserPresenceDoc | null>> {
  try {
    const snap = await getDoc(presenceDocRef(userId));
    if (!snap.exists()) return ok<UserPresenceDoc | null>(null, "No presence");
    return ok<UserPresenceDoc>(snap.data() as UserPresenceDoc, "OK");
  } catch (e: any) {
    return fail<UserPresenceDoc | null>(
      e?.message ?? "Failed to fetch presence",
      500
    );
  }
}

/** Listen to a single user's presence changes */
export function listenToUserPresence(
  userId: string,
  onChange: (p: UserPresenceDoc | null) => void
): ApiResponse<Unsubscribe> {
  try {
    const unsub = onSnapshot(presenceDocRef(userId), (snap) => {
      onChange(snap.exists() ? (snap.data() as UserPresenceDoc) : null);
    });
    return ok<Unsubscribe>(unsub, "Listening");
  } catch (e: any) {
    return fail<Unsubscribe>(e?.message ?? "Failed to listen to presence", 500);
  }
}

/**
 * Listen to many users' presence.
 * Creates one FS listener per userId; returns a single unsubscribe that tears down all.
 * `onBatch` receives a Map<userId, presence | null> whenever any changes.
 */
export function listenToManyPresence(
  userIds: string[],
  onBatch: (state: Map<string, UserPresenceDoc | null>) => void
): ApiResponse<Unsubscribe> {
  try {
    const state = new Map<string, UserPresenceDoc | null>();
    const unsubs: Unsubscribe[] = [];

    const emit = () => onBatch(new Map(state));

    for (const id of userIds) {
      const unsub = onSnapshot(presenceDocRef(id), (snap) => {
        state.set(id, snap.exists() ? (snap.data() as UserPresenceDoc) : null);
        emit();
      });
      unsubs.push(unsub);
    }

    const tearDown = () => unsubs.forEach((u) => u());
    return ok<Unsubscribe>(tearDown, "Listening to many");
  } catch (e: any) {
    return fail<Unsubscribe>(
      e?.message ?? "Failed to listen to many presence",
      500
    );
  }
}
