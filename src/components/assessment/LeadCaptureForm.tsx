import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { ArrowLeft, Loader2, Lock, AlertCircle, RefreshCw, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useTalent } from "@/hooks/useTalent";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Assessment Data Ingress Form
 * CTO Reference: Authoritative node for talent identity sync and assessment commitment.
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
  answers,
  onComplete,
  onBack,
}: LeadCaptureFormProps) {
  const navigate = useNavigate();
  const { talent, user } = useTalent();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: email,
    phone: "",
    countryCode: "+880",
    country: "BD",
    whatsapp_opt_in: true,
    terms_accepted: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // PROTOCOL: Profile Ingress Auto-Fill
  useEffect(() => {
    if (talent) {
      setFormData((prev) => ({
        ...prev,
        full_name: prev.full_name || talent.fullName || "",
        email: prev.email || talent.email || email,
        phone: prev.phone || talent.phone || "",
        countryCode: talent.countryCode || prev.countryCode,
        country: talent.country || prev.country,
      }));
    }
  }, [talent, email]);

  const executeQuantitativeScoring = () => {
    let totalScore = 0;
    let maxScore = 0;

    Object.entries(answers).forEach(([_, answer]) => {
      if (typeof answer === "number") {
        totalScore += answer;
        maxScore += 10;
      } else if (typeof answer === "string") {
        totalScore += 3; // Median placement
        maxScore += 5;
      } else if (Array.isArray(answer)) {
        totalScore += answer.length * 2;
        maxScore += 10;
      }
    });

    return {
      totalScore: Math.round(totalScore),
      maxScore: Math.round(maxScore),
      percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
    };
  };

  const mapReadinessTrajectory = (p: number): "beginner" | "developing" | "competent" | "proficient" | "expert" => {
    if (p >= 90) return "expert";
    if (p >= 75) return "proficient";
    if (p >= 60) return "competent";
    if (p >= 40) return "developing";
    return "beginner";
  };

  const handleRegistryCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formData.terms_accepted) return toast.error("AUTHORIZATION_REQUIRED: Accept terms to proceed.");

    const validation = leadRegistrySchema.safeParse(formData);
    if (!validation.success) {
      const errNodes: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errNodes[err.path[0] as string] = err.message;
      });
      setFieldErrors(errNodes);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const metrics = executeQuantitativeScoring();
      const trajectory = mapReadinessTrajectory(metrics.percentage);
      const nodeID = crypto.randomUUID();
      const contactVector = formData.countryCode + formData.phone;

      const { error } = await withTimeout(
        Promise.resolve(
          supabase.from("career_assessments").insert({
            id: nodeID,
            user_id: user?.id || null,
            talent_id: talent?.id || null,
            profession_category_id: categoryId,
            full_name: formData.full_name.trim(),
            email: formData.email.toLowerCase().trim(),
            phone: contactVector.trim(),
            answers: answers,
            total_score: metrics.totalScore,
            max_score: metrics.maxScore,
            percentage: metrics.percentage,
            readiness_level: trajectory,
            improvement_areas: [],
          }),
        ),
        TIMEOUTS.AI_GENERATION,
        "SYNC_TIMEOUT",
      );

      if (error) throw error;

      onComplete();
      toast.success("DIAGNOSTIC_SYNC_COMPLETE");
      navigate(`/assessment-results/${nodeID}`);
    } catch (err: any) {
      const msg = err.code === "23505" ? "Registry collision: Email already exists." : "Sync Fault: Ingress failed.";
      setSubmitError(msg);
      toast.error(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 animate-in slide-in-from-bottom-4 duration-1000 text-left">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-8 rounded-xl font-black uppercase italic text-[10px] tracking-widest gap-2"
        disabled={submitting}
      >
        <ArrowLeft className="h-4 w-4" /> REVERT_TO_DIAGNOSTIC
      </Button>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
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
          {submitError && (
            <div className="p-5 bg-rose-500/5 border-2 border-rose-500/20 rounded-[22px] animate-in shake-2">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-rose-500 mt-1" />
                <div className="space-y-3 flex-1">
                  <p className="text-xs font-black uppercase italic text-rose-500 tracking-widest">{submitError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegistryCommit(new Event("submit") as any)}
                    className="h-9 rounded-lg border-2 font-black uppercase italic text-[9px] tracking-widest gap-2"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> ATTEMPT_RE_SYNC
                  </Button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleRegistryCommit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground ml-1">
                  Identity: Full_Name *
                </Label>
                <Input
                  placeholder="Initialize name entry..."
                  value={formData.full_name}
                  className="h-14 bg-muted/20 border-2 rounded-2xl font-bold italic focus:ring-primary/20"
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={submitting}
                />
                {fieldErrors.full_name && (
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1">
                    {fieldErrors.full_name}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground ml-1">
                  Identity: Contact_Email *
                </Label>
                <Input
                  type="email"
                  placeholder="Initialize email sync..."
                  value={formData.email}
                  className="h-14 bg-muted/20 border-2 rounded-2xl font-bold italic focus:ring-primary/20"
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={submitting}
                />
                {fieldErrors.email && (
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground ml-1">
                  Identity: Contact_Phone *
                </Label>
                <PhoneInput
                  value={formData.phone}
                  countryCode={formData.countryCode}
                  onValueChange={(p) => setFormData((v) => ({ ...v, phone: p }))}
                  onCountryCodeChange={(c, ct) => setFormData((v) => ({ ...v, countryCode: c, country: ct }))}
                  disabled={submitting}
                />
                {fieldErrors.phone && (
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div
                className="flex items-start space-x-4 p-4 rounded-2xl border-2 border-border/10 bg-muted/5 group cursor-pointer"
                onClick={() => !submitting && setFormData((v) => ({ ...v, whatsapp_opt_in: !v.whatsapp_opt_in }))}
              >
                <Checkbox
                  id="whatsapp"
                  checked={formData.whatsapp_opt_in}
                  className="h-5 w-5 rounded-lg border-2 mt-0.5"
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
                className="flex items-start space-x-4 p-4 rounded-2xl border-2 border-border/10 bg-muted/5 group cursor-pointer"
                onClick={() => !submitting && setFormData((v) => ({ ...v, terms_accepted: !v.terms_accepted }))}
              >
                <Checkbox id="terms" checked={formData.terms_accepted} className="h-5 w-5 rounded-lg border-2 mt-0.5" />
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

            <Button
              type="submit"
              size="xl"
              className="w-full h-16 rounded-[24px] font-black uppercase italic tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary),0.2)] hover:shadow-primary/40 transition-all active:scale-95 gap-3"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  INITIALIZING_SYNC...
                </>
              ) : (
                <>
                  INITIALIZE_REPORT_GEN <Zap className="h-5 w-5" />
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-3 py-2 opacity-30">
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
