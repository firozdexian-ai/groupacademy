import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Headphones, BookOpen, PenTool, Mic, Flame, Trophy, Sparkles } from "lucide-react";

const SECTIONS = [
  { id: "listening", name: "Listening", icon: Headphones, color: "text-blue-600" },
  { id: "reading", name: "Reading", icon: BookOpen, color: "text-emerald-600" },
  { id: "writing", name: "Writing", icon: PenTool, color: "text-amber-600" },
  { id: "speaking", name: "Speaking", icon: Mic, color: "text-rose-600" },
];

export default function IELTSCoach() {
  const { data: streak } = useQuery({
    queryKey: ["ielts-streak"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("ielts_streaks").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["ielts-recent"],
    queryFn: async () => {
      const { data } = await supabase.from("ielts_mock_attempts").select("id,section,ai_band_score,created_at").order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const { data: daily } = useQuery({
    queryKey: ["ielts-daily"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase.from("ielts_daily_challenges").select("*, ielts_prompts(*)").eq("challenge_date", today).maybeSingle();
      return data;
    },
  });

  // Find weakest section
  const weakest = recent?.reduce((acc: any, r: any) => {
    if (!r.ai_band_score) return acc;
    if (!acc || r.ai_band_score < acc.ai_band_score) return r;
    return acc;
  }, null);

  return (
    <div className="px-4 py-4 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">IELTS Coach</h1>
        <Badge variant="secondary"><Flame className="h-3 w-3 mr-1 text-orange-500" />{streak?.current_streak_days ?? 0} day streak</Badge>
      </div>

      {/* Streak ring */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-cyan-500/10">
        <div className="flex items-center gap-4">
          <div className="text-5xl">🔥</div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Current streak</div>
            <div className="text-2xl font-bold">{streak?.current_streak_days ?? 0} days</div>
            <div className="text-xs text-muted-foreground">XP {streak?.xp_total ?? 0} · Best {streak?.longest_streak_days ?? 0}</div>
          </div>
          <Trophy className="h-8 w-8 text-amber-500" />
        </div>
      </Card>

      {/* Daily challenge */}
      {daily && (
        <Card className="p-4 border-primary/40">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-1" />
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider font-bold text-primary">Daily Challenge (free)</div>
              <div className="text-sm font-semibold mt-1">{(daily as any).ielts_prompts?.prompt_text?.slice(0, 120)}…</div>
              <Link to={`/app/abroad/ielts/mock/${(daily as any).section}?prompt=${(daily as any).prompt_id}`}>
                <Button size="sm" className="mt-2">Take Today's Challenge</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Weakest band hint */}
      {weakest && (
        <Card className="p-3 bg-amber-50 dark:bg-amber-950/30 border-amber-200">
          <div className="text-xs">Your weakest section is <b className="capitalize">{weakest.section}</b> at band {weakest.ai_band_score}. Practice today to improve.</div>
        </Card>
      )}

      {/* Section grid */}
      <div className="grid grid-cols-2 gap-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.id} to={`/app/abroad/ielts/mock/${s.id}`}>
              <Card className="p-4 text-center hover:bg-muted/50">
                <Icon className={`h-7 w-7 mx-auto mb-1 ${s.color}`} />
                <div className="font-semibold text-sm">{s.name}</div>
                <div className="text-[10px] text-muted-foreground">1 credit · ~10 min</div>
              </Card>
            </Link>
          );
        })}
      </div>

      <Link to="/app/abroad/ielts/mock/full">
        <Button variant="default" className="w-full"><Trophy className="h-4 w-4 mr-2" />Take Full Mock Test (4 credits)</Button>
      </Link>

      {/* Recent attempts */}
      {!!recent?.length && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Recent attempts</h2>
          <div className="space-y-1">
            {recent.map((r: any) => (
              <Link key={r.id} to={`/app/abroad/ielts/results/${r.id}`}>
                <Card className="p-3 flex items-center justify-between hover:bg-muted/50">
                  <div>
                    <div className="text-sm capitalize font-semibold">{r.section}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                  <Badge variant="secondary" className="text-base font-bold">Band {r.ai_band_score ?? "—"}</Badge>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
