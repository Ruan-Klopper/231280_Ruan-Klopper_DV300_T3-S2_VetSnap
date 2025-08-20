// src/services/pulse/pulseImage.service.ts
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "../../config/firebase";

/**
 * Builds the canonical storage path for a pulse photo
 *   e.g. pulses/{postId}/photo.jpg
 */
export function pulseImagePath(postId: string) {
  return `pulses/${postId}/photo.jpg`;
}

/**
 * Uploads a single local image (Expo file URI or http(s)) to Storage for this post.
 * Returns the public download URL.
 */
export async function uploadPulseImage(
  postId: string,
  localUri: string
): Promise<string> {
  // NOTE: mirrors your authService uploadProfileImage pattern (fetch -> blob -> uploadBytes)
  const response = await fetch(localUri);
  const blob = await response.blob();

  const storageRef = ref(storage, pulseImagePath(postId));
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  return url;
}

/**
 * Deletes the storage object if you have its full gs/http URL.
 * Safe to call even if the object no longer exists.
 */
export async function deletePulseImageByUrl(photoUrl: string): Promise<void> {
  try {
    const imageRef = ref(storage, photoUrl);
    await deleteObject(imageRef);
  } catch (err) {
    // swallow (file may already be missing) — caller handles UX
    console.warn("[deletePulseImageByUrl] warn:", err);
  }
}
