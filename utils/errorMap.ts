// src/utils/errorMap.ts
import { FirebaseError } from "firebase/app";

export function mapFirebaseErrorToHttp(e: unknown): {
  statusCode: number;
  message: string;
} {
  if (!(e instanceof FirebaseError)) {
    return { statusCode: 500, message: "Unexpected error" };
  }

  switch (e.code) {
    case "auth/email-already-in-use":
      return { statusCode: 409, message: "Email already in use" };
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return { statusCode: 401, message: "Invalid credentials" };
    case "auth/weak-password":
      return { statusCode: 400, message: "Weak password" };
    case "auth/too-many-requests":
      return { statusCode: 429, message: "Too many requests" };
    case "permission-denied":
    case "firestore/permission-denied":
      return { statusCode: 403, message: "Permission denied - check Firestore security rules" };
    case "unavailable":
      return { statusCode: 503, message: "Service temporarily unavailable" };
    case "unauthenticated":
      return { statusCode: 401, message: "Not authenticated" };
    default:
      return { statusCode: 500, message: e.message || "Internal error" };
  }
}
