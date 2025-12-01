import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from "lucide-react";

interface Module {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
}

interface VideoPlayerProps {
  module: Module;
  onComplete: () => void;
  isCompleted: boolean;
}

export function VideoPlayer({ module, onComplete, isCompleted }: VideoPlayerProps) {
  const getYouTubeEmbedUrl = (url: string | null) => {
    if (!url) return null;
    
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (videoIdMatch && videoIdMatch[1]) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
    }
    return null;
  };

  const embedUrl = getYouTubeEmbedUrl(module.video_url);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{module.title}</CardTitle>
            {module.description && (
              <CardDescription className="mt-2">{module.description}</CardDescription>
            )}
          </div>
          {isCompleted && (
            <CheckCircle className="h-6 w-6 text-green-500" />
          )}
        </div>
        {module.duration_minutes && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{module.duration_minutes} minutes</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {embedUrl ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <iframe
              src={embedUrl}
              title={module.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        ) : (
          <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">No video available</p>
          </div>
        )}
        
        {!isCompleted && (
          <Button onClick={onComplete} className="w-full">
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Complete
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
