/**
 * Agent Anomaly Feed — Executive Dashboard Component.
 * Monitors platform_events in real-time, providing the core alerting interface
 * for the Digital Workforce operations center.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, AlertTriangle, Target, ArrowUpRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { InlineSpinner } from "@/components/common/InlineSpinner";

interface PlatformEvent {
  id: string;
  severity: "critical" | "warning" | "opportunity" | "info";
  agent_key: string;
  title: string;
  description: string;
  created_at: string;
}

const SEVERITY_CONFIG = {
  critical: { icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
  warning: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  opportunity: { icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  info: { icon: Bot, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
};

export function AgentAnomalyFeed() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchEvents = async () => {
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from("vw_agent_anomalies" as any)
          .select("id, severity, agent_key, title, description, created_at")
          .gte("created_at", twentyFourHoursAgo)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;

        if (!cancelled && data) {
          setEvents(data as unknown as PlatformEvent[]);
        }
      } catch (err) {
        console.error("[Digital Workforce Anomaly] Failed to load anomaly feed events:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchEvents();

    // Listen for incoming system markers to update status layout seamlessly
    const channel = supabase
      .channel("platform-anomalies")
      .on("postgres_changes" as any, { event: "INSERT", schema: "public", table: "platform_events" }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col h-full relative">
      {/* Active Warning Indicator */}
      {events.some((e) => e.severity === "critical") && (
        <div className="absolute top-4 right-4 z-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
          </span>
        </div>
      )}

      <CardHeader className="p-6 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-bold tracking-tight">System Events & Anomalies</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Real-time status tracking updates from automated platform agents
        </p>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <div className="divide-y divide-border flex-1 overflow-y-auto max-h-[420px]">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <InlineSpinner size="md" />
              <p className="text-xs">Checking system logs...</p>
            </div>
          ) : events.length > 0 ? (
            events.map((event) => {
              const config = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.info;
              const Icon = config.icon;

              return (
                <div key={event.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border",
                        config.bg,
                        config.border,
                        config.color,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate text-foreground">{event.title}</p>
                        <span className="text-2xs text-muted-foreground shrink-0 whitespace-nowrap">
                          {formatDistanceToNow(new Date(event.created_at))} ago
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-normal break-words">{event.description}</p>
                      <div className="flex items-center gap-2 pt-1.5">
                        <span className="text-2xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {event.agent_key.replace(/-/g, " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <CheckCircle2 className="h-6 w-6 text-emerald-500/50" />
              <p className="text-xs">All systems operational — No alerts in the last 24h</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-muted/20 border-t border-border mt-auto">
          <Button
            onClick={() => navigate("/dashboard/chat")}
            className="w-full h-10 rounded-xl justify-between font-semibold text-xs tracking-tight px-4"
          >
            Open Agent OS Chat Dashboard
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
