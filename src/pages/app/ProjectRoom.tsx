import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useTalent } from "@/hooks/useTalent";

export default function ProjectRoom() {
  const { projectId } = useParams();
  const { talent } = useTalent();
  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [escrow, setEscrow] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const [submitNote, setSubmitNote] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!projectId) return;
    const [{ data: p }, { data: m }, { data: e }, { data: msg }] = await Promise.all([
      supabase.from("gig_projects").select("*").eq("id", projectId).maybeSingle(),
      supabase.from("gig_project_milestones").select("*").eq("project_id", projectId).order("seq"),
      supabase.from("gig_escrow_accounts").select("*").eq("project_id", projectId).maybeSingle(),
      supabase.from("gig_project_messages").select("*").eq("project_id", projectId).order("created_at"),
    ]);
    setProject(p); setMilestones(m || []); setEscrow(e); setMessages(msg || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [projectId]);

  const sendMessage = async () => {
    if (!body.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("gig_project_messages").insert({
      project_id: projectId, sender_id: u.user!.id, body,
    });
    if (error) toast.error(error.message); else { setBody(""); load(); }
  };

  const submitMilestone = async (id: string) => {
    const { error } = await supabase.rpc("submit_milestone_deliverables", {
      _milestone_id: id,
      _payload: { note: submitNote, submitted_by: talent?.id },
    });
    if (error) toast.error(error.message); else { toast.success("Submitted"); setSubmitNote(""); load(); }
  };

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  if (!project) return <div className="p-4 text-sm">Project not found.</div>;

  return (
    <div className="p-3 space-y-3">
      <div>
        <h1 className="text-lg font-semibold">{project.title}</h1>
        <div className="flex gap-2 text-xs text-muted-foreground items-center">
          <Badge variant="outline" className="capitalize">{project.status}</Badge>
          <span>Budget {project.budget_credits} cr</span>
          {escrow && <>
            <span>·</span><span>Held {escrow.held_credits}</span>
            <span>·</span><span>Released {escrow.released_credits}</span>
          </>}
        </div>
      </div>

      <Tabs defaultValue="milestones">
        <TabsList>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="room">Room</TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="space-y-2 mt-3">
          {milestones.map((m) => (
            <Card key={m.id} className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{m.seq}. {m.title}</div>
                <Badge variant="outline" className="capitalize">{m.status}</Badge>
              </div>
              {m.summary && <p className="text-xs text-muted-foreground">{m.summary}</p>}
              <div className="text-xs text-muted-foreground">{m.budget_credits} cr {m.due_at && `· due ${new Date(m.due_at).toLocaleDateString()}`}</div>
              {(m.status === "in_progress" || m.status === "revising") && (
                <div className="space-y-2">
                  <Textarea value={submitNote} onChange={(e) => setSubmitNote(e.target.value)} placeholder="Notes / links to your deliverable" rows={2} />
                  <Button size="sm" onClick={() => submitMilestone(m.id)}>Submit deliverable</Button>
                </div>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="room" className="mt-3 space-y-2">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.map((msg) => (
              <Card key={msg.id} className="p-2 text-sm">
                <div className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</div>
                <div>{msg.body}</div>
              </Card>
            ))}
            {messages.length === 0 && <p className="text-sm text-muted-foreground text-center">No messages yet.</p>}
          </div>
          <div className="space-y-2">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message…" rows={2} />
            <Button size="sm" onClick={sendMessage}>Send</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
