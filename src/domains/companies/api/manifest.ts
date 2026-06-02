/**
 * Companies domain API manifest (Phase 9h / 10f).
 *
 * Re-export barrel for the typed edge function wrappers and Postgres repository layer.
 * This file serves as the single sanctioned ingress endpoint for all application shells 
 * interacting with the Companies domain.
 *
 * Core Behavioral Matrix:
 * - Employer Interactions: Enforces Human-in-the-loop validation gates.
 * - Talent Interactions: Prioritizes automated matching efficiency.
 * - Error Control: Intercepts raw ledger failures and logs clean anomalies to the Admin Swarm.
 */

// Edge Function Runtime Contracts (Type-Safe RPC/API Shells)
export { 
  signupCompany, 
  checkCompanyAccount,
  generateCompanyOutreach,
  executeCompanyAgentTools
} from "./companiesApi";

// Database Repository Operations (Sanctioned Supabase Client Actions)
export {
  listCompaniesPaged,
  listCompaniesNameSorted,
  listCompaniesForAgentPicker,
  upsertCompany,
  insertCompany,
  deleteCompany,
  listAllCompanyNames,
  listCompaniesByIds,
  countCompaniesWithNullIndustry,
  renameCompanyIndustry,
  listContactsPaged,
  upsertContact,
  insertContact,
  listAllContactIdentifiers,
  listLatestOutreachForCompanies,
  logContactOutreach,
  listCompanyAgentsFull,
  listCompanyAgentLeads,
  insertAiAgent,
  insertCompanyAgent,
  updateAiAgentActive,
  updateCompanyAgentActive,
  deleteAiAgent,
  deleteCompanyAgentById,
  listRecentContactUnlocks,
  listTalentEmailsByUserIds,
  listFollowedCompanyNames,
  followCompany,
  unfollowCompany,
  getActiveCompanyMembership,
  getActiveAdminCompanyMembership,
  getActiveCompanyMembershipWithName,
  listPendingCompanyPostDrafts,
  listCompanyLeads,
  insertCompanyLead,
  updateCompanyLead,
  listCompanyLeadActivities,
  insertCompanyLeadActivity,
  listCompanyOfferings,
  upsertCompanyOffering,
  deleteCompanyOffering,
  listAllCompaniesWithSlug,
  getActiveCompanyIdForUser,
  getCompanyGoals,
  getCompanyCreditPools,
  listCompanyCreditTransactionsSince,
  getCompanyMemberRole,
  getCompanyPublicProfile,
  listActiveCompanyMembers,
  updateCompanyField,
  getCompanyPublicProfileBySlug,
  listActiveCompanyMemberUserIds,
  listCompanyShortlistsRecent,
  getCompanyNameAndLogo,
  getActiveMembershipWithCompanyName,
  getCompaniesOverview,
  getIndustryRollup,
  mergeIndustries,
  getContactUnlocksSummary,
  getCompanyDetail,
  getCompaniesWithSignal
} from "../repo/companiesRepo";

// Re-export explicit structural layout types for state management hydration
export type {
  CompanyRow,
  ContactRow,
  ListCompaniesPagedParams,
  ListContactsPagedParams,
  CompanyCreditTxnRow,
  ContactUnlocksSummary,
} from "../repo/companiesRepo";

export type {
  CompanyOutreachRequest,
  CompanyAgentToolsRequest,
} from "./companiesApi";