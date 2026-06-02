import React from "react";

/**
 * Companies Domain Routing Registry — Phase Z0 Hardened
 * Centralized lazy-load mapping configurations for Group 2 tabs.
 * Standardized for professional 2024 SAAS UI performance targets.
 */

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
    import("@/domains/companies/components/admin/CompaniesOverviewTab").then((m: any) => ({ default: m.CompaniesOverviewTab })),
  ),
  "companies-unlocks": React.lazy(() =>
    import("@/domains/companies/components/admin/ContactUnlocksTab").then((m: any) => ({ default: m.ContactUnlocksTab })),
  ),
  "companies-wa-channel": React.lazy(() =>
    import("@/domains/companies/components/admin/EmployerMessagingChannelTab").then((m: any) => ({ default: m.EmployerMessagingChannelTab })),
  ),
};

export const TITLES: Record<string, string> = {
  companies: "Employer CRM",
  contacts: "B2B Contacts",
  "company-agents": "Account Managers",
  industries: "Industries",
  "companies-overview": "Companies Overview",
  "companies-unlocks": "Contact Unlocks",
  "companies-wa-channel": "Employer WhatsApp Line",
  "companies-outreach": "B2B Outreach Console", // Added business-centric outreach title
};