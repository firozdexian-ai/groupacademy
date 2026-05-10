import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useIRDataRoom, useDocumentTelemetry, type IRDocument } from "../hooks/useDataRoom";
import { Copy, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

export function ShareLinkDialog({
  document,
  onOpenChange,
}: {
  document: IRDocument | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = !!document;
  const { createShareLink, revokeShareLink } = useIRDataRoom();
  const { links } = useDocumentTelemetry(document?.id ?? null);
  const [expiresInDays, setExpiresInDays] = useState("14");
  const [requireEmail, setRequireEmail] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setCopiedId(null);
  }, [open]);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleCreate = async () => {
    if (!document) return;
    await createShareLink.mutateAsync({
      document_id: document.id,
      expires_in_days: expiresInDays ? parseInt(expiresInDays) : null,
      require_email: requireEmail,
    });
  };

  const copyUrl = async (token: string, id: string) => {
    await navigator.clipboard.writeText(`${baseUrl}/ir/view/${token}`);
    setCopiedId(id);
    toast.success("Link copied");
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share — {document?.title}</DialogTitle>
        </DialogHeader>

        <Card className="p-4 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Expires (days)</Label>
              <Input
                type="number"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder="14"
              />
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={requireEmail} onCheckedChange={setRequireEmail} id="req-email" />
              <Label htmlFor="req-email">Require viewer email</Label>
            </div>
          </div>
          <Button onClick={handleCreate} disabled={createShareLink.isPending} className="w-full">
            Generate New Link
          </Button>
        </Card>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {links.data?.map((l) => {
            const url = `${baseUrl}/ir/view/${l.token}`;
            const isRevoked = !!l.revoked_at;
            const isExpired = l.expires_at && new Date(l.expires_at) < new Date();
            return (
              <div key={l.id} className="flex items-center gap-2 p-2 rounded border">
                <Input value={url} readOnly className="flex-1 text-xs" />
                <Button size="sm" variant="outline" onClick={() => copyUrl(l.token, l.id)} disabled={isRevoked || !!isExpired}>
                  {copiedId === l.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => revokeShareLink.mutate(l.id)}
                  disabled={isRevoked}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {isRevoked && <span className="text-xs text-destructive">Revoked</span>}
                {!isRevoked && isExpired && <span className="text-xs text-muted-foreground">Expired</span>}
              </div>
            );
          })}
          {links.data && links.data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No share links yet</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
