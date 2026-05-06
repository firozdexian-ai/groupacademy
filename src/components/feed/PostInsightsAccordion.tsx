import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePostInsights } from "@/hooks/useCreatorAnalytics";
import { Eye, Flame, MessageCircle, Bookmark, Share2, Coins, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  postId: string;
  isAuthor: boolean;
}

export function PostInsightsAccordion({ postId, isAuthor }: Props) {
  if (!isAuthor) return null;
  return (
    <Card className="rounded-2xl border-border/40">
      <CardContent className="p-2">
        <Accordion type="single" collapsible>
          <AccordionItem value="insights" className="border-none">
            <AccordionTrigger className="px-2 py-2 text-xs font-semibold hover:no-underline">
              <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Insights</span>
            </AccordionTrigger>
            <AccordionContent>
              <InsightsBody postId={postId} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function InsightsBody({ postId }: { postId: string }) {
  const { data, isLoading } = usePostInsights(postId);
  if (isLoading) return <p className="text-xs text-muted-foreground p-2">Loading…</p>;
  if (!data) return null;
  const t = data.totals || {};
  return (
    <div className="space-y-3 px-2 pb-2">
      <div className="grid grid-cols-3 gap-2 text-xs">
        <Stat icon={<Eye className="h-3 w-3" />} label="Views" value={t.impression_count || 0} />
        <Stat icon={<Flame className="h-3 w-3 text-orange-600" />} label="Hypes" value={t.hype_count || 0} />
        <Stat icon={<Coins className="h-3 w-3 text-emerald-600" />} label="Earned" value={`+${Number(data.credits_earned || 0).toFixed(1)}`} />
        <Stat icon={<MessageCircle className="h-3 w-3 text-blue-600" />} label="Comments" value={t.comment_count || 0} />
        <Stat icon={<Bookmark className="h-3 w-3 text-purple-600" />} label="Saves" value={t.save_count || 0} />
        <Stat icon={<Share2 className="h-3 w-3 text-cyan-600" />} label="Shares" value={t.share_count || 0} />
      </div>

      {Array.isArray(data.daily) && data.daily.length > 0 && (
        <div className="h-32 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.daily}>
              <XAxis dataKey="day" tick={{ fontSize: 9 }} hide />
              <YAxis tick={{ fontSize: 9 }} width={20} />
              <Tooltip wrapperClassName="!text-xs" />
              <Line type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="hypes" stroke="#f97316" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {Array.isArray(data.top_hypers) && data.top_hypers.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Top hypers</p>
          <div className="flex flex-wrap gap-1.5">
            {data.top_hypers.map((h: any) => (
              <div key={h.id} className="flex items-center gap-1.5 px-2 py-1 bg-muted/40 rounded-full text-[11px]">
                <span className="font-medium">{h.full_name || "—"}</span>
                <span className="text-muted-foreground">×{h.hypes}</span>
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
    <div className="p-2 rounded-lg bg-muted/30">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
        {icon}{label}
      </div>
      <div className="text-sm font-bold mt-0.5">{value}</div>
    </div>
  );
}
