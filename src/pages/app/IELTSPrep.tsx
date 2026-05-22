import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listIeltsResourceAccessByTalent,
  listActiveIeltsResourcesBySection,
} from "@/domains/abroad/repo/abroadRepo";
import { insertIeltsResourceAccess } from "@/domains/learning/repo/learningRepo";
import { insertContactLog } from "@/domains/marketing/repo/marketingRepo";
import {
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  ArrowLeft,
  Sparkles,
  Trophy,
  ChevronRight,
  Lock,
  Clock,
  Coins,
  FileText,
  CheckCircle,
  Play,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { useCredits } from "@/domains/finance/hooks/useCredits";
import { useTalent } from "@/hooks/useTalent";
import { getServiceCost } from "@/lib/creditPricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL_WIDE, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT } from "@/lib/uiTokens";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface IELTSResourcePayload {
  id: string;
  title: string;
  description: string | null;
  section: string;
  content_type: "video" | "article" | "practice" | "mock_test" | "tips";
  content_url: string | null;
  is_free: boolean;
  duration_mins: number | null;
  difficulty_level: string | null;
}

const SECTION_DIRECTORY = [
  { id: "listening", name: "Listening", icon: Headphones },
  { id: "reading", name: "Reading", icon: BookOpen },
  { id: "writing", name: "Writing", icon: PenTool },
  { id: "speaking", name: "Speaking", icon: Mic },
];

const CONTENT_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  video: Play,
  article: FileText,
  practice: CheckCircle,
  mock_test: Clock,
  tips: BookOpen,
};

/**
 * GroUp Academy: IELTS Specialized Coaching Dashboard (IELTSPrep)
 * Hardened responsive module listing, securing credit-gated artifact unlocks, and isolating network mutation threads.
 * Version: Launch Candidate · Phase Z1 Production Contract Locked
 */
