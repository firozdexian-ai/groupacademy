import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { GRO10X_PANEL, GRO10X_MUTED } from "../lib/tokens";
import { LogOut, FileText } from "lucide-react";

interface TalentRow {
  full_name: string;
  email: string;
  cv_url: string | null;
  custom_profession: string | null;
  profile_photo_url: string | null;
}
interface CompanyRow {
  id: string;
  name: string;
  slug: string | null;
}

export default function Gro10xMe() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [talent, setTalent] = useState<TalentRow | null>(null);
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data: t } = await supabase
        .from("talents")
        .select("full_name,email,cv_url,custom_profession,profile_photo_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setTalent(t as TalentRow | null);

      const { data: m } = await supabase
        .from("company_members")
        .select("role, companies:company_id (id, name, slug)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (m) {
        setRole(m.role as string);
        setCompany((m as any).companies as CompanyRow);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
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
    <div className="max-w-md mx-auto">
      <header className="px-4 pt-6 pb-3">
        <h1 className="text-xl font-semibold tracking-tight">Me</h1>
      </header>

      <section className={`mx-4 ${GRO10X_PANEL} border border-white/10 rounded-2xl p-4`}>
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-[#0B1220] border border-white/10 grid place-items-center text-xl font-semibold">
            {talent?.profile_photo_url ? (
              <img src={talent.profile_photo_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              (talent?.full_name || user.email || "?").charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{talent?.full_name || "Add your name"}</p>
            <p className={`text-sm ${GRO10X_MUTED} truncate`}>
              {talent?.custom_profession || "Add your role"}
              {company ? ` · ${company.name}` : ""}
            </p>
            {role && (
              <p className="text-[11px] text-slate-500 capitalize mt-0.5">{role} · workspace</p>
            )}
          </div>
        </div>
      </section>

      {talent?.cv_url && (
        <a
          href={talent.cv_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`mx-4 mt-3 ${GRO10X_PANEL} border border-white/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5`}
        >
          <FileText className="h-5 w-5 text-[#33E1E4]" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Your CV</p>
            <p className="text-[11px] text-slate-400 truncate">Used by Riya to set up your account</p>
          </div>
        </a>
      )}

      <button
        onClick={() => signOut()}
        className="mx-4 mt-6 mb-10 w-[calc(100%-2rem)] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm flex items-center justify-center gap-2 hover:bg-white/10"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}
