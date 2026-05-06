import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { PipelineApplication, PipelineStatus } from "@/hooks/useEmployerPipeline";
import { ApplicationMessageThread } from "./ApplicationMessageThread";
import { InterviewPanel } from "@/components/interviews/InterviewPanel";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const NEXT: { key: PipelineStatus; label: string; variant?: "default" | "secondary" | "destructive" }[] = [
  { key: "viewed", label: "Mark Reviewing", variant: "secondary" },
  { key: "shortlisted", label: "Shortlist", variant: "default" },
  { key: "sent_to_employer", label: "Interview", variant: "secondary" },
  { key: "hired", label: "Hire", variant: "default" },
  { key: "rejected", label: "Reject", variant: "destructive" },
];

interface Props {
  application: PipelineApplication | null;
  onClose: () => void;
  onMove: (to: PipelineStatus) => Promise<void>;
  onChanged: () => void;
  actorRole: "recruiter" | "admin";
}

export function ApplicationDetailSheet({ application, onClose, onMove, onChanged, actorRole }: Props) {
  const [moving, setMoving] = useState<PipelineStatus | null>(null);
  const [notes, setNotes] = useState(application?.cover_letter ?? "");

  if (!application) return null;

  const handleDownloadCv = async () => {
    if (!application.cv_url) return;
    try {
      const path = application.cv_url.includes("/talent-cvs/")
        ? application.cv_url.split("/talent-cvs/")[1]
        : application.cv_url;
      const { data, error } = await supabase.storage
        .from("talent-cvs")
        .createSignedUrl(path, 60 * 60);
      if (error || !data?.signedUrl) {
        toast.error("Could not generate CV link");
        return;
      }
      window.open(data.signedUrl, "_blank");
    } catch {
      toast.error("Could not download CV");
    }
  };

  const handleMove = async (to: PipelineStatus) => {
    setMoving(to);
    try {
      await onMove(to);
      toast.success(`Moved to ${to}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update status");
    } finally {
      setMoving(null);
    }
  };

  return (
    <Sheet open={!!application} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">
            {application.talent_name ?? "Anonymous"}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            {application.talent_headline} · applied for {application.job_title}
          </p>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="hire" className="flex-1">Hire</TabsTrigger>
            <TabsTrigger value="messages" className="flex-1">Messages</TabsTrigger>
            <TabsTrigger value="actions" className="flex-1">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 mt-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{application.application_status}</Badge>
              {typeof application.ai_match_score === "number" && (
                <Badge variant="secondary">{application.ai_match_score}% match</Badge>
              )}
            </div>
            {application.cover_letter && (
              <div>
                <p className="text-xs font-medium mb-1">Cover letter</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">
                  {application.cover_letter}
                </p>
              </div>
            )}
            {application.cv_url && (
              <Button variant="outline" size="sm" onClick={handleDownloadCv} className="w-full">
                <Download className="h-4 w-4 mr-2" /> Download CV
              </Button>
            )}
          </TabsContent>

          <TabsContent value="hire" className="mt-3">
            {application.company_id && application.talent_id ? (
              <InterviewPanel
                applicationId={application.id}
                companyId={application.company_id}
                talentId={application.talent_id}
                actorRole={actorRole}
              />
            ) : (
              <p className="text-xs text-muted-foreground">Missing context.</p>
            )}
          </TabsContent>

          <TabsContent value="messages" className="mt-3">
            <ApplicationMessageThread
              applicationId={application.id}
              actorRole={actorRole}
            />
          </TabsContent>

          <TabsContent value="actions" className="space-y-2 mt-3">
            {NEXT.filter((n) => n.key !== application.application_status).map((n) => (
              <Button
                key={n.key}
                variant={n.variant ?? "secondary"}
                className="w-full justify-start"
                disabled={!!moving}
                onClick={() => handleMove(n.key)}
              >
                {moving === n.key ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {n.label}
              </Button>
            ))}
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes (visible to recruiters only)"
              rows={3}
              className="mt-3"
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
