import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useGro10xCompanyId } from "@/gro10x/hooks/useGro10xCompanyId";

export default function Gro10xProjects() {
  const { data: companyId } = useGro10xCompanyId();
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", summary: "", budget_credits: 0, brief: "" });
  const [proposing, setProposing] = useState(false);
  const [proposed, setProposed] = useState<any[]>([]);

  const load = async () => {
    if (!companyId) return;
    const { data } = await supabase.rpc("get_company_project_pipeline", { _company_id: companyId });
    setPipeline((data as any) || []);
  };
  useEffect(() => { load(); }, [companyId]);

  const proposeMilestones = async () => {
    setProposing(true);
    const { data, error } = await supabase.functions.invoke("ai-project-scoper", {
      body: { brief: form.brief, budget_credits: form.budget_credits },
    });
    setProposing(false);
    if (error) { toast.error(error.message); return; }
    setProposed((data as any)?.milestones || []);
  };

  const createProject = async () => {
    if (!companyId) return;
    const { data: pid, error } = await supabase.rpc("create_gig_project", {
      _payload: { company_id: companyId, title: form.title, summary: form.summary, budget_credits: form.budget_credits },
    });
    if (error) { toast.error(error.message); return; }
    for (const m of proposed) {
      await supabase.rpc("add_project_milestone", { _project_id: pid as any, _payload: m });
    }
    toast.success("Project created");
    setOpen(false); setProposed([]); setForm({ title: "", summary: "", budget_credits: 0, brief: "" });
    load();
  };

  const fundProject = async (id: string) => {
    const { error } = await supabase.rpc("fund_gig_project", { _project_id: id });
    if (error) toast.error(error.message); else { toast.success("Funded"); load(); }
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Managed Projects</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm">New project</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create project</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <Textarea placeholder="Summary" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
              <Input type="number" placeholder="Budget (credits)" value={form.budget_credits} onChange={e => setForm({ ...form, budget_credits: Number(e.target.value) })} />
              <Textarea placeholder="Detailed brief — AI will propose milestones" value={form.brief} onChange={e => setForm({ ...form, brief: e.target.value })} rows={4} />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={proposeMilestones} disabled={proposing || !form.brief}>{proposing ? "Thinking…" : "Propose milestones"}</Button>
                <Button size="sm" onClick={createProject} disabled={!form.title || proposed.length === 0}>Create</Button>
              </div>
              {proposed.length > 0 && (
                <div className="space-y-1 mt-2">
                  {proposed.map((m: any, i: number) => (
                    <Card key={i} className="p-2 text-xs">
                      <div className="font-medium">{m.title}</div>
                      <div className="text-muted-foreground">{m.summary}</div>
                      <div className="text-muted-foreground">{m.budget_credits} cr</div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pipeline.length === 0 && <Card className="p-6 text-sm text-center text-muted-foreground">No projects yet.</Card>}
      {pipeline.map((row: any) => (
        <Card key={row.project.id} className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm">{row.project.title}</div>
            <Badge variant="outline" className="capitalize">{row.project.status}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Budget {row.project.budget_credits} · Held {row.escrow?.held_credits ?? 0} · Released {row.escrow?.released_credits ?? 0}
          </div>
          <div className="text-xs">{row.milestones.length} milestones</div>
          {row.project.status === "draft" && <Button size="sm" onClick={() => fundProject(row.project.id)}>Fund</Button>}
        </Card>
      ))}
    </div>
  );
}
