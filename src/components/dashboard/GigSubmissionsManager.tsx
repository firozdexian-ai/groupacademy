import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Eye, Coins } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export function GigSubmissionsManager() {
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["admin-gig-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gig_submissions")
        .select("*, gigs(title, credit_reward, category), talents(full_name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const { data, error } = await supabase.rpc("award_gig_credits", {
        p_submission_id: submissionId,
        p_admin_notes: adminNotes || null,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Failed to approve");
      return result;
    },
    onSuccess: (data) => {
      toast.success(`Approved! ${data.credits_awarded} credits awarded.`);
      queryClient.invalidateQueries({ queryKey: ["admin-gig-submissions"] });
      setSelectedSubmission(null);
      setAdminNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const { data, error } = await supabase.rpc("reject_gig_submission", {
        p_submission_id: submissionId,
        p_admin_notes: adminNotes || null,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Failed to reject");
    },
    onSuccess: () => {
      toast.success("Submission rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin-gig-submissions"] });
      setSelectedSubmission(null);
      setAdminNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const pendingSubmissions = submissions?.filter((s: any) => s.status === "pending") || [];
  const processedSubmissions = submissions?.filter((s: any) => s.status !== "pending") || [];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Gig Submissions</h2>

      {/* Pending Queue */}
      <div>
        <h3 className="font-semibold text-sm mb-2">
          Pending Review ({pendingSubmissions.length})
        </h3>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Talent</TableHead>
                <TableHead>Gig</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No pending submissions
                  </TableCell>
                </TableRow>
              ) : (
                pendingSubmissions.map((sub: any) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{sub.talents?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{sub.talents?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{sub.gigs?.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{sub.gigs?.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Coins className="h-3.5 w-3.5 text-amber-500" />
                        {sub.gigs?.credit_reward}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(sub.created_at), "MMM d")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setAdminNotes("");
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-green-600"
                          onClick={() => approveMutation.mutate(sub.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => rejectMutation.mutate(sub.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Processed */}
      {processedSubmissions.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-2">Processed ({processedSubmissions.length})</h3>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Talent</TableHead>
                  <TableHead>Gig</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedSubmissions.slice(0, 50).map((sub: any) => (
                  <TableRow key={sub.id}>
                    <TableCell className="text-sm">{sub.talents?.full_name}</TableCell>
                    <TableCell className="text-sm">{sub.gigs?.title}</TableCell>
                    <TableCell>
                      <Badge variant={sub.status === "approved" ? "default" : "destructive"}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{sub.credits_awarded || "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {sub.reviewed_at ? format(new Date(sub.reviewed_at), "MMM d") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={(o) => !o && setSelectedSubmission(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">{selectedSubmission.talents?.full_name}</p>
                <p className="text-xs text-muted-foreground">{selectedSubmission.talents?.email}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Gig</Label>
                <p className="text-sm font-medium">{selectedSubmission.gigs?.title}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Submission Data</Label>
                <pre className="text-xs bg-muted p-3 rounded mt-1 whitespace-pre-wrap">
                  {JSON.stringify(selectedSubmission.submission_data, null, 2)}
                </pre>
              </div>
              <div className="space-y-2">
                <Label>Admin Notes (optional)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Feedback for the user..."
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-1"
                  onClick={() => approveMutation.mutate(selectedSubmission.id)}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-1"
                  onClick={() => rejectMutation.mutate(selectedSubmission.id)}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
