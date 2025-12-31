import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, Search, Building2, MapPin, Clock, Briefcase, 
  Star, ArrowRight, X
} from 'lucide-react';

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
  full_time: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  part_time: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  contract: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  internship: 'bg-green-500/10 text-green-600 dark:text-green-400',
  freelance: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  remote: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' },
];

export default function AppJobs() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialType = searchParams.get('type') || 'all';
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeFilter, setActiveFilter] = useState(initialType);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || job.job_type === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full press-scale"
          onClick={() => navigate('/app/jobs')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">Browse Jobs</h1>
          <p className="text-xs text-muted-foreground">{filteredJobs.length} opportunities</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs, companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 text-sm rounded-xl border focus:border-primary"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {FILTER_OPTIONS.map(option => (
          <Button
            key={option.value}
            variant={activeFilter === option.value ? 'default' : 'outline'}
            size="sm"
            className={`rounded-full h-8 px-3 text-xs shrink-0 press-scale ${
              activeFilter === option.value 
                ? 'shadow-sm' 
                : 'bg-background'
            }`}
            onClick={() => setActiveFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Job List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex gap-3">
                  <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <Briefcase className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-base mb-1">No jobs found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No jobs match your current filters
            </p>
            <Button 
              variant="outline" 
              className="rounded-full h-10 px-5 press-scale"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job, index) => (
            <Card 
              key={job.id}
              className="cursor-pointer overflow-hidden animate-bounce-in press-scale card-lift"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => navigate(`/app/jobs/${job.id}`)}
            >
              <CardContent className="p-3">
                <div className="flex gap-3">
                  {/* Company Logo */}
                  {job.company_logo_url ? (
                    <img 
                      src={job.company_logo_url} 
                      alt={job.company_name}
                      className="w-11 h-11 rounded-xl object-cover bg-muted shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  
                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm line-clamp-1">{job.title}</h3>
                      {job.is_featured && (
                        <Badge className="shrink-0 gap-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 h-5 text-[10px]">
                          <Star className="w-2.5 h-2.5 fill-current" />
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1.5">{job.company_name}</p>
                    
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge 
                        variant="secondary" 
                        className={`text-[10px] font-medium h-5 ${JOB_TYPE_COLORS[job.job_type] || ''}`}
                      >
                        <Clock className="w-2.5 h-2.5 mr-1" />
                        {JOB_TYPES[job.job_type] || job.job_type}
                      </Badge>
                      {job.location && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="self-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
