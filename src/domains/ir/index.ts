/**
 * IR (Investor Relations) Domain: Public Interface Surface
 * Deep imports remain valid; this barrel exposes the admin shell-routed entries,
 * hooks, and API manifest. Internal helpers (PipelineCard, MetricEntrySheet, etc.)
 * are consumed via deep imports inside the domain and are intentionally not re-exported.
 */
export { IRDashboard } from "./components/admin/IRDashboard";
export { MRRTargetManager } from "./components/admin/MRRTargetManager";
export { VCFirmsManager } from "./components/admin/VCFirmsManager";
export { InvestorsManager } from "./components/admin/InvestorsManager";
export { IRPipelineBoard } from "./components/admin/IRPipelineBoard";
export { EmailComposer } from "./components/admin/EmailComposer";
export { DataRoomManager } from "./components/admin/dataroom/DataRoomManager";
export { UnitEconomics } from "./components/admin/economics/UnitEconomics";
export { default as KeyInfluencersTab } from "./components/admin/KeyInfluencersTab";

export * from "./components/admin/hooks/useDataRoom";
export * from "./components/admin/hooks/useIRPipeline";

export { irApi } from "./api/manifest";
export type { IrApi } from "./api/manifest";
