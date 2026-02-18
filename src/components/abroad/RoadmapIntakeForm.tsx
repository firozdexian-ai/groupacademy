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
import { ChevronLeft, ChevronRight, Loader2, MapPin, GraduationCap, Wallet, X } from "lucide-react";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { COUNTRIES, getCountryFlag } from "@/lib/constants/countries";
import { CREDIT_CONFIG } from "@/lib/creditPricing";

const POPULAR_COUNTRIES = COUNTRIES.filter((c) =>
  ["US", "UK", "CA", "AU", "DE", "NL", "SE", "JP", "SG", "NZ", "IE", "FR"].includes(c.code)
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

const INTAKE_OPTIONS = [
  "Fall 2026",
  "Spring 2027",
  "Fall 2027",
  "Spring 2028",
  "Fall 2028",
];

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

export function RoadmapIntakeForm() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { balance, canAffordAmount, deductCustomAmount } = useCredits();
  const { toast } = useToast();
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
        toast({ title: "Maximum 3 countries", description: "Remove one to add another", variant: "destructive" });
        return prev;
      }
      return { ...prev, targetCountries: [...prev.targetCountries, code] };
    });
  };

  const canProceedStep1 = formData.targetCountries.length > 0 && formData.degreeLevel && formData.targetIntake;
  const canProceedStep2 = true; // Optional fields
  const canProceedStep3 = formData.budgetLevel;

  const handleSubmit = async () => {
    if (!talent) {
      toast({ title: "Please log in", variant: "destructive" });
      return;
    }

    if (!canAffordAmount(serviceCost)) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${serviceCost} credits for this service`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Deduct credits first
      const deducted = await deductCustomAmount(
        serviceCost,
        "STUDY_ABROAD_ROADMAP",
        undefined,
        "AI Study Abroad Roadmap generation"
      );

      if (!deducted) {
        throw new Error("Failed to deduct credits");
      }

      // Create roadmap record
      const insertData = {
        talent_id: talent.id,
        email: talent.email,
        full_name: talent.fullName,
        target_countries: formData.targetCountries,
        degree_level: formData.degreeLevel,
        field_of_study: formData.fieldOfStudy || null,
        target_intake: formData.targetIntake,
        budget_level: formData.budgetLevel,
        ielts_score: formData.hasTakenIelts && formData.ieltsScore ? parseFloat(formData.ieltsScore) : null,
        has_taken_ielts: formData.hasTakenIelts,
        gpa: formData.gpa || null,
        years_experience: formData.yearsExperience ? parseInt(formData.yearsExperience) : null,
        cv_text: formData.useExistingCV ? (talent.cvText || null) : null,
        education_summary: talent.education ? JSON.parse(JSON.stringify(talent.education)) : null,
        experience_summary: talent.experience ? JSON.parse(JSON.stringify(talent.experience)) : null,
        part_time_work_interest: formData.partTimeWorkInterest,
        family_support: formData.familySupport,
        special_requirements: formData.specialRequirements || null,
        status: "pending",
      };

      const { data: roadmap, error: insertError } = await supabase
        .from("study_abroad_roadmaps")
        .insert([insertData])
        .select()
        .single();

      if (insertError || !roadmap) {
        throw new Error(insertError?.message || "Failed to create roadmap");
      }

      // Call edge function to generate roadmap
      const { error: fnError } = await supabase.functions.invoke("generate-study-roadmap", {
        body: {
          roadmapId: roadmap.id,
          targetCountries: formData.targetCountries,
          degreeLevel: formData.degreeLevel,
          fieldOfStudy: formData.fieldOfStudy,
          targetIntake: formData.targetIntake,
          budgetLevel: formData.budgetLevel,
          ieltsScore: formData.hasTakenIelts ? parseFloat(formData.ieltsScore) : undefined,
          hasTakenIelts: formData.hasTakenIelts,
          gpa: formData.gpa,
          yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : undefined,
          cvText: formData.useExistingCV ? talent.cvText : undefined,
          educationSummary: talent.education,
          experienceSummary: talent.experience,
          partTimeWorkInterest: formData.partTimeWorkInterest,
          familySupport: formData.familySupport,
          specialRequirements: formData.specialRequirements,
          fullName: talent.fullName,
          email: talent.email,
        },
      });

      if (fnError) {
        console.error("Edge function error:", fnError);
        // Don't throw - the roadmap is created, user can check results page
      }

      toast({ title: "Roadmap generation started!", description: "We'll have your personalized plan ready soon." });
      navigate(`/app/abroad/roadmap/${roadmap.id}`);
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate roadmap",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Step {step} of 3</span>
          <span>{Math.round((step / 3) * 100)}% complete</span>
        </div>
        <Progress value={(step / 3) * 100} className="h-2" />
      </div>

      {/* Step 1: Destination & Program */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Destination & Program
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Target Countries */}
            <div className="space-y-3">
              <Label>Target Countries (select up to 3) *</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.targetCountries.map((code) => {
                  const country = COUNTRIES.find((c) => c.code === code);
                  return (
                    <Badge key={code} variant="secondary" className="gap-1 pr-1">
                      {getCountryFlag(code)} {country?.name}
                      <button onClick={() => toggleCountry(code)} className="ml-1 hover:bg-muted rounded p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                {POPULAR_COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => toggleCountry(country.code)}
                    className={`p-1.5 rounded-lg border text-center text-sm transition-all ${
                      formData.targetCountries.includes(country.code)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-lg block mb-0.5">{getCountryFlag(country.code)}</span>
                    <span className="text-xs">{country.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Degree Level */}
            <div className="space-y-1.5">
              <Label>Degree Level *</Label>
              <Select value={formData.degreeLevel} onValueChange={(v) => setFormData((p) => ({ ...p, degreeLevel: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select degree level" />
                </SelectTrigger>
                <SelectContent>
                  {DEGREE_LEVELS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Field of Study */}
            <div className="space-y-1.5">
              <Label>Field of Study</Label>
              <Select value={formData.fieldOfStudy} onValueChange={(v) => setFormData((p) => ({ ...p, fieldOfStudy: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {FIELDS_OF_STUDY.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Intake */}
            <div className="space-y-1.5">
              <Label>Target Intake *</Label>
              <Select value={formData.targetIntake} onValueChange={(v) => setFormData((p) => ({ ...p, targetIntake: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="When do you want to start?" />
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
          </CardContent>
        </Card>
      )}

      {/* Step 2: Profile & Readiness */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Profile & Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Use Existing CV */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useCV"
                checked={formData.useExistingCV}
                onCheckedChange={(c) => setFormData((p) => ({ ...p, useExistingCV: !!c }))}
              />
              <Label htmlFor="useCV" className="cursor-pointer">
                Use my profile/CV data for personalized recommendations
              </Label>
            </div>

            {/* IELTS */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasTakenIelts"
                  checked={formData.hasTakenIelts}
                  onCheckedChange={(c) => setFormData((p) => ({ ...p, hasTakenIelts: !!c }))}
                />
                <Label htmlFor="hasTakenIelts" className="cursor-pointer">
                  I have taken IELTS/TOEFL
                </Label>
              </div>
              {formData.hasTakenIelts && (
                <div className="ml-6">
                  <Label>IELTS Overall Band Score</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="9"
                    placeholder="e.g., 7.0"
                    value={formData.ieltsScore}
                    onChange={(e) => setFormData((p) => ({ ...p, ieltsScore: e.target.value }))}
                    className="w-32 mt-1"
                  />
                </div>
              )}
            </div>

            {/* GPA */}
            <div className="space-y-2">
              <Label>GPA / Academic Standing</Label>
              <Input
                placeholder="e.g., 3.5/4.0 or First Class Honours"
                value={formData.gpa}
                onChange={(e) => setFormData((p) => ({ ...p, gpa: e.target.value }))}
              />
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <Label>Years of Work Experience</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formData.yearsExperience}
                onChange={(e) => setFormData((p) => ({ ...p, yearsExperience: e.target.value }))}
                className="w-32"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Budget & Preferences */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Budget & Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Budget Level */}
            <div className="space-y-3">
              <Label>Budget Level *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUDGET_LEVELS.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, budgetLevel: b.value }))}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      formData.budgetLevel === b.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="font-medium text-sm">{b.label}</div>
                    <div className="text-xs text-muted-foreground">{b.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Preferences */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="partTime"
                  checked={formData.partTimeWorkInterest}
                  onCheckedChange={(c) => setFormData((p) => ({ ...p, partTimeWorkInterest: !!c }))}
                />
                <Label htmlFor="partTime" className="cursor-pointer">
                  Interested in part-time work while studying
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="familySupport"
                  checked={formData.familySupport}
                  onCheckedChange={(c) => setFormData((p) => ({ ...p, familySupport: !!c }))}
                />
                <Label htmlFor="familySupport" className="cursor-pointer">
                  Need to bring family/dependents
                </Label>
              </div>
            </div>

            {/* Special Requirements */}
            <div className="space-y-2">
              <Label>Special Requirements or Preferences</Label>
              <Textarea
                placeholder="Any specific requirements, e.g., spouse visa, specific city, healthcare access..."
                value={formData.specialRequirements}
                onChange={(e) => setFormData((p) => ({ ...p, specialRequirements: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Cost Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Service Cost</span>
                <span className="font-medium">{serviceCost} Credits</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Your Balance</span>
                <span className={balance >= serviceCost ? "text-green-600" : "text-destructive"}>{balance} Credits</span>
              </div>
              {balance < serviceCost && (
                <p className="text-xs text-destructive">You need {serviceCost - balance} more credits</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={() => (step > 1 ? setStep(step - 1) : navigate("/app/abroad"))} disabled={isSubmitting}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {step > 1 ? "Back" : "Cancel"}
        </Button>

        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canProceedStep3 || !canAffordAmount(serviceCost) || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>Generate My Roadmap</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
