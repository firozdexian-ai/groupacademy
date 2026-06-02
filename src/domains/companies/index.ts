/**
 * Companies Domain Workspace Entry Point (Public Surface)
 * Version: Launch Candidate · Phase Z0 Hardened (Code Freeze)
 * Infrastructure: Digital Workforce Connected Summary Map
 * 
 * Hard Architectural Note: 
 * 'CompanyAgentsTab' is intentionally omitted from this public barrel to prevent 
 * explicit naming collisions with 'CompaniesTab' across structural admin dashboards. 
 * Import 'CompanyAgentsTab' directly from its component path when mounting.
 */

// Core Hooks (B2B Activity Signals & Deep Profile Sensors)
export * from "./hooks/useCompaniesWithSignal";
export * from "./hooks/useCompanyDetail";
export * from "./hooks/useFollowedCompanies";

// Corporate Administrative Control Surfaces
export * from "./components/admin/BatchCompanyUpload";
export * from "./components/admin/CompaniesOverviewTab";
export * from "./components/admin/CompaniesTab";
export * from "./components/admin/ContactUnlocksTab";
export * from "./components/admin/ContactsTab";
export * from "./components/admin/EmployerMessagingChannelTab";
export * from "./components/admin/IndustriesTab";

// Platform API Ingress (Phase 9h Hardened Contract - Zod & Edge Verified)
export { signupCompany, checkCompanyAccount } from "./api/manifest";