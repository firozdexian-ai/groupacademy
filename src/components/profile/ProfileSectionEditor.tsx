import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExperienceEditor, ExperienceEntry } from "@/components/profile/ExperienceEditor";
import { EducationEditor, EducationEntry } from "@/components/profile/EducationEditor";
import { SkillsEditor } from "@/components/profile/SkillsEditor";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Save, Loader2, Plus, X, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

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

const SECTION_META: Record<string, { title: string; icon: any }> = {
  about: { title: "Personal Narrative Mapping", icon: ShieldCheck },
  experience: { title: "Professional History Registry", icon: Zap },
  education: { title: "Academic Ingestion Ledger", icon: Zap },
  skills: { title: "Psychometric Skill Matrix", icon: Zap },
  achievements: { title: "Achievement Record Logs", icon: ShieldCheck },
  languages: { title: "Communication Protocol Nodes", icon: ShieldCheck },
};

/**
 * GroUp Academy: Unified Profile Section Ingress Orchestrator (ProfileSectionEditor)
 * An authoritative operational sandbox managing targeted sub-section modifications and workspace ledger updates.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ProfileSectionEditor({ section, onClose, onSave, talent }: ProfileSectionEditorProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);
  const [saving, setSaving] = useState(false);

  // SECTION_REGISTRY: Individual Block State Properties
  const [about, setAbout] = useState("");
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<AchievementEntry[]>([]);
  const [languages, setLanguages] = useState<LanguageEntry[]>([]);

  // Synchronize component lifecycles to safely reject background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    if (section) {
      trackEvent("profile_section_editor_opened", { activeSectionType: section });
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [section]);

  // HYDRATION LIFECYCLE: Enforce full, deep synchronizations if incoming parent talent properties mutate
  useEffect(() => {
    if (!talent) return;

    setAbout(typeof talent.currentStatus === "string" ? talent.currentStatus : "");

    const expData = Array.isArray(talent.experience) ? talent.experience : [];
    setExperience(
      expData.map((exp: any) => ({
        company: String(exp?.company || ""),
        position: String(exp?.position || exp?.title || ""),
        startDate: String(exp?.startDate || exp?.start_date || ""),
        endDate: String(exp?.endDate || exp?.end_date || ""),
        description: String(exp?.description || ""),
      }))
    );

    const eduData = Array.isArray(talent.education) ? talent.education : [];
    setEducation(
      eduData.map((edu: any) => ({
        institution: String(edu?.institution || ""),
        degree: String(edu?.degree || ""),
        fieldOfStudy: String(edu?.fieldOfStudy || edu?.field || ""),
        startYear: String(edu?.startYear || edu?.start_year || ""),
        endYear: String(edu?.endYear || edu?.end_year || ""),
      }))
    );

    const skillData = Array.isArray(talent.skills) ? talent.skills : [];
    setSkills(skillData.map((s: any) => (typeof s === "string" ? s : String(s?.name || s))));

    const awardData = Array.isArray(talent.achievements) ? talent.achievements : [];
    setAchievements(
      awardData.map((a: any) => ({
        title: String(a?.title || a?.name || ""),
        issuer: String(a?.issuer || ""),
        date: String(a?.date || ""),
      }))
    );

    const langData = Array.isArray(talent.languages) ? talent.languages : [];
    setLanguages(
      langData.map((l: any) => ({
        language: String(l?.language || ""),
        proficiency: String(l?.proficiency || "Intermediate"),
      }))
    );
  }, [talent, section]);

  const handleExecutiveSave = useCallback(async () => {
    if (saving || !section) return;

    setSaving(true);
    trackEvent("profile_section_save_initiated", { activeSectionType: section });
    const dynamicToastTrackerId = toast.loading(`Synchronizing ${section} components into the profile index matrix...`);

    try {
      let syncPayload: Record<string, any> = {};
      
      switch (section) {
        case "about":
          syncPayload = { currentStatus: about.trim() };
          break;
        case "experience":
          syncPayload = { experience: experience.filter((e) => e.company.trim() || e.position.trim()) };
          break;
        case "education":
          syncPayload = { education: education.filter((e) => e.institution.trim() || e.degree.trim()) };
          break;
        case "skills":
          syncPayload = { skills: skills.filter((s) => s.trim()) };
          break;
        case "achievements":
          syncPayload = { achievements: achievements.filter((a) => a.title.trim() || a.issuer.trim()) };
          break;
        case "languages":
          syncPayload = { languages: languages.filter((l) => l.language.trim()) };
          break;
      }

      await onSave(section, syncPayload);
      
      // Invalidate target profile state markers to refresh workspace hydration indices
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (isMountedRef.current) {
        toast.success("Identity variables successfully validated down profile rows.", { id: dynamicToastTrackerId });
        trackEvent("profile_section_save_success", { activeSectionType: section });
        onClose();
      }
    } catch (caughtPipelineExceptionErr: any) {
      const formattedExceptionMsgStr = caughtPipelineExceptionErr instanceof Error 
        ? caughtPipelineExceptionErr.message 
        : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, {
        component: "ProfileSectionEditor",
        action: "commit_profile_section_save_api",
        sectionKey: section
      });

      toast.error(`Ecosystem write validation error: ${formattedExceptionMsgStr}`, { id: dynamicToastTrackerId });
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  }, [section, about, experience, education, skills, achievements, languages, onSave, onClose, saving, queryClient]);

  const activeMetaNode = useMemo(() => {
    return section ? (SECTION_META[section] || { title: "Identity Configuration Workspace", icon: ShieldCheck }) : null;
  }, [section]);

  const IconComponent = activeMetaNode?.icon || ShieldCheck;

  return (
    <Sheet open={!!section} onOpenChange={(isOpenState) => {
      if (!isOpenState && !saving) {
        trackEvent("profile_section_editor_cancelled");
        onClose();
      }
    }}>
      <SheetContent
        side="bottom"
        className="h-[90vh] rounded-t-2xl border-t border-border/40 bg-background/95 backdrop-blur-xl flex flex-col p-5 sm:p-6 text-left antialiased transform-gpu select-none sm:select-text"
      >
        {/* HUD LEVEL 1: OVERLAY CONTENT WORKSPACE ROW HEADER */}
        <SheetHeader className="mb-4 text-left select-none shrink-0 leading-none w-full">
          <div className="flex items-center gap-2.5 leading-none w-full">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/5 text-primary flex items-center justify-center shrink-0 shadow-inner">
              <IconComponent className="h-4 w-4 text-primary fill-primary/5 stroke-[2.2] animate-pulse" />
            </div>
            <div className="min-w-0 flex flex-col justify-center leading-none flex-1">
              <SheetTitle className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide leading-none">
                {activeMetaNode ? activeMetaNode.title : "Initializing Input Context Parameters"}
              </SheetTitle>
              <SheetDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none pt-1">
                Synchronizing structural profile identity components into global verification matrices
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* HUD LEVEL 2: SCROLL INTERACTIVE SECTION CANVAS ROW FORMS */}
        <div className="flex-1 overflow-y-auto pr-1 outline-none space-y-4 w-full min-w-0 font-bold text-xs text-foreground">
          
          {/* SECTION TARGET A: ABOUT TEXTAREA AREA */}
          {section === "about" && (
            <div className="space-y-1.5 text-left w-full min-w-0 animate-in fade-in duration-200">
              <Label className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none">Candidate Professional Bio Summary</Label>
              <Textarea
                value={about}
                disabled={saving}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Synchronize your digital professional narrative, key performance competencies, and project deliverables track history…"
                className="min-h-[180px] w-full rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3.5 leading-relaxed italic resize-none shadow-inner"
              />
            </div>
          )}

          {/* SHARED DIRECTORY ROW CONTROLLERS */}
          {section === "experience" && <ExperienceEditor experience={experience} onChange={setExperience} />}
          {section === "education" && <EducationEditor education={education} onChange={setEducation} />}
          {section === "skills" && <SkillsEditor skills={skills} onChange={setSkills} />}

          {/* SECTION TARGET B: ACHIEVEMENTS ARTIFACT ROWS ARRAY */}
          {section === "achievements" && (
            <div className="space-y-4 w-full min-w-0 text-left animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-4 px-0.5 select-none w-full leading-none shrink-0">
                <Label className="text-[10px] font-extrabold uppercase tracking-wide text-primary block leading-none">Honors, Awards & Distinction Documents</Label>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={saving}
                  onClick={() => setAchievements((p) => [...p, { title: "", issuer: "", date: "" }])}
                  className="h-7 px-2.5 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground font-bold uppercase text-[9px] tracking-wide shrink-0 shadow-sm cursor-pointer hover:bg-accent gap-1 flex items-center justify-center transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> 
                  <span>Add Distinction</span>
                </Button>
              </div>
              
              <div className="space-y-3.5 w-full min-w-0">
                {achievements.map((awardItem, i) => (
                  <div
                    key={i}
                    className="group/row relative border border-border/40 bg-card/30 rounded-xl p-4 sm:p-5 space-y-3.5 hover:border-border/80 transition-colors w-full min-w-0 flex flex-col justify-center animate-in slide-in-from-bottom-1 duration-150"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      disabled={saving}
                      className="h-7 w-7 rounded-lg text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 transition-colors absolute top-3 right-3 p-0 border-none shadow-none z-10"
                      onClick={() => setAchievements((p) => p.filter((_, idx) => idx !== i))}
                    >
                      <X className="h-4 w-4 stroke-[2.5]" />
                    </Button>
                    
                    <div className="space-y-1.5 text-left w-full min-w-0">
                      <Label className="text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground/50 block pl-0.5 leading-none select-none">Distinction Award Title *</Label>
                      <Input
                        value={awardItem.title}
                        disabled={saving}
                        onChange={(e) =>
                          setAchievements((p) => p.map((a, idx) => (idx === i ? { ...a, title: e.target.value } : a)))
                        }
                        className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner w-full block"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
                      <div className="space-y-1.5 text-left w-full min-w-0">
                        <Label className="text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground/50 block pl-0.5 leading-none select-none">Awarding Body Issuer Node *</Label>
                        <Input
                          value={awardItem.issuer}
                          disabled={saving}
                          onChange={(e) =>
                            setAchievements((p) => p.map((a, idx) => (idx === i ? { ...a, issuer: e.target.value } : a)))
                          }
                          className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner w-full block"
                        />
                      </div>
                      <div className="space-y-1.5 text-left w-full min-w-0">
                        <Label className="text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground/50 block pl-0.5 leading-none select-none">Validation Verification Date</Label>
                        <Input
                          value={awardItem.date}
                          disabled={saving}
                          onChange={(e) =>
                            setAchievements((p) => p.map((a, idx) => (idx === i ? { ...a, date: e.target.value } : a)))
                          }
                          className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner font-mono text-left block select-text uppercase tracking-wider w-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION TARGET C: LANGUAGES COMMUNICATION CHANNELS ROWS */}
          {section === "languages" && (
            <div className="space-y-4 w-full min-w-0 text-left animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-4 px-0.5 select-none w-full leading-none shrink-0">
                <Label className="text-[10px] font-extrabold uppercase tracking-wide text-primary block leading-none">Authorized Communication Protocols</Label>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={saving}
                  onClick={() => setLanguages((p) => [...p, { language: "", proficiency: "Intermediate" }])}
                  className="h-7 px-2.5 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground font-bold uppercase text-[9px] tracking-wide shrink-0 shadow-sm cursor-pointer hover:bg-accent gap-1 flex items-center justify-center transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> 
                  <span>Add Protocol</span>
                </Button>
              </div>
              
              <div className="space-y-2 w-full min-w-0 flex flex-col justify-center">
                {languages.map((langItem, i) => (
                  <div key={i} className="flex items-center gap-3 w-full min-w-0 animate-in slide-in-from-left-1 duration-150 leading-none">
                    <Input
                      value={langItem.language}
                      disabled={saving}
                      className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner flex-1 min-w-0 block"
                      onChange={(e) =>
                        setLanguages((p) => p.map((l, idx) => (idx === i ? { ...l, language: e.target.value } : l)))
                      }
                      placeholder="Language protocol label (e.g. English, Bengali)…"
                    />
                    
                    <Select
                      value={langItem.proficiency}
                      disabled={saving}
                      onValueChange={(val) =>
                        setLanguages((p) => p.map((l, idx) => (idx === i ? { ...l, proficiency: val } : l)))
                      }
                    >
                      <SelectTrigger className="h-10 w-36 sm:w-40 rounded-xl border border-border/40 bg-background/50 text-xs font-bold uppercase tracking-wide px-3 cursor-pointer shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-border/40 bg-background font-bold text-xs">
                        <SelectItem value="Native" className="cursor-pointer text-xs font-semibold py-2 rounded-lg">Native Dialect</SelectItem>
                        <SelectItem value="Fluent" className="cursor-pointer text-xs font-semibold py-2 rounded-lg">Fluent Ingress</SelectItem>
                        <SelectItem value="Intermediate" className="cursor-pointer text-xs font-semibold py-2 rounded-lg">Intermediate</SelectItem>
                        <SelectItem value="Basic" className="cursor-pointer text-xs font-semibold py-2 rounded-lg">Basic Operational</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      disabled={saving}
                      className="h-9 w-9 rounded-xl text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors shrink-0 p-0 border-none shadow-none flex items-center justify-center"
                      onClick={() => setLanguages((p) => p.filter((_, idx) => idx !== i))}
                    >
                      <X className="h-4 w-4 stroke-[2.5]" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* HUD LEVEL 3: FOOTER ACTION CONFIRMATION OVERLAY TRACK BUTTON ROW */}
        <DialogFooter className="mt-4 gap-2.5 sm:gap-0 select-none border-t border-border/10 pt-4 w-full shrink-0 flex items-center justify-end font-bold text-xs">
          <Button
            variant="ghost"
            type="button"
            className="h-9 px-4 rounded-xl text-muted-foreground hover:text-foreground font-bold uppercase text-[10px] tracking-wide shrink-0 transition-colors cursor-pointer"
            onClick={onClose}
            disabled={saving}
          >
            Abort Section Changes
          </Button>
          <Button
            type="button"
            onClick={handleExecutiveSave}
            disabled={saving}
            className="h-9 px-5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                <span>Syncing Segment Ledger Node…</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 stroke-[2.2]" />
                <span>Authorize Segment Sync</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </SheetContent>
    </Sheet>
  );
}