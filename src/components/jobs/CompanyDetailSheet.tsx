import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MapPin, Briefcase, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCompanyDetail } from "@/hooks/useCompanyDetail";
import { useFollowedCompanies } from "@/hooks/useFollowedCompanies";
import { useSavedItems } from "@/hooks/useSavedItems";
import { JobCard } from "@/components/jobs/JobCard";
import { cn } from "@/lib/utils";

interface Props {
  companyName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  remote: "Remote",
  freelance: "Freelance",
};

export function CompanyDetailSheet({ companyName, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { data, isLoading } = useCompanyDetail(open ? companyName : null);
  const { isFollowing, toggle } = useFollowedCompanies();
  const { isSaved, toggleSave } = useSavedItems();

  const header = data?.header;
  const jobs = data?.jobs ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <SheetTitle className="sr-only">{companyName}</SheetTitle>
          {isLoading || !header ? (
            <Skeleton className="h-14 w-full" />
          ) : (
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 shrink-0">
                {header.logo_url && <AvatarImage src={header.logo_url} />}
                <AvatarFallback className="text-sm font-semibold">
                  {header.company_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-base font-semibold truncate">{header.company_name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Briefcase className="h-3 w-3" />
                  {header.active_jobs} active {header.active_jobs === 1 ? "role" : "roles"}
                  {header.jobs_last_14d > 0 && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[9px] px-1.5 py-0 gap-0.5 ml-1">
                      <TrendingUp className="h-2.5 w-2.5" />+{header.jobs_last_14d} this fortnight
                    </Badge>
                  )}
                </p>
              </div>
              <Button
                size="sm"
                variant={companyName && isFollowing(companyName) ? "default" : "outline"}
                className="h-8 gap-1 text-xs"
                onClick={() => companyName && toggle(companyName)}
              >
                <Heart
                  className={cn(
                    "h-3.5 w-3.5",
                    companyName && isFollowing(companyName) && "fill-current",
                  )}
                />
                {companyName && isFollowing(companyName) ? "Following" : "Follow"}
              </Button>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {data && (
            <div className="flex flex-wrap gap-1.5">
              {data.types.map((t) => (
                <Badge key={t.type} variant="outline" className="text-[10px]">
                  {TYPE_LABEL[t.type] ?? t.type} · {t.count}
                </Badge>
              ))}
              {data.locations.slice(0, 4).map((l) => (
                <Badge key={l.location} variant="secondary" className="text-[10px] gap-0.5">
                  <MapPin className="h-2.5 w-2.5" />
                  {l.location} · {l.count}
                </Badge>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Open roles</h3>
            {isLoading ? (
              <>
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </>
            ) : jobs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                No open roles right now.
              </p>
            ) : (
              jobs.map((j: any) => (
                <JobCard
                  key={j.id}
                  job={j}
                  variant="compact"
                  isSaved={isSaved(j.id, "job")}
                  onSaveToggle={() => toggleSave(j.id, "job")}
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/app/jobs/${j.id}`);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
