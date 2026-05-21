/**
 * Admin generic CRUD repository (Phase 10j.3).
 *
 * Backs the SimpleAdminRegistry component, which provides a generic list/add/delete
 * surface over arbitrary admin tables. Centralizes the raw `supabase.from(...)`
 * calls so the platform layer can stay free of direct Supabase access.
 */
import { supabase } from "@/integrations/supabase/client";

export async function listAdminTableRows(table: string): Promise<any[]> {
  const { data, error } = await supabase
    .from(table as any)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function insertAdminTableRow(
  table: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { error } = await (supabase.from(table as any) as any).insert(payload);
  if (error) throw error;
}

export async function deleteAdminTableRow(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table as any).delete().eq("id", id);
  if (error) throw error;
}

// ─── Phase 10j.5e: role checks ─────────────────────────────────────────────
export async function userHasRole(userId: string, role: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", role as any)
    .maybeSingle();
  return !!data;
}
