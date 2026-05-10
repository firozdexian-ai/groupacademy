import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelPromotionCard } from "./ChannelPromotionCard";
import { Megaphone, Sparkles, FileText, Zap, ShieldCheck, Activity, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * GroUp Academy: Growth Outreach Command (JobsOutreachTab)
 * CTO Reference: Authoritative hub for multi-channel syndication and candidate-specific outreach.
 */

const CVOutreachGenerator = lazy(() =>
  import("../CVOutreachGenerator").then((m) => ({ default: m.CVOutreachGenerator })),
);

interface JobOption {
  id: string;
  title: string;
  company_name: string;
  location: string | null;
  job_type: string | null;
  application_type: string;
  application_url: string | null;
  application_email: string | null;
}

export function JobsOutreachTab() {
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveNodes = async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id,title,company_name,location,job_type,application_type,application_url,application_email")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(100);

      const list = (data || []) as JobOption[];
      setJobs(list);
      if (list.length && !selectedJobId) setSelectedJobId(list[0].id);
      setLoading(false);
    };

    fetchActiveNodes();
  }, []);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* SECTION: MULTI-CHANNEL PROMOTION */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
        <CardHeader className="p-8 border-b border-border/10 bg-muted/10 text-left">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <Megaphone className="h-7 w-7 text-primary" /> Syndication_Pulse
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic leading-relaxed max-w-xl">
                Generate neural captions for global channels. Copy artifacts and log distribution across the ecosystem.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="h-10 px-4 rounded-xl border-2 font-black italic gap-2 bg-background/50 uppercase"
            >
              <Share2 className="h-3.5 w-3.5" /> Growth_Mode
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          <div className="space-y-3 text-left">
            <label className="text-[10px] font-black uppercase text-primary italic ml-2 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Select Target Infrastructure
            </label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger className="h-14 w-full max-w-2xl rounded-2xl border-2 font-black uppercase text-[11px] tracking-widest bg-background/50 shadow-inner">
                <SelectValue placeholder="PICK A JOB NODE TO PROMOTE" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id} className="font-bold text-[10px] uppercase">
                    {j.title} — {j.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedJob ? (
            <div className="animate-in slide-in-from-bottom-2 duration-500">
              <ChannelPromotionCard job={selectedJob} />
            </div>
          ) : (
            !loading && (
              <div className="p-12 border-2 border-dashed rounded-[32px] text-center opacity-30 italic font-black uppercase text-xs tracking-widest">
                Zero active infrastructure nodes detected
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* SECTION: CANDIDATE-DRIVEN OUTREACH */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
        <CardHeader className="p-8 border-b border-border/10 bg-muted/10 text-left">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <Sparkles className="h-7 w-7 text-primary fill-primary/10" /> Identity_Outreach
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
                Extract intelligence from CV artifacts to generate hyper-personalized engagement scripts.
              </CardDescription>
            </div>
            <Activity className="h-6 w-6 text-primary/20" />
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-96 w-full rounded-2xl" />
              </div>
            }
          >
            <CVOutreachGenerator />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
