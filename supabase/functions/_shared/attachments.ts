// Shared attachment loader for admin chat agents.
// Reads body.attachments (admin-chat-attachments bucket) and produces:
//   - imageParts: OpenAI/Gemini-compatible image_url content parts
//   - textBlocks: extracted plain text snippets to inject into the prompt
//
// Usage in an agent edge function (Deno):
//   import { augmentLastUserMessage } from "../_shared/attachments.ts";
//   await augmentLastUserMessage(admin, convo, body.attachments);

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const BUCKET = "admin-chat-attachments";
const MAX_IMAGES = 4;
const MAX_TEXT_BYTES_PER_FILE = 64 * 1024; // 64 KB
const MAX_TOTAL_TEXT_BYTES = 200 * 1024; // 200 KB

export interface RawAttachment {
  name: string;
  path: string;
  mime: string;
  size: number;
}

export interface LoadedAttachments {
  imageParts: Array<{ type: "image_url"; image_url: { url: string } }>;
  textBlocks: string[];
}

const TEXT_MIME_PREFIXES = ["text/"];
const TEXT_MIMES = new Set([
  "application/json",
  "application/xml",
  "application/csv",
  "application/x-yaml",
  "application/yaml",
]);
const TEXT_EXT = /\.(txt|md|csv|tsv|json|yaml|yml|log|xml|html?|css|js|ts|tsx|jsx)$/i;

function isTextLike(att: RawAttachment): boolean {
  if (TEXT_MIME_PREFIXES.some((p) => att.mime?.startsWith(p))) return true;
  if (TEXT_MIMES.has(att.mime)) return true;
  if (TEXT_EXT.test(att.name)) return true;
  return false;
}

function isImage(att: RawAttachment): boolean {
  return att.mime?.startsWith("image/");
}

export async function loadAttachments(
  supabase: SupabaseClient,
  attachments: RawAttachment[] | undefined,
): Promise<LoadedAttachments> {
  const imageParts: LoadedAttachments["imageParts"] = [];
  const textBlocks: string[] = [];
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return { imageParts, textBlocks };
  }

  let totalText = 0;
  let imageCount = 0;

  for (const att of attachments) {
    try {
      if (isImage(att) && imageCount < MAX_IMAGES) {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(att.path, 60 * 60);
        if (signed?.signedUrl) {
          imageParts.push({
            type: "image_url",
            image_url: { url: signed.signedUrl },
          });
          imageCount++;
        }
        continue;
      }

      if (isTextLike(att)) {
        if (totalText >= MAX_TOTAL_TEXT_BYTES) continue;
        const { data: blob, error } = await supabase.storage
          .from(BUCKET)
          .download(att.path);
        if (error || !blob) continue;
        const ab = await blob.arrayBuffer();
        const slice = ab.byteLength > MAX_TEXT_BYTES_PER_FILE
          ? ab.slice(0, MAX_TEXT_BYTES_PER_FILE)
          : ab;
        const text = new TextDecoder("utf-8", { fatal: false }).decode(slice);
        const trimmed = text.length > 8000 ? text.slice(0, 8000) + "\n…(truncated)" : text;
        textBlocks.push(`[Attached file: ${att.name} (${att.mime})]\n${trimmed}`);
        totalText += trimmed.length;
        continue;
      }

      // Unknown binary (PDF, DOCX, etc.) — provide a signed URL the model can
      // reference but cannot fetch. Lightweight extraction libraries don't run
      // reliably in Deno edge runtime, so we surface metadata only for now.
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(att.path, 60 * 60);
      textBlocks.push(
        `[Attached file: ${att.name} (${att.mime}, ${(att.size / 1024).toFixed(
          1,
        )} KB)] — binary file; download URL: ${signed?.signedUrl ?? "(unavailable)"}`,
      );
    } catch (e) {
      console.warn("attachment load failed", att.path, e);
    }
  }

  return { imageParts, textBlocks };
}

/**
 * Mutates the last user message in `convo` to include image content parts
 * and prepends a system note with extracted text blocks (if any).
 */
export async function augmentLastUserMessage(
  supabase: SupabaseClient,
  convo: any[],
  attachments: RawAttachment[] | undefined,
): Promise<void> {
  const loaded = await loadAttachments(supabase, attachments);
  if (loaded.imageParts.length === 0 && loaded.textBlocks.length === 0) return;

  // find last user message
  for (let i = convo.length - 1; i >= 0; i--) {
    if (convo[i].role !== "user") continue;
    const original = convo[i].content;
    const textPart =
      typeof original === "string"
        ? original
        : Array.isArray(original)
          ? original
              .filter((p: any) => p?.type === "text")
              .map((p: any) => p.text)
              .join("\n")
          : "";

    const parts: any[] = [];
    if (textPart) parts.push({ type: "text", text: textPart });
    for (const ip of loaded.imageParts) parts.push(ip);

    convo[i] = {
      ...convo[i],
      content: parts.length > 1 ? parts : textPart,
    };
    break;
  }

  if (loaded.textBlocks.length > 0) {
    convo.splice(1, 0, {
      role: "system",
      content:
        "The user attached the following files. Use them as context for your answer:\n\n" +
        loaded.textBlocks.join("\n\n---\n\n"),
    });
  }
}
