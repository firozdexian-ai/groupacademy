import { useHype } from "@/hooks/useHype";

export type HypeContentType = "post" | "course" | "video" | "blog";

/** Back-compat wrapper: old signature was useContentHype(type, id, initialCount). */
export function useContentHype(contentType: HypeContentType, contentId: string, initialCount: number = 0) {
  return useHype(contentId, contentType, initialCount);
}
