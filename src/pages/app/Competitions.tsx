import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Calendar, Users, ArrowLeft, Clock, Gift, Zap, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Skill Arena Hub
 * Orchestrates competitive skill validation and high-stakes performance indexing.
 * 2026 Standard: Executive Logic typography with kinetic telemetry badges.
 */

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  upcoming: { label: "Scheduled", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Calendar },
  active: { label: "Live Protocol", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: Zap },
  judging: { label: "In Evaluation", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Target },
  completed: { label: "Finalized", color: "bg-muted text-muted-foreground border-border", icon: Trophy },
  cancelled: { label: "Aborted", color: "bg-destructive/10 text-destructive border-destructive/20", icon: Target },
};

export default function Competitions() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "active" | "upcoming" | "completed">("all");

  const { data: competitions, isLoading } = useQuery({
    queryKey: ["competitions", filter],
    queryFn: async () => {
      let query = supabase
        .from("competitions")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("start_date", { ascending: true });

      if (filter !== "all") query = query.eq("status", filter);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const getTimeRemaining = (deadline: string) => {
    const days = differenceInDays(new Date(deadline), new Date());
    if (days < 0) return "Ended";
    if (days === 0) return "Sequence Ends Today";
    if (days === 1) return "24h Remaining";
    return `${days}d Remaining`;
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 pb-40 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Handshake */}
      <header className="flex flex-col gap-10">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app/learning")}
            className="group rounded-xl h-11 pl-3 pr-5 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary/5 -ml-3"
          >
            <ArrowLeft className="w-4 h-4 mr-3 transition-transform group-hover:-translate-x-1" />
            Back to Registry
          </Button>

          <Badge
            variant="outline"
            className="rounded-lg border-primary/20 text-primary font-black uppercase text-[9px] tracking-widest italic"
          >
            Arena v2.6 Active
          </Badge>
        </div>

        <div className="flex items-center gap-5">
          <div className="h-14 w-14 rounded-[24px] bg-primary/10 flex items-center justify-center border-2 border-primary/20 rotate-3 shadow-xl">
            <Trophy className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">The Arena</h1>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] mt-2 italic">
              Performance-Based Skill Validation
            </p>
          </div>
        </div>
      </header>

      {/* Logic Filter Protocol */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 p-1.5 h-14 bg-muted/30 backdrop-blur-md rounded-2xl border border-border/40 max-w-md">
          {["all", "active", "upcoming", "completed"].map((val) => (
            <TabsTrigger key={val} value={val} className="rounded-xl font-black uppercase text-[10px] tracking-widest">
              {val === "completed" ? "Past" : val}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Registry Viewport */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-80 rounded-[32px] bg-muted/40" />
          ))}
        </div>
      ) : competitions && competitions.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {competitions.map((competition) => {
            const status = STATUS_CONFIG[competition.status] || STATUS_CONFIG.upcoming;
            const prizes = Array.isArray(competition.prizes) ? competition.prizes : [];

            return (
              <Card
                key={competition.id}
                className={cn(
                  "group overflow-hidden rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-500 hover:border-primary/40 hover:shadow-2xl cursor-pointer",
                  competition.is_featured && "border-primary/20 bg-primary/5 shadow-xl",
                )}
                onClick={() => navigate(`/app/learning/competitions/${competition.slug}`)}
              >
                {competition.featured_image && (
                  <div className="h-44 overflow-hidden relative">
                    <img
                      src={competition.featured_image}
                      alt={competition.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}

                <CardHeader className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex flex-wrap gap-2">
                      {competition.is_featured && (
                        <Badge className="bg-primary text-primary-foreground border-none text-[8px] font-black uppercase tracking-widest">
                          <Zap className="h-3 w-3 mr-1 fill-current" /> Featured Logic
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest italic border-none",
                          status.color,
                        )}
                      >
                        <status.icon className="h-3 w-3 mr-1.5 fill-current" /> {status.label}
                      </Badge>
                    </div>
                    <Target className="h-6 w-6 text-muted-foreground/20 group-hover:text-primary/40 transition-colors" />
                  </div>

                  <CardTitle className="text-2xl font-black uppercase tracking-tighter italic leading-none group-hover:text-primary transition-colors">
                    {competition.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-8 pb-8 space-y-6">
                  <p className="text-sm text-muted-foreground/80 font-medium leading-relaxed italic line-clamp-2">
                    {competition.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-6">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
                        Duration
                      </p>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {format(new Date(competition.start_date), "MMM d")}
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
                        Status
                      </p>
                      <div className="flex items-center justify-end gap-2 text-xs font-bold uppercase tracking-tight text-amber-500">
                        <Clock className="h-3.5 w-3.5" />
                        {competition.status === "active"
                          ? getTimeRemaining(competition.submission_deadline)
                          : "Awaiting sync"}
                      </div>
                    </div>
                  </div>

                  {prizes.length > 0 && (
                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-center justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                      <div className="flex items-center gap-3">
                        <Gift className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">Reward Tiering</span>
                      </div>
                      <span className="text-xs font-black">{prizes.length} Units Available</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-[40px] border-2 border-dashed border-border/40 bg-muted/5 py-24 text-center animate-in zoom-in-95 duration-700">
          <Trophy className="h-20 w-20 mx-auto text-muted-foreground/10 mb-8 rotate-12" />
          <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Arena Empty</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic mb-10 max-w-xs mx-auto leading-relaxed">
            No active tournaments match this logic sequence. Adjust parameters or wait for next telemetry sync.
          </p>
          <Button
            variant="outline"
            className="rounded-xl px-10 h-12 font-black uppercase text-[10px] border-2"
            onClick={() => setFilter("all")}
          >
            Clear Arena Protocol
          </Button>
        </Card>
      )}
    </div>
  );
}
