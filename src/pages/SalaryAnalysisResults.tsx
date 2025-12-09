import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, Target, Lightbulb, CheckCircle, AlertTriangle, 
  ArrowRight, Download, Share2, Briefcase, FileText, Loader2
} from "lucide-react";

const SalaryAnalysisResults = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("salary_analyses")
          .select("*, profession_categories(name)")
          .eq("id", id)
          .single();

        if (error) throw error;
        setAnalysis(data);
      } catch (error) {
        console.error("Error fetching analysis:", error);
        toast({ title: "Failed to load results", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('en-BD').format(amount);
  };

  const getPositionBadge = (positioning: string) => {
    switch (positioning) {
      case "above_market":
        return <Badge className="bg-green-500">Above Market</Badge>;
      case "below_market":
        return <Badge variant="destructive">Below Market</Badge>;
      default:
        return <Badge variant="secondary">At Market Rate</Badge>;
    }
  };

  const getDemandBadge = (level: string) => {
    switch (level) {
      case "high":
        return <Badge className="bg-green-500">High Demand</Badge>;
      case "low":
        return <Badge variant="destructive">Low Demand</Badge>;
      default:
        return <Badge variant="secondary">Medium Demand</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!analysis || !analysis.ai_analysis) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Results Not Found</h1>
          <p className="text-muted-foreground mb-8">This analysis may still be processing or doesn't exist.</p>
          <Button asChild>
            <Link to="/salary-analysis">Back to Salary Analysis</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const ai = analysis.ai_analysis;
  const salaryRange = ai.market_salary_range;
  const skills = ai.skills_analysis;
  const tips = ai.negotiation_tips;
  const insights = ai.market_insights;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto max-w-4xl py-12 px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Your Salary Analysis Results</h1>
          <p className="text-muted-foreground">
            {analysis.job_title ? `For: ${analysis.job_title}` : "Job Analysis"} 
            {analysis.company_name && ` at ${analysis.company_name}`}
          </p>
          <div className="flex justify-center gap-2 mt-4">
            {getPositionBadge(ai.salary_positioning)}
            {getDemandBadge(insights?.demand_level)}
          </div>
        </div>

        {/* Summary */}
        <Card className="mb-6 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="pt-6">
            <p className="text-lg text-center">{ai.summary}</p>
          </CardContent>
        </Card>

        {/* Readiness Score */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Overall Readiness Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={ai.overall_readiness_score} className="h-4" />
              </div>
              <span className="text-3xl font-bold text-primary">{ai.overall_readiness_score}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Salary Range */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Market Salary Range
            </CardTitle>
            <CardDescription>{salaryRange?.market_context}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Minimum</p>
                <p className="text-2xl font-bold">৳{formatSalary(salaryRange?.min_monthly)}</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                <p className="text-sm text-muted-foreground">Median</p>
                <p className="text-2xl font-bold text-primary">৳{formatSalary(salaryRange?.median_monthly)}</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Maximum</p>
                <p className="text-2xl font-bold">৳{formatSalary(salaryRange?.max_monthly)}</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
            </div>
            <p className="text-center mt-4 text-sm text-muted-foreground">
              Experience Level: <Badge variant="outline">{salaryRange?.experience_level}</Badge>
            </p>
          </CardContent>
        </Card>

        {/* Skills Analysis */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Skills Gap Analysis
            </CardTitle>
            <CardDescription>
              Skills Gap Score: {skills?.skills_gap_score}% match
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Matching Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {skills?.matching_skills?.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800">
                      {skill}
                    </Badge>
                  ))}
                  {(!skills?.matching_skills || skills.matching_skills.length === 0) && (
                    <p className="text-sm text-muted-foreground">No matching skills identified</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Skills to Develop
                </h4>
                <div className="flex flex-wrap gap-2">
                  {skills?.missing_skills?.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="border-amber-500 text-amber-700">
                      {skill}
                    </Badge>
                  ))}
                  {(!skills?.missing_skills || skills.missing_skills.length === 0) && (
                    <p className="text-sm text-muted-foreground">No skill gaps identified</p>
                  )}
                </div>
              </div>
            </div>
            {skills?.recommendations && skills.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Recommendations</h4>
                <ul className="space-y-2">
                  {skills.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Negotiation Tips */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Negotiation Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tips?.map((tip: any, idx: number) => (
                <div key={idx} className="p-4 bg-muted/30 rounded-lg">
                  <p className="font-medium">{tip.tip}</p>
                  <p className="text-sm text-muted-foreground mt-1">{tip.rationale}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Plan */}
        {ai.action_plan && ai.action_plan.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Action Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {ai.action_plan.map((action: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Market Insights */}
        {insights && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Market Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Badge variant="outline">
                  Growth: {insights.growth_trajectory}
                </Badge>
              </div>
              {insights.industry_trends && insights.industry_trends.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Industry Trends:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {insights.industry_trends.map((trend: string, idx: number) => (
                      <li key={idx}>• {trend}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Separator className="my-8" />

        {/* CTAs */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Ready to Apply?</h3>
                  <p className="text-sm text-muted-foreground">Browse job openings now</p>
                </div>
                <Button asChild>
                  <Link to="/jobs">View Jobs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Build Your Portfolio</h3>
                  <p className="text-sm text-muted-foreground">Stand out from other candidates</p>
                </div>
                <Button asChild variant="outline">
                  <Link to="/portfolio">Get Portfolio</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Share/Download */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" disabled>
            <Download className="mr-2 h-4 w-4" />
            Download PDF (Coming Soon)
          </Button>
          <Button variant="outline" disabled>
            <Share2 className="mr-2 h-4 w-4" />
            Share (Coming Soon)
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SalaryAnalysisResults;
