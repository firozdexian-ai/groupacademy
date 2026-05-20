import React from "react";

export const ROUTES: Record<string, React.LazyExoticComponent<any>> = {
  "abroad-overview": React.lazy(() => import("@/domains/abroad/components/admin/AbroadOverviewTab").then(m => ({ default: (m as any).AbroadOverviewTab ?? m.default }))),
  "abroad-destinations": React.lazy(() => import("@/domains/abroad/components/admin/AbroadDestinationsTab").then(m => ({ default: (m as any).AbroadDestinationsTab ?? m.default }))),
  "abroad-applications": React.lazy(() => import("@/domains/abroad/components/admin/AbroadApplicationsTab").then(m => ({ default: (m as any).AbroadApplicationsTab ?? m.default }))),
  "abroad-programs": React.lazy(() => import("@/domains/abroad/components/admin/AbroadProgramsTab").then(m => ({ default: (m as any).AbroadProgramsTab ?? m.default }))),
  "abroad-ielts-prompts": React.lazy(() => import("@/domains/abroad/components/admin/AbroadIELTSPromptsTab").then(m => ({ default: (m as any).AbroadIELTSPromptsTab ?? m.default }))),
  "abroad-ielts-resources": React.lazy(() => import("@/domains/abroad/components/admin/AbroadIELTSResourcesTab").then(m => ({ default: (m as any).AbroadIELTSResourcesTab ?? m.default }))),
  "abroad-language-lab": React.lazy(() => import("@/domains/abroad/components/admin/AbroadLanguageLabTab").then(m => ({ default: (m as any).AbroadLanguageLabTab ?? m.default }))),
  "abroad-roadmap-leads": React.lazy(() => import("@/domains/abroad/components/admin/AbroadRoadmapLeadsTab").then(m => ({ default: (m as any).AbroadRoadmapLeadsTab ?? m.default }))),
};

export const TITLES: Record<string, string> = {
  "abroad-overview": "Career Abroad Overview",
  "abroad-destinations": "Destination Agents",
  "abroad-applications": "Application Pipeline",
  "abroad-programs": "Uni Programs",
  "abroad-ielts-prompts": "IELTS Prompt Bank",
  "abroad-ielts-resources": "IELTS Resources",
  "abroad-language-lab": "Language Lab",
  "abroad-roadmap-leads": "Roadmap Leads",
};
