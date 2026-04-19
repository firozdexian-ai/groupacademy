import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  ArrowLeft,
  Users,
  Clock,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay } from "date-fns";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { CardGridSkeleton } from "@/components/ui/page-loading-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/lib/utils";

interface Enrollment {
  id: string;
  status: string;
  enrolled_at: string;
  payment_amount: number | null;
  student: {
    full_name: string;
    student_id: string;
  };
  content: {
    title: string;
    content_type: string;
    event_date: string | null;
    max_capacity: number | null;
    current_enrollment: number;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending_payment: { label: "Payment Due", color: "bg-amber-500/10 text-amber-600", icon: Clock },
  active: { label: "Live Access", color: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle2 },
  confirmed: { label: "Vetted", color: "bg-blue-500/10 text-blue-600", icon: CheckCircle2 },
  completed: { label: "Graduated", color: "bg-primary/10 text-primary", icon: TrendingUp },
  cancelled: { label: "Terminated", color: "bg-rose-500/10 text-rose-600", icon: AlertTriangle },
};

export default function Enrollments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await withTimeout<any>(
        Promise.resolve(
          supabase
            .from("enrollments")
            .select(
              `
          *, 
          student:student_id(full_name, student_id), 
          content:content_id(title, content_type, event_date, max_capacity, current_enrollment)
        `,
            )
            .order("enrolled_at", { ascending: false }),
        ),
        TIMEOUTS.DEFAULT,
        "Connection timed out",
      );
      if (error) throw error;
      setEnrollments(data || []);
    } catch (err: any) {
      setLoadError(err.message);
      toast({ title: "Nexus Error", description: "Database synchronization failed.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrollments = useMemo(() => {
    if (!selectedDate) return enrollments;
    return enrollments.filter((e) => e.content.event_date && isSameDay(new Date(e.content.event_date), selectedDate));
  }, [selectedDate, enrollments]);

  const capacityAlerts = enrollments.filter(
    (e) => e.content.max_capacity && e.content.current_enrollment >= e.content.max_capacity * 0.9,
  );

  return (
    <div className="min-h-screen bg-muted/20 pb-20 animate-in fade-in duration-700">
      <div className="container mx-auto px-6 py-10 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="rounded-xl font-bold uppercase text-[10px] tracking-widest pl-0 hover:bg-transparent"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Nexus Dashboard
            </Button>
            <h1 className="text-4xl font-black tracking-tighter">Enrollment Pipeline</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Global Capacity & Student Ingestion
            </p>
          </div>
          <Button
            onClick={loadEnrollments}
            variant="outline"
            className="rounded-xl h-12 px-6 gap-2 font-black uppercase text-[10px] tracking-widest shadow-sm"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh Intel
          </Button>
        </header>

        {capacityAlerts.length > 0 && (
          <Card className="rounded-[28px] border-amber-500/20 bg-amber-500/[0.03] overflow-hidden">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-amber-700">
                  Critical Capacity Thresholds
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {capacityAlerts.map((e) => (
                    <div
                      key={e.id}
                      className="text-[11px] font-bold bg-background/50 p-3 rounded-xl border border-amber-500/10"
                    >
                      <span className="block truncate">{e.content.title}</span>
                      <span className="text-amber-600">
                        {e.content.current_enrollment} / {e.content.max_capacity} Enrolled
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-8 items-start">
          <Card className="rounded-[32px] border-border/40 bg-card/50 backdrop-blur-xl sticky top-24">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Event Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-2xl border bg-background shadow-inner"
              />
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Focus Date</p>
                <p className="text-sm font-bold">
                  {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Global View"}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-tighter">
                  {filteredEnrollments.length} Active Records Identified
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Record Stream</h2>

            {loading ? (
              <CardGridSkeleton count={4} columns={2} />
            ) : loadError ? (
              <ErrorState type="server" title="Ingestion Failed" description={loadError} onRetry={loadEnrollments} />
            ) : filteredEnrollments.length === 0 ? (
              <Card className="rounded-[32px] border-dashed border-border/40 py-20 text-center bg-transparent">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">
                  Zero records found for this temporal slice
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredEnrollments.map((e) => {
                  const status = statusConfig[e.status] || statusConfig.pending_payment;
                  return (
                    <Card
                      key={e.id}
                      className="rounded-[28px] border-border/40 bg-card hover:shadow-xl hover:border-primary/20 transition-all group"
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          <div className="space-y-3 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-primary/5 text-primary border-none text-[9px] font-black uppercase tracking-tighter">
                                {e.content.content_type?.replace("_", " ")}
                              </Badge>
                              <Badge
                                className={cn(
                                  "border-none text-[9px] font-black uppercase tracking-widest px-2.5 h-6",
                                  status.color,
                                )}
                              >
                                <status.icon className="h-3 w-3 mr-1.5" /> {status.label}
                              </Badge>
                            </div>
                            <h3 className="text-lg font-black tracking-tight group-hover:text-primary transition-colors truncate">
                              {e.content.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                <Users className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <p className="text-xs font-bold uppercase tracking-tight">{e.student.full_name}</p>
                              <span className="text-[10px] font-medium text-muted-foreground/40">
                                ID: {e.student.student_id}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:flex md:flex-col md:items-end gap-4 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-border/40 md:pl-8">
                            <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/60">
                                Enrolled On
                              </p>
                              <div className="flex items-center gap-1.5 text-xs font-bold">
                                <Clock className="h-3.5 w-3.5 text-primary/40" />
                                {format(new Date(e.enrolled_at), "MMM d, yy")}
                              </div>
                            </div>
                            {e.payment_amount && (
                              <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/60">
                                  Revenue
                                </p>
                                <div className="flex items-center gap-1.5 text-sm font-black text-emerald-600">
                                  <DollarSign className="h-4 w-4" />
                                  {e.payment_amount}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
