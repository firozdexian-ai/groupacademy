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
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { COUNTRIES, getCountryFlag } from "@/lib/constants/countries";
import { toast } from "sonner";
import { useTalent } from "@/hooks/useTalent";

export default function StudyAbroadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { talent } = useTalent();

  const {
    data: program,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["study-abroad-program", id],
    queryFn: async () => {
      if (!id) throw new Error("No Program ID provided");
      const { data, error } = await supabase.from("study_abroad_programs").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return data;
    },
    enabled: !!id,
    retry: 1,
  });

  // CTO FIX: Lead Generation Trigger (Addressing March Report Gap)
  const handleExternalClick = async (url: string) => {
    if (talent?.id && program) {
      // Create a contact record for follow-up by Study Abroad Coordinators
      await supabase.from("contacts").insert({
        talent_id: talent.id,
        first_name: talent.full_name?.split(" ")[0] || "Candidate",
        last_name: talent.full_name?.split(" ").slice(1).join(" ") || "Interest",
        email: talent.email,
        subject: `Interest in ${program.university_name}`,
        message: `User viewed and clicked external link for ${program.program_name} (${program.university_name}).`,
        source: "study_abroad_detail",
      });
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (isLoading)
    return (
      <div className="max-w-4xl mx-auto p-10 space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  if (isError || !program) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Program Sync Error</h2>
        <p className="text-muted-foreground mb-6">{(error as Error)?.message || "Program data unavailable."}</p>
        <Button onClick={() => navigate("/app/abroad/study")} variant="outline">
          Return to Catalog
        </Button>
      </div>
    );
  }

  const requirements = Array.isArray(program.requirements) ? program.requirements : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-32 sm:pb-10 space-y-6">
      {/* Header Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back to Search
        </Button>
        {program.url && (
          <Button
            onClick={() => handleExternalClick(program.url!)}
            className="hidden sm:flex shadow-lg shadow-primary/20"
          >
            Apply Externally <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center text-4xl border shadow-inner shrink-0">
          {getCountryFlag(program.country_code)}
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{program.university_name}</h1>
            {program.featured && (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Featured University</Badge>
            )}
          </div>
          <p className="text-lg text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> {program.country_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/10 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-primary" />
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">{program.program_name}</CardTitle>
              <CardDescription className="text-base font-medium">{program.field_of_study}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Quick Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-muted/50 border space-y-1">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Degree</p>
                  <p className="text-sm font-bold">{program.degree_type}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border space-y-1">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Duration</p>
                  <p className="text-sm font-bold">{program.duration || "N/A"}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border space-y-1">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Tuition</p>
                  <p className="text-sm font-bold">{program.tuition_range || "Contact"}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border space-y-1">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Deadline</p>
                  <p className="text-sm font-bold">
                    {program.application_deadline ? format(new Date(program.application_deadline), "MMM d") : "Rolling"}
                  </p>
                </div>
              </div>

              {/* Requirements List */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" /> Admission Requirements
                </h3>
                <div className="grid gap-3">
                  {requirements.length > 0 ? (
                    requirements.map((req, idx) => (
                      <div
                        key={idx}
                        className="flex gap-3 p-3 rounded-lg border bg-background hover:border-primary/30 transition-colors"
                      >
                        <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <span className="text-sm leading-snug">{req}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Generic requirements apply. Consult our advisor.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar CTAs */}
        <div className="space-y-6">
          <Card className="border-primary bg-primary/[0.02] shadow-lg shadow-primary/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <span className="font-bold tracking-tight">AI Admissions Help</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Get a custom roadmap, visa guidance, and SOP editing from our specialized Admissions Agent.
              </p>
              <Button className="w-full h-11" onClick={() => navigate("/app/agents/study-abroad-advisor")}>
                <MessageCircle className="mr-2 h-4 w-4" /> Start Consultation
              </Button>
            </CardContent>
          </Card>

          {program.scholarship_available && (
            <Card className="bg-emerald-50/50 border-emerald-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Financial Aid</p>
                  <p className="text-xs text-emerald-700">Scholarships are active for this program.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t z-20 flex gap-3 sm:hidden">
        <Button variant="outline" className="flex-1 h-12" onClick={() => navigate("/app/agents/study-abroad-advisor")}>
          Chat AI
        </Button>
        {program.url && (
          <Button className="flex-1 h-12" onClick={() => handleExternalClick(program.url!)}>
            Visit University
          </Button>
        )}
      </div>
    </div>
  );
}
