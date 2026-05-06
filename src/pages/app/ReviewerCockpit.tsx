import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Profile = {
  tier: string;
  status: string;
  accuracy: number;
  items_resolved: number;
  categories: string[];
};
type Assignment = {
  id: string;
  kind: string;
  source_id: string;
  status: string;
  due_at: string;
  offered_at: string;
  payout_credits: number;
  verdict?: string;
};

export default function ReviewerCockpit() {
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [active, setActive] = useState<Assignment | null>(null);
  const [brief, setBrief] = useState<string>("");
  const [verdict, setVerdict] = useState<string>("approve");
  const [rationale, setRationale] = useState("");
  const [confidence, setConfidence] = useState(0.8);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUid(user.id);
      const [p, a] = await Promise.all([
        supabase.from("reviewer_profiles").select("*").eq("talent_id", user.id).maybeSingle(),
        supabase.from("gig_review_assignments").select("*").eq("reviewer_id", user.id).order("offered_at", { ascending: false }).limit(50),
      ]);
      setProfile(p.data as any);
      setAssignments((a.data as any) || []);
      setLoading(false);
    })();
  }, []);

  const apply = async (cats: string[]) => {
    setWorking(true);
    const { error } = await supabase.rpc("apply_for_reviewer", { _categories: cats });
    setWorking(false);
    if (error) toast.error(error.message); else { toast.success("Application received. Take the calibration to activate."); location.reload(); }
  };

  const calibrate = async (passed: boolean) => {
    const score = passed ? 85 : 60;
    setWorking(true);
    const { error } = await supabase.rpc("submit_calibration_attempt", { _score: score, _answers: {} });
    setWorking(false);
    if (error) toast.error(error.message); else location.reload();
  };

  const claim = async (id: string) => {
    setWorking(true);
    const { data, error } = await supabase.rpc("claim_review_assignment", { _assignment_id: id });
    setWorking(false);
    if (error) { toast.error(error.message); return; }
    const r: any = data;
    if (!r?.ok) { toast.error(r?.error || "Claim failed"); return; }
    toast.success("Claimed");
    openItem(id);
  };

  const openItem = async (id: string) => {
    const a = assignments.find(x => x.id === id);
    if (!a) return;
    setActive(a);
    setBrief("Loading brief…");
    try {
      const { data } = await supabase.functions.invoke("ai-reviewer-brief", { body: { assignment_id: id } });
      setBrief((data as any)?.brief || "No brief available.");
    } catch { setBrief("No brief available."); }
  };

  const submitVerdict = async () => {
    if (!active) return;
    setWorking(true);
    const { error } = await supabase.rpc("submit_review_verdict", {
      _assignment_id: active.id, _verdict: verdict, _payload: {}, _confidence: confidence, _rationale: rationale,
    });
    setWorking(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Verdict submitted");
    setActive(null); setRationale("");
    location.reload();
  };

  if (loading) return <div className="p-6 flex justify-center"><Loader2 className="animate-spin" /></div>;

  if (!uid) return <div className="p-6">Please sign in.</div>;

  if (!profile) {
    return (
      <div className="p-4 space-y-3">
        <Card><CardHeader><CardTitle>Become a Reviewer</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Earn credits by adjudicating escalated gig submissions and disputes. Calibration required.</p>
            <Button disabled={working} onClick={() => apply(["content", "design", "development"])}>Apply now</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile.status !== "active") {
    return (
      <div className="p-4 space-y-3">
        <Card><CardHeader><CardTitle>Calibration</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Take a 5-item calibration. Pass to activate your reviewer account.</p>
            <div className="flex gap-2">
              <Button disabled={working} onClick={() => calibrate(true)}>Submit calibration (mock pass)</Button>
              <Button disabled={working} variant="outline" onClick={() => calibrate(false)}>Mock fail</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const offered = assignments.filter(a => a.status === "offered");
  const claimed = assignments.filter(a => a.status === "claimed");
  const history = assignments.filter(a => !["offered","claimed"].includes(a.status));

  return (
    <div className="p-3 space-y-3">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Reviewer · {profile.tier}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-2 text-xs">
          <div><div className="text-muted-foreground">Accuracy</div><div className="text-lg font-semibold">{profile.accuracy}%</div></div>
          <div><div className="text-muted-foreground">Items</div><div className="text-lg font-semibold">{profile.items_resolved}</div></div>
          <div><div className="text-muted-foreground">Status</div><Badge>{profile.status}</Badge></div>
        </CardContent>
      </Card>

      {active ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Adjudicate</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="bg-muted p-3 rounded text-xs whitespace-pre-wrap">{brief}</div>
            <div className="flex gap-2">
              {["approve","revise","reject"].map(v => (
                <Button key={v} size="sm" variant={verdict===v?"default":"outline"} onClick={() => setVerdict(v)}>{v}</Button>
              ))}
            </div>
            <Textarea placeholder="Rationale (visible to admin only)" value={rationale} onChange={e => setRationale(e.target.value)} />
            <div className="text-xs">Confidence: {confidence.toFixed(2)}
              <input type="range" min={0.5} max={1} step={0.05} value={confidence} onChange={e => setConfidence(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div className="flex gap-2">
              <Button disabled={working} onClick={submitVerdict}>Submit verdict</Button>
              <Button variant="outline" onClick={() => setActive(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="offered">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="offered">Offered ({offered.length})</TabsTrigger>
            <TabsTrigger value="claimed">Claimed ({claimed.length})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="offered" className="space-y-2">
            {offered.length === 0 && <p className="text-sm text-muted-foreground">No items offered.</p>}
            {offered.map(a => (
              <Card key={a.id}><CardContent className="p-3 flex items-center justify-between text-sm">
                <div><div className="font-medium">{a.kind}</div><div className="text-xs text-muted-foreground">due {new Date(a.due_at).toLocaleString()}</div></div>
                <Button size="sm" disabled={working} onClick={() => claim(a.id)}>Claim</Button>
              </CardContent></Card>
            ))}
          </TabsContent>
          <TabsContent value="claimed" className="space-y-2">
            {claimed.length === 0 && <p className="text-sm text-muted-foreground">Nothing claimed.</p>}
            {claimed.map(a => (
              <Card key={a.id}><CardContent className="p-3 flex items-center justify-between text-sm">
                <div><div className="font-medium">{a.kind}</div><div className="text-xs text-muted-foreground">due {new Date(a.due_at).toLocaleString()}</div></div>
                <Button size="sm" onClick={() => openItem(a.id)}>Open</Button>
              </CardContent></Card>
            ))}
          </TabsContent>
          <TabsContent value="history" className="space-y-2">
            {history.map(a => (
              <Card key={a.id}><CardContent className="p-3 flex items-center justify-between text-sm">
                <div><div className="font-medium">{a.kind}</div><div className="text-xs text-muted-foreground">{a.status}</div></div>
                <Badge variant="outline">{a.verdict || "—"}</Badge>
              </CardContent></Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
