import { useState, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ExperienceEditor, ExperienceEntry } from "@/components/profile/ExperienceEditor";
import { EducationEditor, EducationEntry } from "@/components/profile/EducationEditor";
import { SkillsEditor } from "@/components/profile/SkillsEditor";
import { Save, Loader2, Plus, X } from "lucide-react";

type SectionType = "about" | "experience" | "education" | "skills" | "achievements" | "languages" | null;

interface LanguageEntry {
  language: string;
  proficiency: string;
}

interface AchievementEntry {
  title: string;
  issuer: string;
  date: string;
}

interface ProfileSectionEditorProps {
  section: SectionType;
  onClose: () => void;
  onSave: (section: SectionType, data: any) => Promise<void>;
  talent: any;
}

export function ProfileSectionEditor({ section, onClose, onSave, talent }: ProfileSectionEditorProps) {
  const [saving, setSaving] = useState(false);

  // About
  const [about, setAbout] = useState(talent?.currentStatus || "");

  // Experience
  const safeExp = (talent?.experience || []).map((exp: any) => ({
    company: exp.company || "",
    position: exp.position || exp.title || "",
    startDate: exp.startDate || exp.start_date || "",
    endDate: exp.endDate || exp.end_date || "",
    description: exp.description || "",
  }));
  const [experience, setExperience] = useState<ExperienceEntry[]>(safeExp);

  // Education
  const safeEdu = (talent?.education || []).map((edu: any) => ({
    institution: edu.institution || "",
    degree: edu.degree || "",
    fieldOfStudy: edu.fieldOfStudy || edu.field || "",
    startYear: edu.startYear || edu.start_year || "",
    endYear: edu.endYear || edu.end_year || "",
  }));
  const [education, setEducation] = useState<EducationEntry[]>(safeEdu);

  // Skills
  const safeSkills = Array.isArray(talent?.skills)
    ? talent.skills.map((s: any) => (typeof s === "string" ? s : s?.name || String(s)))
    : [];
  const [skills, setSkills] = useState<string[]>(safeSkills);

  // Achievements
  const safeAchievements = (talent?.achievements || []).map((a: any) => ({
    title: a.title || a.name || "",
    issuer: a.issuer || "",
    date: a.date || "",
  }));
  const [achievements, setAchievements] = useState<AchievementEntry[]>(safeAchievements);

  // Languages
  const safeLangs = (talent?.languages || []).map((l: any) => ({
    language: l.language || "",
    proficiency: l.proficiency || "Intermediate",
  }));
  const [languages, setLanguages] = useState<LanguageEntry[]>(safeLangs);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      let data: any;
      switch (section) {
        case "about":
          data = { currentStatus: about };
          break;
        case "experience":
          data = { experience };
          break;
        case "education":
          data = { education };
          break;
        case "skills":
          data = { skills };
          break;
        case "achievements":
          data = { achievements };
          break;
        case "languages":
          data = { languages };
          break;
      }
      await onSave(section, data);
      onClose();
    } finally {
      setSaving(false);
    }
  }, [section, about, experience, education, skills, achievements, languages, onSave, onClose]);

  const sectionTitles: Record<string, string> = {
    about: "About",
    experience: "Experience",
    education: "Education",
    skills: "Skills",
    achievements: "Honors & Awards",
    languages: "Languages",
  };

  // Language helpers
  const addLanguage = () => setLanguages((p) => [...p, { language: "", proficiency: "Intermediate" }]);
  const removeLanguage = (i: number) => setLanguages((p) => p.filter((_, idx) => idx !== i));
  const updateLanguage = (i: number, field: keyof LanguageEntry, value: string) =>
    setLanguages((p) => p.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));

  // Achievement helpers
  const addAchievement = () => setAchievements((p) => [...p, { title: "", issuer: "", date: "" }]);
  const removeAchievement = (i: number) => setAchievements((p) => p.filter((_, idx) => idx !== i));
  const updateAchievement = (i: number, field: keyof AchievementEntry, value: string) =>
    setAchievements((p) => p.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)));

  return (
    <Sheet open={!!section} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-hidden flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle>{section ? sectionTitles[section] || "Edit" : "Edit"}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {section === "about" && (
            <div className="space-y-2">
              <Label>About / Bio</Label>
              <Textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Tell us about your professional background..."
                rows={6}
                className="resize-y"
              />
            </div>
          )}

          {section === "experience" && (
            <ExperienceEditor experience={experience} onChange={setExperience} />
          )}

          {section === "education" && (
            <EducationEditor education={education} onChange={setEducation} />
          )}

          {section === "skills" && (
            <SkillsEditor skills={skills} onChange={setSkills} />
          )}

          {section === "achievements" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Honors & Awards</Label>
                <Button type="button" variant="outline" size="sm" onClick={addAchievement}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {achievements.length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-4">No awards added yet.</p>
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
                    <Label className="text-xs">Title</Label>
                    <Input value={award.title} onChange={(e) => updateAchievement(i, "title", e.target.value)} placeholder="e.g., Dean's List" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Issuer</Label>
                      <Input value={award.issuer} onChange={(e) => updateAchievement(i, "issuer", e.target.value)} placeholder="e.g., MIT" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Date</Label>
                      <Input value={award.date} onChange={(e) => updateAchievement(i, "date", e.target.value)} placeholder="e.g., 2023" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === "languages" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Languages</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLanguage}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {languages.length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-4">No languages added yet.</p>
              )}
              {languages.map((lang, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Input
                    className="flex-1"
                    value={lang.language}
                    onChange={(e) => updateLanguage(i, "language", e.target.value)}
                    placeholder="e.g., English"
                  />
                  <Select value={lang.proficiency} onValueChange={(val) => updateLanguage(i, "proficiency", val)}>
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
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeLanguage(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save bar */}
        <div className="shrink-0 pt-3 pb-2 border-t flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button className="flex-[2] rounded-xl" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
