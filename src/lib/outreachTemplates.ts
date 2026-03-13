// Centralized WhatsApp outreach message templates for GroUp Academy products

export type OutreachProduct = 
  | 'welcome' 
  | 'portfolio' 
  | 'mock_interview' 
  | 'salary_analysis' 
  | 'career_scorecard' 
  | 'course';

export type OutreachChannel = 'whatsapp' | 'email' | 'linkedin';

export interface OutreachTemplate {
  name: string;
  icon: string;
  color: string;
  template: (name: string, extra?: string) => string;
  emailSubject?: (name: string) => string;
  emailTemplate?: (name: string, extra?: string) => string;
  linkedinTemplate?: (name: string, extra?: string) => string;
}

export const OUTREACH_TEMPLATES: Record<OutreachProduct, OutreachTemplate> = {
  welcome: {
    name: 'Welcome',
    icon: 'hand',
    color: 'blue',
    template: (name: string) => 
      `Hi ${name}! 👋\n\nWelcome to GroUp Academy - your global career acceleration partner!\n\nI'm your Talent Success Executive. Whether you're in Bangladesh, the Middle East, or anywhere in the world - we're here to help you grow professionally. 🌍\n\nGet started with our AI-powered tools:\n✅ Digital Portfolio Creation\n✅ AI Mock Interviews\n✅ Salary Analysis\n✅ Career Readiness Scorecard\n\nReady to accelerate your career? Just reply here!\n\n- GroUp Academy 🚀`,
    emailSubject: (name: string) => `${name}, Welcome to GroUp Academy! 🚀`,
    emailTemplate: (name: string) =>
      `Hi ${name},\n\nWelcome to GroUp Academy — your global career acceleration partner!\n\nWhether you're in Bangladesh, the Middle East, or anywhere in the world, we're here to help you grow professionally.\n\nGet started with our AI-powered tools:\n• Digital Portfolio Creation\n• AI Mock Interviews\n• Salary Analysis\n• Career Readiness Scorecard\n\nSign up and explore: https://groupacademy.lovable.app/auth\n\nBest regards,\nGroUp Academy Team`,
    linkedinTemplate: (name: string) =>
      `Hi ${name}! 👋\n\nI'm reaching out from GroUp Academy — we're building an AI-powered career platform with tools like digital portfolios, mock interviews, and salary analysis.\n\nI'd love for you to check it out: https://groupacademy.lovable.app\n\nLooking forward to connecting!`,
  },
  portfolio: {
    name: 'Portfolio',
    icon: 'briefcase',
    color: 'purple',
    template: (name: string) => 
      `Hi ${name}! 👋\n\nI noticed you have an impressive background! Have you ever thought about creating a professional digital portfolio to showcase your work?\n\nAt GroUp Academy, we help professionals like you create stunning portfolio websites that:\n✨ Highlight your achievements\n✨ Showcase your projects\n✨ Make you stand out to recruiters\n\n🎁 Special offer: First 1000 portfolios are FREE!\n\nWould you like me to help you create yours?\n\n👉 https://groupacademy.lovable.app/app/portfolio-request\n\n- Your Talent Success Executive, GroUp Academy`,
    emailSubject: (name: string) => `${name}, get your FREE digital portfolio 🎨`,
    emailTemplate: (name: string) =>
      `Hi ${name},\n\nI noticed you have an impressive background! Have you ever thought about creating a professional digital portfolio?\n\nAt GroUp Academy, we help professionals create stunning portfolio websites that:\n• Highlight your achievements\n• Showcase your projects\n• Make you stand out to recruiters\n\nSpecial offer: First 1000 portfolios are FREE!\n\nCreate yours here: https://groupacademy.lovable.app/app/portfolio-request\n\nBest regards,\nGroUp Academy Team`,
    linkedinTemplate: (name: string) =>
      `Hi ${name}! I noticed your impressive background and wanted to reach out. We're offering FREE professional digital portfolio websites at GroUp Academy. Would you be interested? Check it out: https://groupacademy.lovable.app/app/portfolio-request`,
  },
  mock_interview: {
    name: 'Mock Interview',
    icon: 'mic',
    color: 'green',
    template: (name: string, jobTitle?: string) => 
      `Hi ${name}! 👋\n\n${jobTitle ? `I see you're interested in ${jobTitle} roles! ` : ''}Preparing for interviews can be nerve-wracking, but practice makes perfect!\n\nOur AI Mock Interview tool can help you:\n🎯 Practice with real interview questions\n💡 Get instant feedback on your answers\n📊 Identify areas for improvement\n\nWant to give it a try?\n\n👉 https://groupacademy.lovable.app/app/mock-interview\n\n- Your Talent Success Executive, GroUp Academy`,
    emailSubject: (name: string) => `${name}, ace your next interview with AI practice 🎯`,
    emailTemplate: (name: string, jobTitle?: string) =>
      `Hi ${name},\n\n${jobTitle ? `I see you're interested in ${jobTitle} roles! ` : ''}Our AI Mock Interview tool helps you:\n• Practice with real interview questions\n• Get instant feedback on your answers\n• Identify areas for improvement\n\nTry it here: https://groupacademy.lovable.app/app/mock-interview\n\nBest regards,\nGroUp Academy Team`,
    linkedinTemplate: (name: string) =>
      `Hi ${name}! Preparing for interviews? Our AI Mock Interview tool gives you real-time feedback and personalized coaching. Try it free: https://groupacademy.lovable.app/app/mock-interview`,
  },
  salary_analysis: {
    name: 'Salary Analysis',
    icon: 'banknote',
    color: 'amber',
    template: (name: string) => 
      `Hi ${name}! 👋\n\nAre you wondering if you're being paid fairly for your skills and experience?\n\nOur AI Salary Analysis tool can help you:\n💰 Know your market value\n📈 Identify skills that increase earning potential\n🤝 Get negotiation tips\n\nUpload your CV and job description to get a personalized salary report!\n\n👉 https://groupacademy.lovable.app/app/salary-analysis\n\n- Your Talent Success Executive, GroUp Academy`,
    emailSubject: (name: string) => `${name}, are you being paid fairly? 💰`,
    emailTemplate: (name: string) =>
      `Hi ${name},\n\nAre you wondering if you're being paid fairly?\n\nOur AI Salary Analysis tool helps you:\n• Know your market value\n• Identify skills that increase earning potential\n• Get negotiation tips\n\nGet your personalized report: https://groupacademy.lovable.app/app/salary-analysis\n\nBest regards,\nGroUp Academy Team`,
    linkedinTemplate: (name: string) =>
      `Hi ${name}! Wondering if you're being paid fairly? Our AI Salary Analysis tool can show you your market value and negotiation tips. Check it out: https://groupacademy.lovable.app/app/salary-analysis`,
  },
  career_scorecard: {
    name: 'Career Scorecard',
    icon: 'clipboard-check',
    color: 'teal',
    template: (name: string) => 
      `Hi ${name}! 👋\n\nWant to know how career-ready you are?\n\nTake our FREE Career Readiness Scorecard and get:\n📊 Your career readiness score\n💪 Strengths analysis\n🎯 Personalized improvement recommendations\n📄 Downloadable PDF report\n\nIt only takes 5 minutes!\n\n👉 https://groupacademy.lovable.app/app/career-assessment\n\n- Your Talent Success Executive, GroUp Academy`,
    emailSubject: (name: string) => `${name}, how career-ready are you? Take the FREE scorecard 📊`,
    emailTemplate: (name: string) =>
      `Hi ${name},\n\nWant to know how career-ready you are?\n\nTake our FREE Career Readiness Scorecard:\n• Your career readiness score\n• Strengths analysis\n• Personalized improvement recommendations\n• Downloadable PDF report\n\nIt only takes 5 minutes: https://groupacademy.lovable.app/app/career-assessment\n\nBest regards,\nGroUp Academy Team`,
    linkedinTemplate: (name: string) =>
      `Hi ${name}! Want to know how career-ready you are? Take our FREE 5-minute Career Scorecard and get a personalized PDF report: https://groupacademy.lovable.app/app/career-assessment`,
  },
  course: {
    name: 'Course',
    icon: 'graduation-cap',
    color: 'rose',
    template: (name: string, courseName?: string) => 
      `Hi ${name}! 👋\n\nBased on your profile, I think you'd really benefit from ${courseName ? `"${courseName}"` : 'one of our courses'}!\n\nOur courses feature:\n📚 Industry-relevant curriculum\n🤖 AI-powered learning assistant\n📜 Certificate upon completion\n\nWould you like to know more?\n\n👉 https://groupacademy.lovable.app/app/courses\n\n- Your Talent Success Executive, GroUp Academy`,
    emailSubject: (name: string) => `${name}, upskill with GroUp Academy courses 📚`,
    emailTemplate: (name: string, courseName?: string) =>
      `Hi ${name},\n\nBased on your profile, I think you'd really benefit from ${courseName ? `"${courseName}"` : 'our courses'}!\n\nOur courses feature:\n• Industry-relevant curriculum\n• AI-powered learning assistant\n• Certificate upon completion\n\nExplore courses: https://groupacademy.lovable.app/app/courses\n\nBest regards,\nGroUp Academy Team`,
    linkedinTemplate: (name: string) =>
      `Hi ${name}! I think you'd benefit from our AI-powered courses at GroUp Academy. Industry-relevant content + certificates. Check them out: https://groupacademy.lovable.app/app/courses`,
  }
};

export function getOutreachWhatsAppLink(
  phone: string, 
  product: OutreachProduct, 
  name: string, 
  extra?: string
): string {
  const template = OUTREACH_TEMPLATES[product];
  const message = template.template(name, extra);
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function getOutreachEmailLink(
  email: string,
  product: OutreachProduct,
  name: string,
  extra?: string
): string {
  const template = OUTREACH_TEMPLATES[product];
  const subject = template.emailSubject?.(name) || `${template.name} — GroUp Academy`;
  const body = template.emailTemplate?.(name, extra) || template.template(name, extra);
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function getOutreachLinkedInMessage(
  product: OutreachProduct,
  name: string,
  extra?: string
): string {
  const template = OUTREACH_TEMPLATES[product];
  return template.linkedinTemplate?.(name, extra) || template.template(name, extra);
}

export function getFirstName(fullName: string): string {
  return fullName?.split(' ')[0] || 'there';
}
