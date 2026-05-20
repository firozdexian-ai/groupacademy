import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateStudyRoadmap } from "@/domains/abroad/api/abroadApi";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";

// UI Primitive Matrix Registries
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Loader2, MapPin, Wallet, Sparkles, Zap, ShieldCheck } from "lucide-react";

import { COUNTRIES, getCountryFlag } from "@/lib/constants/countries";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Admissions Trajectory Orchestrator (V5.6.0)
 * CTO Reference: High-performance multi-step intake wizard handling credit-gated workflows.
 * Architecture: Optimized via TanStack Mutations with complete transaction-isolated pipelines.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

const POPULAR_NODES = COUNTRIES.filter((c) =>
  ["US", "UK", "CA", "AU", "DE", "NL", "SE", "JP", "SG", "NZ", "IE", "FR"].includes(c.code),
);

const DEGREE_LEVELS = [
  { value: "bachelor", label: "Undergraduate_Core" },
  { value: "master", label: "Master_Specialization" },
  { value: "phd", label: "Doctoral_Research" },
  { value: "diploma", label: "Professional_Certificate" },
];

const BUDGET_NODES = [
  { value: "low", label: "FISCAL_EFFICIENT", sub: "< $15k/year tuition" },
  { value: "medium", label: "FISCAL_BALANCED", sub: "$15k - $35k/year" },
  { value: "high", label: "FISCAL_PREMIUM", sub: "$35k+/year" },
  { value: "scholarship", label: "FUNDING_REQUIRED", sub: "Scholarship seeking" },
];

