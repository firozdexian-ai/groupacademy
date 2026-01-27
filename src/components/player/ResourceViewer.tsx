import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Maximize, ExternalLink, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResourceViewerProps {
  type: "video" | "slides" | "infographic" | "mindmap" | "audio_podcast";
  url: string;
  title: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  className?: string;
}

export function ResourceViewer({ 
  type, 
  url, 
  title, 
  onProgress, 
  onComplete,
  className 
}: ResourceViewerProps) {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Extract YouTube video ID
  const getYouTubeId = (youtubeUrl: string) => {
    const match = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
      onProgress?.(progress);
      
      if (progress >= 80) {
        onComplete?.();
      }
    }
  };

  const toggleAudioPlay = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setAudioPlaying(!audioPlaying);
    }
  };

  if (type === "video") {
    const videoId = getYouTubeId(url);
    if (!videoId) {
      return (
        <Card className={className}>
          <CardContent className="p-4">
            <p className="text-muted-foreground">Invalid video URL</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={cn("overflow-hidden", className)}>
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <CardContent className="p-3 flex items-center justify-between">
          <p className="text-sm font-medium">{title}</p>
          {onComplete && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onComplete}
              className="gap-1 shrink-0"
            >
              <CheckCircle className="h-4 w-4" />
              Mark as Watched
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (type === "slides") {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <div className="aspect-video bg-muted">
          <iframe
            src={url}
            title={title}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
        <CardContent className="p-3 flex items-center justify-between">
          <p className="text-sm font-medium">{title}</p>
          <Button variant="ghost" size="sm" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Open
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (type === "infographic" || type === "mindmap") {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-0">
          <div className="relative group">
            <img 
              src={url} 
              alt={title} 
              className="w-full h-auto cursor-zoom-in"
              onClick={() => window.open(url, '_blank')}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button variant="secondary" size="sm">
                <Maximize className="h-4 w-4 mr-1" />
                View Full Size
              </Button>
            </div>
          </div>
        </CardContent>
        <CardContent className="p-3 pt-0">
          <p className="text-sm font-medium">{title}</p>
        </CardContent>
      </Card>
    );
  }

  if (type === "audio_podcast") {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">{title}</p>
          
          <audio 
            ref={audioRef} 
            src={url} 
            onTimeUpdate={handleAudioTimeUpdate}
            onEnded={() => {
              setAudioPlaying(false);
              onComplete?.();
            }}
            className="hidden"
          />
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon"
              onClick={toggleAudioPlay}
            >
              {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${audioProgress}%` }}
              />
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.muted = !audioMuted;
                  setAudioMuted(!audioMuted);
                }
              }}
            >
              {audioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
