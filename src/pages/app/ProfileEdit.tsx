import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
 ArrowLeft,
 Loader2,
 FileText,
 Trash2,
 ExternalLink,
 Upload,
 Plus,
 X,
 Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ProfilePhotoUpload } from "@/domains/profile/components/talent/ProfilePhotoUpload";
import { SkillsEditor } from "@/domains/profile/components/talent/SkillsEditor";
import { CoverImageUpload } from "@/domains/profile/components/talent/CoverImageUpload";
import { ExperienceEditor, ExperienceEntry } from "@/domains/profile/components/talent/ExperienceEditor";
import { EducationEditor, EducationEntry } from "@/domains/profile/components/talent/EducationEditor";
import { uploadPortfolioFile } from "@/domains/profile/repo/profileRepo";
import { PhoneInput } from "@/components/ui/phone-input";
import { parseCv } from "@/domains/jobs/api/jobsApi";
import { trackError } from "@/lib/errorTracking";
import { InlineSpinner } from "@/components/common/InlineSpinner";

interface LanguageEntry {
 language: string;
 proficiency: string;
}
interface AchievementEntry {
 title: string;
 issuer: string;
 date: string;
}

const PROFICIENCY_OPTIONS = ["Beginner", "Intermediate", "Advanced", "Fluent", "Native"];

