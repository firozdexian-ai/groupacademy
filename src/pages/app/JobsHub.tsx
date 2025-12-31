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
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Job {
  id: string;
  title: string;
  company_name: string;
  location: string | null;
  job_type: string;
  created_at: string;
}

const JOB_COLLECTIONS = [
  { label: 'Full-time', filter: 'full_time', icon: Briefcase },
  { label: 'Part-time', filter: 'part_time', icon: Clock },
  { label: 'Internship', filter: 'internship', icon: Building2 },
  { label: 'Remote', filter: 'remote', icon: MapPin },
];

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
        .select('id, title, company_name, location, job_type, created_at')
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Jobs & Applications</h1>
        <p className="text-muted-foreground">Find your next opportunity</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, companies, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </div>
      </form>

      {/* Top Picks */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-semibold">Top Picks for You</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/jobs?all=true')}>
            See all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : topPicks.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No job openings available right now. Check back soon!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {topPicks.map(job => (
              <Card 
                key={job.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/app/jobs/${job.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.company_name}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </span>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {job.job_type.replace('_', '-')}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Job Collections */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Browse by Type</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {JOB_COLLECTIONS.map(collection => (
            <Card 
              key={collection.filter}
              className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
              onClick={() => navigate(`/app/jobs?type=${collection.filter}`)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="p-3 bg-primary/10 rounded-full mb-2">
                  <collection.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium text-sm">{collection.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate('/app/jobs?all=true')}>
            <Filter className="h-4 w-4 mr-2" />
            All Jobs
          </Button>
          <Button variant="outline" onClick={() => navigate('/app/applications')}>
            <Briefcase className="h-4 w-4 mr-2" />
            My Applications
          </Button>
        </div>
      </section>
    </div>
  );
}
