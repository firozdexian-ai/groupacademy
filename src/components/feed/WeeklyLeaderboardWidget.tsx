import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Trophy } from "lucide-react";

interface Row {
  talent_id: string;
  full_name: string | null;
  profile_photo_url: string | null;
  credits_earned: number;
  hype_count: number;
}

export function WeeklyLeaderboardWidget() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    supabase
      .from("v_weekly_leaderboard")
      .select("*")
      .limit(10)
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);

  if (!rows.length) return null;

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" /> Weekly Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 py-2">
        {rows.map((r, i) => (
          <div key={r.talent_id} className="flex items-center gap-2 text-xs">
            <span className="w-5 text-center font-semibold text-muted-foreground">
              {i === 0 ? <Crown className="h-3.5 w-3.5 text-yellow-500 inline" /> : i + 1}
            </span>
            <Avatar className="h-6 w-6">
              <AvatarImage src={r.profile_photo_url ?? undefined} />
              <AvatarFallback>{r.full_name?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate">{r.full_name ?? "Talent"}</span>
            <span className="font-medium text-primary">{r.credits_earned}cr</span>
          </div>
        ))}
        <p className="text-[10px] text-muted-foreground pt-1">
          Top 10 win 100–500 credits every Monday.
        </p>
      </CardContent>
    </Card>
  );
}
