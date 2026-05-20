import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Send, Sparkles, ShieldCheck, AlertCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { adminGigOps } from "@/domains/gigs/api/gigsApi";
import { getProjectRoomBundle, insertProjectMessage } from "@/domains/gigs/repo/gigsRepo";

// Production Type Definitions[cite: 8]
interface Project {
  id: string;
  title: string;
  status: string;
  budget_credits: number;
}

interface Milestone {
  id: string;
  seq: number;
  title: string;
  status: string;
  summary: string;
  budget_credits: number;
  due_at: string | null;
}

export default function ProjectRoom() {
  const { projectId } = useParams();
  const { talent } = useTalent();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [escrow, setEscrow] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const [submitNote, setSubmitNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Digital Workforce Anomaly Reporting
  const reportAnomaly = async (event: string, context: any) => {
    console.error(`[Digital Workforce Anomaly] ${event}`, context);
    try { await adminGigOps({ type: "project_room_error", event, context } as any); } catch {}
  };

  const load = async () => {
    if (!projectId) return;
    try {
      const { project: p, milestones: m, escrow: e, messages: msg } = await getProjectRoomBundle(projectId);
      setProject(p as Project);
      setMilestones((m as Milestone[]) || []);
      setEscrow(e);
      setMessages(msg || []);
    } catch (e) {
      await reportAnomaly("DataSyncError", { projectId, error: e });
      toast.error("Failed to sync project ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const sendMessage = async () => {
    if (!body.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("gig_project_messages").insert({
      project_id: projectId,
      sender_id: u.user!.id,
      body,
    });
    if (error) {
      await reportAnomaly("MessageDeliveryError", { error });
      toast.error("Delivery failed.");
    } else {
      setBody("");
      load();
    }
  };

  const submitMilestone = async (id: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("submit_milestone_deliverables", {
        _milestone_id: id,
        _payload: { note: submitNote, submitted_by: talent?.id },
      });
      if (error) throw error;
      toast.success("Deliverables synchronized.");
      setSubmitNote("");
      load();
    } catch (e) {
      await reportAnomaly("MilestoneSubmissionError", { id, error: e });
      toast.error("Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      </div>
    );
  if (!project) return <div className="p-4 text-sm">Project state not found.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-700">
      <header className="space-y-1">
        <h1 className="text-2xl font-black uppercase tracking-tighter italic">{project.title}</h1>
        <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground items-center">
          <Badge variant="outline" className="capitalize">
            {project.status}
          </Badge>
          <span>Budget: {project.budget_credits} cr</span>
          {escrow && <span className="flex gap-2">· Escrow: {escrow.held_credits} held</span>}
        </div>
      </header>

      <Tabs defaultValue="milestones" className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/30 rounded-2xl">
          <TabsTrigger value="milestones" className="font-black uppercase text-[10px] tracking-widest rounded-xl">
            Milestones
          </TabsTrigger>
          <TabsTrigger value="room" className="font-black uppercase text-[10px] tracking-widest rounded-xl">
            Project Room
          </TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="space-y-4 mt-6">
          {milestones.map((m) => (
            <Card key={m.id} className="rounded-3xl border-2 border-border/40 bg-card/30 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-black text-sm uppercase italic">
                    {m.seq}. {m.title}
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {m.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground italic">{m.summary}</p>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {m.budget_credits} cr {m.due_at && `· due ${new Date(m.due_at).toLocaleDateString()}`}
                </div>
                {(m.status === "in_progress" || m.status === "revising") && (
                  <div className="space-y-3 pt-2 border-t border-border/10">
                    <Textarea
                      value={submitNote}
                      onChange={(e) => setSubmitNote(e.target.value)}
                      placeholder="Attach deliverable notes or artifacts…"
                      className="rounded-xl bg-background/50"
                    />
                    <Button
                      size="sm"
                      className="w-full rounded-xl font-black uppercase text-[10px] tracking-widest"
                      onClick={() => submitMilestone(m.id)}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="animate-spin h-3 w-3 mr-2" />
                      ) : (
                        <ShieldCheck className="h-3 w-3 mr-2" />
                      )}
                      Sync Deliverables
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="room" className="mt-6 space-y-4">
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-muted/30 p-4 rounded-2xl border border-border/40 text-sm">
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="italic font-medium">{msg.body}</div>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center italic">No message nodes.</p>
            )}
          </div>
          <div className="flex gap-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type communication node…"
              className="rounded-2xl"
              rows={2}
            />
            <Button size="icon" className="rounded-2xl shrink-0" onClick={sendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
