import { TalentProfile } from "@/contexts/TalentContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, Download, Upload, Loader2, Zap, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { downloadFile } from "@/lib/downloadFile";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Persistent Artifact Lifecycle Node (ExistingCVCard)
 * CTO Reference: Authoritative interface for registry-resident CV artifacts.
 */

interface ExistingCVCardProps {
  talent: TalentProfile | null;
  onUseExisting: () => void;
  onUploadNew: () => void;
  loading?: boolean;
  showActions?: boolean;
  className?: string;
}

export function ExistingCVCard({
  talent,
  onUseExisting,
  onUploadNew,
  loading = false,
  showActions = true,
  className,
}: ExistingCVCardProps) {
  if (!talent?.cvUrl) return null;

  const registryDate = talent.cvParsedAt ? format(new Date(talent.cvParsedAt), "dd_MMM_yyyy").toUpperCase() : null;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-[32px] border-2 border-primary/20 bg-card/40 backdrop-blur-xl transition-all duration-500 hover:border-primary/40 hover:shadow-2xl",
        className,
      )}
    >
      {/* ATMOSPHERIC_NODE: Subtle background sync pulse */}
      <div className="absolute -right-8 -top-8 h-32 w-32 bg-primary/10 blur-[60px] rounded-full pointer-events-none animate-pulse" />

      <CardContent className="p-6">
        <div className="flex items-start gap-5">
          {/* HUD: ARTIFACT_ICON */}
          <div className="relative shrink-0">
            <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/10 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-background shadow-lg">
              <ShieldCheck className="h-3 w-3 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black uppercase italic tracking-tighter text-foreground">
                REGISTRY_CV_DETECTED
              </h3>
              <Zap className="h-3 w-3 text-primary animate-pulse fill-current" />
            </div>

            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">
              {registryDate ? `SYNC_TIMESTAMP: ${registryDate}` : "ARTIFACT_READY_FOR_DEPLOYMENT"}
            </p>

            {showActions && (
              <div className="flex flex-wrap gap-3 mt-5">
                <Button
                  size="sm"
                  onClick={onUseExisting}
                  disabled={loading}
                  className="h-10 rounded-xl px-5 font-black uppercase italic text-[10px] tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      INITIALIZING...
                    </>
                  ) : (
                    <>
                      SYNC_THIS_ARTIFACT <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={onUploadNew}
                  disabled={loading}
                  className="h-10 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest hover:bg-muted/10 transition-all gap-2"
                >
                  <Upload className="h-3.5 w-3.5" />
                  OVERWRITE_NODE
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 w-10 rounded-xl hover:bg-primary/5 hover:text-primary transition-all p-0"
                  onClick={() => downloadFile(talent.cvUrl!, `${talent.fullName || "ARTIFACT"}_CV.pdf`)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
