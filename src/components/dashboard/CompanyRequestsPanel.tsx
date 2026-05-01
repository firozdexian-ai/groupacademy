import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Building2, Mail, Phone, Globe, MapPin } from "lucide-react";

type Request = {
  id: string;
  company_name: string;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  country: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  use_case: string | null;
  heard_from: string | null;
  status: string;
  created_at: string;
  rejection_reason: string | null;
  reviewed_at: string | null;
};

export function CompanyRequestsPanel() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [actioning, setActioning] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Request | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [viewing, setViewing] = useState<Request | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("company_onboarding_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    } else {
      setRequests((data || []) as Request[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = requests.filter((r) => r.status === tab);

  const handleApprove = async (req: Request) => {
    setActioning(req.id);
    try {
      const { error } = await supabase.functions.invoke("approve-company-onboarding", { body: { request_id: req.id } });
      if (error) throw error;
      toast({ title: "Approved", description: `${req.company_name} approved and contact pre-invited.` });
      load();
    } catch (e: any) {
      toast({ title: "Approval failed", description: e.message, variant: "destructive" });
    } finally { setActioning(null); }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActioning(rejectTarget.id);
    try {
      const { error } = await supabase.functions.invoke("reject-company-onboarding", { body: { request_id: rejectTarget.id, reason: rejectReason } });
      if (error) throw error;
      toast({ title: "Rejected" });
      setRejectTarget(null);
      setRejectReason("");
      load();
    } catch (e: any) {
      toast({ title: "Rejection failed", description: e.message, variant: "destructive" });
    } finally { setActioning(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Company Onboarding Requests</h2>
          <p className="text-sm text-muted-foreground">Review and approve B2B company access applications.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending <Badge variant="secondary" className="ml-2">{requests.filter(r => r.status === "pending").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No {tab} requests</CardContent></Card>
          ) : (
            filtered.map((req) => (
              <Card key={req.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                        <h3 className="font-semibold truncate">{req.company_name}</h3>
                        <Badge variant="outline" className="shrink-0">{req.company_size}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {req.country} · {req.industry}</div>
                        <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {req.contact_name} — {req.contact_email}</div>
                        <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {req.contact_phone}</div>
                        {req.website && <div className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> <a href={req.website} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{req.website}</a></div>}
                      </div>
                      {req.use_case && <p className="text-sm mt-2 line-clamp-2">{req.use_case}</p>}
                      <p className="text-xs text-muted-foreground mt-2">Submitted {new Date(req.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex md:flex-col gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setViewing(req)}>View</Button>
                      {req.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => handleApprove(req)} disabled={actioning === req.id} className="gap-1">
                            {actioning === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setRejectTarget(req)} disabled={actioning === req.id} className="gap-1">
                            <XCircle className="w-3 h-3" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectTarget?.company_name}?</DialogTitle>
            <DialogDescription>Optionally provide a reason. The applicant will be notified.</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason (optional)" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!!actioning}>Confirm reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.company_name}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div><strong>Industry:</strong> {viewing.industry}</div>
              <div><strong>Size:</strong> {viewing.company_size}</div>
              <div><strong>Country:</strong> {viewing.country}</div>
              <div><strong>Website:</strong> {viewing.website || "—"}</div>
              <div><strong>Contact:</strong> {viewing.contact_name}</div>
              <div><strong>Email:</strong> {viewing.contact_email}</div>
              <div><strong>Phone:</strong> {viewing.contact_phone}</div>
              <div><strong>Use case:</strong><br />{viewing.use_case || "—"}</div>
              <div><strong>Heard from:</strong> {viewing.heard_from || "—"}</div>
              {viewing.rejection_reason && <div><strong>Rejection reason:</strong> {viewing.rejection_reason}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CompanyRequestsPanel;
