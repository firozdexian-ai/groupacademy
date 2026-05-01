import { useState, lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, Target, Library, Calendar } from "lucide-react";
import { BannerCarousel } from "@/components/BannerCarousel";
import { MyCoursesTab } from "@/components/learning/MyCoursesTab";
import { TracksTab } from "@/components/learning/TracksTab";
import { CoursesTab } from "@/components/learning/CoursesTab";
import { EventsTab } from "@/components/learning/EventsTab";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Learning Hub — compact mobile-first shell.
 * Tabs: My Hub · Career Path · Academy · Arena
 */

const CompetitionDetail = lazy(() => import("@/pages/app/CompetitionDetail"));
const AppCourseDetail = lazy(() => import("@/pages/app/AppCourseDetail"));

type TabKey = "my-courses" | "tracks" | "courses" | "events";
type DetailView = { type: "competition" | "course"; slug: string } | null;

const tabs: { key: TabKey; icon: any; label: string }[] = [
  { key: "my-courses", icon: BookOpen, label: "My Hub" },
  { key: "tracks", icon: Target, label: "Career Path" },
  { key: "courses", icon: Library, label: "Academy" },
  { key: "events", icon: Calendar, label: "Arena" },
];

export default function LearningHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) || "my-courses";

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [detailView, setDetailView] = useState<DetailView>(null);

  useEffect(() => {
    if (!detailView) {
      const params: Record<string, string> = { tab: activeTab };
      const kind = searchParams.get("kind");
      if (kind && activeTab === "events") params.kind = kind;
      setSearchParams(params, { replace: true });
    }
  }, [activeTab, detailView, setSearchParams, searchParams]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setDetailView(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const DetailFallback = () => (
    <div className="space-y-4 py-3 animate-pulse">
      <Skeleton className="h-8 w-32 rounded-lg" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-3 py-3 pb-28 space-y-4 animate-in fade-in duration-300">
      {!detailView && (
        <>
          <header className="px-1">
            <h1 className="text-xl font-bold leading-tight">Academy</h1>
            <p className="text-xs text-muted-foreground">Courses, career paths, events and study abroad.</p>
          </header>

          <div className="rounded-2xl overflow-hidden border border-border/40">
            <BannerCarousel placement="learning" />
          </div>

          <nav className="flex p-1 h-12 bg-muted/50 rounded-xl border border-border/50 sticky top-14 z-30">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-all",
                    isActive
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </>
      )}

      <main className="min-h-[60vh]">
        {detailView ? (
          <Suspense fallback={<DetailFallback />}>
            <div className="animate-in slide-in-from-bottom-4 duration-300">
              {detailView.type === "competition" ? (
                <CompetitionDetail inlineSlug={detailView.slug} onBack={() => setDetailView(null)} />
              ) : (
                <AppCourseDetail inlineSlug={detailView.slug} onBack={() => setDetailView(null)} />
              )}
            </div>
          </Suspense>
        ) : (
          <div className="animate-in fade-in duration-300">
            {activeTab === "my-courses" && <MyCoursesTab onBrowseCatalog={() => handleTabChange("courses")} />}
            {activeTab === "tracks" && <TracksTab />}
            {activeTab === "courses" && <CoursesTab onOpenCourse={(slug) => setDetailView({ type: "course", slug })} />}
            {activeTab === "events" && (
              <EventsTab onOpenCompetition={(slug) => setDetailView({ type: "competition", slug })} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
