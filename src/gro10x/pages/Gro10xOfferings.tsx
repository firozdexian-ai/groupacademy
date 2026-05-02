/**
 * /gro10x/offerings — Company services & products catalog editor.
 * Owners/admins can CRUD; the same data is read by the public company page.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCompany } from "../hooks/useActiveCompany";
import {
  useCompanyOfferings,
  useUpsertOffering,
  useDeleteOffering,
  type CompanyOffering,
} from "../hooks/useCompanyOfferings";
import { GRO10X_PANEL, GRO10X_MUTED } from "../lib/tokens";
import { Plus, Pencil, Trash2, X, Tag, DollarSign, Package, Briefcase } from "lucide-react";
import { toast } from "sonner";

export default function Gro10xOfferings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { companyId, role, isLoading } = useActiveCompany();
  const offerings = useCompanyOfferings(companyId);
  const upsert = useUpsertOffering(companyId);
  const del = useDeleteOffering(companyId);
  const [editing, setEditing] = useState<Partial<CompanyOffering> | null>(null);

  const canEdit = role === "owner" || role === "admin";

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-sm text-slate-400 mb-4">Sign in to manage your offerings.</p>
        <button
          onClick={() => navigate("/gro10x/auth")}
          className="rounded-full bg-[#33E1E4] text-[#06121A] px-5 py-2 text-sm font-semibold"
        >
          Get started
        </button>
      </div>
    );
  }

  if (isLoading) return <div className="p-6 text-center text-sm text-slate-400">Loading…</div>;
  if (!companyId) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-sm text-slate-400 mb-4">Set up your company to add offerings.</p>
        <button
          onClick={() => navigate("/gro10x/page")}
          className="rounded-full bg-[#33E1E4] text-[#06121A] px-5 py-2 text-sm font-semibold"
        >
          Set up company
        </button>
      </div>
    );
  }

  const list = offerings.data ?? [];

  return (
    <div className="max-w-md mx-auto pb-24">
      <header className="sticky top-0 z-10 bg-[#0B1220]/95 backdrop-blur-md border-b border-white/5 px-4 pt-3 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Offerings</h1>
          <p className={`text-xs ${GRO10X_MUTED}`}>What your company sells · {list.length}</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setEditing({ kind: "service", currency: "USD", is_active: true } as any)}
            className="rounded-full bg-[#33E1E4] text-[#06121A] p-2"
            aria-label="Add offering"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </header>

      <div className="px-4 pt-3 space-y-2">
        {list.length === 0 && (
          <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-6 text-center`}>
            <Package className="h-8 w-8 mx-auto text-slate-500 mb-2" />
            <p className="text-sm text-slate-300">No offerings yet</p>
            <p className="text-xs text-slate-500 mt-1">
              {canEdit
                ? "Add your first service or product so prospects, the AI sales agent, and your team know what you sell."
                : "Your company hasn't published any offerings yet."}
            </p>
          </div>
        )}

        {list.map((o) => (
          <div key={o.id} className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-3`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {o.kind === "product" ? (
                    <Package className="h-3.5 w-3.5 text-[#33E1E4]" />
                  ) : (
                    <Briefcase className="h-3.5 w-3.5 text-[#33E1E4]" />
                  )}
                  <p className="text-sm font-medium truncate">{o.name}</p>
                  {!o.is_active && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-500/20 text-slate-400">
                      hidden
                    </span>
                  )}
                </div>
                {o.tagline && <p className="text-[11px] text-slate-400 mt-0.5">{o.tagline}</p>}
                {(o.price_min || o.price_max) && (
                  <p className="text-[11px] text-emerald-300 mt-1 inline-flex items-center gap-0.5">
                    <DollarSign className="h-2.5 w-2.5" />
                    {priceRange(o)}
                    {o.unit && <span className="text-slate-500 ml-1">/{o.unit}</span>}
                  </p>
                )}
                {o.tags?.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-300 inline-flex items-center gap-0.5"
                      >
                        <Tag className="h-2 w-2" /> {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {canEdit && (
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => setEditing(o)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10"
                    aria-label="Edit"
                  >
                    <Pencil className="h-3 w-3 text-slate-300" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${o.name}"?`)) del.mutate(o.id);
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/15"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3 w-3 text-rose-300" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <OfferingEditor
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={async (payload) => {
            try {
              await upsert.mutateAsync(payload as any);
              toast.success("Saved");
              setEditing(null);
            } catch (e: any) {
              toast.error(e?.message ?? "Could not save");
            }
          }}
          saving={upsert.isPending}
        />
      )}
    </div>
  );
}

function priceRange(o: CompanyOffering) {
  const sym = o.currency === "USD" ? "$" : o.currency + " ";
  if (o.price_min && o.price_max && o.price_min !== o.price_max) {
    return `${sym}${Number(o.price_min).toLocaleString()}–${Number(o.price_max).toLocaleString()}`;
  }
  const v = o.price_min ?? o.price_max!;
  return `${sym}${Number(v).toLocaleString()}`;
}

function OfferingEditor({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: Partial<CompanyOffering>;
  onClose: () => void;
  onSave: (p: Partial<CompanyOffering> & { name: string; kind: "service" | "product" }) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [kind, setKind] = useState<"service" | "product">((initial.kind as any) ?? "service");
  const [tagline, setTagline] = useState(initial.tagline ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [priceMin, setPriceMin] = useState(initial.price_min?.toString() ?? "");
  const [priceMax, setPriceMax] = useState(initial.price_max?.toString() ?? "");
  const [currency, setCurrency] = useState(initial.currency ?? "USD");
  const [unit, setUnit] = useState(initial.unit ?? "");
  const [tags, setTags] = useState((initial.tags ?? []).join(", "));
  const [isActive, setIsActive] = useState(initial.is_active ?? true);

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      ...(initial.id ? { id: initial.id } : {}),
      name: name.trim(),
      kind,
      tagline: tagline.trim() || null,
      description: description.trim() || null,
      price_min: priceMin ? Number(priceMin) : null,
      price_max: priceMax ? Number(priceMax) : null,
      currency: currency || "USD",
      unit: unit.trim() || null,
      tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
      is_active: isActive,
    } as any);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-md mx-auto bg-[#0B1220] border-t border-white/10 rounded-t-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#0B1220] border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{initial.id ? "Edit offering" : "Add offering"}</h2>
          <button onClick={onClose}>
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            {(["service", "product"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`flex-1 rounded-full py-1.5 text-xs font-medium border ${
                  kind === k
                    ? "bg-[#33E1E4] text-[#06121A] border-[#33E1E4]"
                    : "bg-white/5 border-white/10 text-slate-300"
                }`}
              >
                {k === "service" ? "Service" : "Product"}
              </button>
            ))}
          </div>
          <Field label="Name *" value={name} onChange={setName} />
          <Field label="Tagline" value={tagline} onChange={setTagline} />
          <label className="block">
            <span className="text-[11px] text-slate-400">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:border-[#33E1E4] outline-none"
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Price min" value={priceMin} onChange={setPriceMin} type="number" />
            <Field label="Price max" value={priceMax} onChange={setPriceMax} type="number" />
            <Field label="Currency" value={currency} onChange={setCurrency} />
          </div>
          <Field label="Unit (e.g. per_month)" value={unit} onChange={setUnit} />
          <Field label="Tags (comma-separated)" value={tags} onChange={setTags} />
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-[#33E1E4]"
            />
            Visible publicly
          </label>
          <button
            disabled={!name.trim() || saving}
            onClick={submit}
            className="w-full rounded-full bg-[#33E1E4] text-[#06121A] py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
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
