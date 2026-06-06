import { useMemo } from "react";
import { TalentProfile } from "@/contexts/TalentContext";
import { downloadFile } from "@/lib/downloadFile";
import { cn } from "@/lib/utils";

// UI Primitive Matrix Registries
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Upload, Loader2, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import { format, isValid } from "date-fns";

interface ExistingCVCardProps {
  talent: TalentProfile | null;
  onUseExisting: () => void;
  onUploadNew: () => void;
  loading?: boolean;
  showActions?: boolean;
  className?: string;
}

/**
 * GroUp Academy: Persistent Artifact Lifecycle Node (V5.6.0)
 * CTO Reference: Authoritative interface management for registry-resident CV files.
 * Architecture: Optimized via memoized temporal format barriers eliminating inline object thrashing.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */
export function ExistingCVCard({
  talent,
  onUseExisting,
  onUploadNew,
  loading = false,
  showActions = true,
  className,
}: ExistingCVCardProps) {
  // Guard the visual component tree layout entirely against missing context metrics
  if (!talent?.cvUrl) return null;

  // --- PHASE: SAFE_TEMPORAL_BARRIER_COMPILATION ---
  // Architecture Fix: Prevent redundant date instance allocations inside main paint sweeps
  const sanitizedRegistryDateString = useMemo((): string | null => {
    const rawParsedAtTimestamp = talent?.cvParsedAt;
    if (!rawParsedAtTimestamp) return null;

    const parsedDateInstance = new Date(rawParsedAtTimestamp);

    // Defensive checking avoids document layout crashes if backend records send unexpected string data
    if (!isValid(parsedDateInstance)) return null;

    try {
      return String(format(parsedDateInstance, "dd_MMM_yyyy")).toUpperCase();
    } catch (err) {
      console.error("[Digital Workforce] FAULT: Failed to compile artifact registry date text.", err);
      return null;
    }
  }, [talent?.cvParsedAt]);

  // --- PHASE: IDENTITIES_FIELD_SANITIZATION ---
  const calculatedDocumentFilename = useMemo((): string => {
    const fallbackSanitizedName = String(talent?.fullName || "TALENT_ARTIFACT")
      .trim()
      .replace(/\s+/g, "_");
    return `${fallbackSanitizedName}_CV.pdf`;
  }, [talent?.fullName]);

  // Handle file download requests safely without risking non-null runtime pointer crashes
  const handleSecureDownloadHandshake = () => {
    if (talent?.cvUrl) {
      void downloadFile(talent.cvUrl, calculatedDocumentFilename);
    }
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-[32px] border-2 border-primary/20 bg-card/40 backdrop-blur-xl transition-all duration-500 hover:border-primary/40 hover:shadow-2xl text-left select-none",
        className,
      )}
    >
      {/* ATMOSPHERIC_NODE: Subtle visual sync pulse */}
      <div className="absolute -right-8 -top-8 h-32 w-32 bg-primary/10 blur-[60px] rounded-full pointer-events-none animate-pulse" />

      <CardContent className="p-6">
        <div className="flex items-start gap-5">
          {/* HUD: ARTIFACT_ICON_STATUS_CELL */}
          <div className="relative shrink-0">
            <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/10 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
              <FileText className="h-6 w-6 text-primary shrink-0" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-background shadow-lg shrink-0">
              <ShieldCheck className="h-3 w-3 text-white fill-current" />
            </div>
          </div>

          {/* HUD: DESCRIPTIVE_TELEMETRY_COLUMN */}
          <div className="flex-1 min-w-0 py-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black uppercase italic tracking-tighter text-foreground leading-none">
                EXISTING CV FOUND
              </h3>
              <Zap className="h-3 w-3 text-primary fill-current shrink-0 animate-pulse" />
            </div>

            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic pt-1 font-mono leading-none">
              {sanitizedRegistryDateString
                ? `UPLOADED: ${sanitizedRegistryDateString}`
                : "CV READY"}
            </p>

            {/* ACTION SECTOR: INTERACTION TRIGGERS GRID */}
            {showActions && (
              <div className="flex flex-wrap items-center gap-3 mt-5">
                <Button
                  size="sm"
                  type="button"
                  disabled={loading}
                  onClick={onUseExisting}
                  className="h-10 rounded-xl px-5 font-black uppercase italic text-[10px] tracking-widest shadow-lg shadow-primary/10 active:scale-[0.98] transition-all gap-2 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5 font-mono">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      PROCESSING...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      USE THIS CV <ArrowRight className="h-3.5 w-3.5 stroke-[3]" />
                    </span>
                  )}
                </Button>

                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={onUploadNew}
                  className="h-10 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest hover:bg-muted/10 transition-all gap-2 disabled:cursor-not-allowed"
                >
                  <Upload className="h-3.5 w-3.5 shrink-0" />
                  UPLOAD NEW CV
                </Button>

                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  disabled={loading}
                  aria-label="Download CV"
                  className="h-10 w-10 rounded-xl hover:bg-primary/5 hover:text-primary transition-all p-0 flex items-center justify-center shrink-0"
                  onClick={handleSecureDownloadHandshake}
                >
                  <Download className="h-4 w-4 shrink-0" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
