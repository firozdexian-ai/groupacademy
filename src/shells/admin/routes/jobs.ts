import React from "react";

export const ROUTES: Record<string, React.LazyExoticComponent<any>> = {
  leads: React.lazy(() =>
    import("@/domains/jobs/components/admin/JobsAssessmentLeadsTab").then((m) => ({ default: m.JobsAssessmentLeadsTab })),
  ),
  "jobs-overview": React.lazy(() => import("@/domains/jobs/components/admin/JobsOverviewTab")),
  "jobs-upload": React.lazy(() => import("@/domains/jobs/components/admin/JobsUploadApprovalTab")),
  "jobs-hub": React.lazy(() => import("@/domains/jobs/components/admin/hub/JobsHub").then(m => ({ default: m.JobsHub }))),
  "jobs-applications": React.lazy(() => import("@/domains/jobs/components/admin/JobsApplicationsTab").then(m => ({ default: m.JobsApplicationsTab }))),
  "jobs-pipeline": React.lazy(() => import("@/domains/jobs/components/admin/JobsKanbanPipelineTab").then(m => ({ default: m.JobsKanbanPipelineTab }))),
  "jobs-sourcing": React.lazy(() => import("@/domains/jobs/components/admin/JobsSourcingTab").then(m => ({ default: m.JobsSourcingTab }))),
  "jobs-talent-crm": React.lazy(() => import("@/domains/jobs/components/admin/JobsTalentCrmTab").then(m => ({ default: m.JobsTalentCrmTab }))),
  "jobs-assessments": React.lazy(() => import("@/domains/jobs/components/admin/JobsAssessmentsTab")),
  "jobs-kpis": React.lazy(() => import("@/domains/jobs/components/admin/JobsKpiTab").then(m => ({ default: m.JobsKpiTab }))),
};

export const TITLES: Record<string, string> = {
  leads: "Scorecard Intel",
  "jobs-overview": "Jobs Overview",
  "jobs-upload": "Jobs Upload & Approval",
  "jobs-hub": "Jobs Hub",
  "jobs-applications": "Candidate Flow",
  "jobs-pipeline": "Kanban Pipeline",
  "jobs-sourcing": "Sourcing",
  "jobs-talent-crm": "Talent CRM",
  "jobs-assessments": "Jobs Assessments",
  "jobs-kpis": "Growth Analytics",
};
