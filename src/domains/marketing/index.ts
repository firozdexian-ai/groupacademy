// Marketing domain — public surface.

// Admin tabs
export * from "./components/admin/AccessCodesTab";
export * from "./components/admin/AdminsRepsTab";
export * from "./components/admin/BannersTab";
export * from "./components/admin/CommunityMessagingChannelTab";
export * from "./components/admin/ContentOutreachTab";
export * from "./components/admin/LeadsActivitiesTab";
export * from "./components/admin/MarketingAnalyticsTab";
export * from "./components/admin/MktSimpleTabs";
export * from "./components/admin/ServiceOutreachTab";
export * from "./components/admin/StandaloneMockInterviewCodeGenerator";
export * from "./components/admin/StandaloneSalaryCodeGenerator";
export * from "./components/admin/TalentOutreachTab";
export * from "./components/admin/ThemesTab";

// Admin leads
export * from "./components/admin/leads/LeadHunterManager";
export * from "./components/admin/leads/MockInterviewCodeGenerator";
export * from "./components/admin/leads/MockInterviewLeadsManager";
export * from "./components/admin/leads/SalaryAnalysisCodeGenerator";
export * from "./components/admin/leads/SalaryAnalysisLeadsManager";

// Hooks
export * from "./components/admin/hooks/useMarketingGraph";

// API
export { marketingApi } from "./api/manifest";
export type { MarketingApi } from "./api/manifest";
