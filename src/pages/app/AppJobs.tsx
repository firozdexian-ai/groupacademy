import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Search, Building2, MapPin, Clock, Briefcase, 
  Star, ChevronRight, Filter
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

export default function AppJobs() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeFilter, setActiveFilter] = useState('all');

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

  const JobCard = ({ job }: { job: Job }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/app/jobs/${job.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {job.company_logo_url ? (
            <img 
              src={job.company_logo_url} 
              alt={job.company_name}
              className="w-12 h-12 rounded-lg object-cover bg-muted shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm line-clamp-1">{job.title}</h3>
                <p className="text-xs text-muted-foreground">{job.company_name}</p>
              </div>
              {job.is_featured && (
                <Badge className="shrink-0 gap-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 text-[10px]">
                  <Star className="w-2.5 h-2.5 fill-current" />
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                <Clock className="w-2.5 h-2.5 mr-0.5" />
                {JOB_TYPES[job.job_type] || job.job_type}
              </Badge>
              {job.location && (
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                  <MapPin className="w-2.5 h-2.5 mr-0.5" />
                  {job.location}
                </Badge>
              )}
            </div>
          </div>
          
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 self-center" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/jobs')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Browse Jobs</h1>
          <p className="text-sm text-muted-foreground">{filteredJobs.length} opportunities</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs, companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-4">
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="full_time" className="flex-1">Full Time</TabsTrigger>
          <TabsTrigger value="part_time" className="flex-1">Part Time</TabsTrigger>
          <TabsTrigger value="internship" className="flex-1">Internship</TabsTrigger>
          <TabsTrigger value="remote" className="flex-1">Remote</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Job List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No jobs found matching your criteria</p>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
