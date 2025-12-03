import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResourceViewer } from "../ResourceViewer";
import { CheckCircle, BookOpen, FileText, Network } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ModuleResource = Database["public"]["Tables"]["module_resources"]["Row"];

interface LearnStageProps {
  resources: ModuleResource[];
  onComplete: () => void;
  isCompleted: boolean;
}

export function LearnStage({ resources, onComplete, isCompleted }: LearnStageProps) {
  const [slidesViewed, setSlidesViewed] = useState(false);
  const [mindmapViewed, setMindmapViewed] = useState(false);

  const slidesResource = resources.find(r => r.resource_type === "slides");
  const mindmapResource = resources.find(r => r.resource_type === "mindmap");

  const canComplete = slidesViewed || (!slidesResource && mindmapViewed) || resources.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Stage 2: Learn
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Dive deep into the module content through slides and visual materials
          </p>
        </div>
        {isCompleted && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        )}
      </div>

      {resources.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No learning materials available for this module yet.</p>
            <Button onClick={onComplete} className="mt-4">
              Skip to Next Stage
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Slides Section */}
          {slidesResource && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {slidesResource.title}
                  {slidesViewed && <CheckCircle className="h-4 w-4 text-green-600" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {slidesResource.resource_url && (
                  <div onClick={() => setSlidesViewed(true)}>
                    <ResourceViewer
                      type="slides"
                      url={slidesResource.resource_url}
                      title={slidesResource.title}
                    />
                  </div>
                )}
                {slidesResource.description && (
                  <p className="text-sm text-muted-foreground mt-3">
                    {slidesResource.description}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Mindmap Section */}
          {mindmapResource && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  {mindmapResource.title}
                  {mindmapViewed && <CheckCircle className="h-4 w-4 text-green-600" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mindmapResource.resource_url && (
                  <div onClick={() => setMindmapViewed(true)}>
                    <ResourceViewer
                      type="mindmap"
                      url={mindmapResource.resource_url}
                      title={mindmapResource.title}
                    />
                  </div>
                )}
                {mindmapResource.description && (
                  <p className="text-sm text-muted-foreground mt-3">
                    {mindmapResource.description}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Completion */}
      {!isCompleted && resources.length > 0 && (
        <div className="flex justify-end">
          <Button 
            onClick={onComplete}
            disabled={!canComplete}
          >
            {canComplete ? "Complete & Continue" : "View slides to continue"}
          </Button>
        </div>
      )}
    </div>
  );
}
