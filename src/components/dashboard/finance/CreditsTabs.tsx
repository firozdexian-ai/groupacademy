import { Card } from "@/components/ui/card";

const Stub = ({ title, blurb }: { title: string; blurb: string }) => (
  <Card className="p-6">
    <h2 className="text-xl font-semibold">{title}</h2>
    <p className="text-sm text-muted-foreground mt-1">{blurb}</p>
  </Card>
);

export const TalentCreditsTab = () => (
  <Stub
    title="Talent Credits Management"
    blurb="Issue, refund and audit talent-side credits. Uses the shared Credits Manager filtered by wallet=talent."
  />
);

export const Gro10xCreditsTab = () => (
  <Stub
    title="Gro10x Credit Management"
    blurb="Manage Gro10x B2B workspace credits — top-ups, agent runs, contact unlocks."
  />
);

export const CompanyCreditsTab = () => (
  <Stub
    title="Company Credit Management"
    blurb="Recruiter / employer credits used for job posts and contact reveals."
  />
);

export const TransactionsTab = () => (
  <Stub
    title="Transactions"
    blurb="Unified ledger of every credit movement and gateway settlement."
  />
);

export const InvoicesPaymentsTab = () => (
  <Stub
    title="Invoices & Payments"
    blurb="Invoice history and gateway reconciliation."
  />
);
