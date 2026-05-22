import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyCard } from "@/domains/jobs/components/CompanyCard";
import {
  useFollowedCompanies,
  useToggleFollowCompany,
} from "@/domains/companies/hooks/useFollowedCompanies";
import type { CompanyWithSignal } from "@/domains/companies/hooks/useCompaniesWithSignal";

interface Props {
  companies?: CompanyWithSignal[];
}

export function CompaniesView({ companies }: Props) {
  const navigate = useNavigate();
  const { data: followed } = useFollowedCompanies();
  const { mutate: toggleFollow } = useToggleFollowCompany();

  const list = (companies ?? []).slice(0, 24);

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-3 py-12 px-4 rounded-2xl border border-dashed border-border/40 bg-card/40">
        <Building2 className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground/80">No companies hiring right now</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Check back soon — new employers post roles every day.
        </p>
        <Button size="sm" variant="outline" onClick={() => navigate("/app/jobs/all")}>
          Browse all jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {list.map((c) => (
          <CompanyCard
            key={c.company_name}
            company={c}
            isFollowing={!!followed?.has(c.company_name)}
            onToggleFollow={() => toggleFollow(c.company_name)}
            onClick={() =>
              navigate(`/app/jobs/all?company=${encodeURIComponent(c.company_name)}`)
            }
          />
        ))}
      </div>
      <div className="flex justify-center pt-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/jobs/all")}>
          View all jobs →
        </Button>
      </div>
    </div>
  );
}
