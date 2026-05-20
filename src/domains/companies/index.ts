// Companies domain — public surface.

// Hooks
export * from "./hooks/useCompaniesWithSignal";
export * from "./hooks/useCompanyDetail";
export * from "./hooks/useFollowedCompanies";

// Admin components
export * from "./components/admin/BatchCompanyUpload";
export * from "./components/admin/CompaniesOverviewTab";
export * from "./components/admin/CompaniesTab";
export * from "./components/admin/CompanyAgentsTab";
export * from "./components/admin/ContactUnlocksTab";
export * from "./components/admin/ContactsTab";
export * from "./components/admin/EmployerMessagingChannelTab";
export * from "./components/admin/IndustriesTab";

// API
export { companiesApi } from "./api/manifest";
export type { CompaniesApi } from "./api/manifest";
