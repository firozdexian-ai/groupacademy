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

const SECTIONS = [
  { id: "listening", name: "Listening", icon: Headphones, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { id: "reading", name: "Reading", icon: BookOpen, color: "text-green-500", bgColor: "bg-green-500/10" },
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
        toast.error("Resource content is currently being updated.");
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
      // CTO FIX: Lead-Gen Tracking (Syncing with Contact system)
      const { error: accessError } = await supabase
        .from("ielts_resource_access")
        .insert([{ talent_id: talent.id, resource_id: selectedResource.id }]);
      if (accessError) throw accessError;

      await supabase.from("contacts").insert([
        {
          full_name: talent.fullName,
          email: talent.email,
          subject: `IELTS Resource Unlock: ${selectedResource.title}`,
          message: `Talent unlocked a premium ${selectedResource.section} resource. Potential candidate for full IELTS prep course.`,
        },
      ]);

      await refetchAccess();
      await refreshBalance();
      toast.success("Resource Unlocked!");
      setShowCreditGate(false);
      if (selectedResource.content_url) window.open(selectedResource.content_url, "_blank");
    } catch (err) {
      toast.error("Unlock failed. Please check your credit balance.");
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Header with Diagnostic Focus */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/abroad")} className="shrink-0">
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">IELTS Hub</h1>
            <p className="text-muted-foreground text-sm">Master your English proficiency with AI-powered practice.</p>
          </div>
        </div>

        <Card className="bg-primary/5 border-primary/20 shadow-lg shadow-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-primary">Full Mock Test</p>
              <p className="text-[10px] text-muted-foreground">Detailed Score Analysis (100 cr)</p>
            </div>
            <Button
              size="sm"
              variant="default"
              className="h-8 ml-2"
              onClick={() => navigate("/app/agents/ielts-tutor")}
            >
              Take Diagnostic
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Section Toggle Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SECTIONS.map((s) => {
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "flex flex-col p-4 rounded-2xl border transition-all text-left group",
                isActive
                  ? "bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/20"
                  : "bg-card hover:border-primary/50",
              )}
            >
              <div className={cn("p-2 rounded-xl w-fit mb-3", isActive ? "bg-white/20" : s.bgColor)}>
                <s.icon className={cn("h-6 w-6", isActive ? "text-white" : s.color)} />
              </div>
              <p className="font-bold text-lg">{s.name}</p>
              <p
                className={cn(
                  "text-[10px] uppercase font-bold tracking-widest",
                  isActive ? "text-white/70" : "text-muted-foreground",
                )}
              >
                Explore
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Materials
          <Badge variant="outline" className="text-[10px]">
            {resources?.length || 0} items
          </Badge>
        </h2>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : resources?.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => {
              const Icon = CONTENT_TYPE_ICONS[r.content_type] || FileText;
              const isUnlocked = r.is_free || unlockedResources?.includes(r.id);
              return (
                <Card
                  key={r.id}
                  className="group hover:border-primary/50 transition-all cursor-pointer overflow-hidden shadow-sm"
                  onClick={() => handleResourceClick(r)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </div>
                      {r.is_free ? (
                        <Badge className="bg-emerald-100 text-emerald-700">Free</Badge>
                      ) : isUnlocked ? (
                        <Badge className="bg-primary/10 text-primary">Unlocked</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" /> {ieltsCost} cr
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-tight mb-1">{r.title}</h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{r.description}</p>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {r.duration_mins}m
                      </span>
                      <Badge variant="outline" className="text-[9px] uppercase h-5">
                        {r.difficulty_level}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed">
            <Sparkles className="h-12 w-12 text-primary/30 mx-auto mb-4" />
            <h3 className="font-bold">Expansion in Progress</h3>
            <p className="text-sm text-muted-foreground">
              Our Content Developers are adding {activeSection} materials daily.
            </p>
          </div>
        )}
      </div>

      {/* AI Tutor Footer */}
      <Card className="bg-slate-900 text-white border-none overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Struggling with Speaking?</h3>
                <p className="text-slate-400 text-sm">Practice in real-time with our AI IELTS Examiner.</p>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full md:w-auto shadow-xl"
              onClick={() => navigate("/app/agents/ielts-tutor")}
            >
              Start Live Practice <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <CreditGateModal
        isOpen={showCreditGate}
        onClose={() => setShowCreditGate(false)}
        onConfirm={handleConfirmPurchase}
        onBuyCredits={() => {
          setShowCreditGate(false);
          setShowPurchaseSheet(true);
        }}
        serviceName={selectedResource?.title || "IELTS Resource"}
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

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
