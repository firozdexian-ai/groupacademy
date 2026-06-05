import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listMarketplaceGigsCatalog } from "@/domains/gigs/repo/gigsRepo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MARKETPLACE_SCHOOLS, MARKETPLACE_SCHOOL_MAP } from "@/lib/constants/marketplaceCategories";
import { Search, Briefcase, Clock, Coins, ChevronRight, Zap, ShieldCheck, Target } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PAGE_SHELL_WIDE, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT } from "@/lib/uiTokens";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface GigRecord {
 id: string;
 title: string;
 description: string | null;
 skill_category: string;
 pricing_type: "fixed" | "competitive" | string;
 budget_amount: number;
 deadline: string | null;
 total_bids: number | null;
 is_featured: boolean | null;
 created_at: string;
}

/**
 * GroUp Academy: Professional Project Marketplace (Marketplace)
 * Hardened responsive discovery engine for high-value gig artifacts.
 * Version: Launch Candidate · Phase Z1 Production Contract Sealed
 */
export default function Marketplace() {
 const navigateHook = useNavigate();

 const [textSearchQueryStr, setTextSearchQueryStr] = React.useState<string>("");
 const [activeCategoryFilter, setActiveCategoryFilter] = React.useState<string | null>(null);

 // =========================================================================
 // DATA ACQUISITION PIPELINE SECURED VIA TANSTACK CACHE CHANNEL
 // =========================================================================
 const { data: gigsRegistryPayload = [], isLoading: isRegistryLoading } = useQuery<GigRecord[]>({
 queryKey: ["app-marketplace-gigs-registry", activeCategoryFilter],
 queryFn: async (): Promise<GigRecord[]> => {
 let queryBuilder = supabase
 .from("marketplace_gigs")
 .select(
 "id, title, description, skill_category, pricing_type, budget_amount, deadline, total_bids, is_featured, created_at",
 )
 .in("status", ["approved", "active"])
 .order("is_featured", { ascending: false })
 .order("created_at", { ascending: false });

 if (activeCategoryFilter) {
 queryBuilder = queryBuilder.eq("skill_category", activeCategoryFilter);
 }

 const { data, error } = await queryBuilder;
 if (error) throw error;
 return (data as unknown as GigRecord[]) ?? [];
 },
 });

 // =========================================================================
 // MEMOIZED PARAMETER SECTOR: SECURE SEARCH FILTERING STREAM
 // =========================================================================
 const filteredGigsRegistry = React.useMemo(() => {
 const normalizedQuery = textSearchQueryStr.toLowerCase();
 return gigsRegistryPayload.filter(
 (gig) =>
 !normalizedQuery ||
 gig.title.toLowerCase().includes(normalizedQuery) ||
 gig.description?.toLowerCase().includes(normalizedQuery),
 );
 }, [gigsRegistryPayload, textSearchQueryStr]);

 return (
 <div className={cn(PAGE_SHELL_WIDE, "max-w-5xl mx-auto space-y-10")}>
 {/* HUD LEVEL 1: EXECUTIVE HUB HEADER */}
 <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/10 pb-6">
 <div className="space-y-1 block">
 <div className="flex items-center gap-3">
 <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
 <Briefcase className="h-5 w-5 text-primary" />
 </div>
 <h1 className={PAGE_TITLE}>Project Hub</h1>
 </div>
 <p className={PAGE_SUBTITLE}>Professional Skill Monetization v2.6</p>
 </div>
 <Badge variant="outline" className="font-mono text-[9px] font-black uppercase tracking-widest px-3 h-6">
 {filteredGigsRegistry.length.toString()} ACTIVE NODES
 </Badge>
 </header>

 {/* HUD LEVEL 2: QUERY CONSOLE & FILTER PROTOCOL */}
 <div className="space-y-4">
 <div className="relative group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
 <Input
 placeholder="Query artifacts by title or logic..."
 className="pl-11 h-12 rounded-xl bg-card border-border/40 shadow-none focus-visible:ring-1"
 value={textSearchQueryStr}
 onChange={(e) => setTextSearchQueryStr(e.target.value)}
 />
 </div>

 <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
 <Button
 variant={!activeCategoryFilter ? "default" : "ghost"}
 size="sm"
 onClick={() => setActiveCategoryFilter(null)}
 className="rounded-lg h-9 text-[10px] uppercase font-black tracking-widest"
 >
 Global List
 </Button>
 {MARKETPLACE_SCHOOLS.map((school) => (
 <Button
 key={school.value}
 variant={activeCategoryFilter === school.value ? "default" : "ghost"}
 size="sm"
 onClick={() => setActiveCategoryFilter(school.value)}
 className="rounded-lg h-9 text-[10px] uppercase font-black tracking-widest"
 >
 {school.label}
 </Button>
 ))}
 </div>
 </div>

 {/* HUD LEVEL 3: LIST VIEWPORT */}
 {isRegistryLoading ? (
 <div className="space-y-4">
 {[1, 2, 3].map((i) => (
 <Skeleton key={i} className="h-32 w-full rounded-2xl" />
 ))}
 </div>
 ) : filteredGigsRegistry.length === 0 ? (
 <div className="text-center py-20 border-2 border-dashed border-border/40 rounded-2xl">
 <Target className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
 <h3 className="text-sm font-bold uppercase tracking-wide">Nothing here yet</h3>
 <p className={META_TEXT}>No gig artifacts match this query sequence.</p>
 </div>
 ) : (
 <div className="grid gap-4">
 {filteredGigsRegistry.map((gig) => (
 <Card
 key={gig.id}
 className={cn(CARD, "transition-all hover:border-primary/40 cursor-pointer overflow-hidden p-6")}
 onClick={() => navigateHook(`/app/marketplace/${gig.id}`)}
 >
 <CardContent className="p-0 flex items-start justify-between gap-6">
 <div className="flex-1 min-w-0 space-y-4">
 <div className="flex items-center gap-2 flex-wrap">
 {gig.is_featured && (
 <Badge className="bg-amber-500/10 text-amber-600 border-none text-[8px] uppercase tracking-widest font-black">
 <Zap className="h-3 w-3 mr-1" /> Elite
 </Badge>
 )}
 <Badge
 variant="secondary"
 className="bg-primary/5 text-primary border-none text-[8px] uppercase tracking-widest font-black"
 >
 {MARKETPLACE_SCHOOL_MAP[gig.skill_category]?.label || gig.skill_category}
 </Badge>
 </div>

 <div>
 <h3 className="text-xl font-black uppercase tracking-tight line-clamp-1">{gig.title}</h3>
 <p className="text-xs text-muted-foreground line-clamp-2 mt-1 italic">{gig.description}</p>
 </div>

 <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground/60 uppercase tracking-widest">
 <span className="flex items-center gap-1.5 text-emerald-600">
 <Coins className="h-3.5 w-3.5" /> {gig.budget_amount} Credits
 </span>
 {gig.deadline && (
 <span className="flex items-center gap-1.5">
 <Clock className="h-3.5 w-3.5" /> {format(new Date(gig.deadline), "MMM d")}
 </span>
 )}
 </div>
 </div>

 <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
 <ChevronRight className="h-5 w-5 text-muted-foreground" />
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </div>
 );
}
