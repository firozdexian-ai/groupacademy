import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Building2,
  Users,
  Loader2,
  X,
  Download,
  ShieldCheck,
  Database,
  Zap,
} from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Registry Ingestion Node (Batch Import)
 * High-fidelity orchestrator for bulk data synchronization and entity mapping.
 * 2026 Standard: Executive Logic geometry with reinforced deduplication telemetry.
 */

interface ParsedRow {
  companyName: string;
  industry: string;
  email: string;
  contactName: string;
  contactPhone: string;
  address: string;
  originalRow: number;
}

interface ImportStats {
  total: number;
  companiesCreated: number;
  companiesUpdated: number;
  contactsCreated: number;
  contactsMerged: number;
  skipped: number;
  errors: string[];
}

interface BatchCompanyUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function BatchCompanyUpload({ open, onOpenChange, onComplete }: BatchCompanyUploadProps) {
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      const rows: ParsedRow[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || !row[0]) continue;

        rows.push({
          companyName: String(row[0] || "").trim(),
          industry: String(row[1] || "").trim(),
          email: String(row[2] || "").trim(),
          contactName: String(row[3] || "").trim(),
          contactPhone: String(row[4] || "").trim(),
          address: String(row[5] || "").trim(),
          originalRow: i + 1,
        });
      }

      setParsedData(rows);
      toast.success(`Payload Validated: ${rows.length} records parsed.`);
    } catch (error) {
      toast.error("Transmission Error: File corruption detected.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const normalizeCompanyName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/\b(ltd|limited|pvt|private|inc|incorporated|llc|co|company)\b\.?/gi, "")
      .trim();
  };

  const handleImportSequence = async () => {
    if (parsedData.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    const stats: ImportStats = {
      total: parsedData.length,
      companiesCreated: 0,
      companiesUpdated: 0,
      contactsCreated: 0,
      contactsMerged: 0,
      skipped: 0,
      errors: [],
    };

    const companyCache = new Map<string, string>();
    const { data: existingCompanies } = await supabase.from("companies").select("id, name");
    existingCompanies?.forEach((c) => companyCache.set(normalizeCompanyName(c.name), c.id));

    const { data: existingContacts } = await supabase.from("contacts").select("id, email, phone");
    const contactEmailSet = new Set(existingContacts?.filter((c) => c.email).map((c) => c.email!.toLowerCase()) || []);
    const contactPhoneSet = new Set(
      existingContacts?.filter((c) => c.phone).map((c) => c.phone!.replace(/\D/g, "")) || [],
    );

    const batchSize = 50;
    for (let i = 0; i < parsedData.length; i += batchSize) {
      const batch = parsedData.slice(i, i + batchSize);

      for (const row of batch) {
        try {
          if (!row.companyName) {
            stats.skipped++;
            continue;
          }

          const normalizedName = normalizeCompanyName(row.companyName);
          let companyId = companyCache.get(normalizedName);

          if (!companyId) {
            const { data: newCompany, error: companyError } = await supabase
              .from("companies")
              .insert({
                name: row.companyName,
                industry: row.industry || null,
                primary_email: row.email || null,
                address: row.address || null,
              })
              .select("id")
              .single();

            if (companyError) {
              stats.errors.push(`Row ${row.originalRow}: ${companyError.message}`);
              continue;
            }

            companyId = newCompany.id;
            companyCache.set(normalizedName, companyId);
            stats.companiesCreated++;
          } else {
            stats.companiesUpdated++;
          }

          const emailExists = row.email && contactEmailSet.has(row.email.toLowerCase());
          const phoneExists = row.contactPhone && contactPhoneSet.has(row.contactPhone.replace(/\D/g, ""));

          if (row.contactName && !emailExists && !phoneExists) {
            const { error: contactError } = await supabase.from("contacts").insert({
              company_id: companyId,
              full_name: row.contactName,
              email: row.email || null,
              phone: row.contactPhone || null,
              whatsapp_number: row.contactPhone || null,
              source: "batch_import",
            });

            if (contactError) {
              stats.errors.push(`Row ${row.originalRow} contact: ${contactError.message}`);
            } else {
              stats.contactsCreated++;
              if (row.email) contactEmailSet.add(row.email.toLowerCase());
              if (row.contactPhone) contactPhoneSet.add(row.contactPhone.replace(/\D/g, ""));
            }
          } else if (emailExists || phoneExists) {
            stats.contactsMerged++;
          }
        } catch (error: any) {
          stats.errors.push(`Row ${row.originalRow}: ${error.message}`);
        }
      }
      setImportProgress(Math.round(((i + batch.length) / parsedData.length) * 100));
    }

    setImportStats(stats);
    setIsImporting(false);
    toast.success("Registry Sync Complete");
  };

  const handleClose = () => {
    if (importStats) onComplete();
    setParsedData([]);
    setImportStats(null);
    setImportProgress(0);
    onOpenChange(false);
  };

  const downloadRegistryTemplate = () => {
    const template = [
      ["Company Name", "Industry", "Email", "Contact Name", "Contact Phone", "Address"],
      ["Example Corp", "Tech", "sync@example.com", "Admin Node", "+8801700000000", "Dhaka Data Center"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ingestion_Template");
    XLSX.writeFile(wb, "registry_import_template.xlsx");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />

        <div className="p-10 flex flex-col h-full overflow-hidden">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                  Registry Ingestion
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                  Authorized Bulk Synchronization Node v2.6
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-10 pb-10">
              {/* State 1: Awaiting Payload */}
              {!parsedData.length && !importStats && (
                <div className="space-y-8 animate-in fade-in zoom-in-95">
                  <div className="group relative border-4 border-dashed rounded-[32px] p-16 text-center transition-all hover:border-primary/40 hover:bg-primary/5">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={isUploading}
                    />
                    <div className="space-y-6">
                      <div className="h-20 w-20 rounded-[24px] bg-muted/50 flex items-center justify-center mx-auto border-2 border-border/40 group-hover:rotate-6 transition-transform">
                        {isUploading ? (
                          <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        ) : (
                          <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-xl font-black uppercase tracking-tight italic">
                          {isUploading ? "Validating Logic..." : "Select Payload"}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
                          Supports .XLSX / .XLS Logic Paths
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Button
                      variant="outline"
                      onClick={downloadRegistryTemplate}
                      className="h-16 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-3"
                    >
                      <Download className="h-5 w-5" /> Download Logic Template
                    </Button>
                    <Card className="rounded-2xl border-2 bg-muted/5">
                      <CardContent className="p-4 flex items-center gap-4">
                        <ShieldCheck className="h-8 w-8 text-primary/40" />
                        <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed tracking-widest italic">
                          Auto-deduplication logic active. Duplicate email/phone markers will be merged with existing
                          nodes.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* State 2: Preview & Synthesis */}
              {parsedData.length > 0 && !importStats && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between bg-muted/20 p-6 rounded-[28px] border-2 border-border/10">
                    <div className="flex items-center gap-4">
                      <Badge className="bg-primary text-white text-lg font-black italic tracking-tighter px-6 py-2 rounded-xl">
                        {parsedData.length} ARTIFACTS
                      </Badge>
                      <Button
                        variant="ghost"
                        onClick={() => setParsedData([])}
                        className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-destructive"
                      >
                        Purge Buffer
                      </Button>
                    </div>
                    <Button
                      onClick={handleImportSequence}
                      disabled={isImporting}
                      className="h-14 px-10 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30"
                    >
                      {isImporting ? (
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      ) : (
                        <Zap className="mr-3 h-5 w-5 fill-current" />
                      )}
                      Authorize Ingestion
                    </Button>
                  </div>

                  {isImporting && (
                    <div className="space-y-4 p-8 rounded-[32px] border-2 bg-primary/5 border-primary/20">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic text-primary">
                        <span>Registry Mapping...</span>
                        <span>{importProgress}%</span>
                      </div>
                      <Progress value={importProgress} className="h-3 rounded-full bg-primary/10" />
                    </div>
                  )}

                  <div className="rounded-2xl border-2 border-border/20 overflow-hidden bg-background">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="text-[9px] font-black uppercase tracking-widest px-6">Row</TableHead>
                          <TableHead className="text-[9px] font-black uppercase tracking-widest">
                            Company Node
                          </TableHead>
                          <TableHead className="text-[9px] font-black uppercase tracking-widest">
                            Contact Entity
                          </TableHead>
                          <TableHead className="text-[9px] font-black uppercase tracking-widest">Industry</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.slice(0, 50).map((row, idx) => (
                          <TableRow key={idx} className="group hover:bg-muted/30 transition-colors">
                            <TableCell className="px-6 text-[10px] font-mono opacity-40 italic">
                              {row.originalRow}
                            </TableCell>
                            <TableCell className="font-black uppercase tracking-tight text-xs italic">
                              {row.companyName}
                            </TableCell>
                            <TableCell className="text-[11px] font-medium text-muted-foreground">
                              {row.contactName || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="text-[8px] font-black uppercase tracking-widest border-2"
                              >
                                {row.industry || "N/A"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* State 3: Final Telemetry */}
              {importStats && (
                <div className="space-y-8 animate-in zoom-in-95">
                  <div className="text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border-4 border-emerald-500/20 rotate-6 shadow-2xl">
                      <CheckCircle className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic">Ingestion Complete</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <Card className="rounded-[32px] border-2 border-emerald-500/20 bg-emerald-500/5 p-8 shadow-xl group">
                      <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-emerald-500/40 shadow-2xl transition-transform group-hover:rotate-6">
                          <Building2 className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <p className="text-4xl font-black italic tracking-tighter leading-none">
                            {importStats.companiesCreated}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">
                            Company Nodes Created
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="rounded-[32px] border-2 border-blue-500/20 bg-blue-500/5 p-8 shadow-xl group">
                      <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-2xl bg-blue-500 flex items-center justify-center shadow-blue-500/40 shadow-2xl transition-transform group-hover:rotate-6">
                          <Users className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <p className="text-4xl font-black italic tracking-tighter leading-none">
                            {importStats.contactsCreated}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">
                            Contact Entities Generated
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card className="rounded-[32px] border-2 bg-muted/10">
                    <CardContent className="p-10">
                      <div className="grid grid-cols-4 gap-4 text-center">
                        {[
                          { val: importStats.total, label: "Payload Rows" },
                          { val: importStats.companiesUpdated, label: "Updated Nodes" },
                          { val: importStats.contactsMerged, label: "Deduplicated" },
                          { val: importStats.skipped, label: "Invalid/Skipped" },
                        ].map((stat, i) => (
                          <div key={i} className="space-y-1">
                            <p className="text-2xl font-black italic tracking-tighter">{stat.val}</p>
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-40">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {importStats.errors.length > 0 && (
                    <Card className="rounded-[32px] border-2 border-destructive/20 bg-destructive/5 overflow-hidden">
                      <div className="p-4 bg-destructive/10 border-b border-destructive/10 flex items-center gap-3">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-destructive">
                          Logic Exceptions ({importStats.errors.length})
                        </span>
                      </div>
                      <CardContent className="p-6">
                        <ScrollArea className="h-[120px]">
                          <ul className="space-y-2">
                            {importStats.errors.map((error, idx) => (
                              <li key={idx} className="text-[11px] font-mono text-destructive/80 leading-relaxed">
                                [FAULT_ID: {idx.toString().padStart(3, "0")}] {error}
                              </li>
                            ))}
                          </ul>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end pt-8 border-t border-border/10">
            <Button
              onClick={handleClose}
              className="rounded-xl h-12 px-12 font-black uppercase text-[10px] tracking-widest shadow-xl"
            >
              {importStats ? "Terminate Session" : "Close Ingestion Node"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
