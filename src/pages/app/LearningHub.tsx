import * as React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { BookOpen, Target, Library, Globe, Bell, Loader2 } from "lucide-react";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { MyCoursesTab } from "@/components/learning/MyCoursesTab";
import { TracksTab } from "@/components/learning/TracksTab";
import { CoursesTab } from "@/components/learning/CoursesTab";
import { StudyAbroadSection } from "@/components/learning/StudyAbroadSection";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const CompetitionDetail = React.lazy(() => import("@/pages/app/CompetitionDetail"));
const AppCourseDetail = React.lazy(() => import("@/pages/app/AppCourseDetail"));

type TabKey = "my-courses" | "tracks" | "academy" | "study-abroad";
interface DetailView {
  type: "competition" | "course";
  slug: string;
}

interface TabConfig {
  key: TabKey;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const TABS_DIRECTORY: TabConfig[] = [
  { key: "my-courses", icon: BookOpen, label: "My Hub" },
  { key: "tracks", icon: Target, label: "Career Path" },
  { key: "academy", icon: Library, label: "Academy" },
  { key: "study-abroad", icon: Globe, label: "Study Abroad" },
];

/**
 * GroUp Academy: Authoritative Academic Workspace Shell Controller (LearningHub)
 * Hardened responsive dashboard preventing sync navigation cascades and sealing recursive route processing loops.
 * Version: Launch Candidate · Phase Z1 State Loop Sealed
 */
export default function LearningHub() {
  const [urlSearchParamsMap, setUrlSearchParamsMap] = useSearchParams();

  // =========================================================================
  // STATE SECTOR 1: INITIAL METADATA AND CONTRACT RECONCILIATION
  // =========================================================================
  const resolvedFallbackTabKey = React.useMemo<TabKey>(() => {
    const rawTabParameterStr = urlSearchParamsMap.get("tab");
    if (rawTabParameterStr === "events" || rawTabParameterStr === "courses") {
      return "academy"; // Preserve semantic back-compat routes safely
    }
    if (rawTabParameterStr && TABS_DIRECTORY.some((tabItem) => tabItem.key === rawTabParameterStr)) {
      return rawTabParameterStr as TabKey;
    }
    return "my-courses";
  }, [urlSearchParamsMap]);

  const [activeTabState, setActiveTabState] = React.useState<TabKey>(
    resolvedActiveTabFromUrlStateCompute(urlSearchParamsMap),
  );
  const [activeDetailViewRecord, setActiveDetailViewRecord] = React.useState<DetailView | null>(null);

  const { data: reviewQueueResponseData } = useReviewQueue({ limit: 50, itemsPerTopic: 1 });
  const computedTotalDueReviewsCount = reviewQueueResponseData?.total_due ?? 0;

  // Sync internal state with external URL updates only when a change originates outside this view
  React.useEffect(() => {
    setActiveTabState(resolvedFallbackTabKey);
  }, [resolvedFallbackTabKey]);

  // =========================================================================
  // LIFECYCLE SECTOR 2: FIRE-AND-FORGET BACKGROUND SYSTEM TELEMETRY
  // =========================================================================
  React.useEffect(() => {
    let isTelemetryThreadActive = true;

    const dispatchDailyReviewNudgeSignal = async () => {
      try {
        await supabase.functions.invoke("notify-review-due");
      } catch (suppressedPipelineException) {
        // Shield render passing lanes from uninsulated analytical interruptions
      }
    };

    dispatchDailyReviewNudgeSignal();

    return () => {
      isTelemetryThreadActive = false;
    };
  }, []);

  // =========================================================================
  // ACTION HOOKS: USER INTERACTION NAVIGATION SEGMENTS
  // =========================================================================
  const handleTabChangeSequence = React.useCallback(
    (targetTabKeyStr: TabKey) => {
      setActiveTabState(targetTabKeyStr);
      setActiveDetailViewRecord(null);

      // Commit discrete synchronization hooks safely to shield panels from loops
      setUrlSearchParamsMap({ tab: targetTabKeyStr }, { replace: true });

      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (fallbackLegacyBehavior) {
        window.scrollTo(0, 0);
      }
    },
    [setUrlSearchParamsMap],
  );

  const handleOpenCourseSequence = React.useCallback((slugString: string) => {
    setActiveDetailViewRecord({ type: "course", slug: slugString });
  }, []);

  const handleOpenCompetitionSequence = React.useCallback((slugString: string) => {
    setActiveDetailViewRecord({ type: "competition", slug: slugString });
  }, []);

  const handleReturnToRosterView = React.useCallback(() => {
    setActiveDetailViewRecord(null);
  }, []);

  const handleBrowseCatalogFallbackTrigger = React.useCallback(() => {
    handleTabChangeSequence("academy");
  }, [handleTabChangeSequence]);

  // =========================================================================
  // FALLBACK SECTORS: LOADING PLACEHOLDER STRUCTS
  // =========================================================================
  const DetailedPanelFallbackLayout = () => (
    <div className="space-y-4 py-3 block w-full text-left leading-none shrink-0 select-none pointer-events-none">
      <Skeleton className="h-8 w-32 rounded-lg block" />
      <Skeleton className="h-44 w-full rounded-xl block aspect-video sm:aspect-auto" />
      <div className="space-y-2 block w-full">
        <Skeleton className="h-3.5 w-full rounded-xs block" />
        <Skeleton className="h-3.5 w-2/3 rounded-xs block" />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-3 py-4 pb-28 space-y-4 text-left antialiased block transform-gpu w-full">
      {/* HUD LEVEL 1: NAVIGATION AND STATISTICAL METADATA HEAD */}
      {!activeDetailViewRecord && (
        <div className="space-y-4 block w-full shrink-0">
          <header className="px-1 flex items-start justify-between gap-3 leading-none w-full select-none">
            <div className="leading-none space-y-1 block">
              <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-foreground leading-none pt-0.5">
                Academic Operations Hub
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 leading-none block">
                Access interactive validation courses, dynamic tracks, and structural global deployment roadmaps.
              </p>
            </div>

            {computedTotalDueReviewsCount > 0 && (
              <Link
                to="/app/learning/review"
                aria-label={`${computedTotalDueReviewsCount.toString()} academic evaluations due`}
                className="h-6 px-2.5 rounded-full inline-flex items-center gap-1.5 border border-primary/20 bg-primary/5 text-primary text-[10px] font-mono font-extrabold uppercase tracking-wide transition-colors hover:bg-primary/10 shrink-0 pointer-events-auto shadow-2xs leading-none"
              >
                <Bell className="h-3 w-3 stroke-[2.5]" />
                <span className="pt-0.5 tabular-nums">{computedTotalDueReviewsCount.toString()} Due</span>
              </Link>
            )}
          </header>

          {/* HUD LEVEL 2: COMPOSITE SEGMENT TOGGLE ROUTER TRACK */}
          <nav
            className="flex p-1 h-11 bg-muted/40 rounded-xl border border-border/50 sticky top-14 z-30 select-none pointer-events-auto w-full block shrink-0 backdrop-blur-md gap-1"
            aria-label="Academic Workspace Section Controls"
          >
            {TABS_DIRECTORY.map((tabNodeItem) => {
              const TabIconAssetNode = tabNodeItem.icon;
              const isTabActive = activeTabState === tabNodeItem.key;
              const isReviewBadgeVisible = tabNodeItem.key === "my-courses" && computedTotalDueReviewsCount > 0;

              return (
                <button
                  key={`learning-hub-tab-node-${tabNodeItem.key}`}
                  type="button"
                  onClick={() => handleTabChangeSequence(tabNodeItem.key)}
                  className={cn(
                    "relative flex-1 flex items-center justify-center gap-1.5 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-all cursor-pointer outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring pt-0.5 shadow-none border border-transparent leading-none h-full",
                    isTabActive
                      ? "bg-background border-border/10 text-foreground font-extrabold shadow-2xs"
                      : "text-muted-foreground/70 hover:text-foreground hover:bg-background/20",
                  )}
                >
                  <TabIconAssetNode className="h-3.5 w-3.5 stroke-[2.2] shrink-0" />
                  <span className="hidden sm:inline-block">{tabNodeItem.label}</span>

                  {isReviewBadgeVisible && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded bg-primary text-primary-foreground text-[9px] font-mono font-black flex items-center justify-center shadow-xs select-none pointer-events-none leading-none tabular-nums">
                      {computedTotalDueReviewsCount > 9 ? "9+" : computedTotalDueReviewsCount.toString()}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* HUD LEVEL 3: DYNAMIC ASSIGNMENT LEDGER VIEWPORT DISPLAY */}
      <main className="min-h-[50vh] block w-full">
        {activeDetailViewRecord ? (
          <React.Suspense fallback={<DetailedPanelFallbackLayout />}>
            <div className="animate-in fade-in duration-150 block w-full transform-gpu">
              {activeDetailViewRecord.type === "competition" ? (
                <CompetitionDetail inlineSlug={activeDetailViewRecord.slug} onBack={handleReturnToRosterView} />
              ) : (
                <AppCourseDetail inlineSlug={activeDetailViewRecord.slug} onBack={handleReturnToRosterView} />
              )}
            </div>
          </React.Suspense>
        ) : (
          <div className="animate-in fade-in duration-100 block w-full transform-gpu">
            {activeTabState === "my-courses" && <MyCoursesTab onBrowseCatalog={handleBrowseCatalogFallbackTrigger} />}
            {activeTabState === "tracks" && <TracksTab />}
            {activeTabState === "academy" && (
              <CoursesTab onOpenCourse={handleOpenCourseSequence} onOpenCompetition={handleOpenCompetitionSequence} />
            )}
            {activeTabState === "study-abroad" && <StudyAbroadSection />}
          </div>
        )}
      </main>
    </div>
  );
}

// Decentralized parsing filter utility shielding root frame initialization from lifecycle state cascades
function resolvedActiveTabFromUrlStateCompute(searchParamsInstance: URLSearchParams): TabKey {
  const extractedRawQueryTabString = searchParamsInstance.get("tab");
  if (extractedRawQueryTabString === "events" || extractedRawQueryTabString === "courses") {
    return "academy";
  }
  if (extractedRawQueryTabString && TABS_DIRECTORY.some((tabItem) => tabItem.key === extractedRawQueryTabString)) {
    return extractedRawQueryTabString as TabKey;
  }
  return "my-courses";
}
