import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap,
  MapPin,
  Calendar,
  DollarSign,
  ArrowLeft,
  ExternalLink,
  Clock,
  Award,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { COUNTRIES } from "@/lib/constants/countries";

export default function StudyAbroadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // FIX: Removed strict UUID regex which might be causing false negatives

  const {
    data: program,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["study-abroad-program", id],
    queryFn: async () => {
      if (!id) throw new Error("No Program ID provided");

      // FIX: Used 'maybeSingle()' instead of 'single()' to prevent 406 errors on 0 rows
      const { data, error } = await supabase.from("study_abroad_programs").select("*").eq("id", id).maybeSingle();

      if (error) {
        console.error("❌ Supabase Error:", error);
        throw error;
      }

      if (!data) {
        console.warn("⚠️ Program not found in database.");
        return null;
      }

      return data;
    },
    enabled: !!id,
    retry: false, // FIX: Don't retry indefinitely if it fails
  });

  const getCountryFlag = (code: string) => {
    return COUNTRIES.find((c) => c.code === code)?.flag || "🌍";
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Unable to Load Details</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {error ? (error as Error).message : "Program not found. It may have been removed."}
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => navigate("/app/abroad/study")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          {/* Added Retry Button */}
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const requirements = Array.isArray(program.requirements) ? program.requirements : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/abroad/study")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl border rounded-full w-10 h-10 flex items-center justify-center bg-background">
              {getCountryFlag(program.country_code)}
            </span>
            <h1 className="text-xl font-bold line-clamp-1">{program.university_name}</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-12">{program.country_name}</p>
        </div>
        {program.url && (
          <Button asChild className="hidden sm:flex">
            <a href={program.url} target="_blank" rel="noopener noreferrer">
              Apply Now
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        )}
      </div>

      {/* Program Details */}
      <Card className="mb-6 border-muted-foreground/20 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl md:text-2xl text-primary">{program.program_name}</CardTitle>
              {program.field_of_study && (
                <CardDescription className="mt-1 font-medium">{program.field_of_study}</CardDescription>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {program.featured && (
                <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20">
                  Featured
                </Badge>
              )}
              {program.scholarship_available && (
                <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-700 border-green-500/20">
                  <Award className="h-3 w-3" />
                  Scholarship
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-muted/30 rounded-lg border">
            {program.degree_type && (
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2.5 rounded-lg bg-background border shadow-sm">
                  <GraduationCap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Degree</p>
                  <p className="font-semibold">{program.degree_type}</p>
                </div>
              </div>
            )}
            {program.duration && (
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2.5 rounded-lg bg-background border shadow-sm">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Duration</p>
                  <p className="font-semibold">{program.duration}</p>
                </div>
              </div>
            )}
            {program.tuition_range && (
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2.5 rounded-lg bg-background border shadow-sm">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Tuition</p>
                  <p className="font-semibold">{program.tuition_range}</p>
                </div>
              </div>
            )}
            {program.application_deadline && (
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2.5 rounded-lg bg-background border shadow-sm">
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Deadline</p>
                  <p className="font-semibold">{format(new Date(program.application_deadline), "MMM d, yyyy")}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {program.intake_months && program.intake_months.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Intake Months
                </h3>
                <div className="flex flex-wrap gap-2">
                  {program.intake_months.map((month: string) => (
                    <Badge key={month} variant="outline" className="px-3 py-1 text-sm font-normal">
                      {month}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {requirements.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  Requirements
                </h3>
                <ul className="space-y-2.5">
                  {requirements.map((req: string, index: number) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      <span className="leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-r from-primary/5 via-background to-secondary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold mb-1 text-lg">Interested in this program?</h3>
              <p className="text-sm text-muted-foreground">Get personalized guidance from our AI career counselor.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => navigate("/app/agents/study-abroad-advisor")}
                className="w-full sm:w-auto"
              >
                Chat with Counselor
              </Button>
              {program.url && (
                <Button asChild className="w-full sm:w-auto">
                  <a href={program.url} target="_blank" rel="noopener noreferrer">
                    Visit Website
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
