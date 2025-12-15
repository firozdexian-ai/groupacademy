import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Users, Clock, DollarSign, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay } from "date-fns";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { CardGridSkeleton } from "@/components/ui/page-loading-skeleton";
import { ErrorState } from "@/components/ui/error-state";

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

const statusConfig = {
  pending_payment: { label: "Pending Payment", color: "bg-amber-500" },
  active: { label: "Active", color: "bg-green-500" },
  confirmed: { label: "Confirmed", color: "bg-primary" },
  completed: { label: "Completed", color: "bg-green-600" },
  cancelled: { label: "Cancelled", color: "bg-destructive" },
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
      const result = await withTimeout(
        Promise.resolve(supabase.from("enrollments").select(`*, student:student_id(full_name, student_id), content:content_id(title, content_type, event_date, max_capacity, current_enrollment)`).order("enrolled_at", { ascending: false })),
        TIMEOUTS.DEFAULT,
        "Loading enrollments timed out"
      );
      if (result.error) throw result.error;
      setEnrollments(result.data || []);
    } catch (error: any) {
      setLoadError(error.message || "Failed to load enrollments");
      toast({
        title: "Error loading enrollments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const enrollmentsOnSelectedDate = enrollments.filter((enrollment) => {
    if (!selectedDate || !enrollment.content.event_date) return false;
    return isSameDay(new Date(enrollment.content.event_date), selectedDate);
  });

  const datesWithEnrollments = enrollments
    .filter((e) => e.content.event_date)
    .map((e) => new Date(e.content.event_date!));

  const capacityWarnings = enrollments.filter(
    (e) =>
      e.content.max_capacity &&
      e.content.current_enrollment >= e.content.max_capacity * 0.9
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Enrollments</h1>
              <p className="text-muted-foreground">
                Track enrollments and manage capacity
              </p>
            </div>
          </div>
        </div>

        {capacityWarnings.length > 0 && (
          <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Capacity Warnings
            </h3>
            <div className="space-y-1">
              {capacityWarnings.map((enrollment) => (
                <p key={enrollment.id} className="text-sm">
                  <span className="font-medium">{enrollment.content.title}</span> is
                  at {enrollment.content.current_enrollment}/
                  {enrollment.content.max_capacity} capacity
                </p>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Event Calendar</h2>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{
                hasEnrollment: datesWithEnrollments,
              }}
              modifiersStyles={{
                hasEnrollment: {
                  backgroundColor: "hsl(var(--primary))",
                  color: "white",
                  fontWeight: "bold",
                },
              }}
              className="rounded-md border"
            />
            {selectedDate && (
              <div className="mt-4 text-sm text-muted-foreground">
                {enrollmentsOnSelectedDate.length > 0
                  ? `${enrollmentsOnSelectedDate.length} enrollment(s) on ${format(selectedDate, "MMM d, yyyy")}`
                  : "No enrollments on this date"}
              </div>
            )}
          </Card>

          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="font-semibold mb-4">
                {selectedDate
                  ? `Enrollments on ${format(selectedDate, "MMMM d, yyyy")}`
                  : "All Enrollments"}
              </h2>

              {loading ? (
                <CardGridSkeleton count={3} columns={3} />
              ) : loadError ? (
                <ErrorState
                  type="server"
                  title="Failed to load enrollments"
                  description={loadError}
                  onRetry={loadEnrollments}
                />
              ) : enrollmentsOnSelectedDate.length === 0 && selectedDate ? (
                <p className="text-muted-foreground text-center py-12">
                  No enrollments on this date
                </p>
              ) : (
                <div className="space-y-4">
                  {(selectedDate ? enrollmentsOnSelectedDate : enrollments).map(
                    (enrollment: any) => (
                      <Card key={enrollment.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">
                              {enrollment.content.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {enrollment.student.full_name} (
                              {enrollment.student.student_id})
                            </p>
                          </div>
                          <Badge
                            className={
                              statusConfig[
                                enrollment.status as keyof typeof statusConfig
                              ].color
                            }
                          >
                            {
                              statusConfig[
                                enrollment.status as keyof typeof statusConfig
                              ].label
                            }
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(
                                new Date(enrollment.enrolled_at),
                                "MMM d, yyyy"
                              )}
                            </span>
                          </div>
                          {enrollment.payment_amount && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span>BDT {enrollment.payment_amount}</span>
                            </div>
                          )}
                          {enrollment.content.max_capacity && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {enrollment.content.current_enrollment}/
                                {enrollment.content.max_capacity} enrolled
                              </span>
                            </div>
                          )}
                        </div>
                      </Card>
                    )
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}