import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { 
  Search, UserPlus, Mail, Phone, Calendar, 
  ArrowLeft, Filter, GraduationCap, ChevronRight, 
  Briefcase, ShieldCheck, Sparkles 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Student {
  id: string; student_id: string; full_name: string; email: string;
  phone: string | null; status: string; created_at: string;
  enrollments?: Array<{
    id: string; status: string; enrolled_at: string;
    content: { title: string; content_type: string; };
  }>;
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  lead: { label: "Cold Lead", color: "text-slate-600 bg-slate-500/10 border-slate-500/20", dot: "bg-slate-400" },
  free_learner: { label: "Free Learner", color: "text-blue-600 bg-blue-500/10 border-blue-500/20", dot: "bg-blue-400" },
  enrolled: { label: "Premium Seat", color: "text-primary bg-primary/10 border-primary/20", dot: "bg-primary" },
  completed: { label: "Graduate", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-500" },
  dropped: { label: "At Risk / Dropped", color: "text-rose-600 bg-rose-500/10 border-rose-500/20", dot: "bg-rose-500" },
};

export default function Students() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const { data, error: queryError } = await withTimeout(
        Promise.resolve(
          supabase.from("students")
            .select(`*, enrollments(id, status, enrolled_at, content:content_id(title, content_type))`)
            .order("created_at", { ascending: false })
        ),
        TIMEOUTS.DEFAULT,
        "Registry handshake timed out."
      );

      if (queryError) throw queryError;
      setStudents((data || []) as any);
    } catch (err: any) {
      setError(err.message || "Logic Fetch Error");
      toast({ title: "Sync Fault", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const filteredStudents = students.filter((s) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = s.full_name.toLowerCase().includes(query) || 
                          s.email.toLowerCase().includes(query) || 
                          s.student_id.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return (
    <div className="container max-w-6xl mx-auto px-6 py-12 space-y-10 animate-pulse">
       <Skeleton className="h-12 w-48 rounded-xl" />
       <div className="flex gap-4"><Skeleton className="h-12 flex-1 rounded-xl" /><Skeleton className="h-12 w-48 rounded-xl" /></div>
       <div className="space-y-6">
         {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-[32px]" />)}
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/20 pb-24 selection:bg-primary/10">
      <main className="container max-w-6xl mx-auto px-6 py-12 space-y-10 animate-in fade-in duration-700">
        
        {/* Executive Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
             <Button variant="ghost" onClick={() => navigate("/dashboard")} className="rounded-xl font-bold uppercase text-[10px] tracking-widest pl-0 hover:bg-transparent">
                <ArrowLeft className="mr-2 h-4 w-4" /> Operations Hub
             </Button>
             <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Student CRM</h1>
             <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Identity Management & Learning Lifecycle Telemetry</p>
          </div>
          <Button className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
            <UserPlus className="mr-2 h-4 w-4" /> Provision Student
          </Button>
        </header>

        {/* Filter HUD */}
        <Card className="rounded-[32px] border-border/40 shadow-sm bg-card/50 backdrop-blur-xl overflow-hidden">
          <CardContent className="p-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search Identity Node (Name, Email, ID)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-11 rounded-xl bg-background/50 border-border/40 font-bold"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 w-full sm:w-[220px] rounded-xl bg-background/50 border-border/40 font-black uppercase text-[10px] tracking-widest">
                <Filter className="mr-2 h-3.5 w-3.5" />
                <SelectValue placeholder="Status Protocol" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-[10px] font-black uppercase">All Protocols</SelectItem>
                {Object.keys(statusConfig).map(k => (
                  <SelectItem key={k} value={k} className="text-[10px] font-black uppercase">{statusConfig[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Intelligence Ledger */}
        <div className="space-y-6">
          {filteredStudents.length === 0 ? (
            <Card className="rounded-[40px] border-dashed border-2 py-24 bg-muted/30">
               <CardContent className="text-center space-y-4">
                  <div className="h-16 w-16 rounded-3xl bg-background flex items-center justify-center mx-auto shadow-xl"><Search className="h-8 w-8 text-muted-foreground/30" /></div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No Logic Match Found in Registry</p>
               </CardContent>
            </Card>
          ) : (
            filteredStudents.map((student, idx) => {
              const config = statusConfig[student.status] || statusConfig.lead;
              return (
                <Card 
                  key={student.id} 
                  className="rounded-[40px] border-border/40 shadow-sm bg-card overflow-hidden group hover:shadow-2xl hover:border-primary/20 transition-all duration-500 animate-in slide-in-from-bottom-8"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                      {/* Identity Section */}
                      <div className="p-8 lg:w-80 border-b lg:border-b-0 lg:border-r border-border/10 space-y-4">
                        <div className="space-y-1">
                           <Badge className={cn("px-3 py-1 rounded-full font-black uppercase text-[8px] tracking-widest border", config.color)}>
                              <div className={cn("w-1.5 h-1.5 rounded-full mr-2", config.dot)} />
                              {config.label}
                           </Badge>
                           <h3 className="text-2xl font-black tracking-tighter uppercase group-hover:text-primary transition-colors">{student.full_name}</h3>
                           <p className="text-[9px] font-mono text-muted-foreground uppercase opacity-60 tracking-tighter">NODE_ID: {student.student_id}</p>
                        </div>
                        <div className="space-y-2 pt-2">
                           <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {student.email}</div>
                           {student.phone && <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {student.phone}</div>}
                           <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> Joined {new Date(student.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>

                      {/* Enrollment HUD */}
                      <div className="p-8 flex-1 bg-muted/20">
                         <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Active Curriculum Node</h4>
                            <Badge variant="outline" className="rounded-lg bg-background text-[9px] font-black uppercase border-border/60">{student.enrollments?.length || 0} Modules</Badge>
                         </div>
                         
                         {student.enrollments && student.enrollments.length > 0 ? (
                            <div className="grid sm:grid-cols-2 gap-3">
                               {student.enrollments.slice(0, 4).map((en) => (
                                 <div key={en.id} className="flex items-center justify-between p-3 rounded-2xl bg-background border border-border/40 group/node hover:border-primary/40 transition-colors">
                                    <div className="space-y-0.5 min-w-0">
                                       <p className="text-[10px] font-black uppercase tracking-tight truncate pr-2">{en.content.title}</p>
                                       <p className="text-[8px] font-bold text-muted-foreground uppercase">{en.content.content_type.replace('_', ' ')}</p>
                                    </div>
                                    <Badge variant="ghost" className="text-[8px] font-black uppercase tracking-tighter px-2 h-5 bg-muted/50">{en.status}</Badge>
                                 </div>
                               ))}
                               {student.enrollments.length > 4 && (
                                 <div className="flex items-center justify-center p-3 rounded-2xl border border-dashed border-border/60 text-[9px] font-black uppercase text-muted-foreground">
                                    + {student.enrollments.length - 4} More Nodes
                                 </div>
                               )}
                            </div>
                         ) : (
                            <div className="flex flex-col items-center justify-center py-6 space-y-2 opacity-30">
                               <GraduationCap className="h-8 w-8" />
                               <p className="text-[10px] font-black uppercase">No Active Enrollment</p>
                            </div>
                         )}
                      </div>

                      {/* Action Terminal */}
                      <div className="p-6 lg:w-20 border-t lg:border-t-0 lg:border-l border-border/10 flex items-center justify-center">
                         <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-primary/10 hover:text-primary group-hover:translate-x-1 transition-all">
                            <ChevronRight className="h-6 w-6" />
                         </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <footer className="text-center pt-12">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-background border border-border/40 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity Protocol v2.6.01 Security Active</span>
           </div>
        </footer>
      </main>
    </div>
  );
}