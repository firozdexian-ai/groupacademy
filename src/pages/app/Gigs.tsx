import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useGigsHubDashboard } from "@/domains/gigs";
import { InfiniteGigsList } from "@/domains/gigs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GigCard } from "@/components/gigs/GigCard";
import { MySubmissions } from "@/components/gigs/MySubmissions";
import { GigUploader, type UploadedFile } from "@/components/gigs/GigUploader";
import { GigForYouTab } from "@/components/gigs/GigForYouTab";
import { AvailabilityWidget } from "@/components/gigs/AvailabilityWidget";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Coins,
  ChevronRight,
  Send,
  Loader2,
  Briefcase,
  Activity,
  ShieldCheck,
  BookOpen,
  Zap,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface MarketplaceGigItem {
  id: string;
  title: string;
  employer_name: string | null;
  budget_amount: number;
  total_bids: number | null;
  is_featured: boolean | null;
}

interface CourseSpecs {
  id: string;
  title: string | null;
  description: string | null;
  cover_image_url: string | null;
}

interface CourseProjectItem {
  projectId: string;
  status: string;
  totalReward: number;
  course: CourseSpecs;
  subtasks: unknown[];
}

interface BidRecord {
  id: string;
  status: string;
  marketplace_gigs: {
    title: string;
    employer_name: string | null;
  } | null;
}

interface ContractRecord {
  id: string;
  status: string;
  agreed_amount: number;
  marketplace_gigs: {
    title: string;
  } | null;
}

interface GigsDashboardPayload {
  talent_id: string;
  featured: unknown[];
  submission_counts: Record<string, number>;
  course_projects: CourseProjectItem[];
  marketplace_projects: MarketplaceGigItem[];
  my_bids: BidRecord[];
  my_contracts: ContractRecord[];
}

interface TalentVerificationResponse {
  verification_status: string | null;
}

type TabVariant = "for-you" | "tasks" | "course" | "client" | "work";

const SKELETON_ROWS_ROSTER = [1, 2, 3, 4];

/**
 * GroUp Academy: Authoritative Gig Hub Center Ecosystem (Gigs)
 * Hardened transaction cockpit processing freelance subtasks, syncing AI listings, and insulating search state inputs.
 * Version: Launch Candidate · Phase Z1 Production Contract Locked
 */
