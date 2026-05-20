import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminSupportAssistant } from "@/domains/agents/api/agentsApi";
import {
  ArrowLeft,
  Search,
  Sparkles,
  Globe,
  Briefcase,
  GraduationCap,
  Calendar,
  Award,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { cn } from "@/lib/utils";
import { COUNTRIES, getCountryFlag, getCountryName } from "@/lib/constants/countries";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL_WIDE, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT } from "@/lib/uiTokens";

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
}

const STUDY_COUNTRIES = COUNTRIES.filter((c) =>
  ["US", "UK", "CA", "AU", "DE", "SG", "JP", "SE", "NL", "MY"].includes(c.code),
);

const DEGREE_TYPES = ["All Degrees", "Bachelor", "Master", "PhD", "Diploma"];

export default function StudyAbroad() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { balance } = useCredits();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get("country") || "all");
  const [selectedDegree, setSelectedDegree] = useState(searchParams.get("degree") || "All Degrees");

  // Digital Workforce Anomaly Protocol[cite: 6]
  const reportAnomaly = async (event: string, context: any) => {
    console.error(`[Digital Workforce Anomaly] ${event}`, context);
    try {
      await adminSupportAssistant({ type: "study_abroad_sync_error", event, context });
    } catch {
      // fire-and-forget telemetry
    }
  };

  // Sync state to URL for deep-linking[cite: 8]
  useEffect(() => {
    const params: any = {};
    if (selectedCountry !== "all") params.country = selectedCountry;
    if (selectedDegree !== "All Degrees") params.degree = selectedDegree;
    if (searchTerm) params.search = searchTerm;
    setSearchParams(params, { replace: true });
  }, [selectedCountry, selectedDegree, searchTerm, setSearchParams]);

  const {
    data: programs,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["study-abroad-programs", selectedCountry, selectedDegree, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("study_abroad_programs")
        .select("*")
        .eq("is_active", true)
        .order("featured", { ascending: false })
        .order("university_name");

      if (selectedCountry !== "all") query = query.eq("country_code", selectedCountry);
      if (selectedDegree !== "All Degrees") query = query.eq("degree_type", selectedDegree);
      if (searchTerm) {
        query = query.or(`university_name.ilike.%${searchTerm}%,program_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) {
        await reportAnomaly("ProgramRegistrySyncFailure", { error });
        throw error;
      }
      return (data as unknown as Program[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className={PAGE_SHELL_WIDE}>
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/learning")} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to Learning
      </Button>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h1 className={PAGE_TITLE}>Study Abroad</h1>
        </div>
        <p className={PAGE_SUBTITLE}>Browse global academic programs and build your AI roadmap.</p>
      </header>

      <Card className={CARD}>
        <CardContent className="p-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold">{balance} credits</p>
            <p className={cn(META_TEXT, "mt-0.5")}>Available for Roadmap synthesis</p>
          </div>
          <Button size="sm" onClick={() => navigate("/app/agents/study-abroad-advisor")}>
            <Sparkles className="h-4 w-4 mr-2" /> Consult Advisor
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Input
          placeholder="Search universities…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 rounded-xl"
        />
        <div className="grid grid-cols-2 gap-2">
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌍 All Countries</SelectItem>
              {STUDY_COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {getCountryFlag(c.code)} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDegree} onValueChange={setSelectedDegree}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder="Degree" />
            </SelectTrigger>
            <SelectContent>
              {DEGREE_TYPES.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={Globe}
          title="Registry unreachable"
          description="Sync failed. Please retry."
          action={{ label: "Retry", onClick: () => refetch() }}
        />
      ) : programs?.length ? (
        <div className="space-y-3">
          {programs.map((p) => (
            <Card
              key={p.id}
              className={cn(CARD, "cursor-pointer hover:border-primary/40 transition-all")}
              onClick={() => navigate(`/app/abroad/study/${p.id}`)}
            >
              <CardContent className="p-4 flex gap-4 items-center">
                <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center text-xl shrink-0">
                  {getCountryFlag(p.country_code)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black uppercase italic truncate">{p.university_name}</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                    {p.program_name}
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={cn(META_TEXT, "flex items-center gap-1")}>
                      <MapPin className="h-3 w-3" /> {p.country_name}
                    </span>
                    <span className={cn(META_TEXT, "flex items-center gap-1")}>
                      <GraduationCap className="h-3 w-3" /> {p.degree_type}
                    </span>
                    {p.scholarship_available && (
                      <span className="text-[9px] font-black text-emerald-600 uppercase italic">Scholarship</span>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Globe}
          title="No nodes found"
          description="Adjust your filters."
          action={{
            label: "Reset",
            onClick: () => {
              setSearchTerm("");
              setSelectedCountry("all");
              setSelectedDegree("All Degrees");
            },
          }}
        />
      )}
    </div>
  );
}
