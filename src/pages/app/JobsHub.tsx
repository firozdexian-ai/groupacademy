import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { useTalent } from "@/hooks/useTalent";
import { useJobsHubDashboard } from "@/domains/jobs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Layers, Building2, Globe, Zap } from "lucide-react";
import { JobsHubHeader } from "@/domains/jobs/components/JobsHubHeader";
import { BrowseView } from "@/domains/jobs/components/views/BrowseView";
import { CompaniesView } from "@/domains/jobs/components/views/CompaniesView";
import { LocationsView } from "@/domains/jobs/components/views/LocationsView";
import { ToolsView } from "@/domains/jobs/components/views/ToolsView";
import { InlineSpinner } from "@/components/common/InlineSpinner";

type TabKey = "browse" | "company" | "country" | "tools";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
 { key: "browse", label: "Browse", icon: Layers },
 { key: "company", label: "Companies", icon: Building2 },
 { key: "country", label: "Locations", icon: Globe },
 { key: "tools", label: "Tools", icon: Zap },
];

export default function JobsHub() {
 const { talent } = useTalent();
 const [searchParams, setSearchParams] = useSearchParams();
 const activeTab = (searchParams.get("tab") as TabKey) || "browse";

 const { data: dashboard, isLoading } = useJobsHubDashboard(talent?.id);

 if (isLoading) {
 return (
 <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center gap-4">
 <InlineSpinner size="lg" />
 </div>
 );
 }

 return (
 <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 pb-32">
 <JobsHubHeader />

 <Tabs value={activeTab} onValueChange={(t) => setSearchParams({ tab: t })} className="w-full">
 <TabsList className="grid w-full grid-cols-4 h-11 bg-muted/40 p-1 rounded-xl">
 {TABS.map((tab) => (
 <TabsTrigger key={tab.key} value={tab.key} className="gap-2 text-[11px] uppercase font-bold">
 <tab.icon className="h-3.5 w-3.5" /> {tab.label}
 </TabsTrigger>
 ))}
 </TabsList>

 <div className="mt-6">
 <TabsContent value="browse">
 <BrowseView dashboard={dashboard} talent={talent} />
 </TabsContent>
 <TabsContent value="company">
 <CompaniesView companies={dashboard?.companies} />
 </TabsContent>
 <TabsContent value="country">
 <LocationsView countries={dashboard?.countries} talent={talent} />
 </TabsContent>
 <TabsContent value="tools">
 <ToolsView />
 </TabsContent>
 </div>
 </Tabs>
 </div>
 );
}
