import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResourceViewer } from "../ResourceViewer";
import { AIChatPanel } from "@/components/ai-instructor/AIChatPanel";
import { CheckCircle, MessageSquare, Headphones, Bot } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ModuleResource = Database["public"]["Tables"]["module_resources"]["Row"];

interface DiscussStageProps {
  resources: ModuleResource[];
  onComplete: () => void;
  isCompleted: boolean;
  professionLineId: string;
  moduleId: string;
  instructorName?: string;
}

export function DiscussStage({ 
  resources, 
  onComplete, 
  isCompleted,
  professionLineId,
  moduleId,
  instructorName = "AI Instructor"
}: DiscussStageProps) {
  const [audioListened, setAudioListened] = useState(false);
  const [aiMessageCount, setAiMessageCount] = useState(0);

  const audioResource = resources.find(r => r.resource_type === "audio_podcast");

  // Complete when audio is listened OR 3+ AI messages sent
  const canComplete = audioListened || aiMessageCount >= 3 || resources.length === 0;

  const handleAudioComplete = () => {
    setAudioListened(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Stage 3: Discuss
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Deepen your understanding through expert discussions and AI conversations
          </p>
        </div>
        {isCompleted && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        )}
      </div>

      {resources.length === 0 && !professionLineId ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No discussion content available for this module yet.</p>
            <Button onClick={onComplete} className="mt-4">
              Skip to Next Stage
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Audio Podcast Section */}
          <div className="space-y-4">
            {audioResource ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Headphones className="h-4 w-4" />
                    {audioResource.title}
                    {audioListened && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {audioResource.resource_url && (
                    <ResourceViewer
                      type="audio_podcast"
                      url={audioResource.resource_url}
                      title={audioResource.title}
                      onComplete={handleAudioComplete}
                    />
                  )}
                  {audioResource.description && (
                    <p className="text-sm text-muted-foreground mt-3">
                      {audioResource.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Headphones className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No audio content for this module</p>
                </CardContent>
              </Card>
            )}

            {/* Completion hint */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>To complete this stage:</strong> Listen to the audio podcast OR have a conversation with the AI instructor (send at least 3 messages).
                </p>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className={audioListened ? "text-green-600" : ""}>
                    {audioListened ? "✓" : "○"} Audio listened
                  </span>
                  <span className={aiMessageCount >= 3 ? "text-green-600" : ""}>
                    {aiMessageCount >= 3 ? "✓" : "○"} AI messages: {aiMessageCount}/3
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Chat Section */}
          <Card className="h-[400px] flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Chat with {instructorName}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <AIChatPanel
                professionLineId={professionLineId}
                contextType="module"
                contextId={moduleId}
                instructorName={instructorName}
                placeholder="Ask questions about this module..."
                className="h-full border-0 rounded-none"
                onMessageSent={() => setAiMessageCount(prev => prev + 1)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Completion */}
      {!isCompleted && (
        <div className="flex justify-end">
          <Button 
            onClick={onComplete}
            disabled={!canComplete}
          >
            {canComplete ? "Complete & Continue" : "Listen to audio or chat with AI"}
          </Button>
        </div>
      )}
    </div>
  );
}
