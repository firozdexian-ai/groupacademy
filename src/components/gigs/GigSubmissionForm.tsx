import { useTalent } from "@/hooks/useTalent";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Coins } from "lucide-react";
import { CVUploadGigForm } from "./CVUploadGigForm";
import { JobPostingGigForm } from "./JobPostingGigForm";
import { JobSharingGigForm } from "./JobSharingGigForm";
import { ContentCreationGigForm } from "./ContentCreationGigForm";
import { CourseResellGigForm } from "./CourseResellGigForm";

interface GigSubmissionFormProps {
  gig: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GigSubmissionForm({ gig, open, onOpenChange }: GigSubmissionFormProps) {
  const { talent } = useTalent();
  const queryClient = useQueryClient();

  const handleSubmitted = () => {
    queryClient.invalidateQueries({ queryKey: ["gig-submission-counts"] });
    queryClient.invalidateQueries({ queryKey: ["my-gig-submissions"] });
    onOpenChange(false);
  };

  if (!talent?.id) return null;

  const renderCategoryForm = () => {
    const props = { gig, talentId: talent.id, onSubmitted: handleSubmitted };

    switch (gig.category) {
      case "cv_upload":
        return <CVUploadGigForm {...props} />;
      case "job_posting":
        return <JobPostingGigForm {...props} />;
      case "job_sharing":
        return <JobSharingGigForm {...props} />;
      case "content_creation":
        return <ContentCreationGigForm {...props} />;
      case "course_resell":
        return <CourseResellGigForm {...props} />;
      default:
        return <CVUploadGigForm {...props} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${gig.category === "job_sharing" ? "max-w-lg" : "max-w-md"} max-h-[85vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{gig.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            Earn <Coins className="h-3.5 w-3.5 text-amber-500 inline" />{" "}
            <span className="font-semibold text-amber-600">{gig.credit_reward} credits</span>{" "}
            upon approval
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          {renderCategoryForm()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
