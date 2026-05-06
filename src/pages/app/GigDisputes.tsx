import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type Dispute = {
  id: string; gig_id: string; reason_code: string; status: string;
  final_verdict?: string | null; created_at: string; opened_by_role: string;
};

export default function GigDisputes() {
  const [items, setItems] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("gig_disputes").select("*").order("created_at", { ascending: false });
      setItems((data as any) || []);
      setLoading(false);
    })();
  }, []);
  if (loading) return <div className="p-6 flex justify-center"><Loader2 className="animate-spin" /></div>;
  return (
    <div className="p-3 space-y-2">
      <h2 className="text-lg font-semibold">My Disputes</h2>
      {items.length === 0 && <p className="text-sm text-muted-foreground">You haven't opened any disputes.</p>}
      {items.map(d => (
        <Card key={d.id}>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
            {d.reason_code} <Badge variant="outline">{d.status}</Badge>
          </CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div>Opened as: {d.opened_by_role}</div>
            <div>{new Date(d.created_at).toLocaleString()}</div>
            {d.final_verdict && <div>Verdict: <span className="font-medium">{d.final_verdict}</span></div>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
