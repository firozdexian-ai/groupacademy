import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Sparkles } from "lucide-react";

interface SkillsEditorProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export function SkillsEditor({ skills, onChange }: SkillsEditorProps) {
  const [skillList, setSkillList] = useState<string[]>(skills || []);
  const [inputValue, setInputValue] = useState("");

  const addSkill = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !skillList.includes(trimmed)) {
      const updated = [...skillList, trimmed];
      setSkillList(updated);
      onChange(updated);
      setInputValue("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const updated = skillList.filter(skill => skill !== skillToRemove);
    setSkillList(updated);
    onChange(updated);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        Skills
      </Label>

      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a skill and press Enter"
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={addSkill}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {skillList.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">
          No skills added yet. Type above and press Enter.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skillList.map((skill, index) => (
            <Badge 
              key={index} 
              variant="secondary"
              className="pl-3 pr-1 py-1 flex items-center gap-1"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Add skills like: JavaScript, Project Management, Marketing, etc.
      </p>
    </div>
  );
}
