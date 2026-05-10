import { useState } from "react";
import { useIRDataRoom, type IRDocument } from "@/hooks/useDataRoom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Link2, Activity, FileText } from "lucide-react";
import { UploadDocumentDialog } from "./UploadDocumentDialog";
import { ShareLinkDialog } from "./ShareLinkDialog";
import { DocumentTelemetryDrawer } from "./DocumentTelemetryDrawer";
import { Skeleton } from "@/components/ui/skeleton";

export function DataRoomManager() {
  const { documents } = useIRDataRoom();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [shareDoc, setShareDoc] = useState<IRDocument | null>(null);
  const [telemetryDoc, setTelemetryDoc] = useState<IRDocument | null>(null);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Room</h1>
          <p className="text-sm text-muted-foreground">
            Track investor engagement with your decks, memos and financials.
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" /> Upload Document
        </Button>
      </div>

      {documents.isLoading && <Skeleton className="h-40 w-full" />}

      {documents.data && documents.data.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
          No documents yet. Upload your pitch deck or financials to start tracking views.
        </Card>
      )}

      <div className="grid gap-3">
        {documents.data?.map((doc) => (
          <Card key={doc.id} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="font-semibold truncate">{doc.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{doc.doc_type.replace("_", " ")}</Badge>
                  <span>v{doc.version}</span>
                  {doc.total_slides && <span>{doc.total_slides} slides</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => setTelemetryDoc(doc)}>
                <Activity className="h-4 w-4 mr-1" /> Telemetry
              </Button>
              <Button size="sm" onClick={() => setShareDoc(doc)}>
                <Link2 className="h-4 w-4 mr-1" /> Share
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <ShareLinkDialog document={shareDoc} onOpenChange={(o) => !o && setShareDoc(null)} />
      <DocumentTelemetryDrawer document={telemetryDoc} onOpenChange={(o) => !o && setTelemetryDoc(null)} />
    </div>
  );
}

export default DataRoomManager;
