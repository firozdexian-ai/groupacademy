import { useApplicationHireState } from "@/hooks/useInterviews";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Video, Phone, MapPin } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { ScheduleInterviewSheet } from "./ScheduleInterviewSheet";

interface Props {
  applicationId: string;
  companyId: string;
  talentId: string;
  actorRole: "talent" | "recruiter" | "admin";
}

export function InterviewPanel({ applicationId, companyId, talentId, actorRole }: Props) {
  const { interview, offer, reload, loading } = useApplicationHireState(applicationId);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (loading) return <div className="text-xs text-muted-foreground">Loading hire state…</div>;

  return (
    <div className="space-y-3">
      {/* Interview block */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Calendar className="h-4 w-4" /> Interview
            </div>
            {actorRole !== "talent" && (
              <Button size="sm" variant="outline" onClick={() => setSheetOpen(true)}>
                {interview ? "Reschedule" : "Schedule"}
              </Button>
            )}
          </div>
          {!interview ? (
            <p className="text-xs text-muted-foreground">No interview scheduled.</p>
          ) : (
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                {interview.mode === "video" && <Video className="h-3 w-3" />}
                {interview.mode === "phone" && <Phone className="h-3 w-3" />}
                {interview.mode === "onsite" && <MapPin className="h-3 w-3" />}
                <Badge variant="secondary" className="text-[10px]">{interview.status}</Badge>
              </div>
              {interview.selected_slot_id ? (
                <p className="font-medium">
                  {format(
                    new Date(interview.slots.find((s) => s.id === interview.selected_slot_id)!.starts_at),
                    "PPp",
                  )}
                </p>
              ) : actorRole === "talent" ? (
                <a
                  href={`/app/applications/${applicationId}/interview/${interview.id}`}
                  className="text-primary underline"
                >
                  Pick your time
                </a>
              ) : (
                <p className="text-muted-foreground">Awaiting candidate selection</p>
              )}
              {interview.meeting_link && interview.status === "confirmed" && (
                <a href={interview.meeting_link} target="_blank" rel="noreferrer" className="text-primary underline">
                  Join meeting
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offer block */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4" /> Offer
            </div>
            {actorRole !== "talent" && !offer && (
              <Button size="sm" variant="outline" asChild>
                <a href={`/gro10x/work/applications/${applicationId}/offer/new`}>Create</a>
              </Button>
            )}
          </div>
          {!offer ? (
            <p className="text-xs text-muted-foreground">No offer yet.</p>
          ) : (
            <div className="text-xs space-y-1">
              <p className="font-medium">{offer.title}</p>
              <p>
                {offer.currency} {Number(offer.base_amount).toLocaleString()}
                {offer.start_date && <> · starts {format(new Date(offer.start_date), "PP")}</>}
              </p>
              <Badge variant={offer.status === "accepted" ? "default" : "secondary"} className="text-[10px]">
                {offer.status}
              </Badge>
              {actorRole === "talent" && offer.status === "sent" && (
                <a
                  href={`/app/applications/${applicationId}/offer/${offer.id}`}
                  className="text-primary underline ml-2"
                >
                  Review offer →
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ScheduleInterviewSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        applicationId={applicationId}
        companyId={companyId}
        talentId={talentId}
        onCreated={reload}
      />
    </div>
  );
}
