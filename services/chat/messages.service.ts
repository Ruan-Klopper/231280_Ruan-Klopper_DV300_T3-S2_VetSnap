// /services/chat/messages.service.ts
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "../../config/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// ---- Types ----
export type MessageDoc = {
  id?: string;
  senderId: string;
  text?: string | null;
  imageUrl?: string | null;
  status?: "sent" | "delivered" | "read" | "uploading";
  createdAt?: any;
};

// Convenience
const CONV = "conversations";
const MSGS = "messages";

// Optional helper if you use a standard ApiResponse shape
const ok = <T>(data: T) => ({ success: true as const, data });
const fail = (message: string) => ({ success: false as const, message });

// ---- LISTEN ----
export function listenToMessages(
  conversationId: string,
  cb: (docs: MessageDoc[]) => void
) {
  const q = query(
    collection(db, CONV, conversationId, MSGS),
    orderBy("createdAt", "asc")
  );

  const unsub = onSnapshot(q, (snap) => {
    const rows: MessageDoc[] = [];
    snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
    cb(rows);
  });

  return ok(unsub); // { success: true, data: () => void }
}

// ---- SEND TEXT ----
export async function sendTextMessage(
  conversationId: string,
  senderId: string,
  text: string
) {
  try {
    await addDoc(collection(db, CONV, conversationId, MSGS), {
      senderId,
      text: text ?? null,
      imageUrl: null,
      status: "sent",
      createdAt: serverTimestamp(),
    });
    return ok(true);
  } catch (e: any) {
    return fail(e?.message ?? "Failed to send text");
  }
}

// ---- SEND IMAGE (patient) ----
export async function sendImageMessage(
  conversationId: string,
  senderId: string,
  localImageUri: string,
  contentType = "image/jpeg"
) {
  try {
    // 1) Pre-create a message with status: uploading
    const msgRef = await addDoc(collection(db, CONV, conversationId, MSGS), {
      senderId,
      text: null,
      imageUrl: null,
      status: "uploading",
      createdAt: serverTimestamp(),
    });

    // 2) Convert local URI to Blob (Expo/RN-friendly)
    const blob = await (await fetch(localImageUri)).blob();

    // 3) Upload to Storage (resumable)
    const sref = ref(storage, `chat_images/${conversationId}/${msgRef.id}`);
    const task = uploadBytesResumable(sref, blob, { contentType });

    await new Promise<void>((resolve, reject) => {
      task.on("state_changed", undefined, reject, () => resolve());
    });

    const url = await getDownloadURL(task.snapshot.ref);

    // 4) Patch message with final imageUrl + status: sent
    await updateDoc(doc(db, CONV, conversationId, MSGS, msgRef.id), {
      imageUrl: url,
      status: "sent",
    });

    return ok(true);
  } catch (e: any) {
    return fail(e?.message ?? "Failed to send image");
  }
}
