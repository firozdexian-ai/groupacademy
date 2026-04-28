import { useNavigate } from "react-router-dom";
import { ChevronRight, LucideIcon, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Tactical Ingress Node (QuickActionCard)
 * CTO Reference: High-velocity navigation artifact for core module transitions.
 */

interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  count?: number;
  path: string;
  description?: string;
  className?: string;
}

export function QuickActionCard({ icon: Icon, label, count, path, description, className }: QuickActionCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className={cn(
        "group relative cursor-pointer transition-all duration-500 rounded-[28px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden",
        "hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:border-primary/40 hover:-translate-y-1.5 active:scale-90",
        className,
      )}
      onClick={() => navigate(path)}
    >
      {/* GLOW_NODE: Subtle interactive backdrop */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <CardContent className="p-5 flex items-center gap-5 text-left">
        {/* ICON_NODE: Industrial Ingress Artifact */}
        <div className="h-14 w-14 rounded-2xl bg-primary/5 text-primary border border-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:rotate-3 transition-all duration-500 shrink-0 shadow-lg group-hover:shadow-primary/20">
          <Icon className="h-6 w-6 stroke-[2.5px]" />
        </div>

        {/* METADATA_NODE */}
        <div className="flex-1 min-w-0">
          <p className="font-black text-[11px] uppercase italic tracking-[0.2em] text-foreground group-hover:text-primary transition-colors truncate">
            {label.replace(" ", "_")}
          </p>

          {count !== undefined && count > 0 ? (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="relative h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </div>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest italic">
                {count} Active_Threads
              </p>
            </div>
          ) : description ? (
            <p className="text-[10px] font-bold text-muted-foreground/60 truncate mt-1 leading-none uppercase tracking-tighter italic">
              {description}
            </p>
          ) : (
            <div className="flex items-center gap-1 mt-1 opacity-20">
              <Zap className="h-2.5 w-2.5 fill-current" />
              <span className="text-[8px] font-black uppercase">Protocol_Active</span>
            </div>
          )}
        </div>

        {/* AFFORDANCE_NODE */}
        <div className="h-9 w-9 rounded-xl bg-muted/20 border border-border/10 flex items-center justify-center group-hover:bg-primary/10 transition-all duration-300">
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
}
