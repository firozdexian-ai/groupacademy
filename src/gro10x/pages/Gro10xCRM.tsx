/**
 * /gro10x/crm — Lightweight Kanban-style CRM.
 * Stages: new → contacted → qualified → proposal → won/lost.
 * Uses `company_leads` + `company_lead_activities` (member-scoped RLS).
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCompany } from "../hooks/useActiveCompany";
import { useCompanyOfferings } from "../hooks/useCompanyOfferings";
import { GRO10X_MUTED } from "../lib/tokens";
import { Plus, X, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type Stage = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";

const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: "new", label: "New", color: "bg-slate-500/15 text-slate-300" },
  { id: "contacted", label: "Contacted", color: "bg-blue-500/15 text-blue-300" },
  { id: "qualified", label: "Qualified", color: "bg-cyan-500/15 text-cyan-300" },
  { id: "proposal", label: "Proposal", color: "bg-amber-500/15 text-amber-300" },
  { id: "won", label: "Won", color: "bg-emerald-500/15 text-emerald-300" },
  { id: "lost", label: "Lost", color: "bg-rose-500/15 text-rose-300" },
];

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  title: string | null;
  source: string | null;
  stage: Stage;
  value_usd: number;
  notes: string | null;
  next_step: string | null;
  offering_id: string | null;
  created_at: string;
}

export default function Gro10xCRM() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { companyId, isLoading } = useActiveCompany();
  const qc = useQueryClient();
  const [activeStage, setActiveStage] = useState<Stage>("new");
  const [showNew, setShowNew] = useState(false);
  const [openLead, setOpenLead] = useState<Lead | null>(null);

  const leadsQuery = useQuery({
    queryKey: ["company-leads", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<Lead[]> => {
      const { data } = await supabase
        .from("company_leads")
        .select("id,name,email,phone,company_name,title,source,stage,value_usd,notes,next_step,offering_id,created_at")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      return (data ?? []).map((r: any) => ({ ...r, value_usd: Number(r.value_usd ?? 0) }));
    },
  });

  const createLead = useMutation({
    mutationFn: async (payload: { name: string; email: string; company_name: string; source: string; value_usd: number }) => {
      const { error } = await supabase.from("company_leads").insert({
        company_id: companyId!,
        created_by: user!.id,
        owner_user_id: user!.id,
        ...payload,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead added");
      qc.invalidateQueries({ queryKey: ["company-leads", companyId] });
      setShowNew(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: Stage }) => {
      const { error } = await supabase.from("company_leads").update({ stage }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-leads", companyId] });
      setOpenLead(null);
    },
  });

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-sm text-slate-400 mb-4">Sign in to manage your CRM.</p>
        <button onClick={() => navigate("/gro10x/auth")} className="rounded-full bg-[#33E1E4] text-[#06121A] px-5 py-2 text-sm font-semibold">
          Get started
        </button>
      </div>
    );
  }

  if (isLoading) return <div className="p-6 text-center text-sm text-slate-400">Loading…</div>;
  if (!companyId) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-sm text-slate-400 mb-4">Create your company workspace to use the CRM.</p>
        <button onClick={() => navigate("/gro10x/page")} className="rounded-full bg-[#33E1E4] text-[#06121A] px-5 py-2 text-sm font-semibold">Set up company</button>
      </div>
    );
  }

  const leads = leadsQuery.data ?? [];
  const filtered = leads.filter((l) => l.stage === activeStage);
  const counts = STAGES.reduce<Record<Stage, number>>((acc, s) => {
    acc[s.id] = leads.filter((l) => l.stage === s.id).length;
    return acc;
  }, { new: 0, contacted: 0, qualified: 0, proposal: 0, won: 0, lost: 0 });

  return (
    <div className="max-w-md mx-auto pb-24">
      <header className="sticky top-0 z-10 bg-[#0B1220]/95 backdrop-blur-md border-b border-white/5">
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">CRM</h1>
            <p className={`text-xs ${GRO10X_MUTED}`}>{leads.length} leads in pipeline</p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="rounded-full bg-[#33E1E4] text-[#06121A] p-2"
            aria-label="Add lead"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 pb-2">
          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap">
            {STAGES.map((s) => {
              const active = activeStage === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStage(s.id)}
                  aria-pressed={active}
                  className={`px-2 py-1.5 rounded-full text-xs font-medium border transition flex items-center justify-center gap-1 ${
                    active
                      ? "bg-[#33E1E4] text-[#06121A] border-[#33E1E4]"
                      : "bg-white/5 border-white/10 text-slate-300"
                  }`}
                >
                  <span className="truncate">{s.label}</span>
                  <span className="opacity-70 tabular-nums">{counts[s.id]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="px-4 py-3 space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-xs text-slate-500 py-12">No leads in {activeStage}.</p>
        )}
        {filtered.map((l) => (
          <button
            key={l.id}
            onClick={() => setOpenLead(l)}
            className="w-full text-left rounded-2xl bg-white/5 border border-white/10 p-3 hover:bg-white/[0.07] transition"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">{l.name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {l.company_name || l.title || l.email || "—"}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
            </div>
            {l.value_usd > 0 && (
              <p className="text-[11px] text-emerald-300 mt-1">${l.value_usd.toLocaleString()}</p>
            )}
          </button>
        ))}
      </div>

      {showNew && (
        <NewLeadSheet
          onClose={() => setShowNew(false)}
          onSubmit={(p) => createLead.mutate(p)}
          submitting={createLead.isPending}
        />
      )}

      {openLead && (
        <LeadDetail
          lead={openLead}
          onClose={() => setOpenLead(null)}
          onStageChange={(s) => updateStage.mutate({ id: openLead.id, stage: s })}
          companyId={companyId}
          userId={user.id}
        />
      )}
    </div>
  );
}

function NewLeadSheet({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (p: { name: string; email: string; company_name: string; source: string; value_usd: number }) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [source, setSource] = useState("");
  const [value, setValue] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="New lead"
    >
      <div
        className="w-full max-w-md mx-auto bg-[#0B1220] border-t border-white/10 rounded-t-3xl p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">New lead</h2>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>
        <Input label="Name *" value={name} onChange={setName} />
        <Input label="Email" value={email} onChange={setEmail} type="email" />
        <Input label="Company" value={company} onChange={setCompany} />
        <Input label="Source (e.g. Referral, LinkedIn)" value={source} onChange={setSource} />
        <Input label="Deal value (USD)" value={value} onChange={setValue} type="number" />
        <button
          disabled={!name || submitting}
          onClick={() => onSubmit({ name, email, company_name: company, source, value_usd: Number(value) || 0 })}
          className="w-full rounded-full bg-[#33E1E4] text-[#06121A] py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Add lead"}
        </button>
      </div>
    </div>
  );
}

function Input({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#33E1E4] outline-none"
      />
    </label>
  );
}

function LeadDetail({
  lead, onClose, onStageChange, companyId, userId,
}: {
  lead: Lead; onClose: () => void; onStageChange: (s: Stage) => void;
  companyId: string; userId: string;
}) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [nextStep, setNextStep] = useState(lead.next_step ?? "");
  const [offeringId, setOfferingId] = useState(lead.offering_id ?? "");
  const offerings = useCompanyOfferings(companyId, { activeOnly: true });

  const activitiesQuery = useQuery({
    queryKey: ["lead-activities", lead.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_lead_activities")
        .select("id, activity_type, body, created_at")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const updateLead = useMutation({
    mutationFn: async (patch: Partial<Lead>) => {
      const { error } = await supabase.from("company_leads").update(patch as any).eq("id", lead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-leads", companyId] });
      toast.success("Updated");
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("company_lead_activities").insert({
        lead_id: lead.id,
        company_id: companyId,
        created_by: userId,
        activity_type: "note",
        body: note,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNote("");
      qc.invalidateQueries({ queryKey: ["lead-activities", lead.id] });
      toast.success("Note added");
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Lead: ${lead.name}`}
    >
      <div
        className="w-full max-w-md mx-auto bg-[#0B1220] border-t border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#0B1220] border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold truncate">{lead.name}</h2>
            <p className="text-xs text-slate-400 truncate">{lead.company_name || lead.email || "—"}</p>
          </div>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-[11px] text-slate-400 mb-2">Move to stage</p>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onStageChange(s.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] border transition ${
                    lead.stage === s.id
                      ? "bg-[#33E1E4] text-[#06121A] border-[#33E1E4]"
                      : "bg-white/5 border-white/10 text-slate-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {(lead.email || lead.phone || lead.source) && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs space-y-1">
              {lead.email && <p><span className="text-slate-400">Email:</span> {lead.email}</p>}
              {lead.phone && <p><span className="text-slate-400">Phone:</span> {lead.phone}</p>}
              {lead.source && <p><span className="text-slate-400">Source:</span> {lead.source}</p>}
              {lead.value_usd > 0 && <p><span className="text-slate-400">Value:</span> ${lead.value_usd.toLocaleString()}</p>}
            </div>
          )}

          {/* Offering link */}
          <div>
            <p className="text-[11px] text-slate-400 mb-1">Offering</p>
            <select
              value={offeringId}
              onChange={(e) => {
                const v = e.target.value;
                setOfferingId(v);
                updateLead.mutate({ offering_id: (v || null) as any });
              }}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:border-[#33E1E4] outline-none"
            >
              <option value="">— None —</option>
              {(offerings.data ?? []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.kind})
                </option>
              ))}
            </select>
          </div>

          {/* Next step */}
          <div>
            <p className="text-[11px] text-slate-400 mb-1">Next step</p>
            <input
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              onBlur={() => {
                if ((lead.next_step ?? "") !== nextStep) {
                  updateLead.mutate({ next_step: (nextStep.trim() || null) as any });
                }
              }}
              placeholder="e.g. Follow up Tuesday with proposal"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#33E1E4] outline-none"
            />
          </div>

          <div>
            <p className="text-[11px] text-slate-400 mb-2">Add note</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Quick note about this lead…"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#33E1E4] outline-none"
            />
            <button
              disabled={!note.trim() || addNote.isPending}
              onClick={() => addNote.mutate()}
              className="mt-2 rounded-full bg-[#33E1E4] text-[#06121A] px-4 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              Save note
            </button>
          </div>

          <div>
            <p className="text-[11px] text-slate-400 mb-2">Activity</p>
            <div className="space-y-2">
              {(activitiesQuery.data ?? []).length === 0 && (
                <p className="text-xs text-slate-500">No activity yet.</p>
              )}
              {(activitiesQuery.data ?? []).map((a: any) => (
                <div key={a.id} className="rounded-lg bg-white/5 border border-white/10 p-2.5">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">{a.activity_type}</p>
                  <p className="text-xs text-slate-200 whitespace-pre-wrap mt-0.5">{a.body}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
