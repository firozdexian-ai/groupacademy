import { ReactNode, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  list: ReactNode;
  detail: ReactNode;
  context?: ReactNode;
  /** When true, show the detail pane on mobile (otherwise show the list). */
  showDetailOnMobile?: boolean;
  onBack?: () => void;
  className?: string;
}

/**
 * Desktop: list | detail | context (3 columns).
 * Tablet: list | detail (context as collapsible drawer-like column).
 * Mobile: stacked — show list OR detail based on `showDetailOnMobile`.
 */
export function ThreePaneLayout({
  list,
  detail,
  context,
  showDetailOnMobile,
  onBack,
  className,
}: Props) {
  const [contextOpen, setContextOpen] = useState(true);

  return (
    <div
      className={cn(
        "flex w-full h-[calc(100dvh-56px)] min-h-0 overflow-hidden",
        className,
      )}
    >
      {/* List */}
      <aside
        className={cn(
          "w-full lg:w-[340px] xl:w-[380px] shrink-0 border-r border-white/5 bg-[#0B1220]/60 overflow-y-auto",
          showDetailOnMobile && "hidden lg:block",
        )}
      >
        {list}
      </aside>

      {/* Detail */}
      <section
        className={cn(
          "flex-1 min-w-0 overflow-y-auto",
          !showDetailOnMobile && "hidden lg:block",
        )}
      >
        {showDetailOnMobile && onBack && (
          <button
            onClick={onBack}
            className="lg:hidden flex items-center gap-1 text-sm text-slate-300 px-3 py-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}
        {detail}
      </section>

      {/* Context */}
      {context && (
        <aside
          className={cn(
            "hidden xl:block shrink-0 border-l border-white/5 bg-[#0B1220]/40 overflow-y-auto transition-all",
            contextOpen ? "w-[340px]" : "w-[40px]",
          )}
        >
          <div className="flex justify-end p-2">
            <button
              onClick={() => setContextOpen((v) => !v)}
              className="text-xs text-slate-400 hover:text-white"
              aria-label="Toggle context"
            >
              {contextOpen ? "Hide" : "Show"}
            </button>
          </div>
          {contextOpen && <div className="px-3 pb-6">{context}</div>}
        </aside>
      )}
    </div>
  );
}
