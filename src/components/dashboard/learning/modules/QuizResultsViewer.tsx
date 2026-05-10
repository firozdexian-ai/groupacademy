import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Eye, FileText, Trophy, Target, ShieldCheck, Activity, Layers } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Pedagogical Assessment Terminal
 * CTO Reference: Executive-level auditing of learner quiz attempts and performance.
 */

interface QuizAnswer {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

interface QuizAttempt {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  contentId: string;
  contentTitle: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  attemptedAt: string;
  answers: QuizAnswer[];
}

export function QuizResultsViewer() {
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["admin-quiz-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select("id, title")
        .eq("quiz_enabled", true)
        .eq("is_published", true)
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: quizAttempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ["admin-quiz-attempts", selectedCourse],
    queryFn: async (): Promise<QuizAttempt[]> => {
      let query = supabase
        .from("quiz_attempts")
        .select(
          `
          id, student_id, content_id, score, total_questions,
          passed, answers, created_at,
          content:content_id (id, title),
          students:student_id (id, full_name, email)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (selectedCourse !== "all") query = query.eq("content_id", selectedCourse);

      const { data, error } = await query;
      if (error) return [];

      return (data || []).map(
        (attempt: any): QuizAttempt => ({
          id: attempt.id,
          studentId: attempt.student_id,
          studentName: attempt.students?.full_name || "NULL_ENTITY",
          studentEmail: attempt.students?.email || "N/A",
          contentId: attempt.content_id,
          contentTitle: attempt.content?.title || "UNCLASSED_NODE",
          score: attempt.score || 0,
          totalQuestions: attempt.total_questions || 0,
          passed: attempt.passed || false,
          attemptedAt: attempt.created_at,
          answers: Array.isArray(attempt.answers) ? attempt.answers : [],
        }),
      );
    },
  });

  const summaryStats = {
    total: quizAttempts?.length || 0,
    passed: quizAttempts?.filter((a) => a.passed).length || 0,
    avg: quizAttempts?.length
      ? Math.round(
          quizAttempts.reduce((sum, a) => sum + (a.totalQuestions > 0 ? (a.score / a.totalQuestions) * 100 : 0), 0) /
            quizAttempts.length,
        )
      : 0,
    rate: quizAttempts?.length
      ? Math.round((quizAttempts.filter((a) => a.passed).length / quizAttempts.length) * 100)
      : 0,
  };

  const viewAttemptDetails = (attempt: QuizAttempt) => {
    setSelectedAttempt(attempt);
    setDetailDialogOpen(true);
  };

  if (coursesLoading) return <DashboardLoadingSkeleton />;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Activity className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Assessment HUD</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Pedagogical Integrity & Learner Performance Registry
          </p>
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-full md:w-[320px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50 shadow-inner">
            <Layers className="w-4 h-4 mr-2 text-primary" />
            <SelectValue placeholder="Logic Context" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-2 shadow-2xl">
            <SelectItem value="all" className="font-bold">
              GLOBAL_REGISTRY
            </SelectItem>
            {courses?.map((c) => (
              <SelectItem key={c.id} value={c.id} className="font-bold truncate">
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
        {[
          {
            label: "Registry Nodes",
            val: summaryStats.total,
            icon: FileText,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Verified Pass",
            val: summaryStats.passed,
            icon: Trophy,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Global Median",
            val: `${summaryStats.avg}%`,
            icon: Target,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            progress: true,
          },
          {
            label: "Success Rate",
            val: `${summaryStats.rate}%`,
            icon: CheckCircle2,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            progress: true,
          },
        ].map((kpi, i) => (
          <Card
            key={i}
            className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm group hover:border-primary/20 transition-all"
          >
            <CardContent className="p-6 space-y-4">
              <div
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center border-2 shadow-inner group-hover:rotate-6 transition-transform",
                  kpi.bg,
                  "border-white/5",
                )}
              >
                <kpi.icon className={cn("h-6 w-6", kpi.color)} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                  {kpi.label}
                </p>
                <p className="text-3xl font-black tracking-tighter italic leading-none">{kpi.val}</p>
                {kpi.progress && <Progress value={parseInt(String(kpi.val))} className="h-1 mt-3" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Registry */}
      <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <CardHeader className="p-8 border-b border-border/10">
          <CardTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" /> Performance Log
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-left">
            Authorized audit trail for quiz logic cycles
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {attemptsLoading ? (
            <div className="p-12 space-y-4">
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          ) : quizAttempts?.length ? (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b-2 border-border/10">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-8 px-8 text-left text-muted-foreground">
                    Learner Artifact
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-left text-muted-foreground">
                    Logic Node
                  </TableHead>
                  <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Yield (Score)
                  </TableHead>
                  <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-left text-muted-foreground">
                    Temporal Log
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8 text-muted-foreground">
                    Audit
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quizAttempts.map((attempt) => (
                  <TableRow
                    key={attempt.id}
                    className="group transition-all hover:bg-primary/[0.02] border-b border-border/5"
                  >
                    <TableCell className="px-8 py-6 text-left">
                      <div className="space-y-1">
                        <p className="font-black text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors leading-none">
                          {attempt.studentName}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                          {attempt.studentEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-left font-black text-xs uppercase tracking-tighter italic opacity-80 max-w-[200px] truncate">
                      {attempt.contentTitle}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-black text-lg italic tracking-tighter text-primary">
                        {attempt.score}/{attempt.totalQuestions}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={cn(
                          "rounded-lg font-black text-[8px] uppercase px-3 py-1 border-none",
                          attempt.passed ? "bg-emerald-500 text-white" : "bg-destructive text-white",
                        )}
                      >
                        {attempt.passed ? "SUCCESS_SYNC" : "LOGIC_FAULT"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic text-left">
                      {format(new Date(attempt.attemptedAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl hover:bg-primary/10"
                        onClick={() => viewAttemptDetails(attempt)}
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-32 text-center opacity-20">
              <Layers className="h-16 w-16 mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest text-xs">Registry Empty</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Forensics (Detail Dialog) */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10 max-h-[85vh] overflow-y-auto no-scrollbar">
            <DialogHeader className="mb-10 text-left">
              <div className="flex items-center gap-5">
                <Target className="h-10 w-10 text-primary" />
                <div className="space-y-1">
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                    Attempt Forensics
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                    {selectedAttempt?.studentName} •{" "}
                    {selectedAttempt && format(new Date(selectedAttempt.attemptedAt), "MMM d, yyyy HH:mm")}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {selectedAttempt && (
              <div className="space-y-8 text-left">
                <div className="flex items-center justify-between p-8 bg-muted/20 rounded-[32px] border-2 border-border/10 shadow-inner">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                      Logic Match Yield
                    </p>
                    <p
                      className={cn(
                        "text-6xl font-black italic tracking-tighter leading-none",
                        selectedAttempt.passed ? "text-emerald-500" : "text-destructive",
                      )}
                    >
                      {selectedAttempt.totalQuestions > 0
                        ? Math.round((selectedAttempt.score / selectedAttempt.totalQuestions) * 100)
                        : 0}
                      %
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "rounded-lg font-black text-[10px] px-5 py-1.5 border-none",
                      selectedAttempt.passed ? "bg-emerald-500 text-white" : "bg-destructive text-white",
                    )}
                  >
                    {selectedAttempt.passed ? "AUTHORIZED" : "REJECTED"}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary italic border-b border-border/10 pb-4">
                    Logic Breakdown Analysis
                  </p>
                  <div className="space-y-4">
                    {selectedAttempt.answers.map((answer, index) => (
                      <Card
                        key={index}
                        className={cn(
                          "rounded-[24px] border-2 bg-muted/5 overflow-hidden",
                          answer.isCorrect ? "border-emerald-500/20" : "border-destructive/20",
                        )}
                      >
                        <CardContent className="p-6 flex gap-5 text-left">
                          <div
                            className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center border shadow-inner shrink-0",
                              answer.isCorrect
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-destructive/10 text-destructive",
                            )}
                          >
                            {answer.isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                          </div>
                          <div className="space-y-3 flex-1">
                            <p className="text-xs font-black uppercase tracking-tight italic opacity-60">
                              Artifact Logic {index + 1}
                            </p>
                            <p className="font-bold text-sm leading-relaxed">{answer.questionText}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              <div className="p-3 rounded-xl bg-background border-2 border-border/5">
                                <p className="text-[8px] font-black uppercase opacity-30">Input_Node</p>
                                <p
                                  className={cn(
                                    "text-xs font-bold",
                                    answer.isCorrect ? "text-emerald-600" : "text-destructive",
                                  )}
                                >
                                  {answer.selectedAnswer}
                                </p>
                              </div>
                              {!answer.isCorrect && (
                                <div className="p-3 rounded-xl bg-emerald-500/5 border-2 border-emerald-500/10">
                                  <p className="text-[8px] font-black uppercase text-emerald-600/40">Verified_Target</p>
                                  <p className="text-xs font-bold text-emerald-700">{answer.correctAnswer}</p>
                                </div>
                              )}
                            </div>
                            {answer.explanation && (
                              <div className="p-4 bg-muted/50 rounded-2xl border border-border/10 italic text-[11px] text-muted-foreground">
                                <span className="font-black uppercase not-italic text-[9px] mr-2">Recalibration:</span>
                                {answer.explanation}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <DialogFooter className="pt-8 border-t border-border/10">
                  <Button
                    onClick={() => setDetailDialogOpen(false)}
                    className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/30"
                  >
                    Close Audit
                  </Button>
                </DialogFooter>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <Skeleton className="h-32 w-full rounded-[40px]" />
      <div className="grid grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-[32px]" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-[40px]" />
    </div>
  );
}
