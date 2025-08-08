// services/sanity/api.ts
import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  projectId: "lx0o1rgf", // replace with your actual project ID
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: true,
});
