// IR (Investor Relations) domain — public surface.

// Admin
export * from "./components/admin/EmailComposer";
export * from "./components/admin/IRDashboard";
export * from "./components/admin/IRPipelineBoard";
export * from "./components/admin/InteractionLogger";
export * from "./components/admin/InvestorDetailSheet";
export * from "./components/admin/InvestorsManager";
export * from "./components/admin/KeyInfluencersTab";
export * from "./components/admin/MRRTargetManager";
export * from "./components/admin/VCFirmsManager";

// Dataroom
export * from "./components/admin/dataroom/DataRoomManager";
export * from "./components/admin/dataroom/DocumentTelemetryDrawer";
export * from "./components/admin/dataroom/ShareLinkDialog";
export * from "./components/admin/dataroom/UploadDocumentDialog";

// Economics
export * from "./components/admin/economics/CohortRetentionCard";
export * from "./components/admin/economics/HitLCogsCard";
export * from "./components/admin/economics/MetricEntrySheet";
export * from "./components/admin/economics/RetentionCard";
export * from "./components/admin/economics/RevPerEmployeeCard";
export * from "./components/admin/economics/UnitEconomics";

// Pipeline
export * from "./components/admin/pipeline/PipelineCard";
export * from "./components/admin/pipeline/PipelineColumn";

// Hooks
export * from "./components/admin/hooks/useDataRoom";
export * from "./components/admin/hooks/useIRPipeline";

// API
export { irApi } from "./api/manifest";
export type { IrApi } from "./api/manifest";
