/**
 * Account-type-aware post-auth routing.
 * Used by Index, Auth pages, and CompanySignup so each user type lands in
 * the right surface (talent feed, company workspace, or admin dashboard).
 */
export type AccountType = "company" | "admin" | "talent" | "unknown";

export const DEFAULT_ROUTE_BY_TYPE: Record<AccountType, string> = {
  company: "/company",
  admin: "/dashboard",
  talent: "/app/feed",
  unknown: "/app/feed",
};

export function getDefaultRouteFor(type: AccountType): string {
  return DEFAULT_ROUTE_BY_TYPE[type] ?? "/app/feed";
}

/**
 * Pick the safest landing route. Honors `returnTo` when present and not an
 * auth page; otherwise falls back to the account-type default.
 */
export function resolvePostAuthRoute(
  type: AccountType,
  returnTo?: string | null,
): string | null {
  if (returnTo && !returnTo.includes("/auth")) return returnTo;
  // Don't guess while account type is still resolving — caller should wait.
  if (type === "unknown") return null;
  return getDefaultRouteFor(type);
}
