import React from "react";

export const ROUTES: Record<string, React.LazyExoticComponent<any>> = {
  "ir-dashboard": React.lazy(() => import("@/domains/ir/components/admin/IRDashboard").then((m) => ({ default: m.IRDashboard }))),
  "ir-targets": React.lazy(() => import("@/domains/ir/components/admin/MRRTargetManager").then((m) => ({ default: m.MRRTargetManager }))),
  "ir-vcs": React.lazy(() => import("@/domains/ir/components/admin/VCFirmsManager").then((m) => ({ default: m.VCFirmsManager }))),
  "ir-investors": React.lazy(() => import("@/domains/ir/components/admin/InvestorsManager").then((m) => ({ default: m.InvestorsManager }))),
  "ir-pipeline": React.lazy(() => import("@/domains/ir/components/admin/IRPipelineBoard").then((m) => ({ default: m.IRPipelineBoard }))),
  "ir-emails": React.lazy(() => import("@/domains/ir/components/admin/EmailComposer").then((m) => ({ default: m.EmailComposer }))),
  "ir-dataroom": React.lazy(() => import("@/domains/ir/components/admin/dataroom/DataRoomManager").then((m) => ({ default: m.DataRoomManager }))),
  "ir-economics": React.lazy(() => import("@/domains/ir/components/admin/economics/UnitEconomics").then((m) => ({ default: m.UnitEconomics }))),
  "ir-influencers": React.lazy(() => import("@/domains/ir/components/admin/KeyInfluencersTab")),
};

export const TITLES: Record<string, string> = {
  "ir-dashboard": "Investor Nexus",
  "ir-targets": "MRR Projections",
  "ir-vcs": "VC Portfolio",
  "ir-investors": "Shareholders",
  "ir-pipeline": "Investor Pipeline",
  "ir-emails": "Executive Updates",
  "ir-dataroom": "Data Room",
  "ir-economics": "Unit Economics",
  "ir-influencers": "Key Influencers",
};
