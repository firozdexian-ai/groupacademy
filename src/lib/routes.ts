/**
 * Centralized route definitions for the application.
 * Use these constants instead of hardcoding routes throughout the codebase.
 */

export const ROUTES = {
  // Public routes
  public: {
    home: '/',
    auth: '/auth',
    resetPassword: '/reset-password',
    courses: '/courses',
    courseDetail: (slug: string) => `/courses/${slug}`,
    professions: '/professions',
    professionDetail: (slug: string) => `/professions/${slug}`,
    jobs: '/jobs',
    jobDetail: (id: string) => `/jobs/${id}`,
    jobApply: (id: string) => `/jobs/${id}/apply`,
    careerServices: '/career-services',
    careerAssessment: '/career-assessment',
    assessmentResults: (id: string) => `/assessment-results/${id}`,
    mockInterview: '/mock-interview',
    mockInterviewSetup: '/mock-interview/setup',
    mockInterviewQuestions: (id: string) => `/mock-interview/questions/${id}`,
    mockInterviewResults: (id: string) => `/mock-interview/results/${id}`,
    salaryAnalysis: '/salary-analysis',
    salaryAnalysisSetup: '/salary-analysis/setup',
    salaryAnalysisResults: (id: string) => `/salary-analysis/results/${id}`,
    portfolioRequest: '/portfolio-request',
    portfolioStatus: '/portfolio-status',
  },

  // Authenticated app routes (talent/seeker)
  app: {
    root: '/app',
    feed: '/app/feed',
    
    // Learning
    learning: '/app/learning',
    learningTracks: '/app/learning/tracks',
    learningTrackDetail: (slug: string) => `/app/learning/tracks/${slug}`,
    learningCourses: '/app/learning/courses',
    learningCourseDetail: (slug: string) => `/app/learning/courses/${slug}`,
    learningMyCourses: '/app/learning/my-courses',
    learningEvents: '/app/learning/events',
    coursePlayer: (slug: string) => `/app/learn/${slug}`,
    // Alias for consistency
    learningCoursePlay: (slug: string) => `/app/learn/${slug}`,
    
    // Services
    services: '/app/services',
    servicesAssessment: '/app/services/assessment',
    servicesMockInterview: '/app/services/mock-interview',
    servicesSalaryAnalysis: '/app/services/salary-analysis',
    servicesPortfolio: '/app/services/portfolio',
    servicesMyResults: '/app/services/my-results',
    
    // Jobs
    jobs: '/app/jobs',
    jobDetail: (id: string) => `/app/jobs/${id}`,
    jobApply: (id: string) => `/app/jobs/${id}/apply`,
    applications: '/app/applications',
    
    // AI Agents
    agents: '/app/agents',
    agentChat: (agentKey: string) => `/app/agents/${agentKey}`,
    aiGeneral: '/app/ai-general',
    
    // Profile
    profile: '/app/profile',
    profileEdit: '/app/profile/edit',
    
    // Other
    abroad: '/app/abroad',
    abroadStudy: '/app/abroad/study',
    abroadStudyDetail: (id: string) => `/app/abroad/study/${id}`,
    abroadIelts: '/app/abroad/ielts',
    abroadRoadmap: '/app/abroad/roadmap',
    abroadRoadmapResults: (id: string) => `/app/abroad/roadmap/${id}`,
    notifications: '/app/notifications',
    
    // Gigs
    gigs: '/app/gigs',
    transactions: '/app/transactions',
  },

  // Admin/Dashboard routes
  admin: {
    root: '/admin',
    dashboard: '/dashboard',
    students: '/students',
    enrollments: '/enrollments',
    instructors: '/instructors',
    instructorNew: '/instructors/new',
    instructorEdit: (id: string) => `/instructors/${id}/edit`,
    sessions: '/sessions',
    sessionNew: '/sessions/new',
    sessionEdit: (id: string) => `/sessions/${id}/edit`,
    contentNew: '/content/new',
    contentEdit: (id: string) => `/content/${id}/edit`,
    contentModules: (contentId: string) => `/content/${contentId}/modules`,
    moduleResources: (contentId: string, moduleId: string) => `/content/${contentId}/modules/${moduleId}/resources`,
    quizManage: (contentId: string) => `/quiz-manage/${contentId}`,
  },

  // Learning routes
  learn: {
    player: (slug: string) => `/learn/${slug}`,
    quiz: (slug: string) => `/quiz/${slug}`,
    reportCard: (enrollmentId: string) => `/report-card/${enrollmentId}`,
    myLearning: '/my-learning',
  },

  // Organization routes
  org: {
    root: '/org',
  },
} as const;

// Helper to check if a route is within the app shell
export const isAppRoute = (path: string): boolean => {
  return path.startsWith('/app');
};

// Helper to get the app version of a public route
export const getAppRoute = (publicRoute: string): string | null => {
  const mappings: Record<string, string> = {
    '/jobs': '/app/jobs',
    '/courses': '/app/learning/courses',
    '/professions': '/app/learning/tracks',
  };
  
  return mappings[publicRoute] || null;
};
