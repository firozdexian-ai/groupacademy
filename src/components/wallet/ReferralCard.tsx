import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Gift, Users } from "lucide-react";
import { toast } from "sonner";

export function ReferralCard() {
  const [refCode, setRefCode] = useState<string | null>(null);
  const [stats, setStats] = useState({ invited: 0, earned: 0 });

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: me } = await supabase.from("talents").select("id, ref_code").eq("user_id", u.user.id).maybeSingle();
      if (!me) return;
      setRefCode(me.ref_code ?? me.id);
      const { count: invited } = await supabase
        .from("talents")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", me.id);
      const { data: tx } = await supabase
        .from("credit_transactions")
        .select("amount")
        .eq("talent_id", me.id)
        .eq("service_type", "referral_bonus");
      const earned = (tx ?? []).reduce((s, t) => s + Number(t.amount || 0), 0);
      setStats({ invited: invited ?? 0, earned });
    })();
  }, []);

  if (!refCode) return null;

  const link = `${window.location.origin}/auth?ref=${refCode}`;

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" /> Invite & Earn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Earn <strong>10 credits</strong> when someone you invite makes their first paid connection.
        </p>
        <div className="flex gap-2">
          <input readOnly value={link} className="flex-1 text-xs px-2 py-1 rounded border bg-muted/30" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(link);
              toast.success("Link copied");
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {stats.invited} invited</div>
          <div className="flex items-center gap-1 text-primary font-medium">
            {stats.earned} cr earned
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
