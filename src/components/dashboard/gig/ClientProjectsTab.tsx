import { Card } from "@/components/ui/card";
export default function ClientProjectsTab() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold">Client Projects</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Real client briefs posted to the marketplace. Reuses the Marketplace
        Gigs queue with <code>source = 'client'</code>.
      </p>
    </Card>
  );
}
