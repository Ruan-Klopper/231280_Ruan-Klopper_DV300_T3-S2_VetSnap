// services/user/user.service.ts
import {
  doc,
  getDoc,
  getDocs,
  collection,
  where,
  limit,
  query,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import type { ApiResponse } from "../../interfaces/apiResponse";
import type { AppUser } from "../../interfaces/user";

// Local ApiResponse helpers (kept here to avoid importing from chat/*)
function ok<T>(data: T, message = "OK", statusCode = 200): ApiResponse<T> {
  return { success: true, statusCode, message, data };
}
function fail<T = never>(message: string, statusCode = 400): ApiResponse<T> {
  return { success: false, statusCode, message };
}

const USERS_COL = "users";
const norm = (s: string) => (s || "").trim().toLowerCase();

/** Fetch a user by Firestore uid */
export async function getUserById(uid: string): Promise<ApiResponse<AppUser>> {
  try {
    const snap = await getDoc(doc(db, USERS_COL, uid));
    if (!snap.exists()) return fail<AppUser>("User not found", 404);
    const user = {
      userId: snap.id,
      ...(snap.data() as Omit<AppUser, "userId">),
    } as AppUser;
    return ok<AppUser>(user);
  } catch (e: any) {
    return fail<AppUser>(e?.message ?? "Failed to fetch user", 500);
  }
}

/** List veterinarians with optional name prefix filter (uses AppUser.fullName) */
export async function listVets(
  search?: string,
  max: number = 25
): Promise<ApiResponse<AppUser[]>> {
  try {
    const q = query(
      collection(db, USERS_COL),
      where("role", "==", "vet"),
      limit(max)
    );
    const snap = await getDocs(q);

    let vets = snap.docs.map((d) => ({
      userId: d.id,
      ...(d.data() as Omit<AppUser, "userId">),
    })) as AppUser[];

    if (search?.trim()) {
      const s = norm(search);
      vets = vets.filter((v) => norm(v.fullName).startsWith(s));
    }

    return ok<AppUser[]>(vets);
  } catch (e: any) {
    return fail<AppUser[]>(e?.message ?? "Failed to list veterinarians", 500);
  }
}
