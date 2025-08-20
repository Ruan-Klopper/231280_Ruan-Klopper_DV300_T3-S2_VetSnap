// src/utils/validators/pulseValidation.ts
import type { PulseCategory } from "../../interfaces/pulse";

export function validatePostInput(input: {
  title?: string;
  description?: string;
  category?: PulseCategory;
}) {
  const errors: Record<string, string> = {};
  const title = (input.title ?? "").trim();
  const description = (input.description ?? "").trim();
  const category = input.category;

  if (!title || title.length < 4) {
    errors.title = "Title must be at least 4 characters.";
  } else if (title.length > 120) {
    errors.title = "Title cannot exceed 120 characters.";
  }

  if (description && description.length > 2000) {
    errors.description = "Description cannot exceed 2000 characters.";
  }

  const allowed: PulseCategory[] = ["alert", "tips", "suggestion"];
  if (!category || !allowed.includes(category)) {
    errors.category = "Invalid category. Choose alert, tips, or suggestion.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
