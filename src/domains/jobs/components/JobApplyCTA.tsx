import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Copy, LogIn, Mail } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ExternalApplicationPrep } from "@/domains/jobs/components/ExternalApplicationPrep";
import { safeReturnTo } from "@/lib/safeReturnTo";

export interface JobApplyCTAJob {
  id: string;
  title: string;
  company_name: string;
  application_type: string;
  application_url: string | null;
  application_email: string | null;
  ai_assessment_enabled?: boolean;
}

export interface JobApplyCTAExistingApplication {
  id: string;
  application_status: string;
  assessment_id?: string;
  assessment_status?: string;
}

interface Props {
  job: JobApplyCTAJob;
  existingApplication?: JobApplyCTAExistingApplication | null;
  deadlinePassed?: boolean;
  authMode: "in-app" | "public";
  size?: "default" | "lg";
  className?: string;
}

/**
 * Unified apply CTA. Picks the right branch based on application_type and
 * existing application state. Used in both /app/jobs/:id and public /jobs/:id.
 */
export function JobApplyCTA({
  job,
  existingApplication,
  deadlinePassed,
  authMode,
  size = "lg",
  className,
}: Props) {
  const navigate = useNavigate();
  const [externalOpen, setExternalOpen] = React.useState(false);

  // Deadline closed → disabled
  if (deadlinePassed) {
    return (
      <Button size={size} disabled className={cn("font-semibold", className)}>
        Closed
      </Button>
    );
  }

  // Public viewer → route through auth with safe return
  if (authMode === "public") {
    const returnTo = safeReturnTo(`/app/jobs/${job.id}/apply`) ?? `/app/jobs/${job.id}`;
    return (
      <Button
        size={size}
        className={cn("font-semibold gap-2", className)}
        onClick={() => {
          sessionStorage.setItem("post_auth_redirect", returnTo);
          navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`);
        }}
      >
        <LogIn className="h-4 w-4" /> Sign in to apply
      </Button>
    );
  }

  // Already applied → view application / resume assessment
  if (existingApplication) {
    const needsAssessment =
      job.ai_assessment_enabled && existingApplication.assessment_status !== "completed";
    const label = needsAssessment ? "Resume assessment" : "View application";
    const onClick = () => {
      if (needsAssessment && existingApplication.assessment_id) {
        navigate(`/app/job-assessment/${existingApplication.assessment_id}`);
      } else {
        navigate(`/app/applications/${existingApplication.id}`);
      }
    };
    return (
      <Button size={size} onClick={onClick} className={cn("font-semibold gap-2", className)}>
        {label} <ArrowRight className="h-4 w-4" />
      </Button>
    );
  }

  // Email application
  if (job.application_type === "email" && job.application_email) {
    const subject = encodeURIComponent(`Application: ${job.title}`);
    const mailto = `mailto:${job.application_email}?subject=${subject}`;
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button size={size} asChild className="font-semibold gap-2">
          <a href={mailto}>
            <Mail className="h-4 w-4" /> Email application
          </a>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            navigator.clipboard.writeText(job.application_email!);
            toast.success("Email copied");
          }}
          title="Copy email address"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // External link
  if (job.application_type === "link" && job.application_url) {
    return (
      <>
        <Button
          size={size}
          onClick={() => setExternalOpen(true)}
          className={cn("font-semibold gap-2", className)}
        >
          Apply on company site <ArrowRight className="h-4 w-4" />
        </Button>
        {externalOpen && (
          <ExternalApplicationPrep
            open={externalOpen}
            onOpenChange={setExternalOpen}
            jobId={job.id}
            applicationUrl={job.application_url}
            jobTitle={job.title}
            companyName={job.company_name}
          />
        )}
      </>
    );
  }

  // Default: in-app application
  return (
    <Button
      size={size}
      onClick={() => navigate(`/app/jobs/${job.id}/apply`)}
      className={cn("font-semibold gap-2", className)}
    >
      Apply now <ArrowRight className="h-4 w-4" />
    </Button>
  );
}
