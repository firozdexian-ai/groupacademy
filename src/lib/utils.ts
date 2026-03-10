import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates if a string is a valid UUID v4
 */
export function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(str);
}

/**
 * Formats a phone number into a WhatsApp link.
 * Handles Bangladesh numbers (880 prefix) and international formats.
 */
export function formatWhatsAppLink(phone: string | null): string | null {
  if (!phone) return null;
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  if (cleaned.startsWith("880")) {
    return `https://wa.me/${cleaned}`;
  } else if (cleaned.startsWith("0")) {
    return `https://wa.me/880${cleaned.slice(1)}`;
  } else if (cleaned.length === 10) {
    return `https://wa.me/880${cleaned}`;
  }
  return `https://wa.me/${cleaned}`;
}

/**
 * Extracts the actual first name, skipping common prefixes like Md., Dr., etc.
 */
export function extractFirstName(fullName: string): string {
  const prefixes = [
    "md.", "md", "mst.", "mst", "dr.", "dr", "engr.", "engr",
    "prof.", "prof", "mr.", "mr", "mrs.", "mrs", "ms.", "ms",
  ];
  const parts = fullName.trim().split(/\s+/);
  if (parts.length > 1 && prefixes.includes(parts[0].toLowerCase())) {
    return parts[1];
  }
  return parts[0];
}
