import React from "react";

export const ROUTES: Record<string, React.LazyExoticComponent<any>> = {
  "hr-workforce": React.lazy(() => import("@/domains/workforce/components/admin/WorkforceTab").then((m) => ({ default: m.WorkforceManager }))),
  "hr-overview": React.lazy(() => import("@/domains/workforce/components/admin/HrOverviewTab")),
  "hr-grades": React.lazy(() => import("@/domains/workforce/components/admin/HrSimpleTabs").then((m) => ({ default: m.HrGradesTab }))),
  "hr-verticals": React.lazy(() => import("@/domains/workforce/components/admin/HrSimpleTabs").then((m) => ({ default: m.HrVerticalsTab }))),
  "hr-functions": React.lazy(() => import("@/domains/workforce/components/admin/HrSimpleTabs").then((m) => ({ default: m.HrFunctionsTab }))),
  "hr-teams": React.lazy(() => import("@/domains/workforce/components/admin/HrSimpleTabs").then((m) => ({ default: m.HrTeamsTab }))),
  "hr-targets": React.lazy(() => import("@/domains/workforce/components/admin/HrTargetsTab").then((m) => ({ default: m.HrTargetsTab }))),
  "hr-onboarding": React.lazy(() => import("@/domains/workforce/components/admin/HrOnboardingTab").then((m) => ({ default: m.HrOnboardingTab }))),
  "hr-payroll": React.lazy(() => import("@/domains/workforce/components/admin/HrPayrollTab").then((m) => ({ default: m.HrPayrollTab }))),
};

export const TITLES: Record<string, string> = {
  workforce: "Workforce",
  team: "Human Capital",
  "hr-workforce": "Workforce",
  "hr-overview": "Team & Workforce",
  "hr-grades": "Grades & Levels",
  "hr-verticals": "Verticals",
  "hr-functions": "Functions",
  "hr-teams": "Teams",
  "hr-targets": "Targets & Incentives",
  "hr-onboarding": "Onboarding",
  "hr-payroll": "Rewards & Payroll",
};
