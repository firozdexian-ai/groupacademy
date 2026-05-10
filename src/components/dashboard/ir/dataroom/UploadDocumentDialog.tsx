import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIRDataRoom } from "../hooks/useDataRoom";

export function UploadDocumentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { uploadDocument } = useIRDataRoom();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("pitch_deck");
  const [slides, setSlides] = useState("");

  const submit = async () => {
    if (!file || !title) return;
    await uploadDocument.mutateAsync({
      file,
      title,
      doc_type: docType,
      total_slides: slides ? parseInt(slides) : null,
    });
    setFile(null);
    setTitle("");
    setSlides("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Seed Deck v3" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pitch_deck">Pitch Deck</SelectItem>
                <SelectItem value="memo">Memo</SelectItem>
                <SelectItem value="financials">Financials</SelectItem>
                <SelectItem value="demo_video">Demo Video</SelectItem>
                <SelectItem value="data_room_link">Data Room Link</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Total Slides (optional)</Label>
            <Input type="number" value={slides} onChange={(e) => setSlides(e.target.value)} placeholder="20" />
          </div>
          <div>
            <Label>File</Label>
            <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!file || !title || uploadDocument.isPending}>
            {uploadDocument.isPending ? "Uploading…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
