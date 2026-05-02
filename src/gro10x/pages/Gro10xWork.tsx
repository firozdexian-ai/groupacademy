import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { GRO10X_MUTED } from "../lib/tokens";
import Gro10xJobsList from "./work/Gro10xJobsList";
import Gro10xShortlist from "./work/Gro10xShortlist";

type Tab = "jobs" | "shortlist";

/**
 * Gro10x Work hub — sub-tabs for the hire loop.
 * Jobs tab: company's job posts (active/draft) with applicant drawer.
 * Shortlist tab: revealed candidates saved across jobs.
 */
export default function Gro10xWork() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("jobs");

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-sm text-slate-400 mb-4">Sign in to manage your hiring.</p>
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
      <header className="sticky top-0 z-10 bg-[#0B1220]/95 backdrop-blur-md border-b border-white/5">
        <div className="px-4 pt-3 pb-2">
          <h1 className="text-xl font-semibold tracking-tight">Work</h1>
          <p className={`text-xs ${GRO10X_MUTED}`}>Your hiring pipeline</p>
        </div>
        <div className="px-4 pb-2 flex gap-2">
          <TabBtn active={tab === "jobs"} onClick={() => setTab("jobs")}>
            Jobs
          </TabBtn>
          <TabBtn active={tab === "shortlist"} onClick={() => setTab("shortlist")}>
            Shortlist
          </TabBtn>
        </div>
      </header>

      {tab === "jobs" ? <Gro10xJobsList /> : <Gro10xShortlist />}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-medium border transition ${
        active
          ? "bg-[#33E1E4] text-[#06121A] border-[#33E1E4]"
          : "bg-white/5 border-white/10 text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}