export default function ProfileEdit() {
 const navigate = useNavigate();
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
 countryCode: "",
 country: "",
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

 // Hydrate from talent once it loads.
 useEffect(() => {
 if (!talent) return;
 setProfilePhotoUrl(talent.profilePhotoUrl ?? "");
 setCoverImageUrl(talent.coverImageUrl ?? "");
 setCvUrl(talent.cvUrl ?? "");
 setFormData({
 fullName: talent.fullName ?? "",
 phone: talent.phone ?? "",
 countryCode: talent.countryCode ?? "",
 country: talent.country ?? "",
 customProfession: talent.customProfession ?? "",
 currentStatus: talent.currentStatus ?? "",
 institution: talent.institution ?? "",
 fieldOfStudy: talent.fieldOfStudy ?? "",
 linkedinUrl: talent.linkedinUrl ?? "",
 portfolioUrl: talent.portfolioUrl ?? "",
 });
 setSkills(
 Array.isArray(talent.skills)
 ? talent.skills.map((s: any) => (typeof s === "string" ? s : s?.name ?? "")).filter(Boolean)
 : [],
 );
 setExperience(Array.isArray(talent.experience) ? (talent.experience as any) : []);
 setEducation(Array.isArray(talent.education) ? (talent.education as any) : []);
 setLanguages(Array.isArray(talent.languages) ? (talent.languages as any) : []);
 setAchievements(Array.isArray(talent.achievements) ? (talent.achievements as any) : []);
 setIsDirty(false);
 }, [talent]);

 const handleChange = useCallback((field: string, value: string) => {
 setFormData((prev) => ({ ...prev, [field]: value }));
 setIsDirty(true);
 }, []);

 const markDirty = useCallback(<T,>(setter: (v: T) => void) => (v: T) => {
 setter(v);
 setIsDirty(true);
 }, []);

 const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file || !talent) return;

 setUploadingCV(true);
 try {
 const fileName = `${talent.id}/cv-${Date.now()}.${file.name.split(".").pop()}`;
 const { publicUrl } = await uploadPortfolioFile(fileName, file, { upsert: true });
 setCvUrl(publicUrl);
 setIsDirty(true);
 setParsingCV(true);

 const parseResult: any = await parseCv({ cvUrl: publicUrl });

 if (parseResult?.success) {
 const parsed = parseResult.parsed ?? {};
 setFormData((prev) => ({
 ...prev,
 fullName: parsed.full_name || prev.fullName,
 phone: parsed.phone || prev.phone,
 }));
 await updateTalent({ cvUrl: publicUrl, cvParsedAt: new Date().toISOString() } as any);
 toast.success("We pulled your info from the CV.");
 } else {
 toast.success("CV uploaded.");
 }
 } catch (error) {
 trackError(error, { area: "ProfileEdit.handleCVUpload" });
 toast.error("Couldn't read that CV — try a different file.");
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
 skills: skills.map((name) => ({ name })) as any,
 experience: experience as any,
 education: education as any,
 languages,
 achievements: achievements as any,
 });
 await refreshTalent();
 setIsDirty(false);
 toast.success("Profile saved.");
 navigate("/app/profile");
 } catch (error) {
 trackError(error, { area: "ProfileEdit.handleSubmit" });
 toast.error("Couldn't save — please try again.");
 } finally {
 setSaving(false);
 }
 };

 const handleCancel = () => {
 if (isDirty && !window.confirm("You have unsaved changes. Discard them?")) return;
 navigate("/app/profile");
 };

 if (!talent) return null;

 return (
 <div className="max-w-3xl mx-auto px-6 py-10 pb-40 space-y-8 animate-in fade-in duration-300">
 {isDirty && (
 <div className="fixed top-20 right-6 z-50">
 <Badge variant="secondary" className="shadow-lg">
 Unsaved changes
 </Badge>
 </div>
 )}

 <header className="flex items-center gap-4">
 <Button variant="ghost" size="icon" className="h-10 w-10" onClick={handleCancel}>
 <ArrowLeft className="h-5 w-5" />
 </Button>
 <div>
 <h1 className="text-xl font-bold">Edit profile</h1>
 <p className="text-xs text-muted-foreground">Keep your details up to date.</p>
 </div>
 </header>

 <form onSubmit={handleSubmit} className="space-y-6">
 {/* Photos */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <Card>
 <CardHeader>
 <CardTitle className="text-sm">Profile photo</CardTitle>
 </CardHeader>
 <CardContent>
 <ProfilePhotoUpload
 currentPhotoUrl={profilePhotoUrl}
 fullName={formData.fullName}
 onPhotoChange={markDirty(setProfilePhotoUrl)}
 />
 </CardContent>
 </Card>
 <Card>
 <CardHeader>
 <CardTitle className="text-sm">Cover image</CardTitle>
 </CardHeader>
 <CardContent>
 <CoverImageUpload currentUrl={coverImageUrl} onImageChange={markDirty(setCoverImageUrl)} />
 </CardContent>
 </Card>
 </div>

 {/* CV */}
 <Card>
 <CardHeader>
 <CardTitle className="text-sm">Your CV</CardTitle>
 </CardHeader>
 <CardContent>
 {cvUrl ? (
 <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border">
 <div className="flex items-center gap-3">
 <FileText className="h-6 w-6 text-primary" />
 <div>
 <p className="font-medium text-sm">CV uploaded</p>
 <p className="text-xs text-muted-foreground">
 {parsingCV ? "Reading your CV…" : "We'll use this for applications."}
 </p>
 </div>
 </div>
 <div className="flex gap-1">
 <Button type="button" variant="ghost" size="icon" onClick={() => window.open(cvUrl, "_blank")}>
 <ExternalLink className="h-4 w-4" />
 </Button>
 <Button
 type="button"
 variant="ghost"
 size="icon"
 className="text-destructive"
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
 <label className="block border-2 border-dashed rounded-xl p-8 cursor-pointer text-center hover:bg-muted/30 transition relative">
 <Input
 type="file"
 accept=".pdf,.doc,.docx"
 onChange={handleCVUpload}
 disabled={uploadingCV}
 className="absolute inset-0 opacity-0 cursor-pointer"
 />
 {uploadingCV ? (
 <Loader2 className="h-6 w-6 mx-auto text-muted-foreground mb-2 animate-spin" />
 ) : (
 <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
 )}
 <p className="text-sm font-medium">Upload your CV</p>
 <p className="text-xs text-muted-foreground mt-1">PDF or Word — we'll auto-fill your profile</p>
 </label>
 )}
 </CardContent>
 </Card>

 {/* Basics */}
 <Card>
 <CardHeader>
 <CardTitle className="text-sm">About you</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <Label htmlFor="fullName">Full name</Label>
 <Input
 id="fullName"
 value={formData.fullName}
 onChange={(e) => handleChange("fullName", e.target.value)}
 />
 </div>
 <div className="space-y-1.5">
 <Label>Phone</Label>
 <PhoneInput
 value={formData.phone}
 countryCode={formData.countryCode || "US"}
 onValueChange={(v) => handleChange("phone", v)}
 onCountryCodeChange={(c, ct) => {
 handleChange("countryCode", c);
 if (ct) handleChange("country", ct);
 }}
 />
 </div>
 </div>
 <div className="space-y-1.5">
 <Label htmlFor="customProfession">Your role / title</Label>
 <Input
 id="customProfession"
 placeholder="e.g. Product Designer"
 value={formData.customProfession}
 onChange={(e) => handleChange("customProfession", e.target.value)}
 />
 </div>
 <div className="space-y-1.5">
 <Label htmlFor="currentStatus">Short bio</Label>
 <Textarea
 id="currentStatus"
 rows={4}
 placeholder="A line or two about what you do and what you're looking for."
 value={formData.currentStatus}
 onChange={(e) => handleChange("currentStatus", e.target.value)}
 />
 </div>
 </CardContent>
 </Card>

 {/* Education quick fields */}
 <Card>
 <CardHeader>
 <CardTitle className="text-sm">Current school (optional)</CardTitle>
 </CardHeader>
 <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <Label htmlFor="institution">University / institution</Label>
 <Input
 id="institution"
 value={formData.institution}
 onChange={(e) => handleChange("institution", e.target.value)}
 />
 </div>
 <div className="space-y-1.5">
 <Label htmlFor="fieldOfStudy">Field of study</Label>
 <Input
 id="fieldOfStudy"
 value={formData.fieldOfStudy}
 onChange={(e) => handleChange("fieldOfStudy", e.target.value)}
 />
 </div>
 </CardContent>
 </Card>

 {/* Links */}
 <Card>
 <CardHeader>
 <CardTitle className="text-sm">Links</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-1.5">
 <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
 <Input
 id="linkedinUrl"
 placeholder="https://linkedin.com/in/…"
 value={formData.linkedinUrl}
 onChange={(e) => handleChange("linkedinUrl", e.target.value)}
 />
 </div>
 <div className="space-y-1.5">
 <Label htmlFor="portfolioUrl">Portfolio / website</Label>
 <Input
 id="portfolioUrl"
 placeholder="https://…"
 value={formData.portfolioUrl}
 onChange={(e) => handleChange("portfolioUrl", e.target.value)}
 />
 </div>
 </CardContent>
 </Card>

 {/* Skills */}
 <Card>
 <CardHeader>
 <CardTitle className="text-sm">Skills</CardTitle>
 </CardHeader>
 <CardContent>
 <SkillsEditor skills={skills} onChange={markDirty(setSkills)} />
 </CardContent>
 </Card>

 {/* Experience */}
 <Card>
 <CardHeader>
 <CardTitle className="text-sm">Work experience</CardTitle>
 </CardHeader>
 <CardContent>
 <ExperienceEditor experience={experience} onChange={markDirty(setExperience)} />
 </CardContent>
 </Card>

 {/* Education list */}
 <Card>
 <CardHeader>
 <CardTitle className="text-sm">Education history</CardTitle>
 </CardHeader>
 <CardContent>
 <EducationEditor education={education} onChange={markDirty(setEducation)} />
 </CardContent>
 </Card>

 {/* Languages */}
 <Card>
 <CardHeader className="flex flex-row items-center justify-between">
 <CardTitle className="text-sm">Languages</CardTitle>
 <Button
 type="button"
 size="sm"
 variant="outline"
 onClick={() => {
 setLanguages([...languages, { language: "", proficiency: "Intermediate" }]);
 setIsDirty(true);
 }}
 >
 <Plus className="h-4 w-4 mr-1" /> Add
 </Button>
 </CardHeader>
 <CardContent className="space-y-3">
 {languages.length === 0 && (
 <p className="text-sm text-muted-foreground">No languages added yet.</p>
 )}
 {languages.map((l, idx) => (
 <div key={idx} className="flex gap-2 items-start">
 <Input
 placeholder="Language (e.g. English)"
 value={l.language}
 onChange={(e) => {
 const next = [...languages];
 next[idx] = { ...next[idx], language: e.target.value };
 setLanguages(next);
 setIsDirty(true);
 }}
 />
 <select
 value={l.proficiency}
 onChange={(e) => {
 const next = [...languages];
 next[idx] = { ...next[idx], proficiency: e.target.value };
 setLanguages(next);
 setIsDirty(true);
 }}
 className="h-10 px-3 rounded-md border border-input bg-background text-sm"
 >
 {PROFICIENCY_OPTIONS.map((p) => (
 <option key={p} value={p}>
 {p}
 </option>
 ))}
 </select>
 <Button
 type="button"
 size="icon"
 variant="ghost"
 className="text-destructive"
 onClick={() => {
 setLanguages(languages.filter((_, i) => i !== idx));
 setIsDirty(true);
 }}
 >
 <X className="h-4 w-4" />
 </Button>
 </div>
 ))}
 </CardContent>
 </Card>

 {/* Achievements */}
 <Card>
 <CardHeader className="flex flex-row items-center justify-between">
 <CardTitle className="text-sm">Achievements & certifications</CardTitle>
 <Button
 type="button"
 size="sm"
 variant="outline"
 onClick={() => {
 setAchievements([...achievements, { title: "", issuer: "", date: "" }]);
 setIsDirty(true);
 }}
 >
 <Plus className="h-4 w-4 mr-1" /> Add
 </Button>
 </CardHeader>
 <CardContent className="space-y-3">
 {achievements.length === 0 && (
 <p className="text-sm text-muted-foreground">No achievements added yet.</p>
 )}
 {achievements.map((a, idx) => (
 <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_140px_auto] gap-2 items-start">
 <Input
 placeholder="Title"
 value={a.title}
 onChange={(e) => {
 const next = [...achievements];
 next[idx] = { ...next[idx], title: e.target.value };
 setAchievements(next);
 setIsDirty(true);
 }}
 />
 <Input
 placeholder="Issuer"
 value={a.issuer}
 onChange={(e) => {
 const next = [...achievements];
 next[idx] = { ...next[idx], issuer: e.target.value };
 setAchievements(next);
 setIsDirty(true);
 }}
 />
 <Input
 type="month"
 value={a.date}
 onChange={(e) => {
 const next = [...achievements];
 next[idx] = { ...next[idx], date: e.target.value };
 setAchievements(next);
 setIsDirty(true);
 }}
 />
 <Button
 type="button"
 size="icon"
 variant="ghost"
 className="text-destructive"
 onClick={() => {
 setAchievements(achievements.filter((_, i) => i !== idx));
 setIsDirty(true);
 }}
 >
 <X className="h-4 w-4" />
 </Button>
 </div>
 ))}
 </CardContent>
 </Card>

 {/* Sticky save bar */}
 <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 border-t border-border z-40">
 <div className="max-w-3xl mx-auto flex gap-3">
 <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={handleCancel}>
 Cancel
 </Button>
 <Button type="submit" className="flex-1" disabled={saving}>
 {saving ? (
 <>
 <InlineSpinner size="sm" className="mr-2" /> Saving…
 </>
 ) : (
 <>
 <Check className="h-4 w-4 mr-2" /> Save changes
 </>
 )}
 </Button>
 </div>
 </div>
 </form>
 </div>
 );
}
