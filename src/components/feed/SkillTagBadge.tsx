import { cn } from "@/lib/utils";

interface SkillTagBadgeProps {
  skills: string[];
  maxVisible?: number;
  className?: string;
}

export function SkillTagBadge({ skills, maxVisible = 3, className }: SkillTagBadgeProps) {
  // CTO Note: Structural guard for data integrity
  if (!skills || !Array.isArray(skills) || skills.length === 0) return null;

  const visibleSkills = skills.slice(0, maxVisible);
  const remaining = skills.length - maxVisible;

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {visibleSkills.map((skill, index) => {
        const sanitizedSkill = skill.trim();
        if (!sanitizedSkill) return null;

        return (
          <span
            key={`${sanitizedSkill}-${index}`}
            title={sanitizedSkill}
            className={cn(
              "px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all duration-200",
              "bg-primary/5 text-primary border border-primary/10",
              "hover:bg-primary/10 hover:scale-105 cursor-default",
              "truncate max-w-[120px] inline-block align-middle",
            )}
          >
            {sanitizedSkill}
          </span>
        );
      })}

      {remaining > 0 && (
        <span
          className={cn(
            "px-2 py-0.5 text-[10px] font-bold rounded-md",
            "bg-muted/50 text-muted-foreground border border-dashed border-muted-foreground/20",
            "hover:bg-muted transition-colors",
          )}
        >
          +{remaining} More
        </span>
      )}
    </div>
  );
}
