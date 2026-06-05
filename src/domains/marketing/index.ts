/**
 * Marketing domain barrel.
 * Exposes the admin tab surface, leads sub-area, the marketing graph hook,
 * and the typed API manifest. Repo helpers are imported directly via
 * `@/domains/marketing/repo/marketingRepo` from external consumers.
 */

// Admin tabs
export { AccessCodesTab } from "./components/admin/AccessCodesTab";
export { default as AdminsRepsTab } from "./components/admin/AdminsRepsTab";
export { BannersTab } from "./components/admin/BannersTab";
export { CommunityMessagingChannelTab } from "./components/admin/CommunityMessagingChannelTab";
export { ContentOutreachTab } from "./components/admin/ContentOutreachTab";
export { LeadsActivitiesTab } from "./components/admin/LeadsActivitiesTab";
export { MarketingAnalyticsTab } from "./components/admin/MarketingAnalyticsTab";
export { ChannelsTab, CommunityGroupsTab, CommunityTab } from "./components/admin/MktSimpleTabs";
export { ServiceOutreachTab } from "./components/admin/ServiceOutreachTab";
export { StandaloneMockInterviewCodeGenerator } from "./components/admin/StandaloneMockInterviewCodeGenerator";
export { StandaloneSalaryCodeGenerator } from "./components/admin/StandaloneSalaryCodeGenerator";
export { TalentOutreachTab } from "./components/admin/TalentOutreachTab";
export { ThemesTab } from "./components/admin/ThemesTab";

// Admin leads
export { LeadHunterManager } from "./components/admin/leads/LeadHunterManager";
export { MockInterviewCodeGenerator } from "./components/admin/leads/MockInterviewCodeGenerator";
export { MockInterviewLeadsManager } from "./components/admin/leads/MockInterviewLeadsManager";
export { SalaryAnalysisCodeGenerator } from "./components/admin/leads/SalaryAnalysisCodeGenerator";
export { SalaryAnalysisLeadsManager } from "./components/admin/leads/SalaryAnalysisLeadsManager";

// Hooks
export { useMarketingGraph } from "./components/admin/hooks/useMarketingGraph";

// API
export { leadHuntMatch } from "./api/manifest";
export type { LeadHuntMatchRequest, LeadHuntMatchResponse } from "./api/manifest";
