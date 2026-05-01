import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Map,
  GraduationCap,
  Calendar,
  FileText,
  Wallet,
  Award,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  TrendingUp,
  Sparkles,
  Zap,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RoadmapTimeline } from "@/components/abroad/RoadmapTimeline";
import { getCountryFlag } from "@/lib/constants/countries";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Global Roadmap Result Viewport
 * High-fidelity synthesis of AI-generated academic trajectories.
 * 2026 Standard: Executive Logic geometry with real-time polling telemetry.
 */

interface RoadmapResult {
  profileSummary: {
    strengths: string[];
    gaps: string[];
    overallReadiness: "high" | "medium" | "low";
  };
  recommendedUniversities: Array<{
    name: string;
    country: string;
    program: string;
    ranking?: string;
    tuitionRange: string;
    fitReason: string;
    deadline: string;
    tier: "reach" | "target" | "safety";
  }>;
  timeline: Array<{
    month: number;
    title: string;
    tasks: string[];
    deadline?: string;
  }>;
  documents: Array<{
    name: string;
    required: boolean;
    tips: string;
  }>;
  budget: {
    tuitionRange: string;
    livingExpenses: string;
    totalEstimate: string;
  };
  scholarships: Array<{
    name: string;
    amount: string;
    eligibility: string;
  }>;
}

interface RoadmapData {
  id: string;
  status: string;
  target_countries: string[];
  degree_level: string;
  field_of_study: string | null;
  target_intake: string;
  roadmap_result: RoadmapResult | null;
}

export default function StudyAbroadRoadmapResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchRoadmap = async () => {
      const { data, error } = await supabase.from("study_abroad_roadmaps").select("*").eq("id", id).single();

      if (error) {
        setLoading(false);
        return;
      }

      const rawResult = data.roadmap_result as unknown as RoadmapResult | null;

      setRoadmap({
        id: data.id,
        status: data.status || "pending",
        target_countries: data.target_countries || [],
        degree_level: data.degree_level,
        field_of_study: data.field_of_study,
        target_intake: data.target_intake || "",
        roadmap_result: rawResult,
      });

      setLoading(false);

      if ((data.status === "pending" || data.status === "processing") && pollCount < 30) {
        setTimeout(() => setPollCount((p) => p + 1), 4000);
      }
    };

    fetchRoadmap();
  }, [id, pollCount]);

  if (loading)
    return (
      <div className="max-w-5xl mx-auto p-12 space-y-10 animate-pulse">
        <Skeleton className="h-10 w-48 rounded-xl bg-muted/40" />
        <Skeleton className="h-64 w-full rounded-[40px] bg-muted/40" />
        <div className="grid grid-cols-2 gap-8">
          <Skeleton className="h-40 rounded-[32px] bg-muted/40" />
          <Skeleton className="h-40 rounded-[32px] bg-muted/40" />
        </div>
      </div>
    );

  if (!roadmap)
    return (
      <div className="max-w-2xl mx-auto py-32 text-center animate-in fade-in zoom-in-95">
        <AlertCircle className="h-16 w-16 text-destructive/20 mx-auto mb-6 rotate-12" />
        <h2 className="text-3xl font-black uppercase tracking-tighter">List Missing</h2>
        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-2 italic">
          Artifact vanished or restricted by protocol.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate("/app/abroad")}
          className="mt-8 rounded-xl px-10 h-12 font-black uppercase text-[10px] tracking-widest border-2"
        >
          Return to Dashboard
        </Button>
      </div>
    );

  if (roadmap.status === "pending" || roadmap.status === "processing") {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <Card className="rounded-[48px] border-2 border-primary/20 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden py-24 text-center">
          <CardContent className="space-y-12">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
              <Loader2 className="h-20 w-20 animate-spin mx-auto text-primary relative z-10 stroke-[1.5px]" />
            </div>
            <div className="space-y-6 max-w-md mx-auto relative z-10">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">Generating Pathway...</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse italic">
                  Neural Analysis Active
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                Matching your logic parameters against academic nodes in {roadmap.target_countries.join(", ")}.
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                {roadmap.target_countries.map((c) => (
                  <Badge
                    key={c}
                    variant="secondary"
                    className="px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest bg-muted/50"
                  >
                    {getCountryFlag(c)} {c}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (roadmap.status === "failed" || !roadmap.roadmap_result)
    return (
      <div className="max-w-2xl mx-auto py-20">
        <Card className="rounded-[40px] border-2 border-destructive/20 bg-destructive/5 shadow-none p-12 text-center">
          <AlertCircle className="h-16 w-16 text-destructive/40 mx-auto mb-8 rotate-12" />
          <h3 className="text-3xl font-black uppercase tracking-tighter italic">Synthesis Interrupted</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3 mb-10 max-w-xs mx-auto leading-relaxed">
            The AI consultant encountered a logic fault. Credits have been reverted.
          </p>
          <Button
            onClick={() => navigate("/app/abroad/roadmap")}
            className="rounded-xl h-12 px-10 font-black uppercase text-[10px] tracking-widest"
          >
            Restart Intake Sequence
          </Button>
        </Card>
      </div>
    );

  const res = roadmap.roadmap_result;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 pb-40 space-y-12 animate-in fade-in duration-1000">
      {/* Header Section: Trajectory Identity */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-12 w-12 hover:bg-primary/5"
            onClick={() => navigate("/app/abroad")}
          >
            <ArrowLeft className="h-6 w-6 text-primary" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none flex items-center gap-4">
              <Map className="text-primary h-10 w-10" /> Strategic Roadmap
            </h1>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.4em] italic">
              {roadmap.degree_level} in {roadmap.field_of_study || "Generic Field"} • {roadmap.target_intake}
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate("/app/agents/study-abroad-advisor")}
          className="rounded-2xl h-14 px-8 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 group"
        >
          <MessageCircle className="mr-3 h-5 w-5 fill-current group-hover:rotate-12 transition-transform" /> Initialize
          AI Consultation
        </Button>
      </header>

      {/* Profile Assessment: Competitive Analysis */}
      <Card className="rounded-[48px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
          <TrendingUp className="h-48 w-48" />
        </div>
        <CardHeader className="p-10 border-b border-border/10 bg-muted/20">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Logic Sync Status</p>
              <CardTitle className="text-3xl font-black tracking-tighter uppercase italic">
                Profile Readiness Matrix
              </CardTitle>
            </div>
            <Badge
              className={cn(
                "px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl border-none",
                res.profileSummary.overallReadiness === "high"
                  ? "bg-emerald-500 text-white"
                  : "bg-amber-500 text-white",
              )}
            >
              {res.profileSummary.overallReadiness} Readiness Node
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-10 grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <h4 className="text-[11px] font-black text-emerald-600 flex items-center gap-3 uppercase tracking-[0.3em] italic">
              <ShieldCheck className="h-5 w-5" /> Competitive Assets
            </h4>
            <div className="grid gap-4">
              {res.profileSummary.strengths.map((s, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 italic text-sm font-medium leading-relaxed group/item"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0 group-hover/item:scale-150 transition-transform" />
                  <span className="text-foreground/80">{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-8">
            <h4 className="text-[11px] font-black text-amber-600 flex items-center gap-3 uppercase tracking-[0.3em] italic">
              <Zap className="h-5 w-5" /> Logic Setup Req'd
            </h4>
            <div className="grid gap-4">
              {res.profileSummary.gaps.map((g, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 italic text-sm font-medium leading-relaxed group/item"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0 group-hover/item:scale-150 transition-transform" />
                  <span className="text-foreground/80">{g}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Orchestration HUD */}
      <Tabs defaultValue="universities" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-16 bg-muted/30 backdrop-blur-md rounded-[32px] border border-border/40 p-1.5 shadow-xl">
          {[
            { id: "universities", label: "Artifacts", icon: Globe },
            { id: "timeline", label: "Temporal", icon: Calendar },
            { id: "documents", label: "Payload", icon: FileText },
            { id: "budget", label: "Ledger", icon: Wallet },
            { id: "scholarships", label: "Rewards", icon: Award },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-[24px] font-black uppercase text-[9px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all"
            >
              <tab.icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Viewport: Universities */}
        <TabsContent value="universities" className="pt-10 outline-none animate-in slide-in-from-bottom-6 duration-700">
          <div className="grid md:grid-cols-2 gap-8">
            {res.recommendedUniversities.map((uni, idx) => (
              <Card
                key={idx}
                className="group rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-500 hover:border-primary/40 hover:shadow-2xl overflow-hidden cursor-pointer"
              >
                <CardContent className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <Badge
                      className={cn(
                        "rounded-lg font-black uppercase text-[8px] tracking-[0.2em] px-3 py-1 border-none",
                        uni.tier === "reach"
                          ? "bg-purple-500 text-white"
                          : uni.tier === "target"
                            ? "bg-blue-500 text-white"
                            : "bg-emerald-500 text-white",
                      )}
                    >
                      {uni.tier} Node
                    </Badge>
                    <div className="flex items-center gap-2 bg-primary/5 px-3 py-1 rounded-lg border border-primary/10">
                      <Zap className="h-3 w-3 text-primary fill-current" />
                      <span className="text-[10px] font-black text-primary italic">{uni.tuitionRange}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black uppercase tracking-tighter italic leading-none group-hover:text-primary transition-colors line-clamp-1">
                      {uni.name}
                    </h4>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">
                      <Globe className="h-3.5 w-3.5 text-primary/30" /> {uni.country}{" "}
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/20" /> {uni.program}
                    </div>
                  </div>
                  <div className="p-5 rounded-[24px] bg-muted/20 border-2 border-dashed border-border/60 italic text-sm font-medium text-foreground/70 leading-relaxed shadow-inner">
                    "{uni.fitReason}"
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-border/10 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
                    <span>Synchronization Deadline</span>
                    <span className="text-foreground tracking-normal">{uni.deadline}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab Viewport: Timeline */}
        <TabsContent value="timeline" className="pt-10 outline-none">
          <div className="bg-card/30 backdrop-blur-sm rounded-[48px] border-2 border-border/40 p-10 shadow-2xl">
            <RoadmapTimeline timeline={res.timeline} />
          </div>
        </TabsContent>

        {/* Tab Viewport: Documents */}
        <TabsContent value="documents" className="pt-10 outline-none">
          <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden shadow-2xl">
            <CardContent className="p-0 divide-y divide-border/10">
              {res.documents.map((doc, i) => (
                <div key={i} className="p-8 flex gap-8 items-start hover:bg-primary/[0.02] transition-all group">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center border-2 shrink-0 transition-all group-hover:rotate-6",
                      doc.required
                        ? "bg-primary/5 border-primary/20 text-primary shadow-xl shadow-primary/5"
                        : "bg-muted border-border/60 text-muted-foreground/40",
                    )}
                  >
                    <FileText className="h-8 w-8" />
                  </div>
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-4">
                      <h5 className="text-xl font-black uppercase tracking-tighter italic">{doc.name}</h5>
                      {doc.required && (
                        <Badge className="bg-primary text-white border-none text-[8px] font-black tracking-widest px-3">
                          MANDATORY_LOGIC
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium italic text-muted-foreground/80 leading-relaxed max-w-2xl">
                      {doc.tips}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Viewport: Ledger (Budget) */}
        <TabsContent value="budget" className="pt-10 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                label: "Temporal Cost (Tuition)",
                val: res.budget.tuitionRange,
                icon: Wallet,
                color: "text-blue-500",
                bg: "bg-blue-500/5",
                border: "border-blue-500/20",
              },
              {
                label: "Environment Cost (Living)",
                val: res.budget.livingExpenses,
                icon: Globe,
                color: "text-emerald-500",
                bg: "bg-emerald-500/5",
                border: "border-emerald-500/20",
              },
              {
                label: "Total Economic Load",
                val: res.budget.totalEstimate,
                icon: TrendingUp,
                color: "text-primary",
                bg: "bg-primary/5",
                border: "border-primary/20",
              },
            ].map((node, i) => (
              <Card
                key={i}
                className={cn(
                  "rounded-[32px] border-2 shadow-xl overflow-hidden group hover:scale-[1.02] transition-all",
                  node.bg,
                  node.border,
                )}
              >
                <CardContent className="p-8 space-y-6">
                  <div
                    className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:rotate-6",
                      node.bg,
                      node.border,
                    )}
                  >
                    <node.icon className={cn("h-7 w-7", node.color)} />
                  </div>
                  <div>
                    <p className={cn("text-[9px] font-black uppercase tracking-[0.3em] mb-2 italic", node.color)}>
                      {node.label}
                    </p>
                    <p className="text-3xl font-black italic tracking-tighter leading-none">{node.val}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab Viewport: Rewards (Scholarships) */}
        <TabsContent value="scholarships" className="pt-10 outline-none">
          <div className="grid gap-6">
            {res.scholarships.map((s, i) => (
              <Card
                key={i}
                className="group rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden hover:border-amber-500/30 transition-all duration-500 shadow-lg"
              >
                <CardContent className="p-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex gap-8 items-start flex-1">
                    <div className="h-16 w-16 rounded-[24px] bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center shrink-0 shadow-xl shadow-amber-500/5 group-hover:rotate-6 transition-transform">
                      <Award className="h-8 w-8 text-amber-600" />
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-2xl font-black uppercase tracking-tighter italic">{s.name}</h5>
                      <p className="text-sm font-medium italic text-muted-foreground/60 leading-relaxed max-w-xl">
                        {s.eligibility}
                      </p>
                    </div>
                  </div>
                  <div className="text-right w-full md:w-auto">
                    <Badge className="bg-amber-500 text-white text-lg font-black italic tracking-tighter px-8 py-3 rounded-2xl shadow-2xl shadow-amber-500/30 border-none">
                      {s.amount}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Operational Trace Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Roadmap Files: Synchronized
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            Logic Node: Global Academic v2.6.4
          </p>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}
