import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePostInsights } from "@/hooks/useCreatorAnalytics";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Eye, Flame, MessageCircle, Bookmark, Share2, Coins, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface Props {
  postId: string;
  isAuthor: boolean;
}

/**
 * Premium, performance-hardened Creator Post Insights Accordion panel.
 * Built according to GroUp Academy Phase Z0 highly professional SAAS UI specifications
 * with defensive container bounds to prevent accordion-based chart rehydration drops.
 */
export function PostInsightsAccordion({ postId, isAuthor }: Props) {
  // Monitor analytic panel views safely via central telemetry hooks
  useEffect(() => {
    if (isAuthor && postId) {
      trackEvent("post_insights_accordion_mounted", { postId });
    }
  }, [isAuthor, postId]);

  if (!isAuthor) return null;

  return (
    <Card className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm select-none transition-all duration-300 w-full max-w-full">
      <CardContent className="p-1">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="insights" className="border-none w-full">
            <AccordionTrigger
              onClick={() => trackEvent("post_insights_accordion_toggled", { postId })}
              className="px-3 py-2.5 text-xs font-bold hover:no-underline text-muted-foreground hover:text-foreground transition-colors group flex w-full justify-between items-center cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xl"
            >
              <span className="flex items-center gap-2 tracking-tight">
                <BarChart3 className="h-4 w-4 text-primary transition-transform group-hover:scale-105" />
                <span>Analytics Node Insights</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="w-full pt-1">
              <InsightsBody postId={postId} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function InsightsBody({ postId }: { postId: string }) {
  const { data, isLoading, error } = usePostInsights(postId);

  // Catch server-state ingestion faults and beam context back to administrative threads
  useEffect(() => {
    if (error) {
      trackError(error instanceof Error ? error : String(error), {
        component: "PostInsightsAccordion",
        action: "fetch_post_insights_api",
        postId,
      });
    }
  }, [error, postId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4 px-3 text-[11px] font-medium text-muted-foreground tracking-wide animate-pulse select-none">
        <LoaderSpinner className="h-3 w-3 animate-spin mr-2 text-primary" /> Compiling telemetry matrices…
      </div>
    );
  }

  if (!data) return null;
  const t = data.totals || {};

  return (
    <div className="space-y-4 px-3 pb-3 pt-1 w-full min-w-0 transition-all duration-300 animate-in fade-in duration-300">
      {/* Financial Metrics Split Matrix Row */}
      <div className="grid grid-cols-3 gap-2 text-xs w-full">
        <Stat
          icon={<Eye className="h-3 w-3 text-muted-foreground/80" />}
          label="Views"
          value={t.impression_count || 0}
        />
        <Stat
          icon={<Flame className="h-3 w-3 text-orange-500 fill-orange-500/10" />}
          label="Hypes"
          value={t.hype_count || 0}
        />
        <Stat
          icon={<Coins className="h-3 w-3 text-emerald-500" />}
          label="Earned"
          value={`+${Number(data.credits_earned || 0).toFixed(1)} cr`}
        />
        <Stat
          icon={<MessageCircle className="h-3 w-3 text-blue-500" />}
          label="Comments"
          value={t.comment_count || 0}
        />
        <Stat icon={<Bookmark className="h-3 w-3 text-purple-500" />} label="Saves" value={t.save_count || 0} />
        <Stat icon={<Share2 className="h-3 w-3 text-cyan-500" />} label="Shares" value={t.share_count || 0} />
      </div>

      {/* Dynamic Engagement Charts Overlay Track */}
      {Array.isArray(data.daily) && data.daily.length > 0 && (
        <div
          className="h-32 -mx-1 relative overflow-hidden w-full border border-border/20 rounded-xl bg-background/30 p-2 shadow-inner"
          style={{ minHeight: "128px" }} // Hard-locks dimensions to safeguard against hidden Recharts SVG drop exceptions
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
            <LineChart data={data.daily} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <XAxis dataKey="day" hide />
              <YAxis tick={{ fontSize: 8, fontWeight: "600", fill: "hsl(var(--muted-foreground))" }} width={24} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background)/0.95)",
                  borderColor: "hsl(var(--border)/0.6)",
                  borderRadius: "12px",
                  fontSize: "10px",
                  fontWeight: "700",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                }}
              />
              <Line
                type="monotone"
                dataKey="impressions"
                name="Views"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="hypes"
                name="Hypes"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* High-Value Top Hypers Leaderboard Section */}
      {Array.isArray(data.top_hypers) && data.top_hypers.length > 0 && (
        <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-300">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-bold pl-0.5">
            Top Contributor Hypers
          </p>
          <div className="flex flex-wrap gap-1.5 max-w-full">
            {data.top_hypers.map((hyperProfile: any) => (
              <div
                key={hyperProfile.id || Math.random().toString()}
                className="flex items-center gap-1.5 px-3 py-1 bg-muted/40 hover:bg-muted/70 border border-border/20 transition-all rounded-full text-[11px] font-bold text-foreground/90 select-text selection:bg-primary/20 shadow-sm"
              >
                <span className="truncate max-w-[110px]">{hyperProfile.full_name || "Academy Member"}</span>
                <span className="text-primary text-[10px] font-extrabold tabular-nums bg-primary/5 px-1.5 py-0.5 border border-primary/10 rounded-full">
                  &times;{hyperProfile.hypes || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) {
  return (
    <div className="p-2.5 rounded-xl bg-muted/20 dark:bg-muted/5 border border-border/20 shadow-inner flex flex-col text-left justify-center min-w-0">
      <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/80 uppercase tracking-wider select-none truncate">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-extrabold text-foreground tracking-tight tabular-nums mt-0.5 truncate">{value}</div>
    </div>
  );
}

function LoaderSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}
