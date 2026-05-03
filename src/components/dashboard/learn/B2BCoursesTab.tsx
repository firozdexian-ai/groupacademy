import { Card } from "@/components/ui/card";
export default function B2BCoursesTab() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold">B2B Courses</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Courses assigned to companies as cohorts. Use Companies → Company Agents
        to assign courses; this view aggregates assignments and progress per
        company.
      </p>
    </Card>
  );
}