export default function IELTSPrep() {
  const navigateHook = useNavigate();
  const { talent: talentProfileRecord } = useTalent();
  const { balance: currentBalanceNum, refreshBalance } = useCredits();
  const tanstackQueryClient = useQueryClient();

  const [activeSectionState, setActiveSectionState] = React.useState<string>("listening");
  const [activeSelectedResource, setActiveSelectedResource] = React.useState<IELTSResourcePayload | null>(null);
  const [isCreditGateOpen, setIsCreditGateOpen] = React.useState<boolean>(false);
  const [isCreditPurchaseSheetOpen, setIsCreditPurchaseSheetOpen] = React.useState<boolean>(false);
  const [isUnlockingTransactionPending, setIsUnlockingTransactionPending] = React.useState<boolean>(false);

  const ieltsMockCost = getServiceCost("IELTS_MOCK");

  // =========================================================================
  // DATA ACQUISITION PIPELINE SECURED VIA TANSTACK CACHE CHANNEL
  // =========================================================================
  const { data: unlockedResourcesIdsArray = [] } = useQuery<string[]>({
    queryKey: ["app-ielts-resource-access-registry", talentProfileRecord?.id],
    queryFn: async (): Promise<string[]> => {
      if (!talentProfileRecord?.id) return [];
      return await listIeltsResourceAccessByTalent(talentProfileRecord.id);
    },
    enabled: !!talentProfileRecord?.id,
  });

  const { data: sectionResourcesPayload = [], isLoading: isSectionCacheResolving } = useQuery<IELTSResourcePayload[]>({
    queryKey: ["app-ielts-resources-catalog", activeSectionState],
    queryFn: async (): Promise<IELTSResourcePayload[]> => {
      const dbCatalogPayload = await listActiveIeltsResourcesBySection(activeSectionState);
      return (dbCatalogPayload as unknown as IELTSResourcePayload[]) ?? [];
    },
  });

  // =========================================================================
  // TRANSACTION MUTATION LANE: SECURE ASSET UNLOCKING DISPATCH
  // =========================================================================
  const handleResourceUnlockSequence = async () => {
    if (!activeSelectedResource || !talentProfileRecord?.id) return;
    setIsUnlockingTransactionPending(true);

    try {
      const { error: accessMutationError } = await insertIeltsResourceAccess(
        talentProfileRecord.id,
        activeSelectedResource.id,
      );

      if (accessMutationError) throw accessMutationError;

      // Log telemetry for administrative monitoring of premium resource draws
      await insertContactLog({
        full_name: talentProfileRecord.fullName,
        email: talentProfileRecord.email,
        subject: `IELTS Premium Unlock: ${activeSelectedResource.title}`,
        message: `Talent successfully unlocked premium section: ${activeSelectedResource.section}.`,
      });

      await tanstackQueryClient.invalidateQueries({ queryKey: ["app-ielts-resource-access-registry"] });
      await refreshBalance();

      toast.success("Resource successfully unlocked within your workspace.");
      setIsCreditGateOpen(false);

      if (activeSelectedResource.content_url) {
        window.open(activeSelectedResource.content_url, "_blank", "noopener,noreferrer");
      }
    } catch (mutationExceptionPayload) {
      toast.error("Subsystem refused unlock transaction. Re-verify credential balance.");
    } finally {
      setIsUnlockingTransactionPending(false);
    }
  };

  const handleResourceInteractionTrigger = (targetResource: IELTSResourcePayload) => {
    const isUnlocked = targetResource.is_free || unlockedResourcesIdsArray.includes(targetResource.id);
    if (isUnlocked) {
      if (targetResource.content_url) window.open(targetResource.content_url, "_blank", "noopener,noreferrer");
      else toast.error("Resource pipeline currently uninitialized.");
    } else {
      setActiveSelectedResource(targetResource);
      setIsCreditGateOpen(true);
    }
  };

  return (
    <div className={cn(PAGE_SHELL_WIDE, "max-w-3xl mx-auto space-y-6 antialiased block transform-gpu w-full")}>
      {/* HUD LEVEL 1: APPLICATION HEADER MODULE DESCRIPTION COCKPIT */}
      <header className="block w-full leading-none">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateHook("/app/learning")}
          className="h-8 -ml-3 mb-2 font-mono text-[10px] font-extrabold uppercase tracking-widest cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5 stroke-[2.5]" /> Back
        </Button>
        <div className="flex items-center gap-2 block leading-none">
          <Sparkles className="h-5 w-5 text-primary stroke-[2.2]" />
          <h1 className={cn(PAGE_TITLE, "text-lg sm:text-xl font-bold uppercase tracking-wide")}>
            IELTS Coaching Workspace
          </h1>
        </div>
        <p className={cn(PAGE_SUBTITLE, "text-xs font-semibold text-muted-foreground/60 leading-none pt-1.5")}>
          Listening, Reading, Writing & Speaking modules integrated with live AI-examiner feedback.
        </p>
      </header>

      {/* HUD LEVEL 2: MOCK EXAM GATEWAY CARD */}
      <Card
        className={cn(
          CARD,
          "rounded-lg border border-border/60 cursor-pointer hover:border-primary/40 transition-colors shadow-none overflow-hidden block w-full",
        )}
        onClick={() => navigateHook("/app/agents/ielts-tutor")}
      >
        <CardContent className="p-4 flex items-center gap-4 block w-full">
          <div className="h-10 w-10 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 text-primary pointer-events-none shadow-3xs">
            <Trophy className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div className="flex-1 min-w-0 space-y-0.5 block">
            <p className="text-sm font-bold text-foreground truncate block pt-0.5">Initialize Full Mock Assessment</p>
            <p
              className={cn(
                META_TEXT,
                "font-mono text-[9px] font-extrabold uppercase tracking-wide text-amber-600 block",
              )}
            >
              100 Credits Draw Metric
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        </CardContent>
      </Card>

      {/* HUD LEVEL 3: SECTION FILTERING TAXONOMY PILLS */}
      <div className="grid grid-cols-4 gap-2 w-full block">
        {SECTION_DIRECTORY.map((s) => {
          const isActive = activeSectionState === s.id;
          return (
            <button
              key={`ielts-section-tab-node-${s.id}`}
              type="button"
              onClick={() => setActiveSectionState(s.id)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer shadow-none",
                isActive
                  ? "border-primary bg-primary/5 text-primary font-bold"
                  : "border-border/60 bg-background text-muted-foreground hover:border-border hover:bg-muted/40",
              )}
            >
              <s.icon className="h-4 w-4 stroke-[2.2]" />
              <span className="text-[10px] font-bold uppercase tracking-wide">{s.name}</span>
            </button>
          );
        })}
      </div>

      {/* HUD LEVEL 4: RESOURCE REGISTRY DIRECTORY LISTING */}
      <div className="space-y-2 block w-full">
        {isSectionCacheResolving ? (
          [1, 2, 3].map((idx) => (
            <Skeleton
              key={`ielts-resource-skeleton-row-${idx}`}
              className="h-16 w-full rounded-lg bg-card/10 block border border-transparent shadow-none"
            />
          ))
        ) : sectionResourcesPayload.length > 0 ? (
          sectionResourcesPayload.map((resourceNode) => {
            const IconComponent = CONTENT_TYPE_ICONS[resourceNode.content_type] || FileText;
            const isUnlocked = resourceNode.is_free || unlockedResourcesIdsArray.includes(resourceNode.id);

            return (
              <Card
                key={`ielts-resource-card-node-${resourceNode.id}`}
                className={cn(
                  CARD,
                  "rounded-lg border border-border/60 hover:border-primary/40 transition-colors shadow-none overflow-hidden cursor-pointer block w-full",
                )}
                onClick={() => handleResourceInteractionTrigger(resourceNode)}
              >
                <CardContent className="p-3.5 flex gap-4 block w-full">
                  <div className="h-10 w-10 rounded-lg bg-muted/40 flex items-center justify-center shrink-0 pointer-events-none select-none border border-border/5 shadow-3xs">
                    <IconComponent className="h-4 w-4 text-muted-foreground/60 stroke-[2.2]" />
                  </div>
                  <div className="flex-1 min-w-0 leading-none space-y-1 block">
                    <div className="flex items-start justify-between gap-4 leading-none w-full block">
                      <h3 className="text-sm font-bold text-foreground leading-snug uppercase tracking-wide block truncate pt-0.5">
                        {resourceNode.title}
                      </h3>
                      {resourceNode.is_free ? (
                        <Badge
                          variant="outline"
                          className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded border border-emerald-500/20 bg-emerald-500/5 text-emerald-700 tracking-wide pt-0 leading-none shrink-0 rounded-xs"
                        >
                          FREE
                        </Badge>
                      ) : isUnlocked ? (
                        <Badge
                          variant="outline"
                          className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded border border-primary/20 bg-primary/5 text-primary tracking-wide pt-0 leading-none shrink-0 rounded-xs"
                        >
                          UNLOCKED
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded border border-border/40 bg-background text-muted-foreground/60 tracking-wide pt-0 leading-none shrink-0 rounded-xs gap-1"
                        >
                          <Lock className="h-2.5 w-2.5 stroke-[2.5]" /> {ieltsMockCost.toString()} CR
                        </Badge>
                      )}
                    </div>
                    {resourceNode.description && (
                      <p className="text-xs text-muted-foreground/70 truncate block pt-0.5 tracking-normal">
                        {resourceNode.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3.5 font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight select-none pointer-events-none leading-none pt-1 tabular-nums w-full shrink-0">
                      {resourceNode.duration_mins && (
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3 stroke-[2.2]" />{" "}
                          <span>{resourceNode.duration_mins.toString()} MIN</span>
                        </span>
                      )}
                      {resourceNode.difficulty_level && (
                        <span>{resourceNode.difficulty_level.toUpperCase()} LEVEL</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <EmptyState
            icon={Sparkles}
            title="Syllabus Unit Registry Vacuum"
            description={`Operational ${activeSectionState} resource manifest assemblies are current pending registry configuration updates.`}
          />
        )}
      </div>

      {/* HUD LEVEL 5: TRANSACTIONAL GATEWAY MODAL LAYERS */}
      <CreditGateModal
        isOpen={isCreditGateOpen}
        onClose={() => setIsCreditGateOpen(false)}
        onConfirm={handleResourceUnlockSequence}
        onBuyCredits={() => {
          setIsCreditGateOpen(false);
          setIsCreditPurchaseSheetOpen(true);
        }}
        serviceName={activeSelectedResource?.title || "Specialty IELTS Resource"}
        cost={ieltsMockCost}
        currentBalance={currentBalanceNum}
        isLoading={isUnlockingTransactionPending}
      />
      <CreditPurchaseSheet
        isOpen={isCreditPurchaseSheetOpen}
        onClose={() => setIsCreditPurchaseSheetOpen(false)}
        currentBalance={currentBalanceNum}
      />
    </div>
  );
}
