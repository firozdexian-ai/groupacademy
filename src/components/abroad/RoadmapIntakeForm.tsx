import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Loader2, MapPin, GraduationCap, Wallet, X, Coins, Sparkles } from "lucide-react";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { COUNTRIES, getCountryFlag } from "@/lib/constants/countries";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";

const POPULAR_COUNTRIES = COUNTRIES.filter((c) =>
  ["US", "UK", "CA", "AU", "DE", "NL", "SE", "JP", "SG", "NZ", "IE", "FR"].includes(c.code),
);

const DEGREE_LEVELS = [
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "phd", label: "PhD / Doctoral" },
  { value: "diploma", label: "Diploma / Certificate" },
];

const FIELDS_OF_STUDY = [
  "Computer Science & IT",
  "Business & Management",
  "Engineering",
  "Medicine & Health Sciences",
  "Law",
  "Arts & Humanities",
  "Social Sciences",
  "Natural Sciences",
  "Education",
  "Architecture & Design",
  "Agriculture & Environmental",
  "Other",
];

const INTAKE_OPTIONS = ["Fall 2026", "Spring 2027", "Fall 2027", "Spring 2028", "Fall 2028"];

const BUDGET_LEVELS = [
  { value: "low", label: "Budget-Friendly", description: "< $15,000/year tuition" },
  { value: "medium", label: "Moderate", description: "$15,000 - $35,000/year" },
  { value: "high", label: "Premium", description: "$35,000+/year" },
  { value: "scholarship", label: "Scholarship-Dependent", description: "Need significant funding" },
];

interface FormData {
  targetCountries: string[];
  degreeLevel: string;
  fieldOfStudy: string;
  targetIntake: string;
  budgetLevel: string;
  ieltsScore: string;
  hasTakenIelts: boolean;
  gpa: string;
  yearsExperience: string;
  useExistingCV: boolean;
  partTimeWorkInterest: boolean;
  familySupport: boolean;
  specialRequirements: string;
}

