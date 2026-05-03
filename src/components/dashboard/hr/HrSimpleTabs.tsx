import { SimpleAdminRegistry } from "@/components/dashboard/common/SimpleAdminRegistry";

export const HrGradesTab = () => (
  <SimpleAdminRegistry
    table="hr_grades"
    title="Grades & Levels"
    description="Staff grades and seniority levels."
    fields={[
      { key: "name", label: "Grade name", required: true },
      { key: "level", label: "Level (number)", type: "number" },
      { key: "description", label: "Description", type: "textarea" },
    ]}
  />
);

export const HrVerticalsTab = () => (
  <SimpleAdminRegistry
    table="hr_verticals"
    title="Verticals"
    description="Internal business verticals (e.g. Talent, Companies, Academy, Workforce)."
    fields={[
      { key: "name", label: "Vertical name", required: true },
      { key: "description", label: "Description", type: "textarea" },
    ]}
  />
);

export const HrFunctionsTab = () => (
  <SimpleAdminRegistry
    table="hr_functions"
    title="Functions"
    description="Functional groups inside each vertical (e.g. Engineering, Sales, Ops)."
    fields={[
      { key: "name", label: "Function name", required: true },
      { key: "vertical_id", label: "Vertical id (uuid)" },
      { key: "description", label: "Description", type: "textarea" },
    ]}
  />
);

export const HrTeamsTab = () => (
  <SimpleAdminRegistry
    table="hr_teams"
    title="Teams"
    description="Teams under each function."
    fields={[
      { key: "name", label: "Team name", required: true },
      { key: "function_id", label: "Function id (uuid)" },
      { key: "lead_user_id", label: "Lead user id (uuid)" },
      { key: "description", label: "Description", type: "textarea" },
    ]}
  />
);

export const HrTargetsTab = () => (
  <SimpleAdminRegistry
    table="hr_targets"
    title="Targets & Incentives"
    description="Performance targets with incentive amounts. Scope can be team / function / vertical / user."
    primaryKey="metric"
    fields={[
      { key: "metric", label: "Metric (e.g. revenue, signups)", required: true },
      { key: "scope", label: "Scope (team/function/user)" },
      { key: "scope_id", label: "Scope id (uuid)" },
      { key: "target_value", label: "Target value", type: "number" },
      { key: "incentive_amount", label: "Incentive amount", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ]}
  />
);

export const HrOnboardingTab = () => (
  <SimpleAdminRegistry
    table="hr_onboarding_tasks"
    title="Onboarding"
    description="Onboarding checklist items per workforce member."
    primaryKey="title"
    fields={[
      { key: "title", label: "Task title", required: true },
      { key: "user_id", label: "User id (uuid)", required: true },
      { key: "status", label: "Status (pending/done)" },
      { key: "notes", label: "Notes", type: "textarea" },
    ]}
  />
);

export const HrPayrollTab = () => (
  <SimpleAdminRegistry
    table="hr_payroll_runs"
    title="Rewards & Payroll"
    description="Payroll and incentive payouts per workforce member."
    primaryKey="user_id"
    fields={[
      { key: "user_id", label: "User id (uuid)", required: true },
      { key: "period_start", label: "Period start (YYYY-MM-DD)", required: true },
      { key: "period_end", label: "Period end (YYYY-MM-DD)", required: true },
      { key: "base_amount", label: "Base amount", type: "number" },
      { key: "incentive_amount", label: "Incentive amount", type: "number" },
      { key: "total_amount", label: "Total amount", type: "number" },
      { key: "currency", label: "Currency (e.g. BDT)" },
      { key: "status", label: "Status (draft/paid)" },
    ]}
  />
);
