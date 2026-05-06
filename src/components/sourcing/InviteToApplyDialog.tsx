import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { inviteToApply } from "@/hooks/useJobInvitations";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string;
  talentId: string;
}

export function InviteToApplyDialog({ open, onOpenChange, companyId, talentId }: Props) {
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [jobId, setJobId] = useState<string>("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !companyId) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("jobs")
        .select("id, title")
        .eq("company_id", companyId)
        .eq("status", "active")
        .limit(50);
      setJobs((data ?? []) as any);
    })();
  }, [open, companyId]);

  const submit = async () => {
    if (!jobId) { toast.error("Pick a job"); return; }
    setSaving(true);
    const id = await inviteToApply({ job_id: jobId, company_id: companyId, talent_id: talentId, note });
    setSaving(false);
    if (id) { toast.success("Invitation sent"); onOpenChange(false); }
    else toast.error("Could not send invitation");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Invite to apply</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Job</Label>
            <Select value={jobId} onValueChange={setJobId}>
              <SelectTrigger><SelectValue placeholder="Pick a job" /></SelectTrigger>
              <SelectContent>
                {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Personal note (optional)</Label>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button className="w-full" onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Send invitation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
