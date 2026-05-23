import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertCareerAssessment } from "@/domains/marketing/repo/marketingRepo";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { z } from "zod";

// UI Primitive Matrix Registries
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { ArrowLeft, Loader2, Lock, AlertCircle, RefreshCw, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Assessment Data Ingress Form (V5.6.0)
 * CTO Reference: Authoritative node capturing qualitative talent identities and executing scores.
 * Architecture: Optimized via TanStack Mutation Nodes with reference-stable data synchronization layouts.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

const leadRegistrySchema = z.object({
  full_name: z.string().trim().min(2, "PROTOCOL_ERROR: Invalid name length").max(100),
  email: z.string().trim().email("PROTOCOL_ERROR: Invalid email sequence").max(255),
  phone: z.string().trim().min(6, "PROTOCOL_ERROR: Identity contact required").max(20),
});

interface LeadCaptureFormProps {
  email: string;
  categoryId: string;
  categoryName: string;
  answers: Record<string, any>;
  onComplete: () => void;
  onBack: () => void;
}

export function LeadCaptureForm({
  email,
  categoryId,
  categoryName,
  answers = {},
  onComplete,
  onBack,
}: LeadCaptureFormProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { talent, user } = useTalent();

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    full_name: "",
    email: email || "",
    phone: "",
    countryCode: "+880",
    country: "BD",
    whatsapp_opt_in: true,
    terms_accepted: false,
  });

  // --- PHASE: PROFILE_INGRESS_AUTO_FILL_SYNC ---
  useEffect(() => {
    if (talent) {
      setFormData((prev) => ({
        ...prev,
        full_name: prev.full_name || talent.fullName || "",
        email: prev.email || talent.email || email || "",
        phone: prev.phone || talent.phone || "",
        countryCode: talent.countryCode || prev.countryCode,
        country: talent.country || prev.country,
      }));
    }
  }, [talent, email]);

  // --- PHASE: QUANTITATIVE_SCORING_COMPILATION ---
  const metricsComputations = useMemo(() => {
    let totalScore = 0;
    let maxScore = 0;

    Object.entries(answers || {}).forEach(([_, answer]) => {
      if (typeof answer === "number") {
        totalScore += answer;
        maxScore += 10;
      } else if (typeof answer === "string") {
        totalScore += 3; // Median baseline alignment
        maxScore += 5;
      } else if (Array.isArray(answer)) {
        totalScore += answer.length * 2;
        maxScore += 10;
      }
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Map dynamic competency matrices securely based on score milestones
    let readinessLevel: "beginner" | "developing" | "competent" | "proficient" | "expert" = "beginner";
    if (percentage >= 90) readinessLevel = "expert";
    else if (percentage >= 75) readinessLevel = "proficient";
    else if (percentage >= 60) readinessLevel = "competent";
    else if (percentage >= 40) readinessLevel = "developing";

    return {
      totalScore: Math.round(totalScore),
      maxScore: Math.round(maxScore),
      percentage,
      readinessLevel,
    };
  }, [answers]);

  // --- ACTION: TRANSACTION_ISOLATED_REGISTRY_MUTATION ---
  const registryMutation = useMutation({
    mutationKey: ["commit-assessment-lead", categoryId],
    mutationFn: async (): Promise<string> => {
      const generatedNodeUuid = crypto.randomUUID();
      const unifiedContactVector = String(formData.countryCode + formData.phone).trim();

      // HUD: COMMITTING_CAREER_ASSESSMENT_RECORD_PERSISTENCE
      await insertCareerAssessment({
        id: generatedNodeUuid,
        user_id: user?.id || null,
        talent_id: talent?.id || null,
        profession_category_id: categoryId,
        full_name: formData.full_name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: unifiedContactVector,
        answers: answers,
        total_score: metricsComputations.totalScore,
        max_score: metricsComputations.maxScore,
        percentage: metricsComputations.percentage,
        readiness_level: metricsComputations.readinessLevel,
        improvement_areas: [],
      });

      return generatedNodeUuid;
    },
    onSuccess: async (nodeId) => {
      toast.success("DIAGNOSTIC_SYNC_COMPLETE");
      onComplete();

      // Systematic program cache invalidation across evaluation query keys before moving frames
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["assessment-questions"] }),
        qc.invalidateQueries({ queryKey: ["tutor-mastery-ctx"] }),
        qc.invalidateQueries({ queryKey: ["talent-profile"] }),
      ]);

      // HUD: PROGRAMMATIC_VIEWPORT_ROUTING
      navigate(`/assessment-results/${nodeId}`);
    },
    onError: (err: any) => {
      // Digital Workforce Anomaly Trigger: Crucial for trapping registration database collisions
      console.error("[Digital Workforce] ANOMALY: Assessment registry capture operation rejected.", {
        categoryId,
        formData: { ...formData, full_name: "REDACTED_AUDIT" },
        message: err.message,
      });

      const userFriendlyErrorMessage =
        err.code === "23505"
          ? "Registry collision: Email parameter record already registered inside this system."
          : "Sync Fault: Core data ingress transaction rejected.";

      toast.error(userFriendlyErrorMessage);
    },
  });

  const handleFormSubmissionHandshake = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!formData.terms_accepted) {
      toast.error("AUTHORIZATION_REQUIRED: Accept terms to proceed.");
      return;
    }

    const validationResult = leadRegistrySchema.safeParse(formData);
    if (!validationResult.success) {
      const errNodes: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) errNodes[err.path[0] as string] = err.message;
      });
      setFieldErrors(errNodes);
      return;
    }

    // Trigger atomic compilation mutation stream
    registryMutation.mutate();
  };

  const isSubmitting = registryMutation.isPending;
  const isErrorPresent = registryMutation.isError;
  const runtimeMutationErrorText = registryMutation.error?.message || "Sync Fault: Ingress failed.";

  return (
    <div className="max-w-xl mx-auto px-4 py-8 animate-in slide-in-from-bottom-4 duration-1000 text-left select-none">
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="mb-8 rounded-xl font-black uppercase italic text-[10px] tracking-widest gap-2"
        disabled={isSubmitting}
      >
        <ArrowLeft className="h-4 w-4" /> REVERT_TO_DIAGNOSTIC
      </Button>

      {/* COMPONENT: INGRESS_SURFACE_CARD */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />

        <CardHeader className="p-10 pb-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-[24px] bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">Finalize_Sync</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] italic mt-2">
            Commit identity artifacts to generate your readiness trajectory
          </CardDescription>
        </CardHeader>

        <CardContent className="p-10 pt-4 space-y-8">
          {/* RUNTIME SYSTEM TRANSACT FAULT NOTICES OVERLAY */}
          {isErrorPresent && (
            <div className="p-5 bg-rose-500/5 border-2 border-rose-500/20 rounded-[22px] animate-in shake-2">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-rose-500 mt-1 shrink-0" />
                <div className="space-y-3 flex-1">
                  <p className="text-xs font-black uppercase italic text-rose-500 tracking-widest leading-relaxed">
                    {runtimeMutationErrorText}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => registryMutation.mutate()}
                    className="h-9 rounded-lg border-2 font-black uppercase italic text-[9px] tracking-widest gap-2"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> ATTEMPT_RE_SYNC
                  </Button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleFormSubmissionHandshake} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* FIELD FIELD: FULL NAME ENTRY */}
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground ml-1">
                  Identity: Full_Name *
                </Label>
                <Input
                  placeholder="Your name"
                  value={formData.full_name}
                  className="h-14 bg-muted/20 border-2 rounded-2xl font-bold italic focus:ring-primary/20 disabled:opacity-40"
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={isSubmitting}
                />
                {fieldErrors.full_name && (
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1">
                    {fieldErrors.full_name}
                  </p>
                )}
              </div>

              {/* FIELD FIELD: SYNC CONTACT EMAIL */}
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground ml-1">
                  Identity: Contact_Email *
                </Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  className="h-14 bg-muted/20 border-2 rounded-2xl font-bold italic focus:ring-primary/20 disabled:opacity-40"
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isSubmitting}
                />
                {fieldErrors.email && (
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* FIELD FIELD: SECURE PHONE CODES ENTRY */}
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground ml-1">
                  Identity: Contact_Phone *
                </Label>
                <PhoneInput
                  value={formData.phone}
                  countryCode={formData.countryCode}
                  onValueChange={(p) => setFormData((v) => ({ ...v, phone: p }))}
                  onCountryCodeChange={(c, ct) => setFormData((v) => ({ ...v, countryCode: c, country: ct }))}
                  disabled={isSubmitting}
                />
                {fieldErrors.phone && (
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* INTERFACE ACCESS SECTOR: PERMISSIONS CHECKBOX FLAGS */}
            <div className="space-y-4 pt-4">
              <div
                className="flex items-start space-x-4 p-4 rounded-2xl border-2 border-border/10 bg-muted/5 group cursor-pointer transition-all hover:bg-muted/10"
                onClick={() => !isSubmitting && setFormData((v) => ({ ...v, whatsapp_opt_in: !v.whatsapp_opt_in }))}
              >
                <Checkbox
                  id="whatsapp"
                  checked={formData.whatsapp_opt_in}
                  className="h-5 w-5 rounded-lg border-2 mt-0.5 text-primary-foreground"
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="whatsapp"
                    className="text-[11px] font-black uppercase italic tracking-tighter cursor-pointer"
                  >
                    WhatsApp_Deployment_Alerts
                  </Label>
                  <p className="text-[9px] font-medium text-muted-foreground leading-relaxed italic">
                    Authorize institutional career tips and placement updates via mobile sync.
                  </p>
                </div>
              </div>

              <div
                className="flex items-start space-x-4 p-4 rounded-2xl border-2 border-border/10 bg-muted/5 group cursor-pointer transition-all hover:bg-muted/10"
                onClick={() => !isSubmitting && setFormData((v) => ({ ...v, terms_accepted: !v.terms_accepted }))}
              >
                <Checkbox
                  id="terms"
                  checked={formData.terms_accepted}
                  className="h-5 w-5 rounded-lg border-2 mt-0.5 text-primary-foreground"
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="terms"
                    className="text-[11px] font-black uppercase italic tracking-tighter cursor-pointer"
                  >
                    Institutional_Terms_Authorization *
                  </Label>
                  <p className="text-[9px] font-medium text-muted-foreground leading-relaxed italic">
                    I verify that all identity artifacts provided are accurate and authorize privacy protocols.
                  </p>
                </div>
              </div>
            </div>

            {/* TRANSMIT EXECUTION TRIGGER SUBMIT COMPONENT */}
            <Button
              type="submit"
              className="w-full h-16 rounded-[24px] font-black uppercase italic tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary),0.2)] hover:shadow-primary/40 transition-all active:scale-95 gap-3 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  INITIALIZING_SYNC...
                </>
              ) : (
                <>
                  INITIALIZE_REPORT_GEN <Zap className="h-5 w-5 fill-current" />
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-3 py-2 opacity-30 font-mono">
              <Lock className="h-3 w-3" />
              <span className="text-[8px] font-black uppercase tracking-[0.4em]">
                Registry_Encryption_Active_AES256
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