export default function Gigs() {
  const navigateHook = useNavigate();
  const [searchParamsRoute, setSearchParamsRoute] = useSearchParams();
  const { talent: talentProfileRecord } = useTalent();
  const tanstackQueryClient = useQueryClient();

  // =========================================================================
  // MEMOIZED PARAMETER SECTOR: BACK-COMPAT ROUTE TRANSITION INTERCEPTORS
  // =========================================================================
  const activeTabPanelKey = React.useMemo<TabVariant>(() => {
    const rawTabQueryStr = searchParamsRoute.get("tab") || "for-you";

    if (["work", "activity"].includes(rawTabQueryStr)) return "work";
    if (["projects", "course", "courses", "course-projects"].includes(rawTabQueryStr)) return "course";
    if (["client", "marketplace", "employer"].includes(rawTabQueryStr)) return "client";
    if (["earn", "tasks", "quick"].includes(rawTabQueryStr)) return "tasks";
    if (["for-you", "foryou", "matches"].includes(rawTabQueryStr)) return "for-you";

    return "for-you";
  }, [searchParamsRoute]);

  const [textSearchInputStr, setTextSearchInputStr] = React.useState<string>("");
  const [debouncedSearchQueryStr, setDebouncedSearchQueryStr] = React.useState<string>("");
  const [verificationStatusState, setVerificationStatusState] = React.useState<string>("unverified");

  const [activeDeliverableContractId, setActiveDeliverableContractId] = React.useState<string | null>(null);
  const [textDeliverableTitleInput, setTextDeliverableTitleInput] = React.useState<string>("");
  const [textDeliverableDescInput, setTextDeliverableDescInput] = React.useState<string>("");
  const [uploadedFilesCollection, setUploadedFilesCollection] = React.useState<UploadedFile[]>([]);

  // =========================================================================
  // LIFECYCLE SECTOR 1: SEARCH DEBOUNCER & ATOMIC PROFILE SYNC
  // =========================================================================
  React.useEffect(() => {
    const filteringDebounceTimerToken = setTimeout(() => {
      setDebouncedSearchQueryStr(textSearchInputStr.trim().toLowerCase());
    }, 250);

    return () => clearTimeout(filteringDebounceTimerToken);
  }, [textSearchInputStr]);

  React.useEffect(() => {
    if (!talentProfileRecord?.id) return;

    let isThreadActive = true;
    const loadVerificationStatusCredentials = async () => {
      try {
        const { data: dbTalentRow, error: queryHandshakeError } = await supabase
          .from("talents")
          .select("verification_status")
          .eq("id", talentProfileRecord.id)
          .maybeSingle();

        if (!queryHandshakeError && dbTalentRow && isThreadActive) {
          const castRow = dbTalentRow as unknown as TalentVerificationResponse;
          setVerificationStatusState(castRow.verification_status || "unverified");
        }
      } catch (suppressedException) {
        // Suppress credential tracking anomalies safely from parent layout frames
      }
    };

    loadVerificationStatusCredentials();

    return () => {
      isThreadActive = false;
    };
  }, [talentProfileRecord?.id]);

  // Zero-latency cohesive matrix dashboard cache channel fetch hook
  const gigsDashboardQuery = useGigsHubDashboard();
  const isDashboardResolving = gigsDashboardQuery.isLoading;
  const resolvedDashboardData = gigsDashboardQuery.data as unknown as GigsDashboardPayload | undefined;

  const gigsArray = resolvedDashboardData?.featured ?? [];
  const submissionCountsMap = resolvedDashboardData?.submission_counts ?? {};
  const courseProjectsArray = resolvedDashboardData?.course_projects ?? [];
  const marketProjectsArray = resolvedDashboardData?.marketplace_projects ?? [];
  const myBidsArray = resolvedDashboardData?.my_bids ?? [];
  const myContractsArray = resolvedDashboardData?.my_contracts ?? [];

  // =========================================================================
  // TRANSACTION MUTATION LANE: SUBMISSION ROUTING COEFFICIENTS
  // =========================================================================
  const submitDeliverableMutation = useMutation({
    mutationFn: async () => {
      if (!activeDeliverableContractId) throw new Error("Contract reference channel token unassigned.");

      const primaryTargetFile = uploadedFilesCollection[0];
      const resolvedSecurePublicUrl = primaryTargetFile
        ? supabase.storage.from("gig-submissions").getPublicUrl(primaryTargetFile.path).data.publicUrl
        : null;

      const { error: insertPipelineHandshakeError } = await supabase.from("marketplace_deliverables").insert({
        contract_id: activeDeliverableContractId,
        title: textDeliverableTitleInput.trim(),
        description: textDeliverableDescInput.trim() || null,
        file_url: resolvedSecurePublicUrl,
      });

      if (insertPipelineHandshakeError) throw insertPipelineHandshakeError;
    },
    onSuccess: () => {
      toast.success("Freelance project deliverables signed and transmitted safely.");
      setActiveDeliverableContractId(null);
      setTextDeliverableTitleInput("");
      setTextDeliverableDescInput("");
      setUploadedFilesCollection([]);
      tanstackQueryClient.invalidateQueries({ queryKey: ["gigs-hub-dashboard"] });
    },
    onError: (mutationRejectionPayload: Error) => {
      toast.error(mutationRejectionPayload.message || "Failed to commit project deliverable manifest.");
    },
  });

  const handleTabSelectionTransition = React.useCallback(
    (targetTabKeyStr: string) => {
      setSearchParamsRoute({ tab: targetTabKeyStr });
      setTextSearchInputStr("");
      setDebouncedSearchQueryStr("");
    },
    [setSearchParamsRoute],
  );

  // =========================================================================
  // MEMOIZED PARAMETER SECTOR: INLINE SEARCH CORRECTIONS AND BALANCES
  // =========================================================================
  const filteredCourseProjectsList = React.useMemo<CourseProjectItem[]>(() => {
    if (!debouncedSearchQueryStr) return courseProjectsArray;
    return courseProjectsArray.filter((projectNodeItem) => {
      return projectNodeItem.course?.title?.toLowerCase().includes(debouncedSearchQueryStr);
    });
  }, [courseProjectsArray, debouncedSearchQueryStr]);

  const filteredMarketplaceProjectsList = React.useMemo<MarketplaceGigItem[]>(() => {
    if (!debouncedSearchQueryStr) return marketProjectsArray;
    return marketProjectsArray.filter((marketplaceNodeItem) => {
      return marketplaceNodeItem.title?.toLowerCase().includes(debouncedSearchQueryStr);
    });
  }, [marketProjectsArray, debouncedSearchQueryStr]);

  const handleTransitionToAICreatorWorkspace = React.useCallback(() => {
    navigateHook("/app/gigs/new");
  }, [navigateHook]);

  const handleTransitionToIdentityVerification = React.useCallback(() => {
    navigateHook("/app/profile/verify");
  }, [navigateHook]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-6 text-left antialiased block transform-gpu w-full pb-32">
      {/* HUD LEVEL 1: APPLICATION HEADER MODULE DESCRIPTION COCKPIT */}
      <header className="flex items-center justify-between gap-4 leading-none w-full shrink-0 select-none border-b border-border/5 pb-4">
        <div className="min-w-0 flex-1 leading-none space-y-1.5 block">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground leading-none m-0">
            Ecosystem Gig Hub
          </h1>
          <p className="font-mono text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tight block leading-none">
            Execute operational system parameters tasks to draw direct platform verification tokens.
          </p>
        </div>

        <button
          type="button"
          onClick={handleTransitionToIdentityVerification}
          className={cn(
            "flex items-center gap-2 px-3 h-9 rounded-lg border font-mono text-[9px] font-black uppercase tracking-wider shrink-0 transition-transform transform-gpu active:scale-95 cursor-pointer shadow-3xs pt-0.5 leading-none",
            verificationStatusState === "verified"
              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600"
              : "border-amber-500/20 bg-amber-500/5 text-amber-600",
          )}
        >
          <ShieldCheck className="h-4 w-4 stroke-[2.2]" />
          <span>{verificationStatusState === "verified" ? "Verified" : "Verify Account Ingress"}</span>
        </button>
      </header>

      <div className="block w-full select-none shrink-0 leading-none">
        <Button
          type="button"
          size="sm"
          className="w-full h-10 rounded-lg font-bold uppercase text-xs tracking-wider cursor-pointer shadow-2xs gap-1.5"
          onClick={handleTransitionToAICreatorWorkspace}
        >
          <Sparkles className="h-4 w-4 stroke-[2] fill-current text-primary-foreground shrink-0" />
          <span>Post New Custom Assignment via Copilot AI</span>
        </Button>
      </div>

      {/* HUD LEVEL 2: IMMERSIVE FIVE-WAY SEGMENT FILTER MATRIX BAR */}
      <Tabs value={activeTabPanelKey} onValueChange={handleTabSelectionTransition} className="w-full block">
        <TabsList className="grid w-full grid-cols-5 p-1 h-10 bg-muted/40 rounded-lg border border-border/10 select-none mb-6">
          <TabsTrigger
            value="for-you"
            className="rounded-md font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide h-8 cursor-pointer outline-none pt-0.5 gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 stroke-[2.2]" /> <span className="hidden sm:inline">Matched Gigs</span>
            <span className="sm:hidden">For You</span>
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="rounded-md font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide h-8 cursor-pointer outline-none pt-0.5 gap-1.5"
          >
            <Zap className="h-3.5 w-3.5 stroke-[2.2]" /> <span className="hidden sm:inline">Quick Micro Tasks</span>
            <span className="sm:hidden">Tasks</span>
          </TabsTrigger>
          <TabsTrigger
            value="course"
            className="rounded-md font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide h-8 cursor-pointer outline-none pt-0.5 gap-1.5"
          >
            <BookOpen className="h-3.5 w-3.5 stroke-[2]" /> <span>Course Bundle</span>
          </TabsTrigger>
          <TabsTrigger
            value="client"
            className="rounded-md font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide h-8 cursor-pointer outline-none pt-0.5 gap-1.5"
          >
            <Briefcase className="h-3.5 w-3.5 stroke-[2]" /> <span className="hidden sm:inline">Client Market</span>
            <span className="sm:hidden">Client</span>
          </TabsTrigger>
          <TabsTrigger
            value="work"
            className="rounded-md font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide h-8 cursor-pointer outline-none pt-0.5 gap-1.5"
          >
            <Activity className="h-3.5 w-3.5 stroke-[2]" /> <span className="hidden sm:inline">My Activity</span>
            <span className="sm:hidden">Mine</span>
          </TabsTrigger>
        </TabsList>

        {/* VIEWPORT CHANNEL A: PERSONAL MATCH TARGET METRICS */}
        <TabsContent
          value="for-you"
          className="space-y-4 focus:outline-none outline-none mt-2 block w-full animate-in fade-in duration-200"
        >
          <AvailabilityWidget />
          <GigForYouTab />
          <div className="pt-4 border-t border-border/40 block w-full leading-none">
            <h3 className="font-mono text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/50 flex items-center gap-2 mb-4 select-none pointer-events-none">
              <Briefcase className="h-4 w-4 stroke-[2.2]" /> <span>Browse System Absolute Open Vacancies Pool</span>
            </h3>
            <InfiniteGigsList talentId={resolvedDashboardData?.talent_id ?? talentProfileRecord?.id} />
          </div>
        </TabsContent>

        {/* VIEWPORT CHANNEL B: ONE-TAP MICRO GIGS CONTROLLER PANEL */}
        <TabsContent
          value="tasks"
          className="space-y-4 focus:outline-none outline-none mt-2 block w-full animate-in fade-in duration-200"
        >
          <div className="relative w-full block shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 stroke-[2.2] select-none pointer-events-none" />
            <Input
              type="search"
              placeholder="Filter quick micro tasks inventory by structural property title keyword..."
              className="w-full h-10 pl-9 pr-3 bg-background border border-border/40 text-xs sm:text-sm font-semibold rounded-lg shadow-none"
              value={textSearchInputStr}
              onChange={(e) => setTextSearchInputStr(e.target.value)}
            />
          </div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-tight text-muted-foreground/40 leading-none select-none pointer-events-none pl-0.5">
            System Index Strategy: 1-Tap Execution Assignments · Auto-Reviewed Analytics Validation Matrix · Instant
            Wallet Allocation
          </p>

          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 block w-full align-top">
            {isDashboardResolving
              ? SKELETON_ROWS_ROSTER.slice(0, 2).map((idxNum) => (
                  <Skeleton
                    key={`tasks-skeleton-card-${idxNum}`}
                    className="h-20 w-full rounded-lg bg-card/10 block shadow-none border border-transparent"
                  />
                ))
              : gigsArray
                  .filter(
                    (g: any) => !debouncedSearchQueryStr || g.title.toLowerCase().includes(debouncedSearchQueryStr),
                  )
                  .map((gigItemRow: any) => (
                    <GigCard
                      key={gigItemRow.id}
                      gig={gigItemRow}
                      userSubmissions={submissionCountsMap?.[gigItemRow.id] as any}
                    />
                  ))}
          </div>
        </TabsContent>

        {/* VIEWPORT CHANNEL C: COURSE BUNDLED BLUEPRINT OPERATIONS */}
        <TabsContent
          value="course"
          className="space-y-4 focus:outline-none outline-none mt-2 block w-full animate-in fade-in duration-200"
        >
          <div className="relative w-full block shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 stroke-[2.2] select-none pointer-events-none" />
            <Input
              type="search"
              placeholder="Filter master structural courses blueprint series by topic taxonomy title..."
              className="w-full h-10 pl-9 pr-3 bg-background border border-border/40 text-xs sm:text-sm font-semibold rounded-lg shadow-none"
              value={textSearchInputStr}
              onChange={(e) => setTextSearchInputStr(e.target.value)}
            />
          </div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-tight text-muted-foreground/40 leading-none select-none pointer-events-none pl-0.5">
            System Production Blueprint Framework: Comprehensive Curriculum Assemblies · Scaled Subtasks Distributions
            Hierarchy · High-Budgets Draw Payouts
          </p>

          <div className="space-y-2.5 block w-full align-top">
            {isDashboardResolving ? (
              SKELETON_ROWS_ROSTER.slice(0, 3).map((idxNum) => (
                <Skeleton
                  key={`courses-skeleton-card-${idxNum}`}
                  className="h-24 w-full rounded-lg bg-card/10 block shadow-none border border-transparent"
                />
              ))
            ) : filteredCourseProjectsList.length === 0 ? (
              <Card className="rounded-lg border border-dashed border-border/80 bg-muted/5 p-8 text-center select-none block w-full shadow-none pointer-events-none">
                <CardContent className="p-0 text-xs font-semibold text-muted-foreground/40 leading-normal block">
                  No open course curriculum build projects match active parameter criteria maps.
                </CardContent>
              </Card>
            ) : (
              filteredCourseProjectsList.map((projectItem) => (
                <button
                  key={`course-project-trigger-item-${projectItem.projectId}`}
                  type="button"
                  onClick={() => navigateHook(`/app/course-project/${projectItem.projectId}`)}
                  className="w-full text-left rounded-lg border border-border/60 bg-card/30 hover:border-border-foreground/10 hover:shadow-3xs transition-all p-3.5 active:scale-[0.99] cursor-pointer block leading-none"
                >
                  <div className="flex items-start gap-3.5 leading-none w-full block">
                    {projectItem.course.cover_image_url ? (
                      <div className="h-12 w-12 rounded bg-background border border-border/40 shadow-3xs overflow-hidden shrink-0 pointer-events-none select-none">
                        <img
                          src={projectItem.course.cover_image_url}
                          alt=""
                          className="w-full h-full object-cover block"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 text-primary pointer-events-none select-none shadow-3xs">
                        <BookOpen className="h-5 w-5 stroke-[2.2]" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 leading-none space-y-1.5 block">
                      <div className="flex items-center gap-1.5 flex-wrap select-none pointer-events-none leading-none">
                        <Badge className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded border border-transparent bg-primary/5 text-primary tracking-wide pt-0 leading-none shrink-0">
                          COURSE MATRIX BUNDLE
                        </Badge>
                        <Badge
                          variant="outline"
                          className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded border border-border/40 bg-background text-muted-foreground/60 tracking-wide pt-0 leading-none shrink-0 rounded-xs tabular-nums"
                        >
                          {projectItem.subtasks.length.toString()} SUBTASKS BOUND
                        </Badge>
                        <Badge
                          variant="outline"
                          className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded border border-border/40 bg-background text-muted-foreground/60 tracking-wide pt-0 leading-none shrink-0 rounded-xs uppercase"
                        >
                          {projectItem.status}
                        </Badge>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold leading-snug uppercase tracking-wide text-foreground truncate block select-text pt-0.5">
                        {projectItem.course.title}
                      </h3>
                      <div className="flex items-center gap-3 font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight select-none pointer-events-none leading-none pt-0.5 tabular-nums">
                        <span className="flex items-center gap-0.5 font-extrabold text-amber-600 shrink-0">
                          <Coins className="h-3.5 w-3.5 stroke-[2] text-amber-500" />{" "}
                          {projectItem.totalReward.toLocaleString()} Total Credits
                        </span>
                        <span className="opacity-30 block select-none shrink-0">•</span>
                        <span className="text-primary tracking-normal font-semibold">
                          Inspect Workspace Matrix to Claim Subtasks
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 stroke-[2.5] mt-2 select-none pointer-events-none shrink-0 ml-auto" />
                  </div>
                </button>
              ))
            )}
          </div>
        </TabsContent>

        {/* VIEWPORT CHANNEL D: FREELANCE CLIENT PROJECT ALLOCATIONS */}
        <TabsContent
          value="client"
          className="space-y-4 focus:outline-none outline-none mt-2 block w-full animate-in fade-in duration-200"
        >
          <div className="relative w-full block shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 stroke-[2.2] select-none pointer-events-none" />
            <Input
              type="search"
              placeholder="Filter external commercial client assignments database by contract keyword moniker..."
              className="w-full h-10 pl-9 pr-3 bg-background border border-border/40 text-xs sm:text-sm font-semibold rounded-lg shadow-none"
              value={textSearchInputStr}
              onChange={(e) => setTextSearchInputStr(e.target.value)}
            />
          </div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-tight text-muted-foreground/40 leading-none select-none pointer-events-none pl-0.5">
            Freelance Procurement Runway: Deploy Competitive Project Proposals · Negotiate Functional Execution Bounds &
            Milestones Budget Allocations
          </p>

          <div className="space-y-2.5 block w-full align-top">
            {filteredMarketplaceProjectsList.length === 0 ? (
              <Card className="rounded-lg border border-dashed border-border/80 bg-muted/5 p-8 text-center select-none block w-full shadow-none pointer-events-none">
                <CardContent className="p-0 text-xs font-semibold text-muted-foreground/40 leading-normal block">
                  No external client organizational hackathons or projects match current filter search tokens.
                </CardContent>
              </Card>
            ) : (
              filteredMarketplaceProjectsList.map((marketItemNode) => (
                <button
                  key={`marketplace-gig-row-trigger-${marketItemNode.id}`}
                  type="button"
                  onClick={() => navigateHook(`/app/marketplace/${marketItemNode.id}`)}
                  className="w-full text-left rounded-lg border border-border/60 bg-card/30 hover:border-border-foreground/10 hover:shadow-3xs transition-all p-3.5 active:scale-[0.99] cursor-pointer block leading-none"
                >
                  <div className="flex items-start gap-3.5 leading-none w-full block">
                    <div className="h-12 w-12 rounded bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 text-primary pointer-events-none select-none shadow-3xs">
                      <Briefcase className="h-5 w-5 stroke-[2.2]" />
                    </div>

                    <div className="min-w-0 flex-1 leading-none space-y-1 block pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap select-none pointer-events-none leading-none">
                        <Badge className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded border border-transparent bg-primary/5 text-primary tracking-wide pt-0 leading-none shrink-0">
                          EXTERNAL CORPORATE GIG
                        </Badge>
                        {marketItemNode.is_featured && (
                          <Badge className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded border border-amber-500/20 bg-amber-500/5 text-amber-600 tracking-wide pt-0 leading-none shrink-0 rounded-xs shadow-3xs">
                            FLAG_PRIORITY
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold leading-snug uppercase tracking-wide text-foreground truncate block pt-0.5 select-text">
                        {marketItemNode.title}
                      </h3>
                      <p className="font-sans text-[11px] font-semibold text-muted-foreground/50 truncate block select-text leading-tight">
                        {marketItemNode.employer_name || "Hashed Corporate Identity Pool"}
                      </p>

                      <div className="flex items-center gap-3.5 font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight select-none pointer-events-none leading-none pt-0.5 tabular-nums w-full shrink-0">
                        <span className="flex items-center gap-0.5 font-extrabold text-amber-600 shrink-0">
                          <Coins className="h-3.5 w-3.5 stroke-[2] text-amber-500" />{" "}
                          {marketItemNode.budget_amount.toLocaleString()} Budget Credits
                        </span>
                        <span className="opacity-30 block select-none shrink-0">•</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Send className="h-3.5 w-3.5 stroke-[2.2]" /> {marketItemNode.total_bids || 0} Bid Profiles
                          Logged
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 stroke-[2.5] mt-2 select-none pointer-events-none shrink-0 ml-auto" />
                  </div>
                </button>
              ))
            )}
          </div>
        </TabsContent>

        {/* VIEWPORT CHANNEL E: CANDIDATE TRANSACTIONS DIRECTORY MONITOR */}
        <TabsContent
          value="work"
          className="space-y-6 focus:outline-none outline-none mt-2 block w-full animate-in fade-in duration-200 leading-none"
        >
          <section className="space-y-3 block w-full">
            <h3 className="font-mono text-[10px] font-extrabold uppercase tracking-wide text-primary flex items-center gap-1.5 select-none pointer-events-none leading-none pb-2 border-b border-border/5">
              <Zap className="h-3.5 w-3.5 stroke-[2.2] fill-current text-primary" />{" "}
              <span>Hashed Micro Task Submission Logs</span>
            </h3>
            <MySubmissions talentId={talentProfileRecord?.id} />
          </section>

          <div className="grid sm:grid-cols-2 gap-4 block w-full pt-2 align-top">
            <section className="space-y-3 block flex-1 min-w-0">
              <h3 className="font-mono text-[10px] font-extrabold uppercase tracking-wide text-blue-600 flex items-center gap-1.5 select-none pointer-events-none leading-none pb-2 border-b border-border/5">
                <Send className="h-3.5 w-3.5 stroke-[2.2]" /> <span>Proposals Bids Register</span>
              </h3>

              <div className="space-y-2 block w-full">
                {myBidsArray.length > 0 ? (
                  myBidsArray.map((bidItem) => (
                    <div
                      key={`proposal-row-card-${bidItem.id}`}
                      className="rounded-lg border border-border/60 bg-card/60 p-3 flex flex-col gap-2 block w-full leading-none transform-gpu"
                    >
                      <div className="flex justify-between items-start gap-4 leading-none w-full block">
                        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground truncate block pt-0.5 flex-1 min-w-0 select-text">
                          {bidItem.marketplace_gigs?.title || "Untitled Assignment Target Specification"}
                        </h4>
                        <Badge
                          variant="outline"
                          className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded border border-border/40 bg-background text-muted-foreground/60 tracking-wide pt-0 select-none pointer-events-none shrink-0 leading-none capitalize"
                        >
                          {bidItem.status}
                        </Badge>
                      </div>
                      <p className="font-sans text-[11px] font-semibold text-muted-foreground/50 truncate block select-text leading-tight">
                        {bidItem.marketplace_gigs?.employer_name || "Corporate Client Identity Pool"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="font-sans text-xs italic font-medium text-muted-foreground/40 block py-1 px-0.5 select-none pointer-events-none">
                    No active commercial proposal indices logged.
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-3 block flex-1 min-w-0">
              <h3 className="font-mono text-[10px] font-extrabold uppercase tracking-wide text-emerald-600 flex items-center gap-1.5 select-none pointer-events-none leading-none pb-2 border-b border-border/5">
                <ShieldCheck className="h-3.5 w-3.5 stroke-[2.2]" /> <span>Operational Contracts Vault</span>
              </h3>

              <div className="space-y-2 block w-full">
                {myContractsArray.filter((contractNode) => contractNode.status === "active").length > 0 ? (
                  myContractsArray
                    .filter((contractNode) => contractNode.status === "active")
                    .map((contractItem) => (
                      <div
                        key={`contract-vault-card-${contractItem.id}`}
                        className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.01] p-3 flex justify-between items-center gap-4 block w-full leading-none transform-gpu shadow-3xs"
                      >
                        <div className="min-w-0 flex-1 leading-none space-y-1 block pr-1">
                          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground truncate block pt-0.5 select-text">
                            {contractItem.marketplace_gigs?.title || "Untitled Active Milestone Space"}
                          </h4>
                          <p className="font-mono text-[9px] font-black text-emerald-600 uppercase tracking-tight leading-none block pt-0.5 select-text tabular-nums">
                            Escrow Balance: {contractItem.agreed_amount.toLocaleString()} Credits Draw
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="h-7.5 px-3 rounded font-mono text-[10px] font-extrabold uppercase tracking-wide cursor-pointer shrink-0 shadow-2xs transform-gpu active:scale-95 pt-0.5"
                          onClick={() => setActiveDeliverableContractId(contractItem.id)}
                        >
                          Deliver Artifact
                        </Button>
                      </div>
                    ))
                ) : (
                  <p className="font-sans text-xs italic font-medium text-muted-foreground/40 block py-1 px-0.5 select-none pointer-events-none">
                    No active legal assignment matrices validated in escrow handles.
                  </p>
                )}
              </div>
            </section>
          </div>
        </TabsContent>
      </Tabs>

      {/* HUD LEVEL 3: ARTIFACT MANIFEST TRANSMISSION DISPATCH MODAL LAYER */}
      <Dialog
        open={!!activeDeliverableContractId}
        onOpenChange={(isOpenState) => !isOpenState && setActiveDeliverableContractId(null)}
      >
        <DialogContent className="rounded-lg max-w-md border border-border/60 bg-popover text-popover-foreground shadow-2xl select-none leading-none p-5">
          <DialogHeader className="text-left leading-none pb-2 border-b border-border/5">
            <DialogTitle className="text-sm font-bold uppercase tracking-wide text-foreground leading-none m-0">
              Transmit Assignment Deliverable Archive
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4 block w-full leading-none">
            <div className="space-y-1 block leading-none">
              <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none ml-0.5">
                Deliverable Manifest Document Title
              </Label>
              <Input
                type="text"
                value={textDeliverableTitleInput}
                onChange={(e) => setTextDeliverableTitleInput(e.target.value)}
                placeholder="e.g. Completed System Core Abstraction Layer specs"
                className="h-10 text-xs sm:text-sm bg-background border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none"
              />
            </div>

            <div className="space-y-1 block leading-none pt-1">
              <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none ml-0.5">
                Implementation Architecture Remarks Summary
              </Label>
              <Textarea
                value={textDeliverableDescInput}
                onChange={(e) => setTextDeliverableDescInput(e.target.value)}
                placeholder="Outline explicit technical details, build artifacts logs, or structural adjustments performed down-stream for client verification notes..."
                className="bg-background border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg text-xs sm:text-sm font-sans leading-relaxed resize-none p-2.5 min-h-[100px]"
              />
            </div>

            <div className="space-y-1 block leading-none pt-1">
              <Label className="font-mono text-[10px] font-extrabold uppercase text-primary tracking-wide block leading-none ml-0.5">
                Secure Document Asset Files Ledger
              </Label>
              <GigUploader
                value={uploadedFilesCollection}
                onChange={setUploadedFilesCollection}
                folder={`deliverable/${activeDeliverableContractId || "misc-pool"}`}
                maxFiles={5}
              />
            </div>

            <Button
              type="button"
              disabled={
                submitDeliverableMutation.isPending ||
                !textDeliverableTitleInput.trim() ||
                uploadedFilesCollection.length === 0
              }
              onClick={() => submitDeliverableMutation.mutate()}
              className="w-full h-10 rounded-lg font-bold uppercase text-xs tracking-wider gap-1.5 cursor-pointer shadow-xs transform-gpu active:scale-[0.985] block text-center"
            >
              {submitDeliverableMutation.isPending ? (
                <div className="flex items-center justify-center gap-1.5 mx-auto leading-none">
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-primary-foreground stroke-[2.5]" />
                  <span className="pt-0.5">Authorizing Archive Transport Loop...</span>
                </div>
              ) : (
                <span>Publish Escrow Deliverable Artifacts</span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
