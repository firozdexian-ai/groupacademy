import { SimpleAdminRegistry } from "@/components/dashboard/common/SimpleAdminRegistry";

export const AcademiesTab = () => (
  <SimpleAdminRegistry
    table="academies"
    title="Academies"
    description="Top-level academy brands grouping schools and instructors."
    fields={[
      { key: "name", label: "Academy name", required: true },
      { key: "owner_email", label: "Owner email", type: "email" },
      { key: "region", label: "Region" },
      { key: "description", label: "Description", type: "textarea" },
    ]}
  />
);

export const SchoolsTab = () => (
  <SimpleAdminRegistry
    table="schools"
    title="Schools"
    description="Schools/departments within an academy."
    fields={[
      { key: "name", label: "School name", required: true },
      { key: "dean_email", label: "Dean email", type: "email" },
      { key: "description", label: "Description", type: "textarea" },
    ]}
  />
);

export const ProfessionalLivesTab = () => (
  <SimpleAdminRegistry
    table="professional_lives"
    title="Professional Lives"
    description="Library of career stories powering the discovery feed."
    fields={[
      { key: "title", label: "Story title", required: true },
      { key: "profession", label: "Profession" },
      { key: "country", label: "Country" },
      { key: "summary", label: "Summary", type: "textarea" },
    ]}
    primaryKey="title"
  />
);
