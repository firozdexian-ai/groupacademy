import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  FileCheck,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { ExistingCVCard } from "@/components/cv/ExistingCVCard";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Digital Asset Synthesis Node
 * High-fidelity portfolio request orchestration with automated credit/promo routing.
 * 2026 Standard: Executive Logic geometry and transaction-hardening.
 */

const FREE_PORTFOLIO_LIMIT = 1000;
const PORTFOLIO_COST = 500;

const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

type Step = "personal" | "cv" | "certificates" | "social" | "review";

interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
}

type CvInputMode = "upload" | "url" | "profile" | "existing";

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
    twitter?: string;
    website?: string;
    youtube?: string;
  };
  additionalNotes: string;
}

const emptyProfileData: ProfileData = {
  education: [],
  experience: [],
  skills: [],
  projects: [],
  achievements: [],
};

const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: "personal", label: "Identity", icon: <User className="h-4 w-4" /> },
  { id: "cv", label: "List", icon: <FileText className="h-4 w-4" /> },
  { id: "certificates", label: "Artifacts", icon: <Award className="h-4 w-4" /> },
  { id: "social", label: "Uplinks", icon: <Globe className="h-4 w-4" /> },
  { id: "review", label: "Connection", icon: <CheckCircle className="h-4 w-4" /> },
];

