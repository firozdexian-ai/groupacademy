import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GraduationCap, Briefcase, Wrench, FolderOpen, Award, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Professional Identity Architect
 * CTO Reference: Authoritative form for curriculum artifact initialization.
 */

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

export default function ProfileBuilderForm({ value, onChange }: ProfileBuilderFormProps) {
  const [activeSegment, setActiveSegment] = useState<keyof ProfileData>("education");

  const segments = [
    { id: "education", label: "ACADEMIC_CORE", icon: GraduationCap, count: value.education.length },
    { id: "experience", label: "OPS_HISTORY", icon: Briefcase, count: value.experience.length },
    { id: "skills", label: "SKILL_REGISTRY", icon: Wrench, count: value.skills.length },
    { id: "projects", label: "ARTIFACT_NODES", icon: FolderOpen, count: value.projects.length },
    { id: "achievements", label: "AWARD_LOGS", icon: Award, count: value.achievements.length },
  ];

  const updateRegistryNode = (key: keyof ProfileData, index: number, field: string, val: any) => {
    const updated = [...value[key]] as any[];
    updated[index] = { ...updated[index], [field]: val };
    onChange({ ...value, [key]: updated });
  };

  const removeRegistryNode = (key: keyof ProfileData, index: number) => {
    const updated = (value[key] as any[]).filter((_, i) => i !== index);
    onChange({ ...value, [key]: updated });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-left">
      {/* HUD: SEGMENT_REGISTRY */}
      <div className="flex flex-wrap gap-2 pb-2 border-b-2 border-border/10">
        {segments.map((segment) => (
          <Button
            key={segment.id}
            type="button"
            variant={activeSegment === segment.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSegment(segment.id as any)}
            className={cn(
              "h-10 rounded-xl font-black uppercase italic text-[10px] tracking-widest transition-all gap-2 border-2",
              activeSegment === segment.id
                ? "shadow-lg shadow-primary/20 scale-105"
                : "opacity-60 grayscale hover:grayscale-0 hover:opacity-100",
            )}
          >
            <segment.icon className="h-3.5 w-3.5" />
            {segment.label}
            {segment.count > 0 && (
              <span className="ml-1 bg-background/20 px-2 py-0.5 rounded-lg text-[9px] font-bold italic border border-white/10">
                {segment.count}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* VIEWPORT: ACTIVE_REGISTRY_NODE */}
      <div className="animate-in slide-in-from-bottom-2 duration-500">
        <Card className="rounded-[32px] border-2 border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                  {segments
                    .find((s) => s.id === activeSegment)
                    ?.icon({ className: "h-5 w-5 text-primary animate-pulse" })}
                  {segments.find((s) => s.id === activeSegment)?.label}
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic px-0.5">
                  Registry_Update_Protocol_Active
                </CardDescription>
              </div>
              <ShieldCheck className="h-6 w-6 text-primary/20" />
            </div>
          </CardHeader>

          <CardContent className="p-8 pt-4 space-y-6">
            {(value[activeSegment] as any[]).map((artifact, index) => (
              <div
                key={index}
                className="group relative border-2 border-border/10 rounded-2xl p-6 bg-muted/5 hover:border-primary/20 transition-all duration-300"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 h-8 w-8 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                  onClick={() => removeRegistryNode(activeSegment, index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                {/* DYNAMIC_FORM_LOGIC_PER_SEGMENT */}
                {activeSegment === "education" && (
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1">
                        Institutional_Node *
                      </Label>
                      <Input
                        value={artifact.institution}
                        onChange={(e) => updateRegistryNode("education", index, "institution", e.target.value)}
                        className="h-12 border-2 rounded-xl italic font-bold"
                        placeholder="e.g. UNIVERSITY_OF_DATA"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1">
                        Degree_Type
                      </Label>
                      <Select
                        value={artifact.degree}
                        onValueChange={(v) => updateRegistryNode("education", index, "degree", v)}
                      >
                        <SelectTrigger className="h-12 border-2 rounded-xl italic font-bold">
                          <SelectValue placeholder="Select_Node" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2 italic font-bold uppercase text-[10px]">
                          {["SSC", "HSC", "Diploma", "Bachelor's", "Master's", "PhD", "Certificate"].map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1">
                        Knowledge_Domain *
                      </Label>
                      <Input
                        value={artifact.fieldOfStudy}
                        onChange={(e) => updateRegistryNode("education", index, "fieldOfStudy", e.target.value)}
                        className="h-12 border-2 rounded-xl italic font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1">Sync_Year</Label>
                      <Input
                        value={artifact.graduationYear}
                        onChange={(e) => updateRegistryNode("education", index, "graduationYear", e.target.value)}
                        className="h-12 border-2 rounded-xl italic font-bold tabular-nums"
                      />
                    </div>
                  </div>
                )}

                {activeSegment === "experience" && (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1">
                          Deployment_Title *
                        </Label>
                        <Input
                          value={artifact.title}
                          onChange={(e) => updateRegistryNode("experience", index, "title", e.target.value)}
                          className="h-12 border-2 rounded-xl italic font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1">
                          Corporate_Host *
                        </Label>
                        <Input
                          value={artifact.company}
                          onChange={(e) => updateRegistryNode("experience", index, "company", e.target.value)}
                          className="h-12 border-2 rounded-xl italic font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1">
                        Trajectory_Duration
                      </Label>
                      <Input
                        value={artifact.duration}
                        onChange={(e) => updateRegistryNode("experience", index, "duration", e.target.value)}
                        className="h-12 border-2 rounded-xl italic font-bold"
                        placeholder="JAN_2024 - PRESENT"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1">
                        Ops_Description
                      </Label>
                      <Textarea
                        value={artifact.description}
                        onChange={(e) => updateRegistryNode("experience", index, "description", e.target.value)}
                        className="min-h-[100px] border-2 rounded-xl italic font-medium leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {activeSegment === "skills" && (
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1">
                        Skill_Node_ID
                      </Label>
                      <Input
                        value={artifact.name}
                        onChange={(e) => updateRegistryNode("skills", index, "name", e.target.value)}
                        className="h-12 border-2 rounded-xl italic font-bold"
                      />
                    </div>
                    <div className="w-48 space-y-2">
                      <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1">
                        Proficiency_Level
                      </Label>
                      <Select
                        value={artifact.proficiency}
                        onValueChange={(v) => updateRegistryNode("skills", index, "proficiency", v)}
                      >
                        <SelectTrigger className="h-12 border-2 rounded-xl italic font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2 italic font-bold uppercase text-[10px]">
                          {["beginner", "intermediate", "advanced", "expert"].map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {activeSegment === "projects" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1">
                        Artifact_Title *
                      </Label>
                      <Input
                        value={artifact.name}
                        onChange={(e) => updateRegistryNode("projects", index, "name", e.target.value)}
                        className="h-12 border-2 rounded-xl italic font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1">System_URL</Label>
                      <Input
                        value={artifact.url}
                        onChange={(e) => updateRegistryNode("projects", index, "url", e.target.value)}
                        className="h-12 border-2 rounded-xl italic font-bold"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1">
                        Artifact_Summary
                      </Label>
                      <Textarea
                        value={artifact.description}
                        onChange={(e) => updateRegistryNode("projects", index, "description", e.target.value)}
                        className="min-h-[80px] border-2 rounded-xl italic font-medium"
                      />
                    </div>
                  </div>
                )}

                {activeSegment === "achievements" && (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1">
                          Award_Title *
                        </Label>
                        <Input
                          value={artifact.title}
                          onChange={(e) => updateRegistryNode("achievements", index, "title", e.target.value)}
                          className="h-12 border-2 rounded-xl italic font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1">
                          Sync_Date
                        </Label>
                        <Input
                          value={artifact.date}
                          onChange={(e) => updateRegistryNode("achievements", index, "date", e.target.value)}
                          className="h-12 border-2 rounded-xl italic font-bold tabular-nums"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase italic tracking-widest ml-1">
                        Artifact_Context
                      </Label>
                      <Textarea
                        value={artifact.description}
                        onChange={(e) => updateRegistryNode("achievements", index, "description", e.target.value)}
                        className="min-h-[80px] border-2 rounded-xl italic font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const templateMap: any = {
                  education: SCHEMA_TEMPLATES.education,
                  experience: SCHEMA_TEMPLATES.experience,
                  skills: SCHEMA_TEMPLATES.skill,
                  projects: SCHEMA_TEMPLATES.project,
                  achievements: SCHEMA_TEMPLATES.achievement,
                };
                onChange({ ...value, [activeSegment]: [...value[activeSegment], { ...templateMap[activeSegment] }] });
              }}
              className="w-full h-14 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 font-black uppercase italic text-[10px] tracking-[0.2em] transition-all hover:bg-primary/10 hover:border-primary active:scale-95 gap-3"
            >
              <Plus className="h-4 w-4" /> INITIALIZE_NEW_NODE
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FOOTER: REGISTRY_SUMMARY */}
      <div className="bg-muted/10 backdrop-blur-md p-6 rounded-[24px] border-2 border-border/10 relative overflow-hidden">
        <Zap className="absolute top-0 right-0 p-4 opacity-5 h-24 w-24 rotate-12" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4 italic leading-none">
          Registry_Artifact_Summary
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {segments.map((s) => (
            <div key={s.id} className="flex flex-col gap-1">
              <span className="text-[8px] font-black uppercase text-muted-foreground/40 leading-none">{s.id}</span>
              <span
                className={cn(
                  "text-sm font-black italic tracking-tighter",
                  s.count > 0 ? "text-primary" : "text-muted-foreground/20",
                )}
              >
                {String(s.count).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
