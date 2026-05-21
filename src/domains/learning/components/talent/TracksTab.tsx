import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listAcademiesSchoolsReadiness } from "@/domains/learning/repo/learningRepo";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError, trackEvent } from "@/lib/errorTracking";
import {
  Building2,
  Laptop,
  Rocket,
  Megaphone,
  GraduationCap,
  ChevronRight,
  Target,
  Search,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getIcon } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

type Category = "my-program" | "executive" | "freelancing" | "entrepreneurship" | "influencing";

const CATEGORY_CONFIG: { key: Category; icon: any; label: string }[] = [
  { key: "my-program", icon: Target, label: "Mine" },
  { key: "executive", icon: Building2, label: "Executive" },
  { key: "freelancing", icon: Laptop, label: "Freelance" },
  { key: "entrepreneurship", icon: Rocket, label: "Startup" },
  { key: "influencing", icon: Megaphone, label: "Influence" },
];

interface SchoolReadiness {
  school_id: string;
  total_courses: number;
  ready_courses: number;
  pct_ready: number;
  is_ready: boolean;
}

/**
 * GroUp Academy: Academy Track Specialization Matrix (TracksTab)
 * An authoritative dashboard node separating enterprise tracks, start-up streams, and personal learning pipelines.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function TracksTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<Category>("my-program");
  const [academies, setAcademies] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<Record<string, SchoolReadiness>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Monitor comprehensive track hub category selections via analytical tracking pipelines
  useEffect(() => {
    trackEvent("academy_tracks_tab_mounted", { activeCategorySegment: selectedCategory });
  }, [selectedCategory]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadEcosystemAcademyTracks = async () => {
      try {
        const { data: userData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        const authenticatedUserId = userData?.user?.id;

        // Concurrent Ingress: Resolve baseline structures in a single batch transaction pass
        const { academies: academiesData, schools: schoolsData, readiness: readinessData } =
          await listAcademiesSchoolsReadiness();

        const mappedReadinessBuffer: Record<string, SchoolReadiness> = {};
        readinessData.forEach((rowItem: any) => {
          if (rowItem?.school_id) mappedReadinessBuffer[rowItem.school_id] = rowItem;
        });


        let synchronizedEnrollments: any[] = [];

        if (authenticatedUserId) {
          const { data: talentProfile, error: talentError } = await supabase
            .from("talents")
            .select("id")
            .eq("user_id", authenticatedUserId)
            .maybeSingle();

          if (talentError) throw talentError;

          if (talentProfile?.id) {
            const { data: enrollmentRows, error: enrollmentError } = await supabase
              .from("enrollments")
              .select("id, progress, status, content:content_id(title)")
              .eq("talent_id", talentProfile.id)
              .order("created_at", { ascending: false });

            if (enrollmentError) throw enrollmentError;
            synchronizedEnrollments = enrollmentRows || [];
          }
        }

        // 1. Component-Lifetime Safety Lock Check: Freeze updates if workspace teardown completes mid-flight
        if (isMounted) {
          setAcademies(academiesData || []);
          setSchools(schoolsData || []);

          setReadiness(mappedReadinessBuffer);
          setEnrollments(synchronizedEnrollments);
          setIsLoading(false);

          trackEvent("academy_tracks_tab_data_hydrated_success");
        }
      } catch (err: any) {
        const exceptionMsg = err instanceof Error ? err.message : String(err);

        trackError(exceptionMsg, {
          component: "TracksTab",
          action: "load_ecosystem_academy_tracks_api",
        });

        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadEcosystemAcademyTracks();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTrackNavigationRedirect = async (urlDestinationPathStr: string, actionIdentifierId: string) => {
    if (!urlDestinationPathStr) return;
    trackEvent("academy_tracks_navigation_triggered", {
      actionId: actionIdentifierId,
      targetUrl: urlDestinationPathStr,
    });

    try {
      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      navigate(urlDestinationPathStr);
    } catch (err) {
      trackError(err, {
        component: "TracksTab",
        action: "execute_track_navigation_callback",
        targetUrl: urlDestinationPathStr,
      });
    }
  };

  const renderMyProgram = () => {
    const activeEnrollmentsCollection = enrollments.filter((e) => e.status !== "completed");
    const completedEnrollmentsCollection = enrollments.filter((e) => e.status === "completed");

    return (
      <div className="space-y-4 w-full text-left min-w-0 animate-in fade-in duration-300">
        {/* SUB-SECTOR A1: ACTIVE IN-PROGRESS LEARNING MODULES */}
        {activeEnrollmentsCollection.length > 0 && (
          <section className="space-y-2.5 w-full min-w-0">
            <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider pl-0.5 select-none leading-none">
              Curriculums In Progress Optimization
            </h3>
            <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 w-full">
              {activeEnrollmentsCollection.map((enrollmentItem) => {
                if (!enrollmentItem || !enrollmentItem.id) return null;
                const progressValueNumber = Math.round(Number(enrollmentItem.progress || 0));

                return (
                  <Card
                    key={enrollmentItem.id}
                   
                    className="group relative cursor-pointer rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm select-none sm:select-text text-left w-full min-w-0 flex flex-col overflow-hidden transition-all duration-300 transform-gpu hover:border-primary/20 hover:bg-card/80 outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onClick={() =>
                      handleTrackNavigationRedirect(
                        "/app/learning?tab=my-courses",
                        `active_program_row_${enrollmentItem.id}`,
                      )
                    }
                  >
                    <CardContent className="p-3.5 flex items-start gap-3.5 w-full min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-102 transition-transform">
                        <GraduationCap className="h-5 w-5 text-primary stroke-[2.2]" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2 text-left flex flex-col justify-center leading-none">
                        <p className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-tight line-clamp-1 truncate select-text w-full group-hover:text-primary transition-colors pr-1">
                          {enrollmentItem.content?.title || "Specialized Core Track"}
                        </p>
                        <div className="space-y-1.5 w-full tabular-nums text-[10px] font-bold text-primary select-none">
                          <div className="flex items-center justify-between text-muted-foreground/80 font-semibold mb-0.5 leading-none tracking-tight">
                            <span>Trajectory Sync</span>
                            <span className="font-extrabold italic text-primary">{progressValueNumber}%</span>
                          </div>
                          <Progress
                            value={progressValueNumber}
                            className="h-1.5 rounded-full bg-primary/10 shadow-inner"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* SUB-SECTOR A2: COMPLETED SUCCESSFULLY GRADUATED CHECKS */}
        {completedEnrollmentsCollection.length > 0 && (
          <section className="space-y-2.5 w-full min-w-0">
            <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider pl-0.5 select-none leading-none">
              Verified Completed Trajectories
            </h3>
            <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 w-full">
              {completedEnrollmentsCollection.map((enrollmentItem) => {
                if (!enrollmentItem || !enrollmentItem.id) return null;
                return (
                  <Card
                    key={enrollmentItem.id}
                   
                    className="group relative cursor-pointer rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.001] text-left shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring w-full overflow-hidden transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/5 flex items-center"
                    onClick={() =>
                      handleTrackNavigationRedirect(
                        "/app/learning?tab=my-courses",
                        `completed_program_row_${enrollmentItem.id}`,
                      )
                    }
                  >
                    <CardContent className="p-3.5 flex items-center justify-between gap-4 w-full min-w-0">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1 text-left">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/5 flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-2 transition-transform">
                          <GraduationCap className="h-5 w-5 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1 flex flex-col justify-center leading-none">
                          <p className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-tight truncate text-ellipsis select-all pr-1">
                            {enrollmentItem.content?.title}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none w-fit leading-none shadow-sm mt-0.5 select-none"
                          >
                            Verified Framework
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-emerald-600/40 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all stroke-[2.5] shrink-0 select-none" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* COLD-START TIMELINE MATRIX EMPTY FALLBACK GRID */}
        {enrollments.length === 0 && (
          <div className="py-12 text-center border border-dashed border-border/60 bg-card/40 backdrop-blur-md rounded-2xl p-4 select-none w-full max-w-md mx-auto flex flex-col justify-center items-center animate-in fade-in duration-300">
            <GraduationCap className="h-6 w-6 text-primary/40 mb-3 animate-pulse stroke-[2.2]" />
            <h3 className="text-sm font-bold text-foreground/90 uppercase tracking-wide leading-none">
              Active Folders Pipeline Vacant
            </h3>
            <p className="text-[11px] font-semibold text-muted-foreground/70 max-w-xs mx-auto leading-normal mt-1.5 mb-4 italic">
              No active professional programs or specialized tracks registered inside your collection yet.
            </p>
            <Button
              size="sm"
             
              onClick={() => {
                trackEvent("academy_tracks_cold_start_browse_catalog_clicked");
                setSelectedCategory("executive");
              }}
              className="h-8 rounded-xl text-[10px] font-extrabold uppercase tracking-wide px-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Search className="h-3.5 w-3.5 text-primary-foreground shrink-0 stroke-[2.5]" />
              <span>Launch Directory Catalog</span>
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderAcademy = (cat: Category) => {
    const targetAcademyPayloadNode = academies.find((a) => a.academy_type === cat);
    if (!targetAcademyPayloadNode) {
      return (
        <div className="py-12 text-center border border-dashed border-border/40 bg-card/40 backdrop-blur-md rounded-2xl p-4 select-none w-full max-w-sm mx-auto flex flex-col justify-center items-center animate-in fade-in duration-300">
          <Loader2 className="h-5 w-5 text-primary/30 animate-spin mb-2 stroke-[2.5]" />
          <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider leading-none pl-0.5">
            Specialized Academy Core Hardening…
          </p>
          <p className="text-[10px] font-semibold text-muted-foreground/50 leading-normal italic mt-1.5">
            Horizon parameter allocation running bounds lock.
          </p>
        </div>
      );
    }

    const academySchoolsCollectionList = schools.filter((s) => s.academy_id === targetAcademyPayloadNode.id);

    return (
      <div className="space-y-3.5 w-full text-left min-w-0 animate-in fade-in duration-300">
        <div className="px-0.5 select-none w-full text-left leading-none">
          <h2 className="text-xs font-extrabold text-foreground/80 uppercase tracking-wider leading-none mb-1">
            {targetAcademyPayloadNode.name}
          </h2>
          {targetAcademyPayloadNode.description && (
            <p className="text-[11px] font-semibold text-muted-foreground/70 tracking-tight italic select-text pr-1">
              {targetAcademyPayloadNode.description}
            </p>
          )}
        </div>

        {academySchoolsCollectionList.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-border/40 bg-card/40 backdrop-blur-md rounded-2xl p-4 select-none w-full max-w-sm mx-auto flex flex-col justify-center items-center">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 leading-none">
              Sub-School Directories Staged Empty
            </p>
          </div>
        ) : (
          <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 w-full">
            {academySchoolsCollectionList.map((schoolItem) => {
              if (!schoolItem || !schoolItem.id) return null;

              const SchoolIcon = getIcon(schoolItem.icon);
              const readinessModelNode = readiness[schoolItem.id];

              const totalCoursesValueCount = readinessModelNode?.total_courses ?? 0;
              const readyCoursesValueCount = readinessModelNode?.ready_courses ?? 0;
              const readinessPercentageInt = readinessModelNode?.pct_ready ?? 0;

              return (
                <Card
                  key={schoolItem.id}
                 
                  className="group relative cursor-pointer rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring w-full overflow-hidden transition-all duration-300 transform-gpu hover:border-primary/20 hover:bg-card/80 flex flex-col justify-between text-left"
                  onClick={() =>
                    handleTrackNavigationRedirect(
                      `/app/learning/tracks/school/${schoolItem.slug}`,
                      `school_card_hub_${schoolItem.id}`,
                    )
                  }
                >
                  <CardContent className="p-3.5 space-y-3 w-full min-w-0 flex-1 flex flex-col justify-between">
                    <div className="flex items-center gap-3.5 w-full min-w-0 text-left">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-2 transition-transform">
                        <SchoolIcon className="h-5 w-5 text-primary stroke-[2.2]" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1 text-left flex flex-col justify-center leading-none">
                        <p className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-tight truncate text-ellipsis pr-1 group-hover:text-primary transition-colors select-text">
                          {schoolItem.name}
                        </p>
                        <p className="text-[11px] font-semibold text-muted-foreground/70 line-clamp-1 truncate text-ellipsis mt-0.5 break-words select-text pr-1">
                          {schoolItem.description || "No strategic summary overview details."}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all stroke-[2.5] shrink-0 select-none" />
                    </div>

                    {totalCoursesValueCount > 0 && (
                      <div className="space-y-2 w-full pt-1.5 mt-auto select-none font-bold text-[10px] text-muted-foreground/70 leading-none tabular-nums border-t border-border/5">
                        <div className="flex items-center justify-between leading-none tracking-tight mb-0.5 font-semibold text-muted-foreground/80">
                          <span>
                            {readyCoursesValueCount} / {totalCoursesValueCount} modular branches active
                          </span>
                          <span className="font-extrabold text-primary select-text">
                            {readinessPercentageInt}% readiness
                          </span>
                        </div>
                        <Progress
                          value={readinessPercentageInt}
                          className="h-1.5 rounded-full bg-primary/10 shadow-inner"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 select-none w-full animate-pulse">
        <Skeleton className="h-11 w-full rounded-xl opacity-60" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 w-full">
          {[1, 2, 3, 4].map((skeletonIndex) => (
            <Skeleton key={skeletonIndex} className="h-28 w-full rounded-2xl opacity-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full antialiased text-left select-none sm:select-text">
      {/* Sub-Pills Pill Navigation Ribbon Toggles Row Matrix */}
      <nav className="flex flex-wrap gap-1.5 p-1 bg-muted/30 border border-border/40 rounded-xl select-none w-full transform-gpu">
        {CATEGORY_CONFIG.map(({ key, icon: Icon, label }) => {
          const isPillActive = selectedCategory === key;
          return (
            <button
              key={key}
             
              onClick={() => setSelectedCategory(key)}
              className={cn(
                "flex-1 min-w-[60px] flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-none",
                isPillActive
                  ? "bg-background shadow-sm text-primary font-extrabold border border-border/10"
                  : "text-muted-foreground/80 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5 stroke-[2.2] shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* CORE DISPLAY BRANCH RENDERING DECISION */}
      {selectedCategory === "my-program" ? renderMyProgram() : renderAcademy(selectedCategory)}
    </div>
  );
}
