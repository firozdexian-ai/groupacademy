import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Briefcase } from "lucide-react";

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
  const [entries, setEntries] = useState<ExperienceEntry[]>(
    experience.length > 0 ? experience : []
  );

  const addEntry = () => {
    const newEntry: ExperienceEntry = {
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
    };
    const updated = [...entries, newEntry];
    setEntries(updated);
    onChange(updated);
  };

  const removeEntry = (index: number) => {
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
    onChange(updated);
  };

  const updateEntry = (index: number, field: keyof ExperienceEntry, value: string) => {
    const updated = entries.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    );
    setEntries(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Work Experience
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No experience entries yet. Click "Add" to add one.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-muted-foreground">
                    Experience #{index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEntry(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`exp-company-${index}`} className="text-xs">
                        Company
                      </Label>
                      <Input
                        id={`exp-company-${index}`}
                        value={entry.company}
                        onChange={(e) => updateEntry(index, "company", e.target.value)}
                        placeholder="e.g. Grameenphone"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`exp-position-${index}`} className="text-xs">
                        Position
                      </Label>
                      <Input
                        id={`exp-position-${index}`}
                        value={entry.position}
                        onChange={(e) => updateEntry(index, "position", e.target.value)}
                        placeholder="e.g. Software Engineer"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`exp-start-${index}`} className="text-xs">
                        Start Date
                      </Label>
                      <Input
                        id={`exp-start-${index}`}
                        value={entry.startDate}
                        onChange={(e) => updateEntry(index, "startDate", e.target.value)}
                        placeholder="e.g. Jan 2020"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`exp-end-${index}`} className="text-xs">
                        End Date
                      </Label>
                      <Input
                        id={`exp-end-${index}`}
                        value={entry.endDate}
                        onChange={(e) => updateEntry(index, "endDate", e.target.value)}
                        placeholder="e.g. Present"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`exp-desc-${index}`} className="text-xs">
                      Description (optional)
                    </Label>
                    <Textarea
                      id={`exp-desc-${index}`}
                      value={entry.description}
                      onChange={(e) => updateEntry(index, "description", e.target.value)}
                      placeholder="Brief description of your role..."
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
