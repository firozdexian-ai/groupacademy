import AdminTabPlaceholder from "@/shells/admin/components/AdminTabPlaceholder";

export default function AdminsRepsTab() {
  return (
    <AdminTabPlaceholder
      tabKey="marketing-admins-reps"
      title="Admins & Reps"
      note="Field reps and city admins who run community outreach. The dedicated roster is reserved here — for now use Workforce filtered by role = 'rep' or 'community_admin'."
    />
  );
}
