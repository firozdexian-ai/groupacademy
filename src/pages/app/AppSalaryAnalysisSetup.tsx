import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { listActiveProfessionCategoriesBasic, insertSalaryAnalysis } from "@/domains/marketing/repo/marketingRepo";
import { uploadPortfolioFile } from "@/domains/profile/repo/profileRepo";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, FileCheck, ArrowLeft, Coins, Zap, Target, ShieldCheck } from "lucide-react";

import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/domains/finance/hooks/useCredits";
import { recordToolRun } from "@/hooks/useToolRuns";
import { ExistingCVCard } from "@/components/cv/ExistingCVCard";
import { ProfileCompletionPrompt } from "@/domains/profile/components/talent/ProfileCompletionPrompt";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { cn } from "@/lib/utils";
import { PAGE_SHELL, PAGE_TITLE, META_TEXT, CARD } from "@/lib/uiTokens";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface ProfessionCategory {
  id: string;
  name: string;
}

const SALARY_ANALYSIS_COST = 50;

/**
 * GroUp Academy: AI Salary Synthesis & Market Telemetry Setup (AppSalaryAnalysisSetup)
 * Hardened responsive entry cockpit processing dynamic resume uploads and checking credit gate parameters defensively.
 * Version: Launch Candidate · Phase Z1 Transaction Matrix Sealed
 */
