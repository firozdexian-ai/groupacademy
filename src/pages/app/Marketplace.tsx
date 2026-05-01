import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MARKETPLACE_SCHOOLS, MARKETPLACE_SCHOOL_MAP } from "@/lib/constants/marketplaceCategories";
import { Search, Briefcase, Clock, Coins, ChevronRight, Sparkles, Zap, ShieldCheck, Target } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Professional Project List (Marketplace)
 * High-fidelity discovery engine for high-value gig artifacts.
 * 2026 Standard: Executive Logic geometry with kinetic filter nodes.
 */

export default function Marketplace() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: gigs, isLoading } = useQuery({
    queryKey: ["marketplace-gigs", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("marketplace_gigs")
        .select("*")
        .in("status", ["approved", "active"])
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (selectedCategory) {
        query = query.eq("skill_category", selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filtered = gigs?.filter(
    (g: any) =>
      !search ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 pb-40 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Executive Header: Project List */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-[20px] bg-primary/10 flex items-center justify-center border border-primary/20">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Project Hub</h1>
          </div>
          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] ml-16 italic">
            Professional Skill Monetization v2.6
          </p>
        </div>

        <Badge
          variant="outline"
          className="rounded-lg border-primary/20 text-primary font-black uppercase tracking-widest text-[9px] px-3 py-1"
        >
          {gigs?.length || 0} ACTIVE NODES
        </Badge>
      </header>

      {/* List Query Console */}
      <div className="space-y-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Query artifacts by title or logic..."
            className="pl-12 h-14 bg-card/50 backdrop-blur-sm border-2 border-border/40 rounded-2xl font-bold tracking-tight focus-visible:ring-primary/10 shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Kinetic Filter Protocol */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "shrink-0 rounded-xl px-6 h-10 font-black uppercase text-[10px] tracking-widest transition-all",
              !selectedCategory
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-muted/50 text-muted-foreground/60 hover:bg-muted",
            )}
          >
            Global List
          </Button>
          {MARKETPLACE_SCHOOLS.map((school) => (
            <Button
              key={school.value}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(school.value)}
              className={cn(
                "shrink-0 rounded-xl px-6 h-10 font-black uppercase text-[10px] tracking-widest transition-all",
                selectedCategory === school.value
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-muted/50 text-muted-foreground/60 hover:bg-muted",
              )}
            >
              {school.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main List Viewport */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-[32px] bg-muted/40" />
          ))}
        </div>
      ) : !filtered?.length ? (
        <Card className="rounded-[40px] border-2 border-dashed border-border/40 bg-muted/5 py-24 text-center animate-in zoom-in-95 duration-700">
          <div className="h-20 w-20 rounded-[32px] bg-muted/10 flex items-center justify-center mx-auto mb-8 border border-border/40 rotate-3">
            <Target className="h-10 w-10 text-muted-foreground/20" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">List Entry Empty</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic mb-10 max-w-xs mx-auto leading-relaxed">
            No professional gig artifacts match this query sequence. Adjust parameters or await next sync.
          </p>
          <Button
            variant="outline"
            className="rounded-xl px-10 h-12 font-black uppercase tracking-widest text-[10px] border-2"
            onClick={() => {
              setSearch("");
              setSelectedCategory(null);
            }}
          >
            Clear Logic Protocol
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filtered.map((gig: any) => (
            <Card
              key={gig.id}
              className="group rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-500 hover:border-primary/40 hover:shadow-2xl cursor-pointer overflow-hidden"
              onClick={() => navigate(`/app/marketplace/${gig.id}`)}
            >
              <CardContent className="p-8">
                <div className="flex items-start justify-between gap-8">
                  <div className="flex-1 min-w-0 space-y-5">
                    <div className="flex items-center gap-3 flex-wrap">
                      {gig.is_featured && (
                        <Badge className="bg-amber-500/10 text-amber-600 border-none text-[8px] font-black uppercase tracking-widest px-2 py-1">
                          <Zap className="h-3 w-3 mr-1.5 fill-current" /> Elite Artifact
                        </Badge>
                      )}
                      <Badge
                        variant="secondary"
                        className="bg-primary/5 text-primary border-none text-[8px] font-black uppercase tracking-widest px-2 py-1"
                      >
                        {MARKETPLACE_SCHOOL_MAP[gig.skill_category]?.label || gig.skill_category}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground/40 uppercase italic">
                        <ShieldCheck className="h-3 w-3" />{" "}
                        {gig.pricing_type === "fixed" ? "Fixed Unit" : "Competitive Bid"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none group-hover:text-primary transition-colors">
                        {gig.title}
                      </h3>
                      <p className="text-sm text-muted-foreground/80 font-medium leading-relaxed line-clamp-2 italic pt-1">
                        {gig.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-8 pt-4 border-t border-border/10">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                          <Coins className="h-4 w-4 text-amber-500" />
                        </div>
                        <span className="text-lg font-black tracking-tighter uppercase italic">
                          {gig.budget_amount} Credits
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                        {gig.deadline && (
                          <span className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            Exp: {format(new Date(gig.deadline), "MMM d")}
                          </span>
                        )}
                        <span className="flex items-center gap-2">
                          <Zap className="h-3.5 w-3.5 text-primary" />
                          {gig.total_bids} Handshakes
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="h-14 w-14 rounded-2xl bg-muted/50 border border-border/20 flex items-center justify-center transition-all group-hover:rotate-6 group-hover:bg-primary/10">
                    <ChevronRight className="h-6 w-6 text-muted-foreground/30 group-hover:text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Terminal Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">Market List: Verified Node v2.6</p>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}
