// src/interfaces/pulse.ts

export type PulseCategory = "alert" | "tips" | "suggestion";

export interface PulseMedia {
  photoUrl?: string | null; // single image (optional)
}

export interface PulsePost {
  id: string; // Firestore doc id
  authorId: string;
  title: string; // 4–120 chars
  description?: string; // ≤ 2000 chars
  category: PulseCategory; // "alert" | "tips" | "suggestion"
  media?: PulseMedia;
  edited: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp

  // Optional server-owned (add when enabling "Top Pulses")
  pulseCount?: number;
  lastActivityAt?: any;
}

export interface PulseReaction {
  userId: string; // subdoc id == uid
  createdAt: any; // Firestore Timestamp
}

export interface PulseAggregates {
  count: number;
  updatedAt: any;
}

// Stream contracts
export interface PulseListPage {
  items: PulsePost[];
  cursor: any | null; // last visible doc (QueryDocumentSnapshot) or null
}

export interface ToggleResult {
  isPulsed: boolean;
}
