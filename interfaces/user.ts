// src/interfaces/user.ts
export type UserRole = "farmer" | "student" | "paravet" | "vet" | "admin";

export interface UserPreferences {
  notifications: { chat: boolean; marketing: boolean };
  language: string;
  theme: "light" | "dark" | "system";
  mutedConversations: string[];
}

export interface VetProfile {
  specialties: string[];
  clinicName?: string;
  practiceId?: string;
  bio?: string;
  rating?: number;
}

export interface UserStatus {
  onboardingComplete: boolean;
  banned?: boolean;
  disabled?: boolean;
}

export interface UserAudit {
  createdBy: "self" | "admin" | "google";
  lastUpdatedAt: any;
}

export interface AppUser {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  dateJoined: any;
  photoURL: string | null;
  preferences: UserPreferences;
  vetProfile: VetProfile | null;
  status: UserStatus;
  fcmTokens: string[];
  audit: UserAudit;
}

// Need to add savedArticles table - future integration
