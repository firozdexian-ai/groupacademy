import * as React from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Search, Sparkles, Star, Coins, Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineSpinner } from "@/components/common/InlineSpinner";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface MarketAgent {
 id: string;
 name: string;
 agent_key: string;
 description: string;
 category: string | null;
 message_credit_cost: number;
 total_conversations: number | null;
 average_rating: number | null;
 avatar_url: string | null;
 owner_kind: string;
 is_featured: boolean | null;
}

interface AgentTileProps {
 agent: MarketAgent;
 featured?: boolean;
}

const CATEGORIES_DIRECTORY = ["all", "career", "productivity", "writing", "research", "coding", "lifestyle"];

/**
 * GroUp Academy: Authoritative AI Agent Marketplace (AgentMarketplace)
 * Hardened registry matrix managing async telemetry lookup states and shielding filter maps from structural drift.
 * Version: Launch Candidate · Phase Z0 Lifecycle Insulation Hardened
 */
export default function AgentMarketplace() {
 const [agentsRegistryPayload, setAgentsRegistryPayload] = React.useState<MarketAgent[]>([]);
 const [isDataLayerLoading, setIsDataLayerLoading] = React.useState<boolean>(true);
 const [textSearchQueryInput, setTextSearchQueryInput] = React.useState<string>("");
 const [activeCategoryFilter, setActiveCategoryFilter] = React.useState<string>("all");

 // =========================================================================
 // LIFECYCLE SECTOR 1: DATA LAYER FETCH HANDSHAKE WITH CLEANUP HOOKS
 // =========================================================================
 React.useEffect(() => {
 let isThreadActiveAndValid = true;
 setIsDataLayerLoading(true);

 const synchronizeMarketplaceInventory = async () => {
 try {
 const { data: fetchOutputPayload, error: queryHandshakeError } = await supabase
 .from("ai_agents")
 .select(
 "id, name, agent_key, description, category, message_credit_cost, total_conversations, average_rating, avatar_url, owner_kind, is_featured",
 )
 .eq("marketplace_status", "approved")
 .eq("visibility", "public")
 .eq("is_active", true)
 .order("is_featured", { ascending: false })
 .order("total_conversations", { ascending: false })
 .limit(120);

 if (!isThreadActiveAndValid) return;

 if (queryHandshakeError || !fetchOutputPayload) {
 setAgentsRegistryPayload([]);
 } else {
 setAgentsRegistryPayload(fetchOutputPayload as unknown as MarketAgent[]);
 }
 } catch (fatalPipelineCrashPayload) {
 if (isThreadActiveAndValid) setAgentsRegistryPayload([]);
 } finally {
 if (isThreadActiveAndValid) setIsDataLayerLoading(false);
 }
 };

 synchronizeMarketplaceInventory();

 return () => {
 isThreadActiveAndValid = false;
 };
 }, []);

 // =========================================================================
 // LIFECYCLE SECTOR 2: MEMOIZED PARAMETER FILTER COMPILER
 // =========================================================================
 const processedFilteredAgentsArray = React.useMemo<MarketAgent[]>(() => {
 const sanitizedQueryStr = textSearchQueryInput.trim().toLowerCase();

 return agentsRegistryPayload.filter((agentItemNode) => {
 const parsedCategoryMatch = (agentItemNode.category ?? "").toLowerCase();
 if (activeCategoryFilter !== "all" && parsedCategoryMatch !== activeCategoryFilter) {
 return false;
 }

 if (sanitizedQueryStr) {
 const compositeSearchIndexStr = `${agentItemNode.name} ${agentItemNode.description}`.toLowerCase();
 if (!compositeSearchIndexStr.includes(sanitizedQueryStr)) {
 return false;
 }
 }

 return true;
 });
 }, [agentsRegistryPayload, textSearchQueryInput, activeCategoryFilter]);

 const extractedFeaturedAgentsArray = React.useMemo<MarketAgent[]>(() => {
 return processedFilteredAgentsArray.filter((agentItem) => agentItem.is_featured).slice(0, 3);
 }, [processedFilteredAgentsArray]);

 return (
 <div className="container max-w-5xl px-4 py-6 space-y-5 pb-24 text-left antialiased block transform-gpu w-full">
 {/* HUD LEVEL 1: DIRECTORY INDEX PLATFORM HEADER */}
 <header className="space-y-1 block leading-none select-none pointer-events-none border-b border-border/10 pb-4 w-full shrink-0">
 <div className="flex items-center gap-2 leading-none w-full shrink-0">
 <Sparkles className="h-5 w-5 text-primary stroke-[2.2] shrink-0 animate-pulse" />
 <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-foreground pt-0.5">
 AI Agent Procurement Marketplace
 </h1>
 </div>
 <p className="text-xs sm:text-sm font-semibold text-muted-foreground/60 leading-normal block">
 Deploy specialised computational expert modules instantly. Operates on localized credit draw paths — zero
 ongoing membership obligations.
 </p>
 </header>

 {/* HUD LEVEL 2: LIVE TEXT ENTRY FILTER BOARD */}
 <div className="relative w-full block shrink-0">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 stroke-[2.2] select-none pointer-events-none" />
 <Input
 type="search"
 value={textSearchQueryInput}
 onChange={(eventObj) => setTextSearchQueryInput(eventObj.target.value)}
 placeholder="Filter active deployments by variant type, moniker, or utility domain focus..."
 className="w-full h-9 pl-9 pr-3 bg-background/50 border border-border/40 text-xs sm:text-sm rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-ring"
 />
 </div>

 {/* HUD LEVEL 3: TAB CATEGORY SELECTION CONTROL STRUT */}
 <div className="w-full block shrink-0">
 <Tabs value={activeCategoryFilter} onValueChange={setActiveCategoryFilter} className="w-full">
 <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/30 border border-border/10 p-1 rounded-xl justify-start w-full">
 {CATEGORIES_DIRECTORY.map((categoryKeyItem) => (
 <TabsTrigger
 key={`marketplace-category-trigger-${categoryKeyItem}`}
 value={categoryKeyItem}
 className="capitalize h-7 px-3 rounded-lg text-[10px] sm:text-xs font-mono font-extrabold uppercase tracking-wide border border-transparent data-[state=active]:bg-background data-[state=active]:border-border/10 data-[state=active]:text-foreground data-[state=active]:shadow-2xs transition-all cursor-pointer outline-none"
 >
 {categoryKeyItem}
 </TabsTrigger>
 ))}
 </TabsList>
 </Tabs>
 </div>

 {/* HUD LEVEL 4: GRID RESOLUTION SWITCH VIEWPORTS */}
 {isDataLayerLoading ? (
 <div
 role="status"
 className="w-full flex items-center justify-center py-16 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/50 select-none pointer-events-none gap-2.5"
 >
 <InlineSpinner size="sm" />
 <span>Loading agents...</span>
 </div>
 ) : processedFilteredAgentsArray.length === 0 ? (
 <Card className="rounded-xl border border-dashed border-border/60 bg-card/20 p-10 text-center select-none block mt-2">
 <CardContent className="p-0 text-center text-sm text-muted-foreground/60 space-y-2.5 block leading-none w-full">
 <Bot className="h-6 w-6 text-muted-foreground/30 mx-auto stroke-[2.2] pointer-events-none" />
 <p className="text-xs font-semibold mt-2 max-w-xs mx-auto leading-normal">
 No specialty computational agents match the requested token filter criteria.
 </p>
 </CardContent>
 </Card>
 ) : (
 <div className="space-y-6 block w-full">
 {/* FEATURED SPECIALIST ALIGNMENT GRIDS */}
 {extractedFeaturedAgentsArray.length > 0 && activeCategoryFilter === "all" && !textSearchQueryInput && (
 <section className="space-y-2 block w-full">
 <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-primary select-none block leading-none pb-2 border-b border-border/5">
 Curated Enterprise Allocations
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 mt-3 block w-full">
 {extractedFeaturedAgentsArray.map((featuredAgentItem) => (
 <AgentTile
 key={`featured-agent-cell-row-${featuredAgentItem.id}`}
 agent={featuredAgentItem}
 featured
 />
 ))}
 </div>
 </section>
 )}

 {/* MASTER REGISTRY ARCHIVE LISTINGS */}
 <section className="space-y-2 block w-full">
 <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5">
 Verified Operational Agents ({processedFilteredAgentsArray.length.toString()})
 </h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mt-3 block w-full">
 {processedFilteredAgentsArray.map((standardAgentItem) => (
 <AgentTile key={`standard-agent-cell-row-${standardAgentItem.id}`} agent={standardAgentItem} />
 ))}
 </div>
 </section>
 </div>
 )}
 </div>
 );
}

