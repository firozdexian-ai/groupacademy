import { Card } from "@/components/ui/card";
export default function GigWorkersWalletTab() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold">Gig Workers & Wallet</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Earner directory plus their wallet balances and payout requests.
        Aggregates <code>talents</code>, <code>credits_ledger</code> and{" "}
        <code>withdrawals</code>.
      </p>
    </Card>
  );
}
