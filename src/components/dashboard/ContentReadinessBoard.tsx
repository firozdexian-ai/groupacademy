import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, RotateCcw } from "lucide-react";

interface SchoolRow {
  school_id: string;
  school_name: string;
  total_courses: number;
  ready_courses: number;
  pct: number;
}

export function ContentReadinessBoard() {
  const [rows, setRows] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAll, setBusyAll] = useState(false);
  const [busySchool, setBusySchool] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("school_readiness_v" as any)
      .select("school_id, school_name, total_courses, ready_courses, pct")
      .order("pct", { ascending: false });
    if (!error && data) setRows(data as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const generateAll = async () => {
    if (!confirm("Generate content gigs for every unready course in the academy? This may create hundreds of gigs.")) return;
    setBusyAll(true);
    const { data, error } = await supabase.rpc("generate_content_gigs_for_all_unready" as any);
    setBusyAll(false);
    if (error) return toast.error(error.message);
    toast.success(`Generated ${data ?? 0} new gigs across all unready courses.`);
    load();
  };

  const generateForSchool = async (schoolId: string, name: string) => {
    setBusySchool(schoolId);
    const { data, error } = await supabase.rpc("generate_content_gigs_for_school" as any, { _school_id: schoolId });
    setBusySchool(null);
    if (error) return toast.error(error.message);
    toast.success(`${name}: ${data ?? 0} gigs generated.`);
  };

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">School readiness</h2>
          <p className="text-xs text-muted-foreground">
            A school becomes public only when all its courses reach 100% ready. Use the buttons to convert missing
            module resources into claimable Content Studio gigs.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={load}>
            <RotateCcw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={generateAll} disabled={busyAll}>
            <Sparkles className="h-3.5 w-3.5 mr-2" />
            {busyAll ? "Generating…" : "Generate gigs for all unready"}
          </Button>
        </div>
      </div>
      {rows.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">No schools yet.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map((r) => (
            <Card key={r.school_id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm">{r.school_name}</p>
                <Badge variant={r.pct >= 100 ? "default" : "secondary"}>
                  {r.ready_courses}/{r.total_courses}
                </Badge>
              </div>
              <Progress value={Number(r.pct) || 0} />
              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-[11px] text-muted-foreground">{Math.round(Number(r.pct) || 0)}% ready</p>
                {r.pct < 100 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={() => generateForSchool(r.school_id, r.school_name)}
                    disabled={busySchool === r.school_id}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    {busySchool === r.school_id ? "…" : "Generate gigs"}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ContentReadinessBoard;
