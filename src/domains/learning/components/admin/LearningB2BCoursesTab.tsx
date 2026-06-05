import AdminTabPlaceholder from "@/shells/admin/components/AdminTabPlaceholder";

export function LearningB2BCoursesTab() {
  return (
    <AdminTabPlaceholder
      tabKey="learning-b2b-courses"
      title="B2B Courses"
      note="Aggregated view of courses assigned to companies as cohorts. The per-company progress aggregation is reserved — for now assign and track via Companies → Company Agents."
    />
  );
}

export default LearningB2BCoursesTab;
