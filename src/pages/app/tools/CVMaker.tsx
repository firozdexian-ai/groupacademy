import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Loader2, Download, Sparkles, Coins, Eye, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { recordToolRun } from "@/hooks/useToolRuns";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TemplateId = "minimal" | "standard" | "modern";

const TEMPLATES: { id: TemplateId; name: string; description: string }[] = [
  { id: "minimal", name: "Minimal ATS", description: "Plain headings, no rules. Maximum scanner safety." },
  { id: "standard", name: "Standard ATS", description: "Bold headings with thin underline. Classic recruiter look." },
  { id: "modern", name: "Modern ATS", description: "Left-aligned name block with subtle accent bar." },
];

/**
 * ATS-Friendly CV Maker — generates a clean text-extractable CV PDF
 * using the talent's profile data. Credits are only deducted on download
 * after the user previews the generated PDF and selects a template.
 */
export default function CVMaker() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { canAfford, deductCredits } = useCredits();
  const [building, setBuilding] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [template, setTemplate] = useState<TemplateId>("standard");

  const cost = CREDIT_CONFIG.SERVICES.CV_GENERATION.cost;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Auto-rebuild preview whenever the user switches template (after first build)
  useEffect(() => {
    if (previewUrl) {
      buildPdf(template);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  async function buildPdf(tpl: TemplateId = template) {
    if (!talent) {
      toast.error("Profile not loaded.");
      return;
    }
    setBuilding(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 48;
      let y = margin;

      const newPageIfNeeded = (needed = 0) => {
        if (y + needed > 800) { doc.addPage(); y = margin; }
      };

      const writeLine = (text: string, opts: { bold?: boolean; size?: number; color?: number } = {}) => {
        doc.setFont("helvetica", opts.bold ? "bold" : "normal");
        doc.setFontSize(opts.size ?? 10);
        doc.setTextColor(opts.color ?? 60);
        const lines = doc.splitTextToSize(text, pageW - margin * 2);
        lines.forEach((l: string) => {
          newPageIfNeeded(opts.size ?? 10);
          doc.text(l, margin, y);
          y += (opts.size ?? 10) + 3;
        });
      };

      const writeHeading = (text: string) => {
        newPageIfNeeded(24);
        if (tpl === "minimal") {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(40);
          doc.text(text.toUpperCase(), margin, y);
          y += 14;
        } else if (tpl === "standard") {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(40);
          doc.text(text.toUpperCase(), margin, y);
          y += 6;
          doc.setDrawColor(180);
          doc.line(margin, y, pageW - margin, y);
          y += 14;
        } else {
          // modern: small accent bar to the left
          doc.setFillColor(42, 125, 222); // Tech Blue
          doc.rect(margin, y - 9, 3, 12, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(20);
          doc.text(text, margin + 10, y);
          y += 16;
        }
      };

      // Header
      if (tpl === "modern") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(20);
        doc.text(talent.fullName || "Your Name", margin, y);
        y += 22;
        doc.setDrawColor(42, 125, 222);
        doc.setLineWidth(1.2);
        doc.line(margin, y, margin + 40, y);
        doc.setLineWidth(0.5);
        y += 12;
      } else {
        writeLine(talent.fullName || "Your Name", { bold: true, size: tpl === "minimal" ? 16 : 18, color: 20 });
      }
      const contact = [talent.email, talent.phone, talent.country].filter(Boolean).join(" · ");
      writeLine(contact, { size: 10, color: 100 });
      if (talent.linkedinUrl) writeLine(talent.linkedinUrl, { size: 10, color: 100 });
      y += 8;

      if (talent.customProfession) {
        writeHeading("Profile");
        writeLine(talent.customProfession);
        y += 8;
      }

      if (talent.experience?.length) {
        writeHeading("Experience");
        talent.experience.forEach((exp: any) => {
          writeLine(`${exp.title || ""}${exp.company ? " — " + exp.company : ""}`, { bold: true });
          const period = [exp.startDate, exp.endDate || (exp.current ? "Present" : "")].filter(Boolean).join(" – ");
          if (period) writeLine(period, { size: 9, color: 110 });
          if (exp.description) writeLine(exp.description);
          y += 6;
        });
      }

      if (talent.education?.length) {
        writeHeading("Education");
        talent.education.forEach((ed: any) => {
          writeLine(`${ed.degree || ""}${ed.field ? ", " + ed.field : ""}`, { bold: true });
          if (ed.institution) writeLine(ed.institution);
          if (ed.startDate || ed.endDate) writeLine([ed.startDate, ed.endDate].filter(Boolean).join(" – "), { size: 9, color: 110 });
          y += 6;
        });
      }

      if (talent.skills?.length) {
        writeHeading("Skills");
        const skillNames = talent.skills.map((s: any) => s.name || s).filter(Boolean).join(" · ");
        writeLine(skillNames);
      }

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);

      setPdfDoc(doc);
      setPreviewUrl(url);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't build preview. Try again.");
    } finally {
      setBuilding(false);
    }
  }

  async function handleDownload() {
    if (!pdfDoc || !talent) return;
    if (!canAfford("CV_GENERATION")) return toast.error(`Need ${cost} credits.`);
    setDownloading(true);
    try {
      await deductCredits("CV_GENERATION", undefined, `ATS CV (${template}) generated`);
      pdfDoc.save(`${(talent.fullName || "cv").replace(/\s+/g, "_")}_${template}_CV.pdf`);
      recordToolRun({ toolKey: "cv", costCredits: cost, payload: { template } });
      toast.success("CV downloaded.");
    } catch (e) {
      console.error(e);
      toast.error("Download failed. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  const templateGrid = useMemo(() => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {TEMPLATES.map((t) => {
        const active = template === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTemplate(t.id)}
            className={cn(
              "relative text-left rounded-xl border p-3 transition-colors",
              active
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border/40 hover:border-border bg-background"
            )}
          >
            {active && (
              <span className="absolute top-2 right-2 inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
            )}
            <div className="text-sm font-semibold mb-0.5">{t.name}</div>
            <div className="text-[11px] text-muted-foreground leading-snug">{t.description}</div>
          </button>
        );
      })}
    </div>
  ), [template]);

  return (
    <div className="max-w-2xl mx-auto px-3 py-3 pb-28 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">ATS-friendly CV</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Choose a template, preview the result, and only spend credits when you download.
        </p>
      </header>

      <Card className="rounded-2xl border border-border/40">
        <CardContent className="p-3 space-y-3">
          <div className="text-xs font-medium text-muted-foreground px-1">Template</div>
          {templateGrid}
        </CardContent>
      </Card>

      {!previewUrl && (
        <Card className="rounded-2xl border border-border/40">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm">
              We'll build a single-column ATS-safe CV from your profile data — no images, no fancy fonts, no columns.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
              <li>Uses your name, contact, summary, experience, education and skills</li>
              <li>Switch templates anytime — preview rebuilds automatically</li>
              <li>Credits are only spent when you download</li>
            </ul>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Coins className="h-3 w-3 text-amber-500" /> {cost} credits on download
              </Badge>
              <Button onClick={() => buildPdf()} disabled={building} size="sm" className="h-9 rounded-lg">
                {building ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {building ? "Building..." : "Build preview"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {previewUrl && (
        <Card className="rounded-2xl border border-border/40 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Eye className="h-3.5 w-3.5 text-primary" />
                Preview · <span className="text-muted-foreground">{TEMPLATES.find(t => t.id === template)?.name}</span>
              </div>
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Coins className="h-3 w-3 text-amber-500" /> {cost} credits
              </Badge>
            </div>
            <div className="relative">
              <iframe
                src={previewUrl}
                title="CV preview"
                className="w-full h-[70vh] bg-white"
              />
              {building && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 p-3 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => buildPdf()}
                disabled={building || downloading}
                className="h-9 rounded-lg flex-1"
              >
                {building ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Rebuild
              </Button>
              <Button
                onClick={handleDownload}
                disabled={downloading || building}
                size="sm"
                className="h-9 rounded-lg flex-1"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                {downloading ? "Saving..." : `Download (${cost} cr)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border border-dashed border-border/40 bg-muted/10">
        <CardContent className="p-4 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Make sure your profile is up to date for the best result. Update it from{" "}
            <button onClick={() => navigate("/app/profile/edit")} className="text-primary font-medium underline">
              Profile · Edit
            </button>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
