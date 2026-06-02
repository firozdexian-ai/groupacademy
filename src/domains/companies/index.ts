// Companies domain — public surface.

// Hooks
export * from "./hooks/useCompaniesWithSignal";
export * from "./hooks/useCompanyDetail";
export * from "./hooks/useFollowedCompanies";

// Admin components
export * from "./components/admin/BatchCompanyUpload";
export * from "./components/admin/CompaniesOverviewTab";
export * from "./components/admin/CompaniesTab";
// CompanyAgentsTab intentionally not re-exported here — imported directly to avoid name collision with CompaniesTab.
export * from "./components/admin/ContactUnlocksTab";
export * from "./components/admin/ContactsTab";
export * from "./components/admin/EmployerMessagingChannelTab";
export * from "./components/admin/IndustriesTab";

// API (Phase 9h — barrel re-exports)
export { signupCompany, checkCompanyAccount } from "./api/manifest";
