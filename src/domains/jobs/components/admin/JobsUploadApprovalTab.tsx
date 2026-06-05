import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPendingApprovalJobs, updateJob } from "@/domains/jobs/repo/jobsRepo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function JobsUploadApprovalTab() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["jobs-pending-approval"],
    queryFn: () => listPendingApprovalJobs(),
  });

  const setActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await updateJob(id, { is_active });
    },
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["jobs-pending-approval"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rows = list.data ?? [];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Jobs Upload & Approval</h2>
        <p className="text-sm text-muted-foreground">
          Inactive (pending) jobs awaiting moderation. Approve to publish or keep inactive.
        </p>
      </div>
      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No jobs awaiting approval.</Card>
      ) : (
        <div className="grid gap-2">
          {rows.map((j) => (
            <Card key={j.id} className="p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">{j.title}</p>
                  <Badge variant="outline" className="text-[10px]">inactive</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {j.company_name ?? "—"} · {j.location ?? ""}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" title="Approve & publish"
                  onClick={() => setActive.mutate({ id: j.id, is_active: true })}>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </Button>
                <Button size="sm" variant="ghost" title="Keep inactive"
                  onClick={() => setActive.mutate({ id: j.id, is_active: false })}>
                  <XCircle className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
