/**
 * GroUp Academy: Fiscal Credit Infrastructure
 * CTO Reference: Authoritative configuration for internal economy and service valuation.
 * Exchange Rate: 1 credit = $0.02 USD
 */

export const CREDIT_CONFIG = {
  WELCOME_BONUS: 250,
  WHATSAPP_CONNECT_BONUS: 10,
  CREDIT_TO_USD: 0.02, // Monotonic Exchange Rate

  SERVICES: {
    CAREER_ASSESSMENT: {
      name: "Career Readiness Scorecard",
      cost: 50,
      description: "AI-powered career readiness analysis",
    },
    MOCK_INTERVIEW: {
      name: "AI Mock Interview",
      cost: 50,
      description: "Practice interviews with AI feedback",
    },
    SALARY_ANALYSIS: {
      name: "AI Salary Analysis",
      cost: 50,
      description: "Market salary insights and negotiation tips",
    },
    JOB_APPLICATION: {
      name: "Job Application",
      cost: 25,
      description: "Apply to jobs with AI-enhanced cover letters",
    },
    PORTFOLIO: {
      name: "Digital Portfolio",
      cost: 500,
      description: "Professional portfolio website creation",
    },
    IELTS_MOCK: {
      name: "IELTS Mock Test",
      cost: 100,
      description: "AI-powered IELTS practice tests",
    },
    AI_AGENT_CHAT: {
      name: "AI Agent Session",
      cost: 1,
      description: "Per-response credit charge for AI agent chat",
    },
    SUGGESTED_JOBS: {
      name: "AI Job Suggestions",
      cost: 10,
      description: "Get personalized job recommendations",
    },
    JOB_MATCH_SCORE: {
      name: "Job Match Analysis",
      cost: 10,
      description: "See how well you match this job",
    },
    JOB_MARKET_INSIGHT: {
      name: "Job & Applicant Insight",
      cost: 15,
      description: "Market intelligence and competition analysis",
    },
    STUDY_ABROAD_ROADMAP: {
      name: "AI Study Abroad Roadmap",
      cost: 100,
      description: "Personalized 12-month application plan",
    },
    EXTERNAL_APPLICATION: {
      name: "AI Application Assistant",
      cost: 50,
      description: "AI-powered answers for external job applications",
    },
    CV_GENERATION: {
      name: "ATS-Friendly CV",
      cost: 15,
      description: "Generate a clean ATS-friendly CV PDF",
    },
    APPLICATION_ANSWERS: {
      name: "Application Answer Sheet",
      cost: 10,
      description: "AI-prepared answers for application questions",
    },
  },

  BUNDLES: [
    { credits: 100, price: 2, savings: 0 },
    { credits: 500, price: 9, savings: 1 },
    { credits: 1000, price: 16, savings: 4 },
    { credits: 2500, price: 37.5, savings: 12.5 },
  ],
} as const;

export type ServiceType = keyof typeof CREDIT_CONFIG.SERVICES;

/**
 * HUD: Get the cost artifact for a service.
 */
export function getServiceCost(service: ServiceType): number {
  return CREDIT_CONFIG.SERVICES[service].cost;
}

/**
 * HUD: Convert credits to USD for checkout telemetry.
 */
export function creditsToUSD(credits: number): number {
  return credits * CREDIT_CONFIG.CREDIT_TO_USD;
}

/**
 * HUD: Convert USD to credits (Floor-capped).
 */
export function usdToCredits(usd: number): number {
  return Math.floor(usd / CREDIT_CONFIG.CREDIT_TO_USD);
}

/**
 * HUD: Calculate course credit cost.
 * Logic: Priority goes to explicit credit_cost, fallback to USD-ceiling.
 */
export function getCourseCredits(priceUSD: number, creditCost?: number | null): number {
  if (creditCost !== undefined && creditCost !== null) {
    return creditCost;
  }
  return Math.ceil(priceUSD / CREDIT_CONFIG.CREDIT_TO_USD);
}
