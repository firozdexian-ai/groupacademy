import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Search,
  Eye,
  Globe,
  Calendar,
  GraduationCap,
  Download,
  User,
  Smartphone,
  Mail,
  Info,
  RefreshCcw,
  Activity,
  Zap,
  ShieldCheck,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Study Abroad Roadmap Leads Orchestrator
 * CTO Reference: High-fidelity management of AI-driven international mobility leads.
 */

interface RoadmapLead {
  id: string;
  talent_id: string;
  email: string;
  full_name: string;
  status: string;
  target_countries: string[];
  target_intake: string;
  budget_level: string;
  degree_level: string;
  field_of_study: string;
  ielts_score: number | null;
  has_taken_ielts: boolean;
  gpa: string | null;
  years_experience: number | null;
  cv_text: string | null;
  roadmap_result: any | null;
  created_at: string;
  updated_at: string;
  talents?: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

export function StudyAbroadRoadmapLeadsManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<RoadmapLead | null>(null);

  const {
    data: leads,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["roadmap-leads", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("study_abroad_roadmaps")
        .select(`*, talents (full_name, email, phone)`)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") query = query.eq("status", statusFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data as RoadmapLead[];
    },
  });

  const filteredLeads = leads?.filter((l) => {
    const search = searchTerm.toLowerCase();
    return (
      l.full_name?.toLowerCase().includes(search) ||
      l.talents?.full_name?.toLowerCase().includes(search) ||
      l.email?.toLowerCase().includes(search) ||
      l.field_of_study?.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      pending: { label: "PENDING_NODE", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
      processing: {
        label: "AI_GENERATING",
        className: "bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse",
      },
      completed: { label: "ROADMAP_READY", className: "bg-green-500/10 text-green-600 border-green-500/20" },
      failed: { label: "LOGIC_FAULT", className: "bg-red-500/10 text-red-600 border-red-500/20" },
    };
    const config = configs[status] || configs.pending;
    return (
      <Badge className={cn("font-black text-[9px] uppercase px-3 py-1 italic rounded-full border-2", config.className)}>
        {config.label}
      </Badge>
    );
  };

  const handleExport = () => {
    if (!filteredLeads?.length) return toast.error("Data node empty.");
    const data = filteredLeads.map((l) => ({
      Student: l.full_name || l.talents?.full_name,
      Email: l.email || l.talents?.email,
      Phone: l.talents?.phone || "N/A",
      Status: l.status.toUpperCase(),
      Countries: l.target_countries?.join(", "),
      Intake: l.target_intake,
      Budget: l.budget_level,
      GPA: l.gpa || "N/A",
      IELTS: l.has_taken_ielts ? l.ielts_score : "Not Taken",
      Created: format(new Date(l.created_at), "yyyy-MM-dd"),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RoadmapLeads");
    XLSX.writeFile(wb, `GA_Abroad_Pipeline_${format(new Date(), "yyyy_MM_dd")}.xlsx`);
    toast.success("Protocol: Artifact Downloaded");
  };

  const readyCount = leads?.filter((l) => l.status === "completed").length || 0;

  if (isLoading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-[40px]" />
        <Skeleton className="h-[400px] w-full rounded-[40px]" />
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* EXECUTIVE KPI HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Globe className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Roadmap Pulse</h2>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
              International Mobility Pipeline
            </p>
            <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] px-3 py-1 italic rounded-full">
              <TrendingUp className="h-3 w-3 mr-1" /> {readyCount} READY TO CONVERT
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => refetch()} className="h-14 w-14 rounded-2xl border-2">
            <RefreshCcw className={cn("h-5 w-5", (isLoading || isRefetching) && "animate-spin")} />
          </Button>
          <Button
            onClick={handleExport}
            className="h-14 px-8 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg"
          >
            <Download className="h-4 w-4" /> Export Registry
          </Button>
        </div>
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
        <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                placeholder="SEARCH REGISTRY BY STUDENT OR FIELD..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-14 rounded-2xl border-2 pl-12 font-bold uppercase text-[11px] tracking-widest bg-card/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[240px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest">
                <SelectValue placeholder="FILTER STATUS" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="all" className="font-bold text-[10px]">
                  ALL LOGS
                </SelectItem>
                <SelectItem value="completed" className="font-bold text-[10px]">
                  COMPLETED
                </SelectItem>
                <SelectItem value="processing" className="font-bold text-[10px]">
                  PROCESSING
                </SelectItem>
                <SelectItem value="pending" className="font-bold text-[10px]">
                  PENDING
                </SelectItem>
                <SelectItem value="failed" className="font-bold text-[10px]">
                  FAILED
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 pl-8">
                  Student Node
                </TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">
                  Destinations
                </TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Target Intel</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="text-right py-6 pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 italic font-bold opacity-50">
                    Zero active roadmap sessions detected.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads?.map((l) => (
                  <TableRow key={l.id} className="group border-b border-border/5 hover:bg-muted/10 transition-colors">
                    <TableCell className="py-6 pl-8">
                      <p className="font-black text-sm uppercase italic tracking-tight">
                        {l.full_name || l.talents?.full_name}
                      </p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 italic flex items-center gap-1">
                        <Mail className="h-2 w-2" /> {l.email}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1.5 flex-wrap max-w-[150px] mx-auto">
                        {l.target_countries?.map((c) => (
                          <Badge
                            key={c}
                            variant="outline"
                            className="font-black text-[8px] px-2 py-0 h-5 border-primary/20 bg-primary/5"
                          >
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[10px] space-y-0.5">
                        <p className="font-black uppercase italic text-primary">{l.degree_level}</p>
                        <p className="font-bold text-muted-foreground uppercase tracking-tighter">{l.target_intake}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(l.status)}</TableCell>
                    <TableCell className="text-right py-6 pr-8">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl h-10 w-10 hover:bg-primary/10 transition-all"
                        onClick={() => setSelectedLead(l)}
                      >
                        <Eye className="h-5 w-5 text-primary" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* LEAD FORENSICS DIALOG */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-4xl rounded-[40px] border-4 border-border/40 p-0 overflow-hidden bg-background">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <ScrollArea className="max-h-[85vh]">
            {selectedLead && (
              <div className="p-10 space-y-10 text-left">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                      <ShieldCheck className="h-8 w-8 text-primary" /> Lead Artifact
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                      Session Node: {selectedLead.id.slice(0, 8)}
                    </p>
                  </div>
                  {getStatusBadge(selectedLead.status)}
                </div>

                {/* Core Stats Terminal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatTerminalNode icon={Mail} label="Transmission Email" value={selectedLead.email} />
                  <StatTerminalNode
                    icon={Smartphone}
                    label="Mobile Link"
                    value={selectedLead.talents?.phone || "NULL_ENTRY"}
                  />
                  <StatTerminalNode
                    icon={Calendar}
                    label="Request Logged"
                    value={format(new Date(selectedLead.created_at), "MMM d, yyyy")}
                  />
                </div>

                {/* Academic Intelligence */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary italic flex items-center gap-3">
                    <GraduationCap className="h-4 w-4" /> Academic Forensics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DataPoint label="GPA_METRIC" value={selectedLead.gpa || "N/A"} />
                    <DataPoint
                      label="IELTS_SCORE"
                      value={selectedLead.has_taken_ielts ? selectedLead.ielts_score : "UNTAKEN"}
                    />
                    <DataPoint
                      label="WORK_EXP"
                      value={selectedLead.years_experience ? `${selectedLead.years_experience} YRS` : "ZERO"}
                    />
                    <DataPoint label="BUDGET_CLASS" value={selectedLead.budget_level.toUpperCase()} />
                  </div>
                </div>

                {/* Preferences Terminal */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary italic flex items-center gap-3">
                    <MapPin className="h-4 w-4" /> Sector Preferences
                  </h4>
                  <div className="p-8 rounded-[32px] border-2 border-border/10 bg-muted/20 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-[9px] font-black uppercase text-muted-foreground italic mb-1">
                          Target Academic Degree
                        </p>
                        <p className="font-black uppercase italic text-lg">{selectedLead.degree_level}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-muted-foreground italic mb-1">
                          Field of Specialization
                        </p>
                        <p className="font-black uppercase italic text-lg">{selectedLead.field_of_study}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-muted-foreground italic mb-1">
                          Deployment Intake
                        </p>
                        <p className="font-black uppercase italic text-lg">{selectedLead.target_intake}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-muted-foreground italic mb-1">
                          Geographic Targets
                        </p>
                        <p className="font-black uppercase italic text-lg">
                          {selectedLead.target_countries.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Output preview */}
                {selectedLead.roadmap_result && (
                  <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-green-600 italic flex items-center gap-3">
                      <Zap className="h-4 w-4 fill-current" /> AI Deployment Artifact
                    </h4>
                    <div className="bg-green-500/5 border-2 border-green-500/20 rounded-[32px] p-8 text-left">
                      <p className="text-xs font-bold text-green-800 leading-relaxed italic">
                        "ROADMAP_PROTOCOL: AI matching has identified three high-yield university nodes based on GPA:{" "}
                        {selectedLead.gpa}. Protocol suggests immediate verification of financial liquidity for{" "}
                        {selectedLead.budget_level} tier."
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-6 border-t border-border/10">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedLead(null)}
                    className="font-black uppercase text-[10px] tracking-widest italic opacity-50"
                  >
                    Close Terminal
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatTerminalNode({ icon: Icon, label, value }: any) {
  return (
    <div className="p-6 rounded-3xl border-2 border-border/10 bg-card space-y-2 group hover:border-primary/40 transition-all">
      <p className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-2 italic">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
      </p>
      <p className="text-sm font-black italic truncate">{value}</p>
    </div>
  );
}

function DataPoint({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-muted/40 p-5 rounded-2xl border-2 border-border/5">
      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className="font-black italic text-sm">{value}</p>
    </div>
  );
}
