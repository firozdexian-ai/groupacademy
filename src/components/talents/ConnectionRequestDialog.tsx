import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flame, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ConnectionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
  onSent?: () => void;
}

export function ConnectionRequestDialog({
  open,
  onOpenChange,
  recipientId,
  recipientName,
  onSent,
}: ConnectionRequestDialogProps) {
  const { toast } = useToast();
  const [price, setPrice] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.rpc("get_talent_connection_price", { _recipient: recipientId });
      setPrice(Number(data ?? 50));
    })();
  }, [open, recipientId]);

  const send = async () => {
    setSending(true);
    const { error } = await supabase.rpc("talent_connection_request", { _recipient: recipientId });
    setSending(false);
    if (error) {
      toast({ title: "Could not send request", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Connection request sent", description: `${recipientName} has 14 days to respond. Refunded if declined.` });
    onSent?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Connect with {recipientName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Sending a connection request costs <strong>{price ?? "…"} credits</strong> (1% of their lifetime activity).
            70% goes to {recipientName.split(" ")[0]} on accept, 30% to the platform. Full refund if declined or no
            response in 14 days.
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-orange-500/10 p-3 text-orange-700">
            <Flame className="h-4 w-4" />
            <span className="text-xs">Top creators cost more — that's the whole point.</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={send} disabled={sending || price === null}>
            {sending ? "Sending…" : `Send (${price} cr)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
