/**
 * Validate a `returnTo` query parameter so it can only redirect to a
 * same-origin in-app path. Rejects anything that could be interpreted as a
 * protocol-relative URL (`//evil.com`), an absolute URL, or a non-path value.
 * Returns `null` when the input is unsafe — callers should fall back to a
 * sensible default in that case.
 */
export function safeReturnTo(raw?: string | null): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  // Must be a path starting with a single "/" — reject "//evil.com",
  // "http://...", "javascript:...", relative paths, etc.
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.startsWith("/\\")) return null;
  return value;
}
