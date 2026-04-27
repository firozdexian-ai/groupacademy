import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LucideIcon, TrendingUp, Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Executive Telemetry Card (StatsCard)
 * CTO Reference: Primary UI node for high-fidelity KPI visualization.
 */

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendLabel?: string;
  variant?: "default" | "secondary" | "success" | "accent" | "warning";
}

const StatsCard = ({ title, value, icon: Icon, trend, trendLabel, variant = "default" }: StatsCardProps) => {
  const variantClasses = {
    default: "from-primary/20 to-blue-600/20 text-primary border-primary/20",
    secondary: "from-purple-500/20 to-purple-700/20 text-purple-500 border-purple-500/20",
    success: "from-emerald-500/20 to-emerald-700/20 text-emerald-500 border-emerald-500/20",
    accent: "from-amber-500/20 to-amber-700/20 text-amber-500 border-amber-500/20",
    warning: "from-destructive/20 to-red-700/20 text-destructive border-destructive/20",
  };

  const iconGradients = {
    default: "from-primary to-blue-600",
    secondary: "from-purple-500 to-purple-700",
    success: "from-emerald-500 to-emerald-700",
    accent: "from-amber-500 to-amber-700",
    warning: "from-destructive to-red-700",
  };

  return (
    <Card className="relative overflow-hidden rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl group hover:-translate-y-1">
      {/* Decorative Pulse Background */}
      <div
        className={cn(
          "absolute -right-4 -top-4 h-24 w-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br",
          iconGradients[variant],
        )}
      />

      <CardHeader className="p-6 pb-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">{title}</p>
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center border-2 shadow-inner group-hover:rotate-6 transition-all duration-500",
              variantClasses[variant],
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black italic tracking-tighter leading-none">{value}</h3>
            <Zap className={cn("h-3 w-3 fill-current opacity-20", variant === "default" ? "text-primary" : "")} />
          </div>

          {trend && (
            <div className="flex items-center pt-2">
              <div
                className={cn(
                  "flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase italic tracking-wider border",
                  variant === "warning"
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                )}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>{trend}</span>
              </div>
              {trendLabel && (
                <span className="ml-2 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Activity Indicator Line */}
        <div className="mt-4 h-1 w-full bg-muted/20 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full animate-pulse", iconGradients[variant].replace("from-", "bg-"))}
            style={{ width: "40%" }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
