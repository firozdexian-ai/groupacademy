import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Briefcase, 
  Clock, 
  MapPin, 
  Building2,
  Sparkles,
  ChevronRight,
  FileText,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string | null;
  job_type: string;
  created_at: string;
}

const JOB_COLLECTIONS = [
  { label: 'Full-time', filter: 'full_time', icon: Briefcase, gradient: 'from-blue-500/20 to-blue-600/10' },
  { label: 'Part-time', filter: 'part_time', icon: Clock, gradient: 'from-purple-500/20 to-purple-600/10' },
  { label: 'Internship', filter: 'internship', icon: Building2, gradient: 'from-green-500/20 to-green-600/10' },
  { label: 'Remote', filter: 'remote', icon: MapPin, gradient: 'from-orange-500/20 to-orange-600/10' },
];

const JOB_TYPE_COLORS: Record<string, string> = {
  full_time: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  part_time: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  contract: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  internship: 'bg-green-500/10 text-green-600 dark:text-green-400',
  freelance: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  remote: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
};

export default function JobsHub() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [topPicks, setTopPicks] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopPicks();
  }, []);

  async function fetchTopPicks() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, company_name, company_logo_url, location, job_type, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setTopPicks(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/app/jobs?search=${encodeURIComponent(searchQuery)}`);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl p-6">
        <h1 className="text-2xl font-bold mb-1">Find Your Dream Job</h1>
        <p className="text-muted-foreground mb-5">Discover opportunities that match your skills</p>

        {/* Search Bar */}
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search jobs, companies, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-24 h-14 text-base rounded-2xl border-2 focus:border-primary bg-background"
            />
            <Button 
              type="submit" 
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl h-10"
            >
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Job Categories - 2x2 Grid */}
      <section>
        <h2 className="text-lg font-bold mb-4">Browse by Type</h2>
        <div className="grid grid-cols-2 gap-3">
          {JOB_COLLECTIONS.map((collection, index) => (
            <Card 
              key={collection.filter}
              className={`cursor-pointer border-0 bg-gradient-to-br ${collection.gradient} animate-bounce-in press-scale`}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => navigate(`/app/jobs?type=${collection.filter}`)}
            >
              <CardContent className="p-5 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-background/80 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
                  <collection.icon className="h-7 w-7 text-primary" />
                </div>
                <span className="font-bold text-sm">{collection.label}</span>
                <span className="text-xs text-muted-foreground mt-0.5">View jobs</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Top Picks */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-bold">Top Picks for You</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary font-medium"
            onClick={() => navigate('/app/jobs?all=true')}
          >
            See all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : topPicks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No job openings available right now.</p>
              <p className="text-sm text-muted-foreground/70">Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {topPicks.map((job, index) => (
              <Card 
                key={job.id}
                className="cursor-pointer overflow-hidden animate-bounce-in press-scale card-lift"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(`/app/jobs/${job.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    {/* Company Logo */}
                    {job.company_logo_url ? (
                      <img 
                        src={job.company_logo_url} 
                        alt={job.company_name}
                        className="w-14 h-14 rounded-2xl object-cover bg-muted shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-7 h-7 text-primary" />
                      </div>
                    )}

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base line-clamp-1">{job.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{job.company_name}</p>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {job.location && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.location}
                          </span>
                        )}
                        <Badge 
                          variant="secondary" 
                          className={`text-xs font-medium ${JOB_TYPE_COLORS[job.job_type] || ''}`}
                        >
                          {job.job_type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="self-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ArrowRight className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          <Button 
            variant="outline" 
            className="rounded-full h-12 px-5 shrink-0 gap-2 press-scale"
            onClick={() => navigate('/app/jobs?all=true')}
          >
            <Search className="h-4 w-4" />
            All Jobs
          </Button>
          <Button 
            variant="outline" 
            className="rounded-full h-12 px-5 shrink-0 gap-2 press-scale"
            onClick={() => navigate('/app/applications')}
          >
            <FileText className="h-4 w-4" />
            My Applications
          </Button>
        </div>
      </section>
    </div>
  );
}
