import { cn } from '@/lib/utils';

interface SkillTagBadgeProps {
  skills: string[];
  maxVisible?: number;
  className?: string;
}

export function SkillTagBadge({ skills, maxVisible = 3, className }: SkillTagBadgeProps) {
  if (!skills || skills.length === 0) return null;

  const visibleSkills = skills.slice(0, maxVisible);
  const remaining = skills.length - maxVisible;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {visibleSkills.map((skill, index) => (
        <span
          key={`${skill}-${index}`}
          className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium truncate max-w-[100px]"
        >
          {skill}
        </span>
      ))}
      {remaining > 0 && (
        <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground font-medium">
          +{remaining}
        </span>
      )}
    </div>
  );
}
