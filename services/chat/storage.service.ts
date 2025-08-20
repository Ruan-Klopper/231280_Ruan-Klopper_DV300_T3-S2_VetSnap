// services/chat/storage.service.ts
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/firebase";
import { ok, fail } from "./common";
import type { ApiResponse } from "../../interfaces/apiResponse";

export const uploadChatImage = async (
  conversationId: string,
  messageId: string,
  file: Blob
): Promise<ApiResponse<string>> => {
  try {
    const path = `chat_images/${conversationId}/${messageId}`;
    const sref = ref(storage, path);
    await uploadBytes(sref, file);
    const url = await getDownloadURL(sref);
    return ok<string>(url, "Uploaded", 201);
  } catch (e: any) {
    return fail<string>(e?.message ?? "Failed to upload image", 500);
  }
};
