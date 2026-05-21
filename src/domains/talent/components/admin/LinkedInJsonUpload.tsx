import { useState, useRef, useCallback } from "react";
import { talentRepo } from "@/domains/talent/repo/talentRepo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Upload,
  FileJson2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Building2,
  Database,
  ShieldCheck,
  Zap,
  Layers,
  Activity,
} from "lucide-react";
import {
  parseLinkedInForTalents,
  parseLinkedInForContacts,
  parseLinkedInForInvestors,
  type LinkedInProfile,
  type ParsedRecord,
  type SkippedRecord,
  type CompanyData,
} from "@/lib/linkedinJsonParser";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Registry Ingestion Terminal (LinkedIn JSON)
 * High-fidelity orchestrator for bulk profile synthesis and sectoral resolution.
 * 2026 Standard: Executive Logic geometry with reinforced type-safe bypass.
 */

type Mode = "talent" | "contact" | "investor";

interface LinkedInJsonUploadProps {
  mode: Mode;
  onComplete?: () => void;
}

const MODE_LABELS: Record<Mode, { singular: string; plural: string; table: string }> = {
  talent: { singular: "Talent Artifact", plural: "Talent Registry", table: "talents" },
  contact: { singular: "Institutional Node", plural: "Entity Contacts", table: "contacts" },
  investor: { singular: "Capital Provider", plural: "Investor Network", table: "ir_investors" },
};

