import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResourceViewer } from "../ResourceViewer";
import { CheckCircle, PlayCircle, Image } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ModuleResource = Database["public"]["Tables"]["module_resources"]["Row"];

interface OrientationStageProps {
  resources: ModuleResource[];
  onComplete: () => void;
  isCompleted: boolean;
  fallbackVideoUrl?: string | null;
}

export function OrientationStage({ resources, onComplete, isCompleted, fallbackVideoUrl }: OrientationStageProps) {
  const [videoWatched, setVideoWatched] = useState(false);
  const [infographicViewed, setInfographicViewed] = useState(false);

  const videoResource = resources.find(r => r.resource_type === "video");
  const infographicResource = resources.find(r => r.resource_type === "infographic");
  
  // Use fallback video if no video resource exists
  const hasVideo = videoResource || fallbackVideoUrl;

  // Allow completion: if video watched, OR if no video and infographic viewed, OR if no content
  // Also allow manual completion when user clicks "Mark as Watched" button on video
  const canComplete = videoWatched || (!hasVideo && infographicViewed) || (!hasVideo && !infographicResource) || hasVideo;

  const handleVideoProgress = (progress: number) => {
    if (progress >= 80) {
      setVideoWatched(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            Stage 1: Orientation
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Get introduced to this module's key concepts and learning objectives
          </p>
        </div>
        {isCompleted && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        )}
      </div>

      {resources.length === 0 && !fallbackVideoUrl ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Content for this stage is being prepared.</p>
            <Button onClick={onComplete} className="mt-4">
              Continue to Next Stage
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Video Section - from resources or fallback */}
          {(videoResource || fallbackVideoUrl) && (
            <Card className={!infographicResource && !videoResource ? "md:col-span-2" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PlayCircle className="h-4 w-4" />
                  {videoResource?.title || "Module Introduction"}
                  {videoWatched && <CheckCircle className="h-4 w-4 text-green-600" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResourceViewer
                  type="video"
                  url={videoResource?.resource_url || fallbackVideoUrl || ""}
                  title={videoResource?.title || "Module Introduction"}
                  onProgress={handleVideoProgress}
                  onComplete={() => setVideoWatched(true)}
                />
                {videoResource?.description && (
                  <p className="text-sm text-muted-foreground mt-3">
                    {videoResource.description}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Infographic Section */}
          {infographicResource && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  {infographicResource.title}
                  {infographicViewed && <CheckCircle className="h-4 w-4 text-green-600" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {infographicResource.resource_url && (
                  <div onClick={() => setInfographicViewed(true)}>
                    <ResourceViewer
                      type="infographic"
                      url={infographicResource.resource_url}
                      title={infographicResource.title}
                    />
                  </div>
                )}
                {infographicResource.description && (
                  <p className="text-sm text-muted-foreground mt-3">
                    {infographicResource.description}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Completion */}
      {!isCompleted && (resources.length > 0 || fallbackVideoUrl) && (
        <div className="flex justify-end">
          <Button 
            onClick={onComplete}
          >
            {videoWatched ? "Complete & Continue" : "Continue (Mark video above if watched)"}
          </Button>
        </div>
      )}
    </div>
  );
}
