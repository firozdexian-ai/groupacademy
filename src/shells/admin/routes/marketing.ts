import React from "react";

export const ROUTES: Record<string, React.LazyExoticComponent<any>> = {
  interviews: React.lazy(() =>
    import("@/domains/marketing/components/admin/leads/MockInterviewLeadsManager").then((m) => ({ default: m.MockInterviewLeadsManager })),
  ),
  salary: React.lazy(() =>
    import("@/domains/marketing/components/admin/leads/SalaryAnalysisLeadsManager").then((m) => ({ default: m.SalaryAnalysisLeadsManager })),
  ),
  "marketing-analytics": React.lazy(() => import("@/domains/marketing/components/admin/MarketingAnalyticsTab").then(m => ({ default: (m as any).MarketingAnalyticsTab ?? (m as any).default }))),
  "marketing-channels": React.lazy(() => import("@/domains/marketing/components/admin/MktSimpleTabs").then(m => ({ default: (m as any).ChannelsTab ?? (m as any).default }))),
  "marketing-community-wa": React.lazy(() => import("@/domains/marketing/components/admin/CommunityMessagingChannelTab").then(m => ({ default: (m as any).CommunityMessagingChannelTab ?? (m as any).default }))),
  "marketing-community-groups": React.lazy(() => import("@/domains/marketing/components/admin/MktSimpleTabs").then(m => ({ default: (m as any).CommunityGroupsTab ?? (m as any).default }))),
  "marketing-admins-reps": React.lazy(() => import("@/domains/marketing/components/admin/AdminsRepsTab").then(m => ({ default: (m as any).AdminsRepsTab ?? (m as any).default }))),
  "marketing-talent-outreach": React.lazy(() => import("@/domains/marketing/components/admin/TalentOutreachTab").then(m => ({ default: (m as any).TalentOutreachTab ?? (m as any).default }))),
  "marketing-content-outreach": React.lazy(() => import("@/domains/marketing/components/admin/ContentOutreachTab").then(m => ({ default: (m as any).ContentOutreachTab ?? (m as any).default }))),
  "marketing-service-outreach": React.lazy(() => import("@/domains/marketing/components/admin/ServiceOutreachTab").then(m => ({ default: (m as any).ServiceOutreachTab ?? (m as any).default }))),
  "marketing-leads": React.lazy(() => import("@/domains/marketing/components/admin/LeadsActivitiesTab").then(m => ({ default: (m as any).LeadsActivitiesTab ?? (m as any).default }))),
  "marketing-banners": React.lazy(() => import("@/domains/marketing/components/admin/BannersTab").then(m => ({ default: (m as any).BannersTab ?? (m as any).default }))),
  "marketing-themes": React.lazy(() => import("@/domains/marketing/components/admin/ThemesTab").then(m => ({ default: (m as any).ThemesTab ?? (m as any).default }))),
  "marketing-access-codes": React.lazy(() => import("@/domains/marketing/components/admin/AccessCodesTab").then(m => ({ default: (m as any).AccessCodesTab ?? (m as any).default }))),
};

export const TITLES: Record<string, string> = {
  interviews: "Mock Calibration",
  salary: "Market Valuation",
  "marketing-analytics": "Conversion Intel",
  "marketing-channels": "Marketing Channels",
  "marketing-community-wa": "Community WhatsApp Line",
  "marketing-community-groups": "Community Groups",
  "marketing-admins-reps": "Admins & Reps",
  "marketing-talent-outreach": "Talent Outreach (CV Intelligence)",
  "marketing-content-outreach": "Content Outreach",
  "marketing-service-outreach": "Service Outreach",
  "marketing-leads": "Leads & Activities",
  "marketing-banners": "Banners",
  "marketing-themes": "Profile Card Themes",
  "marketing-access-codes": "Access Codes",
};
