import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Search,
  Building2,
  MapPin,
  Clock,
  Briefcase,
  Star,
  ArrowRight,
  X,
  Filter,
  SlidersHorizontal,
  Banknote,
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

// --- Types ---
interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string | null;
  job_type: string;
  experience_level: string;
  is_featured: boolean;
  created_at: string;
  salary_range_min?: number;
  salary_range_max?: number;
}

const JOB_TYPES: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
  remote: "Remote",
};

const EXPERIENCE_LEVELS = [
  { id: "entry_level", label: "Entry Level" },
  { id: "mid_level", label: "Mid Level" },
  { id: "senior_level", label: "Senior Level" },
  { id: "executive", label: "Executive" },
];

const JOB_TYPE_COLORS: Record<string, string> = {
  full_time: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  part_time: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  contract: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  internship: "bg-green-500/10 text-green-600 dark:text-green-400",
  freelance: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  remote: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

// --- Job Card Component ---
const JobCard = ({ job, onClick }: { job: Job; onClick: () => void }) => (
  <Card
    className="cursor-pointer overflow-hidden hover:shadow-md transition-all hover:border-primary/50 group h-full flex flex-col"
    onClick={onClick}
  >
    <CardContent className="p-5 flex flex-col h-full">
      <div className="flex gap-4">
        {/* Logo */}
        <div className="shrink-0">
          {job.company_logo_url ? (
            <img
              src={job.company_logo_url}
              alt={job.company_name}
              className="w-12 h-12 rounded-xl object-cover border bg-muted"
              loading="lazy"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          )}
        </div>

        {/* Header Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            {job.is_featured && (
              <Badge className="shrink-0 bg-yellow-500/10 text-yellow-700 border-yellow-500/20 px-1.5 h-5 text-[10px]">
                <Star className="w-3 h-3 fill-current mr-1" /> Featured
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">{job.company_name}</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="mt-4 space-y-2 flex-1">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className={`text-[10px] h-6 px-2 border-0 ${JOB_TYPE_COLORS[job.job_type]}`}>
            <Clock className="w-3 h-3 mr-1" /> {JOB_TYPES[job.job_type] || job.job_type}
          </Badge>
          {job.salary_range_min && (
            <Badge variant="outline" className="text-[10px] h-6 px-2 text-muted-foreground bg-muted/30">
              <Banknote className="w-3 h-3 mr-1" />
              {job.salary_range_min / 1000}k - {job.salary_range_max ? `${job.salary_range_max / 1000}k` : ""}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {job.location || "Remote"}
          </div>
          <div className="capitalize">{job.experience_level.replace("_", " ")}</div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          Posted {new Date(job.created_at).toLocaleDateString()}
        </span>
        <div className="flex items-center text-xs font-medium text-primary group-hover:underline">
          View Details <ArrowRight className="ml-1 w-3 h-3" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// --- Main Page ---
export default function AppJobs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
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
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    setJobs(data || []);
    setLoading(false);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchSearch =
        !debouncedSearch ||
        job.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        job.company_name.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchType = selectedJobTypes.length === 0 || selectedJobTypes.includes(job.job_type);
      const matchExp = selectedExpLevels.length === 0 || selectedExpLevels.includes(job.experience_level);
      const matchSalary =
        salaryRange[0] === 0 || (job.salary_range_max ? job.salary_range_max >= salaryRange[0] * 1000 : true);
      
      // International filter: match jobs with international/abroad/overseas keywords or remote type
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

  return (
    // 1. WIDENED CONTAINER: max-w-7xl instead of max-w-2xl
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => navigate("/app/feed")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Find Your Next Role</h1>
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
              placeholder="Search by role, company, location..."
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
              <ScrollArea className="h-[calc(100vh-120px)] pr-4 mt-4">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label>Job Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(JOB_TYPES).map(([k, l]) => (
                        <div key={k} className="flex items-center space-x-2">
                          <Checkbox
                            id={k}
                            checked={selectedJobTypes.includes(k)}
                            onCheckedChange={(c) =>
                              c
                                ? setSelectedJobTypes([...selectedJobTypes, k])
                                : setSelectedJobTypes(selectedJobTypes.filter((t) => t !== k))
                            }
                          />
                          <label htmlFor={k} className="text-sm">
                            {l}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Experience</Label>
                    <div className="grid grid-cols-1 gap-3">
                      {EXPERIENCE_LEVELS.map((l) => (
                        <div key={l.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={l.id}
                            checked={selectedExpLevels.includes(l.id)}
                            onCheckedChange={(c) =>
                              c
                                ? setSelectedExpLevels([...selectedExpLevels, l.id])
                                : setSelectedExpLevels(selectedExpLevels.filter((x) => x !== l.id))
                            }
                          />
                          <label htmlFor={l.id} className="text-sm">
                            {l.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
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
              <SheetFooter className="mt-4">
                <Button variant="outline" className="w-full" onClick={clearFilters}>
                  Clear
                </Button>
                <Button className="w-full" onClick={() => setIsFilterOpen(false)}>
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
              {JOB_TYPES[t]}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setSelectedJobTypes((prev) => prev.filter((x) => x !== t))}
              />
            </Badge>
          ))}
          {salaryRange[0] > 0 && (
            <Badge variant="secondary" className="gap-1">
              Min ৳{salaryRange[0]}k<X className="w-3 h-3 cursor-pointer" onClick={() => setSalaryRange([0])} />
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      )}

      {/* 2. GRID LAYOUT: 1 col mobile, 2 col tablet, 3 col desktop */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-48">
              <CardContent className="p-5 space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Briefcase className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-bold text-lg">No jobs found</h3>
            <Button variant="link" onClick={clearFilters}>
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
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <JobCard job={job} onClick={() => navigate(`/app/jobs/${job.id}`)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
