import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getJobTitleById } from "@/domains/jobs/repo/jobsRepo";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import { ApplicationKanban } from "@/components/applications/ApplicationKanban";
import { GRO10X_MUTED } from "../../lib/tokens";

export default function Gro10xJobApplicants() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobTitle, setJobTitle] = useState("Job");
  const [showWithdrawn, setShowWithdrawn] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    void getJobTitleById(jobId).then((t) => t && setJobTitle(t));
  }, [jobId]);

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto pb-safe">
      <header className="sticky top-0 z-10 bg-[#0B1220]/95 backdrop-blur-md border-b border-white/5 px-3 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/gro10x/work")}
          className="rounded-full p-2 hover:bg-white/5"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{jobTitle}</p>
          <p className={`text-[11px] ${GRO10X_MUTED}`}>Application pipeline</p>
        </div>
        <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            checked={showWithdrawn}
            onChange={(e) => setShowWithdrawn(e.target.checked)}
          />
          Withdrawn
        </label>
      </header>

      <div className="px-3 py-3">
        <ApplicationKanban jobId={jobId} showWithdrawn={showWithdrawn} />
      </div>
    </div>
  );
}
