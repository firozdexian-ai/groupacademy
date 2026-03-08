import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, BookOpen, MessageSquare, Copy, CheckCircle } from "lucide-react";

interface CourseResellGigFormProps {
  gig: any;
  talentId: string;
  onSubmitted: () => void;
}

export function CourseResellGigForm({ gig, talentId, onSubmitted }: CourseResellGigFormProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["active-courses-for-resell"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select("id, title, slug, price, currency, cover_image_url")
        .eq("is_published", true)
        .in("content_type", ["batch_class", "recorded_course", "live_webinar"])
        .order("display_order", { ascending: true })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const selectedCourse = courses?.find((c: any) => c.id === selectedCourseId);
  const referralLink = selectedCourse
    ? `https://groupacademy.lovable.app/app/courses/${selectedCourse.slug}?ref=${talentId}`
    : "";
  const shareMessage = selectedCourse
    ? `📚 Check out "${selectedCourse.title}" on GroUp Academy!\n${selectedCourse.price ? `💰 Only $${selectedCourse.price}` : "🆓 Free"}\n\nEnroll now: ${referralLink}`
    : "";

  const handleWhatsAppShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
    setShared(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareMessage);
    toast.success("Copied!");
    setShared(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("gig_submissions").insert({
        gig_id: gig.id,
        talent_id: talentId,
        status: "pending",
        submission_data: {
          course_id: selectedCourseId,
          course_title: selectedCourse?.title,
          referral_link: referralLink,
        },
      });
      if (error) throw error;
      toast.success("Referral submitted! Credits will be awarded on approval.");
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Course picker */}
      <div className="space-y-2">
        <Label>Select a Course to Promote</Label>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading courses...
          </div>
        ) : !courses?.length ? (
          <p className="text-sm text-muted-foreground py-4">No courses available.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {courses.map((course: any) => (
              <button
                key={course.id}
                onClick={() => { setSelectedCourseId(course.id); setShared(false); }}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedCourseId === course.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.price ? `$${course.price}` : "Free"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Share tools */}
      {selectedCourse && (
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-xl p-3">
            <Label className="text-xs text-muted-foreground mb-1 block">Your Referral Message</Label>
            <p className="text-sm whitespace-pre-wrap">{shareMessage}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="gap-1.5" onClick={handleWhatsAppShare}>
              <MessageSquare className="h-3.5 w-3.5 text-green-600" /> WhatsApp
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={handleCopyLink}>
              <Copy className="h-3.5 w-3.5" /> Copy Link
            </Button>
          </div>

          {shared && (
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <CheckCircle className="h-3.5 w-3.5" /> Shared! Now submit for review.
            </div>
          )}

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit for Review
          </Button>
        </div>
      )}
    </div>
  );
}
