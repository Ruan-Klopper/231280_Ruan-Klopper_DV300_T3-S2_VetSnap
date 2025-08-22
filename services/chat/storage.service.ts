// services/chat/storage.service.ts
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/firebase";
import { ok, fail } from "./common";
import type { ApiResponse } from "../../interfaces/apiResponse";

async function uriToBlob(localUri: string): Promise<Blob> {
  // Required on RN/Expo for file:// URIs
  const res = await fetch(localUri);
  return await res.blob();
}

export const uploadChatImageResumable = async (
  conversationId: string,
  messageId: string,
  localUri: string,
  contentType = "image/jpeg"
): Promise<ApiResponse<{ url: string }>> => {
  try {
    const path = `chat_images/${conversationId}/${messageId}`;
    const sref = ref(storage, path);
    const blob = await uriToBlob(localUri);

    const uploadTask = uploadBytesResumable(sref, blob, { contentType });

    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        // (snap) => { /* you can surface progress: snap.bytesTransferred / snap.totalBytes */ },
        undefined,
        reject,
        () => resolve()
      );
    });

    const url = await getDownloadURL(uploadTask.snapshot.ref);
    return ok({ url }, "Uploaded", 201);
  } catch (e: any) {
    return fail(e?.message ?? "Failed to upload image", 500);
  }
};
