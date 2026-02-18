import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen, ChevronRight, Target, Calendar, Library } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTalent } from "@/hooks/useTalent";
import { useLearningStats } from "@/hooks/useLearningStats";
import { ActiveCourseHero } from "@/components/learning/ActiveCourseHero";
import { LearningStatsRow } from "@/components/learning/LearningStreak";
import { UnifiedDiscovery } from "@/components/learning/UnifiedDiscovery";
import { QuickStats } from "@/components/learning/QuickStats";
import { QuickActionCard } from "@/components/learning/QuickActionCard";
import { CareerTracksPreview } from "@/components/learning/CareerTracksPreview";
import { CreditBalance } from "@/components/credits/CreditBalance";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function LearningHub() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const {
    currentStreak,
    totalHoursLearned,
    coursesCompleted,
    modulesCompleted,
    activeEnrollments,
    isLoading,
  } = useLearningStats();

  const primaryEnrollment = activeEnrollments[0];
  const otherEnrollments = activeEnrollments.slice(1);
  const greeting = getGreeting();
  const firstName = talent?.fullName?.split(" ")[0] || "there";

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4 pb-32">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        {/* Top bar with streak and credits */}
        <div className="flex items-center justify-between mb-4">
          <LearningStatsRow
            streak={currentStreak}
            hoursLearned={totalHoursLearned}
            coursesCompleted={coursesCompleted}
          />
          <CreditBalance className="hidden sm:flex" />
        </div>

        {/* Personalized greeting */}
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-background rounded-xl shadow-sm shrink-0">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold mb-1">
              {greeting}, {firstName}!
            </h1>
            {primaryEnrollment && primaryEnrollment.content ? (
              <p className="text-sm text-muted-foreground">
                You're {primaryEnrollment.progress}% through{" "}
                <span className="font-medium text-foreground">
                  "{primaryEnrollment.content.title}"
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ready to start your learning journey today?
              </p>
            )}
            {primaryEnrollment && (
              <Button
                size="sm"
                className="mt-3"
                onClick={() => navigate(`/app/learn/${primaryEnrollment.content?.slug}`)}
              >
                Resume Learning
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-bold">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickActionCard
            icon={BookOpen}
            label="My Courses"
            count={activeEnrollments.length}
            path="/app/learning/my-courses"
          />
          <QuickActionCard
            icon={Target}
            label="Career Tracks"
            description="Structured paths"
            path="/app/learning/tracks"
          />
          <QuickActionCard
            icon={Library}
            label="All Courses"
            description="Browse catalog"
            path="/app/learning/courses"
          />
          <QuickActionCard
            icon={Calendar}
            label="Events"
            description="Live sessions"
            path="/app/learning/events"
          />
        </div>
      </section>

      {/* Career Tracks Preview */}
      <CareerTracksPreview />

      {/* Continue Learning Section */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : primaryEnrollment ? (
        <ActiveCourseHero
          enrollment={primaryEnrollment}
          upNextEnrollments={otherEnrollments}
        />
      ) : (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Start Learning</h2>
          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No active courses yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                Explore our courses and start building your skills today!
              </p>
              <Button onClick={() => navigate("/app/learning/courses")}>
                Browse Courses
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Unified Discovery Section */}
      <UnifiedDiscovery />

      {/* Quick Stats */}
      <QuickStats
        coursesCompleted={coursesCompleted}
        hoursLearned={totalHoursLearned}
        modulesCompleted={modulesCompleted}
      />
    </div>
  );
}
