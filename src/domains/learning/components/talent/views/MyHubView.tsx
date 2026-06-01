/**
 * GroUp Academy: Personal Learning & Progress Cockpit (AppMyLearning)
 * CTO Reference: Corrected import paths and hardened structural layout.
 * Version: Launch Candidate · Phase Z0 Hardened · Build Fix Patch
 */
import { useNavigate } from "react-router-dom";
import { BookOpen, ArrowLeft, Target, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

// Domain-driven imports verified for Z0 Contract Stability
import { MyCoursesTab } from "@/domains/learning/components/talent/MyCoursesTab";
import { UpcomingSessionsRail } from "@/domains/learning/components/talent/UpcomingSessionsRail";
import { cn } from "@/lib/utils";

export default function AppMyLearning() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-left antialiased w-full px-0 sm:px-4">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/app/learning")}
              className="rounded-lg h-9 w-9 shrink-0"
              aria-label="Back to Learning Hub"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-foreground">My Learning</h1>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Personal growth workspace
              </p>
            </div>
          </div>

          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0">
            <GraduationCap className="h-4 w-4 text-primary" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-32">
        {/* Live Session Broadcast */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Upcoming Sessions</h2>
          </div>
          <UpcomingSessionsRail />
        </section>

        {/* Course Curriculum List */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Enrolled Courses</h2>
          </div>
          <div className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
            <MyCoursesTab />
          </div>
        </section>
      </main>
    </div>
  );
}
