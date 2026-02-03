/**
 * Investor Relations Configuration
 * Global currency: USD ($10 USD = 500 Credits)
 */

import { CREDIT_CONFIG } from './creditPricing';

export const IR_CONFIG = {
  // Currency conversion (platform standard)
  USD_TO_CREDITS: 50,           // $1 USD = 50 credits
  CREDITS_TO_USD: 0.02,         // 1 credit = $0.02 USD
  BDT_TO_USD: 0.0083,           // ~120 BDT = 1 USD (approximate)
  
  // Service costs in credits (from creditPricing)
  SERVICE_COSTS: {
    AI_AGENT_CHAT: CREDIT_CONFIG.SERVICES.AI_AGENT_CHAT.cost,
    JOB_MATCH_SCORE: CREDIT_CONFIG.SERVICES.JOB_MATCH_SCORE.cost,
    JOB_MARKET_INSIGHT: CREDIT_CONFIG.SERVICES.JOB_MARKET_INSIGHT.cost,
    JOB_APPLICATION: CREDIT_CONFIG.SERVICES.JOB_APPLICATION.cost,
    CAREER_ASSESSMENT: CREDIT_CONFIG.SERVICES.CAREER_ASSESSMENT.cost,
    MOCK_INTERVIEW: CREDIT_CONFIG.SERVICES.MOCK_INTERVIEW.cost,
    SALARY_ANALYSIS: CREDIT_CONFIG.SERVICES.SALARY_ANALYSIS.cost,
    IELTS_MOCK: CREDIT_CONFIG.SERVICES.IELTS_MOCK.cost,
    STUDY_ABROAD_ROADMAP: CREDIT_CONFIG.SERVICES.STUDY_ABROAD_ROADMAP.cost,
    PORTFOLIO: CREDIT_CONFIG.SERVICES.PORTFOLIO.cost,
  } as const,
  
  // Default service mix percentages (configurable per target)
  DEFAULT_SERVICE_MIX: {
    AI_AGENT_CHAT: 30,
    JOB_MATCH_SCORE: 15,
    JOB_APPLICATION: 15,
    CAREER_ASSESSMENT: 10,
    MOCK_INTERVIEW: 10,
    SALARY_ANALYSIS: 8,
    JOB_MARKET_INSIGHT: 5,
    IELTS_MOCK: 3,
    STUDY_ABROAD_ROADMAP: 3,
    PORTFOLIO: 1,
  } as const,
  
  // Service display names
  SERVICE_LABELS: {
    AI_AGENT_CHAT: 'AI Agent Chat',
    JOB_MATCH_SCORE: 'Job Match Score',
    JOB_MARKET_INSIGHT: 'Job Market Insight',
    JOB_APPLICATION: 'Job Application',
    CAREER_ASSESSMENT: 'Career Assessment',
    MOCK_INTERVIEW: 'Mock Interview',
    SALARY_ANALYSIS: 'Salary Analysis',
    IELTS_MOCK: 'IELTS Mock Test',
    STUDY_ABROAD_ROADMAP: 'Study Abroad Roadmap',
    PORTFOLIO: 'Digital Portfolio',
  } as const,
  
  // Investor status options
  VC_STATUS_OPTIONS: [
    { value: 'prospecting', label: 'Prospecting', color: 'bg-muted' },
    { value: 'in_talks', label: 'In Talks', color: 'bg-blue-500' },
    { value: 'due_diligence', label: 'Due Diligence', color: 'bg-yellow-500' },
    { value: 'term_sheet', label: 'Term Sheet', color: 'bg-orange-500' },
    { value: 'passed', label: 'Passed', color: 'bg-destructive' },
    { value: 'portfolio', label: 'Portfolio', color: 'bg-green-500' },
  ],
  
  // Investor subscription status
  SUBSCRIPTION_STATUS_OPTIONS: [
    { value: 'pending', label: 'Pending', color: 'bg-muted' },
    { value: 'intro_sent', label: 'Intro Sent', color: 'bg-blue-500' },
    { value: 'subscribed', label: 'Subscribed', color: 'bg-green-500' },
    { value: 'unsubscribed', label: 'Unsubscribed', color: 'bg-destructive' },
  ],
  
  // Interaction types
  INTERACTION_TYPES: [
    { value: 'email_sent', label: 'Email Sent', icon: 'mail' },
    { value: 'reply_received', label: 'Reply Received', icon: 'mail-open' },
    { value: 'meeting', label: 'Meeting', icon: 'calendar' },
    { value: 'call', label: 'Phone Call', icon: 'phone' },
    { value: 'note', label: 'Note', icon: 'file-text' },
  ],
  
  // Sentiment options
  SENTIMENT_OPTIONS: [
    { value: 'positive', label: 'Positive', color: 'text-green-500' },
    { value: 'neutral', label: 'Neutral', color: 'text-muted-foreground' },
    { value: 'negative', label: 'Negative', color: 'text-destructive' },
  ],
  
  // Email types
  EMAIL_TYPES: [
    { value: 'introduction', label: 'Introduction' },
    { value: 'weekly_update', label: 'Weekly Update' },
    { value: 'special_update', label: 'Special Update' },
  ],
  
  // Stage focus options
  STAGE_FOCUS_OPTIONS: ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth'],
  
  // Sector focus options  
  SECTOR_FOCUS_OPTIONS: ['EdTech', 'SaaS', 'AI/ML', 'Emerging Markets', 'B2B', 'B2C', 'Marketplace'],
  
  // Investor interest tags
  INTEREST_TAGS: ['EdTech', 'AI', 'Emerging Markets', 'B2B SaaS', 'Career Tech', 'South Asia', 'MENA', 'Southeast Asia'],
};

