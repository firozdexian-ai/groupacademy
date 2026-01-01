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
  Upload, FileSpreadsheet, CheckCircle, AlertCircle, 
  Building2, Users, Loader2, X, Download
} from "lucide-react";
import * as XLSX from "xlsx";

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

      // Skip header row and parse data
      const rows: ParsedRow[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || !row[0]) continue; // Skip empty rows

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
      toast.success(`Parsed ${rows.length} records from file`);
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Failed to parse file. Please check the format.");
    } finally {
      setIsUploading(false);
      // Reset file input
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

  const handleImport = async () => {
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

    // Cache for existing companies
    const companyCache = new Map<string, string>(); // normalized name -> id

    // Load existing companies
    const { data: existingCompanies } = await supabase
      .from("companies")
      .select("id, name");

    existingCompanies?.forEach((c) => {
      companyCache.set(normalizeCompanyName(c.name), c.id);
    });

    // Load existing contacts for deduplication
    const { data: existingContacts } = await supabase
      .from("contacts")
      .select("id, email, phone, company_id");

    const contactEmailSet = new Set(
      existingContacts?.filter((c) => c.email).map((c) => c.email!.toLowerCase()) || []
    );
    const contactPhoneSet = new Set(
      existingContacts?.filter((c) => c.phone).map((c) => c.phone!.replace(/\D/g, "")) || []
    );

    // Process in batches
    const batchSize = 50;
    for (let i = 0; i < parsedData.length; i += batchSize) {
      const batch = parsedData.slice(i, i + batchSize);

      for (const row of batch) {
        try {
          // Skip if no company name
          if (!row.companyName) {
            stats.skipped++;
            continue;
          }

          const normalizedName = normalizeCompanyName(row.companyName);
          let companyId = companyCache.get(normalizedName);

          // Create or get company
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

          // Check if contact already exists
          const emailExists = row.email && contactEmailSet.has(row.email.toLowerCase());
          const phoneExists = row.contactPhone && contactPhoneSet.has(row.contactPhone.replace(/\D/g, ""));

          if (row.contactName && !emailExists && !phoneExists) {
            // Create new contact
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

      // Update progress
      setImportProgress(Math.round(((i + batch.length) / parsedData.length) * 100));
    }

    setImportStats(stats);
    setIsImporting(false);
    toast.success(`Import completed: ${stats.companiesCreated} companies, ${stats.contactsCreated} contacts`);
  };

  const handleClose = () => {
    if (importStats) {
      onComplete();
    }
    setParsedData([]);
    setImportStats(null);
    setImportProgress(0);
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = [
      ["Company Name", "Industry", "Email", "Contact Name", "Contact Phone", "Address"],
      ["Example Company Ltd", "Technology", "hr@example.com", "John Doe", "+8801712345678", "123 Main St, Dhaka"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "company_import_template.xlsx");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Batch Import Companies & Contacts
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file to import companies and their contacts with automatic deduplication
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Upload Section */}
          {!parsedData.length && !importStats && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="font-medium">Upload Excel File</p>
                  <p className="text-sm text-muted-foreground">
                    Supports .xlsx and .xls files
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={isUploading}
                  />
                  <Button asChild disabled={isUploading}>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Parsing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Select File
                        </>
                      )}
                    </label>
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 border-t" />
                <span className="text-sm text-muted-foreground">or</span>
                <div className="flex-1 border-t" />
              </div>

              <div className="text-center">
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Expected Columns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><Badge variant="secondary">A</Badge> Company Name (required)</div>
                    <div><Badge variant="secondary">B</Badge> Industry</div>
                    <div><Badge variant="secondary">C</Badge> Email</div>
                    <div><Badge variant="secondary">D</Badge> Contact Name</div>
                    <div><Badge variant="secondary">E</Badge> Contact Phone</div>
                    <div><Badge variant="secondary">F</Badge> Address</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Preview Section */}
          {parsedData.length > 0 && !importStats && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {parsedData.length} records
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => setParsedData([])}>
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
                <Button onClick={handleImport} disabled={isImporting}>
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Start Import
                    </>
                  )}
                </Button>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <Progress value={importProgress} />
                  <p className="text-sm text-center text-muted-foreground">
                    {importProgress}% complete
                  </p>
                </div>
              )}

              <ScrollArea className="h-[300px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 100).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-muted-foreground">{row.originalRow}</TableCell>
                        <TableCell className="font-medium">{row.companyName}</TableCell>
                        <TableCell>{row.industry || "-"}</TableCell>
                        <TableCell>{row.email || "-"}</TableCell>
                        <TableCell>{row.contactName || "-"}</TableCell>
                        <TableCell>{row.contactPhone || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              {parsedData.length > 100 && (
                <p className="text-sm text-muted-foreground text-center">
                  Showing first 100 of {parsedData.length} records
                </p>
              )}
            </div>
          )}

          {/* Results Section */}
          {importStats && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold">Import Complete!</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-8 h-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{importStats.companiesCreated}</p>
                        <p className="text-sm text-muted-foreground">Companies Created</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Users className="w-8 h-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{importStats.contactsCreated}</p>
                        <p className="text-sm text-muted-foreground">Contacts Created</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-lg font-semibold">{importStats.total}</p>
                      <p className="text-xs text-muted-foreground">Total Rows</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{importStats.companiesUpdated}</p>
                      <p className="text-xs text-muted-foreground">Existing Companies</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{importStats.contactsMerged}</p>
                      <p className="text-xs text-muted-foreground">Duplicate Contacts</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{importStats.skipped}</p>
                      <p className="text-xs text-muted-foreground">Skipped</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {importStats.errors.length > 0 && (
                <Card className="border-destructive">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      Errors ({importStats.errors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[100px]">
                      <ul className="text-sm space-y-1">
                        {importStats.errors.map((error, idx) => (
                          <li key={idx} className="text-muted-foreground">{error}</li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button onClick={handleClose}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
