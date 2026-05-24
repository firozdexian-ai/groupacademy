import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
 listPublishedCourses,
 listEnrollmentStatsRaw,
 listLearnerDetailsRaw,
} from "@/domains/learning/repo/learningRepo";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
 Users,
 BookOpen,
 Trophy,
 TrendingDown,
 BarChart3,
 Clock,
 Activity,
 ShieldCheck,
 Zap,
 Layers,
 ChevronRight,
 ClipboardCheck,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { QuizResultsViewer } from "./modules/QuizResultsViewer";

/**
 * Platform Logic: Academic Progression Terminal (Learner Progress)
 * High-fidelity orchestrator for tracking learner velocity and course completion telemetry.
 * 2026 Standard: Executive Logic geometry with reinforced aggregation guards.
 */

interface CourseStats {
 contentId: string;
 title: string;
 totalEnrollments: number;
 activeEnrollments: number;
 completedEnrollments: number;
 averageProgress: number;
 dropOffStage: number | null;
}

interface LearnerDetail {
 enrollmentId: string;
 talentId: string;
 talentName: string;
 talentEmail: string;
 status: string;
 enrolledAt: string;
 completedAt: string | null;
 modulesCompleted: number;
 totalModules: number;
 currentModule: string | null;
 currentStage: number;
}

