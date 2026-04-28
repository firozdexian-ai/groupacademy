import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GraduationCap, School, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Academic History Node
 * CTO Reference: Authoritative editor for talent educational artifacts.
 */

export interface EducationEntry {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
}

interface EducationEditorProps {
  education: EducationEntry[];
  onChange: (education: EducationEntry[]) => void;
}

export function EducationEditor({ education, onChange }: EducationEditorProps) {
  const [entries, setEntries] = useState<EducationEntry[]>(education.length > 0 ? education : []);

  const addAcademicNode = () => {
    const newEntry: EducationEntry = {
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startYear: "",
      endYear: "",
    };
    const updated = [...entries, newEntry];
    setEntries(updated);
    onChange(updated);
  };

  const removeAcademicNode = (index: number) => {
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
    onChange(updated);
  };

  const updateAcademicNode = (index: number, field: keyof EducationEntry, value: string) => {
    const updated = entries.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry));
    setEntries(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <Label className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-primary" />
            Academic_Registry
          </Label>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
            Synchronize your educational artifacts
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addAcademicNode}
          className="h-10 px-4 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest gap-2 hover:bg-primary hover:text-white transition-all shadow-lg active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add_Node
        </Button>
      </div>

      {entries.length === 0 ? (
        <div
          className="py-12 border-2 border-dashed rounded-[32px] bg-muted/5 flex flex-col items-center justify-center gap-4 group hover:border-primary/40 transition-colors cursor-pointer"
          onClick={addAcademicNode}
        >
          <div className="p-4 rounded-2xl bg-muted/20 group-hover:rotate-12 transition-transform">
            <School className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
            Registry_Empty
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <Card
              key={index}
              className="rounded-[28px] border-2 border-border/40 bg-card/30 backdrop-blur-md overflow-hidden group hover:border-primary/20 transition-all shadow-xl"
            >
              <CardContent className="p-6 space-y-5">
                <div className="flex justify-between items-center pb-2 border-b border-border/10">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                      Institutional_Artifact
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAcademicNode(index)}
                    className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10 transition-colors active:scale-90"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>

                <div className="grid gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor={`edu-institution-${index}`}
                      className="text-[10px] font-black uppercase italic text-primary ml-1"
                    >
                      Institutional_Node
                    </Label>
                    <Input
                      id={`edu-institution-${index}`}
                      value={entry.institution}
                      onChange={(e) => updateAcademicNode(index, "institution", e.target.value)}
                      placeholder="E.G. UNIVERSITY_OF_TECHNOLOGY"
                      className="h-12 rounded-xl border-2 font-bold bg-background/50 placeholder:text-muted-foreground/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor={`edu-degree-${index}`}
                        className="text-[10px] font-black uppercase italic text-primary ml-1"
                      >
                        Credential_Level
                      </Label>
                      <Input
                        id={`edu-degree-${index}`}
                        value={entry.degree}
                        onChange={(e) => updateAcademicNode(index, "degree", e.target.value)}
                        placeholder="E.G. BSC_COMPUTER_SCIENCE"
                        className="h-12 rounded-xl border-2 font-bold bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor={`edu-field-${index}`}
                        className="text-[10px] font-black uppercase italic text-primary ml-1"
                      >
                        Domain_Specialization
                      </Label>
                      <Input
                        id={`edu-field-${index}`}
                        value={entry.fieldOfStudy}
                        onChange={(e) => updateAcademicNode(index, "fieldOfStudy", e.target.value)}
                        placeholder="E.G. NEURAL_ENGINEERING"
                        className="h-12 rounded-xl border-2 font-bold bg-background/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor={`edu-start-${index}`}
                        className="text-[10px] font-black uppercase italic text-primary ml-1"
                      >
                        Deployment_Year
                      </Label>
                      <Input
                        id={`edu-start-${index}`}
                        value={entry.startYear}
                        onChange={(e) => updateAcademicNode(index, "startYear", e.target.value)}
                        placeholder="2018"
                        className="h-12 rounded-xl border-2 font-bold bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor={`edu-end-${index}`}
                        className="text-[10px] font-black uppercase italic text-primary ml-1"
                      >
                        Conclusion_Node
                      </Label>
                      <Input
                        id={`edu-end-${index}`}
                        value={entry.endYear}
                        onChange={(e) => updateAcademicNode(index, "endYear", e.target.value)}
                        placeholder="2022_OR_PRESENT"
                        className="h-12 rounded-xl border-2 font-bold bg-background/50"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-3 py-3 border-t border-border/10">
        <Zap className="h-3.5 w-3.5 text-amber-500 fill-current animate-pulse" />
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 italic">
          Registry Data Verified for AI Score Synthesis
        </p>
      </div>
    </div>
  );
}
