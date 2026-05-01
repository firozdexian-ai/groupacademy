// Resource-type taxonomy used across all gig surfaces (Platform Tasks, Projects, Build Academy).
// Replaces school faculties as the user-facing axis so academy work and freelance projects
// flow through the same pipeline.

export const GIG_CATEGORIES = [
  { value: "creative",    label: "Creative Services",       icon: "palette",   blurb: "Covers, banners, thumbnails, brand assets" },
  { value: "video",       label: "Video & Production",      icon: "video",     blurb: "Lecture videos, screencasts, promos" },
  { value: "writing",     label: "Writing & Content",       icon: "fileText",  blurb: "Articles, scripts, captions, reading material" },
  { value: "slides",      label: "Slides & Decks",          icon: "presentation", blurb: "Module slide decks, pitch decks" },
  { value: "quizzes",     label: "Quizzes & Assessments",   icon: "helpCircle", blurb: "Quizzes, flashcards, assessments" },
  { value: "practice",    label: "Practice & Exercises",    icon: "dumbbell",  blurb: "Worksheets, labs, exercises" },
  { value: "web_tech",    label: "Web & Tech",              icon: "code",      blurb: "Embeds, code samples, automations" },
  { value: "audio",       label: "Audio & Podcast",         icon: "mic",       blurb: "Audio summaries, podcast edits" },
  { value: "translation", label: "Translation & Localization", icon: "languages", blurb: "BN ↔ EN translation of resources" },
] as const;

export type GigCategory = (typeof GIG_CATEGORIES)[number]["value"];

export const GIG_CATEGORY_MAP = Object.fromEntries(
  GIG_CATEGORIES.map((c) => [c.value, c]),
) as Record<GigCategory, (typeof GIG_CATEGORIES)[number]>;

// Map a content_gigs.resource_type to a category for legacy rows that haven't been backfilled.
export function categoryFromResourceType(rt?: string | null): GigCategory {
  const v = (rt || "").toLowerCase();
  if (["cover","banner","thumbnail","image","poster"].includes(v)) return "creative";
  if (["video","intro_video","lecture","screencast"].includes(v))  return "video";
  if (["slides","deck","presentation"].includes(v))                return "slides";
  if (["quiz","flashcard","flashcards","assessment"].includes(v))  return "quizzes";
  if (["exercise","worksheet","practice","lab"].includes(v))       return "practice";
  if (["embed","code","widget"].includes(v))                       return "web_tech";
  if (["audio","podcast"].includes(v))                             return "audio";
  if (["translation","localization"].includes(v))                  return "translation";
  return "writing";
}
