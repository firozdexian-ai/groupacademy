import { supabase } from "@/integrations/supabase/client";

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
  const { data, error } = await supabase.functions.invoke("admin-content-ai", {
    body: { mode, context },
  });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return (data as any).result as T;
}
