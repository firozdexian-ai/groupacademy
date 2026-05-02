import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GRO10X_PANEL, GRO10X_MUTED } from "../../lib/tokens";
import { Loader2, Bookmark, MapPin, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface ShortlistItem {
  id: string;
  note: string | null;
  created_at: string;
  talents: {
    id: string;
    full_name: string | null;
    country: string | null;
    headline: string | null;
    profession: string | null;
  } | null;
}

export default function Gro10xShortlist() {
  const [items, setItems] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("company-agent-tools", {
      body: { tool_key: "list_shortlist" },
    });
    if (error || !data?.ok) {
      toast.error(data?.error ?? error?.message ?? "Could not load shortlist");
      setItems([]);
    } else {
      setItems((data.result?.shortlist ?? []) as ShortlistItem[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="py-10 text-center text-sm text-slate-400 inline-flex items-center gap-2 w-full justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading shortlist…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <Bookmark className="h-10 w-10 mx-auto text-slate-500 mb-3" />
        <p className="text-sm text-slate-400 mb-3">Your shortlist is empty.</p>
        <Link
          to="/gro10x/c/sourcer"
          className="inline-flex items-center gap-1 text-[11px] text-[#33E1E4] hover:underline"
        >
          Ask Sourcer to find candidates →
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 space-y-2 pb-20">
      {items.map((it) => (
        <div
          key={it.id}
          className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-3`}
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[#0B1220] border border-white/10 grid place-items-center text-sm font-semibold">
              {(it.talents?.full_name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {it.talents?.full_name ?? "Candidate"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {it.talents?.headline ?? it.talents?.profession ?? "—"}
              </p>
              <div className={`mt-0.5 flex items-center gap-2 text-[10px] ${GRO10X_MUTED}`}>
                {it.talents?.country && (
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" /> {it.talents.country}
                  </span>
                )}
                <span>
                  Added{" "}
                  {new Date(it.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              {it.note && (
                <p className="mt-1 text-[11px] text-slate-300 italic">"{it.note}"</p>
              )}
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <Link
              to="/gro10x/c/recruiter"
              className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] px-3 py-1.5 rounded-full bg-[#33E1E4]/10 text-[#33E1E4] border border-[#33E1E4]/20"
            >
              <MessageSquare className="h-3 w-3" /> Reach out via Recruiter
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
