import { Card } from "@/components/ui/card";

export function TransactionsTab() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold">Transactions</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Unified ledger of every credit movement and gateway settlement. Coming in Phase 6.
      </p>
    </Card>
  );
}

export default TransactionsTab;
