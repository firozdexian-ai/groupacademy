/**
 * Shared sign-in / no-workspace gate used by every Gro10x page that needs
 * an authenticated user with an active company. Replaces ~6 copies of the
 * same JSX scattered across pages.
 */
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCompany } from "../hooks/useActiveCompany";
import { Gro10xLoading } from "./Gro10xLoading";

interface Props {
  children: ReactNode;
  /** Block until a company workspace is resolved. Default true. */
  requireCompany?: boolean;
  /** Custom CTA copy shown when the user is not signed in. */
  signInLabel?: string;
}

export function Gro10xPageGate({
  children,
  requireCompany = true,
  signInLabel = "Sign in to continue",
}: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const { companyId, isLoading: companyLoading } = useActiveCompany();
  const navigate = useNavigate();

  if (authLoading) return <Gro10xLoading />;

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-sm text-slate-400 mb-4">{signInLabel}</p>
        <button
          onClick={() => navigate("/gro10x/auth")}
          className="rounded-full bg-[#33E1E4] text-[#06121A] px-5 py-2 text-sm font-semibold"
        >
          Get started
        </button>
      </div>
    );
  }

  if (requireCompany && companyLoading) return <Gro10xLoading label="Loading workspace…" />;

  if (requireCompany && !companyId) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <Building2 className="h-10 w-10 mx-auto text-slate-500 mb-3" />
        <p className="text-sm text-slate-400 mb-4">
          You're not connected to a company workspace yet.
        </p>
        <button
          onClick={() => navigate("/gro10x/auth")}
          className="rounded-full bg-[#33E1E4] text-[#06121A] px-5 py-2 text-sm font-semibold"
        >
          Set up your workspace
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
