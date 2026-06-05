export { default as UgcOverviewTab, UgcOverviewTab as UgcOverviewTabNamed } from "./components/admin/UgcOverviewTab";
export { default as UgcFeedTab, UgcFeedTab as UgcFeedTabNamed } from "./components/admin/UgcFeedTab";
export { default as UgcVideosTab, UgcVideosTab as UgcVideosTabNamed } from "./components/admin/UgcVideosTab";
export { default as UgcCompetitionsTab, UgcCompetitionsTab as UgcCompetitionsTabNamed } from "./components/admin/UgcCompetitionsTab";
export { default as UgcBlogTab, UgcBlogTab as UgcBlogTabNamed } from "./components/admin/UgcBlogTab";
export { useUgcGraph } from "./components/admin/hooks/useUgcGraph";
export type {
  UgcVideo,
  UgcBlog,
  UgcFeedPost,
  UgcCompetition,
  UgcReport,
  UgcDashboard,
} from "./components/admin/hooks/useUgcGraph";
export { adminContentAi } from "./api/manifest";
