// services/sanity/api.ts
import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  projectId: "lx0o1rgf", // replace with your actual project ID
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: true,
  token: "",
});

console.log("[Sanity] client init:", {
  projectId: process.env.EXPO_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.EXPO_PUBLIC_SANITY_DATASET,
  useCdn: true,
});
