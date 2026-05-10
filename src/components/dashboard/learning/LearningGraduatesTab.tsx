import { Card } from "@/components/ui/card";
export function LearningGraduatesTab() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold">Graduates</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Learners who have completed a course and earned a verifiable certificate.
        Sourced from <code>certificates</code> joined with <code>enrollments</code>.
        Detailed table coming next; for now, see Learner Progress for completion status.
      </p>
    </Card>
  );
}

export default LearningGraduatesTab;
