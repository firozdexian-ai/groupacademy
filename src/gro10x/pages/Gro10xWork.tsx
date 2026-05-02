import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { GRO10X_MUTED } from "../lib/tokens";
import Gro10xJobsList from "./work/Gro10xJobsList";
import Gro10xShortlist from "./work/Gro10xShortlist";
import Gro10xTalents from "./work/Gro10xTalents";
import Gro10xCRM from "./Gro10xCRM";

type Tab = "hiring" | "talents" | "crm";

/**
 * Gro10x Activities hub — three tabs covering hiring, talents the company
 * has interacted with, and the lightweight B2B CRM.
 */
export default function Gro10xWork() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("hiring");

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-sm text-slate-400 mb-4">Sign in to manage your activities.</p>
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
          <h1 className="text-xl font-semibold tracking-tight">Activities</h1>
          <p className={`text-xs ${GRO10X_MUTED}`}>Hiring, talents and pipeline</p>
        </div>
        <div className="px-4 pb-2 flex gap-2 items-center overflow-x-auto">
          <TabBtn active={tab === "hiring"}   onClick={() => setTab("hiring")}>Hiring</TabBtn>
          <TabBtn active={tab === "talents"}  onClick={() => setTab("talents")}>Talents</TabBtn>
          <TabBtn active={tab === "crm"}      onClick={() => setTab("crm")}>CRM</TabBtn>
        </div>
      </header>

      {tab === "hiring" && (
        <>
          <Gro10xJobsList />
          <div className="px-4 pt-4">
            <p className={`text-[11px] uppercase tracking-wider ${GRO10X_MUTED} mb-2`}>Shortlist</p>
            <Gro10xShortlist />
          </div>
        </>
      )}
      {tab === "talents" && <Gro10xTalents />}
      {tab === "crm" && <Gro10xCRM />}
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
      className={`px-4 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap ${
        active
          ? "bg-[#33E1E4] text-[#06121A] border-[#33E1E4]"
          : "bg-white/5 border-white/10 text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}
