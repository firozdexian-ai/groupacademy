/**
 * Centralized support contact configuration
 * Used across all WhatsApp links and support references
 */
export const SUPPORT_CONFIG = {
  WHATSAPP_NUMBER: "8801889825025",
  WHATSAPP_LINK: "https://wa.me/8801889825025",
  SUPPORT_EMAIL: "support@groupacademy.com",
  DISPLAY_NUMBER: "+880 1889-825025",
} as const;

/**
 * Generate a WhatsApp link with optional pre-filled message
 */
export function getWhatsAppLink(message?: string): string {
  const base = SUPPORT_CONFIG.WHATSAPP_LINK;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
}

/**
 * Generate expedite application message for WhatsApp
 */
export function getExpediteMessage(jobTitle: string, companyName: string): string {
  return `Hi! I just applied for the ${jobTitle} position at ${companyName}. Can you help expedite my application? 🙏`;
}

/**
 * Generate credit purchase message for WhatsApp
 */
export function getCreditPurchaseMessage(credits: number, price: number, currentBalance: number): string {
  return `Hi, I want to purchase ${credits} credits for BDT ${price}. My current balance is ${currentBalance} credits.`;
}

/**
 * Generate WhatsApp connect message for first-time users
 */
export function getWhatsAppConnectMessage(userName: string): string {
  return `Hi! I'm ${userName} from GroUp Academy app. I'd like to connect for career support! 🎯`;
}
