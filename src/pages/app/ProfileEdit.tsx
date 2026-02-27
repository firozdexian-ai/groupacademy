import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, Loader2, FileText, Trash2, ExternalLink, Upload, AlertCircle, Plus, X } from "lucide-react";
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

  // Section refs for hash-based scrolling
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

  // Initialize Data
  useEffect(() => {
    if (talent) {
      setFormData({
        fullName: talent.fullName || "",
        phone: talent.phone || "",
        countryCode: (talent as any).country_code || "+880",
        country: (talent as any).country || "BD",
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

      const safeSkills = Array.isArray(talent.skills)
        ? talent.skills.map((s: any) => (typeof s === "string" ? s : s?.name || String(s)))
        : [];
      setSkills(safeSkills);

      const safeExp = Array.isArray(talent.experience)
        ? talent.experience.map((exp: any) => ({
            company: exp.company || "",
            position: exp.position || exp.title || "",
            startDate: exp.startDate || exp.start_date || "",
            endDate: exp.endDate || exp.end_date || "",
            description: exp.description || "",
          }))
        : [];
      setExperience(safeExp);

      const safeEdu = Array.isArray(talent.education)
        ? talent.education.map((edu: any) => ({
            institution: edu.institution || "",
            degree: edu.degree || "",
            fieldOfStudy: edu.fieldOfStudy || edu.field || "",
            startYear: edu.startYear || edu.start_year || "",
            endYear: edu.endYear || edu.end_year || "",
          }))
        : [];
      setEducation(safeEdu);

      const safeLangs = Array.isArray(talent.languages)
        ? talent.languages.map((l: any) => ({
            language: l.language || "",
            proficiency: l.proficiency || "Intermediate",
          }))
        : [];
      setLanguages(safeLangs);

      const safeAchievements = Array.isArray(talent.achievements)
        ? talent.achievements.map((a: any) => ({
            title: a.title || a.name || "",
            issuer: a.issuer || "",
            date: a.date || "",
          }))
        : [];
      setAchievements(safeAchievements);
    }
  }, [talent]);

  // Scroll to section from hash
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash && sectionRefs.current[hash]) {
      setTimeout(() => {
        sectionRefs.current[hash]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [location.hash]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handlePhotoChange = (url: string | null) => {
    setProfilePhotoUrl(url || "");
    setIsDirty(true);
  };

  const handleCoverImageChange = (url: string | null) => {
    setCoverImageUrl(url || "");
    setIsDirty(true);
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !talent) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type", { description: "Please upload a PDF or Word document" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", { description: "Max file size is 5MB" });
      return;
    }

    setUploadingCV(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${talent.id}/cv-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-uploads")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("portfolio-uploads").getPublicUrl(fileName);

      setCvUrl(publicUrl);
      setUploadingCV(false);
      setParsingCV(true);

      toast.info("Analyzing CV...", { description: "We're extracting details to auto-fill your profile." });

      try {
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

          if (parsed.skills?.length > 0) {
            setSkills((prev) => Array.from(new Set([...prev, ...parsed.skills])));
          }
          if (parsed.experience?.length > 0) {
            const newExp = parsed.experience.map((exp: any) => ({
              company: exp.company || "",
              position: exp.title || "",
              startDate: exp.start_date || "",
              endDate: exp.end_date || "",
              description: exp.description || "",
            }));
            setExperience(newExp);
          }
          if (parsed.education?.length > 0) {
            const newEdu = parsed.education.map((edu: any) => ({
              institution: edu.institution || "",
              degree: edu.degree || "",
              fieldOfStudy: edu.field || "",
              startYear: edu.start_year || "",
              endYear: edu.end_year || "",
            }));
            setEducation(newEdu);
          }

          const immediateUpdate: Record<string, any> = {
            cvUrl: publicUrl,
            cvParsedAt: new Date().toISOString(),
          };
          if (parsed.full_name) immediateUpdate.fullName = parsed.full_name;
          if (parsed.phone) immediateUpdate.phone = parsed.phone;
          if (parsed.linkedin_url) immediateUpdate.linkedinUrl = parsed.linkedin_url;
          if (parsed.portfolio_url) immediateUpdate.portfolioUrl = parsed.portfolio_url;
          if (parsed.skills?.length) immediateUpdate.skills = parsed.skills;
          if (parsed.experience?.length) {
            immediateUpdate.experience = parsed.experience.map((exp: any) => ({
              company: exp.company || "",
              position: exp.title || "",
              startDate: exp.start_date || "",
              endDate: exp.end_date || "",
              description: exp.description || "",
            }));
          }
          if (parsed.education?.length) {
            immediateUpdate.education = parsed.education.map((edu: any) => ({
              institution: edu.institution || "",
              degree: edu.degree || "",
              fieldOfStudy: edu.field || "",
              startYear: edu.start_year || "",
              endYear: edu.end_year || "",
            }));
          }

          await updateTalent(immediateUpdate);
          await refreshTalent();
          toast.success("Profile Updated!", { description: "Your CV data has been saved automatically." });
        } else {
          await updateTalent({ cvUrl: publicUrl });
          await refreshTalent();
          toast.warning("CV Uploaded", { description: "Could not auto-extract details. Please fill them manually." });
        }
      } catch (parseErr) {
        console.error("CV parse error:", parseErr);
        toast.warning("Analysis Failed", { description: "CV uploaded, but auto-fill failed." });
      }
    } catch (error) {
      console.error("CV upload error:", error);
      toast.error("Upload Failed", { description: "Could not upload your CV. Please try again." });
    } finally {
      setUploadingCV(false);
      setParsingCV(false);
    }
  };

  const handleRemoveCV = () => {
    setCvUrl("");
    toast.info("CV Removed");
  };

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

  // Languages handlers
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

  // Achievements handlers
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateTalent({
        fullName: formData.fullName,
        phone: formData.phone,
        countryCode: formData.countryCode,
        country: formData.country,
        customProfession: formData.customProfession,
        currentStatus: formData.currentStatus,
        institution: formData.institution,
        fieldOfStudy: formData.fieldOfStudy,
        linkedinUrl: formData.linkedinUrl,
        portfolioUrl: formData.portfolioUrl,
        profilePhotoUrl: profilePhotoUrl || undefined,
        coverImageUrl: coverImageUrl || undefined,
        cvUrl: cvUrl || undefined,
        skills: skills as any,
        experience: experience as any,
        education: education as any,
        languages: languages as any,
        achievements: achievements as any,
      });

      await refreshTalent();
      setIsDirty(false);
      toast.success("Profile saved successfully");
      navigate("/app/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Save Failed", { description: "Could not save your profile changes." });
    } finally {
      setSaving(false);
    }
  };

  if (!talent) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-36">
      {/* Unsaved changes indicator */}
      {isDirty && (
        <div className="fixed top-16 md:top-4 right-4 z-50">
          <Badge variant="destructive" className="animate-pulse shadow-lg">
            Unsaved changes
          </Badge>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/profile")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Edit Profile</h1>
          <p className="text-sm text-muted-foreground">Update your professional details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfilePhotoUpload
              currentPhotoUrl={profilePhotoUrl}
              fullName={formData.fullName}
              onPhotoChange={handlePhotoChange}
            />
          </CardContent>
        </Card>

        {/* Cover Image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cover Banner</CardTitle>
          </CardHeader>
          <CardContent>
            <CoverImageUpload
              currentUrl={coverImageUrl}
              onImageChange={handleCoverImageChange}
            />
          </CardContent>
        </Card>

        {/* CV Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex justify-between items-center">
              <span>CV / Resume</span>
              {parsingCV && (
                <span className="text-xs font-normal text-primary flex items-center">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Analyzing...
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cvUrl ? (
              <div className="flex items-center justify-between p-3 bg-muted/50 border rounded-lg">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-background rounded-md border">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">Current CV</p>
                    <p className="text-xs text-muted-foreground">Uploaded</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" onClick={() => window.open(cvUrl, "_blank")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveCV}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative border-2 border-dashed rounded-lg p-5 hover:bg-muted/50 transition-colors">
                <Input
                  id="cv-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCVUpload}
                  disabled={uploadingCV || parsingCV}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center space-y-2 pointer-events-none">
                  {uploadingCV ? (
                    <Loader2 className="h-7 w-7 animate-spin mx-auto text-primary" />
                  ) : (
                    <Upload className="h-7 w-7 mx-auto text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{uploadingCV ? "Uploading..." : "Click to upload CV"}</p>
                    <p className="text-xs text-muted-foreground">PDF or DOCX (Max 5MB)</p>
                  </div>
                </div>
              </div>
            )}

            {!cvUrl && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md text-blue-700 dark:text-blue-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Uploading a CV will automatically analyze and fill in your skills, experience, and education.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Basic Info */}
        <div ref={(el) => { sectionRefs.current["about"] = el; }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <PhoneInput
                    value={formData.phone}
                    countryCode={formData.countryCode}
                    onValueChange={(value) => handleChange("phone", value)}
                    onCountryCodeChange={(code, country) => {
                      handleChange("countryCode", code);
                      handleChange("country", country);
                    }}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customProfession">Profession / Headline</Label>
                <Input
                  id="customProfession"
                  value={formData.customProfession}
                  onChange={(e) => handleChange("customProfession", e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentStatus">About / Bio</Label>
                <Textarea
                  id="currentStatus"
                  value={formData.currentStatus}
                  onChange={(e) => handleChange("currentStatus", e.target.value)}
                  placeholder="Tell us about your professional background..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skills */}
        <div ref={(el) => { sectionRefs.current["skills"] = el; }}>
          <Card>
            <CardContent className="pt-6">
              <SkillsEditor skills={skills} onChange={handleSkillsChange} />
            </CardContent>
          </Card>
        </div>

        {/* Experience */}
        <div ref={(el) => { sectionRefs.current["experience"] = el; }}>
          <Card>
            <CardContent className="pt-6">
              <ExperienceEditor experience={experience} onChange={handleExperienceChange} />
            </CardContent>
          </Card>
        </div>

        {/* Education */}
        <div ref={(el) => { sectionRefs.current["education"] = el; }}>
          <Card>
            <CardContent className="pt-6">
              <EducationEditor education={education} onChange={handleEducationChange} />
            </CardContent>
          </Card>
        </div>

        {/* Honors & Awards */}
        <div ref={(el) => { sectionRefs.current["achievements"] = el; }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Honors & Awards</CardTitle>
                <Button type="button" variant="ghost" size="sm" onClick={addAchievement}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {achievements.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No awards added yet.</p>
              )}
              {achievements.map((award, i) => (
                <div key={i} className="border rounded-xl p-4 space-y-3 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 text-destructive"
                    onClick={() => removeAchievement(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="space-y-2">
                    <Label>Award / Honor Title</Label>
                    <Input
                      value={award.title}
                      onChange={(e) => updateAchievement(i, "title", e.target.value)}
                      placeholder="e.g., Dean's List"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Issuer / Organization</Label>
                      <Input
                        value={award.issuer}
                        onChange={(e) => updateAchievement(i, "issuer", e.target.value)}
                        placeholder="e.g., MIT"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        value={award.date}
                        onChange={(e) => updateAchievement(i, "date", e.target.value)}
                        placeholder="e.g., 2023"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Languages */}
        <div ref={(el) => { sectionRefs.current["languages"] = el; }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Languages</CardTitle>
                <Button type="button" variant="ghost" size="sm" onClick={addLanguage}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {languages.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No languages added yet.</p>
              )}
              {languages.map((lang, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Input
                    className="flex-1"
                    value={lang.language}
                    onChange={(e) => updateLanguage(i, "language", e.target.value)}
                    placeholder="e.g., English"
                  />
                  <Select
                    value={lang.proficiency}
                    onValueChange={(val) => updateLanguage(i, "proficiency", val)}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Native">Native</SelectItem>
                      <SelectItem value="Fluent">Fluent</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Basic">Basic</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive"
                    onClick={() => removeLanguage(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Social Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolioUrl">Portfolio URL</Label>
              <Input
                id="portfolioUrl"
                type="url"
                value={formData.portfolioUrl}
                onChange={(e) => handleChange("portfolioUrl", e.target.value)}
                placeholder="https://yourportfolio.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sticky Save Bar */}
        <div className="fixed bottom-[68px] md:bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t z-50 md:relative md:p-0 md:bg-transparent md:border-0 safe-bottom">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate("/app/profile")}>
              Cancel
            </Button>
            <Button type="submit" className="flex-[2]" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
