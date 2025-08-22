// services/auth/authService

// src/services/authService.ts
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  User as FirebaseUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { auth, db, storage } from "../../config/firebase"; // your existing firebase.ts
import { ApiResponse } from "../../interfaces/apiResponse";
import { AppUser, UserRole, UserPreferences } from "../../interfaces/user";
import { mapFirebaseErrorToHttp } from "../../utils/errorMap";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  uploadString,
  deleteObject,
} from "firebase/storage";
import { updateProfile as updateAuthProfile } from "firebase/auth";
import * as FileSystem from "expo-file-system";

// ---------- Internal helpers ----------

const DEFAULT_ROLE: UserRole = "farmer";

const DEFAULT_PREFS: UserPreferences = {
  notifications: { chat: true, marketing: false },
  language: "en",
  theme: "system",
  mutedConversations: [],
};

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

function toPublicUserPayload(u: AppUser) {
  return {
    userId: u.userId,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    photoURL: u.photoURL,
    preferences: u.preferences,
    dateJoined: u.dateJoined,
    vetProfile: u.vetProfile,
    status: u.status,
  };
}

async function ensureFirestoreUser(
  fbUser: FirebaseUser,
  createdBy: "self" | "google" | "admin",
  override?: Partial<AppUser>
): Promise<AppUser> {
  const ref = doc(db, "users", fbUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as AppUser;
  }

  const newUser: AppUser = {
    userId: fbUser.uid,
    fullName: override?.fullName ?? fbUser.displayName ?? "",
    email: fbUser.email ?? (override?.email as string) ?? "",
    role: (override?.role as UserRole) ?? DEFAULT_ROLE,
    dateJoined: serverTimestamp(),
    photoURL: override?.photoURL ?? fbUser.photoURL ?? null,
    preferences: override?.preferences ?? DEFAULT_PREFS,
    vetProfile: override?.vetProfile ?? null,
    status: override?.status ?? { onboardingComplete: false },
    fcmTokens: override?.fcmTokens ?? [],
    audit: {
      createdBy,
      lastUpdatedAt: serverTimestamp(),
    },
  };

  await setDoc(ref, newUser, { merge: false });
  return (await getDoc(ref)).data() as AppUser;
}

