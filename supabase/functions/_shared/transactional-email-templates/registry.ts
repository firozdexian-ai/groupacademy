import { JSX } from "https://esm.sh/react@18.2.0";
import WelcomeEmail from "./welcome.tsx";
import JobApplicationEmployer from "./job-application-employer.tsx";
import JobApplicationSent from "./job-application-sent.tsx";
import ServiceCompleteEmail from "./service-complete.tsx";
import BidAcceptedEmail from "./bid-accepted.tsx";
import CreditReceiptEmail from "./credit-receipt.tsx";
import TalentInviteEmail from "./talent-invite.tsx";
import InvestorUpdateEmail from "./investor-update.tsx";

export interface TemplateEntry {
  subject: string | ((data: any) => string);
  component: (data: any) => JSX.Element;
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  welcome: {
    subject: "Welcome to GroUp Academy! 🎉",
    component: (data) => WelcomeEmail(data),
  },
  "service-complete": {
    subject: (data) => `Your ${data.service_name} results are ready ✅`,
    component: (data) => ServiceCompleteEmail(data),
  },
  "bid-accepted": {
    subject: "Your gig submission was approved! 🏆",
    component: (data) => BidAcceptedEmail(data),
  },
  "credit-receipt": {
    subject: "Credit transaction receipt 🧾",
    component: (data) => CreditReceiptEmail(data),
  },
  "job-application-sent": {
    subject: "Application submitted successfully",
    component: (data) => JobApplicationSent(data),
  },
  "job-application-employer": {
    subject: (data) => `New application for ${data.job_title}`,
    component: (data) => JobApplicationEmployer(data),
  },
  "talent-invite": {
    subject: "You've been invited to GroUp Academy",
    component: (data) => TalentInviteEmail(data),
  },
  "investor-update": {
    subject: (data) => data.subject || "GroUp Academy Investor Update",
    component: (data) => InvestorUpdateEmail(data),
  },
};
