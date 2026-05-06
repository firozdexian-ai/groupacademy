/**
 * Gro10x Learn Ops — B2B company admin dashboard for the learning system.
 * Tabs: Overview · Assignments · Catalog · Team · Wallet
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, ListChecks, BookOpen, Users, Wallet, Plus, Building2 } from "lucide-react";
import { GRO10X_PANEL, GRO10X_MUTED } from "../lib/tokens";
import { useActiveCompany } from "../hooks/useActiveCompany";
import {
  useOrgLearningHealth,
  useOrgAssignments,
  useOrgTeamMastery,
  useOrgWallet,
  useOrgSeats,
  useAssignTalents,
} from "@/hooks/useOrgLearning";
import { useB2BCatalog } from "../hooks/useCourseAssignments";
import { Button } from "@/components/ui/button";

type Tab = "overview" | "assignments" | "catalog" | "team" | "wallet";

export default function Gro10xLearnOps() {
  const { companyId, role, isLoading } = useActiveCompany();
  const [tab, setTab] = useState<Tab>("overview");

  if (isLoading) return <div className="p-4 text-sm text-slate-400">Loading…</div>;
  if (!companyId)
    return (
      <div className="p-4">
        <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-4 text-center`}>
          <Building2 className="h-6 w-6 mx-auto text-slate-400" />
          <p className="text-sm mt-2">You aren't part of a company yet.</p>
        </div>
      </div>
    );

  const isAdmin = role === "owner" || role === "admin";

  return (
    <div className="max-w-md md:max-w-5xl md:max-w-5xl mx-auto pb-24">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-semibold tracking-tight">Learning Ops</h1>
        <p className={`text-xs ${GRO10X_MUTED} mt-0.5`}>
          Assign courses, track team mastery, manage seats.
        </p>
      </header>

      <nav className="px-4 sticky top-0 z-10 bg-[#0B1220]/80 backdrop-blur border-b border-white/5">
        <div className="flex gap-1 overflow-x-auto py-2 -mx-1 px-1 no-scrollbar">
          {(
            [
              ["overview", "Overview", BarChart3],
              ["assignments", "Assignments", ListChecks],
              ["catalog", "Catalog", BookOpen],
              ["team", "Team", Users],
              ["wallet", "Wallet", Wallet],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex items-center gap-1 text-[11px] rounded-full px-3 py-1.5 whitespace-nowrap transition ${
                tab === k
                  ? "bg-[#33E1E4]/15 text-[#33E1E4] border border-[#33E1E4]/30"
                  : "bg-white/5 text-slate-400 border border-white/10"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div className="px-4 pt-3">
        {tab === "overview" && <OverviewPane companyId={companyId} />}
        {tab === "assignments" && <AssignmentsPane companyId={companyId} canAssign={isAdmin} />}
        {tab === "catalog" && <CatalogPane companyId={companyId} canAssign={isAdmin} />}
        {tab === "team" && <TeamPane companyId={companyId} />}
        {tab === "wallet" && <WalletPane companyId={companyId} />}
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-3`}>
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-xl font-semibold mt-0.5">{value}</p>
      {hint && <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function OverviewPane({ companyId }: { companyId: string }) {
  const { data, isLoading } = useOrgLearningHealth(companyId);
  if (isLoading) return <p className="text-xs text-slate-500">Loading KPIs…</p>;
  if (!data) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard label="Active" value={data.active ?? 0} />
      <StatCard label="On track" value={`${data.on_track_pct ?? 0}%`} />
      <StatCard label="Overdue" value={data.overdue ?? 0} />
      <StatCard label="Completed" value={data.completed ?? 0} />
      <StatCard label="Wallet" value={`${data.wallet_balance ?? 0} cr`} />
      <StatCard label="Burn MTD" value={`${data.credits_burned_mtd ?? 0} cr`} />
    </div>
  );
}

function AssignmentsPane({ companyId, canAssign }: { companyId: string; canAssign: boolean }) {
  const { data: rows, isLoading } = useOrgAssignments(companyId);
  if (isLoading) return <p className="text-xs text-slate-500">Loading…</p>;
  if (!rows || rows.length === 0)
    return (
      <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-4 text-center`}>
        <p className="text-xs text-slate-400">
          No assignments yet. {canAssign ? "Open the Catalog to assign your first course." : ""}
        </p>
      </div>
    );
  return (
    <ul className="space-y-2">
      {rows.map((a: any) => (
        <li
          key={a.id}
          className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-3`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium truncate">{a.content?.title ?? "Course"}</p>
            <StatusPill status={a.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
            {a.cohort?.name && <span>Cohort · {a.cohort.name}</span>}
            {a.due_at && <span>Due {new Date(a.due_at).toLocaleDateString()}</span>}
            {a.budget_credits > 0 && <span>{a.budget_credits} cr</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-[#33E1E4]/15 text-[#33E1E4]",
    completed: "bg-emerald-500/15 text-emerald-300",
    overdue: "bg-amber-500/15 text-amber-300",
    invited: "bg-white/5 text-slate-400",
    cancelled: "bg-white/5 text-slate-500",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${map[status] ?? "bg-white/5"}`}>
      {status}
    </span>
  );
}

function CatalogPane({ companyId, canAssign }: { companyId: string; canAssign: boolean }) {
  const catalog = useB2BCatalog();
  const assign = useAssignTalents();
  const [busy, setBusy] = useState<string | null>(null);

  if (catalog.isLoading) return <p className="text-xs text-slate-500">Loading…</p>;
  if (!catalog.data || catalog.data.length === 0)
    return (
      <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-4 text-center`}>
        <p className="text-xs text-slate-400">No B2B courses yet.</p>
      </div>
    );

  return (
    <ul className="space-y-2">
      {catalog.data.map((c) => (
        <li
          key={c.id}
          className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-3 flex items-center gap-3`}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{c.title}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{c.credit_cost ?? 0} credits / seat</p>
          </div>
          {canAssign && (
            <Link
              to={`/gro10x/sourcing?intent=assign&content=${c.id}`}
              className="text-[10px] px-2 py-1 rounded-full bg-[#33E1E4]/15 text-[#33E1E4] border border-[#33E1E4]/30 inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Assign
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

function TeamPane({ companyId }: { companyId: string }) {
  const { data, isLoading } = useOrgTeamMastery(companyId);
  if (isLoading) return <p className="text-xs text-slate-500">Loading…</p>;
  if (!data || data.length === 0)
    return (
      <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-4 text-center`}>
        <p className="text-xs text-slate-400">No team activity yet.</p>
      </div>
    );

  // group by user
  const byUser = new Map<string, any[]>();
  for (const r of data) {
    const k = r.user_id ?? "unknown";
    byUser.set(k, [...(byUser.get(k) ?? []), r]);
  }

  return (
    <ul className="space-y-2">
      {Array.from(byUser.entries()).map(([uid, rows]) => {
        const avgProgress = Math.round(
          rows.reduce((s, r) => s + (r.progress ?? 0), 0) / rows.length,
        );
        return (
          <li key={uid} className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-3`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate">Talent · {uid.slice(0, 8)}</p>
              <span className="text-[10px] text-slate-500">{rows.length} courses</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-[#33E1E4]"
                style={{ width: `${Math.min(100, avgProgress)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Avg progress · {avgProgress}%</p>
          </li>
        );
      })}
    </ul>
  );
}

function WalletPane({ companyId }: { companyId: string }) {
  const { data, isLoading } = useOrgWallet(companyId);
  const seats = useOrgSeats(companyId);
  if (isLoading) return <p className="text-xs text-slate-500">Loading…</p>;
  return (
    <div className="space-y-3">
      <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-4`}>
        <p className="text-[10px] uppercase tracking-wide text-slate-500">Company balance</p>
        <p className="text-2xl font-semibold mt-1">
          {data?.balance?.balance ?? 0} <span className="text-sm text-slate-400">credits</span>
        </p>
        <Button asChild size="sm" className="mt-3">
          <Link to="/gro10x/billing">Top up</Link>
        </Button>
      </div>

      {seats.data && seats.data.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-300 mb-2">Seat packs</h3>
          <ul className="space-y-2">
            {seats.data.map((s: any) => (
              <li
                key={s.id}
                className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-3 flex items-center justify-between`}
              >
                <div>
                  <p className="text-sm">{s.content?.title ?? "Any course"}</p>
                  <p className="text-[10px] text-slate-500">
                    {s.seats_used}/{s.seats_total} used
                  </p>
                </div>
                <div className="h-1.5 w-24 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-[#33E1E4]"
                    style={{ width: `${Math.min(100, (s.seats_used / Math.max(s.seats_total, 1)) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold text-slate-300 mb-2">Recent ledger</h3>
        <ul className="space-y-1">
          {(data?.transactions ?? []).slice(0, 10).map((t: any) => (
            <li
              key={t.id}
              className={`${GRO10X_PANEL} border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between text-xs`}
            >
              <span className="text-slate-400 truncate">{t.description ?? t.transaction_type}</span>
              <span className={t.amount < 0 ? "text-amber-300" : "text-emerald-300"}>
                {t.amount > 0 ? "+" : ""}
                {t.amount}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
