import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Briefcase, FileText, MessageSquare, ArrowRight, Search, 
  MapPin, Building2, Clock, DollarSign, Star, Calendar, ChevronLeft, ChevronRight,
  Filter
} from "lucide-react";
import { format } from "date-fns";

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string | null;
  job_type: string;
  experience_level: string;
  salary_range_min: number | null;
  salary_range_max: number | null;
  description: string;
  ai_enhanced_description: string | null;
  deadline: string | null;
  is_featured: boolean;
  profession_category_id: string | null;
  created_at: string;
}

interface ProfessionCategory {
  id: string;
  name: string;
}

const JOB_TYPES: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
  remote: "Remote",
};

const EXPERIENCE_LEVELS: Record<string, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior Level",
  executive: "Executive",
};

const JOBS_PER_PAGE = 12;

const Jobs = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<ProfessionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "all");
  const [jobTypeFilter, setJobTypeFilter] = useState(searchParams.get("type") || "all");
  const [experienceFilter, setExperienceFilter] = useState(searchParams.get("exp") || "all");
  const [locationFilter, setLocationFilter] = useState(searchParams.get("location") || "");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadJobs();
    // Update URL params
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (jobTypeFilter !== "all") params.set("type", jobTypeFilter);
    if (experienceFilter !== "all") params.set("exp", experienceFilter);
    if (locationFilter) params.set("location", locationFilter);
    if (currentPage > 1) params.set("page", currentPage.toString());
    setSearchParams(params);
  }, [searchQuery, categoryFilter, jobTypeFilter, experienceFilter, locationFilter, currentPage]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from("profession_categories")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    setCategories(data || []);
  };

  const loadJobs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("jobs")
        .select("*", { count: "exact" })
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      // Apply filters
      if (categoryFilter !== "all") {
        query = query.eq("profession_category_id", categoryFilter);
      }
      if (jobTypeFilter !== "all") {
        query = query.eq("job_type", jobTypeFilter as "full_time" | "part_time" | "contract" | "internship" | "freelance" | "remote");
      }
      if (experienceFilter !== "all") {
        query = query.eq("experience_level", experienceFilter as "entry" | "mid" | "senior" | "executive");
      }
      if (locationFilter) {
        query = query.ilike("location", `%${locationFilter}%`);
      }
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Pagination
      const from = (currentPage - 1) * JOBS_PER_PAGE;
      const to = from + JOBS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      
      setJobs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadJobs();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setJobTypeFilter("all");
    setExperienceFilter("all");
    setLocationFilter("");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / JOBS_PER_PAGE);
  const featuredJobs = jobs.filter(j => j.is_featured);
  const regularJobs = jobs.filter(j => !j.is_featured);

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `BDT ${(min/1000).toFixed(0)}K - ${(max/1000).toFixed(0)}K`;
    if (min) return `BDT ${(min/1000).toFixed(0)}K+`;
    if (max) return `Up to BDT ${(max/1000).toFixed(0)}K`;
    return null;
  };

  const JobCard = ({ job, featured = false }: { job: Job; featured?: boolean }) => (
    <Card 
      className={`group cursor-pointer transition-all hover:shadow-lg hover:border-primary/30 ${featured ? 'border-yellow-500/50 bg-yellow-500/5' : ''}`}
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {job.company_logo_url ? (
            <img 
              src={job.company_logo_url} 
              alt={job.company_name}
              className="w-12 h-12 rounded-lg object-cover bg-muted"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                {featured && (
                  <Badge className="mb-2 gap-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
                    <Star className="w-3 h-3 fill-current" /> Featured
                  </Badge>
                )}
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                  {job.title}
                </h3>
                <p className="text-muted-foreground text-sm">{job.company_name}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="gap-1 text-xs">
                <Clock className="w-3 h-3" />
                {JOB_TYPES[job.job_type] || job.job_type}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {EXPERIENCE_LEVELS[job.experience_level] || job.experience_level}
              </Badge>
              {job.location && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <MapPin className="w-3 h-3" />
                  {job.location}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {formatSalary(job.salary_range_min, job.salary_range_max) && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {formatSalary(job.salary_range_min, job.salary_range_max)}
                  </span>
                )}
                {job.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(job.deadline), "MMM d")}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                Apply <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-12 md:py-16 bg-gradient-to-b from-primary/5 via-secondary/5 to-background overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
          <div className="container mx-auto px-6 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="icon-container-lg mx-auto mb-4">
                <Briefcase className="w-11 h-11 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Find Your Dream Job
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                {totalCount > 0 ? `${totalCount} active job openings` : "Explore career opportunities"}
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search jobs, companies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 text-base"
                    />
                  </div>
                  <Button type="submit" size="lg" className="h-12 px-8">
                    Search
                  </Button>
                </div>
              </form>
            </div>

            {/* Quick Tips */}
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
              <Card className="bg-card/50 border-primary/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Build Your Portfolio</h3>
                    <p className="text-xs text-muted-foreground mt-1">Stand out with a professional profile</p>
                    <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-xs" onClick={() => navigate("/portfolio-request")}>
                      Get Started <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Practice Interviews</h3>
                    <p className="text-xs text-muted-foreground mt-1">AI-powered mock interviews</p>
                    <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-xs" onClick={() => navigate("/mock-interview")}>
                      Try Now <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Know Your Readiness</h3>
                    <p className="text-xs text-muted-foreground mt-1">Career Readiness Scorecard</p>
                    <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-xs" onClick={() => navigate("/career-assessment")}>
                      Assess Now <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Filters & Jobs */}
        <section className="py-8">
          <div className="container mx-auto px-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6 items-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span>Filters:</span>
              </div>
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={jobTypeFilter} onValueChange={(v) => { setJobTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(JOB_TYPES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={experienceFilter} onValueChange={(v) => { setExperienceFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {Object.entries(EXPERIENCE_LEVELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Location..."
                value={locationFilter}
                onChange={(e) => { setLocationFilter(e.target.value); setCurrentPage(1); }}
                className="w-[150px]"
              />
              {(searchQuery || categoryFilter !== "all" || jobTypeFilter !== "all" || experienceFilter !== "all" || locationFilter) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              )}
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="p-5">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-20" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20">
                <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your filters or search query</p>
                <Button onClick={clearFilters} variant="outline">Clear Filters</Button>
              </div>
            ) : (
              <>
                {/* Featured Jobs */}
                {featuredJobs.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" /> Featured Jobs
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {featuredJobs.map(job => (
                        <JobCard key={job.id} job={job} featured />
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular Jobs */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regularJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Jobs;
