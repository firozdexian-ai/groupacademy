// Centralized outreach message templates for GroUp Academy
// Supports Global Standards and Multi-channel (WhatsApp, Email, LinkedIn)

export type OutreachProduct =
  | "welcome"
  | "portfolio"
  | "mock_interview"
  | "salary_analysis"
  | "career_scorecard"
  | "course"
  | "ai_agent";

export type OutreachChannel = "whatsapp" | "email" | "linkedin";

export interface OutreachTemplate {
  name: string;
  icon: string;
  color: string;
  template: (name: string, country?: string, extra?: string) => string;
  emailSubject?: (name: string) => string;
  emailTemplate?: (name: string, country?: string, extra?: string) => string;
  linkedinTemplate?: (name: string, country?: string, extra?: string) => string;
}

export const OUTREACH_TEMPLATES: Record<OutreachProduct, OutreachTemplate> = {
  welcome: {
    name: "Welcome",
    icon: "hand",
    color: "blue",
    template: (name: string, country?: string) => {
      const isGlobal = country && !["Bangladesh", "BD"].includes(country);
      const geoPitch = isGlobal
        ? `your partner for international career growth in ${country}`
        : `designed specifically for your career growth`;

      return `Hi ${name}! 👋\n\nWelcome to GroUp Academy - ${geoPitch}!\n\nI'm your Talent Success Executive. Whether you're targeting local roles or global opportunities, we provide the AI tools to get you there.\n\nReady to explore?\n✅ AI Mock Interviews\n✅ Market Salary Analysis\n✅ Expert AI Agents\n\nHow can I help you grow today?\n\n- GroUp Academy 🚀`;
    },
    emailSubject: (name: string) => `${name}, Welcome to GroUp Academy! 🚀`,
    emailTemplate: (name: string, country?: string) =>
      `Hi ${name},\n\nWelcome to GroUp Academy — your global career acceleration partner!\n\nWhether you are based in ${country || "the region"} or looking for international roles, we provide the AI-powered infrastructure to help you stand out.\n\nExplore our suite:\n• Digital Portfolio Website\n• AI Mock Interviews (Industry-specific)\n• Salary Benchmarking\n• Expert AI Agent Network\n\nComplete your profile: https://groupacademy.lovable.app/auth\n\nBest regards,\nGroUp Academy Team`,
    linkedinTemplate: (name: string) =>
      `Hi ${name}! 👋 I noticed your background and wanted to welcome you to GroUp Academy. We’ve built an AI-powered platform to help professionals like you automate their career growth. Check us out: https://groupacademy.lovable.app`,
  },
  ai_agent: {
    name: "AI Agents",
    icon: "bot",
    color: "indigo",
    template: (name: string) =>
      `Hi ${name}! 👋 Have you met our AI Expert Network yet?\n\nWe've deployed 9 specialized AI Agents to help you 24/7:\n👨‍🏫 Career Consultant\n📝 CV Coach\n💰 Salary Negotiator\n🧠 Mental Wellness Coach\n\nPick your expert and start a session for just 10 credits!\n\n👉 https://groupacademy.lovable.app/app/agents`,
    emailSubject: (name: string) => `${name}, meet your new AI Career Coaches 🤖`,
    emailTemplate: (name: string) =>
      `Hi ${name},\n\nWhy settle for one career coach when you can have a network? GroUp Academy now features 9 specialized AI Agents available 24/7.\n\nOur experts include:\n• Career Consultant for strategy\n• IELTS Tutor for prep\n• Salary Negotiator for compensation\n• Skill Advisor for learning paths\n\nStart a session today: https://groupacademy.lovable.app/app/agents\n\nBest regards,\nGroUp Academy Team`,
  },
  portfolio: {
    name: "Portfolio",
    icon: "briefcase",
    color: "purple",
    template: (name: string) =>
      `Hi ${name}! 👋 I noticed your impressive experience. Have you created your digital portfolio yet?\n\nRecruiters spend only 6 seconds on a CV. A live portfolio website makes you stand out immediately.\n\n🎁 Limited offer: First 1000 requests are FREE!\n\nRequest yours here:\n👉 https://groupacademy.lovable.app/app/portfolio-request`,
    emailSubject: (name: string) => `${name}, stand out with a professional Portfolio Website 🎨`,
    emailTemplate: (name: string) =>
      `Hi ${name},\n\nRecruiters spend seconds on a CV. We want to give you minutes of their attention. At GroUp Academy, we build stunning digital portfolios that highlight your work and achievements.\n\n🎁 Limited offer: 1,000 FREE spots available.\n\nSecure yours: https://groupacademy.lovable.app/app/portfolio-request`,
  },
  mock_interview: {
    name: "Mock Interview",
    icon: "mic",
    color: "green",
    template: (name: string, country?: string, jobTitle?: string) =>
      `Hi ${name}! 👋 Preparing for a role${jobTitle ? ` as a ${jobTitle}` : ""}?\n\nOur AI Interview Coach generates role-specific questions and provides instant feedback on your answers.\n\nAce your next interview:\n👉 https://groupacademy.lovable.app/app/mock-interview`,
    emailSubject: (name: string) => `${name}, practice for your next interview with AI 🎯`,
    emailTemplate: (name: string) =>
      `Hi ${name},\n\nAce your next interview with practice. Our AI tool provides:\n• Role-specific question sets\n• AI-generated feedback reports\n• Scorecards for improvement\n\nStart practicing: https://groupacademy.lovable.app/app/mock-interview`,
  },
  salary_analysis: {
    name: "Salary Analysis",
    icon: "banknote",
    color: "amber",
    template: (name: string) =>
      `Hi ${name}! 👋 Are you being paid what you're worth?\n\nOur AI Salary Analysis compares your profile against global market data to give you negotiation leverage.\n\nGet your report:\n👉 https://groupacademy.lovable.app/app/salary-analysis`,
    emailSubject: (name: string) => `${name}, know your true market value 💰`,
    emailTemplate: (name: string) =>
      `Hi ${name},\n\nDon't leave money on the table. Use our AI Salary Analysis to get data-backed negotiation tips based on your specific industry and years of experience.\n\nView benchmarking: https://groupacademy.lovable.app/app/salary-analysis`,
  },
  career_scorecard: {
    name: "Career Scorecard",
    icon: "clipboard-check",
    color: "teal",
    template: (name: string) =>
      `Hi ${name}! 👋 How career-ready are you really?\n\nTake our 5-minute AI Assessment and get a detailed PDF Scorecard of your strengths and gaps.\n\nTake the test:\n👉 https://groupacademy.lovable.app/app/career-assessment`,
    emailSubject: (name: string) => `${name}, check your Career Readiness Score 📊`,
    emailTemplate: (name: string) =>
      `Hi ${name},\n\nIdentify your professional blind spots. Take our 5-minute Career Readiness Assessment and receive a comprehensive PDF report.\n\nGet your score: https://groupacademy.lovable.app/app/career-assessment`,
  },
  course: {
    name: "Course",
    icon: "graduation-cap",
    color: "rose",
    template: (name: string, country?: string, courseName?: string) =>
      `Hi ${name}! 👋 Ready to upskill? Based on your profile, I recommend ${courseName ? `"${courseName}"` : "one of our AI-powered courses"}.\n\nEvery course includes a dedicated AI Instructor to answer your questions instantly.\n\nView Courses:\n👉 https://groupacademy.lovable.app/app/courses`,
    emailSubject: (name: string) => `${name}, start your learning journey 📚`,
    emailTemplate: (name: string, country?: string, courseName?: string) =>
      `Hi ${name},\n\nLearning never stops at GroUp Academy. We recommend exploring ${courseName ? `"${courseName}"` : "our latest courses"} to boost your market value.\n\nStart learning: https://groupacademy.lovable.app/app/courses`,
  },
};

export function getOutreachWhatsAppLink(
  phone: string,
  product: OutreachProduct,
  name: string,
  country?: string,
  extra?: string,
): string {
  const template = OUTREACH_TEMPLATES[product];
  const message = template.template(name, country, extra);
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function getOutreachEmailLink(
  email: string,
  product: OutreachProduct,
  name: string,
  country?: string,
  extra?: string,
): string {
  const template = OUTREACH_TEMPLATES[product];
  const subject = template.emailSubject?.(name) || `${template.name} — GroUp Academy`;
  const body = template.emailTemplate?.(name, country, extra) || template.template(name, country, extra);
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function getOutreachLinkedInMessage(
  product: OutreachProduct,
  name: string,
  country?: string,
  extra?: string,
): string {
  const template = OUTREACH_TEMPLATES[product];
  return template.linkedinTemplate?.(name, country, extra) || template.template(name, country, extra);
}

export function getFirstName(fullName: string): string {
  return fullName?.split(" ")[0] || "there";
}
