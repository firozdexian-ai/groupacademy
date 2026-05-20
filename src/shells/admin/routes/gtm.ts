import React from "react";

export const ROUTES: Record<string, React.LazyExoticComponent<any>> = {
  "gtm-overview": React.lazy(() => import("@/domains/gtm/components/admin/GtmOverviewTab").then((m) => ({ default: m.GtmOverviewTab }))),
  "gtm-countries": React.lazy(() => import("@/domains/gtm/components/admin/GtmTabs").then((m) => ({ default: m.GtmCountriesTab }))),
  "gtm-states": React.lazy(() => import("@/domains/gtm/components/admin/GtmTabs").then((m) => ({ default: m.GtmStatesTab }))),
  "gtm-cities": React.lazy(() => import("@/domains/gtm/components/admin/GtmTabs").then((m) => ({ default: m.GtmCitiesTab }))),
  "gtm-clusters": React.lazy(() => import("@/domains/gtm/components/admin/GtmTabs").then((m) => ({ default: m.GtmClustersTab }))),
  "gtm-knowledge": React.lazy(() => import("@/domains/gtm/components/admin/GtmKnowledgeTab").then((m) => ({ default: m.GtmKnowledgeTab }))),
};

export const TITLES: Record<string, string> = {
  "gtm-overview": "GTM (Geography)",
  "gtm-countries": "Countries",
  "gtm-states": "States / Regions",
  "gtm-cities": "Cities",
  "gtm-clusters": "Clusters",
  "gtm-knowledge": "Knowledge Packs",
};
