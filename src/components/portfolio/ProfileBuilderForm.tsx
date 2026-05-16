import { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Plus, Trash2, GraduationCap, Briefcase, Wrench, FolderOpen, Award, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProfileData {
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationYear: string;
    current: boolean;
  }>;
  experience: Array<{ title: string; company: string; duration: string; description: string }>;
  skills: Array<{ name: string; proficiency: "beginner" | "intermediate" | "advanced" | "expert" }>;
  projects: Array<{ name: string; description: string; url?: string }>;
  achievements: Array<{ title: string; description: string; date?: string }>;
}

interface ProfileBuilderFormProps {
  value: ProfileData;
  onChange: (data: ProfileData) => void;
}

const SCHEMA_TEMPLATES = {
  education: { institution: "", degree: "", fieldOfStudy: "", graduationYear: "", current: false },
  experience: { title: "", company: "", duration: "", description: "" },
  skill: { name: "", proficiency: "intermediate" as const },
  project: { name: "", description: "", url: "" },
  achievement: { title: "", description: "", date: "" },
};

/**
 * GroUp Academy: Professional Profile Identity Configuration Architect (ProfileBuilderForm)
 * An authoritative operational workflow node managing structural portfolio data ingestion and resume block indexing.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export default function ProfileBuilderForm({ value, onChange }: ProfileBuilderFormProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);
  const [activeSegment, setActiveSegment] = useState<keyof ProfileData>("education");

  // Synchronize component lifecycles to safely reject background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("profile_builder_form_mounted");
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Safe Fallback Assertions: Protect data parsing layers against incomplete schema shapes
  const safeProfileValue = useMemo(() => {
    return {
      education: Array.isArray(value?.education) ? value.education : [],
      experience: Array.isArray(value?.experience) ? value.experience : [],
      skills: Array.isArray(value?.skills) ? value.skills : [],
      projects: Array.isArray(value?.projects) ? value.projects : [],
      achievements: Array.isArray(value?.achievements) ? value.achievements : [],
    } satisfies ProfileData;
  }, [value]);

  const segments = useMemo(
    () => [
      {
        id: "education" as const,
        label: "Academic Core",
        icon: GraduationCap,
        count: safeProfileValue.education.length,
      },
      { id: "experience" as const, label: "Ops History", icon: Briefcase, count: safeProfileValue.experience.length },
      { id: "skills" as const, label: "Skill Registry", icon: Wrench, count: safeProfileValue.skills.length },
      { id: "projects" as const, label: "Artifact Nodes", icon: FolderOpen, count: safeProfileValue.projects.length },
      { id: "achievements" as const, label: "Award Logs", icon: Award, count: safeProfileValue.achievements.length },
    ],
    [safeProfileValue],
  );

  const updateRegistryNode = (key: keyof ProfileData, index: number, field: string, val: any) => {
    try {
      const updatedArray = [...safeProfileValue[key]] as any[];
      if (index < 0 || index >= updatedArray.length) return;

      updatedArray[index] = { ...updatedArray[index], [field]: val };

      if (isMountedRef.current) {
        onChange({ ...safeProfileValue, [key]: updatedArray });
      }
    } catch (err) {
      trackError(err, { component: "ProfileBuilderForm", action: "update_registry_node", segmentKey: key });
    }
  };

  const removeRegistryNode = (key: keyof ProfileData, index: number) => {
    trackEvent("profile_builder_node_removed", { segmentKey: key, indexPosition: index });
    try {
      const updatedArray = safeProfileValue[key].filter((_, i) => i !== index);
      if (isMountedRef.current) {
        onChange({ ...safeProfileValue, [key]: updatedArray });
      }
    } catch (err) {
      trackError(err, { component: "ProfileBuilderForm", action: "remove_registry_node", segmentKey: key });
    }
  };

  const activeSegmentConfig = useMemo(() => {
    return segments.find((s) => s.id === activeSegment) || segments[0];
  }, [segments, activeSegment]);

  const CurrentIcon = activeSegmentConfig.icon;

  return (
    <div className="space-y-4 text-left max-w-full w-full transform-gpu antialiased">
      {/* HUD LEVEL 1: TAB SEGMENT REGISTRY CONTROL STRIP */}
      <div className="flex flex-wrap gap-2 pb-3 border-b border-border/10 select-none w-full">
        {segments.map((segmentItem) => {
          const SegmentIcon = segmentItem.icon;
          const isCurrentActive = activeSegment === segmentItem.id;
          return (
            <Button
              key={segmentItem.id}
              type="button"
              variant={isCurrentActive ? "default" : "outline"}
              size="sm"
              onClick={() => {
                trackEvent("profile_builder_segment_swapped", { targetSegment: segmentItem.id });
                setActiveSegment(segmentItem.id);
              }}
              className={cn(
                "h-9 rounded-xl font-bold uppercase text-[10px] tracking-wide transition-all gap-1.5 border cursor-pointer select-none",
                isCurrentActive
                  ? "bg-primary text-primary-foreground border-transparent shadow-sm scale-102"
                  : "bg-background/50 border-border/40 text-muted-foreground/80 hover:bg-background/80 hover:text-foreground",
              )}
            >
              <SegmentIcon className="h-3.5 w-3.5 stroke-[2.2]" />
              <span>{segmentItem.label}</span>
              {segmentItem.count > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 px-1.5 h-4.5 text-[9px] font-mono font-extrabold bg-muted text-foreground tracking-normal rounded border border-border/5"
                >
                  {segmentItem.count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* HUD LEVEL 2: DYNAMIC PORTFOLIO ARTIFACT ENTRY BLOCK CONTAINER */}
      <div className="w-full min-w-0 animate-in slide-in-from-bottom-1 duration-200 outline-none">
        <Card className="border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden text-left w-full min-w-0 flex flex-col justify-center">
          <CardHeader className="bg-muted/10 border-b border-border/10 p-4 sm:p-5 select-none leading-none w-full">
            <div className="flex items-center justify-between gap-4 w-full leading-none pr-1">
              <div className="space-y-1.5 flex flex-col justify-center min-w-0 flex-1 leading-none">
                <CardTitle className="text-xs sm:text-sm font-bold text-foreground/90 uppercase tracking-wide flex items-center gap-2 leading-none block truncate">
                  <CurrentIcon className="h-4 w-4 text-primary stroke-[2.2] shrink-0 animate-pulse" />
                  <span>{activeSegmentConfig.label} Configuration Registry</span>
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block leading-none pt-0.5">
                  Ecosystem alignment write protocol active &mdash; specify structural artifacts
                </CardDescription>
              </div>
              <ShieldCheck className="h-5 w-5 text-primary/30 stroke-[2.2] shrink-0 hidden sm:block" />
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0 flex flex-col justify-center">
            {(safeProfileValue[activeSegment] as any[]).map((artifactItem, idx) => (
              <div
                key={idx}
                className="group relative border border-border/40 rounded-xl p-4 sm:p-5 bg-background/50 hover:border-border/80 transition-colors w-full min-w-0 shadow-xs flex flex-col justify-center"
              >
                {/* REMOVE SEGMENT CORE NODE BUTTON */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 h-7 w-7 text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors p-0 border-none shadow-none z-10"
                  onClick={() => removeRegistryNode(activeSegment, idx)}
                  title="Expunge this binary record entry from profile data mapping array"
                >
                  <Trash2 className="h-4 w-4 stroke-[2.2]" />
                </Button>

                {/* FORM LAYER TRACK: ACADEMIC INTEL SEGMENT SPECIFICATION */}
                {activeSegment === "education" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full font-bold text-xs tracking-tight">
                    <div className="space-y-1.5 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 leading-none">
                        Institutional Track Name *
                      </Label>
                      <Input
                        value={artifactItem.institution || ""}
                        onChange={(e) => updateRegistryNode("education", idx, "institution", e.target.value)}
                        className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner"
                        placeholder="E.g. University of Technical Science"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 leading-none">
                        Academic Qualification Degree
                      </Label>
                      <Select
                        value={artifactItem.degree || ""}
                        onValueChange={(val) => updateRegistryNode("education", idx, "degree", val)}
                      >
                        <SelectTrigger className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground px-3 cursor-pointer">
                          <SelectValue placeholder="Select credential layer tier..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border border-border/40 bg-background font-bold text-xs">
                          {["SSC", "HSC", "Diploma", "Bachelor's", "Master's", "PhD", "Certificate"].map(
                            (degreeTypeStr) => (
                              <SelectItem
                                key={degreeTypeStr}
                                value={degreeTypeStr}
                                className="cursor-pointer text-xs font-semibold py-2 rounded-lg"
                              >
                                {degreeTypeStr}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 leading-none">
                        Instructional Knowledge Domain *
                      </Label>
                      <Input
                        value={artifactItem.fieldOfStudy || ""}
                        onChange={(e) => updateRegistryNode("education", idx, "fieldOfStudy", e.target.value)}
                        className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner"
                        placeholder="E.g. Computer Science and Engineering"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 leading-none">
                        Synchronization Graduation Year
                      </Label>
                      <Input
                        value={artifactItem.graduationYear || ""}
                        onChange={(e) => updateRegistryNode("education", idx, "graduationYear", e.target.value)}
                        className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner tabular-nums font-mono"
                        placeholder="E.g. 2025"
                        maxLength={4}
                      />
                    </div>
                  </div>
                )}

                {/* FORM LAYER TRACK: PROFESSIONAL CAREER OPERATIONAL EXPERIENCE */}
                {activeSegment === "experience" && (
                  <div className="space-y-3.5 w-full font-bold text-xs tracking-tight">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      <div className="space-y-1.5 text-left">
                        <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 leading-none">
                          Deployment Role Title *
                        </Label>
                        <Input
                          value={artifactItem.title || ""}
                          onChange={(e) => updateRegistryNode("experience", idx, "title", e.target.value)}
                          className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner"
                          placeholder="E.g. Lead Platform Engineer"
                        />
                      </div>
                      <div className="space-y-1.5 text-left">
                        <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 leading-none">
                          Corporate Host Employer *
                        </Label>
                        <Input
                          value={artifactItem.company || ""}
                          onChange={(e) => updateRegistryNode("experience", idx, "company", e.target.value)}
                          className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner"
                          placeholder="E.g. Global Tech Labs Corp"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 leading-none">
                        Operational Trajectory Duration
                      </Label>
                      <Input
                        value={artifactItem.duration || ""}
                        onChange={(e) => updateRegistryNode("experience", idx, "duration", e.target.value)}
                        className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner uppercase tracking-wider font-mono"
                        placeholder="E.g. JAN 2024 - PRESENT"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 leading-none">
                        Vocational Tasks & Objectives Summary Description
                      </Label>
                      <Textarea
                        value={artifactItem.description || ""}
                        onChange={(e) => updateRegistryNode("experience", idx, "description", e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 leading-relaxed italic resize-none shadow-inner"
                        placeholder="Outline core baseline system engineering deliverables, scale achievements, and tool configurations implemented…"
                      />
                    </div>
                  </div>
                )}

                {/* FORM LAYER TRACK: GRANULAR VOCATIONAL SKILL PROFILE TOKENS */}
                {activeSegment === "skills" && (
                  <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-end w-full font-bold text-xs tracking-tight">
                    <div className="flex-1 space-y-1.5 text-left w-full">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 leading-none">
                        Functional Skill Vector Token ID *
                      </Label>
                      <Input
                        value={artifactItem.name || ""}
                        onChange={(e) => updateRegistryNode("skills", idx, "name", e.target.value)}
                        className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner"
                        placeholder="E.g. TypeScript, Cloud Infrastructure"
                      />
                    </div>
                    <div className="w-full sm:w-48 space-y-1.5 text-left shrink-0">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 leading-none">
                        Estimated Proficiency Coefficient Level
                      </Label>
                      <Select
                        value={artifactItem.proficiency || "intermediate"}
                        onValueChange={(val) => updateRegistryNode("skills", idx, "proficiency", val)}
                      >
                        <SelectTrigger className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground px-3 cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border border-border/40 bg-background font-bold text-xs">
                          {["beginner", "intermediate", "advanced", "expert"].map((proficiencyTierStr) => (
                            <SelectItem
                              key={proficiencyTierStr}
                              value={proficiencyTierStr}
                              className="cursor-pointer text-xs font-semibold py-2 rounded-lg uppercase tracking-wide"
                            >
                              {proficiencyTierStr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* FORM LAYER TRACK: PORTFOLIO REPOSITORIES & PRODUCT DEVELOPMENTS */}
                {activeSegment === "projects" && (
                  <div className="space-y-3.5 w-full font-bold text-xs tracking-tight">
                    <div className="space-y-1.5 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 leading-none">
                        Development Project Artifact Title *
                      </Label>
                      <Input
                        value={artifactItem.name || ""}
                        onChange={(e) => updateRegistryNode("projects", idx, "name", e.target.value)}
                        className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner"
                        placeholder="E.g. Distributed Ledger Microservice Engine"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 leading-none">
                        Authoritative Codebase Repository URL
                      </Label>
                      <Input
                        value={artifactItem.url || ""}
                        onChange={(e) => updateRegistryNode("projects", idx, "url", e.target.value)}
                        className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner font-mono text-primary/80"
                        placeholder="https://github.com/profile/repository-node"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 leading-none">
                        Project Implementation Abstract Summary
                      </Label>
                      <Textarea
                        value={artifactItem.description || ""}
                        onChange={(e) => updateRegistryNode("projects", idx, "description", e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 leading-relaxed resize-none shadow-inner"
                        placeholder="Detail system architectural stacks, parallel processes initialized, and product outcomes managed…"
                      />
                    </div>
                  </div>
                )}

                {/* FORM LAYER TRACK: DISTINCTIONS & AWARD LOG RECOGNITIONS */}
                {activeSegment === "achievements" && (
                  <div className="space-y-3.5 w-full font-bold text-xs tracking-tight">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      <div className="space-y-1.5 text-left">
                        <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 leading-none">
                          Award Distinction Title *
                        </Label>
                        <Input
                          value={artifactItem.title || ""}
                          onChange={(e) => updateRegistryNode("achievements", idx, "title", e.target.value)}
                          className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner"
                          placeholder="E.g. National Hackathon First Prize Absolute Champion"
                        />
                      </div>
                      <div className="space-y-1.5 text-left">
                        <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 leading-none">
                          Validation Chronology Date
                        </Label>
                        <Input
                          value={artifactItem.date || ""}
                          onChange={(e) => updateRegistryNode("achievements", idx, "date", e.target.value)}
                          className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner font-mono text-left"
                          placeholder="E.g. OCTOBER 2024"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 leading-none">
                        Awarding Body Metric Context
                      </Label>
                      <Textarea
                        value={artifactItem.description || ""}
                        onChange={(e) => updateRegistryNode("achievements", idx, "description", e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 leading-relaxed resize-none shadow-inner"
                        placeholder="Detail the scope of evaluation, competitive filters passed, and awarding institutions involved…"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* EXPAND DIRECTORY BLOCK: APPEND BLANK SCHEMA TEMPLATE ROW */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                trackEvent("profile_builder_node_appended", { segmentKey: activeSegment });
                const templateMappingRecord: Record<keyof ProfileData, any> = {
                  education: SCHEMA_TEMPLATES.education,
                  experience: SCHEMA_TEMPLATES.experience,
                  skills: SCHEMA_TEMPLATES.skill,
                  projects: SCHEMA_TEMPLATES.project,
                  achievements: SCHEMA_TEMPLATES.achievement,
                };

                if (isMountedRef.current) {
                  onChange({
                    ...safeProfileValue,
                    [activeSegment]: [...safeProfileValue[activeSegment], { ...templateMappingRecord[activeSegment] }],
                  });
                }
              }}
              className="w-full h-11 rounded-xl border border-dashed border-primary/40 bg-primary/[0.02] font-bold uppercase text-[10px] tracking-wide transition-transform hover:bg-primary/5 hover:border-primary active:scale-[0.995] gap-1.5 flex items-center justify-center cursor-pointer shadow-xs mt-1 select-none"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Initialize New Specialized Form Record Node</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* HUD LEVEL 3: RECTILINEAR SYNAPSE MATRIX REGISTRY ACCOUNT TRACK LOGS */}
      <div className="bg-muted/20 border border-border/40 p-4 sm:p-5 rounded-xl relative overflow-hidden select-none shadow-inner w-full shrink-0">
        <Zap className="absolute top-0 right-0 p-4 opacity-[0.015] h-20 w-20 transform rotate-12 pointer-events-none" />
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/60 block pl-0.5 leading-none mb-3.5">
          Ecosystem Registry Artifact Load Matrix Balance
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 font-bold text-xs tracking-tight">
          {segments.map((summarySegmentItem) => {
            const isPopulated = summarySegmentItem.count > 0;
            return (
              <div
                key={summarySegmentItem.id}
                className="flex flex-col gap-1.5 text-left border-l border-border/10 pl-2.5 first:border-none first:pl-0 leading-none"
              >
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/40 block truncate text-ellipsis max-w-full leading-none">
                  {summarySegmentItem.id}
                </span>
                <span
                  className={cn(
                    "text-xl font-black italic tracking-tighter tabular-nums leading-none block pt-0.5",
                    isPopulated ? "text-primary selection:bg-primary/10" : "text-muted-foreground/20",
                  )}
                >
                  {String(summarySegmentItem.count).padStart(2, "0")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
