import { adminContentAi } from "@/domains/ugc/api/ugcApi";

export type AIMode = "description" | "slug" | "image_prompt" | "outline" | "cover_image";

export interface AIContext {
  title?: string;
  description?: string;
  content_type?: string;
  profession?: string;
  level?: string;
  cover_prompt?: string;
}

export async function callContentAI<T = any>(mode: AIMode, context: AIContext): Promise<T> {
  const data: any = await adminContentAi({ mode, context: context as unknown as Record<string, unknown> });
  if (data?.error) throw new Error(data.error);
  return data.result as T;
}
