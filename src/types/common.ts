/**
 * Common type definitions shared across the application.
 * These types standardize data structures used in multiple components.
 */

// Education-related types
export interface Education {
  id?: string;
  degree: string;
  institution: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
  isCurrent?: boolean;
  grade?: string;
  description?: string;
}

// Experience-related types
export interface Experience {
  id?: string;
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  responsibilities?: string[];
}

// Skill-related types
export interface Skill {
  id?: string;
  name: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
  yearsOfExperience?: number;
}

// Job-related types
export interface JobBase {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string | null;
  job_type: JobType;
  experience_level: ExperienceLevel;
  is_featured: boolean;
  created_at: string;
}

export interface JobFull extends JobBase {
  description: string;
  ai_enhanced_description: string | null;
  requirements: string[] | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  deadline: string | null;
  application_type: ApplicationType;
  application_email: string | null;
  application_url: string | null;
  source_image_url: string | null;
}

export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance' | 'remote';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive';
export type ApplicationType = 'email' | 'link' | 'internal';

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  internship: 'Internship',
  freelance: 'Freelance',
  remote: 'Remote',
};

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior Level',
  executive: 'Executive',
};

// Course/Content-related types
export interface CourseBase {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content_type: ContentType;
  price: number | null;
  instructor_name: string | null;
  cover_image_url: string | null;
  is_published: boolean;
}

export interface CourseFull extends CourseBase {
  youtube_url: string | null;
  event_date: string | null;
  duration_hours: number | null;
  modules_count: number | null;
  learning_objectives: string[] | null;
  max_capacity: number | null;
  current_enrollment: number | null;
  whatsapp_group_link: string | null;
  venue_name: string | null;
  venue_address: string | null;
}

export type ContentType = 'free_video' | 'recorded_course' | 'live_webinar' | 'batch_class' | 'offline_seminar';

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  free_video: 'Free Video',
  recorded_course: 'Recorded Course',
  live_webinar: 'Live Webinar',
  batch_class: 'Batch Class',
  offline_seminar: 'Offline Seminar',
};

// Enrollment types
export interface Enrollment {
  id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  completed_at: string | null;
  content: CourseBase;
}

export type EnrollmentStatus = 'active' | 'pending_payment' | 'completed' | 'cancelled';

// Application types
export interface JobApplication {
  id: string;
  job_id: string;
  job_title?: string;
  company_name?: string;
  created_at: string;
  application_status: ApplicationStatus;
  delivery_status: DeliveryStatus;
}

export type ApplicationStatus = 'submitted' | 'reviewed' | 'shortlisted' | 'rejected' | 'interview_scheduled' | 'hired';
export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'delivered';

// Service result types
export interface ServiceResult {
  id: string;
  type: 'assessment' | 'interview' | 'salary' | 'portfolio';
  title: string;
  date: string;
  status: string;
  score?: number;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// Talent/Profile types
export interface TalentProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  cvUrl: string | null;
  customProfession: string | null;
  currentStatus: string | null;
  institution: string | null;
  fieldOfStudy: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  professionCategoryId: string | null;
  onboardingCompletedAt: string | null;
  education: Education[] | null;
  experience: Experience[] | null;
  skills: Skill[] | null;
  creditBalance: number;
  createdAt: string;
}

// Credit types
export interface CreditTransaction {
  id: string;
  amount: number;
  balance_after: number;
  transaction_type: 'credit' | 'debit' | 'refund';
  service_type: string | null;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}
