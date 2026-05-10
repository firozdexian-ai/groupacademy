import { useState, useEffect } from "react";
import { useMarketingGraph } from "hooks/useMarketingGraph";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { cn } from "@/lib/utils";
import {
  Upload,
  Link,
  Loader2,
  MessageSquare,
  Copy,
  ExternalLink,
  User,
  Briefcase,
  CheckCircle,
  Phone,
  BarChart2,
  TrendingUp,
  PieChart,
  ShieldCheck,
  Zap,
  Globe,
  Send,
  Bot,
} from "lucide-react";

/**
 * Platform Logic: CV Intelligence Terminal & Outreach Ledger
 * 2026 Standard: Blended Phase 6 UI (Registry Ledger + AI Parsing Engine)
 */

export function TalentOutreachTab() {
  const { marketingGraphQuery } = useMarketingGraph();
  const { data: graphData, isLoading: isGraphLoading } = marketingGraphQuery;

  const [activeTab, setActiveTab] = useState<"ledger" | "generator" | "analytics">("ledger");

  // Legacy Generator State
  const [inputMode, setInputMode] = useState<"upload" | "url" | "text">("url");
  const [cvUrl, setCvUrl] = useState("");
  const [cvText, setCvText] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [selectedProduct, setSelectedProduct] = useState("digital-portfolio");
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [selectedSender, setSelectedSender] = useState("firoz");
  const [customSenderName, setCustomSenderName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // You can paste your existing loadAnalytics and processCV functions here...

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Phase 6 Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-blue-500">
            <Send className="h-8 w-8 text-blue-500 fill-blue-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Talent Outreach
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            AI-Driven Talent Acquisition Engine
          </p>
        </div>
        <Button
          onClick={() => setActiveTab("generator")}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Bot className="h-4 w-4" /> Trigger Campaign
        </Button>
      </header>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-muted/30 backdrop-blur-md rounded-[24px] border-2 border-border/40 p-1.5 mb-8 w-full max-w-2xl mx-auto flex">
          <TabsTrigger
            value="ledger"
            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg py-3"
          >
            <Send className="w-4 h-4" /> Active Ledger
          </TabsTrigger>
          <TabsTrigger
            value="generator"
            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg py-3"
          >
            <Zap className="w-4 h-4" /> CV Processor
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg py-3"
          >
            <BarChart2 className="w-4 h-4" /> Telemetry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="mt-0">
          <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600" />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10 border-b-2 border-border/20">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 pl-8">
                        Talent Node
                      </TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">
                        Delivery Channel
                      </TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-8">
                        Timestamp
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/5">
                    {isGraphLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-20 text-center">
                          <Skeleton className="h-8 w-32 mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : graphData?.talentOutreach?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-20 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground/50 italic"
                        >
                          Zero outreach signals detected.
                        </TableCell>
                      </TableRow>
                    ) : (
                      graphData?.talentOutreach?.map((row) => (
                        <TableRow key={row.id} className="group hover:bg-blue-500/[0.02]">
                          <TableCell className="py-6 pl-8">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-background border-2 border-border/20 flex items-center justify-center shrink-0">
                                <User className="h-3 w-3 text-blue-500" />
                              </div>
                              <span className="font-mono text-xs uppercase tracking-tight text-muted-foreground">
                                {row.talent_id?.substring(0, 8)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="font-mono text-[9px] uppercase tracking-widest border-2 text-blue-500 border-blue-500/20 bg-blue-500/10"
                            >
                              {row.channel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8 font-mono text-[10px] text-muted-foreground">
                            {new Date(row.sent_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generator" className="mt-0 space-y-10">
          <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden text-left">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
            <CardHeader className="p-10 border-b border-border/10 bg-muted/10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">
                    Outreach Generator
                  </CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">
                    Personalized CV Artifact Synthesis
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              {/* NOTE: Paste your original Input/Select fields and form logic here */}
              <div className="py-20 text-center font-black uppercase tracking-widest text-xs text-muted-foreground/40 italic border-2 border-dashed border-border/40 rounded-2xl">
                [ LEGACY FORM LOGIC RESERVED FOR MANUAL PASTE ]
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0 space-y-8">
          {isLoadingAnalytics ? (
            <Skeleton className="h-96 rounded-[40px]" />
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 p-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-6 italic text-left">
                  Distribution Breakdown
                </p>
                <div className="space-y-6 text-left">
                  {Object.entries(analyticsData?.productCounts || {}).map(([prod, count]: any) => (
                    <div key={prod} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                        <span className="text-muted-foreground">{prod.replace(/-/g, " ")}</span>
                        <span className="text-primary">{count} NODES</span>
                      </div>
                      <Progress value={(count / (analyticsData?.totalMessages || 1)) * 100} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TalentOutreachTab;
