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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RoadmapTimeline } from "@/components/abroad/RoadmapTimeline";
import { getCountryFlag } from "@/lib/constants/countries";
import { cn } from "@/lib/utils";

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

      setRoadmap({
        id: data.id,
        status: data.status || "pending",
        target_countries: data.target_countries || [],
        degree_level: data.degree_level,
        field_of_study: data.field_of_study,
        target_intake: data.target_intake || "",
        roadmap_result: data.roadmap_result as RoadmapResult | null,
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
      <div className="max-w-4xl mx-auto p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );

  if (!roadmap)
    return (
      <div className="p-20 text-center">
        <AlertCircle className="mx-auto mb-4" />
        <h3>Not Found</h3>
      </div>
    );

  if (roadmap.status === "pending" || roadmap.status === "processing") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="relative">
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
          <Sparkles className="h-6 w-6 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Designing Your Future...</h2>
          <p className="text-muted-foreground max-w-sm">
            Our AI is analyzing {roadmap.target_countries.length} countries and thousands of programs to build your
            roadmap.
          </p>
        </div>
        <div className="flex gap-2">
          {roadmap.target_countries.map((c) => (
            <Badge key={c} variant="secondary">
              {getCountryFlag(c)} {c}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground animate-pulse">Estimated time remaining: 20s</p>
      </div>
    );
  }

  if (roadmap.status === "failed" || !roadmap.roadmap_result) {
    return (
      <Card className="max-w-md mx-auto mt-20 border-destructive/20 bg-destructive/5">
        <CardContent className="p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h3 className="font-bold text-lg">Roadmap Generation Failed</h3>
          <p className="text-sm text-muted-foreground">
            We hit a snag while generating your plan. No credits were charged for this attempt.
          </p>
          <Button onClick={() => navigate("/app/abroad/roadmap")}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  const res = roadmap.roadmap_result;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/abroad")} className="shrink-0">
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Map className="text-primary h-8 w-8" /> Your Global Roadmap
            </h1>
            <p className="text-muted-foreground font-medium">
              {roadmap.degree_level} in {roadmap.field_of_study || "Selected Field"} • {roadmap.target_intake}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate("/app/agents/study-abroad-advisor")} className="shadow-lg shadow-primary/20">
          <MessageCircle className="mr-2 h-4 w-4" /> Discuss with AI Advisor
        </Button>
      </div>

      {/* Profile Assessment */}
      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="bg-primary/[0.02] border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Profile Readiness
            </CardTitle>
            <Badge
              className={cn(
                "px-4 py-1 text-xs font-bold uppercase",
                res.profileSummary.overallReadiness === "high"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700",
              )}
            >
              {res.profileSummary.overallReadiness} Readiness
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Key Strengths
            </h4>
            <ul className="space-y-2">
              {res.profileSummary.strengths.map((s, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-emerald-500">•</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-amber-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Strategic Gaps
            </h4>
            <ul className="space-y-2">
              {res.profileSummary.gaps.map((g, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-amber-500">•</span> {g}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs Container */}
      <Tabs defaultValue="universities" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/50 p-1">
          <TabsTrigger value="universities" className="text-xs sm:text-sm">
            Universities
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs sm:text-sm">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm">
            Docs
          </TabsTrigger>
          <TabsTrigger value="budget" className="text-xs sm:text-sm">
            Budget
          </TabsTrigger>
          <TabsTrigger value="scholarships" className="text-xs sm:text-sm">
            Grants
          </TabsTrigger>
        </TabsList>

        <TabsContent value="universities" className="pt-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {res.recommendedUniversities.map((uni, idx) => (
              <Card key={idx} className="group hover:border-primary/40 transition-all">
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "uppercase text-[10px] font-bold",
                        uni.tier === "reach"
                          ? "bg-purple-100 text-purple-700"
                          : uni.tier === "target"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700",
                      )}
                    >
                      {uni.tier}
                    </Badge>
                    <span className="text-xs font-bold text-primary">{uni.tuitionRange}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg leading-tight">{uni.name}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Globe className="h-3 w-3" /> {uni.country} • {uni.program}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-xs leading-relaxed italic">"{uni.fitReason}"</div>
                  <div className="flex justify-between items-center pt-2 border-t text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Deadline</span>
                    <span className="text-foreground">{uni.deadline}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <div className="py-4">
            <RoadmapTimeline timeline={res.timeline} />
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="p-0 divide-y">
              {res.documents.map((doc, i) => (
                <div key={i} className="p-4 flex gap-4 items-start hover:bg-muted/10 transition-colors">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      doc.required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-sm">{doc.name}</h5>
                      {doc.required && <Badge className="h-4 text-[9px]">Required</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{doc.tips}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="bg-blue-50/30 border-blue-100">
              <CardContent className="p-4">
                <p className="text-xs font-bold text-blue-700 uppercase mb-2">Tuition</p>
                <p className="text-xl font-bold">{res.budget.tuitionRange}</p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50/30 border-emerald-100">
              <CardContent className="p-4">
                <p className="text-xs font-bold text-emerald-700 uppercase mb-2">Living Cost</p>
                <p className="text-xl font-bold">{res.budget.livingExpenses}</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <p className="text-xs font-bold text-primary uppercase mb-2">Total Est.</p>
                <p className="text-xl font-bold">{res.budget.totalEstimate}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scholarships">
          <div className="grid gap-4">
            {res.scholarships.map((s, i) => (
              <Card key={i} className="border-l-4 border-l-amber-500">
                <CardContent className="p-5 flex justify-between items-center">
                  <div className="space-y-1">
                    <h5 className="font-bold">{s.name}</h5>
                    <p className="text-xs text-muted-foreground">{s.eligibility}</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700">{s.amount}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
