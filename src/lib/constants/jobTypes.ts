/**
 * Centralized job-related constants for consistency across the Jobs feature
 */

import { Briefcase, Clock, MapPin, Building2, Laptop, FileCode } from "lucide-react";

// Job type definitions with labels and styling
export const JOB_TYPES = {
  full_time: { label: "Full Time", shortLabel: "Full-time" },
  part_time: { label: "Part Time", shortLabel: "Part-time" },
  contract: { label: "Contract", shortLabel: "Contract" },
  internship: { label: "Internship", shortLabel: "Internship" },
  freelance: { label: "Freelance", shortLabel: "Freelance" },
  remote: { label: "Remote", shortLabel: "Remote" },
} as const;

export type JobType = keyof typeof JOB_TYPES;

// Job type colors using semantic tokens where possible
export const JOB_TYPE_COLORS: Record<string, string> = {
  full_time: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  part_time: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  contract: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  internship: "bg-green-500/10 text-green-600 dark:text-green-400",
  freelance: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  remote: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

// Experience levels - standardized to snake_case with backwards compatibility
export const EXPERIENCE_LEVELS = {
  entry_level: { label: "Entry Level", short: "Entry" },
  entry: { label: "Entry Level", short: "Entry" }, // backwards compat
  mid_level: { label: "Mid Level", short: "Mid" },
  mid: { label: "Mid Level", short: "Mid" }, // backwards compat
  senior_level: { label: "Senior Level", short: "Senior" },
  senior: { label: "Senior Level", short: "Senior" }, // backwards compat
  executive: { label: "Executive", short: "Executive" },
} as const;

export type ExperienceLevel = keyof typeof EXPERIENCE_LEVELS;

// Job collection categories for Browse by Type
export const JOB_COLLECTIONS = [
  { label: "Full-time", filter: "full_time", icon: Briefcase },
  { label: "Part-time", filter: "part_time", icon: Clock },
  { label: "Remote", filter: "remote", icon: Laptop },
  { label: "Internship", filter: "internship", icon: Building2 },
  { label: "Contract", filter: "contract", icon: FileCode },
  { label: "Freelance", filter: "freelance", icon: MapPin },
] as const;

// Application status configuration
export const APPLICATION_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-600" },
  sent: { label: "Sent", color: "bg-blue-500/10 text-blue-600" },
  delivered: { label: "Delivered", color: "bg-green-500/10 text-green-600" },
  viewed: { label: "Viewed", color: "bg-purple-500/10 text-purple-600" },
  rejected: { label: "Not Selected", color: "bg-red-500/10 text-red-600" },
  accepted: { label: "Shortlisted", color: "bg-emerald-500/10 text-emerald-600" },
};

// Helper to get formatted job type label
export function getJobTypeLabel(jobType: string): string {
  const type = JOB_TYPES[jobType as JobType];
  return type?.label || jobType.replace(/_/g, " ");
}

// Helper to get experience level label
export function getExperienceLevelLabel(level: string): string {
  const exp = EXPERIENCE_LEVELS[level as ExperienceLevel];
  return exp?.label || level.replace(/_/g, " ");
}

// Check if deadline is approaching (within 3 days)
export function isDeadlineUrgent(deadline: string | null): boolean {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysRemaining > 0 && daysRemaining <= 3;
}

// Check if deadline has passed
export function isDeadlinePassed(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}
