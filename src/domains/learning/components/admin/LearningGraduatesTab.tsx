import AdminTabPlaceholder from "@/shells/admin/components/AdminTabPlaceholder";

export function LearningGraduatesTab() {
  return (
    <AdminTabPlaceholder
      tabKey="learning-graduates"
      title="Graduates"
      note="Learners who have completed a course and earned a verifiable certificate. The detailed graduate roster (certificates joined with enrollments) is reserved here — for now use Learner Progress for completion status."
    />
  );
}

export default LearningGraduatesTab;