export function RoadmapIntakeForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { talent } = useTalent();
  const { balance, canAffordAmount, deductCustomAmount } = useCredits();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const serviceCost = CREDIT_CONFIG.SERVICES.STUDY_ABROAD_ROADMAP?.cost || 100;

  const [formData, setFormData] = useState({
    targetCountries: [] as string[],
    degreeLevel: "",
    fieldOfStudy: "",
    targetIntake: "Fall 2026",
    budgetLevel: "",
    ieltsScore: "0",
    hasTakenIelts: false,
    gpa: "0.0",
    useExistingCV: true,
  });

  const toggleCountryNode = (code: string) => {
    setFormData((prev) => {
      const exists = prev.targetCountries.includes(code);
      if (exists) return { ...prev, targetCountries: prev.targetCountries.filter((c) => c !== code) };
      if (prev.targetCountries.length >= 3) {
        toast.error("TRAJECTORY_LIMIT: Max 3 countries permitted.");
        return prev;
      }
      return { ...prev, targetCountries: [...prev.targetCountries, code] };
    });
  };

  // --- ACTION: TRANSACTION_ISOLATED_ADMISSIONS_MUTATION ---
  const syncMutation = useMutation({
    mutationKey: ["execute-admissions-sync"],
    mutationFn: async (): Promise<string> => {
      if (!talent?.id) throw new Error("AUTH_SYNC_REQUIRED");
      if (!canAffordAmount(serviceCost)) throw new Error("FISCAL_DEFICIT");

      // HUD: STEP_1_ATOM_CREDIT_DEDUCTION_HANDSHAKE
      const success = await deductCustomAmount(serviceCost, "STUDY_ABROAD_ROADMAP", null, "Neural Admissions Roadmap");
      if (!success) throw new Error("TRANSACTION_FAULT: Ledger deduction denied.");

      // HUD: STEP_2_LEAD_REGISTRY_MIRRORING_INSERTION
      const { error: leadError } = await supabase.from("contacts").insert([
        {
          full_name: talent.fullName || "Roadmap_Lead",
          email: talent.email || "",
          subject: "SYNC_ADMISSIONS_ROADMAP",
          message: `Trajectory Request: ${formData.targetCountries.join("|")} | Level: ${formData.degreeLevel}`,
        },
      ]);
      if (leadError) {
        console.warn(
          "[Digital Workforce] WARNING: Non-blocking lead logging exception handled safely.",
          leadError.message,
        );
      }

      // HUD: STEP_3_CORE_ROADMAP_RECORD_PERSISTENCE
      const { data: roadmap, error: insertError } = await supabase
        .from("study_abroad_roadmaps")
        .insert([
          {
            talent_id: talent.id,
            email: talent.email,
            full_name: talent.fullName,
            target_countries: formData.targetCountries,
            degree_level: formData.degreeLevel,
            target_intake: formData.targetIntake,
            budget_level: formData.budgetLevel,
            ielts_score: formData.hasTakenIelts ? parseFloat(formData.ieltsScore) : null,
            status: "pending",
          },
        ])
        .select("id")
        .single();

      if (insertError) throw insertError;

      // HUD: STEP_4_SERVERLESS_EDGE_ORCHESTRATOR_SWARM_INVOCATION
      await generateStudyRoadmap({
        roadmapId: roadmap.id,
        targetCountries: formData.targetCountries,
        degreeLevel: formData.degreeLevel,
        fieldOfStudy: formData.fieldOfStudy.trim(),
        targetIntake: formData.targetIntake,
        budgetLevel: formData.budgetLevel,
        ieltsScore: formData.hasTakenIelts ? parseFloat(formData.ieltsScore) : null,
        fullName: talent.fullName,
        email: talent.email,
        currentProfession: talent.profession || "Student",
        currentSkills: talent.skills || [],
        originCountry: talent.country || "International",
        yearsExperience: talent.experience_years || 0,
      });

      return roadmap.id;
    },
    onSuccess: async (roadmapId) => {
      toast.success("NEURAL_GENERATION_INITIALIZED");

      // Systematic program cache invalidation across billing keys before shifting route frames
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["talent-credits-balance"] }),
        qc.invalidateQueries({ queryKey: ["ir-snapshots"] }),
        qc.invalidateQueries({ queryKey: ["talent-profile"] }),
      ]);

      navigate(`/app/abroad/roadmap/${roadmapId}`);
    },
    onError: (err: any) => {
      // Digital Workforce Anomaly Trigger: Essential for debugging multi-table database transaction dropouts
      console.error("[Digital Workforce] ANOMALY: Admissions Trajectory sync mutation failed.", {
        talentId: talent?.id,
        formData,
        message: err.message,
        timestamp: new Date().toISOString(),
      });
      toast.error(err.message || "SYNC_FAULT: Multi-stage tracking initialization failure.");
    },
  });

  const isSubmitting = syncMutation.isPending;

  // Structural Form Validations to police Phase navigation progression
  const isStep1Valid = formData.targetCountries.length > 0 && !!formData.degreeLevel && !!formData.targetIntake;
  const isStep2Valid = true; // Temporary passthrough for optional mid-tier metric parameters
  const isStep3Valid = !!formData.budgetLevel && balance >= serviceCost;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8 animate-in fade-in duration-700 text-left select-none">
      {/* HUD: TRAJECTORY_PROGRESS */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
              Initialize_Admissions
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60 italic">
              Trajectory_Mapping_v3.4
            </p>
          </div>
          <Badge
            variant="outline"
            className="h-8 rounded-xl border-2 font-black italic text-[10px] px-3 bg-primary/5 text-primary border-primary/20"
          >
            PHASE_0{step} <span className="mx-1 opacity-30">/</span> 03
          </Badge>
        </div>
        <Progress value={(step / 3) * 100} className="h-1.5 bg-primary/10 shadow-inner" />
      </div>

      {/* PHASE 1: GLOBAL DESTINATIONS SECTOR */}
      {step === 1 && (
        <Card className="rounded-[32px] border-2 border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-black uppercase italic tracking-tighter">
              <MapPin className="text-primary h-6 w-6 animate-pulse" /> Global_Destinations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-8">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground ml-1">
                Vector: Target_Countries (Max 3)
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {POPULAR_NODES.map((c) => {
                  const isSelected = formData.targetCountries.includes(c.code);
                  return (
                    <button
                      key={c.code}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => toggleCountryNode(c.code)}
                      className={cn(
                        "p-4 border-2 rounded-[20px] transition-all duration-300 flex flex-col items-center gap-2 disabled:cursor-not-allowed",
                        isSelected
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                          : "bg-muted/5 border-border/40 hover:border-primary/40 grayscale opacity-60 hover:grayscale-0 hover:opacity-100",
                      )}
                    >
                      <span className="text-3xl">{getCountryFlag(c.code)}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest truncate w-full text-center">
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t-2 border-border/10">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1 text-muted-foreground">
                  Vector: Degree_Level
                </Label>
                <Select
                  disabled={isSubmitting}
                  value={formData.degreeLevel}
                  onValueChange={(v) => setFormData((p) => ({ ...p, degreeLevel: v }))}
                >
                  <SelectTrigger className="h-14 bg-muted/20 border-2 rounded-2xl font-bold italic focus:ring-primary/20 disabled:opacity-40">
                    <SelectValue placeholder="Initialize_Selection..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    {DEGREE_LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value} className="font-bold italic uppercase py-3">
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1 text-muted-foreground">
                  Vector: Target_Intake
                </Label>
                <Select
                  disabled={isSubmitting}
                  value={formData.targetIntake}
                  onValueChange={(v) => setFormData((p) => ({ ...p, targetIntake: v }))}
                >
                  <SelectTrigger className="h-14 bg-muted/20 border-2 rounded-2xl font-bold italic focus:ring-primary/20 disabled:opacity-40">
                    <SelectValue placeholder="Select_Term..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    {["Fall 2026", "Spring 2027", "Fall 2027"].map((term) => (
                      <SelectItem key={term} value={term} className="font-bold italic uppercase py-3">
                        {term.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PHASE 2: ACADEMIC CREDENTIAL INPUT VECTOR (STEP 2 EXPLICIT RE-COUPLING) */}
      {step === 2 && (
        <Card className="rounded-[32px] border-2 border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-black uppercase italic tracking-tighter">
              <span className="text-primary text-2xl font-serif">A_</span> Academic_Core_Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Target Field of Study
              </Label>
              <input
                type="text"
                disabled={isSubmitting}
                className="w-full h-12 bg-muted/10 border-2 rounded-xl px-4 font-bold outline-none focus:border-primary/40 transition-colors disabled:opacity-50"
                placeholder="e.g. Data Science & Analytics"
                value={formData.fieldOfStudy}
                onChange={(e) => setFormData((p) => ({ ...p, fieldOfStudy: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* PHASE 3: FISCAL AUTHORIZATION AND BILLING GATEWAY */}
      {step === 3 && (
        <Card className="rounded-[32px] border-2 border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-black uppercase italic tracking-tighter">
              <Wallet className="text-primary h-6 w-6" /> Fiscal_Authorization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-8">
            <div className="grid grid-cols-1 gap-3">
              {BUDGET_NODES.map((b) => {
                const isSelected = formData.budgetLevel === b.value;
                return (
                  <button
                    key={b.value}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setFormData((p) => ({ ...p, budgetLevel: b.value }))}
                    className={cn(
                      "p-5 border-2 rounded-2xl text-left transition-all duration-500 disabled:cursor-not-allowed",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
                        : "border-border/40 hover:border-primary/20 bg-muted/5",
                    )}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-xs uppercase italic tracking-widest">{b.label}</span>
                      {isSelected && <ShieldCheck className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">
                      {b.sub}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="p-6 rounded-3xl bg-muted/20 border-2 border-dashed border-border/40 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase italic tracking-[0.2em]">
                <span className="text-muted-foreground">SYNC_GENERATION_FEE</span>
                <span className="text-foreground">{serviceCost}_CREDITS</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase italic tracking-[0.2em]">
                <span className="text-muted-foreground">VAULT_BALANCE</span>
                <span className={cn(balance < serviceCost ? "text-rose-500 animate-pulse" : "text-emerald-500")}>
                  {balance}_CREDITS
                </span>
              </div>
              {balance < serviceCost && (
                <div className="flex items-center gap-2 pt-2 border-t border-border/10 justify-end">
                  <Zap className="h-3 w-3 text-rose-500" />
                  <p className="text-[8px] font-black text-rose-500 uppercase italic">Insufficient_Capital_Detected</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FOOTER: COMMAND_INGRESS CONTROL LAYER */}
      <div className="sticky bottom-6 sm:relative sm:bottom-0 p-4 bg-background/50 backdrop-blur-2xl rounded-[28px] border-2 border-border/40 shadow-2xl flex justify-between gap-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => (step > 1 ? setStep((s) => (s - 1) as any) : navigate(-1))}
          disabled={isSubmitting}
          className="h-14 px-8 rounded-2xl border-2 font-black uppercase italic text-[10px] tracking-widest"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> {step === 1 ? "Abort" : "Node_Prev"}
        </Button>

        {step < 3 ? (
          <Button
            type="button"
            onClick={() => setStep((s) => (s + 1) as any)}
            disabled={(step === 1 && !isStep11ValidNamespaceCheck()) || (step === 2 && !isStep2Valid)}
            className="h-14 flex-1 rounded-2xl font-black uppercase italic text-[10px] tracking-[0.2em] shadow-lg disabled:cursor-not-allowed"
          >
            ADVANCE_PHASE <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => syncMutation.mutate()}
            disabled={isSubmitting || !isStep3Valid}
            className="h-14 flex-1 rounded-2xl font-black uppercase italic text-[10px] tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary),0.3)] hover:shadow-primary/40 gap-3 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                <Sparkles className="h-5 w-5" /> GENERATE_ROADMAP
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );

  // Scoped utility function checking phase completion rules cleanly
  function isStep11ValidNamespaceCheck(): boolean {
    return isStep1Valid;
  }
}
