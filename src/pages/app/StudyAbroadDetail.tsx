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
  Sparkles,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { getCountryFlag } from "@/lib/constants/countries";
import { useTalent } from "@/hooks/useTalent";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL, PAGE_TITLE, PAGE_SUBTITLE, SECTION_TITLE, META_TEXT, CARD } from "@/lib/uiTokens";

export default function StudyAbroadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { talent } = useTalent();

  const {
    data: program,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["study-abroad-program", id],
    queryFn: async () => {
      if (!id) throw new Error("Missing program id");
      const { data, error } = await supabase.from("study_abroad_programs").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    retry: 1,
  });

  const handleExternalClick = async (url: string) => {
    if (talent?.id && program) {
      await supabase.from("contacts").insert([
        {
          full_name: talent.fullName || "Anonymous",
          email: talent.email || "unknown",
          subject: `Interest: ${program.university_name}`,
          message: `Lead generated for ${program.program_name}.`,
        },
      ]);
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (isLoading)
    return (
      <div className={PAGE_SHELL}>
        <Skeleton className="h-8 w-32 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );

  if (isError || !program)
    return (
      <div className={PAGE_SHELL}>
        <EmptyState
          icon={GraduationCap}
          title="Program not found"
          description="This program may have been removed or is no longer available."
          action={{ label: "Back to programs", onClick: () => navigate("/app/abroad/study") }}
        />
      </div>
    );

  const requirements = Array.isArray(program.requirements) ? (program.requirements as string[]) : [];

  return (
    <div className={PAGE_SHELL}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className={META_TEXT}>Back to programs</span>
      </div>

      {/* Identity */}
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center text-3xl shrink-0 border border-border/40">
          {getCountryFlag(program.country_code)}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className={PAGE_TITLE}>{program.university_name}</h1>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {program.country_name}
          </div>
          {program.featured && (
            <Badge variant="secondary" className="text-[10px] h-5 mt-1">
              Featured
            </Badge>
          )}
        </div>
      </div>

      {/* Program */}
      <Card className={CARD}>
        <CardContent className="p-3 space-y-3">
          <div>
            <p className={PAGE_SUBTITLE}>Program</p>
            <h2 className="text-base font-semibold leading-tight">{program.program_name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{program.field_of_study}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {[
              { icon: GraduationCap, label: "Degree", val: program.degree_type },
              { icon: Clock, label: "Duration", val: program.duration || "—" },
              { icon: DollarSign, label: "Tuition", val: program.tuition_range || "—" },
              {
                icon: Calendar,
                label: "Deadline",
                val: program.application_deadline
                  ? format(new Date(program.application_deadline), "MMM d, yyyy")
                  : "Open",
              },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-border/40 p-2.5 bg-muted/20">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <s.icon className="h-3 w-3" />
                  {s.label}
                </div>
                <p className="text-sm font-semibold mt-1 leading-tight">{s.val}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      {requirements.length > 0 && (
        <div className="space-y-2">
          <h3 className={SECTION_TITLE}>Requirements</h3>
          <ul className="space-y-1.5">
            {requirements.map((req, idx) => (
              <li key={idx} className="flex gap-2 text-xs leading-relaxed">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                  {idx + 1}
                </span>
                <span className="text-foreground/80">{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Scholarship */}
      {program.scholarship_available && (
        <Card className={`${CARD} border-emerald-500/30 bg-emerald-500/5`}>
          <CardContent className="p-3 flex items-center gap-3">
            <Award className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold">Scholarship available</p>
              <p className="text-[11px] text-muted-foreground">Financial aid options for this program.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Advisor */}
      <Card className={`${CARD} border-primary/30 bg-primary/5`}>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-semibold">AI study abroad advisor</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Get a tailored admission roadmap, visa guidance, and SOP help.
          </p>
          <Button
            className="w-full h-10 rounded-xl text-sm"
            onClick={() => navigate("/app/agents/study-abroad-advisor")}
          >
            <MessageCircle className="mr-2 h-4 w-4" /> Start consultation
          </Button>
        </CardContent>
      </Card>

      {/* Sticky bottom CTA */}
      {program.url && (
        <div
          className="fixed bottom-16 left-0 right-0 p-3 bg-background/95 backdrop-blur border-t border-border/40 z-30"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="max-w-2xl mx-auto flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl text-sm"
              onClick={() => navigate("/app/agents/study-abroad-advisor")}
            >
              <ShieldCheck className="mr-2 h-4 w-4" /> Advisor
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl text-sm"
              onClick={() => handleExternalClick(program.url!)}
            >
              Apply <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
