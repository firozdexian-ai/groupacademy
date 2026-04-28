import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Briefcase, Calendar, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Professional Ledger Editor
 * CTO Reference: Authoritative node for historical career artifact management.
 */

export interface ExperienceEntry {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ExperienceEditorProps {
  experience: ExperienceEntry[];
  onChange: (experience: ExperienceEntry[]) => void;
}

export function ExperienceEditor({ experience, onChange }: ExperienceEditorProps) {
  const [entries, setEntries] = useState<ExperienceEntry[]>(experience.length > 0 ? experience : []);

  // NEURAL SYNC: Immediate hydration from props (Critical for AI/CV parsing ingress)
  useEffect(() => {
    setEntries(experience);
  }, [experience]);

  const addExperienceNode = () => {
    const newEntry: ExperienceEntry = {
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
    };
    const updated = [newEntry, ...entries]; // Reverse Chronological Protocol
    setEntries(updated);
    onChange(updated);
  };

  const removeExperienceNode = (index: number) => {
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
    onChange(updated);
  };

  const updateExperienceNode = (index: number, field: keyof ExperienceEntry, value: string) => {
    const updated = entries.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry));
    setEntries(updated);
    onChange(updated);
  };

  const toggleStatusProtocol = (index: number, isCurrent: boolean) => {
    updateExperienceNode(index, "endDate", isCurrent ? "Present" : "");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <Label className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-primary" />
            Experience_Registry
          </Label>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
            Synchronize historical professional nodes
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addExperienceNode}
          className="h-10 px-4 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest gap-2 hover:bg-primary hover:text-white transition-all shadow-lg active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Deploy_Node
        </Button>
      </div>

      {entries.length === 0 ? (
        <div
          className="py-12 border-2 border-dashed rounded-[32px] bg-muted/5 flex flex-col items-center justify-center gap-4 group hover:border-primary/40 transition-colors cursor-pointer"
          onClick={addExperienceNode}
        >
          <div className="p-4 rounded-2xl bg-muted/20 group-hover:rotate-12 transition-transform duration-500">
            <Zap className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
              Registry_Offline
            </p>
            <p className="text-[8px] font-bold text-muted-foreground/40 mt-1 uppercase tracking-widest">
              No Professional Nodes Detected
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {entries.map((entry, index) => {
            const isCurrent = entry.endDate?.toLowerCase() === "present";

            return (
              <Card
                key={index}
                className="rounded-[28px] border-2 border-border/40 bg-card/30 backdrop-blur-md overflow-hidden group hover:border-primary/20 transition-all shadow-xl relative"
              >
                <CardContent className="p-6 space-y-5">
                  {/* NODE HEADER */}
                  <div className="flex justify-between items-center pb-2 border-b border-border/10">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary opacity-50" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                        Professional_Artifact #{entries.length - index}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExperienceNode(index)}
                      className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10 transition-colors active:scale-90"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="grid gap-5">
                    {/* POSITION & COMPANY */}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase italic text-primary ml-1">
                          Job_Identity *
                        </Label>
                        <Input
                          value={entry.position}
                          onChange={(e) => updateExperienceNode(index, "position", e.target.value)}
                          placeholder="E.G. SENIOR_TECHNICAL_LEAD"
                          className="h-12 rounded-xl border-2 font-bold bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase italic text-primary ml-1">
                          Institutional_Node *
                        </Label>
                        <Input
                          value={entry.company}
                          onChange={(e) => updateExperienceNode(index, "company", e.target.value)}
                          placeholder="E.G. ACME_GLOBAL_CORP"
                          className="h-12 rounded-xl border-2 font-bold bg-background/50"
                        />
                      </div>
                    </div>

                    {/* TIMELINE PROTOCOL */}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase italic text-primary ml-1 flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> Initial_Sync
                        </Label>
                        <Input
                          value={entry.startDate}
                          onChange={(e) => updateExperienceNode(index, "startDate", e.target.value)}
                          placeholder="E.G. JAN_2020"
                          className="h-12 rounded-xl border-2 font-bold bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <Label className="text-[10px] font-black uppercase italic text-primary flex items-center gap-2">
                            <Calendar className="h-3 w-3" /> Termination_Node
                          </Label>
                          <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
                            <Checkbox
                              id={`current-${index}`}
                              checked={isCurrent}
                              onCheckedChange={(checked) => toggleStatusProtocol(index, checked as boolean)}
                              className="h-3 w-3 rounded-sm border-primary"
                            />
                            <Label
                              htmlFor={`current-${index}`}
                              className="text-[9px] font-black uppercase italic cursor-pointer text-primary/70"
                            >
                              Active_Role
                            </Label>
                          </div>
                        </div>
                        <Input
                          value={entry.endDate}
                          onChange={(e) => updateExperienceNode(index, "endDate", e.target.value)}
                          placeholder="E.G. DEC_2022"
                          className="h-12 rounded-xl border-2 font-bold bg-background/50 disabled:opacity-50"
                          disabled={isCurrent}
                        />
                      </div>
                    </div>

                    {/* ACHIEVEMENT PAYLOAD */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase italic text-primary ml-1">
                        Node_Achievements & Impact
                      </Label>
                      <Textarea
                        value={entry.description}
                        onChange={(e) => updateExperienceNode(index, "description", e.target.value)}
                        placeholder="• EXECUTED_HIGH_VELOCITY_DEPLOYS&#10;• OPTIMIZED_LATENCY_BY_40%"
                        className="min-h-[100px] rounded-2xl border-2 font-medium italic bg-background/50 resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-3 py-4 border-t border-border/10">
        <Zap className="h-4 w-4 text-amber-500 fill-current animate-pulse" />
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 italic">
          Experience Data Synchronized for Market Matching
        </p>
      </div>
    </div>
  );
}
