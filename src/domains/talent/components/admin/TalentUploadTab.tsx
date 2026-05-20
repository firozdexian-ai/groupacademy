/**
 * Talent Upload — Unified Ingestion Engine
 * CTO Version: May 2026
 * Fixes:
 * - N1: Added missing Badge import to prevent runtime crash
 * - N2: Corrected navigation path to 'gigs-submissions'
 * - B5/B6: Consolidated ingestion logic and moved misplaced gig tabs
 */
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // N1 Hotfix: Resolves ReferenceError
import { Upload as UploadIcon, ExternalLink, Briefcase } from "lucide-react";
import { BatchTalentUpload } from "@/components/dashboard/talent/BatchTalentUpload";

export function TalentUploadTab() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* P2 Fix: Simplified Action Row aligned with Dashboard Shell [cite: 28] */}
      <div className="flex justify-between items-center bg-muted/10 p-6 rounded-[32px] border-2 border-border/40">
        <div className="text-left">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            <UploadIcon className="h-6 w-6 text-primary" /> Talent Ingestion
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            Phase Z0 Bulk CV Parsing Engine
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Main Ingestion Engine - Standardized for Phase Z0 [cite: 948, 1001] */}
        <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <CardContent className="p-8">
            <div className="mb-6">
              <h3 className="text-lg font-black uppercase italic tracking-tight">Bulk Upload Terminal</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Upload one or more CVs. The AI Workforce will automatically parse skills, experience, and contact data
                into the Talent Pool[cite: 323, 472].
              </p>
            </div>

            {/* BatchTalentUpload natively handles Single/Batch modes [cite: 341] */}
            <BatchTalentUpload />
          </CardContent>
        </Card>

        {/* Sidebar: Operational Context & Navigation [cite: 679, 730] */}
        <div className="space-y-6">
          <Card className="rounded-[32px] border-2 border-primary/20 bg-primary/5 p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-widest">Review Gig Submissions</h4>
              <p className="text-[10px] text-muted-foreground leading-normal">
                CV-upload gigs submitted by talents are managed in the canonical Gig Economy terminal.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full rounded-xl h-10 text-[10px] font-black uppercase tracking-widest border-2"
              // N2 Hotfix: Corrected tab key to include hyphen
              onClick={() => navigate("/dashboard?tab=gigs-submissions")}
            >
              Open Gig Terminal <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </Card>

          <Card className="rounded-[32px] border-2 border-border/40 bg-muted/5 p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic mb-3">
              Ingestion Telemetry
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold">Parsing Engine</span>
                {/* Badge component now correctly imported */}
                <Badge
                  variant="outline"
                  className="text-[8px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                >
                  v2.5 Flash
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold">Auto-Dedupe</span>
                <span className="text-[10px] text-primary font-black uppercase tracking-tighter">Active</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