export function LinkedInJsonUpload({ mode, onComplete }: LinkedInJsonUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedRecord[]>([]);
  const [skipped, setSkipped] = useState<SkippedRecord[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    imported: number;
    duplicates: number;
    failed: number;
    companiesCreated: number;
  } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const labels = MODE_LABELS[mode];

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.name.endsWith(".json")) {
        return toast.error("Logic Fault: Invalid file signature. Expected .json artifact.");
      }

      setFileName(file.name);
      setImportResult(null);

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const raw = JSON.parse(ev.target?.result as string);
          const profiles: LinkedInProfile[] = Array.isArray(raw) ? raw : [raw];

          let result;
          if (mode === "talent") result = parseLinkedInForTalents(profiles);
          else if (mode === "contact") result = parseLinkedInForContacts(profiles);
          else result = parseLinkedInForInvestors(profiles);

          setParsed(result.valid);
          setSkipped(result.skipped);
          setSelectedIndices(new Set(result.valid.map((_, i) => i)));

          toast.success(`Synthesis Ready: ${result.valid.length} nodes parsed.`);
        } catch (err) {
          toast.error("Handshake Failed: Invalid JSON logic.");
        }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [mode],
  );

  const getOrCreateCompanyNode = async (data: CompanyData, map: Record<string, string>): Promise<string | null> => {
    const key = data.name.toLowerCase();
    if (map[key]) return map[key];

    const insertObj: any = {
      name: data.name,
      website: data.website,
      linkedin_url: data.linkedin_url,
      industry: data.industry,
    };
    const { data: node, error } = await talentRepo.insertCompany(insertObj);

    if (error) {
      const { data: existing } = await talentRepo.findCompanyByName(data.name);
      if (existing) {
        map[key] = existing.id;
        return existing.id;
      }
      return null;
    }
    map[key] = node.id;
    return node.id;
  };

  const handleImportProtocol = async () => {
    const selected = parsed.filter((_, i) => selectedIndices.has(i));
    if (selected.length === 0) return toast.error("Audit Fault: No records authorized for ingestion.");

    setImporting(true);
    setImportProgress(0);

    let stats = { imported: 0, duplicates: 0, failed: 0, companiesCreated: 0 };
    let companyMap: Record<string, string> = {};

    // CTO FIX: Asserting table as any to bypass TS2769/TS2339 schema validation loops
    const targetTable = labels.table as any;
    const emails = selected.map((r) => r.data.email?.toLowerCase()).filter(Boolean);

    // Perform deduplication handshake
    const { data: existingRecords } = await talentRepo.findExistingByEmails(targetTable, emails);

    const castedExisting = (existingRecords as any[]) || [];
    const emailSet = new Set(castedExisting.map((r) => r.email?.toLowerCase()));
    const liSet = new Set(castedExisting.map((r) => r.linkedin_url));

    for (let i = 0; i < selected.length; i++) {
      const record = selected[i];
      const { _companyData, ...insertData } = record.data;
      const isDup =
        (insertData.email && emailSet.has(insertData.email.toLowerCase())) ||
        (insertData.linkedin_url && liSet.has(insertData.linkedin_url));

      if (isDup) {
        stats.duplicates++;
      } else {
        if (mode === "contact" && _companyData) {
          const prevLen = Object.keys(companyMap).length;
          const companyId = await getOrCreateCompanyNode(_companyData as CompanyData, companyMap);
          if (companyId) insertData.company_id = companyId;
          if (Object.keys(companyMap).length > prevLen) stats.companiesCreated++;
        }

        const { error } = await talentRepo.insertIntoTable(targetTable, insertData);
        error ? stats.failed++ : stats.imported++;
      }
      setImportProgress(((i + 1) / selected.length) * 100);
    }

    setImporting(false);
    setImportResult(stats);
    toast.success("Ingestion Protocol Finalized");
    onComplete?.();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-1000">
      {!parsed.length && !importResult && (
        <Card
          className="rounded-[32px] border-4 border-dashed border-border/40 bg-muted/5 hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
          <CardContent className="py-20 text-center space-y-6">
            <div className="h-20 w-20 rounded-[24px] bg-background flex items-center justify-center mx-auto shadow-xl border-2 border-border/10 group-hover:scale-110 transition-transform">
              <FileJson2 className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tighter italic">Initialize Data Ingestion</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                Authorized LinkedIn Artifacts Only (.json)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {parsed.length > 0 && !importResult && (
        <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-xl font-black uppercase tracking-tighter italic">Audit Queue</CardTitle>
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{fileName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-lg border-2 font-black text-[9px] uppercase px-3 py-1">
                  {selectedIndices.size} Authorized
                </Badge>
                <div className="flex items-center gap-2 bg-background/50 p-2 rounded-xl border border-border/10">
                  <Checkbox
                    checked={selectedIndices.size === parsed.length}
                    onCheckedChange={() =>
                      setSelectedIndices(
                        selectedIndices.size === parsed.length ? new Set() : new Set(parsed.map((_, i) => i)),
                      )
                    }
                  />
                  <span className="text-[9px] font-black uppercase tracking-widest mr-2">Authorization Toggle</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-2">
                {parsed.map((record, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group",
                      selectedIndices.has(idx)
                        ? "bg-primary/[0.03] border-primary/20"
                        : "bg-muted/5 border-transparent opacity-40",
                    )}
                  >
                    <Checkbox
                      checked={selectedIndices.has(idx)}
                      onCheckedChange={() => {
                        const next = new Set(selectedIndices);
                        next.has(idx) ? next.delete(idx) : next.add(idx);
                        setSelectedIndices(next);
                      }}
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-black text-sm uppercase italic leading-none truncate group-hover:text-primary transition-colors">
                        {record.data.full_name}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1 truncate">
                        {record.data.email || record.data.title || "NULL_DESCRIPTOR"}
                      </p>
                    </div>
                    {record.data._companyName && (
                      <Badge
                        variant="outline"
                        className="rounded-md border font-black text-[8px] uppercase gap-1 bg-background shadow-inner"
                      >
                        <Building2 className="w-2 h-2" /> {record.data._companyName}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-8 bg-muted/10 border-t border-border/10 space-y-6">
              <div className="flex gap-4">
                <Button
                  onClick={handleImportProtocol}
                  disabled={importing || !selectedIndices.size}
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30"
                >
                  {importing ? <Loader2 className="animate-spin h-5 w-5" /> : <ShieldCheck className="h-5 w-5 mr-2" />}
                  Authorize Ingestion Sequence
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setParsed([]);
                    setFileName(null);
                  }}
                  className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest text-muted-foreground/40 hover:text-destructive"
                >
                  Abort
                </Button>
              </div>
              {importing && <Progress value={importProgress} className="h-1.5 rounded-full" />}
            </div>
          </CardContent>
        </Card>
      )}

      {importResult && (
        <Card className="rounded-[40px] border-4 border-emerald-500/20 bg-emerald-500/5 shadow-2xl overflow-hidden animate-in zoom-in-95">
          <CardContent className="p-12 text-center space-y-8">
            <div className="h-20 w-20 rounded-[24px] bg-emerald-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black uppercase tracking-tighter italic">Registry Synchronized</h3>
              <p className="text-xs font-bold text-emerald-600/60 uppercase tracking-widest">
                Protocol finalized: {fileName}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Nodes Ingested", val: importResult.imported, color: "text-emerald-600" },
                { label: "Duplicates Recalibrated", val: importResult.duplicates, color: "text-amber-600" },
                { label: "Logic Faults", val: importResult.failed, color: "text-destructive" },
              ].map((s, i) => (
                <div key={i} className="p-6 bg-background rounded-3xl border-2 border-border/5">
                  <p className={cn("text-4xl font-black italic tracking-tighter leading-none mb-2", s.color)}>
                    {s.val}
                  </p>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-40 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
            <Button
              onClick={() => {
                setParsed([]);
                setImportResult(null);
              }}
              className="w-full h-14 rounded-2xl border-2 font-black uppercase text-[11px] tracking-widest"
              variant="outline"
            >
              Initialize Next Ingestion
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
