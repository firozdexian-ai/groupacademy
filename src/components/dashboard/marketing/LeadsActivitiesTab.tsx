import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

/**
 * Combined service-leads view replacing the four old leads tabs
 * (assessment / mock / salary / portfolio).
 */
export default function LeadsActivitiesTab() {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">Leads & Activities</h2>
        <p className="text-sm text-muted-foreground">
          Service leads across the platform in one place.
        </p>
      </div>
      <Tabs defaultValue="assessment">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="mock">Mock Interview</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        </TabsList>
        {(["assessment","mock","salary","portfolio"] as const).map((k) => (
          <TabsContent key={k} value={k}>
            <Card className="p-6 text-sm text-muted-foreground">
              Showing {k} leads — opens the existing dedicated manager
              underneath. (Embedded view to be wired in next pass.)
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
