import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LucideIcon, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendLabel?: string;
  variant?: "default" | "secondary" | "success" | "accent";
}

const StatsCard = ({ title, value, icon: Icon, trend, trendLabel, variant = "default" }: StatsCardProps) => {
  const variantClasses = {
    default: "from-primary to-primary-dark",
    secondary: "from-secondary to-secondary-light",
    success: "from-success to-success/80",
    accent: "from-accent to-accent/80",
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn("p-2 rounded-lg bg-gradient-to-br shadow-md", variantClasses[variant])}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-3xl font-bold">{value}</div>
          {trend && (
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span className="font-semibold">{trend}</span>
              {trendLabel && <span className="ml-1 text-muted-foreground">{trendLabel}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
