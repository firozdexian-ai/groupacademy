import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Briefcase, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface JobLite {
  id: string;
  title: string;
  company_name: string | null;
  source: "saved" | "recent";
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ScoreMeJobPicker({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobLite[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const uid = userRes.user?.id;
        const out: JobLite[] = [];
        const seen = new Set<string>();

        if (uid) {
          const { data: saved } = await supabase
            .from("saved_items")
            .select("item_id, jobs:item_id(id, title, company_name)")
            .eq("user_id", uid)
            .eq("item_type", "job")
            .order("created_at", { ascending: false })
            .limit(20);
          (saved || []).forEach((row: any) => {
            const j = row.jobs;
            if (j?.id && !seen.has(j.id)) {
              seen.add(j.id);
              out.push({ id: j.id, title: j.title, company_name: j.company_name, source: "saved" });
            }
          });
        }

        const { data: recent } = await supabase
          .from("jobs")
          .select("id, title, company_name")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(20);
        (recent || []).forEach((j: any) => {
          if (!seen.has(j.id)) {
            seen.add(j.id);
            out.push({ id: j.id, title: j.title, company_name: j.company_name, source: "recent" });
          }
        });

        if (alive) setJobs(out);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open]);

  const filtered = q.trim()
    ? jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q.toLowerCase()) ||
          (j.company_name || "").toLowerCase().includes(q.toLowerCase()),
      )
    : jobs;

  const pick = (id: string) => {
    onOpenChange(false);
    navigate(`/app/jobs/${id}?score=1`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle>Score me vs a job</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Pick a job to see your match score. 10 credits per scoring.
          </p>
        </SheetHeader>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search saved or recent jobs..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto mt-3 space-y-2">
          {loading && (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No jobs found.</p>
          )}
          {!loading &&
            filtered.map((j) => (
              <Button
                key={j.id}
                variant="outline"
                className="w-full justify-between h-auto py-2.5 px-3"
                onClick={() => pick(j.id)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium truncate">{j.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{j.company_name || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {j.source === "saved" && (
                    <Badge variant="secondary" className="text-[10px]">Saved</Badge>
                  )}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
