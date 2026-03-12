import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

type Mode = "talent" | "contact" | "investor";

interface LinkedInJsonUploadProps {
  mode: Mode;
  onComplete?: () => void;
}

const MODE_LABELS: Record<Mode, { singular: string; plural: string; table: string }> = {
  talent: { singular: "Talent", plural: "Talents", table: "talents" },
  contact: { singular: "Contact", plural: "Contacts", table: "contacts" },
  investor: { singular: "Investor", plural: "Investors", table: "ir_investors" },
};

export function LinkedInJsonUpload({ mode, onComplete }: LinkedInJsonUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedRecord[]>([]);
  const [skipped, setSkipped] = useState<SkippedRecord[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    imported: number; duplicates: number; failed: number; companiesCreated: number;
  } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const labels = MODE_LABELS[mode];

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Please select a .json file");
      return;
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

        toast.success(`Parsed ${result.valid.length} profiles, ${result.skipped.length} skipped`);
      } catch (err) {
        toast.error("Invalid JSON file");
        console.error("JSON parse error:", err);
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [mode]);

  const toggleSelect = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIndices.size === parsed.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(parsed.map((_, i) => i)));
    }
  };

  // Auto-create a company if it doesn't exist, return its ID
  const getOrCreateCompany = async (
    companyData: CompanyData,
    existingMap: Record<string, string>
  ): Promise<string | null> => {
    const key = companyData.name.toLowerCase();
    if (existingMap[key]) return existingMap[key];

    const insertObj: Record<string, any> = { name: companyData.name };
    if (companyData.website) insertObj.website = companyData.website;
    if (companyData.linkedin_url) insertObj.linkedin_url = companyData.linkedin_url;
    if (companyData.industry) insertObj.industry = companyData.industry;
    if (companyData.address) insertObj.address = companyData.address;
    if (companyData.notes) insertObj.notes = companyData.notes;

    const { data, error } = await supabase
      .from("companies")
      .insert(insertObj as any)
      .select("id")
      .single();

    if (error) {
      // Might be a race-condition duplicate — try fetching
      const { data: existing } = await supabase
        .from("companies")
        .select("id")
        .ilike("name", companyData.name)
        .limit(1)
        .single();
      if (existing) {
        existingMap[key] = existing.id;
        return existing.id;
      }
      console.error("Failed to create company:", companyData.name, error.message);
      return null;
    }

    existingMap[key] = data.id;
    return data.id;
  };

  // Auto-create a VC firm if it doesn't exist, return its ID
  const getOrCreateVCFirm = async (
    companyData: CompanyData,
    existingMap: Record<string, string>
  ): Promise<string | null> => {
    const key = companyData.name.toLowerCase();
    if (existingMap[key]) return existingMap[key];

    const insertObj: Record<string, any> = { name: companyData.name };
    if (companyData.website) insertObj.website = companyData.website;
    if (companyData.linkedin_url) insertObj.linkedin_url = companyData.linkedin_url;

    const { data, error } = await supabase
      .from("ir_vc_firms")
      .insert(insertObj as any)
      .select("id")
      .single();

    if (error) {
      const { data: existing } = await supabase
        .from("ir_vc_firms")
        .select("id")
        .ilike("name", companyData.name)
        .limit(1)
        .single();
      if (existing) {
        existingMap[key] = existing.id;
        return existing.id;
      }
      console.error("Failed to create VC firm:", companyData.name, error.message);
      return null;
    }

    existingMap[key] = data.id;
    return data.id;
  };

  const handleImport = async () => {
    const selected = parsed.filter((_, i) => selectedIndices.has(i));
    if (selected.length === 0) {
      toast.error("No records selected");
      return;
    }

    setImporting(true);
    setImportProgress(0);

    let imported = 0;
    let duplicates = 0;
    let failed = 0;
    let companiesCreated = 0;

    // Pre-load existing companies/VC firms for resolution
    let companyMap: Record<string, string> = {};
    if (mode === "contact") {
      const { data } = await supabase.from("companies").select("id, name");
      if (data) {
        data.forEach((c) => { companyMap[c.name.toLowerCase()] = c.id; });
      }
    }

    let vcFirmMap: Record<string, string> = {};
    if (mode === "investor") {
      const { data } = await supabase.from("ir_vc_firms").select("id, name");
      if (data) {
        data.forEach((f) => { vcFirmMap[f.name.toLowerCase()] = f.id; });
      }
    }

    // Check existing records for dedup
    let existingEmails = new Set<string>();
    let existingLinkedins = new Set<string>();

    const tableName = labels.table;

    if (mode === "talent") {
      const emails = selected.map((r) => r.data.email?.toLowerCase()).filter(Boolean);
      const linkedins = selected.map((r) => r.data.linkedin_url).filter(Boolean);

      for (let i = 0; i < emails.length; i += 50) {
        const batch = emails.slice(i, i + 50);
        const { data } = await supabase.from("talents").select("email").in("email", batch);
        data?.forEach((t) => existingEmails.add(t.email.toLowerCase()));
      }
      for (let i = 0; i < linkedins.length; i += 50) {
        const batch = linkedins.slice(i, i + 50);
        const { data } = await supabase.from("talents").select("linkedin_url").in("linkedin_url", batch);
        data?.forEach((t) => { if (t.linkedin_url) existingLinkedins.add(t.linkedin_url); });
      }
    } else if (mode === "contact") {
      const emails = selected.map((r) => r.data.email?.toLowerCase()).filter(Boolean);
      for (let i = 0; i < emails.length; i += 50) {
        const batch = emails.slice(i, i + 50);
        const { data } = await supabase.from("contacts").select("email").in("email", batch);
        data?.forEach((c) => { if (c.email) existingEmails.add(c.email.toLowerCase()); });
      }
      // Also dedup by linkedin_url
      const linkedins = selected.map((r) => r.data.linkedin_url).filter(Boolean);
      for (let i = 0; i < linkedins.length; i += 50) {
        const batch = linkedins.slice(i, i + 50);
        const { data } = await supabase.from("contacts").select("linkedin_url").in("linkedin_url", batch);
        data?.forEach((c) => { if (c.linkedin_url) existingLinkedins.add(c.linkedin_url); });
      }
    } else {
      const emails = selected.map((r) => r.data.email?.toLowerCase()).filter(Boolean);
      for (let i = 0; i < emails.length; i += 50) {
        const batch = emails.slice(i, i + 50);
        const { data } = await supabase.from("ir_investors").select("email").in("email", batch);
        data?.forEach((inv) => { if (inv.email) existingEmails.add(inv.email.toLowerCase()); });
      }
      const linkedins = selected.map((r) => r.data.linkedin_url).filter(Boolean);
      for (let i = 0; i < linkedins.length; i += 50) {
        const batch = linkedins.slice(i, i + 50);
        const { data } = await supabase.from("ir_investors").select("linkedin_url").in("linkedin_url", batch);
        data?.forEach((inv) => { if (inv.linkedin_url) existingLinkedins.add(inv.linkedin_url); });
      }
    }

    // Insert records one-by-one
    for (let i = 0; i < selected.length; i++) {
      const record = selected[i];
      const { _companyName, _companyData, _hasPlaceholderEmail, ...insertData } = record.data;

      // Dedup check
      const email = insertData.email?.toLowerCase();
      const linkedin = insertData.linkedin_url;

      if (mode === "talent") {
        if ((email && !_hasPlaceholderEmail && existingEmails.has(email)) || (linkedin && existingLinkedins.has(linkedin))) {
          duplicates++;
          setImportProgress(((i + 1) / selected.length) * 100);
          continue;
        }
      } else {
        if ((email && existingEmails.has(email)) || (linkedin && existingLinkedins.has(linkedin))) {
          duplicates++;
          setImportProgress(((i + 1) / selected.length) * 100);
          continue;
        }
      }

      // Resolve or auto-create company/firm
      if (mode === "contact" && _companyData) {
        const prevCount = Object.keys(companyMap).length;
        const companyId = await getOrCreateCompany(_companyData as CompanyData, companyMap);
        if (companyId) insertData.company_id = companyId;
        if (Object.keys(companyMap).length > prevCount) companiesCreated++;
      }
      if (mode === "investor" && _companyData) {
        const prevCount = Object.keys(vcFirmMap).length;
        const firmId = await getOrCreateVCFirm(_companyData as CompanyData, vcFirmMap);
        if (firmId) insertData.vc_firm_id = firmId;
        if (Object.keys(vcFirmMap).length > prevCount) companiesCreated++;
      }

      // Remove nullish fields
      Object.keys(insertData).forEach((k) => {
        if (insertData[k] === null || insertData[k] === undefined) delete insertData[k];
      });

      let error: any = null;
      if (mode === "talent") {
        const res = await supabase.from("talents").insert(insertData as any);
        error = res.error;
      } else if (mode === "contact") {
        const res = await supabase.from("contacts").insert(insertData as any);
        error = res.error;
      } else {
        const res = await supabase.from("ir_investors").insert(insertData as any);
        error = res.error;
      }

      if (error) {
        console.error(`Failed to insert ${insertData.full_name}:`, error.message);
        failed++;
      } else {
        imported++;
        if (email) existingEmails.add(email);
        if (linkedin) existingLinkedins.add(linkedin);
      }

      setImportProgress(((i + 1) / selected.length) * 100);
    }

    setImporting(false);
    setImportResult({ imported, duplicates, failed, companiesCreated });

    if (imported > 0) {
      toast.success(`Imported ${imported} ${labels.plural.toLowerCase()}`);
      onComplete?.();
    }
    if (companiesCreated > 0) toast.success(`${companiesCreated} new ${mode === "investor" ? "VC firms" : "companies"} created`);
    if (duplicates > 0) toast.info(`${duplicates} duplicates skipped`);
    if (failed > 0) toast.error(`${failed} failed to import`);
  };

  const reset = () => {
    setParsed([]);
    setSkipped([]);
    setSelectedIndices(new Set());
    setImportResult(null);
    setFileName(null);
  };

  const selectedCount = selectedIndices.size;

  return (
    <div className="space-y-4">
      {/* File Picker */}
      {parsed.length === 0 && !importResult && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <FileJson2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">Click to select LinkedIn JSON file</p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports LinkedIn Profile Scraper &amp; Leads Finder formats
            </p>
          </div>
        </div>
      )}

      {/* Preview Table */}
      {parsed.length > 0 && !importResult && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {parsed.length} profiles parsed from {fileName}
              </span>
              {skipped.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {skipped.length} skipped
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedIndices.size === parsed.length}
                onCheckedChange={toggleAll}
              />
              <span className="text-xs text-muted-foreground">Select all</span>
            </div>
          </div>

          <ScrollArea className="max-h-[350px] border rounded-lg">
            <div className="space-y-1 p-2">
              {parsed.map((record, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors ${
                    selectedIndices.has(idx) ? "bg-muted/30" : ""
                  }`}
                >
                  <Checkbox
                    checked={selectedIndices.has(idx)}
                    onCheckedChange={() => toggleSelect(idx)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {record.data.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {record.data.email || record.data.designation || record.data.custom_profession || record.data.title || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {record.data.linkedin_url && (
                      <Badge variant="outline" className="text-[10px] px-1.5">LI</Badge>
                    )}
                    {record.data._companyName && (
                      <Badge variant="outline" className="text-[10px] px-1.5">
                        <Building2 className="w-2.5 h-2.5 mr-0.5" />
                        {record.data._companyName.length > 12
                          ? record.data._companyName.slice(0, 12) + "…"
                          : record.data._companyName}
                      </Badge>
                    )}
                    {record.warnings.map((w, wi) => (
                      <Badge key={wi} variant="secondary" className="text-[10px] px-1.5 bg-amber-100 text-amber-700">
                        {w}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {skipped.length > 0 && (
            <details className="text-xs">
              <summary className="text-muted-foreground cursor-pointer">
                {skipped.length} skipped profile(s)
              </summary>
              <div className="mt-1 space-y-1">
                {skipped.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-muted-foreground p-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{s.name}: {s.reason}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          <div className="flex gap-2">
            <Button onClick={handleImport} disabled={importing || selectedCount === 0} className="flex-1">
              {importing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />Import {selectedCount} {selectedCount === 1 ? labels.singular : labels.plural}</>
              )}
            </Button>
            <Button variant="outline" onClick={reset} disabled={importing}>
              Clear
            </Button>
          </div>

          {importing && <Progress value={importProgress} className="h-2" />}
        </div>
      )}

      {/* Results */}
      {importResult && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="text-center space-y-2">
              <CheckCircle className="w-8 h-8 mx-auto text-green-600" />
              <p className="font-semibold">Import Complete</p>
            </div>
            <div className={`grid ${importResult.companiesCreated > 0 ? "grid-cols-4" : "grid-cols-3"} gap-3 text-center text-sm`}>
              <div>
                <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                <p className="text-muted-foreground">Imported</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{importResult.duplicates}</p>
                <p className="text-muted-foreground">Duplicates</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                <p className="text-muted-foreground">Failed</p>
              </div>
              {importResult.companiesCreated > 0 && (
                <div>
                  <p className="text-2xl font-bold text-blue-600">{importResult.companiesCreated}</p>
                  <p className="text-muted-foreground">{mode === "investor" ? "VC Firms" : "Companies"}</p>
                </div>
              )}
            </div>
            <Button variant="outline" onClick={reset} className="w-full">
              Import Another File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
