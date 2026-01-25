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
  Banknote,
  SlidersHorizontal,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const JOB_TYPE_COLORS: Record<string, string> = {
  full_time: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  part_time: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  contract: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  internship: "bg-green-500/10 text-green-600 dark:text-green-400",
  freelance: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  remote: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

const EXPERIENCE_LEVELS = [
  { id: "entry_level", label: "Entry Level" },
  { id: "mid_level", label: "Mid Level" },
  { id: "senior_level", label: "Senior Level" },
  { id: "executive", label: "Executive" },
];

const JobCard = ({ job, onClick, style }: { job: Job; onClick: () => void; style?: React.CSSProperties }) => (
  <Card
    className="cursor-pointer overflow-hidden hover:shadow-md transition-all press-scale group border-border/50"
    style={style}
    onClick={onClick}
  >
    <CardContent className="p-4">
      <div className="flex gap-4">
        {/* Company Logo */}
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

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            {job.is_featured && (
              <Badge className="shrink-0 gap-1 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 h-5 text-[10px] px-1.5">
                <Star className="w-2.5 h-2.5 fill-current" />
                Featured
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{job.company_name}</p>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={`text-[10px] font-medium h-5 px-2 border-0 ${JOB_TYPE_COLORS[job.job_type] || "bg-secondary text-secondary-foreground"}`}
            >
              <Clock className="w-2.5 h-2.5 mr-1" />
              {JOB_TYPES[job.job_type] || job.job_type.replace("_", " ")}
            </Badge>

            {job.salary_range_min && (
              <Badge variant="outline" className="text-[10px] h-5 px-2 text-muted-foreground bg-muted/30">
                <Banknote className="w-2.5 h-2.5 mr-1" />
                {job.salary_range_min / 1000}k - {job.salary_range_max ? `${job.salary_range_max / 1000}k` : ""}
              </Badge>
            )}

            {job.experience_level && (
              <span className="text-[10px] text-muted-foreground capitalize border px-1.5 py-0.5 rounded-sm bg-background">
                {job.experience_level.replace("_", " ")}
              </span>
            )}
          </div>

          {job.location && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" /> {job.location}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="self-center hidden sm:flex">
          <div className="w-8 h-8 rounded-full bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function AppJobs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state sync
  const initialSearch = searchParams.get("search") || "";

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  // Filter States
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedExpLevels, setSelectedExpLevels] = useState<string[]>([]);
  const [salaryRange, setSalaryRange] = useState([0]); // Min salary filter
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Debounce search input
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

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, salary_range_min, salary_range_max",
        )
        .eq("is_active", true)
        .or("deadline.is.null,deadline.gte.now()")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Advanced Filtering Logic
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Search Text
      const matchesSearch =
        !debouncedSearch ||
        job.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        job.company_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (job.location && job.location.toLowerCase().includes(debouncedSearch.toLowerCase()));

      // 2. Job Type
      const matchesType = selectedJobTypes.length === 0 || selectedJobTypes.includes(job.job_type);

      // 3. Experience Level
      const matchesExp = selectedExpLevels.length === 0 || selectedExpLevels.includes(job.experience_level);

      // 4. Salary (Min Check)
      // If user sets slider to 20k, show jobs where max salary >= 20k
      const matchesSalary =
        salaryRange[0] === 0 || (job.salary_range_max ? job.salary_range_max >= salaryRange[0] * 1000 : true);

      return matchesSearch && matchesType && matchesExp && matchesSalary;
    });
  }, [jobs, debouncedSearch, selectedJobTypes, selectedExpLevels, salaryRange]);

  const activeFiltersCount = selectedJobTypes.length + selectedExpLevels.length + (salaryRange[0] > 0 ? 1 : 0);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedJobTypes([]);
    setSelectedExpLevels([]);
    setSalaryRange([0]);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-muted"
          onClick={() => navigate("/app/feed")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Find Your Next Role</h1>
          <p className="text-xs text-muted-foreground">
            {loading ? "Loading jobs..." : `${filteredJobs.length} open positions`}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-2">
        <div className="relative group flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search role, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 text-sm rounded-xl border-muted-foreground/20 focus:border-primary shadow-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-muted"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-11 w-11 rounded-xl shrink-0 p-0 relative border-muted-foreground/20">
              <SlidersHorizontal className="h-5 w-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl sm:max-w-md sm:mx-auto">
            <SheetHeader className="mb-4">
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Refine your job search</SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(85vh-180px)] pr-4">
              <div className="space-y-6 pb-6">
                {/* Job Type */}
                <div className="space-y-3">
                  <Label>Job Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(JOB_TYPES).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={selectedJobTypes.includes(key)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedJobTypes([...selectedJobTypes, key]);
                            else setSelectedJobTypes(selectedJobTypes.filter((t) => t !== key));
                          }}
                        />
                        <label
                          htmlFor={key}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div className="space-y-3">
                  <Label>Experience Level</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {EXPERIENCE_LEVELS.map((level) => (
                      <div key={level.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={level.id}
                          checked={selectedExpLevels.includes(level.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedExpLevels([...selectedExpLevels, level.id]);
                            else setSelectedExpLevels(selectedExpLevels.filter((l) => l !== level.id));
                          }}
                        />
                        <label
                          htmlFor={level.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {level.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Salary Range */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label>Minimum Salary</Label>
                    <span className="text-sm text-muted-foreground font-medium">
                      {salaryRange[0] > 0 ? `৳${salaryRange[0]}k+` : "Any"}
                    </span>
                  </div>
                  <Slider value={salaryRange} onValueChange={setSalaryRange} max={150} step={5} className="py-4" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>50k</span>
                    <span>100k</span>
                    <span>150k+</span>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="mt-4 flex-row gap-3 sm:justify-between">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  clearFilters();
                  setIsFilterOpen(false);
                }}
              >
                Clear All
              </Button>
              <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>
                Show {filteredJobs.length} Jobs
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filter Pills (Horizontal Scroll) */}
      {activeFiltersCount > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x">
          {selectedJobTypes.map((type) => (
            <Badge key={type} variant="secondary" className="flex gap-1 shrink-0 h-7">
              {JOB_TYPES[type]}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setSelectedJobTypes((prev) => prev.filter((t) => t !== type))}
              />
            </Badge>
          ))}
          {selectedExpLevels.map((level) => (
            <Badge key={level} variant="secondary" className="flex gap-1 shrink-0 h-7">
              {EXPERIENCE_LEVELS.find((l) => l.id === level)?.label}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setSelectedExpLevels((prev) => prev.filter((l) => l !== level))}
              />
            </Badge>
          ))}
          {salaryRange[0] > 0 && (
            <Badge variant="secondary" className="flex gap-1 shrink-0 h-7">
              Min ৳{salaryRange[0]}k
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSalaryRange([0])} />
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      )}

      {/* Job List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden border-border/50">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2 pt-1">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
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
            <h3 className="font-bold text-lg mb-2">No jobs found</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Try adjusting your filters or search terms to find more results.
            </p>
            <Button variant="outline" onClick={clearFilters} className="rounded-full">
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 pb-8">
          {filteredJobs.map((job, index) => (
            <div
              key={job.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-backwards"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <JobCard job={job} onClick={() => navigate(`/app/jobs/${job.id}`)} />
            </div>
          ))}

          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground">End of list</p>
          </div>
        </div>
      )}
    </div>
  );
}
