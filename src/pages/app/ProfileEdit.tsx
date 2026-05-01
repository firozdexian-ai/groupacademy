import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Trash2,
  ExternalLink,
  Upload,
  AlertCircle,
  Plus,
  X,
  ShieldCheck,
  Zap,
  Target,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ProfilePhotoUpload } from "@/components/profile/ProfilePhotoUpload";
import { SkillsEditor } from "@/components/profile/SkillsEditor";
import { CoverImageUpload } from "@/components/profile/CoverImageUpload";
import { ExperienceEditor, ExperienceEntry } from "@/components/profile/ExperienceEditor";
import { EducationEditor, EducationEntry } from "@/components/profile/EducationEditor";
import { supabase } from "@/integrations/supabase/client";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: List Setup Terminal
 * High-fidelity orchestrator for artifact ingestion and identity synchronization.
 * 2026 Standard: Executive Logic geometry with real-time CV parsing telemetry.
 */

interface LanguageEntry {
  language: string;
  proficiency: string;
}

interface AchievementEntry {
  title: string;
  issuer: string;
  date: string;
}

export default function ProfileEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { talent, updateTalent, refreshTalent } = useTalent();

  const [saving, setSaving] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [parsingCV, setParsingCV] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [cvUrl, setCvUrl] = useState("");

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    countryCode: "+880",
    country: "BD",
    customProfession: "",
    currentStatus: "",
    institution: "",
    fieldOfStudy: "",
    linkedinUrl: "",
    portfolioUrl: "",
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [languages, setLanguages] = useState<LanguageEntry[]>([]);
  const [achievements, setAchievements] = useState<AchievementEntry[]>([]);

  // --- LOGIC HANDLERS ---
  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const handleSkillsChange = useCallback((newSkills: string[]) => {
    setSkills(newSkills);
    setIsDirty(true);
  }, []);

  const handleExperienceChange = useCallback((newExp: ExperienceEntry[]) => {
    setExperience(newExp);
    setIsDirty(true);
  }, []);

  const handleEducationChange = useCallback((newEdu: EducationEntry[]) => {
    setEducation(newEdu);
    setIsDirty(true);
  }, []);

  const addLanguage = () => {
    setLanguages((prev) => [...prev, { language: "", proficiency: "Intermediate" }]);
    setIsDirty(true);
  };
  const removeLanguage = (index: number) => {
    setLanguages((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };
  const updateLanguage = (index: number, field: keyof LanguageEntry, value: string) => {
    setLanguages((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
    setIsDirty(true);
  };

  const addAchievement = () => {
    setAchievements((prev) => [...prev, { title: "", issuer: "", date: "" }]);
    setIsDirty(true);
  };
  const removeAchievement = (index: number) => {
    setAchievements((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };
  const updateAchievement = (index: number, field: keyof AchievementEntry, value: string) => {
    setAchievements((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
    setIsDirty(true);
  };

  // --- DATA INITIALIZATION ---
  useEffect(() => {
    if (talent) {
      setFormData({
        fullName: talent.fullName || "",
        phone: talent.phone || "",
        countryCode: talent.countryCode || "+880",
        country: talent.country || "BD",
        customProfession: talent.customProfession || "",
        currentStatus: talent.currentStatus || "",
        institution: talent.institution || "",
        fieldOfStudy: talent.fieldOfStudy || "",
        linkedinUrl: talent.linkedinUrl || "",
        portfolioUrl: talent.portfolioUrl || "",
      });
      setProfilePhotoUrl(talent.profilePhotoUrl || "");
      setCoverImageUrl(talent.coverImageUrl || "");
      setCvUrl(talent.cvUrl || "");

      setSkills(
        Array.isArray(talent.skills)
          ? talent.skills.map((s: any) => (typeof s === "string" ? s : s?.name || String(s)))
          : [],
      );
      setExperience(
        Array.isArray(talent.experience)
          ? talent.experience.map((exp: any) => ({
              company: exp.company || "",
              position: exp.position || exp.title || "",
              startDate: exp.startDate || exp.start_date || "",
              endDate: exp.endDate || exp.end_date || "",
              description: exp.description || "",
            }))
          : [],
      );
      setEducation(
        Array.isArray(talent.education)
          ? talent.education.map((edu: any) => ({
              institution: edu.institution || "",
              degree: edu.degree || "",
              fieldOfStudy: edu.fieldOfStudy || edu.field || "",
              startYear: edu.startYear || edu.start_year || "",
              endYear: edu.endYear || edu.end_year || "",
            }))
          : [],
      );
      setLanguages(
        Array.isArray(talent.languages)
          ? talent.languages.map((l: any) => ({
              language: l.language || "",
              proficiency: l.proficiency || "Intermediate",
            }))
          : [],
      );
      setAchievements(
        Array.isArray(talent.achievements)
          ? talent.achievements.map((a: any) => ({
              title: a.title || a.name || "",
              issuer: a.issuer || "",
              date: a.date || "",
            }))
          : [],
      );
    }
  }, [talent]);

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash && sectionRefs.current[hash]) {
      setTimeout(() => {
        sectionRefs.current[hash]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 400);
    }
  }, [location.hash]);

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !talent) return;

    setUploadingCV(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${talent.id}/cv-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("portfolio-uploads")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("portfolio-uploads").getPublicUrl(fileName);
      setCvUrl(publicUrl);
      setUploadingCV(false);
      setParsingCV(true);

      toast.info("Initializing Logic Extraction...", { description: "Decompressing CV artifacts." });

      const { data: parseResult, error: parseError } = await supabase.functions.invoke("parse-cv", {
        body: { cvUrl: publicUrl },
      });

      if (parseError) throw parseError;

      if (parseResult?.success && parseResult.parsed) {
        const parsed = parseResult.parsed;
        setFormData((prev) => ({
          ...prev,
          fullName: parsed.full_name || prev.fullName,
          phone: parsed.phone || prev.phone,
          linkedinUrl: parsed.linkedin_url || prev.linkedinUrl,
          portfolioUrl: parsed.portfolio_url || prev.portfolioUrl,
        }));
        await updateTalent({ cvUrl: publicUrl, cvParsedAt: new Date().toISOString() });
        await refreshTalent();
        toast.success("Setup complete", { description: "CV artifacts successfully integrated." });
      }
    } catch (error) {
      toast.error("Error", { description: "Could not save the file." });
    } finally {
      setUploadingCV(false);
      setParsingCV(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTalent({
        ...formData,
        profilePhotoUrl,
        coverImageUrl,
        cvUrl,
        skills: skills as any,
        experience: experience as any,
        education: education as any,
        languages: languages as any,
        achievements: achievements as any,
      });
      await refreshTalent();
      setIsDirty(false);
      toast.success("Synced.");
      navigate("/app/profile");
    } catch (error) {
      toast.error("Failed", { description: "Logic update aborted." });
    } finally {
      setSaving(false);
    }
  };

  if (!talent) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 pb-40 space-y-10 animate-in fade-in duration-700">
      {isDirty && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-right-4">
          <Badge
            variant="destructive"
            className="rounded-lg font-black uppercase text-[9px] tracking-widest shadow-2xl shadow-destructive/20 border-none px-3 py-1 animate-pulse"
          >
            Pending Sync
          </Badge>
        </div>
      )}

      <header className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-11 w-11 hover:bg-primary/5"
            onClick={() => navigate("/app/profile")}
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold">Edit profile</h1>
            <p className="text-xs text-muted-foreground">Keep your details up to date.</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                Identity Frame
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProfilePhotoUpload
                currentPhotoUrl={profilePhotoUrl}
                fullName={formData.fullName}
                onPhotoChange={(url) => {
                  setProfilePhotoUrl(url || "");
                  setIsDirty(true);
                }}
              />
            </CardContent>
          </Card>
          <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                Environmental Banner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CoverImageUpload
                currentUrl={coverImageUrl}
                onImageChange={(url) => {
                  setCoverImageUrl(url || "");
                  setIsDirty(true);
                }}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[32px] border-2 border-primary/20 bg-primary/5 shadow-2xl overflow-hidden relative group">
          <CardHeader className="p-8 border-b border-primary/10">
            <div className="flex justify-between items-center">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                <Zap className="h-4 w-4 fill-primary" /> Logic Artifact Ingestion (CV)
              </CardTitle>
              {parsingCV && (
                <span className="text-[9px] font-black text-primary animate-pulse tracking-widest uppercase italic">
                  Generating Logic...
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {cvUrl ? (
              <div className="flex items-center justify-between p-6 bg-background/50 border-2 border-primary/20 rounded-2xl shadow-inner">
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight italic">Active List Artifact</p>
                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
                      Verified Payload
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-lg h-10 w-10"
                    onClick={() => window.open(cvUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-lg h-10 w-10 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setCvUrl("");
                      setIsDirty(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative border-4 border-dashed border-primary/10 rounded-[32px] p-10 hover:border-primary/40 hover:bg-primary/[0.02] transition-all group cursor-pointer overflow-hidden">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCVUpload}
                  disabled={uploadingCV || parsingCV}
                  className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                />
                <div className="text-center space-y-4">
                  <div
                    className={cn(
                      "h-16 w-16 rounded-2xl mx-auto flex items-center justify-center transition-all",
                      uploadingCV ? "bg-primary/10" : "bg-muted/50 shadow-inner group-hover:scale-110",
                    )}
                  >
                    {uploadingCV ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tighter italic">
                      {uploadingCV ? "Syncing Artifact..." : "Authorize CV Ingestion"}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">
                      AI-Powered Extraction Connection
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div
          ref={(el) => {
            sectionRefs.current["about"] = el;
          }}
          className="space-y-8 animate-in slide-in-from-bottom-4"
        >
          <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
            <CardHeader className="p-10 border-b border-border/10 bg-muted/20">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">
                Identity Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Entity Name
                  </Label>
                  <Input
                    className="h-12 rounded-xl border-2 bg-background/50 font-bold"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                    Uplink Tracking (Phone)
                  </Label>
                  <PhoneInput
                    value={formData.phone}
                    countryCode={formData.countryCode}
                    onValueChange={(v) => handleChange("phone", v)}
                    onCountryCodeChange={(c, ct) => {
                      handleChange("countryCode", c);
                      handleChange("country", ct);
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Professional Logic Protocol
                </Label>
                <Input
                  className="h-12 rounded-xl border-2 bg-background/50 font-bold"
                  value={formData.customProfession}
                  onChange={(e) => handleChange("customProfession", e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">
                  Strategic Narrative (About)
                </Label>
                <Textarea
                  className="min-h-[160px] rounded-2xl bg-muted/10 border-2 p-6 italic font-medium"
                  value={formData.currentStatus}
                  onChange={(e) => handleChange("currentStatus", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <div
            ref={(el) => {
              sectionRefs.current["skills"] = el;
            }}
          >
            <Card className="rounded-[32px] border-2 border-border/40">
              <CardContent className="p-8">
                <SkillsEditor skills={skills} onChange={handleSkillsChange} />
              </CardContent>
            </Card>
          </div>
          <div
            ref={(el) => {
              sectionRefs.current["experience"] = el;
            }}
          >
            <Card className="rounded-[32px] border-2 border-border/40">
              <CardContent className="p-8">
                <ExperienceEditor experience={experience} onChange={handleExperienceChange} />
              </CardContent>
            </Card>
          </div>
          <div
            ref={(el) => {
              sectionRefs.current["education"] = el;
            }}
          >
            <Card className="rounded-[32px] border-2 border-border/40">
              <CardContent className="p-8">
                <EducationEditor education={education} onChange={handleEducationChange} />
              </CardContent>
            </Card>
          </div>

          <Card
            ref={(el) => {
              sectionRefs.current["achievements"] = el;
            }}
            className="rounded-[32px] border-2 border-border/40"
          >
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                  Reward Artifacts
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addAchievement}
                  className="font-black text-[9px] uppercase tracking-widest"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Node
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {achievements.map((award, i) => (
                <div key={i} className="border-2 rounded-2xl p-6 space-y-4 relative bg-muted/5 group">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 h-8 w-8 text-destructive opacity-20 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeAchievement(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      Award Title
                    </Label>
                    <Input
                      value={award.title}
                      onChange={(e) => updateAchievement(i, "title", e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        Issuer
                      </Label>
                      <Input
                        value={award.issuer}
                        onChange={(e) => updateAchievement(i, "issuer", e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        Date
                      </Label>
                      <Input
                        value={award.date}
                        onChange={(e) => updateAchievement(i, "date", e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card
            ref={(el) => {
              sectionRefs.current["languages"] = el;
            }}
            className="rounded-[32px] border-2 border-border/40"
          >
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                  Language Logic
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addLanguage}
                  className="font-black text-[9px] uppercase tracking-widest"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Node
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-3">
              {languages.map((lang, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Input
                    className="flex-1 rounded-lg"
                    value={lang.language}
                    onChange={(e) => updateLanguage(i, "language", e.target.value)}
                    placeholder="Language"
                  />
                  <Select value={lang.proficiency} onValueChange={(val) => updateLanguage(i, "proficiency", val)}>
                    <SelectTrigger className="w-40 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Native", "Fluent", "Intermediate", "Basic"].map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => removeLanguage(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-8 bg-background/80 backdrop-blur-2xl border-t-2 border-border/10 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
          <div className="max-w-2xl mx-auto flex gap-6">
            <Button
              type="button"
              variant="outline"
              className="rounded-[20px] h-14 px-8 border-2 font-black uppercase text-[11px] tracking-widest"
              onClick={() => navigate("/app/profile")}
            >
              Discard
            </Button>
            <Button
              type="submit"
              className="flex-1 h-14 rounded-[20px] font-black uppercase tracking-[0.3em] text-[12px] shadow-2xl shadow-primary/30 group relative overflow-hidden"
              disabled={saving}
            >
              <span className="relative z-10 flex items-center gap-3">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                {saving ? "Syncing..." : "Finalize Sync"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-primary opacity-50 group-hover:opacity-100 transition-opacity" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
