import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, Flame, MessageCircle, Bookmark, Share2, TrendingUp, TrendingDown, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTalent } from "@/hooks/useTalent";
import { useCreatorScorecard, useCreatorTopPosts } from "@/hooks/useCreatorAnalytics";
import { cn } from "@/lib/utils";

function pct(cur: number, prev: number) {
  if (!prev) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

interface TileProps {
  label: string;
  value: number | string;
  delta?: number;
  icon: React.ReactNode;
  accent?: string;
}

function Tile({ label, value, delta, icon, accent = "text-primary" }: TileProps) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="rounded-2xl border-border/40">
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center bg-muted/40", accent)}>{icon}</div>
          {delta !== undefined && (
            <span className={cn("text-[10px] font-semibold flex items-center gap-0.5", up ? "text-emerald-600" : "text-rose-600")}>
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
        <div className="text-xl font-bold leading-none">{value}</div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
      </CardContent>
    </Card>
  );
}

export default function CreatorAnalytics() {
  const { talent } = useTalent();
  const [days, setDays] = useState<7 | 30>(7);
  const { data: card, isLoading } = useCreatorScorecard(talent?.id, days);
  const { data: topPosts } = useCreatorTopPosts(talent?.id, days, 10);

  const cur = card?.current ?? {};
  const prev = card?.previous ?? {};
  const postCount = card?.post_count ?? 0;

  const funnel = useMemo(() => {
    const imp = Number(cur.impressions || 0) || 1;
    return {
      hype: Math.round(((cur.hypes || 0) / imp) * 1000) / 10,
      comment: Math.round(((cur.comments || 0) / imp) * 1000) / 10,
      save: Math.round(((cur.saves || 0) / imp) * 1000) / 10,
      share: Math.round(((cur.shares || 0) / imp) * 1000) / 10,
    };
  }, [cur]);

  return (
    <div className="min-h-screen bg-muted/10 pb-32">
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border/40">
        <div className="max-w-2xl mx-auto px-3 py-2 flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <Link to="/app/feed" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-sm font-semibold">Creator analytics</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 py-3 space-y-4">
        <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v) as 7 | 30)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="7">Last 7 days</TabsTrigger>
            <TabsTrigger value="30">Last 30 days</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : postCount === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">You haven't posted yet. Once you publish, you'll see reach, hype, comments, saves, and shares here.</p>
              <Button asChild size="sm"><Link to="/app/feed">Create your first post</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Tile label="Impressions" value={cur.impressions || 0} delta={pct(cur.impressions || 0, prev.impressions || 0)} icon={<Eye className="h-4 w-4" />} />
              <Tile label="Hypes" value={cur.hypes || 0} delta={pct(cur.hypes || 0, prev.hypes || 0)} icon={<Flame className="h-4 w-4" />} accent="text-orange-600" />
              <Tile label="Credits earned" value={Number(cur.credits_earned || 0).toFixed(1)} delta={pct(Number(cur.credits_earned || 0), Number(prev.credits_earned || 0))} icon={<Coins className="h-4 w-4" />} accent="text-emerald-600" />
              <Tile label="Comments" value={cur.comments || 0} delta={pct(cur.comments || 0, prev.comments || 0)} icon={<MessageCircle className="h-4 w-4" />} accent="text-blue-600" />
              <Tile label="Saves" value={cur.saves || 0} delta={pct(cur.saves || 0, prev.saves || 0)} icon={<Bookmark className="h-4 w-4" />} accent="text-purple-600" />
              <Tile label="Shares" value={cur.shares || 0} delta={pct(cur.shares || 0, prev.shares || 0)} icon={<Share2 className="h-4 w-4" />} accent="text-cyan-600" />
            </div>

            <Card className="rounded-2xl border-border/40">
              <CardContent className="p-4 space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Engagement funnel</h2>
                <div className="space-y-2">
                  {[
                    { label: "Hype rate", value: funnel.hype, color: "bg-orange-500" },
                    { label: "Comment rate", value: funnel.comment, color: "bg-blue-500" },
                    { label: "Save rate", value: funnel.save, color: "bg-purple-500" },
                    { label: "Share rate", value: funnel.share, color: "bg-cyan-500" },
                  ].map((row) => (
                    <div key={row.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-semibold">{row.value}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", row.color)} style={{ width: `${Math.min(100, row.value)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {topPosts && topPosts.length > 0 && (
              <Card className="rounded-2xl border-border/40">
                <CardContent className="p-3 space-y-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">Top posts</h2>
                  <div className="space-y-1.5">
                    {topPosts.map((p: any) => (
                      <Link key={p.id} to={`/app/feed/post/${p.id}`} className="block p-2.5 rounded-xl border border-border/40 hover:border-primary/40 transition-colors">
                        <p className="text-xs line-clamp-2 mb-1.5">{p.snippet || "—"}</p>
                        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{p.impression_count}</span>
                          <span className="flex items-center gap-1 text-orange-600"><Flame className="h-3 w-3" />{p.hype_count}</span>
                          <span className="flex items-center gap-1 text-blue-600"><MessageCircle className="h-3 w-3" />{p.comment_count}</span>
                          <span className="flex items-center gap-1 text-purple-600"><Bookmark className="h-3 w-3" />{p.save_count}</span>
                          <span className="flex items-center gap-1 text-cyan-600"><Share2 className="h-3 w-3" />{p.share_count}</span>
                          <span className="flex items-center gap-1 text-emerald-600 ml-auto"><Coins className="h-3 w-3" />+{Number(p.credits_earned || 0).toFixed(1)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
