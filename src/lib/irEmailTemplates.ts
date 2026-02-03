/**
 * Investor Relations Email Templates
 */

export interface EmailTemplateVars {
  investorName: string;
  firmName?: string;
  founderName: string;
  companyName: string;
  mrr: string;
  mrrGrowth: string;
  users: string;
  countries?: string;
  roundType?: string;
  weekNumber?: string;
  highlights?: string[];
  challenges?: string[];
  plans?: string[];
  milestone?: string;
  milestoneDetails?: string;
  impact?: string[];
  customContext?: string;
}

export const IR_EMAIL_TEMPLATES = {
  introduction: {
    subject: 'Building the Future of Career Development in Emerging Markets',
    template: `Hi {{investorName}},

I'm {{founderName}}, founder of {{companyName}} - an AI-powered career development platform for emerging markets.

**Quick Stats:**
- MRR: {{mrr}} ({{mrrGrowth}} MoM)
- Users: {{users}} across {{countries}} countries
- Services: AI career assessments, mock interviews, salary analysis, job matching

We're building the career infrastructure for the next billion professionals in South Asia, MENA, and Southeast Asia.

{{customContext}}

Would you be open to a 15-minute call next week?

Best,
{{founderName}}`,
  },
  
  weekly_update: {
    subject: '{{companyName}} Weekly Update - Week {{weekNumber}}',
    template: `Hey {{investorName}},

Here's what happened this week at {{companyName}}:

📊 **Metrics**
- MRR: {{mrr}} ({{mrrGrowth}} vs last week)
- Active Users: {{users}}

🎯 **Progress**
{{#highlights}}
- {{.}}
{{/highlights}}

🚧 **Challenges**
{{#challenges}}
- {{.}}
{{/challenges}}

📅 **Next Week**
{{#plans}}
- {{.}}
{{/plans}}

{{customContext}}

Questions? Just reply!

Cheers,
{{founderName}}`,
  },
  
  special_update: {
    subject: '🎉 {{milestone}}: {{companyName}}',
    template: `Hi {{investorName}},

Excited to share some big news!

**{{milestone}}**

{{milestoneDetails}}

**What this means:**
{{#impact}}
- {{.}}
{{/impact}}

{{customContext}}

Thanks for being part of our journey.

Best,
{{founderName}}`,
  },
};

/**
 * Replace template variables with actual values
 */
export function fillTemplate(
  template: string,
  vars: Partial<EmailTemplateVars>
): string {
  let result = template;
  
  // Simple variable replacement
  Object.entries(vars).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
  });
  
  // Array handling (simplified mustache-like syntax)
  const arrayFields = ['highlights', 'challenges', 'plans', 'impact'];
  arrayFields.forEach((field) => {
    const value = vars[field as keyof EmailTemplateVars];
    if (Array.isArray(value)) {
      const regex = new RegExp(`\\{\\{#${field}\\}\\}([\\s\\S]*?)\\{\\{/${field}\\}\\}`, 'g');
      result = result.replace(regex, (_, itemTemplate) => {
        return value.map((item) => itemTemplate.replace('{{.}}', item)).join('\n');
      });
    }
  });
  
  // Clean up any remaining template tags
  result = result.replace(/\{\{#\w+\}\}[\s\S]*?\{\{\/\w+\}\}/g, '');
  result = result.replace(/\{\{\w+\}\}/g, '');
  
  return result.trim();
}

/**
 * Get template by type
 */
export function getEmailTemplate(
  type: 'introduction' | 'weekly_update' | 'special_update'
): { subject: string; template: string } {
  return IR_EMAIL_TEMPLATES[type];
}

/**
 * Get default company info for templates
 */
export function getDefaultCompanyInfo(): Pick<EmailTemplateVars, 'founderName' | 'companyName'> {
  return {
    founderName: 'Founder',
    companyName: 'GroUp Academy',
  };
}
