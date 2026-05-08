import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

/**
 * GroUp Academy: Skill Artifact Node (SkillTagBadge)
 * CTO Reference: High-fidelity visualization for registered technical skill sets.
 */

interface SkillTagBadgeProps {
  skills: string[];
  maxVisible?: number;
  className?: string;
}

export function SkillTagBadge({ skills, maxVisible = 3, className }: SkillTagBadgeProps) {
  // PROTOCOL: Structural Data Guard
  if (!skills || !Array.isArray(skills) || skills.length === 0) return null;

  const visibleSkills = skills.slice(0, maxVisible);
  const remaining = skills.length - maxVisible;

  return (
    <div className={cn("flex flex-wrap gap-2 items-center animate-in fade-in duration-500", className)}>
      {visibleSkills.map((skill, index) => {
        const sanitizedSkill = skill.trim();
        if (!sanitizedSkill) return null;

        return (
          <div
            key={`${sanitizedSkill}-${index}`}
            title={sanitizedSkill}
            className={cn(
              "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
              "bg-primary/5 text-primary border border-primary/15",
              "hover:bg-primary/10 cursor-default",
              "truncate max-w-[160px] flex items-center gap-1.5",
            )}
          >
            <Zap className="h-3 w-3 opacity-60" />
            <span className="truncate">{sanitizedSkill}</span>
          </div>
        );
      })}

      {remaining > 0 && (
        <span
          className={cn(
            "px-2 py-1 text-xs font-medium rounded-md",
            "bg-muted/40 text-muted-foreground border border-dashed border-border/40",
          )}
        >
          +{remaining} more
        </span>
      )}
    </div>
  );
}
