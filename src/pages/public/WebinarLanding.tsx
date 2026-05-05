/**
 * Public, shareable webinar landing page.
 * Captures ?ref=<talent_id> for the referral system, then routes to auth → enrolled course.
 */
import { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Users, Sparkles, ArrowRight, Coins } from "lucide-react";
import { formatEventTime, formatEventLocal, DEFAULT_EVENT_TZ } from "@/lib/eventTime";
import { getCourseCredits } from "@/lib/creditPricing";

export default function WebinarLanding() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Capture referral in localStorage so the auth flow / enrollment can persist & reward it
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("ga_referral", ref);
      if (slug) localStorage.setItem(`course_ref:${slug}`, ref);
    }
  }, [searchParams, slug]);

  const { data: webinar, isLoading } = useQuery({
    queryKey: ["public-webinar", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select(
          "id, title, slug, description, content_type, cover_image_url, event_date, event_timezone, event_duration_minutes, max_capacity, current_enrollment, instructor_name, price",
        )
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Track referral click once the webinar id is known
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && webinar?.id) {
      supabase.rpc("track_course_referral_click", { p_content_id: webinar.id, p_ref_code: ref }).then(() => {});
    }
  }, [searchParams, webinar?.id]);

  const handleJoin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const target = `/app/learning/courses/${slug}?promo=webinar`;
    if (session) navigate(target);
    else navigate(`/auth?redirect=${encodeURIComponent(target)}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!webinar) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Webinar not found</h1>
        <p className="text-muted-foreground mb-6">This event may have been removed.</p>
        <Button onClick={() => navigate("/")}>Back to home</Button>
      </div>
    );
  }

  const credits = getCourseCredits(Number(webinar.price ?? 0));
  const seatsLeft = webinar.max_capacity
    ? webinar.max_capacity - (webinar.current_enrollment || 0)
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 space-y-5">
      <div className="rounded-2xl overflow-hidden border border-border/40 bg-card">
        {webinar.cover_image_url ? (
          <img src={webinar.cover_image_url} alt={webinar.title} className="w-full aspect-video object-cover" />
        ) : (
          <div className="w-full aspect-video bg-gradient-to-br from-primary/10 to-emerald-500/10 flex items-center justify-center">
            <Sparkles className="h-16 w-16 text-primary/40" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">
          Live Webinar
        </span>
        <h1 className="text-2xl font-bold leading-tight">{webinar.title}</h1>
        {webinar.instructor_name && (
          <p className="text-sm text-muted-foreground">Hosted by {webinar.instructor_name}</p>
        )}
      </div>

      <Card className="p-4 rounded-2xl border-border/40 space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="font-semibold">
              {formatEventTime(webinar.event_date, webinar.event_timezone || DEFAULT_EVENT_TZ)}
            </p>
            <p className="text-xs text-muted-foreground">{formatEventLocal(webinar.event_date)}</p>
          </div>
        </div>
        {webinar.event_duration_minutes ? (
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <span>{webinar.event_duration_minutes} minutes</span>
          </div>
        ) : null}
        {seatsLeft !== null && (
          <div className="flex items-center gap-3 text-sm">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <span className={seatsLeft <= 10 ? "text-rose-600 font-medium" : ""}>
              {seatsLeft > 0 ? `${seatsLeft} seats left` : "Sold out"}
            </span>
          </div>
        )}
      </Card>

      {webinar.description && (
        <Card className="p-4 rounded-2xl border-border/40">
          <h2 className="text-sm font-semibold mb-2">About this session</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{webinar.description}</p>
        </Card>
      )}

      <Card className="p-4 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-500/5 space-y-3">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-emerald-600" />
          <p className="text-sm font-bold">Free with your welcome bonus</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Sign up and get <span className="font-semibold text-foreground">250 free credits</span> instantly.
          This webinar costs <span className="font-semibold text-foreground">{credits} credits</span> — leaving you{" "}
          <span className="font-semibold text-foreground">{Math.max(0, 250 - credits)} credits</span> for AI mock interviews,
          salary analysis, and more.
        </p>
        <Button size="lg" className="w-full rounded-xl" onClick={handleJoin}>
          Sign up & reserve my seat <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Card>
    </div>
  );
}
