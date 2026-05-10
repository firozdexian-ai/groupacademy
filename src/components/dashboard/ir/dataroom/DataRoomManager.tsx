import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Share2, Activity, Plus, BarChart3, Database } from "lucide-react";
import { useIRDataRoom, IRDocument } from "../hooks/useDataRoom";
import { UploadDocumentDialog } from "./UploadDocumentDialog";
import { ShareLinkDialog } from "./ShareLinkDialog";
import { DocumentTelemetryDrawer } from "./DocumentTelemetryDrawer";
import { cn } from "@/lib/utils";

export function DataRoomManager() {
  const { documents } = useIRDataRoom();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [shareDoc, setShareDoc] = useState<IRDocument | null>(null);
  const [telemetryDoc, setTelemetryDoc] = useState<IRDocument | null>(null);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Database className="h-8 w-8 text-primary fill-primary/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Data Room</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Secure Document Telemetry & Share Links
          </p>
        </div>
        <Button
          onClick={() => setUploadOpen(true)}
          className="h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus className="h-4 w-4" /> Upload Document
        </Button>
      </header>

      {/* Document Registry */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-indigo-500 to-primary" />
        <CardContent className="p-0">
          {documents.isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-[24px] bg-muted/40" />
              ))}
            </div>
          ) : documents.data && documents.data.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center space-y-4 bg-muted/5">
              <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center border-2 border-dashed border-border/40">
                <FileText className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-widest italic text-muted-foreground/60">
                  Registry Empty
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  Upload your pitch deck or financials to start tracking views.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y-2 divide-border/5">
              {documents.data?.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 hover:bg-primary/[0.02] transition-colors group"
                >
                  <div className="flex items-start gap-5 min-w-0">
                    <div className="h-14 w-14 rounded-2xl bg-background/50 flex items-center justify-center border-2 border-border/20 shadow-sm shrink-0 group-hover:border-primary/30 transition-colors">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <h4 className="font-black text-xl uppercase italic tracking-tighter truncate group-hover:text-primary transition-colors">
                        {doc.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest border-2">
                          {doc.doc_type.replace("_", " ")}
                        </Badge>
                        <Badge variant="secondary" className="font-bold text-[9px] uppercase tracking-widest">
                          v{doc.version}
                        </Badge>
                        {doc.total_slides && (
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                            {doc.total_slides} slides
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 mt-4 md:mt-0">
                    <Button
                      variant="outline"
                      onClick={() => setTelemetryDoc(doc)}
                      className="h-12 px-6 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest gap-2 bg-background/50 hover:border-primary/40 hover:text-primary transition-all"
                    >
                      <Activity className="h-4 w-4" /> Telemetry
                    </Button>
                    <Button
                      onClick={() => setShareDoc(doc)}
                      className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-md shadow-primary/10 transition-all"
                    >
                      <Share2 className="h-4 w-4" /> Share
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <ShareLinkDialog document={shareDoc} onOpenChange={(o) => !o && setShareDoc(null)} />
      <DocumentTelemetryDrawer document={telemetryDoc} onOpenChange={(o) => !o && setTelemetryDoc(null)} />
    </div>
  );
}

export default DataRoomManager;
