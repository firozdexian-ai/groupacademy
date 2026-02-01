import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSavedItems } from "@/hooks/useSavedItems";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Search,
  Briefcase,
  X,
  SlidersHorizontal,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { JOB_TYPES, EXPERIENCE_LEVELS, getJobTypeLabel, getExperienceLevelLabel } from "@/lib/constants/jobTypes";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";

// Extended job data with additional fields
interface JobWithSalary extends JobCardData {
  salary_range_min?: number | null;
  salary_range_max?: number | null;
}

export default function AppJobs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSaved, toggleSave } = useSavedItems();

  // State
  const [jobs, setJobs] = useState<JobWithSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>(
    searchParams.get("type") ? [searchParams.get("type")!] : []
  );
  const [selectedExpLevels, setSelectedExpLevels] = useState<string[]>([]);
  const [salaryRange, setSalaryRange] = useState([0]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isInternational, setIsInternational] = useState(searchParams.get("location") === "abroad");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      const newParams = new URLSearchParams(searchParams);
      if (searchQuery) newParams.set("search", searchQuery);
      else newParams.delete("search");
      setSearchParams(newParams, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = supabase
        .from("jobs")
        .select("id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline, salary_range_min, salary_range_max")
        .eq("is_active", true)
        .or("deadline.is.null,deadline.gte.now()")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      const { data, error: fetchError } = await withTimeout(
        Promise.resolve(query),
        TIMEOUTS.DEFAULT,
        "Request timed out. Please check your connection."
      );

      if (fetchError) throw fetchError;
      setJobs((data as JobWithSalary[]) || []);
    } catch (err: any) {
      console.error("Error loading jobs:", err);
      setError(err.message || "Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchSearch =
        !debouncedSearch ||
        job.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        job.company_name.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchType = selectedJobTypes.length === 0 || selectedJobTypes.includes(job.job_type);
      
      // Normalize experience level for matching
      const normalizedExpLevel = job.experience_level?.replace('_level', '') || job.experience_level;
      const matchExp = selectedExpLevels.length === 0 || 
        selectedExpLevels.includes(job.experience_level) ||
        selectedExpLevels.some(sel => sel.replace('_level', '') === normalizedExpLevel);
      
      const matchSalary =
        salaryRange[0] === 0 || (job.salary_range_max ? job.salary_range_max >= salaryRange[0] * 1000 : true);

      const matchLocation = !isInternational ||
        (job.location?.toLowerCase().includes("remote") ||
          job.location?.toLowerCase().includes("international") ||
          job.location?.toLowerCase().includes("abroad") ||
          job.location?.toLowerCase().includes("overseas") ||
          job.job_type === "remote");

      return matchSearch && matchType && matchExp && matchSalary && matchLocation;
    });
  }, [jobs, debouncedSearch, selectedJobTypes, selectedExpLevels, salaryRange, isInternational]);

  const activeFiltersCount = selectedJobTypes.length + selectedExpLevels.length + (salaryRange[0] > 0 ? 1 : 0) + (isInternational ? 1 : 0);
  
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedJobTypes([]);
    setSelectedExpLevels([]);
    setSalaryRange([0]);
    setIsInternational(false);
    setSearchParams({}, { replace: true });
  };

  // Get unique experience levels from constants
  const expLevelOptions = [
    { id: "entry_level", label: "Entry Level" },
    { id: "mid_level", label: "Mid Level" },
    { id: "senior_level", label: "Senior Level" },
    { id: "executive", label: "Executive" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/jobs")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">All Jobs</h1>
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading..." : `${filteredJobs.length} open positions`}
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex gap-2 w-full md:w-auto md:min-w-[400px]">
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by role, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-background"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-11 px-4 border-dashed relative">
                <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Refine your job search</SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-180px)] pr-4 mt-4">
                <div className="space-y-6">
                  {/* Job Type */}
                  <div className="space-y-3">
                    <Label>Job Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(JOB_TYPES).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={key}
                            checked={selectedJobTypes.includes(key)}
                            onCheckedChange={(c) =>
                              c
                                ? setSelectedJobTypes([...selectedJobTypes, key])
                                : setSelectedJobTypes(selectedJobTypes.filter((t) => t !== key))
                            }
                          />
                          <label htmlFor={key} className="text-sm cursor-pointer">
                            {value.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="space-y-3">
                    <Label>Experience Level</Label>
                    <div className="grid grid-cols-1 gap-3">
                      {expLevelOptions.map((level) => (
                        <div key={level.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={level.id}
                            checked={selectedExpLevels.includes(level.id)}
                            onCheckedChange={(c) =>
                              c
                                ? setSelectedExpLevels([...selectedExpLevels, level.id])
                                : setSelectedExpLevels(selectedExpLevels.filter((x) => x !== level.id))
                            }
                          />
                          <label htmlFor={level.id} className="text-sm cursor-pointer">
                            {level.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Salary */}
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Label>Min Salary</Label>
                      <span className="text-sm text-muted-foreground">
                        {salaryRange[0] > 0 ? `৳${salaryRange[0]}k+` : "Any"}
                      </span>
                    </div>
                    <Slider value={salaryRange} onValueChange={setSalaryRange} max={150} step={5} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>150k+</span>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <SheetFooter className="mt-4 gap-2">
                <Button variant="outline" className="flex-1" onClick={clearFilters}>
                  Clear All
                </Button>
                <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>
                  Show Results
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active Filters Row */}
      {activeFiltersCount > 0 && (
        <div className="flex gap-2 flex-wrap">
          {isInternational && (
            <Badge variant="secondary" className="gap-1 bg-cyan-500/10 text-cyan-700">
              🌍 International
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => {
                  setIsInternational(false);
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete("location");
                  setSearchParams(newParams, { replace: true });
                }}
              />
            </Badge>
          )}
          {selectedJobTypes.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1">
              {getJobTypeLabel(t)}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setSelectedJobTypes((prev) => prev.filter((x) => x !== t))}
              />
            </Badge>
          ))}
          {selectedExpLevels.map((l) => (
            <Badge key={l} variant="secondary" className="gap-1">
              {getExperienceLevelLabel(l)}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setSelectedExpLevels((prev) => prev.filter((x) => x !== l))}
              />
            </Badge>
          ))}
          {salaryRange[0] > 0 && (
            <Badge variant="secondary" className="gap-1">
              Min ৳{salaryRange[0]}k
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSalaryRange([0])} />
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      )}

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-48">
              <CardContent className="p-4 space-y-4">
                <div className="flex gap-3">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm border border-destructive/20">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="font-bold text-lg mb-2">Failed to load jobs</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">{error}</p>
            <Button onClick={fetchJobs} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
          </CardContent>
        </Card>
      ) : filteredJobs.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Briefcase className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-bold text-lg mb-2">No jobs found</h3>
            <p className="text-muted-foreground text-sm mb-4">Try adjusting your filters or search terms</p>
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
          {filteredJobs.map((job, index) => (
            <div
              key={job.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-backwards"
              style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
            >
              <JobCard
                job={job}
                variant="default"
                isSaved={isSaved(job.id, 'job')}
                onSaveToggle={() => toggleSave(job.id, 'job')}
                onClick={() => navigate(`/app/jobs/${job.id}`)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
