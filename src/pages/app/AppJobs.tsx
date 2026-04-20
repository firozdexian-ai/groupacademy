import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSavedItems } from "@/hooks/useSavedItems";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search, Briefcase, X, SlidersHorizontal, RefreshCw, Zap, Target } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { JOB_TYPES } from "@/lib/constants/jobTypes";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Career Market Registry
 * Orchestrates high-fidelity role discovery with debounced telemetry.
 * 2026 Standard: Executive Logic geometry with glassmorphic filter layers.
 */

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
  const [error, setError] = useState<string | null>(null);
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
            `
            id, title, company_name, company_logo_url, location, job_type, 
            experience_level, is_featured, created_at, deadline, 
            salary_range_min, salary_range_max, salary_currency
          `,
          )
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
        setError(err.message || "Registry Handshake Failure.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [targetCompany, targetLocation, sortOrder],
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchSearch =
        !debouncedSearch ||
        job.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        job.company_name.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchType = selectedJobTypes.length === 0 || selectedJobTypes.includes(job.job_type);

      const normalizedExpLevel = job.experience_level?.replace("_level", "") || job.experience_level;
      const matchExp =
        selectedExpLevels.length === 0 ||
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10 min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Registry Header: Discovery Context */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-12 w-12 hover:bg-primary/10 transition-all active:scale-90"
            onClick={() => navigate("/app/jobs")}
          >
            <ArrowLeft className="h-6 w-6 text-primary" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">
              {targetCompany ? `${targetCompany} Registry` : "Market Registry"}
            </h1>
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/5 text-primary border-primary/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic">
                {loading ? "Scanning Neural Feed..." : `${filteredJobs.length} Artifacts Discovered`}
              </Badge>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
                Secure Handshake Active
              </p>
            </div>
          </div>
        </div>

        {/* Search Console */}
        <div className="flex gap-3 w-full md:w-auto md:min-w-[480px]">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Initialize discovery sequence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-card/50 backdrop-blur-sm border-2 border-border/40 rounded-2xl font-bold tracking-tight focus-visible:ring-primary/10 transition-all shadow-inner"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button className="h-14 w-14 rounded-2xl bg-primary shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                <SlidersHorizontal className="h-6 w-6" />
                {selectedJobTypes.length + selectedExpLevels.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-lg bg-emerald-500 border-2 border-background flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                    !
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:w-[440px] bg-background/80 backdrop-blur-2xl border-l-2 border-border/40"
            >
              <SheetHeader className="pb-8 border-b border-border/10">
                <SheetTitle className="text-2xl font-black uppercase tracking-tighter">Refine Discovery</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-220px)] pr-6 mt-8">
                <div className="space-y-10">
                  <div className="space-y-4">
                    <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                      Job Type Logic
                    </Label>
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(JOB_TYPES).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/40 group hover:border-primary/40 transition-all cursor-pointer"
                          onClick={() => {
                            const active = selectedJobTypes.includes(key);
                            setSelectedJobTypes(
                              active ? selectedJobTypes.filter((t) => t !== key) : [...selectedJobTypes, key],
                            );
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <Checkbox checked={selectedJobTypes.includes(key)} className="h-5 w-5 rounded-lg" />
                            <span className="text-sm font-bold uppercase tracking-tight">{value.label}</span>
                          </div>
                          <Briefcase className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary/40" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-primary text-left">
                        Salary Telemetry
                      </Label>
                      <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest italic">
                        {salaryRange[0] > 0 ? `$${salaryRange[0]}k+ Threshold` : "Open Scale"}
                      </span>
                    </div>
                    <Slider value={salaryRange} onValueChange={setSalaryRange} max={150} step={5} className="py-4" />
                  </div>
                </div>
              </ScrollArea>
              <SheetFooter className="absolute bottom-0 left-0 right-0 p-8 bg-background/50 border-t border-border/10 flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2"
                  onClick={clearFilters}
                >
                  Purge Filters
                </Button>
                <Button
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
                  onClick={() => setIsFilterOpen(false)}
                >
                  Engage Logic
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Grid Viewport: Neural Registry */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="rounded-[32px] overflow-hidden border-2 border-muted/20 bg-muted/5">
              <CardContent className="p-8 space-y-6">
                <Skeleton className="h-16 w-16 rounded-[24px] bg-muted/40" />
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4 bg-muted/40" />
                  <Skeleton className="h-4 w-full bg-muted/40" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-40 text-center animate-in zoom-in-95 duration-700">
          <div className="h-24 w-24 rounded-[40px] bg-muted/10 flex items-center justify-center mx-auto mb-8 border-2 border-dashed border-border/40 rotate-3">
            <Target className="h-12 w-12 text-muted-foreground/20" />
          </div>
          <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Registry Mismatch</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic mb-10">
            No role artifacts found for this logic sequence.
          </p>
          <Button
            variant="outline"
            className="rounded-xl px-10 h-12 font-black uppercase tracking-widest text-[10px] border-2"
            onClick={clearFilters}
          >
            Clear Logic Handshake
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
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
            <div className="col-span-full flex justify-center py-12">
              <Button
                variant="outline"
                className="rounded-2xl h-14 px-12 border-2 font-black uppercase tracking-widest text-[10px] hover:bg-primary/5 transition-all"
                onClick={() => fetchJobs(page + 1, true)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <RefreshCw className="h-5 w-5 animate-spin mr-3" />
                ) : (
                  <Zap className="h-5 w-5 mr-3 text-primary" />
                )}
                Sync More Artifacts
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
