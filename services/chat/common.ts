// services/chat/common.ts
import { auth } from "../../config/firebase";
import type { ApiResponse } from "../../interfaces/apiResponse";

export const USERS_COL = "users";
export const CONV_COL = "conversations";
export const MSGS_SUB = "messages";

// Use named generic functions to avoid JSX ambiguity in any config
export function ok<T>(
  data: T,
  message = "OK",
  statusCode = 200
): ApiResponse<T> {
  return {
    success: true,
    statusCode,
    message,
    data,
  };
}

export function fail<T = never>(
  message: string,
  statusCode = 400
): ApiResponse<T> {
  return {
    success: false,
    statusCode,
    message,
  };
}

export const currentUid = () => {
  const u = auth.currentUser;
  if (!u) throw new Error("Not authenticated");
  return u.uid;
};

export const norm = (s: string) => (s || "").trim().toLowerCase();

export const membersKeyFor = (a: string, b: string) => [a, b].sort().join("_");

export async function uriToBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return res.blob();
}
