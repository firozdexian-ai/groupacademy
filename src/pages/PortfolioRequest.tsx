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
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import MultiFileUpload from "@/components/portfolio/MultiFileUpload";
import { SimpleFileUpload } from "@/components/portfolio/SimpleFileUpload";
import ProfileBuilderForm from "@/components/portfolio/ProfileBuilderForm";
import {
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
  RefreshCw,
  Gift,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AuthGate } from "@/components/AuthGate";
import { useTalent } from "@/hooks/useTalent";
import { ExistingCVCard } from "@/components/cv/ExistingCVCard";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";
import { cn } from "@/lib/utils";

type Step = "personal" | "cv" | "certificates" | "social" | "review";

const steps: { id: Step; label: string; icon: any }[] = [
  { id: "personal", label: "Identity", icon: User },
  { id: "cv", label: "Artifacts", icon: FileText },
  { id: "certificates", label: "Verification", icon: Award },
  { id: "social", label: "Network", icon: Globe },
  { id: "review", label: "Finalize", icon: CheckCircle },
];

const FREE_PORTFOLIO_LIMIT = 1000;

function PortfolioRequestContent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { talent, addServiceUsed, updateTalent, refreshTalent } = useTalent();

  const [currentStep, setCurrentStep] = useState<Step>("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string>("");
  const [professionCategories, setProfessionCategories] = useState<any[]>([]);
  const [portfolioCount, setPortfolioCount] = useState<number | null>(null);

  const [formData, setFormData] = useState<any>({
    fullName: "",
    email: "",
    phone: "",
    professionCategoryId: "",
    customProfession: "",
    cvInputMode: "upload",
    cvUrl: "",
    cvExternalUrl: "",
    profileData: { education: [], experience: [], skills: [], projects: [], achievements: [] },
    certificates: [],
    achievements: "",
    socialLinks: {},
    additionalNotes: "",
  });

  useEffect(() => {
    loadData();
    // CTO Note: Restore session backup
    const backup = localStorage.getItem("portfolio_request_draft");
    if (backup) {
      try {
        setFormData((prev: any) => ({ ...prev, ...JSON.parse(backup) }));
      } catch (e) {
        console.error("Backup corruption detected.");
      }
    }
  }, []);

  const loadData = async () => {
    const { data: cats } = await supabase
      .from("profession_categories")
      .select("id, name")
      .eq("is_active", true)
      .order("display_order");
    const { count } = await supabase.from("portfolio_requests").select("*", { count: "exact", head: true });
    if (cats) setProfessionCategories(cats);
    setPortfolioCount(count || 0);
  };

  useEffect(() => {
    if (talent) {
      setFormData((prev: any) => ({
        ...prev,
        fullName: prev.fullName || talent.fullName || "",
        email: prev.email || talent.email || "",
        phone: prev.phone || talent.phone || "",
        professionCategoryId: prev.professionCategoryId || talent.professionCategoryId || "",
        cvUrl: prev.cvUrl || talent.cvUrl || "",
        cvInputMode: talent.cvUrl ? "existing" : prev.cvInputMode,
      }));
    }
  }, [talent]);

  useEffect(() => {
    const backupData = { ...formData };
    delete backupData.certificates; // Heavy binary data excluded from LS
    localStorage.setItem("portfolio_request_draft", JSON.stringify(backupData));
  }, [formData]);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const isFreePromotion = portfolioCount !== null && portfolioCount < FREE_PORTFOLIO_LIMIT;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const tempId = crypto.randomUUID();
      const { error } = await supabase.from("portfolio_requests").insert({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        profession_category_id: formData.professionCategoryId,
        cv_url: formData.cvInputMode === "url" ? formData.cvExternalUrl : formData.cvUrl,
        profile_data: formData.profileData,
        certificates: formData.certificates,
        social_links: formData.socialLinks,
        talent_id: talent?.id || null,
      });

      if (error) throw error;
      if (talent?.id) await addServiceUsed("portfolio");

      localStorage.removeItem("portfolio_request_draft");
      setRequestId(tempId);
      setIsSuccess(true);
      toast({ title: "Identity Logged", description: "Your profile is in the engineering queue." });
    } catch (e: any) {
      toast({ title: "Handshake Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess)
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container max-w-2xl mx-auto px-6 py-20 animate-in fade-in zoom-in-95 duration-700">
          <Card className="rounded-[40px] border-border/40 shadow-2xl overflow-hidden text-center">
            <div className="bg-emerald-500/5 py-12 border-b border-emerald-500/10">
              <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-10 w-10 text-emerald-500" />
              </div>
              <CardTitle className="text-3xl font-black tracking-tighter">Request Authorized</CardTitle>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60 mt-2">
                Ticket ID: {requestId.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <CardContent className="p-10 space-y-8">
              <div className="text-left space-y-4 bg-muted/30 p-6 rounded-3xl border border-border/40">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Onboarding Protocol</h4>
                <ol className="space-y-3 text-xs font-bold text-muted-foreground uppercase tracking-tight">
                  <li className="flex gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] shrink-0">
                      1
                    </div>{" "}
                    WhatsApp verification within 24h.
                  </li>
                  <li className="flex gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] shrink-0">
                      2
                    </div>{" "}
                    Engineering phase: Site construction (3-5 days).
                  </li>
                  <li className="flex gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] shrink-0">
                      3
                    </div>{" "}
                    Live credentials transmission.
                  </li>
                </ol>
              </div>
              <Button
                className="w-full h-14 rounded-2xl font-black uppercase text-xs"
                onClick={() => navigate("/app/feed")}
              >
                Return to Nexus
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/10">
      <Navbar />
      <main className="flex-1 container max-w-4xl mx-auto px-6 py-12">
        <ProfileCompletionPrompt variant="banner" className="mb-10 rounded-2xl" />

        <div className="max-w-3xl mx-auto space-y-12">
          <header className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-[0.2em] animate-fade-in">
              <Sparkles className="w-3 h-3" /> Strategic Identity Blueprint
            </div>
            <h1 className="text-5xl font-black tracking-tighter leading-[0.8] mb-4">Digital Portfolio</h1>
            <p className="text-muted-foreground font-medium text-lg max-w-xl mx-auto">
              Build a high-conversion professional landing page managed by our creative leads.
            </p>
          </header>

          {/* Stepper HUD */}
          <nav className="grid grid-cols-5 gap-3">
            {steps.map((s, i) => (
              <div key={s.id} className="space-y-3">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-700",
                    i <= currentStepIndex ? "bg-primary" : "bg-muted",
                  )}
                />
                <div
                  className={cn(
                    "flex items-center gap-2 transition-opacity",
                    i <= currentStepIndex ? "opacity-100" : "opacity-30",
                  )}
                >
                  <s.icon className="h-3 w-3 text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-widest hidden md:block">{s.label}</span>
                </div>
              </div>
            ))}
          </nav>

          <Card className="rounded-[40px] border-border/40 shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="p-10 pb-6 border-b border-border/10 bg-muted/20">
              <CardTitle className="text-2xl font-black tracking-tighter uppercase">
                {steps[currentStepIndex].label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              {currentStep === "personal" && (
                <div className="grid md:grid-cols-2 gap-6 animate-in fade-in">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Legal Identity</Label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="h-12 rounded-xl"
                      placeholder="Full Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Contact Sequence</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-12 rounded-xl"
                      placeholder="+880..."
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                      Professional Vertical
                    </Label>
                    <Select
                      value={formData.professionCategoryId}
                      onValueChange={(v) => setFormData({ ...formData, professionCategoryId: v })}
                    >
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select Domain" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {professionCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-[10px] font-bold uppercase">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {currentStep === "cv" && (
                <div className="space-y-6 animate-in fade-in">
                  {formData.cvInputMode === "existing" && talent?.cvUrl ? (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                        Verified Artifact Identified
                      </p>
                      <ExistingCVCard
                        talent={talent}
                        onUploadNew={() => setFormData({ ...formData, cvInputMode: "upload" })}
                        showActions={false}
                      />
                    </div>
                  ) : (
                    <SimpleFileUpload
                      onFileUploaded={async (url) => setFormData({ ...formData, cvUrl: url })}
                      currentValue={formData.cvUrl}
                    />
                  )}
                </div>
              )}

              {currentStep === "certificates" && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                  <MultiFileUpload
                    bucket="portfolio-uploads"
                    value={formData.certificates}
                    onChange={(f) => setFormData({ ...formData, certificates: f })}
                    label="Accreditations"
                  />
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                      Value Propositions (Achievements)
                    </Label>
                    <Textarea
                      value={formData.achievements}
                      onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                      rows={5}
                      className="rounded-2xl resize-none"
                      placeholder="Major projects or KPI results..."
                    />
                  </div>
                </div>
              )}

              {currentStep === "social" && (
                <div className="grid sm:grid-cols-2 gap-6 animate-in zoom-in-95">
                  {["linkedin", "github", "website"].map((key) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 capitalize">
                        {key} Node
                      </Label>
                      <Input
                        value={formData.socialLinks[key] || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, socialLinks: { ...formData.socialLinks, [key]: e.target.value } })
                        }
                        className="h-12 rounded-xl"
                        placeholder={`https://${key}.com/...`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {currentStep === "review" && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="p-6 bg-emerald-500/5 rounded-[32px] border border-emerald-500/10 flex items-start gap-4">
                    <ShieldCheck className="h-6 w-6 text-emerald-500 mt-1" />
                    <div className="space-y-1">
                      <h4 className="font-black uppercase text-xs tracking-tight">Logic Verification</h4>
                      <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                        Ensure all artifacts are authentic. Verified data significantly reduces engineering latency.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-muted/30">
                      <p className="text-[8px] font-black text-muted-foreground uppercase">Identity</p>
                      <p className="text-xs font-bold">{formData.fullName}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/30">
                      <p className="text-[8px] font-black text-muted-foreground uppercase">Artifact</p>
                      <p className="text-xs font-bold uppercase">{formData.cvInputMode}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-8 border-t border-border/10">
                <Button
                  variant="ghost"
                  onClick={() => currentStepIndex > 0 && setCurrentStep(steps[currentStepIndex - 1].id)}
                  disabled={currentStepIndex === 0}
                  className="rounded-xl font-black uppercase text-[10px] tracking-widest px-0 hover:bg-transparent"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={
                    currentStep === "review" ? handleSubmit : () => setCurrentStep(steps[currentStepIndex + 1].id)
                  }
                  disabled={isSubmitting}
                  className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : currentStep === "review" ? (
                    "Verify & Authorize"
                  ) : (
                    "Proceed"
                  )}
                  {currentStep !== "review" && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PortfolioRequest() {
  return (
    <AuthGate message="Secure your professional identity. Results are archived to your encrypted career profile.">
      <PortfolioRequestContent />
    </AuthGate>
  );
}
