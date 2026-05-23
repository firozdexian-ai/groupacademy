import React from "react";

export const ROUTES: Record<string, React.LazyExoticComponent<any>> = {
  institutions: React.lazy(() =>
    import("@/domains/institutions/components/admin/StakeholderRegistry").then((m) => ({ default: m.InstitutionsManager })),
  ),
  "partner-orgs": React.lazy(() =>
    import("@/domains/institutions/components/admin/StakeholderRegistry").then((m) => ({ default: m.PartnerOrgsManager })),
  ),
  "inst-overview": React.lazy(() => import("@/domains/institutions/components/admin/InstitutionsOverviewTab")),
  "inst-types": React.lazy(() => import("@/domains/institutions/components/admin/InstitutionTypesManager")),
  "inst-clubs": React.lazy(() =>
    import("@/domains/institutions/components/admin/InstitutionChildRegistry").then((m) => ({ default: m.ClubsManager })),
  ),
  "inst-reps": React.lazy(() =>
    import("@/domains/institutions/components/admin/InstitutionChildRegistry").then((m) => ({ default: m.RepresentativesManager })),
  ),
  "inst-events": React.lazy(() =>
    import("@/domains/institutions/components/admin/InstitutionChildRegistry").then((m) => ({ default: m.OrgEventsManager })),
  ),
};

export const TITLES: Record<string, string> = {
  institutions: "Institutions",
  "partner-orgs": "Partner organizations",
  "inst-overview": "Institutions overview",
  "inst-types": "Institution types",
  "inst-clubs": "Clubs & departments",
  "inst-reps": "Representatives",
  "inst-events": "Events & competitions",
};
