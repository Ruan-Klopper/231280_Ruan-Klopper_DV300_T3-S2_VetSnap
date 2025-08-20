// services/chat/messages.service.ts
import {
  addDoc,
  collection,
  deleteDoc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { ok, fail, CONV_COL, MSGS_SUB, currentUid, uriToBlob } from "./common";
import type { ApiResponse } from "../../interfaces/apiResponse";
import type { Message } from "../../interfaces/chat";
import { uploadChatImage } from "./storage.service";
import { postSendUpdateConversation } from "./conversations.service";

export const listenToMessages = (
  conversationId: string,
  onChange: (messages: Message[]) => void,
  pageSize = 25
): ApiResponse<() => void> => {
  try {
    const q = query(
      collection(db, CONV_COL, conversationId, MSGS_SUB),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );
    const unsub = onSnapshot(q, (snap) => {
      onChange(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Message[]
      );
    });
    return ok<() => void>(unsub);
  } catch (e: any) {
    return fail<() => void>(e?.message ?? "Failed to listen to messages", 500);
  }
};

export const sendTextMessage = async (
  conversationId: string,
  text: string
): Promise<ApiResponse<Message>> => {
  try {
    const senderId = currentUid();
    const trimmed = (text || "").trim();
    if (!trimmed) return fail<Message>("Message is empty", 400);

    const msgRef = await addDoc(
      collection(db, CONV_COL, conversationId, MSGS_SUB),
      {
        senderId,
        text: trimmed,
        imageUrl: null,
        createdAt: serverTimestamp(),
        readBy: [senderId],
        status: "sent",
      }
    );

    await postSendUpdateConversation(conversationId, {
      text: trimmed,
      imageUrl: null,
      senderId,
    });

    const snap = await getDoc(msgRef);
    return ok<Message>(
      { id: snap.id, ...(snap.data() as any) } as Message,
      "Sent",
      201
    );
  } catch (e: any) {
    return fail<Message>(e?.message ?? "Failed to send message", 500);
  }
};

export const sendImageMessageFromUri = async (
  conversationId: string,
  localUri: string
): Promise<ApiResponse<Message>> => {
  try {
    const senderId = currentUid();

    const preMsgRef = await addDoc(
      collection(db, CONV_COL, conversationId, MSGS_SUB),
      {
        senderId,
        text: null,
        imageUrl: null,
        createdAt: serverTimestamp(),
        readBy: [senderId],
        status: "sent",
      }
    );

    const blob = await uriToBlob(localUri);
    const upload = await uploadChatImage(conversationId, preMsgRef.id, blob);
    if (!upload.success || !upload.data) {
      await deleteDoc(preMsgRef); // ← cleanup placeholder
      return fail<Message>(
        upload.message || "Image upload failed",
        upload.statusCode || 500
      );
    }

    await (
      await import("firebase/firestore")
    ).updateDoc(preMsgRef, { imageUrl: upload.data });

    await postSendUpdateConversation(conversationId, {
      text: null,
      imageUrl: upload.data,
      senderId,
    });

    const snap = await getDoc(preMsgRef);
    return ok<Message>(
      { id: snap.id, ...(snap.data() as any) } as Message,
      "Sent",
      201
    );
  } catch (e: any) {
    return fail<Message>(e?.message ?? "Failed to send image message", 500);
  }
};

export const loadMoreMessages = async (
  conversationId: string,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null,
  pageSize = 25
): Promise<
  ApiResponse<{
    messages: Message[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }>
> => {
  try {
    let qBase = query(
      collection(db, CONV_COL, conversationId, MSGS_SUB),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );
    if (lastDoc)
      qBase = query(
        collection(db, CONV_COL, conversationId, MSGS_SUB),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(pageSize)
      );

    const snap = await getDocs(qBase);
    const messages = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    })) as Message[];
    const nextLast = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;

    return ok<{ messages: Message[]; lastDoc: typeof nextLast }>({
      messages,
      lastDoc: nextLast,
    });
  } catch (e: any) {
    return fail<{ messages: Message[]; lastDoc: any }>(
      e?.message ?? "Failed to load more messages",
      500
    );
  }
};

// Mark all incoming messages as DELIVERED when I subscribe/open the chat
export async function ackMessagesDelivered(
  conversationId: string,
  myUid: string
): Promise<void> {
  const { getDocs, query, collection, where, limit } = await import(
    "firebase/firestore"
  );
  const q = query(
    collection(db, CONV_COL, conversationId, MSGS_SUB),
    where("senderId", "!=", myUid),
    where("status", "==", "sent"),
    limit(100)
  );
  const snap = await getDocs(q);
  const { writeBatch } = await import("firebase/firestore");
  const batch = writeBatch(db);
  snap.forEach((d) => batch.update(d.ref, { status: "delivered" }));
  await batch.commit();
}

// Mark messages as READ and add me to readBy
export async function markMessagesRead(
  conversationId: string,
  myUid: string
): Promise<void> {
  const { getDocs, query, collection, where, limit } = await import(
    "firebase/firestore"
  );
  const q = query(
    collection(db, CONV_COL, conversationId, MSGS_SUB),
    where("senderId", "!=", myUid),
    where("status", "in", ["sent", "delivered"]),
    limit(200)
  );
  const snap = await getDocs(q);
  const { writeBatch, arrayUnion } = await import("firebase/firestore");
  const batch = writeBatch(db);
  snap.forEach((d) =>
    batch.update(d.ref, { status: "read", readBy: arrayUnion(myUid) })
  );
  await batch.commit();
}
