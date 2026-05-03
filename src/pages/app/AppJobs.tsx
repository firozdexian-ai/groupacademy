import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { JOB_TYPES } from "@/lib/constants/jobTypes";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL_WIDE } from "@/lib/uiTokens";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Job Listings Marketplace
 * CTO Audit: Applied 2024 Clean SaaS aesthetic (soft UI, friendly typography).
 * Bypassed editor markdown parser bug using Array.of() and .at() methods.
 */

interface JobWithSalary extends JobCardData {
  salary_range_min?: number | null;
  salary_range_max?: number | null;
  salary_currency?: string | null;
}

const SKELETON_ITEMS = Array.from({ length: 4 }, (_, i) => i + 1);

export default function AppJobs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSaved, toggleSave } = useSavedItems();

  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState<string>(searchQuery);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>(
    searchParams.get("type") ? Array.of(searchParams.get("type") as string) : [],
  );

  const targetCompany = searchParams.get("company");
  const targetLocation = searchParams.get("location");
  const sortOrder = searchParams.get("sort") || "newest";

  const [jobs, setJobs] = useState<JobWithSalary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);
  const [selectedExpLevels, setSelectedExpLevels] = useState<string[]>([]);

  // CTO FIX: Bypassing markdown parser with Array.of
  const [salaryRange, setSalaryRange] = useState<number[]>(Array.of(0));
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const PAGE_SIZE = 50;

  // CTO FIX: Safely extracting the first array item without using bracket notation
  const safeSalaryRange = salaryRange || Array.of(0);
  const rawSalary = Array.isArray(safeSalaryRange) ? safeSalaryRange.at(0) : safeSalaryRange;
  const minSalaryK: number = typeof rawSalary === "number" && !isNaN(rawSalary) ? rawSalary : 0;

  // Debounce Search Input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      const newParams = new URLSearchParams(searchParams);
      if (searchQuery) newParams.set("search", searchQuery);
      else newParams.delete("search");
      setSearchParams(newParams, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, setSearchParams, searchParams]);

  // Server-Side Querying
  const fetchJobs = useCallback(
    async (pageNum: number = 0, append: boolean = false) => {
      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      try {
        const from = pageNum * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from("jobs")
          .select(
            `id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline, salary_range_min, salary_range_max, salary_currency`,
          )
          .eq("is_active", true)
          .or("deadline.is.null,deadline.gte.now()");

        if (targetCompany) query = query.ilike("company_name", `%${targetCompany}%`);
        if (targetLocation && targetLocation !== "abroad") query = query.ilike("location", `%${targetLocation}%`);
        if (debouncedSearch) {
          query = query.or(`title.ilike.%${debouncedSearch}%,company_name.ilike.%${debouncedSearch}%`);
        }
        if (selectedJobTypes.length > 0) {
          query = query.in("job_type", selectedJobTypes as any[]);
        }

        if (sortOrder === "hot") query = query.order("is_featured", { ascending: false });
        else if (sortOrder === "expiring") query = query.order("deadline", { ascending: true });

        const { data, error } = await query.order("created_at", { ascending: false }).range(from, to);
        if (error) throw error;

        const newJobs = (data as JobWithSalary[]) || [];
        setHasMore(newJobs.length === PAGE_SIZE);
        setJobs((prev) => (append ? [...prev, ...newJobs] : newJobs));
        setPage(pageNum);
      } catch (err: any) {
        setError(err.message || "Couldn't load jobs.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [targetCompany, targetLocation, sortOrder, debouncedSearch, selectedJobTypes],
  );

  useEffect(() => {
    fetchJobs(0, false);
  }, [fetchJobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const normalizedExpLevel = job.experience_level?.replace("_level", "") || job.experience_level;
      const matchExp =
        selectedExpLevels.length === 0 ||
        selectedExpLevels.some((sel) => sel.replace("_level", "") === normalizedExpLevel);

      let matchSalary = true;
      if (minSalaryK > 0 && job.salary_range_max) {
        const thresholdInUSD = minSalaryK * 1000;
        const jobMaxInUSD = job.salary_currency === "BDT" ? job.salary_range_max / 110 : job.salary_range_max;
        matchSalary = jobMaxInUSD >= thresholdInUSD;
      }

      const matchLocationFilter =
        targetLocation !== "abroad" ||
        ["remote", "international", "abroad", "overseas"].some((term) => job.location?.toLowerCase().includes(term)) ||
        job.job_type === "remote";

      return matchExp && matchSalary && matchLocationFilter;
    });
  }, [jobs, selectedExpLevels, minSalaryK, targetLocation]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedJobTypes([]);
    setSelectedExpLevels([]);
    // CTO FIX: Bypassing markdown parser
    setSalaryRange(Array.of(0));
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const activeSalaryFilterCount = minSalaryK > 0 ? 1 : 0;
  const activeFilterCount = selectedJobTypes.length + selectedExpLevels.length + activeSalaryFilterCount;

  return (
    <div className={cn(PAGE_SHELL_WIDE, "max-w-4xl mx-auto space-y-6")}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/app/jobs")}
        className="gap-2 -ml-3 text-muted-foreground hover:text-foreground font-medium rounded-full"
      >
        <ArrowLeft className="h-4 w-4" /> Back to hub
      </Button>

      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
            <Briefcase className="h-5 w-5 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {targetCompany ? `${targetCompany} Openings` : "Discover Opportunities"}
          </h1>
        </div>
        <p className="text-muted-foreground text-base">
          {loading ? "Searching our database…" : `Found ${filteredJobs.length} open positions matching your criteria.`}
        </p>
      </header>

      {/* 2024 Clean SaaS Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
          <Input
            placeholder="Search by job title or company…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 pr-11 h-12 text-base rounded-full border-border/40 bg-card shadow-sm focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-muted-foreground hover:bg-muted"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="h-12 px-6 rounded-full gap-2 border-border/40 shadow-sm hover:bg-muted/50 font-medium relative"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[400px] border-l border-border/20 shadow-2xl">
            <SheetHeader>
              <SheetTitle className="text-xl font-bold">Refine Results</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-180px)] pr-4 mt-6">
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">Work Type</Label>
                  <div className="space-y-2">
                    {Object.entries(JOB_TYPES).map(([key, value]) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:bg-muted/50 hover:border-border/40 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedJobTypes.includes(key)}
                          onCheckedChange={() => {
                            const active = selectedJobTypes.includes(key);
                            setSelectedJobTypes(
                              active ? selectedJobTypes.filter((t) => t !== key) : [...selectedJobTypes, key],
                            );
                          }}
                          className="rounded-md data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <span className="text-sm font-medium">{value.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <Label className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">
                      Minimum Salary
                    </Label>
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                      {minSalaryK > 0 ? `$${minSalaryK}k+` : "Any"}
                    </span>
                  </div>
                  <div className="pt-2">
                    <Slider
                      value={Array.of(minSalaryK)}
                      onValueChange={(val) => setSalaryRange(Array.isArray(val) ? val : Array.of(val))}
                      max={150}
                      step={5}
                      className="[&_[role=slider]]:border-blue-600 [&_[role=slider]]:bg-blue-600"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
            <SheetFooter className="absolute bottom-0 left-0 right-0 p-5 bg-background/80 backdrop-blur-md border-t border-border/20 flex-row gap-3">
              <Button variant="ghost" onClick={clearFilters} className="flex-1 h-11 rounded-full font-medium">
                Clear All
              </Button>
              <Button
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 h-11 rounded-full bg-blue-600 hover:bg-blue-700 font-semibold shadow-md"
              >
                Show Results
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-3">
          {SKELETON_ITEMS.map((i) => (
            <Card key={i} className="rounded-2xl border border-border/20 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-2/3 rounded-md" />
                <Skeleton className="h-4 w-1/3 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="pt-8 pb-12">
          <EmptyState
            icon={Briefcase}
            title="No matches found"
            description="We couldn't find any positions that match your current search and filters."
            action={{ label: "Clear filters", onClick: clearFilters }}
          />
        </div>
      ) : (
        <div className="space-y-3 pb-10">
          {filteredJobs.map((job) => (
            <div key={job.id} className="transition-transform duration-200 hover:-translate-y-0.5">
              <JobCard
                job={job}
                isSaved={isSaved(job.id, "job")}
                onSaveToggle={() => toggleSave(job.id, "job")}
                onClick={() => navigate(`/app/jobs/${job.id}`)}
              />
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-6">
              <Button
                variant="outline"
                className="h-11 px-8 rounded-full gap-2 font-medium border-border/40 hover:bg-muted/50"
                onClick={() => fetchJobs(page + 1, true)}
                disabled={loadingMore}
              >
                <RefreshCw className={cn("h-4 w-4 text-muted-foreground", loadingMore && "animate-spin")} />
                {loadingMore ? "Loading..." : "Load more positions"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
