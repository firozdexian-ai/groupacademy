import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  countPortfolioRequests,
  listActiveProfessionCategoriesWithSlug,
  insertPortfolioRequest,
} from "@/domains/marketing/repo/marketingRepo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import MultiFileUpload from "@/components/portfolio/MultiFileUpload";
import { SimpleFileUpload } from "@/components/portfolio/SimpleFileUpload";
import ProfileBuilderForm, { ProfileData } from "@/components/portfolio/ProfileBuilderForm";
import {
  Briefcase,
  User,
  FileText,
  Award,
  Globe,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  FileUp,
  PenLine,
  Gift,
  Zap,
  ShieldCheck,
  Inbox
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/domains/finance/hooks/useCredits";
import { recordToolRun } from "@/hooks/useToolRuns";
import { ExistingCVCard } from "@/components/cv/ExistingCVCard";
import { ProfileCompletionPrompt } from "@/domains/profile/components/talent/ProfileCompletionPrompt";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
const FREE_PORTFOLIO_LIMIT = 1000;
const PORTFOLIO_COST = 500;

const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

type Step = "personal" | "cv" | "certificates" | "social" | "review";
type CvInputMode = "upload" | "url" | "profile" | "existing";

interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  professionCategoryId: string;
  customProfession: string;
  cvInputMode: CvInputMode;
  cvUrl: string;
  cvExternalUrl: string;
  profileData: ProfileData;
  certificates: { name: string; url: string }[];
  achievements: string;
  socialLinks: {
    linkedin?: string;
    github?: string;
    website?: string;
    twitter?: string;
    youtube?: string;
  };
  additionalNotes: string;
}

interface StepConfig {
  id: Step;
  label: string;
  icon: React.ReactNode;
}

const emptyProfileData: ProfileData = {
  education: [],
  experience: [],
  skills: [],
  projects: [],
  achievements: [],
};

const steps: StepConfig[] = [
  { id: "personal", label: "Identity", icon: <User className="h-4 w-4" /> },
  { id: "cv", label: "Curriculum", icon: <FileText className="h-4 w-4" /> },
  { id: "certificates", label: "Artifacts", icon: <Award className="h-4 w-4" /> },
  { id: "social", label: "Uplinks", icon: <Globe className="h-4 w-4" /> },
  { id: "review", label: "Verification", icon: <CheckCircle className="h-4 w-4" /> },
];

/**
 * GroUp Academy: Digital Asset Portfolio Request Setup (AppPortfolioRequest)
 * Hardened multi-stage collection wizard executing credit validation checks and isolating concurrent database queries.
 * Version: Launch Candidate · Phase Z1 Production Type Contract Sealed
 */
