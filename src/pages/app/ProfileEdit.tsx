import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Trash2,
  ExternalLink,
  Upload,
  Plus,
  X,
  ShieldCheck,
  Zap,
  Sparkles,
  Settings,
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

// Production Data Contracts[cite: 8]
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

  // Digital Workforce Anomaly Reporting[cite: 6]
  const reportAnomaly = async (event: string, context: any) => {
    console.error(`[Digital Workforce Anomaly] ${event}`, context);
    await supabase.functions.invoke("ai-support-assistant", {
      body: { type: "profile_edit_error", event, context },
    });
  };

  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !talent) return;

    setUploadingCV(true);
    try {
      const fileName = `${talent.id}/cv-${Date.now()}.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("portfolio-uploads")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("portfolio-uploads").getPublicUrl(fileName);
      setCvUrl(publicUrl);
      setParsingCV(true);

      const { data: parseResult, error: parseError } = await supabase.functions.invoke("parse-cv", {
        body: { cvUrl: publicUrl },
      });

      if (parseError) throw parseError;

      if (parseResult?.success) {
        const parsed = parseResult.parsed;
        setFormData((prev) => ({
          ...prev,
          fullName: parsed.full_name || prev.fullName,
          phone: parsed.phone || prev.phone,
        }));
        await updateTalent({ cvUrl: publicUrl, cvParsedAt: new Date().toISOString() });
        toast.success("CV artifacts integrated.");
      }
    } catch (error) {
      await reportAnomaly("CVParseFailure", { error });
      toast.error("Extraction error. Admin alerted.");
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
        languages,
        achievements: achievements as any,
      });
      await refreshTalent();
      setIsDirty(false);
      toast.success("Identity Ledger Synchronized.");
      navigate("/app/profile");
    } catch (error) {
      await reportAnomaly("ProfileSyncFailure", { error });
      toast.error("Sync failed. Check integrity constraints.");
    } finally {
      setSaving(false);
    }
  };

  if (!talent) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 pb-40 space-y-10 animate-in fade-in duration-700">
      {isDirty && (
        <div className="fixed top-20 right-6 z-50">
          <Badge variant="destructive" className="animate-pulse shadow-2xl">
            Pending Sync
          </Badge>
        </div>
      )}

      <header className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => navigate("/app/profile")}>
            <ArrowLeft className="h-5 w-5 text-primary" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold">Edit profile</h1>
            <p className="text-xs text-muted-foreground">Keep your identity parameters updated.</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Header Fields[cite: 8] */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-[32px] border-2 border-border/40">
            <CardHeader>
              <CardTitle className="text-[11px] font-black uppercase text-primary">Identity Frame</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfilePhotoUpload
                currentPhotoUrl={profilePhotoUrl}
                fullName={formData.fullName}
                onPhotoChange={setProfilePhotoUrl}
              />
            </CardContent>
          </Card>
          <Card className="rounded-[32px] border-2 border-border/40">
            <CardHeader>
              <CardTitle className="text-[11px] font-black uppercase text-primary">Environmental Banner</CardTitle>
            </CardHeader>
            <CardContent>
              <CoverImageUpload currentUrl={coverImageUrl} onImageChange={setCoverImageUrl} />
            </CardContent>
          </Card>
        </div>

        {/* CV Ingestion Logic[cite: 4] */}
        <Card className="rounded-[32px] border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-[11px] font-black uppercase text-primary flex items-center gap-3">
              <Zap className="h-4 w-4" /> Logic Artifact Ingestion (CV)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cvUrl ? (
              <div className="flex items-center justify-between p-6 bg-background rounded-2xl border">
                <div className="flex items-center gap-5">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-black text-sm italic">Active List Artifact</p>
                    <p className="text-[9px] uppercase text-muted-foreground">Verified Payload</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => window.open(cvUrl, "_blank")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setCvUrl("")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-4 border-dashed rounded-[32px] p-10 cursor-pointer text-center relative">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCVUpload}
                  className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                />
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm font-black uppercase">Authorize CV Ingestion</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Sections */}
        <div className="space-y-8">
          <Card className="rounded-[32px] border-2 border-border/40 p-8 space-y-8">
            {/* Identity Params */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label>Entity Name</Label>
                <Input value={formData.fullName} onChange={(e) => handleChange("fullName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
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
            {/* Add logic fields here... */}
          </Card>
        </div>

        {/* Footer Sync Button[cite: 6] */}
        <div className="fixed bottom-0 left-0 right-0 p-8 bg-background/80 backdrop-blur-2xl border-t border-border z-50">
          <div className="max-w-2xl mx-auto flex gap-6">
            <Button
              type="button"
              variant="outline"
              className="rounded-[20px] h-14 px-8"
              onClick={() => navigate("/app/profile")}
            >
              Discard
            </Button>
            <Button type="submit" className="flex-1 h-14 rounded-[20px]" disabled={saving}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5 mr-3" />}
              {saving ? "Syncing..." : "Finalize Sync"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
