/**
 * Phase 4.7 — small chip surfacing recent instructor activity.
 * Resolves talentId -> user_id, checks instructor_earnings_ledger for activity within 30d.
 */
import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function ActiveInstructorChip({ talentId }: { talentId?: string | null }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!talentId) return;
    let cancelled = false;
    (async () => {
      const { data: t } = await supabase.from("talents").select("user_id").eq("id", talentId).maybeSingle();
      const uid = (t as any)?.user_id;
      if (!uid) return;
      const since = new Date(Date.now() - 30 * 86400_000).toISOString();
      const { count } = await supabase
        .from("instructor_earnings_ledger" as any)
        .select("id", { count: "exact", head: true })
        .eq("instructor_user_id", uid)
        .gte("created_at", since);
      if (!cancelled) setActive((count ?? 0) > 0);
    })();
    return () => { cancelled = true; };
  }, [talentId]);
  if (!active) return null;
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px]">
      <GraduationCap className="h-3 w-3" />
      Active instructor
    </div>
  );
}
