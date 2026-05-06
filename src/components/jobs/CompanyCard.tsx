import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Briefcase, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyWithSignal } from "@/hooks/useCompaniesWithSignal";

interface Props {
  company: CompanyWithSignal;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onClick: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  remote: "Remote",
  freelance: "Freelance",
};

export function CompanyCard({ company, isFollowing, onToggleFollow, onClick }: Props) {
  return (
    <Card
      className="hover:border-primary/40 transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-3 flex flex-col gap-2">
        <div className="flex items-start gap-2.5">
          <Avatar className="h-10 w-10 shrink-0">
            {company.logo_url && <AvatarImage src={company.logo_url} />}
            <AvatarFallback className="text-xs font-semibold">
              {company.company_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">{company.company_name}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Briefcase className="h-2.5 w-2.5" />
              {company.active_jobs} {company.active_jobs === 1 ? "role" : "roles"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFollow();
            }}
          >
            <Heart className={cn("h-3.5 w-3.5", isFollowing ? "fill-rose-500 text-rose-500" : "text-muted-foreground")} />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {company.jobs_last_14d > 0 && (
            <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[9px] px-1.5 py-0 gap-0.5">
              <TrendingUp className="h-2.5 w-2.5" />+{company.jobs_last_14d} new
            </Badge>
          )}
          {company.top_type && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
              {TYPE_LABEL[company.top_type] ?? company.top_type}
            </Badge>
          )}
          {company.top_location && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-0.5 max-w-full truncate">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{company.top_location}</span>
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
