import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Flame, MessageSquare, Reply, AtSign } from "lucide-react";
import { toast } from "sonner";

const CHANNELS = [
  { key: "feed_hype", label: "Hype reactions", icon: Flame, hint: "Someone hypes your post or content" },
  { key: "feed_comment", label: "Comments", icon: MessageSquare, hint: "Replies on your posts" },
  { key: "feed_reply", label: "Replies to your comments", icon: Reply, hint: "Threaded conversation alerts" },
  { key: "feed_mention", label: "Mentions", icon: AtSign, hint: "When someone @mentions you" },
];

export function NotificationChannels() {
  const { talent } = useTalent();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!talent?.id) return;
    (async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("channel, enabled")
        .eq("talent_id", talent.id);
      const map: Record<string, boolean> = {};
      CHANNELS.forEach((c) => (map[c.key] = true));
      (data ?? []).forEach((r: any) => (map[r.channel] = r.enabled));
      setPrefs(map);
      setLoading(false);
    })();
  }, [talent?.id]);

  const toggle = async (channel: string, enabled: boolean) => {
    if (!talent?.id) return;
    setPrefs((p) => ({ ...p, [channel]: enabled }));
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({ talent_id: talent.id, channel, enabled }, { onConflict: "talent_id,channel" });
    if (error) {
      setPrefs((p) => ({ ...p, [channel]: !enabled }));
      toast.error("Couldn't save preference");
    }
  };

  if (loading) return null;

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Notification channels</h3>
      <p className="text-xs text-muted-foreground">Choose which agentic alerts AI General sends you.</p>
      <div className="space-y-3 pt-2">
        {CHANNELS.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.key} className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{c.label}</div>
                <div className="text-[11px] text-muted-foreground">{c.hint}</div>
              </div>
              <Switch checked={prefs[c.key] ?? true} onCheckedChange={(v) => toggle(c.key, v)} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