// CTO FIX: Exported as Named Function to match existing imports
export function RoadmapIntakeForm() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { balance, canAffordAmount, deductCustomAmount } = useCredits();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serviceCost = CREDIT_CONFIG.SERVICES.STUDY_ABROAD_ROADMAP?.cost || 100;

  const [formData, setFormData] = useState<FormData>({
    targetCountries: [],
    degreeLevel: "",
    fieldOfStudy: "",
    targetIntake: "",
    budgetLevel: "",
    ieltsScore: "",
    hasTakenIelts: false,
    gpa: "",
    yearsExperience: "",
    useExistingCV: true,
    partTimeWorkInterest: false,
    familySupport: false,
    specialRequirements: "",
  });

  const toggleCountry = (code: string) => {
    setFormData((prev) => {
      if (prev.targetCountries.includes(code)) {
        return { ...prev, targetCountries: prev.targetCountries.filter((c) => c !== code) };
      }
      if (prev.targetCountries.length >= 3) {
        toast.error("Maximum 3 countries allowed.");
        return prev;
      }
      return { ...prev, targetCountries: [...prev.targetCountries, code] };
    });
  };

  const handleSubmit = async () => {
    if (!talent) return toast.error("Log in required");
    if (!canAffordAmount(serviceCost)) return toast.error(`Insufficient Credits. Cost: ${serviceCost}`);

    setIsSubmitting(true);
    try {
      const deducted = await deductCustomAmount(serviceCost, "STUDY_ABROAD_ROADMAP", undefined, "AI Abroad Roadmap");
      if (!deducted) throw new Error("Credit deduction failed");

      // CTO FIX: Immediate Lead Generation in 'contacts' table
      await supabase.from("contacts").insert([
        {
          full_name: talent.fullName || "Roadmap Lead",
          email: talent.email || "",
          subject: "Study Abroad Roadmap Requested",
          message: `Talent requested roadmap for ${formData.targetCountries.join(", ")}. Level: ${formData.degreeLevel}. Intake: ${formData.targetIntake}.`,
        },
      ]);

      // Create the Roadmap Record
      const { data: roadmap, error: insertError } = await supabase
        .from("study_abroad_roadmaps")
        .insert([
          {
            talent_id: talent.id,
            email: talent.email,
            full_name: talent.fullName,
            target_countries: formData.targetCountries,
            degree_level: formData.degreeLevel,
            field_of_study: formData.fieldOfStudy || null,
            target_intake: formData.targetIntake,
            budget_level: formData.budgetLevel,
            ielts_score: formData.hasTakenIelts ? parseFloat(formData.ieltsScore) : null,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Invoke AI Generation Edge Function
      await supabase.functions.invoke("generate-study-roadmap", {
        body: { roadmapId: roadmap.id, ...formData, fullName: talent.fullName, email: talent.email },
      });

      toast.success("Roadmap generation started!");
      navigate(`/app/abroad/roadmap/${roadmap.id}`);
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to process request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold">Admissions Roadmap</h1>
            <p className="text-sm text-muted-foreground">Personalized journey to your dream university</p>
          </div>
          <Badge variant="outline" className="mb-1 py-1">
            Step {step} of 3
          </Badge>
        </div>
        <Progress value={(step / 3) * 100} className="h-2" />
      </div>

      {step === 1 && (
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="text-primary h-5 w-5" /> Destinations & Degree
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select up to 3 Countries
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {POPULAR_COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggleCountry(c.code)}
                    className={cn(
                      "p-2 border rounded-xl text-center transition-all",
                      formData.targetCountries.includes(c.code)
                        ? "bg-primary/5 border-primary ring-1 ring-primary"
                        : "hover:bg-muted bg-background",
                    )}
                  >
                    <span className="text-xl block">{getCountryFlag(c.code)}</span>
                    <span className="text-[10px] font-bold uppercase truncate block">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Desired Degree Level</Label>
                <Select
                  value={formData.degreeLevel}
                  onValueChange={(v) => setFormData((p) => ({ ...p, degreeLevel: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEGREE_LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Intake</Label>
                <Select
                  value={formData.targetIntake}
                  onValueChange={(v) => setFormData((p) => ({ ...p, targetIntake: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTAKE_OPTIONS.map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="text-primary h-5 w-5" /> Academic Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
              <Checkbox
                id="useCV"
                checked={formData.useExistingCV}
                onCheckedChange={(c) => setFormData((p) => ({ ...p, useExistingCV: !!c }))}
              />
              <div className="grid gap-1">
                <Label htmlFor="useCV" className="text-sm font-bold">
                  Smart Sync
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Use my existing CV and Skills to find better university matches
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current GPA / Standing</Label>
                <Input
                  placeholder="e.g. 3.8/4.0 or First Class"
                  value={formData.gpa}
                  onChange={(e) => setFormData((p) => ({ ...p, gpa: e.target.value }))}
                />
              </div>

              <div className="p-4 border rounded-xl space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="ielts"
                    checked={formData.hasTakenIelts}
                    onCheckedChange={(c) => setFormData((p) => ({ ...p, hasTakenIelts: !!c }))}
                  />
                  <Label htmlFor="ielts" className="text-sm font-medium">
                    I have IELTS / TOEFL scores
                  </Label>
                </div>
                {formData.hasTakenIelts && (
                  <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                    <Label className="text-xs shrink-0">Overall Score:</Label>
                    <Input
                      type="number"
                      placeholder="Band"
                      value={formData.ieltsScore}
                      onChange={(e) => setFormData((p) => ({ ...p, ieltsScore: e.target.value }))}
                      className="w-24"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="text-primary h-5 w-5" /> Budget & Funding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-3">
              {BUDGET_LEVELS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, budgetLevel: b.value }))}
                  className={cn(
                    "p-4 border rounded-xl text-left transition-all",
                    formData.budgetLevel === b.value
                      ? "bg-primary/5 border-primary ring-1 ring-primary"
                      : "hover:bg-muted bg-background",
                  )}
                >
                  <p className="font-bold text-sm">{b.label}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{b.description}</p>
                </button>
              ))}
            </div>

            <div className="p-4 bg-muted/50 rounded-xl border border-dashed space-y-3">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tighter">
                <span className="text-muted-foreground">Roadmap Generation Fee</span>
                <span className="text-foreground">{serviceCost} Credits</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tighter">
                <span className="text-muted-foreground">Available Balance</span>
                <span className={balance < serviceCost ? "text-destructive" : "text-emerald-600"}>
                  {balance} Credits
                </span>
              </div>
              {balance < serviceCost && (
                <p className="text-[10px] text-destructive italic text-right">* Insufficient balance. Please top up.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center pt-4 sticky bottom-4 bg-background/80 backdrop-blur-sm p-2 rounded-xl border sm:relative sm:bottom-0 sm:border-none sm:bg-transparent">
        <Button variant="outline" onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))} disabled={isSubmitting}>
          <ChevronLeft className="mr-2 h-4 w-4" /> {step === 1 ? "Cancel" : "Back"}
        </Button>

        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)} disabled={step === 1 && formData.targetCountries.length === 0}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.budgetLevel || balance < serviceCost}
            className="shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Roadmap
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
