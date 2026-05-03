import { Card } from "@/components/ui/card";
export default function AdminsRepsTab() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold">Admins & Reps</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Field reps and city admins who run community outreach. Reuses the
        Workforce roster filtered by <code>role = 'rep'</code> or{" "}
        <code>'community_admin'</code>.
      </p>
    </Card>
  );
}
