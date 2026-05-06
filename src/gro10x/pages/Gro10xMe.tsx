/**
 * Gro10x "Me" tab — same identity as the Talent app's Profile, since every
 * Gro10x contact is also a Talent. We render the talent Profile component
 * inside the Gro10x shell with a thin workspace strip on top.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Profile from "@/pages/app/Profile";
import { GRO10X_PANEL, GRO10X_MUTED } from "../lib/tokens";
import { Building2, ExternalLink, LogOut } from "lucide-react";

export default function Gro10xMe() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState<{ name: string } | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data: m } = await supabase
        .from("company_members")
        .select("role, companies:company_id (name)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (cancelled || !m) return;
      setRole(m.role as string);
      setCompany((m as any).companies);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!user) {
    return (
      <div className="max-w-md md:max-w-5xl md:max-w-5xl mx-auto p-6 text-center">
        <p className="text-sm text-slate-400 mb-4">Sign in to see your profile.</p>
        <button
          onClick={() => navigate("/gro10x/auth")}
          className="rounded-full bg-[#33E1E4] text-[#06121A] px-5 py-2 text-sm font-semibold"
        >
          Get started
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-[calc(100dvh-64px)]">
      {/* Workspace strip */}
      <div className={`px-4 py-3 border-b border-white/5 ${GRO10X_PANEL} flex items-center justify-between`}>
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="h-4 w-4 text-[#33E1E4] shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Workspace</p>
            <p className="text-sm text-slate-100 truncate">
              {company?.name || "—"}
              {role && <span className={`${GRO10X_MUTED} ml-1 capitalize`}>· {role}</span>}
            </p>
          </div>
        </div>
        <a
          href="/app/profile"
          className="text-[11px] inline-flex items-center gap-1 text-[#33E1E4] hover:underline"
        >
          Talent app <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Reuse the Talent app Profile component verbatim */}
      <Profile />

      <div className="px-4 pb-10">
        <button
          onClick={() => signOut()}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 flex items-center justify-center gap-2 hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}
