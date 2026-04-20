import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  ArrowLeft,
  Play,
  FileText,
  CheckCircle,
  Clock,
  Lock,
  Coins,
  Sparkles,
  Trophy,
  ArrowRight,
  Zap,
  Target,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { useCredits } from "@/hooks/useCredits";
import { useTalent } from "@/hooks/useTalent";
import { getServiceCost } from "@/lib/creditPricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Language Calibration Hub (IELTS)
 * High-fidelity orchestrator for English proficiency resources and AI-led examiners.
 * 2026 Standard: Executive Logic geometry with real-time lead-gen telemetry.
 */

const SECTIONS = [
  { id: "listening", name: "Listening", icon: Headphones, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { id: "reading", name: "Reading", icon: BookOpen, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  { id: "writing", name: "Writing", icon: PenTool, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { id: "speaking", name: "Speaking", icon: Mic, color: "text-orange-500", bgColor: "bg-orange-500/10" },
];

const CONTENT_TYPE_ICONS: Record<string, any> = {
  video: Play,
  article: FileText,
  practice: CheckCircle,
  mock_test: Clock,
  tips: BookOpen,
};

interface IELTSResource {
  id: string;
  title: string;
  description: string | null;
  section: string;
  content_type: string;
  content_url: string | null;
  is_free: boolean;
  duration_mins: number | null;
  difficulty_level: string | null;
}

export default function IELTSPrep() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { balance, refreshBalance } = useCredits();

  const [activeSection, setActiveSection] = useState("listening");
  const [selectedResource, setSelectedResource] = useState<IELTSResource | null>(null);
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const ieltsCost = getServiceCost("IELTS_MOCK");

  const { data: unlockedResources, refetch: refetchAccess } = useQuery({
    queryKey: ["ielts-access", talent?.id],
    queryFn: async () => {
      if (!talent?.id) return [];
      const { data } = await supabase.from("ielts_resource_access").select("resource_id").eq("talent_id", talent.id);
      return data?.map((r) => r.resource_id) || [];
    },
    enabled: !!talent?.id,
  });

  const { data: resources, isLoading } = useQuery({
    queryKey: ["ielts-resources", activeSection],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ielts_resources")
        .select("*")
        .eq("section", activeSection)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data || [];
    },
  });

  const handleResourceClick = (resource: IELTSResource) => {
    const isUnlocked = resource.is_free || unlockedResources?.includes(resource.id);
    if (isUnlocked) {
      if (resource.content_url) {
        window.open(resource.content_url, "_blank");
      } else {
        toast.error("Artifact content node pending sync.");
      }
    } else {
      setSelectedResource(resource);
      setShowCreditGate(true);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!selectedResource || !talent?.id) return;
    setIsUnlocking(true);
    try {
      const { error: accessError } = await supabase
        .from("ielts_resource_access")
        .insert([{ talent_id: talent.id, resource_id: selectedResource.id }]);
      if (accessError) throw accessError;

      // CTO Lead-Gen Protocol: Sync with contact registry
      await supabase.from("contacts").insert([
        {
          full_name: talent.fullName,
          email: talent.email,
          subject: `IELTS Registry Unlock: ${selectedResource.title}`,
          message: `Talent synthesized a premium ${selectedResource.section} node. Initializing high-intent prep sequence.`,
        },
      ]);

      await refetchAccess();
      await refreshBalance();
      toast.success("Protocol Unlocked: Node Accessible");
      setShowCreditGate(false);
      if (selectedResource.content_url) window.open(selectedResource.content_url, "_blank");
    } catch (err) {
      toast.error("Handshake failed. Check credit ledger.");
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 pb-40 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Executive Header: Proficiency Context */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-12 w-12 hover:bg-primary/10 transition-all active:scale-90"
            onClick={() => navigate("/app/abroad")}
          >
            <ArrowLeft className="h-6 w-6 text-primary" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">Calibration Hub</h1>
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/5 text-primary border-primary/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic">
                Language Protocol v2.6
              </Badge>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
                AI-Driven Examiner Handshake
              </p>
            </div>
          </div>
        </div>

        <Card
          className="rounded-[32px] border-2 border-primary/20 bg-primary/5 shadow-2xl overflow-hidden min-w-[320px] group cursor-pointer hover:border-primary/40 transition-all"
          onClick={() => navigate("/app/agents/ielts-tutor")}
        >
          <CardContent className="p-6 flex items-center gap-5">
            <div className="h-14 w-14 rounded-[24px] bg-primary flex items-center justify-center rotate-3 shadow-primary/20 shadow-xl group-hover:rotate-0 transition-transform">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] italic mb-1">
                Diagnostic Protocol
              </p>
              <p className="text-sm font-black tracking-tight leading-none">Initialize Full Mock Test</p>
              <div className="flex items-center gap-2 mt-2">
                <Coins className="h-3 w-3 text-amber-500" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  100 Credit Execution
                </span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-primary/40" />
          </CardContent>
        </Card>
      </header>

      {/* Logic Stepper: Section Selection */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SECTIONS.map((s) => {
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "group relative flex flex-col p-6 rounded-[28px] border-2 transition-all duration-500 text-left overflow-hidden shadow-lg",
                isActive
                  ? "bg-primary border-primary text-primary-foreground shadow-primary/30 -translate-y-1"
                  : "bg-card border-border/40 hover:border-primary/40 hover:bg-muted/30",
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-2xl w-fit mb-6 transition-transform group-hover:rotate-6 shadow-inner",
                  isActive ? "bg-white/20" : s.bgColor,
                )}
              >
                <s.icon className={cn("h-7 w-7", isActive ? "text-white" : s.color)} />
              </div>
              <div>
                <p className="font-black uppercase tracking-tighter text-xl italic">{s.name}</p>
                <p
                  className={cn(
                    "text-[9px] font-black uppercase tracking-[0.3em] mt-2",
                    isActive ? "text-white/60" : "text-primary",
                  )}
                >
                  {isActive ? "Active Logic" : "Initialize Module"}
                </p>
              </div>
              {isActive && <Zap className="absolute top-4 right-4 h-5 w-5 text-white/20 fill-white" />}
            </button>
          );
        })}
      </div>

      {/* Registry Viewport: Skill Artifacts */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
            <Target className="h-4 w-4" /> {activeSection} Registry
          </h2>
          <Badge
            variant="outline"
            className="rounded-lg border-primary/20 text-primary font-black uppercase text-[9px] tracking-widest px-3 py-1"
          >
            {resources?.length || 0} Modules Sync'd
          </Badge>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-[32px] bg-muted/40" />
            ))}
          </div>
        ) : resources?.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => {
              const Icon = CONTENT_TYPE_ICONS[r.content_type] || FileText;
              const isUnlocked = r.is_free || unlockedResources?.includes(r.id);
              return (
                <Card
                  key={r.id}
                  className="group rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-500 hover:border-primary/40 hover:shadow-2xl cursor-pointer overflow-hidden"
                  onClick={() => handleResourceClick(r)}
                >
                  <CardContent className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="h-12 w-12 rounded-2xl bg-muted/50 border border-border/20 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all">
                        <Icon className="h-6 w-6 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                      </div>
                      {r.is_free ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase italic tracking-widest">
                          Protocol: Free
                        </Badge>
                      ) : isUnlocked ? (
                        <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase italic tracking-widest">
                          Verified Access
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-muted/80 text-[8px] font-black uppercase tracking-widest gap-2"
                        >
                          <Lock className="h-3 w-3" /> {ieltsCost} Credits
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight italic group-hover:text-primary transition-colors line-clamp-1">
                        {r.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground/60 font-medium leading-relaxed mt-2 line-clamp-2 italic">
                        {r.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 pt-2 border-t border-border/10">
                      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                        <Clock className="h-3.5 w-3.5" /> {r.duration_mins}m Duration
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[8px] font-black uppercase tracking-tighter border-muted-foreground/20 h-5"
                      >
                        Tier: {r.difficulty_level}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="py-32 text-center rounded-[48px] border-2 border-dashed border-border/40 bg-muted/5 animate-in zoom-in-95 duration-700">
            <Sparkles className="h-16 w-16 text-primary/10 mx-auto mb-8 rotate-12" />
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Expansion Protocols Active</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
              Daily artifact ingestion for {activeSection} logic is in progress.
            </p>
          </div>
        )}
      </section>

      {/* High-Fidelity Call-to-Action: AI Integration */}
      <Card className="rounded-[40px] border-none bg-slate-950 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-40 -mt-40 group-hover:bg-primary/20 transition-all duration-1000" />
        <CardContent className="p-10 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex items-center gap-8 text-center lg:text-left">
              <div className="h-20 w-20 rounded-[32px] bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 rotate-6 group-hover:rotate-0 transition-transform">
                <Mic className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic text-white leading-none">
                  Neural Speaking Examiner
                </h3>
                <p className="text-sm text-slate-400 font-medium italic">
                  Execute high-fidelity speaking simulations in real-time with verified scoring.
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full lg:w-auto h-16 px-12 rounded-2xl bg-white text-black hover:bg-slate-200 font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl transition-all hover:scale-105 active:scale-95"
              onClick={() => navigate("/app/agents/ielts-tutor")}
            >
              Start Simulation <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Terminal Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Language Registry: Verified Logic v2.6
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            Calibration Status: Optimized
          </p>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>

      {/* Logic Overlays */}
      <CreditGateModal
        isOpen={showCreditGate}
        onClose={() => setShowCreditGate(false)}
        onConfirm={handleConfirmPurchase}
        onBuyCredits={() => {
          setShowCreditGate(false);
          setShowPurchaseSheet(true);
        }}
        serviceName={selectedResource?.title || "IELTS Module"}
        cost={ieltsCost}
        currentBalance={balance}
        isLoading={isUnlocking}
      />
      <CreditPurchaseSheet
        isOpen={showPurchaseSheet}
        onClose={() => setShowPurchaseSheet(false)}
        currentBalance={balance}
      />
    </div>
  );
}
