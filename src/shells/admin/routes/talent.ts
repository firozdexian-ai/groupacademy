import React from "react";

export const ROUTES: Record<string, React.LazyExoticComponent<any>> = {
  "crm-overview": React.lazy(() => import("@/domains/talent/components/admin/TalentOverviewTab").then((m: any) => ({ default: m.TalentOverviewTab ?? m.default }))),
  "crm-talent-pool": React.lazy(() => import("@/domains/talent/components/admin/TalentPoolTab").then((m: any) => ({ default: m.TalentPoolTab ?? m.TalentPoolManager ?? m.default }))),
  "crm-professions": React.lazy(() => import("@/domains/talent/components/admin/ProfessionsTab").then((m: any) => ({ default: m.ProfessionsTab ?? m.ProfessionsManager ?? m.default }))),
  "crm-upload": React.lazy(() => import("@/domains/talent/components/admin/TalentUploadTab").then((m: any) => ({ default: m.TalentUploadTab ?? m.default }))),
  "crm-outreach": React.lazy(() => import("@/domains/talent/components/admin/TalentOutreachConsoleTab").then((m: any) => ({ default: m.TalentOutreachConsoleTab ?? m.default }))),
  "crm-wa-channel": React.lazy(() => import("@/domains/talent/components/admin/TalentMessagingChannelTab").then((m: any) => ({ default: m.TalentMessagingChannelTab ?? m.default }))),
  "crm-creator-economy": React.lazy(() => import("@/domains/talent/components/admin/CreatorEconomyTab").then((m: any) => ({ default: m.CreatorEconomyTab ?? m.default }))),
  "crm-notifications": React.lazy(() => import("@/domains/talent/components/admin/NotificationsTab").then((m: any) => ({ default: m.NotificationsTab ?? m.NotificationsManager ?? m.default }))),
  "crm-support-ai": React.lazy(() => import("@/domains/talent/components/admin/SupportAITab").then((m: any) => ({ default: m.SupportAITab ?? m.SupportAssistant ?? m.default }))),
  portfolios: React.lazy(() => import("@/domains/talent/components/admin/PortfolioRequestsTab").then((m: any) => ({ default: m.PortfolioRequestsTab ?? m.default ?? m.PortfolioRequestsManager }))),
};

export const TITLES: Record<string, string> = {
  "crm-overview": "CRM Overview",
  "crm-talent-pool": "Talent Pool",
  "crm-professions": "Professions & Roles",
  "crm-upload": "Talent Upload",
  "crm-outreach": "Outreach Log",
  "crm-wa-channel": "WhatsApp Line",
  "crm-creator-economy": "Creator Economy",
  "crm-notifications": "Notifications",
  "crm-support-ai": "Support AI",
  portfolios: "Creative Assets",
};
