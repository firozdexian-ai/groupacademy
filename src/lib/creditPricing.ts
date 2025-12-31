/**
 * GroUp Academy Credit System Configuration
 * 1 credit = 2 taka
 */

export const CREDIT_CONFIG = {
  WELCOME_BONUS: 250,
  CREDIT_TO_TAKA: 2, // 1 credit = 2 taka
  
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
      cost: 20,
      description: 'Get personalized job recommendations'
    }
  },
  
  BUNDLES: [
    { credits: 100, price: 200, savings: 0 },
    { credits: 500, price: 900, savings: 100 },
    { credits: 1000, price: 1600, savings: 400 },
    { credits: 2500, price: 3750, savings: 1250 }
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
 * Convert credits to taka
 */
export function creditsToTaka(credits: number): number {
  return credits * CREDIT_CONFIG.CREDIT_TO_TAKA;
}

/**
 * Convert taka to credits
 */
export function takaToCredits(taka: number): number {
  return Math.floor(taka / CREDIT_CONFIG.CREDIT_TO_TAKA);
}
