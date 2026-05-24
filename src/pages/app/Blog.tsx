import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listPublishedBlogPostCards } from "@/domains/marketing/repo/marketingRepo";
import { FileText, Clock, ArrowLeft, Search, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL_WIDE, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT } from "@/lib/uiTokens";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface BlogPostRecord {
 id: string;
 title: string;
 slug: string;
 excerpt: string | null;
 category: string | null;
 featured_image: string | null;
 is_featured: boolean | null;
 published_at: string | null;
 reading_time_mins: number | null;
 status: string;
}

const CATEGORIES_DIRECTORY = [
 "All",
 "Career Tips",
 "Industry Insights",
 "Skills Development",
 "Job Search",
 "Interview Prep",
];
const SKELETON_ITEMS_ROSTER = [1, 2, 3];

/**
 * GroUp Academy: Authoritative Knowledge Insights Registry (Blog)
 * Hardened responsive content discovery panel securing search input debounces and neutralizing CLS visual shift jitters.
 * Version: Launch Candidate · Phase Z1 Production Type Contract Sealed
 */
export default function Blog() {
 const navigateHook = useNavigate();
 const [textSearchInputStr, setTextSearchInputStr] = React.useState<string>("");
 const [debouncedSearchQueryStr, setDebouncedSearchQueryStr] = React.useState<string>("");
 const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState<string>("All");

 // =========================================================================
 // LIFECYCLE SECTOR 1: DEBOUNCED SEARCH CONTROLLER LANES
 // =========================================================================
 React.useEffect(() => {
 const filteringDebounceTimerToken = setTimeout(() => {
 setDebouncedSearchQueryStr(textSearchInputStr.trim());
 }, 300);

 return () => clearTimeout(filteringDebounceTimerToken);
 }, [textSearchInputStr]);

 // =========================================================================
 // DATA ACQUISITION PIPELINE SECURED VIA TANSTACK CACHE CHANNEL
 // =========================================================================
 const { data: blogPostsPayload = [], isLoading: isRegistryCacheResolving } = useQuery<BlogPostRecord[]>({
 queryKey: ["app-blog-posts-registry", selectedCategoryFilter, debouncedSearchQueryStr],
 queryFn: async (): Promise<BlogPostRecord[]> => {
 const data = await listPublishedBlogPostCards({
 category: selectedCategoryFilter,
 search: debouncedSearchQueryStr,
 });
 return (data as unknown as BlogPostRecord[]) ?? [];
 },
 staleTime: 10 * 60 * 1000,
 });

 const handlePurgeFiltersAction = React.useCallback(() => {
 setTextSearchInputStr("");
 setDebouncedSearchQueryStr("");
 setSelectedCategoryFilter("All");
 }, []);

 const handleReturnToHubRedirect = React.useCallback(() => {
 navigateHook("/app/learning");
 }, [navigateHook]);

 const handleNavigateToArticleDetail = React.useCallback(
 (articleSlugStr: string) => {
 navigateHook(`/app/learning/blog/${articleSlugStr}`);
 },
 [navigateHook],
 );

 return (
 <div
 className={cn(PAGE_SHELL_WIDE, "max-w-4xl mx-auto space-y-5 text-left antialiased block transform-gpu w-full")}
 >
 {/* HUD LEVEL 1: HUB STICKY NAV RECONCILIATION COMMAND HEADER */}
 <div className="block select-none leading-none w-full shrink-0">
 <Button
 type="button"
 variant="ghost"
 size="sm"
 onClick={handleReturnToHubRedirect}
 className="h-8 px-2.5 rounded-md font-bold uppercase tracking-wide text-xs gap-1 cursor-pointer text-muted-foreground hover:text-foreground -ml-2"
 >
 <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5]" /> <span>Return to Hub</span>
 </Button>
 </div>

 {/* HUD LEVEL 2: DIRECTORY INDEX PLATFORM HEADER */}
 <header className="space-y-1 block select-none pointer-events-none border-b border-border/10 pb-3 w-full shrink-0 leading-none">
 <div className="flex items-center gap-2 leading-none w-full block">
 <FileText className="h-4.5 w-4.5 text-primary stroke-[2.2] shrink-0" />
 <h1
 className={cn(
 PAGE_TITLE,
 "text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground pt-0.5 block truncate",
 )}
 >
 Industry Insights & Briefs
 </h1>
 </div>
 <p
 className={cn(
 PAGE_SUBTITLE,
 "text-xs sm:text-sm font-semibold text-muted-foreground/60 leading-none block pt-0.5",
 )}
 >
 Algorithmic career telemetry tracking, architectural trends overview, and interview strategy briefings.
 </p>
 </header>

 {/* HUD LEVEL 3: LIVE TEXT ENTRY FILTER BOARD */}
 <div className="relative w-full block shrink-0">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 stroke-[2.2] select-none pointer-events-none" />
 <Input
 type="search"
 placeholder="Filter publication database by article keyword moniker, summary, or category index..."
 value={textSearchInputStr}
 onChange={(e) => setTextSearchInputStr(e.target.value)}
 className="w-full h-9 pl-9 pr-3 bg-background border border-border/40 text-xs sm:text-sm font-semibold rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-ring"
 />
 </div>

 {/* HUD LEVEL 4: TAB SECTION CONTROL CONTROL FOR WRAPPED SELECTIONS */}
 <div className="flex flex-wrap gap-1.5 select-none leading-none block w-full shrink-0">
 {CATEGORIES_DIRECTORY.map((categoryKeyStr) => {
 const isCategoryActiveFlag = selectedCategoryFilter === categoryKeyStr;

 return (
 <button
 key={`insights-filter-tab-trigger-${categoryKeyStr}`}
 type="button"
 onClick={() => setSelectedCategoryFilter(categoryKeyStr)}
 className={cn(
 "h-7 px-3 rounded-md font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide border transition-all cursor-pointer outline-none shadow-3xs pt-0.5",
 isCategoryActiveFlag
 ? "border-primary bg-primary text-primary-foreground font-black"
 : "border-border/60 bg-background text-muted-foreground/70 hover:border-border hover:text-foreground",
 )}
 >
 {categoryKeyStr}
 </button>
 );
 })}
 </div>

 {/* HUD LEVEL 5: DATA ARCHIVE CONDITIONAL GRID COMPILERS */}
 {isRegistryCacheResolving ? (
 <div className="space-y-2.5 block w-full select-none pointer-events-none">
 {SKELETON_ITEMS_ROSTER.map((idxNum) => (
 <div
 key={`insights-skeleton-row-item-${idxNum}`}
 className="h-24 rounded-lg border border-border/40 p-4 bg-card/10 block w-full animate-pulse space-y-2"
 >
 <Skeleton className="h-4 w-2/3 rounded-xs block" />
 <Skeleton className="h-3 w-1/3 rounded-xs block" />
 </div>
 ))}
 </div>
 ) : blogPostsPayload.length > 0 ? (
 <div className="space-y-2.5 block w-full align-top">
 {blogPostsPayload.map((postItemNode) => (
 <Card
 key={`insights-registry-article-card-${postItemNode.id}`}
 className={cn(
 CARD,
 "rounded-lg border border-border/60 bg-card hover:border-border-foreground/10 transition-colors duration-100 shadow-none overflow-hidden cursor-pointer block w-full",
 )}
 onClick={() => handleNavigateToArticleDetail(postItemNode.slug)}
 >
 <div className="flex items-stretch leading-none w-full block">
 {postItemNode.featured_image && (
 <div className="w-20 sm:w-24 shrink-0 overflow-hidden select-none pointer-events-none border-r border-border/10 bg-muted/40 block">
 <img src={postItemNode.featured_image} alt="" className="w-full h-full object-cover block" />
 </div>
 )}

 <div className="flex-1 p-3.5 leading-none space-y-2 block min-w-0 flex flex-col justify-between">
 <div className="space-y-1 block leading-none w-full">
 <div className="flex items-start justify-between gap-4 leading-none w-full block">
 <h3 className="text-xs sm:text-sm font-bold text-foreground leading-snug uppercase tracking-wide block select-text pt-0.5 truncate max-w-[200px] sm:max-w-xl">
 {postItemNode.title}
 </h3>
 {postItemNode.is_featured && (
 <Badge
 variant="outline"
 className="font-mono text-[8px] font-black uppercase px-1.5 h-4 border-amber-500/20 bg-amber-500/5 text-amber-600 tracking-wide pt-0 select-none pointer-events-none shrink-0 rounded-xs leading-none"
 >
 FEATURED
 </Badge>
 )}
 </div>

 {postItemNode.excerpt && (
 <p className="text-[11px] sm:text-xs font-medium text-muted-foreground/70 leading-normal block select-text line-clamp-2 pr-2">
 {postItemNode.excerpt}
 </p>
 )}
 </div>

 {/* Operational Telemetry Sub-Row Labels */}
 <div className="flex items-center gap-3 font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight flex-wrap select-none pointer-events-none leading-none pt-1 tabular-nums w-full shrink-0">
 {postItemNode.category && (
 <Badge
 variant="secondary"
 className="font-mono text-[8px] font-extrabold uppercase px-1 h-3.5 text-muted-foreground/50 border border-transparent tracking-tight rounded-xs pt-0 leading-none shrink-0"
 >
 {postItemNode.category.toUpperCase()}
 </Badge>
 )}

 {postItemNode.published_at && (
 <span className="flex items-center gap-1 shrink-0">
 <Calendar className="h-3 w-3 stroke-[2.2]" />
 <span>{format(new Date(postItemNode.published_at), "MMM d").toUpperCase()}</span>
 </span>
 )}

 <span className="flex items-center gap-1 shrink-0">
 <Clock className="h-3 w-3 stroke-[2.2]" />
 <span>{(postItemNode.reading_time_mins || 3).toString()} MIN READ</span>
 </span>

 <ArrowRight className="h-3 w-3 text-muted-foreground/30 stroke-[2.5] ml-auto shrink-0 transition-transform group-hover:translate-x-0.5" />
 </div>
 </div>
 </div>
 </Card>
 ))}
 </div>
 ) : (
 <div className="block w-full">
 <EmptyState
 icon={FileText}
 title="Registry Filter Cleared"
 description="No brief analysis descriptions found matching the requested filter query conditions matrix."
 action={{ label: "Reset Filtering Coordinates", onClick: handlePurgeFiltersAction }}
 />
 </div>
 )}
 </div>
 );
}