export function LearningProgressTab() {
 const [selectedCourse, setSelectedCourse] = useState<string>("all");
 const [selectedEnrollment, setSelectedEnrollment] = useState<LearnerDetail | null>(null);

 const { data: courses, isLoading: coursesLoading } = useQuery({
 queryKey: ["admin-courses-list"],
 queryFn: () => listPublishedCourses(),
 });

 const { data: enrollmentStats, isLoading: statsLoading } = useQuery({
 queryKey: ["admin-enrollment-stats", selectedCourse],
 queryFn: async () => {
 const data = await listEnrollmentStatsRaw(selectedCourse);

 const statsMap = new Map<string, CourseStats>();
 (data || []).forEach((enrollment: any) => {

 const contentId = enrollment.content_id;
 const content = enrollment.content;
 if (!statsMap.has(contentId)) {
 statsMap.set(contentId, {
 contentId,
 title: content?.title || "Untitled course",
 totalEnrollments: 0,
 activeEnrollments: 0,
 completedEnrollments: 0,
 averageProgress: 0,
 dropOffStage: null,
 });
 }
 const stats = statsMap.get(contentId)!;
 stats.totalEnrollments++;
 if (enrollment.status === "active") stats.activeEnrollments++;
 else if (enrollment.status === "completed") stats.completedEnrollments++;
 });

 statsMap.forEach((stats) => {
 if (stats.totalEnrollments > 0) {
 stats.averageProgress = Math.round((stats.completedEnrollments / stats.totalEnrollments) * 100);
 }
 });
 return Array.from(statsMap.values());
 },
 });

 const { data: learnerDetails, isLoading: learnersLoading } = useQuery({
 queryKey: ["admin-learner-details", selectedCourse],
 queryFn: async () => {
 const data = await listLearnerDetailsRaw(selectedCourse, 50);

 return (data || []).map(

 (enrollment: any): LearnerDetail => ({
 enrollmentId: enrollment.id,
 talentId: enrollment.talent_id,
 talentName: enrollment.talents?.full_name || "NULL_ENTITY",
 talentEmail: enrollment.talents?.email || "N/A",
 status: enrollment.status,
 enrolledAt: enrollment.enrolled_at,
 completedAt: enrollment.completed_at,
 modulesCompleted: enrollment.status === "completed" ? enrollment.content?.modules_count || 0 : 0,
 totalModules: enrollment.content?.modules_count || 0,
 currentModule: null,
 currentStage: 1,
 }),
 );
 },
 });

 const summaryStats = {
 total: enrollmentStats?.reduce((sum, s) => sum + s.totalEnrollments, 0) || 0,
 active: enrollmentStats?.reduce((sum, s) => sum + s.activeEnrollments, 0) || 0,
 completed: enrollmentStats?.reduce((sum, s) => sum + s.completedEnrollments, 0) || 0,
 avg: enrollmentStats?.length
 ? Math.round(enrollmentStats.reduce((sum, s) => sum + s.averageProgress, 0) / enrollmentStats.length)
 : 0,
 };

 const getStatusBadge = (status: string) => {
 switch (status) {
 case "completed":
 return (
 <Badge className="bg-emerald-500 text-white border-none font-semibold text-[9px] px-3 py-1">
 PASSED_COMPLETE
 </Badge>
 );
 case "active":
 return (
 <Badge className="bg-primary/10 text-primary border-none font-semibold text-[9px] px-3 py-1">
 ACTIVE_DEPLOY
 </Badge>
 );
 default:
 return (
 <Badge variant="outline" className="font-semibold text-[9px] px-3 py-1">
 {status}
 </Badge>
 );
 }
 };

 if (coursesLoading) return <DashboardLoadingSkeleton />;

 return (
 <div className="space-y-10 animate-in fade-in duration-1000">
 {/* Executive Header */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-2xl border border-border/60">
 <div className="space-y-1 text-left">
 <div className="flex items-center gap-3 text-primary">
 <Activity className="h-8 w-8" />
 <h2 className="text-4xl font-semibold uppercase tracking-tight italic leading-none">Learner progress</h2>
 </div>
 <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/60 italic">
 Real-time learner pace and course completion
 </p>
 </div>
 <Select value={selectedCourse} onValueChange={setSelectedCourse}>
 <SelectTrigger className="w-full md:w-[320px] h-10 rounded-xl border font-semibold uppercase text-xs bg-card shadow-inner">
 <Layers className="w-4 h-4 mr-2 text-primary" />
 <SelectValue placeholder="Logic Context" />
 </SelectTrigger>
 <SelectContent className="rounded-2xl border shadow-sm">
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

 {/* Summary Telemetry Artifacts */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
 {[
 { label: "Total Nodes", val: summaryStats.total, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
 {
 label: "Active Cycle",
 val: summaryStats.active,
 icon: BookOpen,
 color: "text-primary",
 bg: "bg-primary/10",
 },
 {
 label: "Finalized Log",
 val: summaryStats.completed,
 icon: Trophy,
 color: "text-emerald-500",
 bg: "bg-emerald-500/10",
 },
 {
 label: "Global Yield",
 val: `${summaryStats.avg}%`,
 icon: BarChart3,
 color: "text-purple-500",
 bg: "bg-purple-500/10",
 progress: true,
 },
 ].map((kpi, i) => (
 <Card
 key={i}
 className="rounded-2xl border border-border/60 bg-card backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all duration-500 shadow-sm"
 >
 <CardContent className="p-6 space-y-4">
 <div
 className={cn(
 "h-12 w-12 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover:rotate-6 shadow-inner",
 kpi.bg,
 "border-white/5",
 )}
 >
 <kpi.icon className={cn("h-6 w-6", kpi.color)} />
 </div>
 <div>
 <p className="text-[9px] font-semibold text-muted-foreground/40 mb-1">
 {kpi.label}
 </p>
 <p className="text-3xl font-semibold tracking-tight italic">{kpi.val}</p>
 {kpi.progress && <Progress value={parseInt(String(kpi.val))} className="h-1 mt-3" />}
 </div>
 </CardContent>
 </Card>
 ))}
 </div>

 {/* Course Performance Cluster */}
 {selectedCourse === "all" && (
 <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card">
 <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
 <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
 <CardTitle className="text-xl font-semibold uppercase tracking-tight italic flex items-center gap-3">
 <ShieldCheck className="h-5 w-5 text-primary" /> Multi-Course Yield Analysis
 </CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 <Table>
 <TableHeader className="bg-muted/30">
 <TableRow className="hover:bg-transparent border-b border-border/10">
 <TableHead className="text-[10px] font-semibold py-8 px-8 text-left">
 Academic Node
 </TableHead>
 <TableHead className="text-center text-[10px] font-semibold">Total</TableHead>
 <TableHead className="text-center text-[10px] font-semibold">Active</TableHead>
 <TableHead className="text-center text-[10px] font-semibold">
 Yield %
 </TableHead>
 <TableHead className="text-right text-[10px] font-semibold pr-8">
 Intensity
 </TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {enrollmentStats?.map((stats) => (
 <TableRow
 key={stats.contentId}
 className="group transition-all hover:bg-primary/[0.02] border-b border-border/5 last:border-0"
 >
 <TableCell className="px-8 py-6 text-left">
 <p className="font-semibold text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors leading-none">
 {stats.title}
 </p>
 </TableCell>
 <TableCell className="text-center font-semibold text-xs opacity-60">
 {stats.totalEnrollments}
 </TableCell>
 <TableCell className="text-center font-semibold text-xs text-primary">
 {stats.activeEnrollments}
 </TableCell>
 <TableCell className="text-center">
 <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-semibold text-[10px] italic">
 {stats.averageProgress}%
 </Badge>
 </TableCell>
 <TableCell className="text-right pr-8">
 <Progress value={stats.averageProgress} className="w-24 h-1 ml-auto" />
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </CardContent>
 </Card>
 )}

 {/* Individual Learner Progression Registry */}
 <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card">
 <CardHeader className="p-8 border-b border-border/10">
 <CardTitle className="text-xl font-semibold uppercase tracking-tight italic">Learner Artifact Log</CardTitle>
 <CardDescription className="text-sm font-medium">
 Authorized audit trail for individual node progression
 </CardDescription>
 </CardHeader>
 <CardContent className="p-0">
 {learnersLoading ? (
 <div className="p-12 space-y-4">
 <Skeleton className="h-14 w-full rounded-2xl" />
 <Skeleton className="h-14 w-full rounded-2xl" />
 </div>
 ) : (
 <Table>
 <TableHeader className="bg-muted/30">
 <TableRow className="hover:bg-transparent border-b border-border/10">
 <TableHead className="text-[10px] font-semibold py-8 px-8 text-left">
 Learner Artifact
 </TableHead>
 <TableHead className="text-[10px] font-semibold text-left">
 Status Protocol
 </TableHead>
 <TableHead className="text-[10px] font-semibold text-left">
 Temporal Log
 </TableHead>
 <TableHead className="text-center text-[10px] font-semibold">
 Progress Yield
 </TableHead>
 <TableHead className="text-right text-[10px] font-semibold pr-8">
 Resolution
 </TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {learnerDetails?.map((learner) => (
 <TableRow
 key={learner.enrollmentId}
 className="group transition-all hover:bg-primary/[0.02] border-b border-border/5 last:border-0"
 >
 <TableCell className="px-8 py-6 text-left">
 <div className="space-y-1">
 <p className="font-semibold text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors leading-none">
 {learner.talentName}
 </p>
 <p className="text-sm font-medium text-muted-foreground/40 italic">
 {learner.talentEmail}
 </p>
 </div>
 </TableCell>
 <TableCell className="text-left">{getStatusBadge(learner.status)}</TableCell>
 <TableCell className="text-left">
 <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground/40 uppercase italic">
 <Clock className="h-3 w-3" /> {format(new Date(learner.enrolledAt), "MMM d, yyyy")}
 </div>
 </TableCell>
 <TableCell className="text-center">
 {learner.totalModules > 0 ? (
 <div className="flex flex-col items-center gap-1.5">
 <Progress
 value={(learner.modulesCompleted / learner.totalModules) * 100}
 className="w-16 h-1"
 />
 <span className="text-[10px] font-semibold">
 {learner.modulesCompleted}/{learner.totalModules}
 </span>
 </div>
 ) : (
 <span className="text-sm font-medium opacity-20 italic">NULL_MODULES</span>
 )}
 </TableCell>
 <TableCell className="text-right pr-8 font-semibold text-[11px] italic text-primary">
 <div className="flex items-center justify-end gap-2">
 <Button
 variant="ghost"
 size="icon" aria-label="View Quiz Results"
 onClick={() => setSelectedEnrollment(learner)}
 title="View Quiz Results"
 className="hover:bg-violet-500/10 hover:text-violet-600"
 >
 <ClipboardCheck className="h-4 w-4" />
 </Button>
 <span>{learner.completedAt ? format(new Date(learner.completedAt), "MMM d, yyyy") : "IN_TRANSIT"}</span>
 </div>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 )}
 </CardContent>
 </Card>

 {/* Operational Trace Footer */}
 <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
 <div className="space-y-1 text-left">
 <p className="text-[9px] font-semibold uppercase tracking-[0.4em] italic leading-none">
 Academic Progression Hub: Secured Access
 </p>
 <p className="text-[8px] font-bold text-muted-foreground">
 Logic Cycle: Curriculum Telemetry v2.6.8
 </p>
 </div>
 <div className="flex gap-2">
 {[...Array(3)].map((_, i) => (
 <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
 ))}
 </div>
 </footer>

 {/* Quiz Results Viewer */}
 <Dialog open={!!selectedEnrollment} onOpenChange={(o) => !o && setSelectedEnrollment(null)}>
 <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 border border-border/60">
 <DialogHeader>
 <DialogTitle className="text-xl font-semibold font-medium text-violet-500 flex items-center gap-2">
 <ClipboardCheck className="h-5 w-5" /> Quiz Results
 {selectedEnrollment && <span className="text-xs text-muted-foreground"> — {selectedEnrollment.talentName}</span>}
 </DialogTitle>
 <DialogDescription className="text-sm text-muted-foreground">
 Per-learner quiz attempts and outcomes.
 </DialogDescription>
 </DialogHeader>
 <QuizResultsViewer />
 </DialogContent>
 </Dialog>
 </div>
 );
}

function DashboardLoadingSkeleton() {
 return (
 <div className="space-y-10 animate-pulse">
 <Skeleton className="h-32 w-full rounded-2xl" />
 <div className="grid grid-cols-4 gap-6">
 {[...Array(4)].map((_, i) => (
 <Skeleton key={i} className="h-32 w-full rounded-2xl" />
 ))}
 </div>
 <Skeleton className="h-96 w-full rounded-2xl" />
 </div>
 );
}

export default LearningProgressTab;
