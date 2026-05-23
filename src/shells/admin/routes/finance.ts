import React from "react";

export const ROUTES: Record<string, React.LazyExoticComponent<any>> = {
  "finops-overview": React.lazy(() => import("@/domains/finance/components/admin/FinOverviewTab").then((m: any) => ({ default: m.FinOverviewTab ?? m.default }))),
  "finops-talent-credits": React.lazy(() => import("@/domains/finance/components/admin/TalentCreditsTab").then((m: any) => ({ default: m.TalentCreditsTab ?? m.default }))),
  "finops-gro10x-credits": React.lazy(() => import("@/domains/finance/components/admin/Gro10xCreditsTab").then((m: any) => ({ default: m.Gro10xCreditsTab ?? m.default }))),
  "finops-company-credits": React.lazy(() => import("@/domains/finance/components/admin/CompanyCreditsTab").then((m: any) => ({ default: m.CompanyCreditsTab ?? m.default }))),
  "finops-transactions": React.lazy(() => import("@/domains/finance/components/admin/TransactionsTab").then((m: any) => ({ default: m.TransactionsTab ?? m.default }))),
  "finops-pay-infra": React.lazy(() => import("@/domains/finance/components/admin/PaymentInfraTab").then((m: any) => ({ default: m.PaymentInfraTab ?? m.default }))),
  "finops-invoices": React.lazy(() => import("@/domains/finance/components/admin/InvoicesTab").then((m: any) => ({ default: m.InvoicesTab ?? m.default }))),
  "finops-withdrawals": React.lazy(() => import("@/domains/finance/components/admin/WithdrawalsTab").then((m: any) => ({ default: m.WithdrawalsTab ?? m.default }))),
};

export const TITLES: Record<string, string> = {
  "finops-overview": "Finance overview",
  "finops-talent-credits": "Talent credits",
  "finops-gro10x-credits": "Gro10x credits",
  "finops-company-credits": "Company credits",
  "finops-transactions": "Transactions",
  "finops-pay-infra": "Payment settings",
  "finops-invoices": "Invoices",
  "finops-withdrawals": "Withdrawals",
};
