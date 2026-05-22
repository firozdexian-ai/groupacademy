import type { Database } from "@/integrations/supabase/types";
import { uploadModuleResource } from "@/domains/learning/repo/learningRepo";

type ResourceType = Database["public"]["Enums"]["resource_type"];

const BUCKET = "course-content";
export const MAX_RESOURCE_MB = 50;

/**
 * Upload a file to the shared course-content bucket and return its public URL.
 * Thin wrapper around `learningRepo.uploadModuleResource` that enforces the
 * client-side size cap and standardises the destination path layout.
 */
export async function uploadModuleResourceFile(
  file: File,
  moduleId: string | "new" = "new",
): Promise<{ url: string }> {
  if (file.size > MAX_RESOURCE_MB * 1024 * 1024) {
    throw new Error(`File too large (max ${MAX_RESOURCE_MB}MB).`);
  }
  const ext = file.name.split(".").pop() || "bin";
  const path = `module-resources/${moduleId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const { publicUrl } = await uploadModuleResource(BUCKET, path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  return { url: publicUrl };
}

/**
 * Map a file's MIME type to a `resource_type` enum value supported by the schema.
 */
export function detectResourceType(file: File): ResourceType {
  const mime = file.type || "";
  const name = file.name.toLowerCase();
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio_podcast";
  if (mime.startsWith("image/")) return "infographic";
  if (
    mime === "application/pdf" ||
    name.endsWith(".pdf") ||
    name.endsWith(".ppt") ||
    name.endsWith(".pptx") ||
    mime.includes("presentation")
  ) {
    return "slides";
  }
  // Catch-all for docs / other formats — slides is the most permissive bucket.
  return "slides";
}

/** Strip the file extension from a filename for use as a default title. */
export function titleFromFilename(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}
