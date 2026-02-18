import { useNavigate } from "react-router-dom";
import { PlayCircle, Clock, ChevronRight, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ActiveEnrollment } from "@/hooks/useLearningStats";

interface ActiveCourseHeroProps {
  enrollment: ActiveEnrollment;
  upNextEnrollments?: ActiveEnrollment[];
}

export function ActiveCourseHero({ enrollment, upNextEnrollments = [] }: ActiveCourseHeroProps) {
  const navigate = useNavigate();
  const { content, progress, modules = [] } = enrollment;

  if (!content) return null;

  // Find current module index
  const currentModuleIndex = enrollment.current_module_id
    ? modules.findIndex((m) => m.id === enrollment.current_module_id)
    : 0;
  const currentModule = modules[Math.max(0, currentModuleIndex)];
  const nextModules = modules.slice(currentModuleIndex + 1, currentModuleIndex + 3);

  const handleResume = () => {
    navigate(`/app/learn/${content.slug}`);
  };

  const handleViewDetails = () => {
    navigate(`/app/learning/courses/${content.slug}`);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <PlayCircle className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Continue Where You Left Off</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr,280px]">
        {/* Main Hero Card */}
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-background to-muted/30">
          <div className="grid md:grid-cols-[200px,1fr] h-full">
            {/* Thumbnail */}
            <div className="aspect-[2/1] md:aspect-auto relative overflow-hidden bg-muted">
              {content.thumbnail_url ? (
                <img
                  src={content.thumbnail_url}
                  alt={content.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                  <BookOpen className="h-12 w-12 text-primary/20" />
                </div>
              )}
              {/* Progress overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <div className="flex items-center gap-2 text-white text-xs">
                  <div className="flex-1 bg-white/30 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="font-medium">{progress}%</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <CardContent className="p-5 flex flex-col justify-between">
              <div>
                <Badge variant="outline" className="mb-2 text-xs capitalize">
                  {content.content_type.replace("_", " ")}
                </Badge>
                <h3 className="font-bold text-lg mb-2 line-clamp-2">{content.title}</h3>
                
                {currentModule && (
                  <div className="text-sm text-muted-foreground mb-1">
                    <span className="text-foreground font-medium">Current:</span>{" "}
                    {currentModule.title}
                  </div>
                )}
                
                {currentModule?.estimated_time_minutes && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    ~{currentModule.estimated_time_minutes} min left in module
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-4">
                <Button onClick={handleResume} className="gap-2">
                  <PlayCircle className="h-4 w-4" />
                  Resume Now
                </Button>
                <Button variant="outline" size="sm" onClick={handleViewDetails}>
                  View Modules
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Up Next Sidebar - horizontal scroll on mobile */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Up Next
          </h3>
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {nextModules.length > 0 ? (
              nextModules.map((module, idx) => (
                <Card
                  key={module.id}
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-colors shrink-0 min-w-[200px] lg:min-w-0"
                  onClick={handleResume}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {currentModuleIndex + idx + 2}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{module.title}</p>
                      {module.estimated_time_minutes && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {module.estimated_time_minutes} min
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-3 bg-muted/30 border-dashed">
                <p className="text-sm text-muted-foreground text-center">
                  You're on the last module! 🎉
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* More courses horizontal scroll (if any) */}
      {upNextEnrollments.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Other Active Courses</h3>
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex gap-3">
              {upNextEnrollments.map((enr) => (
                <Card
                  key={enr.id}
                  className="w-[200px] shrink-0 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate(`/app/learning/courses/${enr.content?.slug}`)}
                >
                  <div className="aspect-video bg-muted relative overflow-hidden rounded-t-lg">
                    {enr.content?.thumbnail_url ? (
                      <img
                        src={enr.content.thumbnail_url}
                        alt={enr.content.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium line-clamp-2 whitespace-normal">
                      {enr.content?.title}
                    </p>
                    <Progress value={enr.progress} className="h-1 mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">{enr.progress}% complete</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </section>
  );
}