export default function AppSalaryAnalysisSetup() {
  const navigateHook = useNavigate();
  const { toast } = useToast();
  const {
    talent: talentProfileRecord,
    user: userAuthRecord,
    addServiceUsed,
    updateTalent,
    refreshTalent,
  } = useTalent();
  const { canAfford, deductCredits, balance } = useCredits();

  const [candidateEmailState, setCandidateEmailState] = React.useState<string>("");
  const [fullNameState, setFullNameState] = React.useState<string>("");
  const [phoneInputStr, setPhoneInputStr] = React.useState<string>("");
  const [jobTitleInputStr, setJobTitleInputStr] = React.useState<string>("");
  const [companyNameInputStr, setCompanyNameInputStr] = React.useState<string>("");
  const [jobDescriptionInputStr, setJobDescriptionInputStr] = React.useState<string>("");
  const [cvTextInputStr, setCvTextInputStr] = React.useState<string>("");
  const [cvInputMode, setCvInputMode] = React.useState<"text" | "file" | "existing">("text");

  const [cvFileState, setCvFileState] = React.useState<File | null>(null);
  const [isCVStorageUploading, setIsCVStorageUploading] = React.useState<boolean>(false);
  const [cvSecureUrlStr, setCvSecureUrlStr] = React.useState<string>("");

  const [professionCategoriesArray, setProfessionCategoriesArray] = React.useState<ProfessionCategory[]>([]);
  const [selectedProfessionId, setSelectedProfessionId] = React.useState<string>("");
  const [isSubmissionPending, setIsSubmissionPending] = React.useState<boolean>(false);
  const [isCreditGateOpen, setIsCreditGateOpen] = React.useState<boolean>(false);
  const [isCreditPurchaseSheetOpen, setIsCreditPurchaseSheetOpen] = React.useState<boolean>(false);

  const hasExistingCvOnFile = !!(talentProfileRecord?.cvUrl || talentProfileRecord?.cvText);

  // =========================================================================
  // LIFECYCLE SECTOR 1: RETRIEVAL SYNCHRONIZATION RUNWAY MATRIX
  // =========================================================================
  React.useEffect(() => {
    if (talentProfileRecord) {
      setCandidateEmailState((prev) => prev || talentProfileRecord.email || "");
      setFullNameState((prev) => prev || talentProfileRecord.fullName || "");
      setPhoneInputStr((prev) => prev || talentProfileRecord.phone?.replace(/^\+880/, "") || "");

      if (talentProfileRecord.professionCategoryId) {
        setSelectedProfessionId((prev) => prev || talentProfileRecord.professionCategoryId || "");
      }

      if (hasExistingCvOnFile && cvInputMode === "text") {
        setCvInputMode("existing");
        if (talentProfileRecord.cvUrl) setCvSecureUrlStr(talentProfileRecord.cvUrl);
        if (talentProfileRecord.cvText) setCvTextInputStr(talentProfileRecord.cvText);
      }
    } else if (userAuthRecord?.email) {
      setCandidateEmailState((prev) => prev || userAuthRecord.email || "");
    }
  }, [talentProfileRecord, userAuthRecord, hasExistingCvOnFile, cvInputMode]);

  React.useEffect(() => {
    let isThreadActive = true;
    const loadProfessionCategoriesDirectory = async () => {
      try {
        const dbCategoriesPayload = await listActiveProfessionCategoriesBasic();
        if (dbCategoriesPayload && isThreadActive) {
          setProfessionCategoriesArray(dbCategoriesPayload as unknown as ProfessionCategory[]);
        }
      } catch (pipelineException: any) {
        if (isThreadActive) {
          console.error("Diagnostic Failure: Profession Configuration Load Exception:", pipelineException);
        }
      }
    };

    loadProfessionCategoriesDirectory();

    return () => {
      isThreadActive = false;
    };
  }, []);

  // =========================================================================
  // ACTION HOOKS: CLOUD SECURE CV REPOSITORY STORAGE METRICS DISPATCH
  // =========================================================================
  const handleSecureCVStorageUploadSequence = async (targetFileObj: File) => {
    if (!targetFileObj.type.includes("pdf") && !targetFileObj.type.includes("document")) {
      toast({
        title: "Unsupported File Format",
        description: "Vetting files must conform strictly to PDF, DOC, or DOCX specifications.",
        variant: "destructive",
      });
      return;
    }
    if (targetFileObj.size > 10 * 1024 * 1024) {
      toast({
        title: "Capacity Threshold Bound Exceeded",
        description: "The transmitted credentials payload must remain below 10.0 MB.",
        variant: "destructive",
      });
      return;
    }

    setIsCVStorageUploading(true);
    setCvFileState(targetFileObj);

    try {
      const generatedTargetStoragePath = `salary-cv/${Date.now().toString()}-${targetFileObj.name}`;
      const { publicUrl } = await uploadPortfolioFile(generatedTargetStoragePath, targetFileObj);
      setCvSecureUrlStr(publicUrl);

      if (talentProfileRecord?.id) {
        await updateTalent({ cvUrl: publicUrl });
        await refreshTalent();
      }
      toast({ title: "Document Artifact Hashed & Secured" });
    } catch (storageExceptionPayload) {
      toast({
        title: "Subsystem Refused Payload",
        description: "Fallback verification protocols automatically triggered. Please text paste source parameters.",
        variant: "destructive",
      });
      setCvInputMode("text");
    } finally {
      setIsCVStorageUploading(false);
    }
  };

  // =========================================================================
  // TRANSACTION SUBMISSION ENGINE PIPELINE MUTATION EXECUTION
  // =========================================================================
  const handleCommitSalaryAnalysisSequence = async () => {
    if (!fullNameState.trim() || !candidateEmailState.trim() || !jobDescriptionInputStr.trim()) {
      toast({
        title: "Incomplete Input Fields",
        description: "All required structural parameter categories must be filled.",
        variant: "destructive",
      });
      return;
    }
    if (!cvTextInputStr.trim() && !cvSecureUrlStr) {
      toast({
        title: "Career Record Track Missing",
        description: "You must supply an operational CV text layout code blueprint or an artifact spec file.",
        variant: "destructive",
      });
      return;
    }

    if (!canAfford("SALARY_ANALYSIS")) {
      setIsCreditGateOpen(true);
      return;
    }

    setIsSubmissionPending(true);
    try {
      const isCreditHandshakeSettled = await deductCredits(
        "SALARY_ANALYSIS",
        undefined,
        "AI Salary Synthesis Market Analysis Run",
      );
      if (!isCreditHandshakeSettled) throw new Error("Credit transaction block handshake failure.");

      const targetAnalysisIdUUID = crypto.randomUUID();
      const { error: insertPipelineHandshakeError } = await insertSalaryAnalysis({
        id: targetAnalysisIdUUID,
        user_id: userAuthRecord?.id || null,
        talent_id: talentProfileRecord?.id || null,
        full_name: fullNameState.trim(),
        email: candidateEmailState.trim().toLowerCase(),
        phone: phoneInputStr.trim() ? `+880${phoneInputStr.trim()}` : null,
        job_title: jobTitleInputStr.trim() || null,
        company_name: companyNameInputStr.trim() || null,
        job_description: jobDescriptionInputStr.trim(),
        cv_text: cvTextInputStr.trim() || null,
        cv_url: cvSecureUrlStr || null,
        profession_category_id: selectedProfessionId || null,
        status: "pending",
      });

      if (insertPipelineHandshakeError) throw insertPipelineHandshakeError;
      if (talentProfileRecord?.id) await addServiceUsed("salary_analysis");

      toast({ title: "Market Evaluation Run Initiated" });
      recordToolRun({
        toolKey: "salary",
        costCredits: 50,
        payload: { analysis_id: targetAnalysisIdUUID, job_title: jobTitleInputStr },
      });
      navigateHook(`/salary-analysis/processing/${targetAnalysisIdUUID}`);
    } catch (fatalMutationException) {
      toast({
        title: "Pipeline Handshake Terminated",
        description: "Secure transaction token verification logic interrupted. Re-submit data parameters.",
        variant: "destructive",
      });
    } finally {
      setIsSubmissionPending(false);
    }
  };

  const handleReturnToHubRedirect = React.useCallback(() => {
    navigateHook("/app/services");
  }, [navigateHook]);

  const handleCloseCreditGateModal = React.useCallback(() => {
    setIsCreditGateOpen(false);
  }, []);

  const handleOpenPurchaseSheetFromModal = React.useCallback(() => {
    setIsCreditGateOpen(false);
    setIsCreditPurchaseSheetOpen(true);
  }, []);

  const handleClosePurchaseSheet = React.useCallback(() => {
    setIsCreditPurchaseSheetOpen(false);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 text-left antialiased block transform-gpu w-full pb-24">
      {/* HUD LEVEL 1: OVERVIEW COMPLIANCE INTERFACE NAVIGATION BAR */}
      <header className="flex items-center justify-between select-none leading-none w-full shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="group rounded-lg h-9 px-3 border border-border/5 font-mono text-[10px] font-extrabold uppercase tracking-wide hover:bg-muted cursor-pointer"
          onClick={handleReturnToHubRedirect}
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5 stroke-[2.5] transition-transform group-hover:-translate-x-0.5" />
          <span>Return to Dashboard Hub</span>
        </Button>
        <Badge
          variant="outline"
          className="font-mono text-[9px] font-extrabold uppercase px-2 h-5 tracking-wide rounded bg-primary/5 text-primary border-primary/20 shrink-0 pointer-events-none leading-none pt-0.5"
        >
          Telemetry Analysis Node: v2.6 Stacked
        </Badge>
      </header>

      <ProfileCompletionPrompt
        variant="banner"
        className="rounded-xl border border-dashed border-primary/20 bg-card/10 block w-full shadow-none"
      />

      {/* HUD LEVEL 2: COMPOSITE DISCOVERY HEADER PANELS */}
      <div className="text-center max-w-lg mx-auto space-y-2 select-none pointer-events-none leading-none pb-2 block">
        <div className="h-11 w-11 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-center mx-auto rotate-2 shadow-2xs text-primary shrink-0">
          <Target className="h-5 w-5 stroke-[2.2]" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground leading-none pt-1">
          Market Intelligence Salary Synthesis
        </h1>
        <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 leading-normal block max-w-sm mx-auto">
          Deploy algorithmic salary benchmarking metrics mapping candidate credentials against specialized enterprise
          vacancy blueprints.
        </p>
      </div>

      {/* HUD LEVEL 3: INPUT OPERATIONAL CARD COMPONENT STRUCTURES */}
      <Card className="rounded-lg border border-border/60 bg-card/40 overflow-hidden block w-full shadow-none">
        <CardHeader className="p-4 border-b border-border/5 bg-muted/20 flex flex-row items-center justify-between w-full select-none shrink-0 leading-none">
          <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground leading-none flex items-center gap-2 m-0">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 stroke-[2.2]" />
            <span>Evaluation Parameter Inputs Matrix</span>
          </CardTitle>

          <div className="flex items-center gap-1.5 font-mono text-[9px] font-extrabold px-2 h-5 tracking-wide uppercase bg-primary/5 text-primary border border-primary/10 rounded shadow-3xs pt-0.5 leading-none select-none pointer-events-none shrink-0">
            <Coins className="h-3 w-3 stroke-[2] shrink-0 text-primary" />
            <span>{SALARY_ANALYSIS_COST.toString()} Credits Fee</span>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 block w-full space-y-6 leading-none">
          {/* SECTION A: INDIVIDUAL MONIKER CREDENTIAL IDENTITY TRACK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 block w-full">
            <div className="space-y-1 block leading-none">
              <Label className="font-mono text-[10px] font-extrabold uppercase text-primary tracking-wide block leading-none ml-0.5">
                Candidate Profiling Name
              </Label>
              <Input
                type="text"
                value={fullNameState}
                onChange={(e) => setFullNameState(e.target.value)}
                placeholder="Input legal registration entity nomenclature..."
                className="h-10 text-xs sm:text-sm bg-background/50 border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none"
              />
            </div>
            <div className="space-y-1 block leading-none">
              <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none ml-0.5">
                Electronic Communication Mail Node
              </Label>
              <Input
                type="email"
                value={candidateEmailState}
                onChange={(e) => setCandidateEmailState(e.target.value)}
                placeholder="uplink@domain-network.com"
                className="h-10 text-xs sm:text-sm bg-background/50 border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none"
              />
            </div>
          </div>

          {/* SECTION B: TARGET OCCUPATION FOCUS AND REPOS FILTERING */}
          <div className="space-y-4 block w-full leading-none">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 block w-full">
              <div className="space-y-1 block leading-none">
                <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none ml-0.5">
                  Target Role Designation
                </Label>
                <Input
                  type="text"
                  value={jobTitleInputStr}
                  onChange={(e) => setJobTitleInputStr(e.target.value)}
                  placeholder="e.g. Lead Platform Engineer"
                  className="h-10 text-xs sm:text-sm bg-background/50 border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none"
                />
              </div>
              <div className="space-y-1 block leading-none">
                <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none ml-0.5">
                  Specialty Vertical Sector Alignment
                </Label>
                <Select value={selectedProfessionId} onValueChange={setSelectedProfessionId}>
                  <SelectTrigger className="h-10 font-sans text-xs sm:text-sm rounded-lg border border-border/40 bg-background/50 shadow-none">
                    <SelectValue placeholder="Identify specialized vertical industry discipline..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border border-border/60 bg-popover text-popover-foreground">
                    {professionCategoriesArray.map((catNode) => (
                      <SelectItem
                        key={`profession-select-node-${catNode.id}`}
                        value={catNode.id}
                        className="text-xs font-semibold"
                      >
                        {catNode.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1 block leading-none pt-1">
              <Label className="font-mono text-[10px] font-extrabold uppercase text-primary tracking-wide block leading-none ml-0.5">
                Target Corporate Vacancy Blueprint Description
              </Label>
              <Textarea
                value={jobDescriptionInputStr}
                onChange={(e) => setJobDescriptionInputStr(e.target.value)}
                placeholder="Paste the complete text schema of the targeted role specifications here to calibrate telemetry loops..."
                className="min-h-[140px] font-sans text-xs sm:text-sm font-medium leading-relaxed bg-muted/10 border border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-lg p-3 resize-none shadow-none"
              />
            </div>
          </div>

          {/* SECTION C: CREDENTIALS PORTFOLIO SYNTHESIS PANEL CHANNELS */}
          <div className="space-y-2 block w-full leading-none pt-1">
            <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none ml-0.5">
              Candidate Experience Portfolio Registry (CV)
            </Label>

            <Tabs value={cvInputMode} onValueChange={(v) => setCvInputMode(v as any)} className="w-full block">
              <TabsList className="grid w-full grid-cols-3 p-1 h-10 bg-muted/40 rounded-lg border border-border/10 select-none mb-4">
                {hasExistingCvOnFile && (
                  <TabsTrigger
                    value="existing"
                    className="rounded-md font-mono text-[9px] font-extrabold uppercase tracking-wider h-8 border border-transparent data-[state=active]:bg-background data-[state=active]:border-border/10 data-[state=active]:text-foreground data-[state=active]:shadow-2xs transition-all cursor-pointer outline-none pt-0.5 gap-1.5"
                  >
                    <FileCheck className="h-3.5 w-3.5 stroke-[2]" /> <span>Reuse CV</span>
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="text"
                  className="rounded-md font-mono text-[9px] font-extrabold uppercase tracking-wider h-8 border border-transparent data-[state=active]:bg-background data-[state=active]:border-border/10 data-[state=active]:text-foreground data-[state=active]:shadow-2xs transition-all cursor-pointer outline-none pt-0.5 gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5 stroke-[2]" /> <span>Text Paste</span>
                </TabsTrigger>
                <TabsTrigger
                  value="file"
                  className="rounded-md font-mono text-[9px] font-extrabold uppercase tracking-wider h-8 border border-transparent data-[state=active]:bg-background data-[state=active]:border-border/10 data-[state=active]:text-foreground data-[state=active]:shadow-2xs transition-all cursor-pointer outline-none pt-0.5 gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5 stroke-[2.2]" /> <span>Upload Disk</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="existing"
                className="mt-2 block w-full animate-in fade-in duration-150 outline-none focus:outline-none"
              >
                <ExistingCVCard
                  talent={talentProfileRecord}
                  onUseExisting={() => {
                    if (talentProfileRecord?.cvUrl) setCvSecureUrlStr(talentProfileRecord.cvUrl);
                    if (talentProfileRecord?.cvText) setCvTextInputStr(talentProfileRecord.cvText);
                  }}
                  onUploadNew={() => {
                    /* Safe placeholder override logic paths */
                  }}
                />
              </TabsContent>

              <TabsContent
                value="text"
                className="mt-2 block w-full animate-in fade-in duration-150 outline-none focus:outline-none"
              >
                <Textarea
                  placeholder="Paste complete layout history text parameters directly onto this input panel sandbox..."
                  value={cvTextInputStr}
                  onChange={(e) => setCvTextInputStr(e.target.value)}
                  className="min-h-[180px] font-sans text-xs sm:text-sm font-medium leading-relaxed bg-muted/10 border border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-lg p-3 resize-none shadow-none"
                />
              </TabsContent>

              <TabsContent value="file" className="mt-2 block w-full outline-none focus:outline-none">
                <div className="border border-dashed border-border/80 rounded-lg p-8 text-center bg-muted/5 hover:bg-primary/[0.01] transition-all group cursor-pointer relative overflow-hidden block w-full h-32 flex flex-col justify-center">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => e.target.files?.[0] && handleSecureCVStorageUploadSequence(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 block"
                  />
                  {isCVStorageUploading ? (
                    <div className="space-y-2 block w-full select-none pointer-events-none">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary stroke-[2.5]" />
                      <p className="font-mono text-[9px] font-black uppercase tracking-widest text-primary animate-pulse leading-none pt-1">
                        Hashing Document Node...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 block w-full select-none pointer-events-none leading-none">
                      <div className="h-9 w-9 bg-background border border-border/40 rounded-lg flex items-center justify-center mx-auto group-hover:scale-105 transition-transform shadow-3xs shrink-0 text-muted-foreground/40">
                        <Upload className="h-4.5 w-4.5 stroke-[2]" />
                      </div>
                      <div className="space-y-0.5 block">
                        <p className="text-xs font-bold uppercase tracking-tight text-foreground truncate block max-w-xs mx-auto">
                          {cvFileState ? cvFileState.name : "Select Resume Specification File"}
                        </p>
                        <p className="font-mono text-[9px] font-bold text-muted-foreground/30 uppercase tracking-wide block leading-none">
                          Isolated PDF, DOC or DOCX Allocation • Cap Limit Constraint: 10.0 MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* LOWER GRID BUTTON CONTROLLERS DISPATCH BAR */}
          <Button
            type="button"
            className="w-full h-11 rounded-lg font-bold uppercase text-xs tracking-wider gap-2 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs transform-gpu active:scale-[0.985] block relative overflow-hidden"
            onClick={handleCommitSalaryAnalysisSequence}
            disabled={isSubmissionPending}
          >
            {isSubmissionPending ? (
              <div className="flex items-center justify-center gap-1.5 leading-none mx-auto">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-primary-foreground stroke-[2.5]" />
                <span className="pt-0.5">Authorizing Model Computation passes...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 leading-none mx-auto">
                <Zap className="h-4 w-4 fill-current stroke-[1.5] shrink-0 text-primary-foreground" />
                <span>Confirm Transaction Parameters & Process</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      <CreditGateModal
        isOpen={isCreditGateOpen}
        onClose={handleCloseCreditGateModal}
        onConfirm={handleCloseCreditGateModal}
        onBuyCredits={handleOpenPurchaseSheetFromModal}
        serviceName="Salary Synthesis Market Diagnostic"
        cost={SALARY_ANALYSIS_COST}
        currentBalance={balance}
      />
      <CreditPurchaseSheet
        isOpen={isCreditPurchaseSheetOpen}
        onClose={handleClosePurchaseSheet}
        currentBalance={balance}
      />
    </div>
  );
}
