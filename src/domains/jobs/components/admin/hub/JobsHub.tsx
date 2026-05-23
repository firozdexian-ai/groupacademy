import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Users, Megaphone, Upload, Zap, ShieldCheck, BarChart3 } from "lucide-react";
import { JobsManageTab } from "./JobsManageTab";
import { JobsApplicationsTab } from "./JobsApplicationsTab";
import { JobsOutreachTab } from "./JobsOutreachTab";
import { JobsUploadTab } from "./JobsUploadTab";
import { Badge } from "@/components/ui/badge";

/**
 * Jobs Hub — unified admin command center for jobs, applications, outreach, and uploads.
 */
export function JobsHub() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* HUB HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Zap className="h-8 w-8 fill-current" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Jobs hub</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Manage jobs, applications, outreach & uploads
          </p>
        </div>
        <div className="flex gap-3">
          <Badge
            variant="outline"
            className="h-12 px-6 rounded-2xl border-2 font-black italic gap-2 text-primary bg-background/50 uppercase"
          >
            <BarChart3 className="h-4 w-4" /> 2.5% conversion
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="manage" className="w-full">
        {/* TAB NAV */}
        <div className="bg-card/30 p-2 rounded-[32px] border-2 border-border/40 backdrop-blur-sm shadow-xl inline-block w-full lg:w-auto">
          <TabsList className="bg-transparent h-auto flex flex-wrap gap-2 p-0">
            <TabNode value="manage" icon={Briefcase} label="Manage jobs" />
            <TabNode value="applications" icon={Users} label="Applications" />
            <TabNode value="outreach" icon={Megaphone} label="Outreach" />
            <TabNode value="upload" icon={Upload} label="Upload" />
          </TabsList>
        </div>

        {/* TAB CONTENT */}
        <div className="mt-8">
          <TabsContent value="manage" className="mt-0 focus-visible:ring-0">
            <JobsManageTab />
          </TabsContent>
          <TabsContent value="applications" className="mt-0 focus-visible:ring-0">
            <JobsApplicationsTab />
          </TabsContent>
          <TabsContent value="outreach" className="mt-0 focus-visible:ring-0">
            <JobsOutreachTab />
          </TabsContent>
          <TabsContent value="upload" className="mt-0 focus-visible:ring-0">
            <JobsUploadTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function TabNode({ value, icon: Icon, label }: { value: string; icon: any; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl px-6 py-3 transition-all font-black uppercase italic text-[10px] tracking-widest gap-3 border-2 border-transparent hover:border-primary/20"
    >
      <Icon className="h-4 w-4" />
      {label}
    </TabsTrigger>
  );
}
