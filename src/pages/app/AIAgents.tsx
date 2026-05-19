import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bot, Search, Sparkles, MessageCircle, Inbox, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/ai-agents/AgentCard";
import { AgentFilters, AgentCategory } from "@/components/ai-agents/AgentFilters";
import { BannerCarousel } from "@/components/BannerCarousel";
import { supabase } from "@/integrations/supabase/client";
import { AI_AGENTS, getAgentById } from "@/lib/constants/agents";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC CONTRACT INTERFACES
// =========================================================================
interface DBAgentStats {
  id: string;
  agent_key: string;
  name: string;
  description: string;
  icon: string | null;
  color: string | null;
  bg_color: string | null;
  expertise_areas: string[] | null;
  is_active: boolean;
  credit_cost: number | null;
  category: string | null;
  avatar_url: string | null;
  agent_type: string | null;
  is_featured: boolean | null;
  total_users?: number | null;
  total_messages?: number | null;
  avg_rating?: number | null;
}

interface TransformedAgent {
  id: string;
  agent_key: string;
  name: string;
  description: string;
  icon: LucideIcon | undefined;
  bgColor: string;
  color: string;
  expertise: string[];
  creditCost: number;
  category: AgentCategory;
  avatarUrl: string | null;
  isCompanyAgent: boolean;
  isFeatured: boolean;
  users: number;
  rating: number;
}

/**
 * GroUp Academy: Technical AI Agent Discovery Marketplace (AIAgents)
 * Hardened responsive listing directory tracking dynamic metadata maps and neutralizing skeleton layout shifts.
 * Version: Launch Candidate · Phase Z1 Production Contract Locked
 */
