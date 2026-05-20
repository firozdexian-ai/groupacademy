export { workforceApi } from "./api/manifest";

export { default as HrOverviewTab, HrOverviewTab as HrOverviewTabNamed } from "./components/admin/HrOverviewTab";
export { default as HrOnboardingTab } from "./components/admin/HrOnboardingTab";
export { default as HrPayrollTab } from "./components/admin/HrPayrollTab";
export { default as HrTargetsTab } from "./components/admin/HrTargetsTab";
export { WorkforceManager } from "./components/admin/WorkforceTab";
export {
  HrVerticalsTab,
  HrFunctionsTab,
  HrTeamsTab,
  HrGradesTab,
} from "./components/admin/HrSimpleTabs";
export { useHrGraph } from "./components/admin/hooks/useHrGraph";
