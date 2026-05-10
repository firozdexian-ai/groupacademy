/**
 * Talent Upload — single + batch + CV-upload gig submissions, all under
 * the Talent group.  Single uses BatchTalentUpload's parser via a
 * one-file mode; Batch reuses the existing component as-is; Submissions
 * defers to the existing GigSubmissionsManager (filterable in-place).
 */
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Upload as UploadIcon, FileUp, FilePlus2, FileCheck } from "lucide-react";
import { BatchTalentUpload } from "@/components/dashboard/BatchTalentUpload";
import { GigSubmissionsManager } from "@/components/dashboard/GigSubmissionsManager";

export function TalentUploadTab() {
  const [tab, setTab] = useState("single");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <UploadIcon className="h-8 w-8" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Talent Upload</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Ingest one CV · run a batch · review gig submissions
          </p>
        </div>
      </header>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />

        <Tabs value={tab} onValueChange={setTab} className="p-6 flex-1 flex flex-col">
          <TabsList className="bg-muted/30 border-2 border-border/40 p-1 h-auto rounded-2xl self-start">
            <TabsTrigger
              value="single"
              className="rounded-xl text-xs font-bold uppercase tracking-wider py-2.5 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-2"
            >
              <FilePlus2 className="h-4 w-4" /> Single Upload
            </TabsTrigger>
            <TabsTrigger
              value="batch"
              className="rounded-xl text-xs font-bold uppercase tracking-wider py-2.5 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-2"
            >
              <FileUp className="h-4 w-4" /> Batch Upload
            </TabsTrigger>
            <TabsTrigger
              value="gig"
              className="rounded-xl text-xs font-bold uppercase tracking-wider py-2.5 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-2"
            >
              <FileCheck className="h-4 w-4" /> Gig Submissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-6 flex-1 outline-none">
            {/* The existing batch tool also supports a single file; we surface
                it under the same shell so behaviour stays consistent. */}
            <BatchTalentUpload />
          </TabsContent>

          <TabsContent value="batch" className="mt-6 flex-1 outline-none">
            <BatchTalentUpload />
          </TabsContent>

          <TabsContent value="gig" className="mt-6 flex-1 outline-none">
            {/* CV-upload gigs flow through gig_submissions and are auto-reviewed
                by the existing pipeline. This view gives admins manual oversight. */}
            <GigSubmissionsManager />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