export default function AppPortfolioRequest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { talent, addServiceUsed } = useTalent();
  const { deductCredits, canAfford } = useCredits();

  const [currentStep, setCurrentStep] = useState<Step>("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string>("");
  const [professionCategories, setProfessionCategories] = useState<ProfessionCategory[]>([]);
  const [portfolioCount, setPortfolioCount] = useState<number | null>(null);

  const remainingFree = portfolioCount !== null ? Math.max(0, FREE_PORTFOLIO_LIMIT - portfolioCount) : 0;
  const isFreePromotion = remainingFree > 0;
  const hasExistingCv = !!talent?.cvUrl;

  const [formData, setFormData] = useState<FormData>({
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

  useEffect(() => {
    if (talent) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || talent.fullName || "",
        email: prev.email || talent.email || "",
        phone: prev.phone || talent.phone || "",
        professionCategoryId: prev.professionCategoryId || talent.professionCategoryId || "",
        cvUrl: prev.cvUrl || talent.cvUrl || "",
        socialLinks: { ...prev.socialLinks, linkedin: prev.socialLinks.linkedin || talent.linkedinUrl || "" },
        cvInputMode: talent.cvUrl ? "existing" : prev.cvInputMode,
      }));
    }
  }, [talent]);

  useEffect(() => {
    loadProfessionCategories();
    loadPortfolioCount();
  }, []);

  const loadPortfolioCount = async () => {
    try {
      const { count, error } = await supabase.from("portfolio_requests").select("*", { count: "exact", head: true });
      if (!error) setPortfolioCount(count || 0);
      else setPortfolioCount(FREE_PORTFOLIO_LIMIT + 1);
    } catch (err) {
      console.error("Tracking failure: Portfolio Count", err);
    }
  };

  const loadProfessionCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("profession_categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("display_order");
      if (!error && data) setProfessionCategories(data);
    } catch (err) {
      console.error("Tracking failure: Categories", err);
    }
  };

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const selectedCategory = professionCategories.find((c) => c.id === formData.professionCategoryId);
  const isOtherCategory = selectedCategory?.slug === "other";

  const effectiveCvUrl =
    formData.cvInputMode === "url"
      ? formData.cvExternalUrl
      : formData.cvInputMode === "existing"
        ? talent?.cvUrl || formData.cvUrl
        : formData.cvUrl;

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "personal":
        return !!(
          formData.fullName &&
          formData.email &&
          formData.phone &&
          formData.professionCategoryId &&
          (!isOtherCategory || formData.customProfession)
        );
      case "cv":
        if (formData.cvInputMode === "upload") return !!formData.cvUrl;
        if (formData.cvInputMode === "url")
          return !!formData.cvExternalUrl && formData.cvExternalUrl.startsWith("http");
        if (formData.cvInputMode === "existing") return !!talent?.cvUrl;
        return formData.profileData.education.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) setCurrentStep(steps[nextIndex].id);
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) setCurrentStep(steps[prevIndex].id);
  };

  const handleSubmit = async () => {
    if (!talent?.id) {
      toast({ title: "Auth Required", description: "Node access denied. Please login.", variant: "destructive" });
      return;
    }

    if (!isFreePromotion && !canAfford("PORTFOLIO")) {
      toast({
        title: "Low",
        description: `This logic synthesis requires ${PORTFOLIO_COST} credits.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const professionCategoryId =
      formData.professionCategoryId && isValidUUID(formData.professionCategoryId)
        ? formData.professionCategoryId
        : null;

    try {
      if (!isFreePromotion) {
        const success = await deductCredits("PORTFOLIO", undefined, "Digital Portfolio Synthesis");
        if (!success) throw new Error("Credit transaction failed.");
      }

      const tempRequestId = crypto.randomUUID();
      const { error } = await supabase.from("portfolio_requests").insert({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        profession_category_id: professionCategoryId,
        custom_profession: isOtherCategory ? formData.customProfession : null,
        cv_url: effectiveCvUrl || null,
        profile_data: (formData.cvInputMode === "profile" ? formData.profileData : {}) as any,
        certificates: formData.certificates as any,
        achievements: formData.achievements,
        social_links: formData.socialLinks as any,
        additional_notes: formData.additionalNotes,
        talent_id: talent.id,
        payment_status: isFreePromotion ? "free_promo" : "paid_credits",
      });

      if (error) throw error;
      await addServiceUsed("portfolio");

      setRequestId(tempRequestId);
      setIsSuccess(true);
      toast({ title: "Synthesis Initialized", description: "Our team will sync via WhatsApp shortly." });
    } catch (error: any) {
      toast({ title: "Failed", description: error.message || "Retry protocol.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 animate-in zoom-in-95 duration-700">
        <Card className="text-center py-12 bg-card/30 backdrop-blur-xl border-emerald-500/20 shadow-2xl rounded-[40px]">
          <CardHeader>
            <div className="mx-auto w-24 h-24 bg-emerald-500/10 rounded-[32px] flex items-center justify-center mb-6 rotate-3 border border-emerald-500/20">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
            </div>
            <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">Connection Finalized</CardTitle>
            <CardDescription className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
              Synthesis request active. Contact established in 24-48h.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-10">
            <div className="bg-muted/50 p-6 rounded-2xl border-2 border-dashed border-border/40">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-2">
                Request List ID
              </p>
              <p className="font-mono text-xl font-bold tracking-tighter text-primary">
                {requestId.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="rounded-xl h-12 font-black uppercase text-[10px]"
                onClick={() => navigate("/app/services")}
              >
                Close Session
              </Button>
              <Button
                className="rounded-xl h-12 font-black uppercase text-[10px] shadow-lg shadow-primary/20"
                onClick={() => navigate("/portfolio-status")}
              >
                Track Node
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 min-h-svh space-y-10 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="rounded-xl h-10 text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 group"
          onClick={() => navigate("/app/services")}
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Terminate Request
        </Button>
        <Badge
          variant="outline"
          className="rounded-lg border-primary/20 text-primary font-black uppercase text-[9px] tracking-widest italic"
        >
          Portfolio Sync v2.6
        </Badge>
      </header>

      <ProfileCompletionPrompt variant="banner" className="rounded-[24px] border-2 border-dashed border-primary/20" />

      {/* Promotion Logic Viewport */}
      {isFreePromotion ? (
        <Card className="rounded-[28px] border-2 border-primary/20 bg-primary/5 shadow-2xl overflow-hidden animate-pulse">
          <CardContent className="py-5 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl rotate-3 shadow-lg">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                  Promotional Logic Active
                </p>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                  {remainingFree} Nodes remaining for 0.00 Credits
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[28px] border-border/40 bg-muted/20">
          <CardContent className="py-5 px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground/40" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                Synthesis Execution Cost
              </span>
            </div>
            <span className="text-xl font-black italic tracking-tighter">{PORTFOLIO_COST} CREDITS</span>
          </CardContent>
        </Card>
      )}

      {/* Logic Stepper Hud */}
      <div className="flex items-center justify-between px-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex flex-1 items-center gap-4 group">
            <div
              className={cn(
                "p-3 rounded-xl transition-all duration-500 border-2",
                i <= currentStepIndex
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-110"
                  : "bg-muted text-muted-foreground/30 border-transparent",
              )}
            >
              {s.icon}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-[2px] flex-1 rounded-full transition-all duration-700",
                  i < currentStepIndex ? "bg-primary" : "bg-muted",
                )}
              />
            )}
          </div>
        ))}
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardHeader className="p-10 border-b border-border/10 bg-muted/20">
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">
              {steps[currentStepIndex].label}
            </CardTitle>
            <span className="text-[10px] font-mono font-bold text-muted-foreground/40 italic">
              NODE_{currentStep.toUpperCase()}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          {currentStep === "personal" && (
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-primary ml-1">
                  Full Name List
                </Label>
                <Input
                  className="h-12 rounded-xl border-2 bg-background/50"
                  value={formData.fullName}
                  onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Executive Identity"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest ml-1">Email Node</Label>
                  <Input
                    type="email"
                    className="h-12 rounded-xl border-2 bg-background/50"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="uplink@domain.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest ml-1">WhatsApp Tracking</Label>
                  <Input
                    className="h-12 rounded-xl border-2 bg-background/50"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+880..."
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-[11px] font-black uppercase tracking-widest ml-1">Sector Architecture</Label>
                <Select
                  value={formData.professionCategoryId}
                  onValueChange={(v) => setFormData((p) => ({ ...p, professionCategoryId: v }))}
                >
                  <SelectTrigger className="h-12 rounded-xl border-2 bg-background/50 font-bold">
                    <SelectValue placeholder="Select Professional Line" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="font-bold">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isOtherCategory && (
                <Input
                  className="h-12 rounded-xl border-2 bg-background/50 italic"
                  value={formData.customProfession}
                  onChange={(e) => setFormData((p) => ({ ...p, customProfession: e.target.value }))}
                  placeholder="Define Custom Logic Profession"
                />
              )}
            </div>
          )}

          {currentStep === "cv" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {hasExistingCv && (
                  <Button
                    variant={formData.cvInputMode === "existing" ? "default" : "outline"}
                    className="rounded-xl font-black uppercase text-[9px] h-11"
                    onClick={() => setFormData((p) => ({ ...p, cvInputMode: "existing" }))}
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" /> REUSE
                  </Button>
                )}
                <Button
                  variant={formData.cvInputMode === "upload" ? "default" : "outline"}
                  className="rounded-xl font-black uppercase text-[9px] h-11"
                  onClick={() => setFormData((p) => ({ ...p, cvInputMode: "upload" }))}
                >
                  <FileUp className="h-4 w-4 mr-2" /> UPLOAD
                </Button>
                <Button
                  variant={formData.cvInputMode === "url" ? "default" : "outline"}
                  className="rounded-xl font-black uppercase text-[9px] h-11"
                  onClick={() => setFormData((p) => ({ ...p, cvInputMode: "url" }))}
                >
                  <Globe className="h-4 w-4 mr-2" /> URL
                </Button>
                <Button
                  variant={formData.cvInputMode === "profile" ? "default" : "outline"}
                  className="rounded-xl font-black uppercase text-[9px] h-11"
                  onClick={() => setFormData((p) => ({ ...p, cvInputMode: "profile" }))}
                >
                  <PenLine className="h-4 w-4 mr-2" /> SYNTH
                </Button>
              </div>
              <div className="p-6 rounded-2xl bg-muted/20 border-2 border-dashed border-border/40">
                {formData.cvInputMode === "existing" && (
                  <ExistingCVCard
                    talent={talent}
                    onUseExisting={() => setFormData((p) => ({ ...p, cvUrl: talent?.cvUrl || "" }))}
                    onUploadNew={() => setFormData((p) => ({ ...p, cvInputMode: "upload" }))}
                  />
                )}
                {formData.cvInputMode === "upload" && (
                  <SimpleFileUpload
                    accept=".pdf,.doc,.docx"
                    onFileUploaded={(url) => setFormData((p) => ({ ...p, cvUrl: url }))}
                    onUrlProvided={(url) => setFormData((p) => ({ ...p, cvUrl: url }))}
                    currentValue={formData.cvUrl}
                  />
                )}
                {formData.cvInputMode === "url" && (
                  <Input
                    className="h-12 rounded-xl border-2"
                    value={formData.cvExternalUrl}
                    onChange={(e) => setFormData((p) => ({ ...p, cvExternalUrl: e.target.value }))}
                    placeholder="https://registry-link.com/..."
                  />
                )}
                {formData.cvInputMode === "profile" && (
                  <ProfileBuilderForm
                    value={formData.profileData}
                    onChange={(data) => setFormData((p) => ({ ...p, profileData: data }))}
                  />
                )}
              </div>
            </div>
          )}

          {currentStep === "certificates" && (
            <div className="space-y-8">
              <MultiFileUpload
                bucket="portfolio-uploads"
                value={formData.certificates}
                onChange={(files) => setFormData((p) => ({ ...p, certificates: files }))}
                label="Files"
                description="Upload verified credentials and certifications."
              />
              <div className="grid gap-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-primary">
                  Strategic Achievements
                </Label>
                <Textarea
                  className="min-h-[160px] rounded-2xl bg-muted/10 border-2"
                  value={formData.achievements}
                  onChange={(e) => setFormData((p) => ({ ...p, achievements: e.target.value }))}
                  placeholder="Log key milestones and executive wins..."
                />
              </div>
            </div>
          )}

          {currentStep === "social" && (
            <div className="grid gap-8">
              <div className="grid gap-4">
                {["linkedin", "github", "website"].map((field) => (
                  <div key={field} className="grid gap-2">
                    <Label className="text-[11px] font-black uppercase tracking-widest ml-1">{field} Uplink</Label>
                    <Input
                      className="h-12 rounded-xl border-2 bg-background/50"
                      value={formData.socialLinks[field as keyof typeof formData.socialLinks] || ""}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, socialLinks: { ...p.socialLinks, [field]: e.target.value } }))
                      }
                      placeholder={`https://${field}.com/...`}
                    />
                  </div>
                ))}
              </div>
              <div className="grid gap-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-primary">
                  Upload Notes
                </Label>
                <Textarea
                  className="min-h-[100px] rounded-2xl bg-muted/10 border-2"
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData((p) => ({ ...p, additionalNotes: e.target.value }))}
                  placeholder="Any specific logic parameters for our design team?"
                />
              </div>
            </div>
          )}

          {currentStep === "review" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="p-8 rounded-[32px] bg-muted/30 border-2 border-border/40 space-y-4 font-medium italic">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground uppercase text-[10px] font-black">Entity</span>
                  <span className="text-foreground">{formData.fullName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground uppercase text-[10px] font-black">List</span>
                  <span className="text-foreground">{effectiveCvUrl ? "Artifact Provided" : "Pending Synthesis"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground uppercase text-[10px] font-black">Sector</span>
                  <span className="text-foreground">{selectedCategory?.name}</span>
                </div>
                <div className="pt-6 mt-6 border-t-2 border-dashed border-border/40 flex justify-between items-center">
                  <span className="text-primary uppercase text-[11px] font-black tracking-widest">Connection Cost</span>
                  <span className="text-xl font-black tracking-tighter text-foreground">
                    {isFreePromotion ? "0.00 (PROMO)" : `${PORTFOLIO_COST} CREDITS`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  Transaction Security Enabled • 256-bit Encryption
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-6">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                className="rounded-2xl h-14 px-8 border-2 font-black uppercase text-[10px] tracking-widest"
                onClick={handleBack}
              >
                <ArrowLeft className="mr-3 h-4 w-4" /> Revert
              </Button>
            )}
            {currentStep !== "review" ? (
              <Button
                className="flex-1 rounded-2xl h-14 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next Phase <ArrowRight className="ml-3 h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="flex-1 rounded-2xl h-14 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 group"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" /> Transmitting...
                  </>
                ) : (
                  <>
                    <Zap className="mr-3 h-5 w-5 fill-current transition-transform group-hover:scale-125" /> Finalize
                    Connection & Submit
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