// =========================================================================
// ATOMIC INTERFACE NODE: COMPONENT ENTRY DATA CARD INFRASTRUCTURE
// =========================================================================
function AgentTile({ agent, featured }: AgentTileProps) {
 return (
 <Link
 to={`/app/agents/${agent.agent_key}`}
 className="group block rounded-lg outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring overflow-hidden h-full flex flex-col"
 >
 <Card
 className={cn(
 "rounded-lg border border-border/60 bg-card hover:border-border-foreground/10 transition-colors duration-100 flex flex-col flex-1 shadow-none overflow-hidden",
 featured && "border-primary/20 bg-primary/[0.01] hover:border-primary/40",
 )}
 >
 <CardContent className="p-4 flex flex-col flex-1 justify-between gap-3.5 leading-none w-full block">
 <div className="flex items-start gap-3.5 w-full block leading-none">
 {/* Identity Icon Canvas Framing Slots */}
 <div className="h-10 w-10 rounded-lg bg-background border border-border/40 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden select-none pointer-events-none">
 {agent.avatar_url ? (
 <img src={agent.avatar_url} alt="" className="h-full w-full object-cover block" />
 ) : (
 <Bot className="h-4.5 w-4.5 text-primary stroke-[2.2]" />
 )}
 </div>

 {/* Context Header Label Configurations */}
 <div className="flex-1 min-w-0 leading-none space-y-1 block">
 <div className="flex items-center gap-2 flex-wrap leading-none">
 <h3 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate block pt-0.5 uppercase tracking-wide max-w-[140px] sm:max-w-xs">
 {agent.name}
 </h3>

 {featured && (
 <Badge
 variant="outline"
 className="font-mono text-[8px] font-black uppercase px-1.5 h-4 border-primary/20 bg-primary/5 text-primary select-none shrink-0 pointer-events-none leading-none tracking-wide pt-0.5 rounded-xs"
 >
 FEATURED
 </Badge>
 )}
 {agent.owner_kind === "talent" && (
 <Badge
 variant="secondary"
 className="font-mono text-[8px] font-black uppercase px-1.5 h-4 border border-transparent text-muted-foreground bg-muted/60 select-none shrink-0 pointer-events-none leading-none tracking-wide pt-0.5 rounded-xs"
 >
 COMMUNITY
 </Badge>
 )}
 </div>

 {agent.description && (
 <p className="text-[11px] font-medium text-muted-foreground/70 leading-normal block select-text line-clamp-2 pr-0.5 pt-0.5">
 {agent.description}
 </p>
 )}
 </div>
 </div>

 {/* Foot Execution Volume Metrics Bar */}
 <div className="flex items-center gap-3.5 font-mono text-sm font-medium text-muted-foreground/40 border-t border-border/5 pt-2.5 w-full shrink-0 select-none pointer-events-none leading-none tabular-nums uppercase tracking-tight">
 <span className="flex items-center gap-1.5 shrink-0">
 <Coins className="h-3.5 w-3.5 text-muted-foreground/50 stroke-[2]" />
 <span>{agent.message_credit_cost.toLocaleString()} CR/MSG</span>
 </span>
 <span className="flex items-center gap-1.5 shrink-0">
 <MessageCircle className="h-3.5 w-3.5 text-muted-foreground/50 stroke-[2]" />
 <span>{agent.total_conversations ?? 0} RUNS</span>
 </span>
 {agent.average_rating ? (
 <span className="flex items-center gap-1.5 text-amber-500 shrink-0">
 <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 stroke-[2]" />
 <span>{agent.average_rating.toFixed(1)}</span>
 </span>
 ) : null}
 </div>
 </CardContent>
 </Card>
 </Link>
 );
}
