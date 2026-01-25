// Centralized WhatsApp outreach message templates for GroUp Academy products

export type OutreachProduct = 
  | 'welcome' 
  | 'portfolio' 
  | 'mock_interview' 
  | 'salary_analysis' 
  | 'career_scorecard' 
  | 'course';

export interface OutreachTemplate {
  name: string;
  icon: string;
  color: string;
  template: (name: string, extra?: string) => string;
}

export const OUTREACH_TEMPLATES: Record<OutreachProduct, OutreachTemplate> = {
  welcome: {
    name: 'Welcome',
    icon: 'hand',
    color: 'blue',
    template: (name: string) => 
      `Hi ${name}! 👋\n\nWelcome to GroUp Academy - your global career acceleration partner!\n\nI'm your Talent Success Executive. Whether you're in Bangladesh, the Middle East, or anywhere in the world - we're here to help you grow professionally. 🌍\n\nGet started with our AI-powered tools:\n✅ Digital Portfolio Creation\n✅ AI Mock Interviews\n✅ Salary Analysis\n✅ Career Readiness Scorecard\n\nReady to accelerate your career? Just reply here!\n\n- GroUp Academy 🚀`
  },
  portfolio: {
    name: 'Portfolio',
    icon: 'briefcase',
    color: 'purple',
    template: (name: string) => 
      `Hi ${name}! 👋\n\nI noticed you have an impressive background! Have you ever thought about creating a professional digital portfolio to showcase your work?\n\nAt GroUp Academy, we help professionals like you create stunning portfolio websites that:\n✨ Highlight your achievements\n✨ Showcase your projects\n✨ Make you stand out to recruiters\n\n🎁 Special offer: First 1000 portfolios are FREE!\n\nWould you like me to help you create yours?\n\n👉 https://groupacademy.lovable.app/app/portfolio-request\n\n- Your Talent Success Executive, GroUp Academy`
  },
  mock_interview: {
    name: 'Mock Interview',
    icon: 'mic',
    color: 'green',
    template: (name: string, jobTitle?: string) => 
      `Hi ${name}! 👋\n\n${jobTitle ? `I see you're interested in ${jobTitle} roles! ` : ''}Preparing for interviews can be nerve-wracking, but practice makes perfect!\n\nOur AI Mock Interview tool can help you:\n🎯 Practice with real interview questions\n💡 Get instant feedback on your answers\n📊 Identify areas for improvement\n\nWant to give it a try?\n\n👉 https://groupacademy.lovable.app/app/mock-interview\n\n- Your Talent Success Executive, GroUp Academy`
  },
  salary_analysis: {
    name: 'Salary Analysis',
    icon: 'banknote',
    color: 'amber',
    template: (name: string) => 
      `Hi ${name}! 👋\n\nAre you wondering if you're being paid fairly for your skills and experience?\n\nOur AI Salary Analysis tool can help you:\n💰 Know your market value\n📈 Identify skills that increase earning potential\n🤝 Get negotiation tips\n\nUpload your CV and job description to get a personalized salary report!\n\n👉 https://groupacademy.lovable.app/app/salary-analysis\n\n- Your Talent Success Executive, GroUp Academy`
  },
  career_scorecard: {
    name: 'Career Scorecard',
    icon: 'clipboard-check',
    color: 'teal',
    template: (name: string) => 
      `Hi ${name}! 👋\n\nWant to know how career-ready you are?\n\nTake our FREE Career Readiness Scorecard and get:\n📊 Your career readiness score\n💪 Strengths analysis\n🎯 Personalized improvement recommendations\n📄 Downloadable PDF report\n\nIt only takes 5 minutes!\n\n👉 https://groupacademy.lovable.app/app/career-assessment\n\n- Your Talent Success Executive, GroUp Academy`
  },
  course: {
    name: 'Course',
    icon: 'graduation-cap',
    color: 'rose',
    template: (name: string, courseName?: string) => 
      `Hi ${name}! 👋\n\nBased on your profile, I think you'd really benefit from ${courseName ? `"${courseName}"` : 'one of our courses'}!\n\nOur courses feature:\n📚 Industry-relevant curriculum\n🤖 AI-powered learning assistant\n📜 Certificate upon completion\n\nWould you like to know more?\n\n👉 https://groupacademy.lovable.app/app/courses\n\n- Your Talent Success Executive, GroUp Academy`
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

export function getFirstName(fullName: string): string {
  return fullName?.split(' ')[0] || 'there';
}
