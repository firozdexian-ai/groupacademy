import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Copy,
  Plus,
  Trash2,
  BookOpen,
  ClipboardCheck,
  MessageSquare,
  TrendingUp,
  Briefcase,
  Zap,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { StandaloneAssessmentCodeGenerator } from "@/components/dashboard/jobs/codes/StandaloneAssessmentCodeGenerator";
import { StandaloneMockInterviewCodeGenerator } from "@/components/dashboard/StandaloneMockInterviewCodeGenerator";
import { StandaloneSalaryCodeGenerator } from "@/components/dashboard/StandaloneSalaryCodeGenerator";
import { JobApplicationCodeGenerator } from "@/components/dashboard/jobs/codes/JobApplicationCodeGenerator";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "@/components/dashboard/DashboardSkeleton";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Institutional Entitlement Engine
 * CTO Reference: Authoritative administrative node for alphanumeric key generation and lifecycle management.
 */

interface AccessCode {
  id: string;
  code: string;
  content_id: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  notes: string | null;
  content: { title: string };
}

export const AccessCodeManager = () => {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [paidContent, setPaidContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [maxUses, setMaxUses] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    executeRegistrySync();
  }, []);

  const executeRegistrySync = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [codesRes, contentRes] = await Promise.all([
        supabase.from("access_codes").select(`*, content:content_id (title)`).order("created_at", { ascending: false }),
        supabase.from("content").select("id, title, price").gt("price", 0).eq("is_published", true).order("title"),
      ]);
      if (codesRes.error) throw codesRes.error;
      if (contentRes.error) throw contentRes.error;
      setCodes(codesRes.data || []);
      setPaidContent(contentRes.data || []);
    } catch (err: any) {
      setLoadError("REGISTRY_SYNC_FAULT: Check uplink.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateAlphanumericHash = () => {
    const registry = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 8 }, () => registry.charAt(Math.floor(Math.random() * registry.length))).join("");
  };

  const handleInitializeKey = async () => {
    if (!selectedContentId) return toast.error("TARGET_NODE_REQUIRED");
    setIsGenerating(true);
    try {
      const newHash = generateAlphanumericHash();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("AUTH_SESSION_MISSING");

      const { error } = await supabase.from("access_codes").insert({
        code: newHash,
        content_id: selectedContentId,
        max_uses: maxUses,
        created_by: user.id,
        notes: notes || null,
      });

      if (error) throw error;
      toast.success(`KEY_GENERATED: ${newHash}`);
      executeRegistrySync();
      setNotes("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) return <DashboardTableSkeleton rows={6} columns={4} />;
  if (loadError)
    return <DashboardErrorState title="Registry Fault" message={loadError} onRetry={executeRegistrySync} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Tabs defaultValue="courses" className="w-full">
        {/* HUD: ENTITLEMENT_NAV */}
        <TabsList className="h-14 w-full grid grid-cols-5 bg-muted/20 border-2 border-border/10 p-1.5 rounded-2xl mb-8">
          {[
            { v: "courses", i: BookOpen, l: "Courses" },
            { v: "assessment", i: ClipboardCheck, l: "Assess" },
            { v: "interview", i: MessageSquare, l: "Mock" },
            { v: "salary", i: TrendingUp, l: "Fiscal" },
            { v: "jobs", i: Briefcase, l: "Ops" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.v}
              value={tab.v}
              className="rounded-xl font-black uppercase italic text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg"
            >
              <tab.i className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{tab.l}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="courses" className="space-y-8 mt-0">
          {/* COMPONENT: GENERATION_GATE */}
          <Card className="rounded-[32px] border-2 border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
            <CardHeader className="p-8 pb-4 bg-primary/5 border-b-2 border-border/10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Zap className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <div className="space-y-1 text-left">
                  <CardTitle className="text-xl font-black uppercase italic tracking-tighter">
                    Initialize_Access_Key
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                    Course_Entitlement_Generator
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-2.5 text-left">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground italic">
                    Target_Curriculum_Node
                  </Label>
                  <Select value={selectedContentId} onValueChange={setSelectedContentId}>
                    <SelectTrigger className="h-14 bg-muted/20 border-2 rounded-2xl font-bold italic focus:ring-primary/20">
                      <SelectValue placeholder="Select_Paid_Content..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 italic font-bold">
                      {paidContent.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="py-3">
                          {c.title.toUpperCase()} — ${c.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5 text-left">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground italic">
                    Use_Quota
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                    className="h-14 bg-muted/20 border-2 rounded-2xl font-black italic text-lg tabular-nums"
                  />
                </div>
              </div>
              <div className="space-y-2.5 text-left">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground italic">
                  Administrative_Artifact_Notes
                </Label>
                <Input
                  placeholder="Student_ID, Payment_Ref, Institutional_Grant..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-14 bg-muted/20 border-2 rounded-2xl italic font-bold"
                />
              </div>
              <Button
                onClick={handleInitializeKey}
                disabled={isGenerating || !selectedContentId}
                className="w-full h-16 rounded-[24px] font-black uppercase italic tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary),0.2)] hover:shadow-primary/40 gap-3"
              >
                {isGenerating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
                INITIALIZE_REGISTRY_KEY
              </Button>
            </CardContent>
          </Card>

          {/* VIEWPORT: ACTIVE_LEDGER */}
          <Card className="rounded-[32px] border-2 border-border/40 bg-card/40 backdrop-blur-xl">
            <CardHeader className="p-8 pb-4 text-left">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-black uppercase italic tracking-widest">
                    Active_Key_Ledger
                  </CardTitle>
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                    Registry_Capacity: {codes.length}_Keys
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {codes.length === 0 ? (
                  <div className="col-span-full py-12 text-center opacity-30 italic text-sm uppercase font-black tracking-widest">
                    Registry_Empty
                  </div>
                ) : (
                  codes.map((item) => (
                    <div
                      key={item.id}
                      className="group relative border-2 border-border/10 rounded-2xl p-5 bg-muted/5 hover:border-primary/20 transition-all duration-300 flex items-center justify-between overflow-hidden"
                    >
                      <div className="space-y-2 min-w-0 text-left">
                        <div className="flex items-center gap-3">
                          <code className="text-xl font-black italic font-mono text-foreground leading-none tracking-tighter">
                            {item.code}
                          </code>
                          <Badge
                            className={cn(
                              "text-[8px] font-black uppercase h-5 rounded-md",
                              item.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500",
                            )}
                          >
                            {item.is_active ? "Verified" : "Offline"}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase italic text-primary truncate leading-none">
                            {item.content?.title.replace(" ", "_")}
                          </p>
                          <p className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] leading-none">
                            Sync_Quota: {item.current_uses}/{item.max_uses}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary transition-all active:scale-90"
                          onClick={() => {
                            navigator.clipboard.writeText(item.code);
                            toast.success("KEY_COPIED");
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-all active:scale-90"
                          onClick={() => {
                            supabase
                              .from("access_codes")
                              .delete()
                              .eq("id", item.id)
                              .then(() => executeRegistrySync());
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessment" className="mt-0">
          <StandaloneAssessmentCodeGenerator />
        </TabsContent>
        <TabsContent value="interview" className="mt-0">
          <StandaloneMockInterviewCodeGenerator />
        </TabsContent>
        <TabsContent value="salary" className="mt-0">
          <StandaloneSalaryCodeGenerator />
        </TabsContent>
        <TabsContent value="jobs" className="mt-0">
          <JobApplicationCodeGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
};
