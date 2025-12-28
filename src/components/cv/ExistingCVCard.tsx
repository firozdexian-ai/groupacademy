import { TalentProfile } from "@/contexts/TalentContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, ExternalLink, Upload, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ExistingCVCardProps {
  talent: TalentProfile | null;
  onUseExisting: () => void;
  onUploadNew: () => void;
  loading?: boolean;
  showActions?: boolean;
}

export function ExistingCVCard({
  talent,
  onUseExisting,
  onUploadNew,
  loading = false,
  showActions = true,
}: ExistingCVCardProps) {
  if (!talent?.cvUrl) {
    return null;
  }

  const parsedDate = talent.cvParsedAt
    ? format(new Date(talent.cvParsedAt), "MMM d, yyyy")
    : null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <p className="font-medium">CV on file</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {parsedDate
                ? `Uploaded on ${parsedDate}`
                : "Your CV is saved and ready to use"}
            </p>
            
            {showActions && (
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={onUseExisting}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Using...
                    </>
                  ) : (
                    "Use This CV"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onUploadNew}
                  disabled={loading}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload New
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                >
                  <a href={talent.cvUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
