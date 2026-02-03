import { useNavigate } from "react-router-dom";
import { ChevronRight, LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  count?: number;
  path: string;
  description?: string;
}

export function QuickActionCard({ icon: Icon, label, count, path, description }: QuickActionCardProps) {
  const navigate = useNavigate();
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all active:scale-[0.98]"
      onClick={() => navigate(path)}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{label}</p>
          {count !== undefined && count > 0 && (
            <p className="text-xs text-muted-foreground">{count} active</p>
          )}
          {description && !count && (
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  );
}