// ---------- Sign Up User (email/password) ----------
export async function SignUpUser(params: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  vetProfile?: {
    specialties: string[];
    clinicName?: string;
    practiceId?: string;
    bio?: string;
  };
  imageUri?: string; // local path from image picker
}): Promise<ApiResponse<ReturnType<typeof toPublicUserPayload>>> {
  try {
    const { email, password, fullName, role, vetProfile, imageUri } = params;
    console.log("[SignUpUser] Params:", params);

    // Step 1: Create auth user
    console.log("[SignUpUser] Creating Firebase auth user...");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log("[SignUpUser] Auth user created:", cred.user.uid);

    // Step 2: Upload profile image if provided, can be null
    let photoURL: string | null = null;
    if (imageUri) {
      console.log("[SignUpUser] Uploading profile image...");
      photoURL = await uploadProfileImage(cred.user.uid, imageUri);
      console.log("[SignUpUser] Uploaded profile image:", photoURL);

      console.log("[SignUpUser] Updating Firebase Auth profile...");
      await updateProfile(cred.user, { photoURL });
    }

    // Step 3: Create users/{uid} (not registeredUsers)
    const userDoc: AppUser = {
      userId: cred.user.uid,
      fullName,
      email,
      role,
      photoURL,
      preferences: DEFAULT_PREFS,
      dateJoined: serverTimestamp(),
      status: { onboardingComplete: false },
      vetProfile: role === "vet" ? vetProfile ?? null : null,
      audit: { createdBy: "self", lastUpdatedAt: serverTimestamp() },
      fcmTokens: [],
    };
    console.log("[SignUpUser] Writing user document to Firestore:", userDoc);
    await setDoc(doc(db, "users", cred.user.uid), userDoc);

    // Step 4: If vet, also create veterinarians/{uid}
    if (role === "vet") {
      console.log("[SignUpUser] Creating veterinarian document...");
      await setDoc(doc(db, "veterinarians", cred.user.uid), {
        userId: cred.user.uid,
        specialties: vetProfile?.specialties ?? [],
        clinicName: vetProfile?.clinicName ?? null,
        practiceId: vetProfile?.practiceId ?? null,
        bio: vetProfile?.bio ?? null,
        rating: null,
        availability: { status: "offline" },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // Step 5: Email verification
    if (cred.user.email && !cred.user.emailVerified) {
      console.log("[SignUpUser] Sending email verification...");
      await sendEmailVerification(cred.user);
    }

    console.log("[SignUpUser] SUCCESS — all steps completed.");
    return baseSuccess(201, "User created", toPublicUserPayload(userDoc));
  } catch (e: any) {
    console.error("[SignUpUser] ERROR:", e);
    const { statusCode, message } = mapFirebaseErrorToHttp(e);
    return baseError(statusCode, "Sign up failed", message);
  }
}

// ---------- 4.2 SignInUser (email/password) ----------
export async function SignInUser(params: {
  email: string;
  password: string;
}): Promise<ApiResponse<ReturnType<typeof toPublicUserPayload>>> {
  try {
    const { email, password } = params;
    const cred = await signInWithEmailAndPassword(auth, email, password);

    const ref = doc(db, "users", cred.user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      // treat as onboarding-needed (Google-first-timers or data drift)
      const created = await ensureFirestoreUser(cred.user, "self", {});
      return baseSuccess(
        200,
        "Signed in (profile created)",
        toPublicUserPayload(created)
      );
    }

    const appUser = snap.data() as AppUser;

    if (appUser.status?.banned || appUser.status?.disabled) {
      return baseError(403, "Account disabled or banned");
    }

    return baseSuccess(200, "Signed in", toPublicUserPayload(appUser));
  } catch (e) {
    const { statusCode, message } = mapFirebaseErrorToHttp(e);
    return baseError(statusCode, "Sign in failed", message);
  }
}

// ---------- 4.3 SignInOrUpWithGoogle (Future integration, Google Client IDs is a nightmare) ----------
export async function SignInOrUpWithGoogle(params: {
  idToken: string; // from Expo AuthSession
  accessToken?: string; // optional
}): Promise<ApiResponse<ReturnType<typeof toPublicUserPayload>>> {
  try {
    const { idToken, accessToken } = params;
    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    const { user } = await signInWithCredential(auth, credential);

    const appUser = await ensureFirestoreUser(user, "google", {});
    if (appUser.status?.banned || appUser.status?.disabled) {
      return baseError(403, "Account disabled or banned");
    }

    return baseSuccess(
      200,
      "Signed in with Google",
      toPublicUserPayload(appUser)
    );
  } catch (e) {
    const { statusCode, message } = mapFirebaseErrorToHttp(e);
    return baseError(statusCode, "Google sign-in failed", message);
  }
}

// ---------- 4.4 GetCurrentUserData ----------
export async function GetCurrentUserData(): Promise<ApiResponse<AppUser>> {
  try {
    const current = auth.currentUser;
    if (!current) return baseError(401, "Not authenticated");

    const ref = doc(db, "users", current.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return baseError(404, "Profile missing");

    return baseSuccess(200, "OK", snap.data() as AppUser);
  } catch (e) {
    const { statusCode, message } = mapFirebaseErrorToHttp(e);
    return baseError(statusCode, "Failed to fetch profile", message);
  }
}

// ---------- 4.5 ResetPassword ----------
export async function ResetPassword(params: {
  email: string;
}): Promise<ApiResponse<null>> {
  try {
    const { email } = params;
    // lazy import to avoid tree shaking auth exports here
    const { sendPasswordResetEmail } = await import("firebase/auth");
    await sendPasswordResetEmail(auth, email);
    return baseSuccess(
      200,
      "If an account exists, a reset email has been sent."
    );
  } catch (e) {
    // Return generic success to avoid enumeration, but still log internally if needed
    return baseSuccess(
      200,
      "If an account exists, a reset email has been sent."
    );
  }
}

// ---------- 4.6 Logout ----------
export async function Logout(): Promise<ApiResponse<null>> {
  try {
    await signOut(auth);
    return baseSuccess(204, "Logged out");
  } catch {
    return baseSuccess(204, "Logged out");
  }
}

// ---------- 4.7 DeleteAccount ----------
/**
 * Requires recent login. If needed, call ReauthenticateEmail or ReauthenticateGoogle beforehand.
 * Make this idempotent: if Firestore doc is already gone, proceed.
 */
export async function DeleteAccount(): Promise<ApiResponse<null>> {
  try {
    const current = auth.currentUser;
    if (!current) return baseError(401, "Not authenticated");

    const uid = current.uid;

    // 1) Fetch user doc to know role and photoURL
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return baseError(404, "Profile missing");
    }
    const userData = snap.data() as AppUser;

    // 2) Delete profile image if exists
    if (userData.photoURL) {
      try {
        const imageRef = ref(storage, userData.photoURL);
        await deleteObject(imageRef);
      } catch (err) {
        console.warn("[DeleteAccount] Failed to delete profile image:", err);
      }
    }

    // 3) Delete veterinarian doc if role === "vet"
    if (userData.role === "vet") {
      try {
        await deleteDoc(doc(db, "veterinarians", uid));
      } catch (err) {
        console.warn("[DeleteAccount] Failed to delete veterinarian doc:", err);
      }
    }

    // 4) Delete user doc
    await deleteDoc(userRef);

    // 5) Delete auth user
    await deleteUser(current);

    return baseSuccess(200, "Account deleted");
  } catch (e) {
    const { statusCode, message } = mapFirebaseErrorToHttp(e);
    return baseError(statusCode, "Delete account failed", message);
  }
}

// ---------- Optional helpers for re-auth ----------
export async function ReauthenticateEmail(params: {
  email: string;
  password: string;
}) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("No active session");

  const credential = EmailAuthProvider.credential(
    params.email,
    params.password
  );
  await reauthenticateWithCredential(user, credential);
}

export async function ReauthenticateWithGoogle(params: {
  idToken: string;
  accessToken?: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("No active session");

  const credential = GoogleAuthProvider.credential(
    params.idToken,
    params.accessToken
  );
  await reauthenticateWithCredential(user, credential);
}

// ---------- Updaters aligned to constraints ----------
export async function UpdateOwnProfile(params: {
  fullName?: string;
  photoURL?: string | null;
}): Promise<ApiResponse<ReturnType<typeof toPublicUserPayload>>> {
  try {
    const current = auth.currentUser;
    if (!current) return baseError(401, "Not authenticated");

    const ref = doc(db, "users", current.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return baseError(404, "Profile missing");

    const updates: Record<string, any> = {
      "audit.lastUpdatedAt": serverTimestamp(),
    };
    if (params.fullName !== undefined) updates["fullName"] = params.fullName;
    if (params.photoURL !== undefined) updates["photoURL"] = params.photoURL;

    await updateDoc(ref, updates);
    const updated = (await getDoc(ref)).data() as AppUser;
    return baseSuccess(200, "Profile updated", toPublicUserPayload(updated));
  } catch (e) {
    const { statusCode, message } = mapFirebaseErrorToHttp(e);
    return baseError(statusCode, "Update failed", message);
  }
}

// ---------- Profile Image Upload ----------
async function uploadProfileImage(
  uid: string,
  localUri: string
): Promise<string> {
  try {
    console.log(
      "[uploadProfileImage] Uploading file from local URI:",
      localUri
    );

    // Convert local file URI into a Blob
    const response = await fetch(localUri);
    const blob = await response.blob();
    console.log("[uploadProfileImage] Blob created, size:", blob.size);

    const path = `user_profiles/${uid}/profile-${Date.now()}.jpg`;
    console.log(
      "[uploadProfileImage] Uploading to Firebase Storage path:",
      path
    );

    const storageRef = ref(storage, path);

    // Upload the blob
    await uploadBytes(storageRef, blob);
    console.log("[uploadProfileImage] Upload complete.");

    // Get download URL
    const url = await getDownloadURL(storageRef);
    console.log("[uploadProfileImage] Download URL:", url);

    return url;
  } catch (err) {
    console.error("[uploadProfileImage] ERROR:", err);
    throw err;
  }
}
