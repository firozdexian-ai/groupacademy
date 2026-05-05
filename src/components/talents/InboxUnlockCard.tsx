import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";

const THRESHOLD = 5000;

/**
 * Inbox unlock card — shown on the talent's own profile/dashboard.
 * Unlocks automatically at 5,000 lifetime credit transactions, or via 5,000-credit one-time payment.
 */
export function InboxUnlockCard() {
  const { talent } = useTalent();
  const { toast } = useToast();
  const [volume, setVolume] = useState<number>(0);
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!talent?.id) return;
    const [{ data: vol }, { data: settings }] = await Promise.all([
      supabase.from("v_talent_transaction_volume").select("volume").eq("talent_id", talent.id).maybeSingle(),
      supabase.from("talent_inbox_settings").select("unlocked").eq("talent_id", talent.id).maybeSingle(),
    ]);
    setVolume(Number((vol as any)?.volume ?? 0));
    setUnlocked(Boolean((settings as any)?.unlocked));
  };

  useEffect(() => {
    refresh();
  }, [talent?.id]);

  const tryUnlock = async () => {
    setLoading(true);
    const { error } = await supabase.rpc("unlock_talent_inbox");
    setLoading(false);
    if (error) {
      toast({ title: "Couldn't unlock", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Inbox unlocked!", description: "Other talents can now send you connection requests." });
    refresh();
  };

  if (!talent?.id) return null;

  const pct = Math.min(100, (volume / THRESHOLD) * 100);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {unlocked ? <Unlock className="h-4 w-4 text-emerald-600" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
          <h3 className="font-semibold text-sm">{unlocked ? "Inbox unlocked" : "Unlock your inbox"}</h3>
        </div>
        {unlocked && <span className="text-[10px] text-emerald-600 font-medium uppercase">Active</span>}
      </div>
      {!unlocked && (
        <>
          <p className="text-xs text-muted-foreground">
            Reach <strong>{THRESHOLD.toLocaleString()} lifetime credit transactions</strong> (earn or spend) to auto-unlock,
            or pay <strong>{THRESHOLD.toLocaleString()} credits</strong> now.
          </p>
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {volume.toLocaleString()} / {THRESHOLD.toLocaleString()} credits transacted
            </p>
          </div>
          <Button size="sm" onClick={tryUnlock} disabled={loading} className="w-full">
            {loading ? "Working…" : volume >= THRESHOLD ? "Activate inbox (free)" : `Unlock now (${THRESHOLD} cr)`}
          </Button>
        </>
      )}
    </Card>
  );
}
