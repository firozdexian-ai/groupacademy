import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GraduationCap } from "lucide-react";

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
  const [entries, setEntries] = useState<EducationEntry[]>(
    education.length > 0 ? education : []
  );

  const addEntry = () => {
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

  const removeEntry = (index: number) => {
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
    onChange(updated);
  };

  const updateEntry = (index: number, field: keyof EducationEntry, value: string) => {
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
          <GraduationCap className="h-4 w-4" />
          Education
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No education entries yet. Click "Add" to add one.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-muted-foreground">
                    Education #{index + 1}
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
                  <div>
                    <Label htmlFor={`edu-institution-${index}`} className="text-xs">
                      Institution
                    </Label>
                    <Input
                      id={`edu-institution-${index}`}
                      value={entry.institution}
                      onChange={(e) => updateEntry(index, "institution", e.target.value)}
                      placeholder="e.g. University of Dhaka"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`edu-degree-${index}`} className="text-xs">
                        Degree
                      </Label>
                      <Input
                        id={`edu-degree-${index}`}
                        value={entry.degree}
                        onChange={(e) => updateEntry(index, "degree", e.target.value)}
                        placeholder="e.g. BSc"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edu-field-${index}`} className="text-xs">
                        Field of Study
                      </Label>
                      <Input
                        id={`edu-field-${index}`}
                        value={entry.fieldOfStudy}
                        onChange={(e) => updateEntry(index, "fieldOfStudy", e.target.value)}
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`edu-start-${index}`} className="text-xs">
                        Start Year
                      </Label>
                      <Input
                        id={`edu-start-${index}`}
                        value={entry.startYear}
                        onChange={(e) => updateEntry(index, "startYear", e.target.value)}
                        placeholder="e.g. 2018"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edu-end-${index}`} className="text-xs">
                        End Year
                      </Label>
                      <Input
                        id={`edu-end-${index}`}
                        value={entry.endYear}
                        onChange={(e) => updateEntry(index, "endYear", e.target.value)}
                        placeholder="e.g. 2022 or Present"
                      />
                    </div>
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
