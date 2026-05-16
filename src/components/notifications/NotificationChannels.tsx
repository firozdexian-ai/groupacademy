import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Flame, MessageSquare, Reply, AtSign, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CHANNELS = [
  { key: "feed_hype", label: "Hype reactions", icon: Flame, hint: "Someone hypes your post or content" },
  { key: "feed_comment", label: "Comments", icon: MessageSquare, hint: "Replies on your posts" },
  { key: "feed_reply", label: "Replies to your comments", icon: Reply, hint: "Threaded conversation alerts" },
  { key: "feed_mention", label: "Mentions", icon: AtSign, hint: "When someone @mentions you" },
];

/**
 * GroUp Academy: Agentic Alert Delivery Preferences Node (NotificationChannels)
 * An authoritative operational settings hub routing algorithmic communication preference filters.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function NotificationChannels() {
  const queryClient = useQueryClient();
  const { talent } = useTalent();

  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Monitor notification calibration views via telemetry log parameters
  useEffect(() => {
    if (talent?.id) {
      trackEvent("notification_channels_panel_mounted", { talentId: talent.id });
    }
  }, [talent?.id]);

  // Hardened Asynchronous Lifecycle: Protect updates from firing against unmounted components
  useEffect(() => {
    let isMounted = true;
    if (!talent?.id) return;

    const fetchNotificationPreferencesLedger = async () => {
      try {
        const { data, error } = await supabase
          .from("notification_preferences")
          .select("channel, enabled")
          .eq("talent_id", talent.id);

        if (error) throw error;

        const temporaryPreferenceMap: Record<string, boolean> = {};
        CHANNELS.forEach((channelItem) => (temporaryPreferenceMap[channelItem.key] = true));
        (data ?? []).forEach((rowItem: any) => {
          if (rowItem?.channel) temporaryPreferenceMap[rowItem.channel] = !!rowItem.enabled;
        });

        if (isMounted) {
          setPrefs(temporaryPreferenceMap);
          setLoading(false);
          trackEvent("notification_channels_hydration_success");
        }
      } catch (err: any) {
        const parsedExceptionMsg = err instanceof Error ? err.message : String(err);

        trackError(parsedExceptionMsg, {
          component: "NotificationChannels",
          action: "fetch_notification_preferences_ledger_api",
          talentId: talent.id,
        });

        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNotificationPreferencesLedger();

    return () => {
      isMounted = false;
    };
  }, [talent?.id]);

  const toggle = async (channel: string, enabled: boolean) => {
    if (!talent?.id) return;

    // Optimistic UI Strategy: Update local screen controls instantly before resolving remote sockets
    setPrefs((prevPrefs) => ({ ...prevPrefs, [channel]: enabled }));
    trackEvent("notification_channel_toggle_requested", { channel, targetState: enabled });

    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({ talent_id: talent.id, channel, enabled }, { onConflict: "talent_id,channel" });

      if (error) throw error;

      // Automated Efficiency: Invalidate global alert counts dynamically across adjacent page views
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
      trackEvent("notification_channel_toggle_success", { channel });
    } catch (err: any) {
      const parsedExceptionMsg = err instanceof Error ? err.message : String(err);

      // Rollback Strategy: Revert component toggle switch visually if database write declines transaction
      setPrefs((prevPrefs) => ({ ...prevPrefs, [channel]: !enabled }));

      trackError(parsedExceptionMsg, {
        component: "NotificationChannels",
        action: "toggle_channel_preference_api",
        channel,
        talentId: talent.id,
      });

      toast.error("Ecosystem sync error: Could not commit delivery preference configuration.");
    }
  };

  if (loading) {
    return (
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl select-none w-full animate-pulse">
        <CardContent className="p-4 flex items-center justify-center gap-2.5 text-center py-8 w-full">
          <Loader2 className="h-4 w-4 animate-spin text-primary stroke-[2.5]" />
          <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider pl-0.5">
            Assembling Delivery Filter Maps…
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full text-left rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased transform-gpu overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0 flex flex-col font-bold text-xs tracking-tight">
        {/* HUD LEVEL 1: HEADER CONTROLS INFORMATION TITLE BLOCK */}
        <div className="space-y-1 w-full text-left select-none border-b border-border/10 pb-3">
          <h3 className="text-xs sm:text-sm font-bold text-foreground/90 uppercase tracking-wider leading-none">
            Agentic Communication Filtering Layout
          </h3>
          <p className="text-[11px] font-semibold text-muted-foreground/80 tracking-tight leading-none pt-0.5">
            Determine which system events prompt immediate delivery alerts into your trajectory profile folder index.
          </p>
        </div>

        {/* HUD LEVEL 2: TOGGLES LAYER ACTION LOOP MATRIX AREA */}
        <div className="space-y-3.5 w-full min-w-0 pt-1">
          {CHANNELS.map((channelConfig) => {
            if (!channelConfig || !channelConfig.key) return null;

            const Icon = channelConfig.icon || MessageCircle;
            const isChecked = prefs[channelConfig.key] ?? true;

            return (
              <div
                key={channelConfig.key}
                className="flex items-center justify-between gap-4 w-full min-w-0 p-1 rounded-xl transition-colors hover:bg-muted/10"
              >
                {/* Visual Category Shield Core Framing */}
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0 shadow-inner select-none">
                  <Icon className="h-4 w-4 text-primary stroke-[2.2]" />
                </div>

                {/* Description content layout nodes */}
                <div className="flex-1 min-w-0 text-left space-y-0.5 flex flex-col justify-center leading-none">
                  <span className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-none">
                    {channelConfig.label}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground/70 truncate text-ellipsis tracking-tight select-text leading-none pt-1 pr-1 italic">
                    {channelConfig.hint}
                  </span>
                </div>

                {/* Control Action Switch Component Layer */}
                <Switch
                  checked={isChecked}
                  onCheckedChange={(nextCheckedStateValue) => toggle(channelConfig.key, nextCheckedStateValue)}
                  className="shrink-0 select-none transform-gpu shadow-sm cursor-pointer"
                  aria-label={`Toggle messaging delivery pipeline tracking filters for ${channelConfig.label}`}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
