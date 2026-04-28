/**
 * Dexian Bangladesh: B2B Outreach Orchestrator
 * CTO Reference: Authoritative controller for institutional BD templates.
 * Logic: Implements honorific-aware name parsing and polymorphic link generation.
 */

export type DexianEmailTemplate = "discovery" | "talent_matching" | "ai_training";
export type DexianWhatsAppTemplate = "intro" | "follow_up" | "training_pitch";

// --- HUD: REGISTRY_SANITY_CHECK ---
// Extracts semantic first names by filtering institutional honorifics.
function getFirstName(fullName: string): string {
  if (!fullName) return "there";
  const parts = fullName.trim().split(" ");
  const skipWords = ["mr", "mr.", "mrs", "mrs.", "ms", "ms.", "md", "md.", "dr", "dr."];

  for (const part of parts) {
    if (!skipWords.includes(part.toLowerCase())) {
      return part;
    }
  }
  return parts[0] || "there";
}

const EXECUTIVE_SIGNATURE = `Best regards,
Towsif Ahmed Chowdhury
Business Development, Sr. Executive
Dexian Bangladesh Limited
📧 info@dexian.com.bd`;

// PHASE: Email_Artifact_Registry
export const DEXIAN_EMAIL_TEMPLATES = {
  discovery: {
    subject: (company: string) => `Talent Solutions & Corporate AI Training - Dexian Bangladesh`,
    body: (company: string, contact?: string) =>
      `Dear ${contact ? getFirstName(contact) : "HR/Hiring Team"},

I hope this email finds you well. I'm reaching out from Dexian Bangladesh regarding solutions that may benefit ${company}:

𝟏. 𝐏𝐫𝐞-𝐒𝐜𝐫𝐞𝐞𝐧𝐞𝐝 𝐓𝐚𝐥𝐞𝐧𝐭 𝐏𝐨𝐨𝐥
Access 500+ career-ready professionals. We handle sourcing and matching - you focus on interviews.

𝟐. 𝐀𝐈 𝐄𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐜𝐲 𝐀𝐜𝐜𝐞𝐥𝐞𝐫𝐚𝐭𝐨𝐫 (Corporate Training)
6-session practical training designed to deliver 20%+ productivity gains through AI tools.

Would you be open to a 15-minute discovery call this week?
I'm available Tuesday-Thursday between 10 AM - 4 PM.

${EXECUTIVE_SIGNATURE}`,
  },

  talent_matching: {
    subject: (company: string) => `Pre-Screened Candidates for ${company} - Dexian Bangladesh`,
    body: (company: string, contact?: string) =>
      `Dear ${contact ? getFirstName(contact) : "Hiring Team"},

Following up on talent acquisition - I wanted to check if ${company} has any upcoming hiring needs.

We currently have 500+ verified professionals across Tech, Sales, Marketing, and Operations. If you share your open positions, I can send matched candidate profiles within 24 hours as a free trial.

Would a quick 15-minute call work for you this week?
I'm available Tuesday-Thursday, 10 AM - 4 PM.

${EXECUTIVE_SIGNATURE}`,
  },
};

// PHASE: WhatsApp_Artifact_Registry
export const DEXIAN_WHATSAPP_TEMPLATES = {
  intro: (contact: string, company: string) =>
    `Hi ${getFirstName(contact)}! This is Towsif from Dexian Bangladesh. We help ${company} with talent matching and AI training. When would be a good time to connect?`,

  training_pitch: (contact: string, company: string) =>
    `Hi ${getFirstName(contact)}! Is ${company} investing in employee training? Our AI Efficiency Accelerator (6 sessions) helps teams become 20%+ more productive. Interested?`,
};

// --- PHASE: Link_Generator_Nodes ---
export function getDexianEmailLink(
  to: string,
  template: DexianEmailTemplate,
  company: string,
  contact?: string,
): string {
  const email =
    DEXIAN_EMAIL_TEMPLATES[template as keyof typeof DEXIAN_EMAIL_TEMPLATES] || DEXIAN_EMAIL_TEMPLATES.discovery;
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(email.subject(company))}&body=${encodeURIComponent(email.body(company, contact))}`;
}

export function getDexianWhatsAppLink(
  phone: string,
  template: DexianWhatsAppTemplate,
  contact: string,
  company: string,
): string {
  const msg = DEXIAN_WHATSAPP_TEMPLATES[template](contact, company);
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
}
