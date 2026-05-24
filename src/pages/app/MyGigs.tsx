import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, ShieldCheck, Coins, History, Star, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PAGE_SHELL, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT } from "@/lib/uiTokens";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface GigRecord {
 title: string;
 skill_category: string;
 employer_name: string | null;
}

interface BidRecord {
 id: string;
 status: string;
 bid_amount: number;
 created_at: string;
 marketplace_gigs: GigRecord | null;
}

interface ContractRecord {
 id: string;
 status: "active" | "completed" | string;
 agreed_amount: number;
 created_at: string;
 completed_at: string | null;
 marketplace_gigs: GigRecord | null;
}

/**
 * My Gigs — manage proposals, active contracts, and delivered work.
 */
export default function MyGigs() {
 const { talent } = useTalent();
 const queryClient = useQueryClient();

 // Unified dashboard queries (Parallel fetch)
 const { data: dashboardData, isLoading } = useQuery({
 queryKey: ["app-my-gigs-dashboard", talent?.id],
 enabled: !!talent?.id,
 queryFn: async () => {
 const [bids, contracts] = await Promise.all([
 supabase
 .from("marketplace_bids")
 .select("*, marketplace_gigs(title, skill_category, employer_name)")
 .eq("talent_id", talent!.id)
 .order("created_at", { ascending: false }),
 supabase
 .from("marketplace_contracts")
 .select("*, marketplace_gigs:gig_id(title, skill_category)")
 .eq("freelancer_id", talent!.id)
 .order("created_at", { ascending: false }),
 ]);
 return {
 bids: (bids.data as unknown as BidRecord[]) ?? [],
 contracts: (contracts.data as unknown as ContractRecord[]) ?? [],
 };
 },
 });

 if (isLoading)
 return (
 <div className="p-12 text-center">
 <Loader2 className="animate-spin h-6 w-6 mx-auto" />
 </div>
 );

 const { bids, contracts } = dashboardData ?? { bids: [], contracts: [] };
 const activeContracts = contracts.filter((c) => c.status === "active");
 const archiveContracts = contracts.filter((c) => c.status === "completed");

 return (
 <div className={cn(PAGE_SHELL, "max-w-4xl mx-auto py-10 space-y-8")}>
 <header className="space-y-1">
 <h1 className={PAGE_TITLE}>My Gigs</h1>
 <p className={PAGE_SUBTITLE}>Track your proposals, active gigs, and delivered work.</p>
 </header>

 <Tabs defaultValue="bids" className="w-full">
 <TabsList className="w-full grid grid-cols-3 h-12 bg-muted/40">
 <TabsTrigger value="bids" className="text-xs font-bold uppercase tracking-widest">
 Proposals
 </TabsTrigger>
 <TabsTrigger value="active" className="text-xs font-bold uppercase tracking-widest">
 Active ({activeContracts.length})
 </TabsTrigger>
 <TabsTrigger value="archive" className="text-xs font-bold uppercase tracking-widest">
 Archive
 </TabsTrigger>
 </TabsList>

 <TabsContent value="bids" className="mt-6 space-y-4">
 {bids.map((bid) => (
 <Card key={bid.id} className={cn(CARD, "p-6 flex items-center justify-between")}>
 <div>
 <h3 className="font-bold text-sm uppercase">{bid.marketplace_gigs?.title}</h3>
 <p className={META_TEXT}>{bid.marketplace_gigs?.employer_name}</p>
 </div>
 <Badge variant={bid.status === "accepted" ? "default" : "secondary"}>{bid.status}</Badge>
 </Card>
 ))}
 </TabsContent>

 <TabsContent value="active" className="mt-6 space-y-4">
 {activeContracts.map((c) => (
 <Card key={c.id} className={cn(CARD, "p-6")}>
 <div className="flex justify-between items-start">
 <div className="space-y-1">
 <h3 className="font-bold text-sm">{c.marketplace_gigs?.title}</h3>
 <span className="flex items-center text-[10px] font-mono text-emerald-600">
 <Coins className="h-3 w-3 mr-1" /> {c.agreed_amount} Credits
 </span>
 </div>
 <Button size="sm" className="h-8 rounded-lg text-[10px] uppercase font-bold tracking-widest gap-2">
 <Upload className="h-3 w-3" /> Deliver
 </Button>
 </div>
 </Card>
 ))}
 </TabsContent>
 </Tabs>
 </div>
 );
}
