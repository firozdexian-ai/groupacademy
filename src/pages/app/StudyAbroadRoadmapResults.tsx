import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  RefreshCw,
  Download,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Globe,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { RoadmapTimeline } from "@/components/abroad/RoadmapTimeline";
import { getCountryFlag } from "@/lib/constants/countries";

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
    deadline?: string;
    tips: string;
  }>;
  budget: {
    tuitionRange: string;
    livingExpenses: string;
    applicationFees: string;
    testFees: string;
    visaCosts: string;
    totalEstimate: string;
  };
  scholarships: Array<{
    name: string;
    amount: string;
    eligibility: string;
    deadline?: string;
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
  created_at: string;
}

// Helper to safely cast JSON to RoadmapResult
function parseRoadmapResult(data: unknown): RoadmapResult | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  if (!obj.profileSummary || !obj.recommendedUniversities || !obj.timeline) return null;
  return data as RoadmapResult;
}

export default function StudyAbroadRoadmapResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { talent } = useTalent();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchRoadmap = async () => {
      const { data, error } = await supabase
        .from("study_abroad_roadmaps")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching roadmap:", error);
        setIsLoading(false);
        return;
      }

      // Safely convert DB response to our interface
      const roadmapData: RoadmapData = {
        id: data.id,
        status: data.status || 'pending',
        target_countries: data.target_countries,
        degree_level: data.degree_level,
        field_of_study: data.field_of_study,
        target_intake: data.target_intake || '',
        roadmap_result: parseRoadmapResult(data.roadmap_result),
        created_at: data.created_at || '',
      };

      setRoadmap(roadmapData);
      setIsLoading(false);

      // Poll if still processing
      if (data.status === "pending" || data.status === "processing") {
        if (pollCount < 60) {
          // Max 5 minutes of polling
          setTimeout(() => setPollCount((p) => p + 1), 5000);
        }
      }
    };

    fetchRoadmap();
  }, [id, pollCount]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Roadmap Not Found</h2>
        <Button onClick={() => navigate("/app/abroad")}>Back to Career Abroad</Button>
      </div>
    );
  }

  const isProcessing = roadmap.status === "pending" || roadmap.status === "processing";
  const isFailed = roadmap.status === "failed";
  const result = roadmap.roadmap_result;

  // Processing state
  if (isProcessing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/abroad")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Generating Your Roadmap</h1>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">AI is analyzing your profile...</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We're creating a personalized 12-month roadmap with university recommendations, timeline, and budget estimates.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {roadmap.target_countries.map((code) => (
                <Badge key={code} variant="secondary">
                  {getCountryFlag(code)} {code}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">This usually takes 30-60 seconds</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Failed state
  if (isFailed || !result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/abroad")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Roadmap Generation Failed</h1>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We couldn't generate your roadmap. Please try again or contact support.
            </p>
            <Button onClick={() => navigate("/app/abroad/roadmap")}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const readinessColor = {
    high: "text-green-600 bg-green-100",
    medium: "text-yellow-600 bg-yellow-100",
    low: "text-red-600 bg-red-100",
  };

  const tierColors = {
    reach: "bg-purple-100 text-purple-700 border-purple-200",
    target: "bg-blue-100 text-blue-700 border-blue-200",
    safety: "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/abroad")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Your Study Abroad Roadmap
            </h1>
            <p className="text-sm text-muted-foreground">
              {roadmap.degree_level} • {roadmap.field_of_study || "General"} • {roadmap.target_intake}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/app/agents/study-abroad-advisor")}>
            <MessageCircle className="h-4 w-4 mr-1" />
            Ask Advisor
          </Button>
        </div>
      </div>

      {/* Profile Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Profile Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Overall Readiness:</span>
            <Badge className={readinessColor[result.profileSummary.overallReadiness]}>
              {result.profileSummary.overallReadiness.toUpperCase()}
            </Badge>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Strengths
              </h4>
              <ul className="space-y-1">
                {result.profileSummary.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-orange-700 mb-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> Areas to Improve
              </h4>
              <ul className="space-y-1">
                {result.profileSummary.gaps.map((g, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    • {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="timeline" className="text-xs">
            <Calendar className="h-4 w-4 mr-1 hidden sm:inline" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="universities" className="text-xs">
            <GraduationCap className="h-4 w-4 mr-1 hidden sm:inline" />
            Universities
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">
            <FileText className="h-4 w-4 mr-1 hidden sm:inline" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="budget" className="text-xs">
            <Wallet className="h-4 w-4 mr-1 hidden sm:inline" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="scholarships" className="text-xs">
            <Award className="h-4 w-4 mr-1 hidden sm:inline" />
            Scholarships
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <RoadmapTimeline timeline={result.timeline} />
        </TabsContent>

        {/* Universities Tab */}
        <TabsContent value="universities" className="space-y-4">
          {result.recommendedUniversities.map((uni, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h4 className="font-semibold">{uni.name}</h4>
                      <Badge className={tierColors[uni.tier]} variant="outline">
                        {uni.tier.charAt(0).toUpperCase() + uni.tier.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {uni.country}
                      </span>
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {uni.program}
                      </span>
                      {uni.ranking && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {uni.ranking}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{uni.fitReason}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-primary font-medium">{uni.tuitionRange}</span>
                      <span className="text-muted-foreground">Deadline: {uni.deadline}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardContent className="p-4 space-y-4">
              {result.documents.map((doc, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      doc.required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <FileText className="h-3 w-3" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{doc.name}</h4>
                      {doc.required && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{doc.tips}</p>
                    {doc.deadline && <p className="text-xs text-primary mt-1">Due: {doc.deadline}</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Tuition (Annual)</p>
                  <p className="font-semibold">{result.budget.tuitionRange}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Living Expenses (Monthly)</p>
                  <p className="font-semibold">{result.budget.livingExpenses}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Application Fees</p>
                  <p className="font-semibold">{result.budget.applicationFees}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Test Fees</p>
                  <p className="font-semibold">{result.budget.testFees}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Visa Costs</p>
                  <p className="font-semibold">{result.budget.visaCosts}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-xs text-primary">Total First Year Estimate</p>
                  <p className="font-bold text-primary">{result.budget.totalEstimate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scholarships Tab */}
        <TabsContent value="scholarships" className="space-y-4">
          {result.scholarships.map((scholarship, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <Award className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{scholarship.name}</h4>
                    <p className="text-sm text-primary font-medium">{scholarship.amount}</p>
                    <p className="text-sm text-muted-foreground mt-1">{scholarship.eligibility}</p>
                    {scholarship.deadline && (
                      <p className="text-xs text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Deadline: {scholarship.deadline}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
