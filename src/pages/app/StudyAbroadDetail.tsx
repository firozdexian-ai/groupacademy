import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStudyAbroadProgramById } from "@/domains/abroad/repo/abroadRepo";
import { insertContactLog } from "@/domains/marketing/repo/marketingRepo";
import { adminSupportAssistant } from "@/domains/agents/api/agentsApi";
import {
  ArrowLeft,
  Bot,
  Briefcase,
  GraduationCap,
  ExternalLink,
  Clock,
  Calendar,
  Award,
  Sparkles,
  AlertCircle,
  MessageCircle,
  ShieldCheck,
  MapPin,
  DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTalent } from "@/hooks/useTalent";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT } from "@/lib/uiTokens";
import { getCountryFlag } from "@/lib/constants/countries";
import { cn } from "@/lib/utils";

// Production Data Contracts[cite: 8]
interface Program {
  id: string;
  university_name: string;
  program_name: string;
  degree_type: string | null;
  tuition_range: string | null;
  country_code: string;
  country_name: string;
  duration: string | null;
  featured: boolean;
  scholarship_available: boolean;
  application_deadline: string | null;
  requirements: string[] | null;
  field_of_study: string | null;
  url: string | null;
}

export default function StudyAbroadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { talent } = useTalent();

  // Digital Workforce Anomaly Protocol
  const reportAnomaly = async (event: string, context: any) => {
    console.error(`[Digital Workforce Anomaly] ${event}`, context);
    try {
      await adminSupportAssistant({ type: "abroad_detail_error", event, context });
    } catch {
      // fire-and-forget telemetry
    }
  };

  const {
    data: program,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["study-abroad-program", id],
    queryFn: async () => {
      if (!id) throw new Error("Missing program id");
      const { data, error } = await supabase.from("study_abroad_programs").select("*").eq("id", id).maybeSingle();
      if (error) {
        await reportAnomaly("ProgramDetailFetchError", { id, error });
        throw error;
      }
      return data as Program | null;
    },
    enabled: !!id,
  });

  const handleExternalClick = async (url: string) => {
    if (talent?.id && program) {
      try {
        await supabase.from("contacts").insert([
          {
            full_name: talent.fullName || "Anonymous",
            email: talent.email || "unknown",
            subject: `Interest: ${program.university_name}`,
            message: `Lead generated for ${program.program_name}.`,
          },
        ]);
      } catch (e) {
        await reportAnomaly("LeadCaptureFailure", { id: program.id, error: e });
      }
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

  const requirements = Array.isArray(program.requirements) ? program.requirements : [];

  return (
    <div className={PAGE_SHELL}>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-4 rounded-xl">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Programs
      </Button>

      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center text-4xl shrink-0 border border-border/40">
          {getCountryFlag(program.country_code)}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className={PAGE_TITLE}>{program.university_name}</h1>
          <p className={cn(META_TEXT, "flex items-center gap-1.5")}>
            <MapPin className="h-3 w-3" /> {program.country_name}
          </p>
          {program.featured && (
            <Badge variant="secondary" className="text-[10px] h-5 mt-1 rounded-md">
              Featured
            </Badge>
          )}
        </div>
      </div>

      <Card className={CARD}>
        <CardContent className="p-5 space-y-4">
          <div>
            <p className={PAGE_SUBTITLE}>Program</p>
            <h2 className="text-base font-bold leading-tight">{program.program_name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{program.field_of_study}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <div key={i} className="rounded-xl border border-border/40 p-3 bg-muted/20">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                  <s.icon className="h-3 w-3" /> {s.label}
                </div>
                <p className="text-sm font-semibold mt-1.5">{s.val}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {requirements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary italic">Requirements</h3>
          <ul className="space-y-2">
            {requirements.map((req, idx) => (
              <li key={idx} className="flex gap-3 text-xs leading-relaxed font-medium">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                  {idx + 1}
                </span>
                <span className="text-foreground/80">{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {program.scholarship_available && (
        <Card className={cn(CARD, "border-emerald-500/30 bg-emerald-500/5")}>
          <CardContent className="p-4 flex items-center gap-4">
            <Award className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold">Scholarship available</p>
              <p className="text-[11px] text-muted-foreground">Financial aid options for this program.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={cn(CARD, "border-primary/30 bg-primary/5")}>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-semibold">AI study abroad advisor</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Get a tailored admission roadmap, visa guidance, and SOP help.
          </p>
          <Button className="w-full rounded-xl" onClick={() => navigate("/app/agents/study-abroad-advisor")}>
            <MessageCircle className="mr-2 h-4 w-4" /> Start consultation
          </Button>
        </CardContent>
      </Card>

      {program.url && (
        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border/40 z-30">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => navigate("/app/agents/study-abroad-advisor")}
            >
              <ShieldCheck className="mr-2 h-4 w-4" /> Advisor
            </Button>
            <Button className="flex-1 rounded-xl" onClick={() => handleExternalClick(program.url!)}>
              Apply <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
