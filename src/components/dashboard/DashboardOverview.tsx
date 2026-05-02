/**
 * Admin Overview — legacy `?tab=overview` entry point.
 * The sidebar now routes directly to each sub-view (overview-lifetime,
 * overview-month, overview-quarter, overview-analyst, overview-reports),
 * so this component just renders the Lifetime view as a sensible default.
 */
import { LifetimeOverviewTab } from "@/components/dashboard/overview/LifetimeOverviewTab";

export function DashboardOverview() {
  return <LifetimeOverviewTab />;
}
