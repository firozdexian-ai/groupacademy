/**
 * Inline registration panel for live webinars / batch classes.
 * Delegates the entire reservation flow to `enroll_in_content` via useEnrollment.
 */
import { Card, CardContent } from "@/components/ui/card";
import { useEnrollment } from "@/hooks/useEnrollment";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Coins, MessageCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useTalent } from "@/hooks/useTalent";
import { useNavigate } from "react-router-dom";
import { formatEventTime, formatEventLocal, DEFAULT_EVENT_TZ } from "@/lib/eventTime";
import { getCourseCredits } from "@/lib/creditPricing";

interface Props {
  course: {
    id: string;
    slug: string;
    title: string;
    content_type: string;
    event_date: string | null;
    event_timezone: string | null;
    event_duration_minutes: number | null;
    max_capacity: number | null;
    current_enrollment: number | null;
    whatsapp_group_link: string | null;
    price: number | null;
    credit_cost?: number | null;
  };
}

export function WebinarEnrollPanel({ course }: Props) {
  const { talent } = useTalent();
  const navigate = useNavigate();
  const { enrollment, isLoading, enroll, isEnrolling } = useEnrollment(course.id);

  const creditCost = getCourseCredits(Number(course.price ?? 0), course.credit_cost ?? null);
  const tz = course.event_timezone || DEFAULT_EVENT_TZ;
  const seatsLeft =
    course.max_capacity != null ? course.max_capacity - (course.current_enrollment || 0) : null;

  const handleEnroll = async () => {
    if (!talent?.id) {
      navigate(`/auth?redirect=/app/learning/courses/${course.slug}`);
      return;
    }
    await enroll();
  };

  return (
    <Card className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-500/5">
      <CardContent className="p-4 space-y-3">
        <Badge className="bg-rose-500/10 text-rose-600 border-0 text-[10px] w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mr-1 animate-pulse" />
          Live session
        </Badge>

        {course.event_date && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold">{formatEventTime(course.event_date, tz)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground pl-6">{formatEventLocal(course.event_date)}</p>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {course.event_duration_minutes ? (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.event_duration_minutes} min</span>
          ) : null}
          {seatsLeft !== null && (
            <span className={`flex items-center gap-1 ${seatsLeft <= 10 ? "text-rose-600 font-medium" : ""}`}>
              <Users className="h-3 w-3" />
              {seatsLeft > 0 ? `${seatsLeft} seats left` : "Sold out"}
            </span>
          )}
          <span className="flex items-center gap-1 text-primary font-semibold">
            <Coins className="h-3 w-3" />{creditCost} cr
          </span>
        </div>

        {enrollment ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="h-4 w-4" /> You're registered
            </div>
            {course.whatsapp_group_link && (
              <Button
                variant="outline"
                className="w-full rounded-xl border-emerald-500/30 text-emerald-600"
                asChild
              >
                <a href={course.whatsapp_group_link} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" /> Join WhatsApp group
                </a>
              </Button>
            )}
          </div>
        ) : (
          <Button
            className="w-full rounded-xl"
            onClick={handleEnroll}
            disabled={isEnrolling || isLoading || (seatsLeft !== null && seatsLeft <= 0)}
          >
            {isEnrolling ? "Reserving..." : creditCost > 0 ? `Reserve seat · ${creditCost} cr` : "Reserve free seat"}
            {!isEnrolling && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
