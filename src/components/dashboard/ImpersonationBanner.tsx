/**
 * Sticky banner shown at the top of `/admin` when a super_admin or internal
 * staffer is acting on behalf of a company. Click "Exit" to drop the override.
 */
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { X, Building2 } from "lucide-react";

export function ImpersonationBanner() {
  const { actingCompanyId, actingCompanyName, stopActing } = useImpersonation();
  if (!actingCompanyId) return null;

  return (
    <div className="sticky top-0 z-50 bg-amber-500/15 border-b border-amber-500/40 text-amber-900 dark:text-amber-200 px-3 py-1.5 text-xs flex items-center gap-2">
      <Building2 className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">
        Acting as <strong>{actingCompanyName ?? "company"}</strong> — all changes affect their workspace.
      </span>
      <button
        type="button"
        onClick={stopActing}
        className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 font-medium"
      >
        <X className="h-3 w-3" /> Exit
      </button>
    </div>
  );
}
