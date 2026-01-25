/**
 * Dexian Bangladesh B2B Outreach Templates
 * 
 * These templates are used by Business Development Executives at Dexian Bangladesh
 * when reaching out to companies for talent solutions and corporate training.
 */

export type DexianEmailTemplate = 'discovery' | 'talent_matching' | 'ai_training';
export type DexianWhatsAppTemplate = 'intro' | 'follow_up' | 'training_pitch';

// Helper to extract first name
function getFirstName(fullName: string): string {
  if (!fullName) return 'there';
  const parts = fullName.trim().split(' ');
  // Skip common honorifics
  const skipWords = ['mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.', 'md', 'md.', 'dr', 'dr.'];
  for (const part of parts) {
    if (!skipWords.includes(part.toLowerCase())) {
      return part;
    }
  }
  return parts[0] || 'there';
}

// ============= Email Templates =============

export const DEXIAN_EMAIL_TEMPLATES = {
  discovery: {
    subject: (companyName: string) => 
      `Talent Solutions & Corporate AI Training - Dexian Bangladesh`,
    body: (companyName: string, contactName?: string) => 
`Dear ${contactName ? getFirstName(contactName) : 'HR/Hiring Team'},

I hope this email finds you well. I'm reaching out from Dexian Bangladesh regarding solutions that may benefit ${companyName}:

𝟏. 𝐏𝐫𝐞-𝐒𝐜𝐫𝐞𝐞𝐧𝐞𝐝 𝐓𝐚𝐥𝐞𝐧𝐭 𝐏𝐨𝐨𝐥
Access 500+ career-ready professionals across Business Development, Sales, Marketing, Tech, and Operations roles. We handle sourcing, screening, and matching - you focus on interviews.

𝟐. 𝐀𝐈 𝐄𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐜𝐲 𝐀𝐜𝐜𝐞𝐥𝐞𝐫𝐚𝐭𝐨𝐫 (Corporate Training)
6-session practical training designed to deliver 20%+ productivity gains through AI tools. Topics include AI-assisted communication, data analysis, research, and workflow automation.

Would you be open to a quick discovery call this week to discuss ${companyName}'s hiring or training needs?

Best regards,
[Your Name]
Business Development Executive
Dexian Bangladesh Limited
📧 info@dexian.com.bd`
  },

  talent_matching: {
    subject: (companyName: string) => 
      `Pre-Screened Candidates for ${companyName} - Dexian Bangladesh`,
    body: (companyName: string, contactName?: string) => 
`Dear ${contactName ? getFirstName(contactName) : 'Hiring Team'},

Following up on talent acquisition - I wanted to check if ${companyName} has any upcoming hiring needs.

We currently have 500+ verified professionals in our talent pool across:
• Business Development & Sales
• Marketing & Digital
• Tech & Engineering  
• Operations & Supply Chain
• Finance & Accounting

If you share your current open positions, I can send you matched candidate profiles within 24 hours - completely free as a trial.

Let me know your current priorities!

Best regards,
[Your Name]
Business Development Executive
Dexian Bangladesh Limited`
  },

  ai_training: {
    subject: (companyName: string) => 
      `AI Efficiency Accelerator for ${companyName} - Corporate Training`,
    body: (companyName: string, contactName?: string) => 
`Dear ${contactName ? getFirstName(contactName) : 'L&D Team'},

Does ${companyName} invest in employee skill development? 

We'd like to introduce the 𝐀𝐈 𝐄𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐜𝐲 𝐀𝐜𝐜𝐞𝐥𝐞𝐫𝐚𝐭𝐨𝐫 - a 6-session corporate training program designed for tangible productivity gains.

𝐖𝐡𝐚𝐭'𝐬 𝐂𝐨𝐯𝐞𝐫𝐞𝐝:
• Session 1-2: AI-Powered Communication (emails, reports, presentations)
• Session 3-4: Data Analysis & Research with AI
• Session 5-6: Workflow Automation & Personal Productivity

𝐎𝐮𝐭𝐜𝐨𝐦𝐞𝐬:
✓ 20%+ productivity improvement
✓ Practical hands-on exercises
✓ Customizable to your industry

Shall I send over our corporate training brochure and pricing?

Best regards,
[Your Name]
Business Development Executive
Dexian Bangladesh Limited`
  }
};

// ============= WhatsApp Templates =============

export const DEXIAN_WHATSAPP_TEMPLATES = {
  intro: (contactName: string, companyName: string) => {
    const firstName = getFirstName(contactName);
    return `Hi ${firstName}! This is reaching out from Dexian Bangladesh.

We help companies like ${companyName} with:
• Pre-screened talent matching for open roles
• Corporate AI training programs (AI Efficiency Accelerator)

Would love to discuss how we can support your team. When would be a good time to connect?`;
  },

  follow_up: (contactName: string, companyName: string) => {
    const firstName = getFirstName(contactName);
    return `Hi ${firstName}, following up on my earlier message regarding Dexian's talent and training solutions.

Is ${companyName} currently looking to hire or upskill your team? Happy to share more details!`;
  },

  training_pitch: (contactName: string, companyName: string) => {
    const firstName = getFirstName(contactName);
    return `Hi ${firstName}! Quick question - is ${companyName} investing in employee training this year?

We offer an AI Efficiency Accelerator program (6 sessions) that helps teams become 20%+ more productive using practical AI tools.

Would you be interested in learning more?`;
  }
};

// ============= Utility Functions =============

/**
 * Generate a mailto link with pre-filled Dexian template
 */
export function getDexianEmailLink(
  to: string,
  template: DexianEmailTemplate,
  companyName: string,
  contactName?: string
): string {
  const emailTemplate = DEXIAN_EMAIL_TEMPLATES[template];
  const subject = emailTemplate.subject(companyName);
  const body = emailTemplate.body(companyName, contactName);
  
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Generate a WhatsApp link with pre-filled Dexian template
 */
export function getDexianWhatsAppLink(
  phone: string,
  template: DexianWhatsAppTemplate,
  contactName: string,
  companyName: string
): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const message = DEXIAN_WHATSAPP_TEMPLATES[template](contactName, companyName);
  
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Template metadata for UI display
 */
export const EMAIL_TEMPLATE_OPTIONS: { value: DexianEmailTemplate; label: string; icon: string }[] = [
  { value: 'discovery', label: 'Discovery (Talent + Training)', icon: '🔍' },
  { value: 'talent_matching', label: 'Talent Matching Only', icon: '👥' },
  { value: 'ai_training', label: 'AI Training Pitch', icon: '🤖' },
];
