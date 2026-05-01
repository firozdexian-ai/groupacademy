/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as welcome } from './welcome.tsx'
import { template as serviceComplete } from './service-complete.tsx'
import { template as bidAccepted } from './bid-accepted.tsx'
import { template as creditReceipt } from './credit-receipt.tsx'
import { template as jobApplicationSent } from './job-application-sent.tsx'
import { template as jobApplicationEmployer } from './job-application-employer.tsx'
import { template as talentInvite } from './talent-invite.tsx'
import { template as investorUpdate } from './investor-update.tsx'
import { template as companyWelcome } from './company-welcome.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome': welcome,
  'service-complete': serviceComplete,
  'bid-accepted': bidAccepted,
  'credit-receipt': creditReceipt,
  'job-application-sent': jobApplicationSent,
  'job-application-employer': jobApplicationEmployer,
  'talent-invite': talentInvite,
  'investor-update': investorUpdate,
  'company-welcome': companyWelcome,
}
