/**
 * GTM Domain: Public Interface Surface
 * Deep imports remain valid; this barrel exposes the common admin shell entries.
 */
export { default as GtmKnowledgeTab } from "./components/admin/GtmKnowledgeTab";
export { default as GtmOverviewTab } from "./components/admin/GtmOverviewTab";
export { GtmCountriesTab, GtmStatesTab, GtmCitiesTab, GtmClustersTab } from "./components/admin/GtmTabs";
export * from "./components/admin/hooks/useGtmGraph";
export { gtmApi } from "./api/manifest";
