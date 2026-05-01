import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Upload, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

interface IdDoc {
  id: string;
  doc_type: "nid" | "passport";
  front_url: string;
  back_url: string | null;
  status: "pending" | "verified" | "rejected";
  review_notes: string | null;
  created_at: string;
}

const STATUS = {
  pending:  { label: "Under review", icon: Clock,        cls: "bg-amber-500/15 text-amber-700" },
  verified: { label: "Verified",     icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-700" },
  rejected: { label: "Rejected",     icon: XCircle,      cls: "bg-rose-500/15 text-rose-700" },
} as const;

export function IdentityDocsUpload() {
  const { talent } = useTalent();
  const [doc, setDoc] = useState<IdDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState<"nid" | "passport">("nid");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const frontInput = useRef<HTMLInputElement>(null);
  const backInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!talent?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("talent_id_documents" as any)
      .select("*")
      .eq("talent_id", talent.id)
      .order("created_at", { ascending: false })
      .limit(1);
    setDoc((((data as any) || [])[0] as IdDoc) || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [talent?.id]);

  const uploadOne = async (uid: string, file: File, label: string): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${uid}/${Date.now()}-${label}.${ext}`;
    const { error } = await supabase.storage.from("talent-id-docs").upload(path, file, { upsert: false });
    if (error) throw error;
    return path; // store path; we sign on demand
  };

  const submit = async () => {
    if (!talent?.id) return;
    if (!frontFile) return toast.error("Front side image is required.");
    if (docType === "nid" && !backFile) return toast.error("Back side of NID is required.");
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) throw new Error("Not signed in");
      const front_url = await uploadOne(uid, frontFile, "front");
      const back_url = backFile ? await uploadOne(uid, backFile, "back") : null;
      const { error } = await supabase.from("talent_id_documents" as any).insert({
        talent_id: talent.id, user_id: uid, doc_type: docType, front_url, back_url,
      } as any);
      if (error) throw error;
      toast.success("ID submitted. We usually review within 24 hours.");
      setFrontFile(null); setBackFile(null);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const meta = doc ? STATUS[doc.status] : null;
  const Icon = meta?.icon;

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Identity verification</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload either your National ID (both sides) or passport. Required to withdraw earned credits.
        </p>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : doc ? (
          <div className="p-3 rounded-xl border bg-muted/30 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold capitalize">{doc.doc_type === "nid" ? "National ID" : "Passport"}</p>
              <p className="text-xs text-muted-foreground">Submitted {new Date(doc.created_at).toLocaleDateString()}</p>
              {doc.review_notes && doc.status === "rejected" && (
                <p className="text-xs text-rose-600 mt-1">Reason: {doc.review_notes}</p>
              )}
            </div>
            {meta && Icon && (
              <Badge className={`${meta.cls} border-none`}>
                <Icon className="h-3 w-3 mr-1" /> {meta.label}
              </Badge>
            )}
          </div>
        ) : null}

        {(!doc || doc.status === "rejected") && (
          <div className="space-y-3 p-3 border rounded-xl bg-background">
            <div className="grid gap-2">
              <Label className="text-xs">Document type</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nid">National ID (both sides)</SelectItem>
                  <SelectItem value="passport">Passport (photo page)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs">{docType === "nid" ? "Front of NID" : "Passport photo page"}</Label>
              <input
                ref={frontInput}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
                className="text-xs"
              />
            </div>

            {docType === "nid" && (
              <div className="grid gap-2">
                <Label className="text-xs">Back of NID</Label>
                <input
                  ref={backInput}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setBackFile(e.target.files?.[0] || null)}
                  className="text-xs"
                />
              </div>
            )}

            <Button onClick={submit} disabled={busy} className="w-full rounded-xl">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4 mr-2" /> Submit for review</>}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default IdentityDocsUpload;
