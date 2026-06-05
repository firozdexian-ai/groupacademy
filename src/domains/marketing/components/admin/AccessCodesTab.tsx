import { useState } from "react";
import { useMarketingGraph } from "./hooks/useMarketingGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Trash2,
  Key,
  ShieldCheck,
  Copy,
  RefreshCw,
  BookOpen,
  ClipboardCheck,
  MessageSquare,
  TrendingUp,
  Briefcase,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StandaloneAssessmentCodeGenerator } from "@/domains/jobs/components/admin/codes/StandaloneAssessmentCodeGenerator";
import { StandaloneMockInterviewCodeGenerator } from "@/domains/marketing/components/admin/StandaloneMockInterviewCodeGenerator";
import { StandaloneSalaryCodeGenerator } from "@/domains/marketing/components/admin/StandaloneSalaryCodeGenerator";
import { JobApplicationCodeGenerator } from "@/domains/jobs/components/admin/codes/JobApplicationCodeGenerator";
import { useQuery } from "@tanstack/react-query";
import { listPublishedPaidContent } from "@/domains/marketing/repo/marketingRepo";
import { cn } from "@/lib/utils";

export function AccessCodesTab() {
  const { marketingGraphQuery, mutations: { upsertAccessCode, deleteAccessCode } } = useMarketingGraph();
  const { data, isLoading } = marketingGraphQuery;

  const { data: paidContent } = useQuery({
    queryKey: ["paid_content_for_codes"],
    queryFn: listPublishedPaidContent,
  });

  const [selectedContentId, setSelectedContentId] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [notes, setNotes] = useState("");

  const generateAlphanumericHash = () => {
    const registry = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 8 }, () =>
      registry.charAt(Math.floor(Math.random() * registry.length)),
    ).join("");
  };

  const handleInitializeKey = () => {
    if (!selectedContentId) return toast.error("Please pick a target course first.");
    const newHash = generateAlphanumericHash();
    upsertAccessCode.mutate(
      { code: newHash, content_id: selectedContentId, max_uses: maxUses, notes: notes || null },
      { onSuccess: () => setNotes("") },
    );
  };

  const tabs = [
    { v: "courses", i: BookOpen, l: "Courses" },
    { v: "assessment", i: ClipboardCheck, l: "Assess" },
    { v: "interview", i: MessageSquare, l: "Mock" },
    { v: "salary", i: TrendingUp, l: "Fiscal" },
    { v: "jobs", i: Briefcase, l: "Ops" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
          <Key className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold uppercase italic tracking-tight">Access Codes</h2>
          <p className="text-[10px] font-bold text-muted-foreground/60 italic">
            Institutional Entitlement Engine
          </p>
        </div>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="h-14 w-full grid grid-cols-5 bg-muted/20 border border-border/40 p-1.5 rounded-2xl mb-6">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.v}
              value={tab.v}
              className="rounded-xl font-semibold uppercase italic text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg"
            >
              <tab.i className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{tab.l}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="courses" className="space-y-6 mt-0">
          <Card className="rounded-3xl border border-border/60 bg-card/40 overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-2">
                  <Label>Target course</Label>
                  <Select value={selectedContentId} onValueChange={setSelectedContentId}>
                    <SelectTrigger className="h-14 bg-muted/20 border-2 rounded-2xl font-bold italic">
                      <SelectValue placeholder="Select a paid course..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paidContent?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title.toUpperCase()} — ${c.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max uses</Label>
                  <Input
                    type="number"
                    min={1}
                    value={maxUses}
                    onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                    className="h-14 bg-muted/20 border-2 rounded-2xl font-semibold text-lg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Internal notes</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Student ID, payment reference..."
                  className="h-14 bg-muted/20 border-2 rounded-2xl italic font-bold"
                />
              </div>
              <Button
                onClick={handleInitializeKey}
                disabled={upsertAccessCode.isPending || !selectedContentId}
                className="w-full h-10 rounded-xl font-semibold uppercase italic tracking-tight gap-3 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {upsertAccessCode.isPending ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
                CREATE ACCESS CODE
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border/60 bg-card/40 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Target course</TableHead>
                    <TableHead className="text-right">Manage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4}><Skeleton className="h-16 w-full" /></TableCell></TableRow>
                  ) : data?.accessCodes?.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-12 italic uppercase font-semibold text-xs tracking-widest opacity-30">Zero codes minted.</TableCell></TableRow>
                  ) : (
                    data?.accessCodes?.map((row: any) => {
                      const isExhausted = row.current_uses >= row.max_uses;
                      return (
                        <TableRow key={row.id}>
                          <TableCell>
                            <code className="text-base font-semibold font-mono tracking-tight">{row.code}</code>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "font-black uppercase text-[10px]",
                                isExhausted
                                  ? "bg-rose-500/10 text-rose-600"
                                  : "bg-emerald-500/10 text-emerald-600",
                              )}
                            >
                              {row.current_uses} / {row.max_uses} Uses
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {row.content_id?.substring(0, 8) || "Global"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon" aria-label="Copy"
                                onClick={() => {
                                  navigator.clipboard.writeText(row.code);
                                  toast.success("KEY COPIED");
                                }}
                                className="hover:bg-indigo-500/10 hover:text-indigo-600"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon" aria-label="Delete"
                                className="hover:bg-rose-500/10 hover:text-rose-600"
                                onClick={() => {
                                  if (confirm("Purge Code?")) deleteAccessCode.mutate(row.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
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
}

export default AccessCodesTab;
