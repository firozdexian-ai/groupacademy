/**
 * Auth boundary helpers.
 *
 * These wrap `supabase.auth.*` so application code (hooks, repos, components)
 * never imports the Supabase client directly for read-only identity checks.
 *
 * Mutation flows (signIn, signUp, signInWithOAuth, onAuthStateChange,
 * password reset, password update) stay in `src/hooks/useAuth.ts` and the
 * dedicated auth pages — those are the only legitimate places to touch
 * session state imperatively.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

/** Get the currently authenticated user (or null). */
export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

/** Get the current session (or null). */
export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session ?? null;
}

/** Convenience: get the current access token (or null). */
export async function getAccessToken(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.access_token ?? null;
}

/** Convenience: get the current user id (or null). */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

/** Sign the user out (local scope). Prefer `useAuth().signOut` in components. */
export async function signOutLocal(): Promise<void> {
  await supabase.auth.signOut({ scope: "local" });
}
