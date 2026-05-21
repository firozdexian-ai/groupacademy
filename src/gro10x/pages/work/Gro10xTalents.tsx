/**
 * Talents tab — every talent who has ever interacted with the active company:
 * job applicants + revealed/shortlisted candidates. Lightweight aggregate view.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listRecentApplicationsWithJobMeta } from "@/domains/jobs/repo/jobsRepo";
import { listCompanyShortlistsRecent } from "@/domains/companies/repo/companiesRepo";
import { listTalentsBasicByIds } from "@/domains/talent/repo/talentRepo";
import { useActiveCompany } from "../../hooks/useActiveCompany";
import { GRO10X_PANEL, GRO10X_MUTED } from "../../lib/tokens";
import { Loader2, MessageSquare, User } from "lucide-react";

interface Row {
  user_id: string | null;
  talent_id: string | null;
  full_name: string | null;
  profession: string | null;
  photo: string | null;
  source: "applicant" | "shortlist";
  last_at: string;
  job_title?: string;
}

export default function Gro10xTalents() {
  const { companyId } = useActiveCompany();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);

      // Applicants on this company's jobs
      const apps = await listRecentApplicationsWithJobMeta(200);
      const filteredApps: any[] = ((apps ?? []) as any[]).filter(
        (a: any) => a?.jobs?.company_id === companyId
      );

      const talentIds = Array.from(
        new Set(filteredApps.map((a: any) => a.talent_id).filter(Boolean))
      ) as string[];

      // Shortlist
      const short = await listCompanyShortlistsRecent(companyId, 200);
      const shortIds = Array.from(
        new Set((short ?? []).map((s: any) => s.talent_id).filter(Boolean))
      ) as string[];

      const allIds = Array.from(new Set([...talentIds, ...shortIds]));
      let talentMap: Record<string, any> = {};
      if (allIds.length) {
        const t = await listTalentsBasicByIds(allIds);
        talentMap = Object.fromEntries((t ?? []).map((row: any) => [row.id, row]));
      }

      const merged: Row[] = [];
      const seen = new Set<string>();
      for (const a of filteredApps) {
        if (seen.has(a.talent_id)) continue;
        seen.add(a.talent_id);
        const tt = talentMap[a.talent_id];
        if (!tt) continue;
        merged.push({
          user_id: tt.user_id,
          talent_id: tt.id,
          full_name: tt.full_name,
          profession: tt.custom_profession,
          photo: tt.profile_photo_url,
          source: "applicant",
          last_at: a.created_at,
          job_title: a.jobs?.title,
        });
      }
      for (const s of short ?? []) {
        if (seen.has(s.talent_id)) continue;
        seen.add(s.talent_id);
        const tt = talentMap[s.talent_id];
        if (!tt) continue;
        merged.push({
          user_id: tt.user_id,
          talent_id: tt.id,
          full_name: tt.full_name,
          profession: tt.custom_profession,
          photo: tt.profile_photo_url,
          source: "shortlist",
          last_at: s.created_at,
        });
      }

      if (!cancelled) {
        setRows(merged.sort((a, b) => (a.last_at < b.last_at ? 1 : -1)));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (loading) {
    return (
      <div className="px-4 py-12 text-center text-sm text-slate-400">
        <Loader2 className="h-5 w-5 mx-auto animate-spin mb-2" /> Loading talents…
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="px-6 py-12 text-center">
        <User className="h-10 w-10 mx-auto text-slate-500 mb-3" />
        <p className="text-sm text-slate-400">
          Talents who apply to your jobs or get shortlisted will show up here.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-white/5">
      {rows.map((r, i) => (
        <li key={`${r.talent_id}-${i}`} className="px-4 py-3 flex items-center gap-3">
          <div
            className={`h-11 w-11 rounded-full ${GRO10X_PANEL} border border-white/10 grid place-items-center overflow-hidden text-sm font-semibold`}
          >
            {r.photo ? (
              <img src={r.photo} alt="" className="h-full w-full object-cover" />
            ) : (
              (r.full_name || "?").charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{r.full_name || "Unnamed talent"}</p>
            <p className={`text-[11px] ${GRO10X_MUTED} truncate`}>
              {r.profession || "Talent"}
              {r.job_title ? ` · applied to ${r.job_title}` : r.source === "shortlist" ? " · shortlisted" : ""}
            </p>
          </div>
          <Link
            to={`/gro10x/c/sourcer`}
            className="text-[11px] inline-flex items-center gap-1 text-[#33E1E4] hover:underline"
            title="Discuss with Sourcer"
          >
            <MessageSquare className="h-3 w-3" /> Discuss
          </Link>
        </li>
      ))}
    </ul>
  );
}
