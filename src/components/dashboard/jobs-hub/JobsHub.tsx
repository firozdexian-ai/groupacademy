import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Users, Megaphone, Upload } from "lucide-react";
import { JobsManageTab } from "./JobsManageTab";
import { JobsApplicationsTab } from "./JobsApplicationsTab";
import { JobsOutreachTab } from "./JobsOutreachTab";
import { JobsUploadTab } from "./JobsUploadTab";

/**
 * Jobs Hub — unified Recruiter Operating System.
 * Four tabs: Manage, Applications (platform + external + AI scoring),
 * Outreach (multi-channel), Upload & Verify.
 */
export function JobsHub() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto bg-muted/30 p-1.5">
          <TabsTrigger value="manage" className="gap-2 text-xs">
            <Briefcase className="h-3.5 w-3.5" /> Manage
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-2 text-xs">
            <Users className="h-3.5 w-3.5" /> Applications
          </TabsTrigger>
          <TabsTrigger value="outreach" className="gap-2 text-xs">
            <Megaphone className="h-3.5 w-3.5" /> Outreach
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2 text-xs">
            <Upload className="h-3.5 w-3.5" /> Upload & Verify
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="mt-6">
          <JobsManageTab />
        </TabsContent>
        <TabsContent value="applications" className="mt-6">
          <JobsApplicationsTab />
        </TabsContent>
        <TabsContent value="outreach" className="mt-6">
          <JobsOutreachTab />
        </TabsContent>
        <TabsContent value="upload" className="mt-6">
          <JobsUploadTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
