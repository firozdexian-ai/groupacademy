import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bot, Briefcase, GraduationCap, UserPlus, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import {
 getSchoolBySlugWithAcademy,
 listProfessionCategoriesForSchool,
 insertInstructorConnectionRequest,
} from "@/domains/abroad/repo/abroadRepo";
import { adminSupportAssistant } from "@/domains/agents/api/agentsApi";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getIcon } from "@/lib/iconMap";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Production Data Contracts[cite: 8]
interface School {
 id: string;
 name: string;
 slug: string;
 description: string;
 academies: { name: string; slug: string } | null;
}

interface ProfessionLine {
 id: string;
 name: string;
 slug: string;
 description: string;
 icon: string;
 career_outcome: string;
 school_id: string;
 ai_instructors: { id: string; name: string } | { id: string; name: string }[] | null;
}

export default function SchoolDetail() {
 const { slug } = useParams();
 const navigate = useNavigate();
 const { talent } = useTalent();

 const [openProfession, setOpenProfession] = useState<ProfessionLine | null>(null);
 const [message, setMessage] = useState("");
 const [submitting, setSubmitting] = useState(false);

 // Internal error logger
 const reportAnomaly = async (event: string, context: any) => {
 console.error(`[abroad] ${event}`, context);
 try {
 await adminSupportAssistant({ type: "school_detail_error", event, context });
 } catch {
 // fire-and-forget telemetry
 }
 };

 const {
 data: school,
 isLoading: schoolLoading,
 error: schoolError,
 } = useQuery({
 queryKey: ["school", slug],
 queryFn: async () => {
 try {
 const data = await getSchoolBySlugWithAcademy(slug!);
 return data as School | null;
 } catch (error) {
 await reportAnomaly("SchoolFetchError", { slug, error });
 throw error;
 }
 },
 });

 const { data: professions = [], isLoading: profLoading } = useQuery({
 queryKey: ["professions", school?.id],
 enabled: !!school?.id,
 queryFn: async () => {
 try {
 const data = await listProfessionCategoriesForSchool(school!.id);
 return (data as unknown as ProfessionLine[]) || [];
 } catch (error) {
 await reportAnomaly("ProfessionFetchError", { schoolId: school?.id, error });
 throw error;
 }
 },
 });

 const getInstructor = (p: ProfessionLine) => {
 if (!p.ai_instructors) return null;
 return Array.isArray(p.ai_instructors) ? p.ai_instructors[0] : p.ai_instructors;
 };

 const submitRequest = async () => {
 if (!talent?.id || !openProfession || !school) return;
 setSubmitting(true);
 try {
 const instructor = getInstructor(openProfession);
 const { error } = await insertInstructorConnectionRequest({
 talent_id: talent.id,
 school_id: school.id,
 profession_id: openProfession.id,
 instructor_id: instructor?.id || null,
 message: message.trim() || null,
 });

 if (error) throw error;
 toast.success("Request synchronized with Digital Workforce.");
 setOpenProfession(null);
 setMessage("");
 } catch (err: any) {
 await reportAnomaly("HandoffRequestError", { err });
 toast.error("Failed to sync request.");
 } finally {
 setSubmitting(false);
 }
 };

 if (schoolLoading || profLoading) {
 return (
 <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
 <Skeleton className="h-8 w-32 rounded-lg" />
 <Skeleton className="h-32 w-full rounded-2xl" />
 <div className="grid gap-6 sm:grid-cols-2">
 {[1, 2, 3, 4].map((i) => (
 <Skeleton key={i} className="h-40 rounded-2xl" />
 ))}
 </div>
 </div>
 );
 }

 if (schoolError || !school) {
 return (
 <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-4">
 <AlertCircle className="h-12 w-12 text-muted-foreground/30 mx-auto" />
 <p className="text-sm">Academy sector unreachable.</p>
 <Button onClick={() => navigate("/app/learning")}>Return to Hub</Button>
 </div>
 );
 }

 return (
 <div className="max-w-4xl mx-auto px-6 py-10 pb-40 space-y-10">
 <header className="space-y-4">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => navigate("/app/learning?tab=tracks")}
 className="-ml-4 rounded-xl"
 >
 <ArrowLeft className="h-4 w-4 mr-2" /> Academic Tracks
 </Button>
 <div className="space-y-2">
 {school.academies && (
 <Badge variant="outline" className="rounded-lg">
 <GraduationCap className="h-3 w-3 mr-1.5" /> {school.academies.name}
 </Badge>
 )}
 <h1 className="text-4xl font-black uppercase tracking-tighter italic">{school.name}</h1>
 <p className="text-sm text-muted-foreground max-w-xl">{school.description}</p>
 </div>
 </header>

 <div className="space-y-6">
 <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
 Career tracks at this school
 </h2>
 <div className="grid gap-4 sm:grid-cols-2">
 {professions.map((profession) => {
 const Icon = getIcon(profession.icon) || Briefcase;
 const instructor = getInstructor(profession);

 return (
 <Card
 key={profession.id}
 className="rounded-2xl border border-border/60 hover:border-primary/40 transition-all"
 >
 <CardContent className="p-6 space-y-4">
 <div className="flex items-start gap-4">
 <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
 <Icon className="h-7 w-7 text-primary" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-black uppercase tracking-tight italic truncate">{profession.name}</p>
 {instructor && (
 <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mt-1 uppercase tracking-wider">
 <Bot className="h-3 w-3" /> {instructor.name}
 </p>
 )}
 </div>
 </div>
 <p className="text-xs text-muted-foreground line-clamp-2 italic">{profession.description}</p>
 <div className="flex gap-2 pt-2">
 <Button
 variant="outline"
 size="sm"
 className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest"
 onClick={() => navigate(`/app/learning/tracks/${profession.slug}`)}
 >
 Explore
 </Button>
 <Button
 size="sm"
 className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest"
 onClick={() => setOpenProfession(profession)}
 >
 <UserPlus className="h-3 w-3 mr-2" /> Connect
 </Button>
 </div>
 </CardContent>
 </Card>
 );
 })}
 </div>
 </div>

 <Dialog open={!!openProfession} onOpenChange={(o) => !o && setOpenProfession(null)}>
 <DialogContent className="rounded-2xl border border-border/60">
 <DialogHeader>
 <DialogTitle className="font-black uppercase tracking-tighter italic">Request a connection</DialogTitle>
 </DialogHeader>
 <Textarea
 value={message}
 onChange={(e) => setMessage(e.target.value)}
 placeholder="Tell them why you'd like to connect…"
 rows={4}
 className="rounded-xl"
 />
 <DialogFooter>
 <Button onClick={submitRequest} disabled={submitting}>
 {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Transmit Request"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}
