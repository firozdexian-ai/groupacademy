/**
 * GroUp Academy Credit System Configuration
 * 1 credit = $0.02 USD
 */

export const CREDIT_CONFIG = {
  WELCOME_BONUS: 250,
  WHATSAPP_CONNECT_BONUS: 10,
  CREDIT_TO_USD: 0.02, // 1 credit = $0.02 USD
  
  SERVICES: {
    CAREER_ASSESSMENT: {
      name: 'Career Readiness Scorecard',
      cost: 50,
      description: 'AI-powered career readiness analysis'
    },
    MOCK_INTERVIEW: {
      name: 'AI Mock Interview',
      cost: 50,
      description: 'Practice interviews with AI feedback'
    },
    SALARY_ANALYSIS: {
      name: 'AI Salary Analysis',
      cost: 50,
      description: 'Market salary insights and negotiation tips'
    },
    JOB_APPLICATION: {
      name: 'Job Application',
      cost: 25,
      description: 'Apply to jobs with AI-enhanced cover letters'
    },
    PORTFOLIO: {
      name: 'Digital Portfolio',
      cost: 500,
      description: 'Professional portfolio website creation'
    },
    IELTS_MOCK: {
      name: 'IELTS Mock Test',
      cost: 100,
      description: 'AI-powered IELTS practice tests'
    },
    AI_AGENT_CHAT: {
      name: 'AI Agent Session',
      cost: 10,
      description: 'Chat with AI career experts'
    },
    SUGGESTED_JOBS: {
      name: 'AI Job Suggestions',
      cost: 10,
      description: 'Get personalized job recommendations'
    },
    JOB_MATCH_SCORE: {
      name: 'Job Match Analysis',
      cost: 10,
      description: 'See how well you match this job'
    },
    JOB_MARKET_INSIGHT: {
      name: 'Job & Applicant Insight',
      cost: 15,
      description: 'Market intelligence and competition analysis'
    },
    STUDY_ABROAD_ROADMAP: {
      name: 'AI Study Abroad Roadmap',
      cost: 100,
      description: 'Personalized 12-month application plan with university recommendations'
    },
    EXTERNAL_APPLICATION: {
      name: 'AI Application Assistant',
      cost: 50,
      description: 'AI-powered answers for external job applications'
    }
  },
  
  BUNDLES: [
    { credits: 100, price: 2, savings: 0 },
    { credits: 500, price: 9, savings: 1 },
    { credits: 1000, price: 16, savings: 4 },
    { credits: 2500, price: 37.5, savings: 12.5 }
  ]
} as const;

export type ServiceType = keyof typeof CREDIT_CONFIG.SERVICES;

/**
 * Get the cost in credits for a service (flat rate)
 */
export function getServiceCost(service: ServiceType): number {
  return CREDIT_CONFIG.SERVICES[service].cost;
}

/**
 * Convert credits to USD
 */
export function creditsToUSD(credits: number): number {
  return credits * CREDIT_CONFIG.CREDIT_TO_USD;
}

/**
 * Convert USD to credits
 */
export function usdToCredits(usd: number): number {
  return Math.floor(usd / CREDIT_CONFIG.CREDIT_TO_USD);
}

/**
 * Get the credit cost for a course
 * Uses direct credit_cost if set, otherwise calculates from USD price
 */
export function getCourseCredits(priceUSD: number, creditCost?: number | null): number {
  // Direct credit cost takes precedence
  if (creditCost !== undefined && creditCost !== null) {
    return creditCost;
  }
  // Fallback to price calculation
  return Math.ceil(priceUSD / CREDIT_CONFIG.CREDIT_TO_USD);
}
