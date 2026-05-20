import React from "react";

export const ROUTES: Record<string, React.LazyExoticComponent<any>> = {
  all: React.lazy(() => import("@/domains/ugc/components/admin/UgcVideosTab")),
  "ugc-videos": React.lazy(() => import("@/domains/ugc/components/admin/UgcVideosTab")),
  "ugc-overview": React.lazy(() => import("@/domains/ugc/components/admin/UgcOverviewTab")),
  "ugc-blog": React.lazy(() => import("@/domains/ugc/components/admin/UgcBlogTab").then((m) => ({ default: m.UgcBlogTab }))),
  "ugc-feed": React.lazy(() => import("@/domains/ugc/components/admin/UgcFeedTab").then((m) => ({ default: m.UgcFeedTab }))),
  "ugc-competitions": React.lazy(() => import("@/domains/ugc/components/admin/UgcCompetitionsTab").then((m) => ({ default: m.UgcCompetitionsTab }))),
};

export const TITLES: Record<string, string> = {
  all: "Catalog Architecture",
  "ugc-videos": "Digital Library",
  "ugc-overview": "UGC & Contents",
  "ugc-blog": "Thought Leadership",
  "ugc-feed": "Network Stream",
  "ugc-competitions": "Gamification",
};