export type ServiceKey = keyof typeof IR_CONFIG.SERVICE_COSTS;
export type ServiceMix = Record<ServiceKey, number>;

/**
 * Convert USD to credits
 */
export function usdToCredits(usd: number): number {
  return Math.round(usd * IR_CONFIG.USD_TO_CREDITS);
}

/**
 * Convert credits to USD
 */
export function creditsToUsd(credits: number): number {
  return credits * IR_CONFIG.CREDITS_TO_USD;
}

/**
 * Convert BDT to USD
 */
export function bdtToUsd(bdt: number): number {
  return bdt * IR_CONFIG.BDT_TO_USD;
}

/**
 * Format USD currency
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format USD with decimals
 */
export function formatUSDPrecise(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate service-wise credit targets from MRR and mix percentages
 */
export function calculateServiceTargets(
  mrrUsd: number,
  serviceMix: ServiceMix = IR_CONFIG.DEFAULT_SERVICE_MIX as ServiceMix
): Array<{
  service: ServiceKey;
  label: string;
  creditCost: number;
  mixPercent: number;
  creditTarget: number;
  usageTarget: number;
  revenueUsd: number;
}> {
  const totalCredits = usdToCredits(mrrUsd);
  
  return (Object.keys(serviceMix) as ServiceKey[]).map((service) => {
    const mixPercent = serviceMix[service] || 0;
    const creditTarget = Math.round((totalCredits * mixPercent) / 100);
    const creditCost = IR_CONFIG.SERVICE_COSTS[service];
    const usageTarget = creditCost > 0 ? Math.round(creditTarget / creditCost) : 0;
    const revenueUsd = creditsToUsd(creditTarget);
    
    return {
      service,
      label: IR_CONFIG.SERVICE_LABELS[service],
      creditCost,
      mixPercent,
      creditTarget,
      usageTarget,
      revenueUsd,
    };
  }).sort((a, b) => b.mixPercent - a.mixPercent);
}

/**
 * Calculate auto KPIs from MRR target
 */
export function calculateAutoKPIs(mrrUsd: number, arpu: number = 20) {
  return {
    arrUsd: mrrUsd * 12,
    totalCreditsTarget: usdToCredits(mrrUsd),
    requiredPayingUsers: arpu > 0 ? Math.ceil(mrrUsd / arpu) : 0,
    ltvEstimate: arpu * 24, // Assuming 24 month average lifetime
    cacCeiling: (arpu * 24) / 4, // 4:1 LTV:CAC ratio
  };
}
