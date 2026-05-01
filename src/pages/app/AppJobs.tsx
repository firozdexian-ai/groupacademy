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
import { PAGE_SHELL_WIDE, PAGE_TITLE, PAGE_SUBTITLE } from "@/lib/uiTokens";

interface JobWithSalary extends JobCardData {
  salary_range_min?: number | null;
  salary_range_max?: number | null;
  salary_currency?: string | null;
}

export default function AppJobs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSaved, toggleSave } = useSavedItems();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>(
    searchParams.get("type") ? [searchParams.get("type")!] : [],
  );

  const targetCompany = searchParams.get("company");
  const targetLocation = searchParams.get("location");
  const sortOrder = searchParams.get("sort") || "newest";

  const [jobs, setJobs] = useState<JobWithSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [selectedExpLevels, setSelectedExpLevels] = useState<string[]>([]);
  const [salaryRange, setSalaryRange] = useState([0]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 50;

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

  const fetchJobs = useCallback(
    async (pageNum = 0, append = false) => {
      if (!append) { setLoading(true); setError(null); } else { setLoadingMore(true); }
      try {
        const from = pageNum * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        let query = supabase
          .from("jobs")
          .select(`id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline, salary_range_min, salary_range_max, salary_currency`)
          .eq("is_active", true)
          .or("deadline.is.null,deadline.gte.now()");
        if (targetCompany) query = query.ilike("company_name", `%${targetCompany}%`);
        if (targetLocation && targetLocation !== "abroad") query = query.ilike("location", `%${targetLocation}%`);
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
      } finally { setLoading(false); setLoadingMore(false); }
    },
    [targetCompany, targetLocation, sortOrder],
  );

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchSearch =
        !debouncedSearch ||
        job.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        job.company_name.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchType = selectedJobTypes.length === 0 || selectedJobTypes.includes(job.job_type);
      const normalizedExpLevel = job.experience_level?.replace("_level", "") || job.experience_level;
      const matchExp = selectedExpLevels.length === 0 ||
        selectedExpLevels.some((sel) => sel.replace("_level", "") === normalizedExpLevel);
      const minSalaryK = salaryRange[0];
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
      return matchSearch && matchType && matchExp && matchSalary && matchLocationFilter;
    });
  }, [jobs, debouncedSearch, selectedJobTypes, selectedExpLevels, salaryRange, targetLocation]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedJobTypes([]);
    setSelectedExpLevels([]);
    setSalaryRange([0]);
    setSearchParams({}, { replace: true });
  };

  const activeFilterCount = selectedJobTypes.length + selectedExpLevels.length + (salaryRange[0] > 0 ? 1 : 0);

  return (
    <div className={PAGE_SHELL_WIDE}>
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/jobs")} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <h1 className={PAGE_TITLE}>{targetCompany ? `${targetCompany} jobs` : "All jobs"}</h1>
        </div>
        <p className={PAGE_SUBTITLE}>
          {loading ? "Loading…" : `${filteredJobs.length} open positions`}
        </p>
      </header>

      {/* Search + filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title or company…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-9 text-sm rounded-xl"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 rounded-xl gap-1.5 relative">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-96">
            <SheetHeader>
              <SheetTitle className="text-base">Filters</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-180px)] pr-3 mt-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Job type</Label>
                  <div className="space-y-1.5">
                    {Object.entries(JOB_TYPES).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/40 cursor-pointer">
                        <Checkbox
                          checked={selectedJobTypes.includes(key)}
                          onCheckedChange={() => {
                            const active = selectedJobTypes.includes(key);
                            setSelectedJobTypes(active ? selectedJobTypes.filter((t) => t !== key) : [...selectedJobTypes, key]);
                          }}
                        />
                        <span className="text-sm">{value.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <Label className="text-xs font-semibold">Min salary</Label>
                    <span className="text-xs text-muted-foreground">
                      {salaryRange[0] > 0 ? `$${salaryRange[0]}k+` : "Any"}
                    </span>
                  </div>
                  <Slider value={salaryRange} onValueChange={setSalaryRange} max={150} step={5} />
                </div>
              </div>
            </ScrollArea>
            <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border/40 flex-row gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters} className="flex-1 h-9 rounded-lg">Clear</Button>
              <Button size="sm" onClick={() => setIsFilterOpen(false)} className="flex-1 h-9 rounded-lg">Apply</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="rounded-2xl border border-border/40">
              <CardContent className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs match your filters"
          description="Try removing some filters to see more results."
          action={{ label: "Clear filters", onClick: clearFilters }}
        />
      ) : (
        <div className="space-y-2">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSaved={isSaved(job.id, "job")}
              onSaveToggle={() => toggleSave(job.id, "job")}
              onClick={() => navigate(`/app/jobs/${job.id}`)}
            />
          ))}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg gap-1.5"
                onClick={() => fetchJobs(page + 1, true)}
                disabled={loadingMore}
              >
                <RefreshCw className={loadingMore ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