export default function AIAgents() {
  const executeNavigationHook = useNavigate();
  const [textSearchQueryInput, setTextSearchQueryInput] = React.useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState<AgentCategory>("all");

  // =========================================================================
  // DATA ACQUISITION PIPELINE SECURED VIA TANSTACK CACHE CHANNEL
  // =========================================================================
  const { data: dbAgentsRegistry = [], isLoading: isRegistryCacheResolving } = useQuery<DBAgentStats[]>({
    queryKey: ["ai-agents-marketplace-stats"],
    queryFn: async (): Promise<DBAgentStats[]> => {
      const { data: databaseOutputPayload, error: queryHandshakeError } = await supabase
        .from("ai_agents_with_stats")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("total_users", { ascending: false });

      if (queryHandshakeError) throw queryHandshakeError;
      return (databaseOutputPayload as unknown as DBAgentStats[]) ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // =========================================================================
  // SANITIZED TRANSACTION DATA COMPILERS
  // =========================================================================
  const compiledTransformedAgents = React.useMemo<TransformedAgent[]>(() => {
    const baselineInventorySource = dbAgentsRegistry.length > 0 
      ? dbAgentsRegistry 
      : (AI_AGENTS as unknown as DBAgentStats[]);

    return baselineInventorySource.map((agentRecordItem) => {
      const isDatabaseInstantiatedNode = "agent_key" in agentRecordItem;
      const targetIdentificationKeyStr = isDatabaseInstantiatedNode ? agentRecordItem.agent_key : (agentRecordItem as any).id;
      const verifiedStaticMetaRecord = getAgentById(targetIdentificationKeyStr);

      return {
        id: agentRecordItem.id,
        agent_key: targetIdentificationKeyStr,
        name: agentRecordItem.name,
        description: agentRecordItem.description,
        icon: verifiedStaticMetaRecord?.icon,
        bgColor: isDatabaseInstantiatedNode ? agentRecordItem.bg_color || "#2A7DDE" : "#2A7DDE",
        color: isDatabaseInstantiatedNode ? agentRecordItem.color || "#2A7DDE" : "#2A7DDE",
        expertise: isDatabaseInstantiatedNode ? agentRecordItem.expertise_areas || [] : [],
        creditCost: isDatabaseInstantiatedNode ? agentRecordItem.credit_cost ?? 1 : 1,
        category: (isDatabaseInstantiatedNode ? agentRecordItem.category || "career" : "career") as AgentCategory,
        avatarUrl: isDatabaseInstantiatedNode ? agentRecordItem.avatar_url : null,
        isCompanyAgent: isDatabaseInstantiatedNode ? agentRecordItem.agent_type === "company" : false,
        isFeatured: isDatabaseInstantiatedNode ? !!agentRecordItem.is_featured : false,
        users: Number(agentRecordItem.total_users) || 0,
        rating: Number(agentRecordItem.avg_rating) || 0,
      };
    });
  }, [dbAgentsRegistry]);

  const processedFilteredAgents = React.useMemo<TransformedAgent[]>(() => {
    const sanitizedQueryStr = textSearchQueryInput.trim().toLowerCase();

    return compiledTransformedAgents.filter((transformedAgentNode) => {
      const matchSearchFieldsFlag =
        !sanitizedQueryStr ||
        transformedAgentNode.name.toLowerCase().includes(sanitizedQueryStr) ||
        transformedAgentNode.expertise.some((expertiseTagStr) => expertiseTagStr.toLowerCase().includes(sanitizedQueryStr));

      const matchCategoryClassificationFlag =
        selectedCategoryFilter === "all" ||
        (selectedCategoryFilter === "company" 
          ? transformedAgentNode.isCompanyAgent 
          : transformedAgentNode.category === selectedCategoryFilter);

      return matchSearchFieldsFlag && matchCategoryClassificationFlag;
    });
  }, [compiledTransformedAgents, textSearchQueryInput, selectedCategoryFilter]);

  const memoizedFeaturedAgents = React.useMemo<TransformedAgent[]>(() => {
    return compiledTransformedAgents.filter((agentItem) => agentItem.isFeatured).slice(0, 8);
  }, [compiledTransformedAgents]);

  const isCompanyTabLinkAvailable = React.useMemo<boolean>(() => {
    return compiledTransformedAgents.some((agentItem) => agentItem.isCompanyAgent);
  }, [compiledTransformedAgents]);

  // =========================================================================
  // CALLBACK OPTIMIZATION CONTROLLERS
  // =========================================================================
  const handleViewProfileRouteRedirect = React.useCallback((targetKeyStr: string) => {
    executeNavigationHook(`/app/agents/${targetKeyStr}/profile`);
  }, [executeNavigationHook]);

  const handleMessageRouteRedirect = React.useCallback((targetKeyStr: string) => {
    executeNavigationHook(`/app/messages/${targetKeyStr}`);
  }, [executeNavigationHook]);

  const handleNavigationToInbox = React.useCallback(() => {
    executeNavigationHook("/app/messages");
  }, [executeNavigationHook]);

  return (
    <div className="max-w-3xl mx-auto pb-24 text-left antialiased block transform-gpu w-full">
      
      {/* HUD LEVEL 1: APPLICATION HEADER BAR WITH SYSTEM CONTROL PANEL */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/40 px-3 py-2.5 space-y-2 select-none w-full shrink-0 block">
        <div className="flex items-center justify-between gap-4 leading-none w-full">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-2xs pointer-events-none">
              <Bot className="h-4 w-4 text-primary-foreground stroke-[2.2]" />
            </div>
            <div className="min-w-0 leading-none">
              <h1 className="text-sm sm:text-base font-bold uppercase tracking-wide text-foreground truncate block pt-0.5">
                Agent Marketplace Registry
              </h1>
              <p className="text-[10px] font-mono font-bold text-muted-foreground/50 uppercase block tracking-wider leading-none mt-0.5">
                Localize Verified Core Specialty AI Operators
              </p>
            </div>
          </div>
          
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleNavigationToInbox}
            className="h-8 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider gap-1.5 cursor-pointer shrink-0 shadow-2xs pt-0.5"
          >
            <MessageCircle className="h-3.5 w-3.5 text-muted-foreground/60 stroke-[2.2]" /> 
            <span>Communication Inbox</span>
          </Button>
        </div>
        
        {/* Real-time Text Ingress Search Control Layer */}
        <div className="relative w-full block shrink-0 pt-0.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 stroke-[2.2] pointer-events-none" />
          <Input
            type="search"
            placeholder="Search agents by moniker designation, focus category, or field criteria..."
            value={textSearchQueryInput}
            onChange={(e) => setTextSearchQueryInput(e.target.value)}
            className="h-9 pl-9 pr-3 bg-muted/40 border-none text-xs sm:text-sm rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </header>

      {/* HUD LEVEL 2: DYNAMIC LIST EXPLORER VIEWPORT AREA */}
      <div className="px-3 py-3 space-y-4 block w-full">
        
        {/* Marketplace Banner Display Deck */}
        <BannerCarousel placement="agents_marketplace" />

        <AgentFilters
          selectedCategory={selectedCategoryFilter}
          onCategoryChange={setSelectedCategoryFilter}
          showCompanyTab={isCompanyTabLinkAvailable}
        />

        {/* HUD LEVEL 3: FEATURED ALLOCATION STRIP COMPILER */}
        {!textSearchQueryInput && selectedCategoryFilter === "all" && memoizedFeaturedAgents.length > 0 && (
          <section className="block w-full">
            <div className="flex items-center gap-1.5 mb-2 px-1 select-none pointer-events-none leading-none">
              <Sparkles className="h-3.5 w-3.5 text-primary stroke-[2.2] shrink-0 animate-pulse" />
              <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 pt-0.5 leading-none">
                Curated Specialty Modules
              </h2>
            </div>
            
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-3 px-3 pb-1 w-full block scrollbar-none transform-gpu shrink-0">
              {memoizedFeaturedAgents.map((featuredAgentNode) => (
                <div key={`featured-agent-strip-cell-${featuredAgentNode.agent_key}`} className="w-[160px] shrink-0 block">
                  <AgentCard
                    {...featuredAgentNode}
                    onViewProfile={() => handleViewProfileRouteRedirect(featuredAgentNode.agent_key)}
                    onMessage={() => handleMessageRouteRedirect(featuredAgentNode.agent_key)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* HUD LEVEL 4: GRID DIRECTORY COMPILER SWITCHPORTS */}
        <section className="block w-full">
          <div className="flex items-center justify-between mb-2 px-1 border-b border-border/5 pb-2 select-none pointer-events-none leading-none w-full shrink-0">
            <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 leading-none">
              {textSearchQueryInput ? "Filtered Search Results" : "Verified Operator Listings"}
            </h2>
            <span className="font-mono text-[10px] font-bold text-muted-foreground/40 tabular-nums uppercase leading-none">
              {processedFilteredAgents.length.toString()} Operators Resolved
            </span>
          </div>

          {isRegistryCacheResolving ? (
            // Symmetric layout placeholders matching core card grid shapes perfectly
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 block w-full">
              {Array.from({ length: 6 }).map((_, skeletonCardIdx) => (
                <div 
                  key={`marketplace-card-loading-skeleton-${skeletonCardIdx}`}
                  className="h-36 rounded-lg border border-border/40 p-4 space-y-3 bg-card/10 block w-full select-none pointer-events-none shrink-0 animate-pulse"
                >
                  <div className="flex items-center gap-2.5 block w-full">
                    <Skeleton className="h-9 w-9 rounded-md shrink-0 block" />
                    <div className="flex-1 min-w-0 space-y-1 block">
                      <Skeleton className="h-3.5 w-2/3 rounded-xs block" />
                      <Skeleton className="h-2.5 w-1/3 rounded-xs block" />
                    </div>
                  </div>
                  <div className="space-y-1.5 block w-full pt-1">
                    <Skeleton className="h-3 w-full rounded-xs block" />
                    <Skeleton className="h-3 w-4/5 rounded-xs block" />
                  </div>
                </div>
              ))}
            </div>
          ) : processedFilteredAgents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-8 text-center select-none block mt-2">
              <Inbox className="h-6 w-6 text-muted-foreground/30 mx-auto stroke-[2.2] pointer-events-none" />
              <p className="text-xs font-semibold text-muted-foreground/60 leading-normal mt-2 max-w-xs mx-auto">
                No custom agent blueprints logged matching the specified parameter token constraints.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 block w-full align-top">
              {processedFilteredAgents.map((agentItemNode) => (
                <AgentCard
                  key={`marketplace-master-grid-card-${agentItemNode.agent_key}`}
                  {...agentItemNode}
                  onViewProfile={() => handleViewProfileRouteRedirect(agentItemNode.agent_key)}
                  onMessage={() => handleMessageRouteRedirect(agentItemNode.agent_key)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}