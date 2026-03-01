import { useState, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, Target, Library, Calendar } from "lucide-react";
import { BannerCarousel } from "@/components/BannerCarousel";
import { MyCoursesTab } from "@/components/learning/MyCoursesTab";
import { TracksTab } from "@/components/learning/TracksTab";
import { CoursesTab } from "@/components/learning/CoursesTab";
import { EventsTab } from "@/components/learning/EventsTab";
import { Skeleton } from "@/components/ui/skeleton";

const CompetitionDetail = lazy(() => import("@/pages/app/CompetitionDetail"));
const AppCourseDetail = lazy(() => import("@/pages/app/AppCourseDetail"));

type TabKey = "my-courses" | "tracks" | "courses" | "events";

type DetailView = { type: "competition" | "course"; slug: string } | null;

const tabs: { key: TabKey; icon: React.ElementType; label: string }[] = [
  { key: "my-courses", icon: BookOpen, label: "My Courses" },
  { key: "tracks", icon: Target, label: "Tracks" },
  { key: "courses", icon: Library, label: "All Courses" },
  { key: "events", icon: Calendar, label: "Events" },
];

export default function LearningHub() {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) || "my-courses";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [detailView, setDetailView] = useState<DetailView>(null);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setDetailView(null);
  };

  const DetailFallback = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-2 space-y-2 pb-32">
      {/* Banner Carousel */}
      <BannerCarousel placement="learning" />

      {/* Tab Selector - icon strip */}
      <div className="bg-card rounded-xl p-3 shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key && !detailView;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
              >
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                </div>
                <span
                  className={`text-[10px] text-center leading-tight transition-colors ${
                    isActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content or Detail View */}
      {detailView ? (
        <Suspense fallback={<DetailFallback />}>
          {detailView.type === "competition" ? (
            <CompetitionDetail
              inlineSlug={detailView.slug}
              onBack={() => setDetailView(null)}
            />
          ) : (
            <AppCourseDetail
              inlineSlug={detailView.slug}
              onBack={() => setDetailView(null)}
            />
          )}
        </Suspense>
      ) : (
        <>
          {activeTab === "my-courses" && <MyCoursesTab onBrowseCatalog={() => handleTabChange("courses")} />}
          {activeTab === "tracks" && <TracksTab />}
          {activeTab === "courses" && (
            <CoursesTab
              onOpenCourse={(slug) => setDetailView({ type: "course", slug })}
            />
          )}
          {activeTab === "events" && (
            <EventsTab
              onOpenCompetition={(slug) => setDetailView({ type: "competition", slug })}
            />
          )}
        </>
      )}
    </div>
  );
}
