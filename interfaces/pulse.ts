// src/interfaces/pulse.ts

export type PulseCategory = "alert" | "tips" | "suggestion";

export interface PulseMedia {
  photoUrl?: string | null;
}

export interface PulsePost {
  id: string;
  authorId: string;
  title: string;
  description?: string;
  category: PulseCategory; // "alert" | "tips" | "suggestion"
  media?: PulseMedia;
  edited: boolean;
  createdAt: any;
  updatedAt: any;

  // Future integration, currently here for ease of implementation
  pulseCount?: number;
  lastActivityAt?: any;
}

export interface PulseReaction {
  userId: string;
  createdAt: any;
}

export interface PulseAggregates {
  count: number;
  updatedAt: any;
}

// Stream contracts
export interface PulseListPage {
  items: PulsePost[];
  cursor: any | null;
}

export interface ToggleResult {
  isPulsed: boolean;
}