export default function AppPortfolioRequest() {
  const navigateHook = useNavigate();
  const { toast } = useToast();
  const { talent: talentProfileRecord, addServiceUsed } = useTalent();
  const { deductCredits, canAfford } = useCredits();

  const [currentStep, setCurrentStep] = React.useState<Step>("personal");
  const [isSubmissionPending, setIsSubmissionPending] = React.useState<boolean>(false);
  const [isWizardSuccess, setIsWizardSuccess] = React.useState<boolean>(false);
  const [generatedRequestId, setGeneratedRequestId] = React.useState<string>("");
  const [professionCategoriesArray, setProfessionCategoriesArray] = React.useState<ProfessionCategory[]>([]);
  const [globalPortfolioCount, setGlobalPortfolioCount] = React.useState<number | null>(null);

  const remainingFreePromoSlots = globalPortfolioCount !== null ? Math.max(0, FREE_PORTFOLIO_LIMIT - globalPortfolioCount) : 0;
  const isFreePromotionActive = remainingFreePromoSlots > 0;
  const isCandidateCvOnS3Bucket = !!talentProfileRecord?.cvUrl;

  const [formDataState, setFormDataState] = React.useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    professionCategoryId: "",
    customProfession: "",
    cvInputMode: "upload",
    cvUrl: "",
    cvExternalUrl: "",
    profileData: emptyProfileData,
    certificates: [],
    achievements: "",
    socialLinks: {},
    additionalNotes: "",
  });

  // Synchronize dynamic model parameters onto active client local form buffers safely
  React.useEffect(() => {
    if (talentProfileRecord) {
      setFormDataState((prev) => ({
        ...prev,
        fullName: prev.fullName || talentProfileRecord.fullName || "",
        email: prev.email || talentProfileRecord.email || "",
        phone: prev.phone || talentProfileRecord.phone || "",
        professionCategoryId: prev.professionCategoryId || talentProfileRecord.professionCategoryId || "",
        cvUrl: prev.cvUrl || talentProfileRecord.cvUrl || "",
        socialLinks: { ...prev.socialLinks, linkedin: prev.socialLinks.linkedin || talentProfileRecord.linkedinUrl || "" },
        cvInputMode: talentProfileRecord.cvUrl ? "existing" : prev.cvInputMode,
      }));
    }
  }, [talentProfileRecord]);

  // =========================================================================
  // LIFECYCLE SECTOR 1: CONCURRENT LOOKUPS EQUIPPED WITH UNMOUNT SAFEGUARDS
  // =========================================================================
  React.useEffect(() => {
    let isThreadActive = true;

    const executeParallelRegistryCompilation = async () => {
      try {
        const [countResult, categoriesResult] = await Promise.allSettled([
          countPortfolioRequests(),
          listActiveProfessionCategoriesWithSlug(),
        ]);

        if (!isThreadActive) return;

        if (countResult.status === "fulfilled") {
          setGlobalPortfolioCount(countResult.value || 0);
        } else {
          setGlobalPortfolioCount(FREE_PORTFOLIO_LIMIT + 1);
        }

        if (categoriesResult.status === "fulfilled" && categoriesResult.value) {
          setProfessionCategoriesArray(categoriesResult.value as unknown as ProfessionCategory[]);
        }
      } catch (fatalHandshakeException) {
        console.error("Dossier Setup Telemetry Disrupted:", fatalHandshakeException);
      }
    };

    executeParallelRegistryCompilation();

    return () => {
      isThreadActive = false;
    };
  }, []);

  const currentStepIndexNum = React.useMemo<number>(() => {
    return steps.findIndex((stepNode) => stepNode.id === currentStep);
  }, [currentStep]);

  const activeSelectedCategoryNode = React.useMemo<ProfessionCategory | undefined>(() => {
    return professionCategoriesArray.find((catItem) => catItem.id === formDataState.professionCategoryId);
  }, [professionCategoriesArray, formDataState.professionCategoryId]);

  const isOtherCategoryFlag = activeSelectedCategoryNode?.slug === "other";

  const resolvedEffectiveCvUrlStr = React.useMemo<string>(() => {
    if (formDataState.cvInputMode === "url") return formDataState.cvExternalUrl.trim();
    if (formDataState.cvInputMode === "existing") return talentProfileRecord?.cvUrl || formDataState.cvUrl;
    return formDataState.cvUrl;
  }, [formDataState.cvInputMode, formDataState.cvExternalUrl, formDataState.cvUrl, talentProfileRecord?.cvUrl]);

  // =========================================================================
  // WIZARD CONTROLLERS: DYNAMIC INTERACTION TRANSITION PATHWAYS
  // =========================================================================
  const checkCurrentPhaseRequirementsSufficient = React.useCallback((): boolean => {
    switch (currentStep) {
      case "personal":
        return !!(
          formDataState.fullName.trim() &&
          formDataState.email.trim() &&
          formDataState.phone.trim() &&
          formDataState.professionCategoryId &&
          (!isOtherCategoryFlag || formDataState.customProfession.trim())
        );
      case "cv":
        if (formDataState.cvInputMode === "upload") return !!formDataState.cvUrl;
        if (formDataState.cvInputMode === "url") {
          return !!formDataState.cvExternalUrl.trim() && formDataState.cvExternalUrl.trim().startsWith("http");
        }
        if (formDataState.cvInputMode === "existing") return !!talentProfileRecord?.cvUrl;
        return formDataState.profileData.education.length > 0;
      default:
        return true;
    }
  }, [currentStep, formDataState, isOtherCategoryFlag, talentProfileRecord?.cvUrl]);

  const handleAdvanceStepPhase = React.useCallback(() => {
    const nextTargetIndex = currentStepIndexNum + 1;
    if (nextTargetIndex < steps.length) {
      setCurrentStep(steps[nextTargetIndex].id);
    }
  }, [currentStepIndexNum]);

  const handleRevertStepPhase = React.useCallback(() => {
    const previousTargetIndex = currentStepIndexNum - 1;
    if (previousTargetIndex >= 0) {
      setCurrentStep(steps[previousTargetIndex].id);
    }
  }, [currentStepIndexNum]);

  // =========================================================================
  // WRITING LANE CONSOLE: HARDENED SUBMISSION PIPELINE CORE RESOLUTION
  // =========================================================================
  const handleCommitPortfolioRequestSequence = React.useCallback(async () => {
    if (!talentProfileRecord?.id) {
      toast({ title: "Authorization Denied", description: "Vetting access denied. Please re-authenticate account.", variant: "destructive" });
      return;
    }

    if (!isFreePromotionActive && !canAfford("PORTFOLIO")) {
      toast({
        title: "Deduction Layer Rejected",
        description: `This automated digital canvas build requires ${PORTFOLIO_COST.toString()} active matrix credits.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmissionPending(true);
    const validatedCleanCategoryId = 
      formDataState.professionCategoryId && isValidUUID(formDataState.professionCategoryId)
        ? formDataState.professionCategoryId
        : null;

    try {
      if (!isFreePromotionActive) {
        const isPaymentSettled = await deductCredits("PORTFOLIO", undefined, "Digital Custom Portfolio Synthesis Construction");
        if (!isPaymentSettled) throw new Error("Credit wallet deduction loop exception framework timeout.");
      }

      const assignmentUuidKeyStr = crypto.randomUUID();
      const { error: insertPipelineHandshakeError } = await insertPortfolioRequest({
        full_name: formDataState.fullName.trim(),
        email: formDataState.email.toLowerCase().trim(),
        phone: formDataState.phone.trim(),
        profession_category_id: validatedCleanCategoryId,
        custom_profession: isOtherCategoryFlag ? formDataState.customProfession.trim() : null,
        cv_url: resolvedEffectiveCvUrlStr || null,
        profile_data: (formDataState.cvInputMode === "profile" ? formDataState.profileData : {}) as any,
        certificates: formDataState.certificates as any,
        achievements: formDataState.achievements.trim(),
        social_links: formDataState.socialLinks as any,
        additional_notes: formDataState.additionalNotes.trim(),
        talent_id: talentProfileRecord.id,
        payment_status: isFreePromotionActive ? "free_promo" : "paid_credits",
      });

      if (insertPipelineHandshakeError) throw insertPipelineHandshakeError;
      await addServiceUsed("portfolio");

      setGeneratedRequestId(assignmentUuidKeyStr);
      setIsWizardSuccess(true);
      recordToolRun({ toolKey: "portfolio", costCredits: isFreePromotionActive ? 0 : 500, payload: { request_id: assignmentUuidKeyStr } });
      toast({ title: "Synthesis Initialized", description: "Dossier variables submitted. Coordination track online." });
    } catch (mutationFailurePayload: any) {
      toast({ title: "Pipeline Refused", description: mutationFailurePayload.message || "Failed to commit allocation records.", variant: "destructive" });
    } finally {
      setIsSubmissionPending(false);
    }
  }, [talentProfileRecord, formDataState, isFreePromotionActive, isOtherCategoryFlag, resolvedEffectiveCvUrlStr, canAfford, deductCredits, addServiceUsed, toast]);

  const handleNavigateToServicesDirectory = React.useCallback(() => {
    navigateHook("/app/services");
  }, [navigateHook]);

  const handleNavigateToStatusMonitor = React.useCallback(() => {
    navigateHook("/portfolio-status");
  }, [navigateHook]);

  // =========================================================================
  // CONDITION RENDERING LAYOUT CONTROL CHECKPOINTS
  // =========================================================================
  if (isWizardSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-left antialiased block transform-gpu w-full">
        <Card className="rounded-xl border border-border/60 bg-card/30 backdrop-blur-md shadow-none overflow-hidden block w-full">
          <CardHeader className="text-center select-none pointer-events-none pb-4 block leading-none border-b border-border/5">
            <div className="mx-auto w-16 h-16 bg-emerald-500/5 rounded-xl border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-600 stroke-[2] shadow-3xs rotate-3 animate-in fade-in duration-200">
              <CheckCircle className="h-8 w-8" />
            </div>
            <CardTitle className="text-sm sm:text-base font-bold uppercase tracking-wide text-foreground leading-none">Synthesis Pipeline Finalized</CardTitle>
            <CardDescription className="font-mono text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider block mt-1.5 leading-none">
              Asset tracking record successfully added onto global processing queues.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-6 block w-full leading-none">
            <div className="bg-muted/40 p-4 rounded-lg border border-border/60 block leading-none w-full">
              <p className="font-mono text-[9px] font-bold uppercase tracking-wide text-muted-foreground/40 mb-1 select-none pointer-events-none">
                Assigned Verification Reference ID
              </p>
              <p className="font-mono text-base font-black text-primary tracking-wide select-text tabular-nums uppercase">
                {generatedRequestId.slice(0, 8).toUpperCase()}-CORE-NODE
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 select-none leading-none block w-full shrink-0">
              <Button type="button" variant="outline" className="h-10 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider border border-border/60 bg-background/50 cursor-pointer" onClick={handleNavigateToServicesDirectory}>
                Close Session
              </Button>
              <Button type="button" className="h-10 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider cursor-pointer shadow-2xs" onClick={handleNavigateToStatusMonitor}>
                Track Environment Node
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 text-left antialiased block transform-gpu w-full">
      
      {/* HUD LEVEL 1: APP SHELL TOP BAR HUD INTERFACES CONTROL CONSOLE */}
      <header className="flex items-center justify-between select-none leading-none w-full shrink-0">
        <Button
          type="button"
          variant="ghost"
          className="rounded-lg h-9 px-3 font-mono text-[10px] font-extrabold uppercase tracking-wider border border-border/5 bg-background hover:bg-muted group cursor-pointer"
          onClick={handleNavigateToServicesDirectory}
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5 stroke-[2.5] transition-transform group-hover:-translate-x-0.5" /> 
          <span>Abort Sequence Request</span>
        </Button>
        <Badge
          variant="outline"
          className="font-mono text-[9px] font-extrabold uppercase px-2 h-5 tracking-wide rounded bg-primary/5 text-primary border-primary/20 shrink-0 pointer-events-none leading-none pt-0.5"
        >
          Syllabus Indexing Node: v2.6 Matrix
        </Badge>
      </header>

      <ProfileCompletionPrompt variant="banner" className="rounded-xl border border-dashed border-primary/20 bg-card/10 block w-full shadow-none" />

      {/* HUD LEVEL 2: CHROMATIC PROMOTION VALIDATION SYSTEM VIEWPORTS */}
      {isFreePromotionActive ? (
        <Card className="rounded-xl border border-primary/20 bg-primary/[0.01] shadow-none overflow-hidden block w-full select-none pointer-events-none">
          <CardContent className="p-3.5 flex items-center justify-between gap-4 leading-none w-full block animate-pulse">
            <div className="flex items-center gap-3LEADING-NONE block min-w-0">
              <div className="p-2.5 bg-primary/5 border border-primary/10 rounded-lg shrink-0 text-primary block shadow-3xs">
                <Gift className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div className="leading-none space-y-0.5 block min-w-0">
                <p className="font-mono text-[10px] font-black uppercase tracking-wide text-primary">Automated Promotional Matrix Active</p>
                <p className="font-mono text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tight block truncate tabular-nums">
                  Allocation Available: {remainingFreePromoSlots.toLocaleString()} System Nodes Residuals for 0.00 Credits draw
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl border border-border/60 bg-card/20 shadow-none overflow-hidden block w-full select-none pointer-events-none">
          <CardContent className="p-3.5 flex items-center justify-between gap-4 leading-none w-full block">
            <div className="flex items-center gap-2 font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
              <Briefcase className="h-4 w-4 text-muted-foreground/30 stroke-[2.2]" />
              <span className="pt-0.5">Synthesis Execution Resource Fee Cost Charge</span>
            </div>
            <span className="font-mono text-xs font-black italic text-foreground tracking-tight tabular-nums">{PORTFOLIO_COST.toLocaleString()} CREDITS</span>
          </CardContent>
        </Card>
      )}

      {/* HUD LEVEL 3: DYNAMIC TIMELINE DISCLOSURE WIZARD STEPPER TRACK */}
      <div className="flex items-center justify-between px-1 select-none pointer-events-none leading-none w-full block shrink-0">
        {steps.map((stepItem, indexPos) => (
          <div key={`stepper-node-indicator-item-${stepItem.id}`} className="flex flex-1 items-center gap-2 block shrink-0 leading-none">
            <div
              className={cn(
                "h-7 w-7 rounded border grid place-items-center transition-all duration-300 text-xs shadow-3xs shrink-0 rounded-sm",
                indexPos <= currentStepIndexNum
                  ? "bg-primary text-primary-foreground border-primary font-black scale-105"
                  : "bg-muted text-muted-foreground/20 border-transparent",
              )}
            >
              {stepItem.icon}
            </div>
            {indexPos < steps.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 rounded-full transition-all duration-300 mx-1",
                  indexPos < currentStepIndexNum ? "bg-primary" : "bg-border/60",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* HUD LEVEL 4: CORE SUBMISSION COMPOSER ENTRY DIALOG FORMS */}
      <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none overflow-hidden block w-full">
        <CardHeader className="p-4 border-b border-border/5 bg-muted/20 flex flex-row items-center justify-between w-full select-none shrink-0 leading-none">
          <div className="space-y-0.5 block leading-none select-none pointer-events-none">
            <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground leading-none m-0">
              {steps[currentStepIndexNum].label} Setup Configuration
            </CardTitle>
          </div>
          <span className="font-mono text-[9px] font-bold text-muted-foreground/30 uppercase tracking-tight select-none pointer-events-none tabular-nums">
            INDEX: NODE_{currentStep.toUpperCase()}
          </span>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6 block w-full space-y-5 leading-none">
          {currentStep === "personal" && (
            <div className="space-y-4 block w-full">
              <div className="space-y-1 block leading-none">
                <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none ml-0.5">Full Nomenclature Real Identity</Label>
                <Input
                  type="text"
                  value={formDataState.fullName}
                  onChange={(e) => setFormDataState((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Input executive structural profiling nomenclature moniker..."
                  className="h-10 text-xs sm:text-sm bg-background/50 border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 block w-full">
                <div className="space-y-1 block leading-none">
                  <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none ml-0.5">Electronic Mail Endpoint</Label>
                  <Input
                    type="email"
                    value={formDataState.email}
                    onChange={(e) => setFormDataState((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="uplink@domain-network.com"
                    className="h-10 text-xs sm:text-sm bg-background/50 border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none"
                  />
                </div>
                <div className="space-y-1 block leading-none">
                  <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none ml-0.5">WhatsApp Communication Tracking Pipeline</Label>
                  <Input
                    type="tel"
                    value={formDataState.phone}
                    onChange={(e) => setFormDataState((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+8801..."
                    className="h-10 text-xs sm:text-sm bg-background/50 border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none"
                  />
                </div>
              </div>
              
              <div className="space-y-1 block leading-none">
                <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none ml-0.5">Professional Line Sector Architecture Focus</Label>
                <Select
                  value={formDataState.professionCategoryId}
                  onValueChange={(extractedId) => setFormDataState((prev) => ({ ...prev, professionCategoryId: extractedId }))}
                >
                  <SelectTrigger className="h-10 font-sans text-xs sm:text-sm rounded-lg border border-border/40 bg-background/50 shadow-none">
                    <SelectValue placeholder="Identify targeted vertical computational stream context line..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border border-border/60 bg-popover text-popover-foreground">
                    {professionCategoriesArray.map((catNode) => (
                      <SelectItem key={`category-select-option-${catNode.id}`} value={catNode.id} className="text-xs font-semibold">
                        {catNode.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {isOtherCategoryFlag && (
                <div className="space-y-1 block leading-none animate-in fade-in duration-100">
                  <Input
                    type="text"
                    value={formDataState.customProfession}
                    onChange={(e) => setFormDataState((prev) => ({ ...prev, customProfession: e.target.value }))}
                    placeholder="Provide detailed descriptor specification string mapping parameters..."
                    className="h-10 text-xs sm:text-sm bg-background/50 border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none"
                  />
                </div>
              )}
            </div>
          )}

          {currentStep === "cv" && (
            <div className="space-y-4 block w-full leading-none">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full block layout select-none h-9">
                {isCandidateCvOnS3Bucket && (
                  <Button
                    type="button"
                    variant={formDataState.cvInputMode === "existing" ? "default" : "outline"}
                    className="rounded-lg font-mono text-[9px] font-extrabold uppercase tracking-wide h-9 cursor-pointer"
                    onClick={() => setFormDataState((prev) => ({ ...prev, cvInputMode: "existing" }))}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-1.5 stroke-[2.2] shrink-0" /> <span>Reuse File</span>
                  </Button>
                )}
                <Button
                  type="button"
                  variant={formDataState.cvInputMode === "upload" ? "default" : "outline"}
                  className="rounded-lg font-mono text-[9px] font-extrabold uppercase tracking-wide h-9 cursor-pointer"
                  onClick={() => setFormDataState((prev) => ({ ...prev, cvInputMode: "upload" }))}
                >
                  <FileUp className="h-3.5 w-3.5 mr-1.5 stroke-[2.2] shrink-0" /> <span>Upload Disk</span>
                </Button>
                <Button
                  type="button"
                  
                  variant={formDataState.cvInputMode === "url" ? "default" : "outline"}
                  className="rounded-lg font-mono text-[9px] font-extrabold uppercase tracking-wide h-9 cursor-pointer"
                  onClick={() => setFormDataState((prev) => ({ ...prev, cvInputMode: "url" }))}
                >
                  <Globe className="h-3.5 w-3.5 mr-1.5 stroke-[2.2] shrink-0" /> <span>URL Link</span>
                </Button>
                <Button
                  type="button"
                  variant={formDataState.cvInputMode === "profile" ? "default" : "outline"}
                  className="rounded-lg font-mono text-[9px] font-extrabold uppercase tracking-wide h-9 cursor-pointer"
                  onClick={() => setFormDataState((prev) => ({ ...prev, cvInputMode: "profile" }))}
                >
                  <PenLine className="h-3.5 w-3.5 mr-1.5 stroke-[2.2] shrink-0" /> <span>Synth Profile</span>
                </Button>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/20 border border-dashed border-border/60 block leading-none w-full min-h-[140px]">
                {formDataState.cvInputMode === "existing" && (
                  <ExistingCVCard
                    talent={talentProfileRecord}
                    onUseExisting={() => setFormDataState((prev) => ({ ...prev, cvUrl: talentProfileRecord?.cvUrl || "" }))}
                    onUploadNew={() => setFormDataState((prev) => ({ ...prev, cvInputMode: "upload" }))}
                  />
                )}
                {formDataState.cvInputMode === "upload" && (
                  <SimpleFileUpload
                    accept=".pdf,.doc,.docx"
                    onFileUploaded={(extractedUrl) => setFormDataState((prev) => ({ ...prev, cvUrl: extractedUrl }))}
                    onUrlProvided={(extractedUrl) => setFormDataState((prev) => ({ ...prev, cvUrl: extractedUrl }))}
                    currentValue={formDataState.cvUrl}
                  />
                )}
                {formDataState.cvInputMode === "url" && (
                  <div className="space-y-1 block w-full pt-1.5 animate-in fade-in duration-100">
                    <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none ml-0.5">Secure Document Asset Absolute URL Address</Label>
                    <Input
                      type="url"
                      value={formDataState.cvExternalUrl}
                      onChange={(e) => setFormDataState((prev) => ({ ...prev, cvExternalUrl: e.target.value }))}
                      placeholder="e.g., https://storage-network.domain.com/credentials-specs/file-hash.pdf"
                      className="h-10 text-xs sm:text-sm bg-background border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none"
                    />
                  </div>
                )}
                {formDataState.cvInputMode === "profile" && (
                  <ProfileBuilderForm
                    value={formDataState.profileData}
                    onChange={(calculatedProfileNode) => setFormDataState((prev) => ({ ...prev, profileData: calculatedProfileNode }))}
                  />
                )}
              </div>
            </div>
          )}

          {currentStep === "certificates" && (
            <div className="space-y-5 block w-full">
              <MultiFileUpload
                bucket="portfolio-uploads"
                value={formDataState.certificates}
                onChange={(filesPayloadCollection) => setFormDataState((prev) => ({ ...prev, certificates: filesPayloadCollection }))}
                label="Files Ledger Track"
                description="Upload confirmed training achievements, technical awards records, and verifiable credentials."
              />
              
              <div className="space-y-1 block leading-none pt-1">
                <Label className="font-mono text-[10px] font-extrabold uppercase text-primary tracking-wide block leading-none ml-0.5">Strategic Enterprise Milestones & Career Achievements</Label>
                <Textarea
                  value={formDataState.achievements}
                  onChange={(e) => setFormDataState((prev) => ({ ...prev, achievements: e.target.value }))}
                  placeholder="Outline key high-fidelity operational targets, corporate records broken, and project delivery metrics won..."
                  className="min-h-[140px] font-sans text-xs sm:text-sm font-medium leading-relaxed bg-background/50 border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none p-3 resize-none"
                />
              </div>
            </div>
          )}

          {currentStep === "social" && (
            <div className="space-y-5 block w-full">
              <div className="space-y-4 block w-full">
                {["linkedin", "github", "website"].map((fieldKeyStr) => (
                  <div key={`social-link-input-row-${fieldKeyStr}`} className="space-y-1 block leading-none">
                    <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none ml-0.5 capitalize">{fieldKeyStr} Endpoint Uplink Link</Label>
                    <Input
                      type="url"
                      value={formDataState.socialLinks[fieldKeyStr as keyof typeof formDataState.socialLinks] || ""}
                      onChange={(e) =>
                        setFormDataState((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, [fieldKeyStr]: e.target.value } }))
                      }
                      placeholder={`https://${fieldKeyStr}.com/profile-identity-block-spec`}
                      className="h-10 text-xs sm:text-sm bg-background/50 border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none"
                    />
                  </div>
                ))}
              </div>
              
              <div className="space-y-1 block leading-none pt-1">
                <Label className="font-mono text-[10px] font-extrabold uppercase text-primary tracking-wide block leading-none ml-0.5">Design Team Execution Directives & Upload Notes</Label>
                <Textarea
                  value={formDataState.additionalNotes}
                  onChange={(e) => setFormDataState((prev) => ({ ...prev, additionalNotes: e.target.value }))}
                  placeholder="Input custom structural interface variables, themes, or alignment traits intended for our developers..."
                  className="min-h-[100px] font-sans text-xs sm:text-sm font-medium leading-relaxed bg-background/50 border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none p-3 resize-none"
                />
              </div>
            </div>
          )}

          {currentStep === "review" && (
            <div className="space-y-5 block w-full animate-in fade-in duration-200 leading-none">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-3.5 font-medium block select-text leading-none w-full shadow-3xs">
                <div className="flex justify-between items-center leading-none w-full block">
                  <span className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide select-none pointer-events-none">Candidate Legal Entity Identity</span>
                  <span className="text-foreground text-xs font-bold uppercase tracking-wide">{formDataState.fullName}</span>
                </div>
                <div className="flex justify-between items-center leading-none w-full block">
                  <span className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide select-none pointer-events-none">Transmitted Curriculum Record Log</span>
                  <span className="text-foreground text-xs font-bold uppercase tracking-wide">{resolvedEffectiveCvUrlStr ? "Artifact Document Track Attached" : "Pending Manual Core Synthesis"}</span>
                </div>
                <div className="flex justify-between items-center leading-none w-full block">
                  <span className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide select-none pointer-events-none">Specialty Vertical Target Sector</span>
                  <span className="text-foreground text-xs font-bold uppercase tracking-wide">{activeSelectedCategoryNode?.name || "UNASSIGNED VARIANT"}</span>
                </div>
                
                <div className="pt-4 mt-2 border-t border-dashed border-border/40 flex justify-between items-center leading-none w-full block">
                  <span className="font-mono text-[10px] font-black tracking-widest text-primary uppercase select-none pointer-events-none">Total Pipeline Procurement Charge</span>
                  <span className="text-base font-mono font-black tracking-tight text-foreground uppercase tabular-nums">
                    {isFreePromotionActive ? "0.00 (AUTOMATED PROMO DRAW)" : `${PORTFOLIO_COST.toLocaleString()} CREDITS DRAW`}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 select-none pointer-events-none leading-none w-full block">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 stroke-[2.2] shrink-0" />
                <p className="font-mono text-[9px] font-bold text-emerald-600 uppercase tracking-wider block pt-0.5">
                  Secure Operational Cryptography Tunnel Enabled • 256-Bit SHA Transport Matrix Assured
                </p>
              </div>
            </div>
          )}

          {/* LOWER GRID: STEP TRANSITION ACTION TRIGGERS CONTROLLER BAR */}
          <div className="flex gap-3 pt-4 select-none leading-none w-full block mt-2 shrink-0">
            {currentStepIndexNum > 0 && (
              <Button
                type="button"
                variant="outline"
                className="rounded-lg h-10 px-4 border border-border/60 font-mono text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/60 hover:text-foreground cursor-pointer"
                onClick={handleRevertStepPhase}
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5 stroke-[2.5]" /> <span>Revert Phase</span>
              </Button>
            )}
            
            {currentStep !== "review" ? (
              <Button
                type="button"
                disabled={!checkCurrentPhaseRequirementsSufficient()}
                className="flex-1 h-10 rounded-lg font-bold uppercase text-xs tracking-wider cursor-pointer shadow-2xs transform-gpu active:scale-[0.985] disabled:opacity-50"
                onClick={handleAdvanceStepPhase}
              >
                <span>Advance Parameters Step</span> 
                <ArrowRight className="ml-1.5 h-4 w-4 stroke-[2.5]" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isSubmissionPending}
                className="flex-1 h-10 rounded-lg font-bold uppercase text-xs tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs transform-gpu active:scale-[0.985] group"
                onClick={handleCommitPortfolioRequestSequence}
              >
                {isSubmissionPending ? (
                  <div className="flex items-center justify-center gap-1.5 mx-auto leading-none">
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                    <span className="truncate block pt-0.5">Transmitting Allocation...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 mx-auto leading-none">
                    <Zap className="h-4 w-4 fill-current stroke-[1.5] transition-transform group-hover:scale-110 shrink-0 text-primary-foreground" />
                    <span>Authorize Transaction Parameters & Commit</span>
                  </div>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}