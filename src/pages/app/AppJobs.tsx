import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { searchPublicActiveJobs } from "@/domains/jobs/repo/jobsRepo";
import { useSavedItems } from "@/hooks/useSavedItems";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search, Briefcase, X, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JobCard, type JobCardData } from "@/domains/jobs/components/JobCard";
import { JOB_TYPES } from "@/lib/constants/jobTypes";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL_WIDE } from "@/lib/uiTokens";
import { cn } from "@/lib/utils";

interface JobWithSalary extends JobCardData {
 salary_range_min?: number | null;
 salary_range_max?: number | null;
 salary_currency?: string | null;
}

const SKELETONS = [1, 2, 3, 4];
const PAGE_SIZE = 50;

/**
 * All jobs — filterable search surface.
 * Used by /app/jobs/all (header "View all" + tab-overflow deep links).
 */
export default function AppJobs() {
 const navigate = useNavigate();
 const [params, setParams] = useSearchParams();
 const { isSaved, toggleSave } = useSavedItems();

 const [query, setQuery] = React.useState<string>(params.get("search") || params.get("q") || "");
 const [debouncedQuery, setDebouncedQuery] = React.useState<string>(query);

 const [selectedTypes, setSelectedTypes] = React.useState<string[]>(() => {
 const t = params.get("type");
 return t ? [t] : [];
 });

 const [selectedExpLevels, setSelectedExpLevels] = React.useState<string[]>([]);
 const [minSalaryK, setMinSalaryK] = React.useState<number>(0);
 const [filtersOpen, setFiltersOpen] = React.useState<boolean>(false);

 const [jobs, setJobs] = React.useState<JobWithSalary[]>([]);
 const [loading, setLoading] = React.useState<boolean>(true);
 const [loadingMore, setLoadingMore] = React.useState<boolean>(false);
 const [page, setPage] = React.useState<number>(0);
 const [hasMore, setHasMore] = React.useState<boolean>(true);

 const companyFilter = params.get("company");
 const locationFilter = params.get("location") || params.get("city");
 const sort = params.get("sort") || "newest";

 // Debounce the text search and reflect it into the URL.
 React.useEffect(() => {
 const t = setTimeout(() => {
 setDebouncedQuery(query);
 const next = new URLSearchParams(window.location.search);
 if (query.trim()) next.set("search", query.trim());
 else next.delete("search");
 next.delete("q");
 setParams(next, { replace: true });
 }, 300);
 return () => clearTimeout(t);
 }, [query, setParams]);

 const fetchJobs = React.useCallback(
 async (targetPage = 0, append = false) => {
 if (!append) setLoading(true);
 else setLoadingMore(true);

 try {
 const from = targetPage * PAGE_SIZE;
 const to = from + PAGE_SIZE - 1;

 const result = await searchPublicActiveJobs(
 {
 company: companyFilter ?? null,
 location: locationFilter ?? null,
 search: debouncedQuery ?? null,
 jobTypes: selectedTypes,
 sort: sort === "hot" ? "hot" : sort === "expiring" ? "expiring" : null,
 },
 from,
 to,
 );

 const rows = (result as unknown as JobWithSalary[]) || [];
 setHasMore(rows.length === PAGE_SIZE);
 setJobs((prev) => (append ? [...prev, ...rows] : rows));
 setPage(targetPage);
 } catch (err) {
 console.error("Failed to load jobs:", err);
 } finally {
 setLoading(false);
 setLoadingMore(false);
 }
 },
 [companyFilter, locationFilter, sort, debouncedQuery, selectedTypes],
 );

 React.useEffect(() => {
 fetchJobs(0, false);
 }, [fetchJobs]);

 const filteredJobs = React.useMemo<JobWithSalary[]>(() => {
 return jobs.filter((job) => {
 const normalizedLevel = job.experience_level?.replace("_level", "") || job.experience_level;
 const matchesExperience =
 selectedExpLevels.length === 0 ||
 selectedExpLevels.some((lvl) => lvl.replace("_level", "") === normalizedLevel);

 let matchesSalary = true;
 if (minSalaryK > 0 && job.salary_range_max) {
 const minUsd = minSalaryK * 1000;
 const maxUsd = job.salary_currency === "BDT" ? job.salary_range_max / 110 : job.salary_range_max;
 matchesSalary = maxUsd >= minUsd;
 }

 const matchesLocationScope =
 locationFilter !== "abroad" ||
 ["remote", "international", "abroad", "overseas"].some((term) =>
 job.location?.toLowerCase().includes(term),
 ) ||
 job.job_type === "remote";

 return matchesExperience && matchesSalary && matchesLocationScope;
 });
 }, [jobs, selectedExpLevels, minSalaryK, locationFilter]);

 const clearFilters = React.useCallback(() => {
 setQuery("");
 setSelectedTypes([]);
 setSelectedExpLevels([]);
 setMinSalaryK(0);
 setParams(new URLSearchParams(), { replace: true });
 }, [setParams]);

 const backToHub = React.useCallback(() => navigate("/app/jobs"), [navigate]);

 const activeFilterCount = selectedTypes.length + selectedExpLevels.length + (minSalaryK > 0 ? 1 : 0);

 return (
 <div className={cn(PAGE_SHELL_WIDE, "max-w-4xl mx-auto space-y-6 text-left antialiased w-full")}>
 {/* Back to hub */}
 <div className="w-full">
 <Button
 type="button"
 variant="ghost"
 size="sm"
 onClick={backToHub}
 className="h-8 px-3 rounded-full text-xs gap-1.5 text-muted-foreground hover:text-foreground -ml-3"
 >
 <ArrowLeft className="h-3.5 w-3.5" />
 <span>Jobs Hub</span>
 </Button>
 </div>

 {/* Header */}
 <header className="space-y-1 w-full">
 <div className="flex items-center gap-3.5 w-full">
 <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 shrink-0 text-primary">
 <Briefcase className="h-5 w-5" />
 </div>
 <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate max-w-[240px] sm:max-w-xl">
 {companyFilter ? `${companyFilter} jobs` : "All jobs"}
 </h1>
 </div>
 <p className="text-xs sm:text-sm text-muted-foreground pl-[3.4rem]">
 {loading
 ? "Loading jobs…"
 : `${filteredJobs.length} ${filteredJobs.length === 1 ? "job" : "jobs"} matching your filters.`}
 </p>
 </header>

 {/* Search + filters */}
 <div className="flex gap-3 w-full items-center">
 <div className="relative flex-1 h-10">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
 <Input
 type="search"
 placeholder="Search by title, company or skill…"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 className="w-full h-10 pl-9 pr-9 text-sm rounded-lg"
 />
 {query && (
 <Button
 type="button"
 variant="ghost"
 size="icon"
 className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
 onClick={() => setQuery("")}
 aria-label="Clear search"
 >
 <X className="h-3.5 w-3.5" />
 </Button>
 )}
 </div>

 <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
 <SheetTrigger asChild>
 <Button
 type="button"
 variant="outline"
 className="h-10 px-4 rounded-lg text-xs font-semibold border-border/60 gap-1.5 relative shrink-0"
 >
 <SlidersHorizontal className="h-3.5 w-3.5" />
 <span>Filters</span>
 {activeFilterCount > 0 && (
 <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[18px] px-1 rounded bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center border border-background tabular-nums">
 {activeFilterCount}
 </span>
 )}
 </Button>
 </SheetTrigger>

 <SheetContent side="right" className="w-full sm:w-[380px] overflow-hidden border-l border-border/60 bg-popover/95 ">
 <SheetHeader className="text-left pb-3 border-b border-border/10">
 <SheetTitle className="text-sm font-bold text-foreground">Filters</SheetTitle>
 </SheetHeader>

 <ScrollArea className="h-[calc(100vh-160px)] pr-2 mt-4 w-full">
 <div className="space-y-6 w-full pb-16">
 {/* Job type */}
 <div className="space-y-2.5 w-full">
 <Label className="text-xs font-medium text-muted-foreground/60 tracking-wide pb-1 border-b border-border/5 mb-1.5 block">
 Job type
 </Label>
 <div className="space-y-1 w-full">
 {Object.entries(JOB_TYPES).map(([key, cfg]) => (
 <label
 key={`filter-type-${key}`}
 className="flex items-center justify-between gap-4 p-2 rounded-lg border border-transparent hover:bg-muted/40 hover:border-border/10 cursor-pointer w-full"
 >
 <span className="text-xs font-medium text-foreground/80">{cfg.label}</span>
 <Checkbox
 checked={selectedTypes.includes(key)}
 onCheckedChange={() => {
 const isSel = selectedTypes.includes(key);
 setSelectedTypes((prev) =>
 isSel ? prev.filter((t) => t !== key) : [...prev, key],
 );
 }}
 className="rounded-sm h-4 w-4 border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
 />
 </label>
 ))}
 </div>
 </div>

 {/* Min salary */}
 <div className="space-y-3 w-full">
 <div className="flex justify-between items-center w-full">
 <Label className="text-xs font-medium text-muted-foreground/60 tracking-wide">
 Minimum salary
 </Label>
 <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 tabular-nums">
 {minSalaryK > 0 ? `$${minSalaryK}K+` : "Any"}
 </span>
 </div>
 <div className="pt-2 w-full px-1">
 <Slider
 value={[minSalaryK]}
 onValueChange={(v) => {
 const n = Array.isArray(v) ? v[0] : v;
 setMinSalaryK(Number(n) || 0);
 }}
 max={150}
 step={5}
 className="cursor-pointer"
 />
 </div>
 </div>
 </div>
 </ScrollArea>

 <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background/95 border-t border-border/20 flex flex-row gap-3 w-full">
 <Button
 type="button"
 variant="ghost"
 onClick={clearFilters}
 className="flex-1 h-9 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground"
 >
 Reset
 </Button>
 <Button
 type="button"
 onClick={() => setFiltersOpen(false)}
 className="flex-1 h-9 rounded-lg text-xs font-bold"
 >
 Apply
 </Button>
 </SheetFooter>
 </SheetContent>
 </Sheet>
 </div>

 {/* Results */}
 {loading ? (
 <div className="space-y-2 w-full">
 {SKELETONS.map((i) => (
 <Card key={`skeleton-${i}`} className="rounded-lg border border-border/40 shadow-none bg-card/10 animate-pulse">
 <CardContent className="p-4 space-y-2">
 <Skeleton className="h-4 w-1/2 rounded-sm" />
 <Skeleton className="h-3 w-1/4 rounded-sm" />
 </CardContent>
 </Card>
 ))}
 </div>
 ) : filteredJobs.length === 0 ? (
 <div className="pt-6 w-full">
 <EmptyState
 icon={Briefcase}
 title="No jobs match those filters"
 description="Try clearing some filters or broaden your search."
 action={{ label: "Clear filters", onClick: clearFilters }}
 />
 </div>
 ) : (
 <div className="space-y-2 pb-12 w-full">
 {filteredJobs.map((job) => (
 <div key={`job-${job.id}`} className="transition-transform duration-150 hover:-translate-y-0.5 w-full">
 <JobCard
 job={job}
 isSaved={isSaved(job.id, "job")}
 onSaveToggle={() => toggleSave(job.id, "job")}
 onClick={() => navigate(`/app/jobs/${job.id}`)}
 />
 </div>
 ))}

 {hasMore && (
 <div className="flex justify-center pt-4 w-full">
 <Button
 type="button"
 variant="outline"
 disabled={loadingMore}
 onClick={() => fetchJobs(page + 1, true)}
 className="h-9 px-6 rounded-lg text-xs font-semibold border-border/60 gap-2 disabled:opacity-50"
 >
 <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", loadingMore && "animate-spin")} />
 <span>{loadingMore ? "Loading…" : "Load more jobs"}</span>
 </Button>
 </div>
 )}
 </div>
 )}
 </div>
 );
}
