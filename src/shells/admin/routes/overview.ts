import React from "react";

export const ROUTES: Record<string, React.LazyExoticComponent<any>> = {
  overview: React.lazy(() =>
    import("@/domains/analytics/components/admin/overview/LifetimeOverviewTab").then((m) => ({ default: m.LifetimeOverviewTab })),
  ),
  "overview-lifetime": React.lazy(() =>
    import("@/domains/analytics/components/admin/overview/LifetimeOverviewTab").then((m) => ({ default: m.LifetimeOverviewTab })),
  ),
  "overview-month": React.lazy(() =>
    import("@/domains/analytics/components/admin/overview/PeriodOverviewTab").then((m) => ({
      default: () => {
        const C = m.PeriodOverviewTab;
        return React.createElement(C, { mode: "month" });
      },
    })),
  ),
  "overview-quarter": React.lazy(() =>
    import("@/domains/analytics/components/admin/overview/PeriodOverviewTab").then((m) => ({
      default: () => {
        const C = m.PeriodOverviewTab;
        return React.createElement(C, { mode: "quarter" });
      },
    })),
  ),
  "overview-analyst": React.lazy(() =>
    import("@/domains/analytics/components/admin/overview/AnalystChatTab").then((m) => ({ default: m.AnalystChatTab })),
  ),
  "overview-reports": React.lazy(() =>
    import("@/domains/analytics/components/admin/overview/ReportsBuilderTab").then((m) => ({ default: m.ReportsBuilderTab })),
  ),
  "signals-waitlist": React.lazy(() =>
    import("@/domains/analytics/components/admin/overview/DemandSignalsTab").then((m) => ({ default: m.DemandSignalsTab })),
  ),
};

export const TITLES: Record<string, string> = {
  overview: "Lifetime overview",
  "overview-lifetime": "Lifetime overview",
  "overview-month": "Monthly overview",
  "overview-quarter": "Quarterly overview",
  "overview-analyst": "Business analyst",
  "overview-reports": "Report builder",
  "signals-waitlist": "Demand signals",
};
