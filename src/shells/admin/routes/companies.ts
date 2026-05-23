import React from "react";

export const ROUTES: Record<string, React.LazyExoticComponent<any>> = {
  companies: React.lazy(() =>
    import("@/domains/companies/components/admin/CompaniesTab").then((m: any) => ({ default: m.CompaniesTab ?? m.CompaniesManager ?? m.default })),
  ),
  contacts: React.lazy(() =>
    import("@/domains/companies/components/admin/ContactsTab").then((m: any) => ({ default: m.ContactsTab ?? m.ContactsManager ?? m.default })),
  ),
  "company-agents": React.lazy(() =>
    import("@/domains/companies/components/admin/CompanyAgentsTab").then((m: any) => ({ default: m.CompanyAgentsTab ?? m.CompanyAgentsManager ?? m.default })),
  ),
  industries: React.lazy(() =>
    import("@/domains/companies/components/admin/IndustriesTab").then((m: any) => ({ default: m.IndustriesTab ?? m.IndustriesManager ?? m.default })),
  ),
  "companies-overview": React.lazy(() =>
    import("@/domains/companies/components/admin/CompaniesOverviewTab").then((m) => ({ default: m.CompaniesOverviewTab })),
  ),
  "companies-unlocks": React.lazy(() =>
    import("@/domains/companies/components/admin/ContactUnlocksTab").then((m) => ({ default: m.ContactUnlocksTab })),
  ),
  "companies-wa-channel": React.lazy(() =>
    import("@/domains/companies/components/admin/EmployerMessagingChannelTab").then((m) => ({ default: m.EmployerMessagingChannelTab })),
  ),
};

export const TITLES: Record<string, string> = {
  companies: "Employer CRM",
  contacts: "B2B contacts",
  "company-agents": "Account managers",
  industries: "Industries",
  "companies-overview": "Companies overview",
  "companies-unlocks": "Contact unlocks",
  "companies-wa-channel": "Employer WhatsApp line",
};
