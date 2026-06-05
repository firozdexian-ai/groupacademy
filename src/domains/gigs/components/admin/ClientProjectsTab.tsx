import AdminTabPlaceholder from "@/shells/admin/components/AdminTabPlaceholder";

export function ClientProjectsTab() {
  return (
    <AdminTabPlaceholder
      tabKey="gigs-client-projects"
      title="Client Projects"
      note="Real client briefs posted to the marketplace (source = 'client'). This dedicated queue is reserved — for now the Marketplace tab shows all gigs regardless of source."
    />
  );
}

export default ClientProjectsTab;
