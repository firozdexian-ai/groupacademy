import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Clock, Users, Video, ExternalLink, LayoutGrid, Trophy, Gift } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isPast, isToday, isFuture, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

type EventFilter = 'all' | 'live_webinar' | 'offline_seminar' | 'competitions';

const filterOptions: { key: EventFilter; icon: typeof LayoutGrid; label: string }[] = [
  { key: 'all', icon: LayoutGrid, label: 'All' },
  { key: 'live_webinar', icon: Video, label: 'Webinars' },
  { key: 'offline_seminar', icon: MapPin, label: 'In-Person' },
  { key: 'competitions', icon: Trophy, label: 'Compete' },
];

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  upcoming: { label: 'Upcoming', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  judging: { label: 'Judging', variant: 'outline' },
  completed: { label: 'Completed', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

interface EventsTabProps {
  onOpenCompetition?: (slug: string) => void;
}

export function EventsTab({ onOpenCompetition }: EventsTabProps) {
  const navigate = useNavigate();
  const [eventType, setEventType] = useState<EventFilter>('all');

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['app-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content')
        .select('id, title, description, content_type, event_date, event_duration_minutes, venue_name, venue_address, max_capacity, current_enrollment, cover_image_url, thumbnail_url, slug, whatsapp_group_link')
        .eq('is_published', true)
        .in('content_type', ['live_webinar', 'offline_seminar'])
        .order('event_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: eventType !== 'competitions',
  });

  const { data: competitions, isLoading: competitionsLoading } = useQuery({
    queryKey: ['app-competitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('start_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: eventType === 'all' || eventType === 'competitions',
  });

  // Filter events by type
  const filteredEvents = eventType === 'all' || eventType === 'competitions'
    ? events || []
    : (events || []).filter(e => e.content_type === eventType);

  const upcomingEvents = filteredEvents.filter(e => e.event_date && isFuture(new Date(e.event_date)));
  const todayEvents = filteredEvents.filter(e => e.event_date && isToday(new Date(e.event_date)));
  const pastEvents = filteredEvents.filter(e => e.event_date && isPast(new Date(e.event_date)) && !isToday(new Date(e.event_date)));

  const isLoading = (eventType !== 'competitions' && eventsLoading) || ((eventType === 'all' || eventType === 'competitions') && competitionsLoading);

  const getTimeRemaining = (deadline: string) => {
    const days = differenceInDays(new Date(deadline), new Date());
    if (days < 0) return 'Ended';
    if (days === 0) return 'Ends today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const EventCard = ({ event }: { event: any }) => {
    const eventDate = event.event_date ? new Date(event.event_date) : null;
    const isWebinar = event.content_type === 'live_webinar';
    const spotsLeft = event.max_capacity ? event.max_capacity - (event.current_enrollment || 0) : null;

    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        {event.cover_image_url && (
          <div className="h-32 relative overflow-hidden">
            <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
            <Badge className="absolute top-3 left-3" variant={isWebinar ? "default" : "secondary"}>
              {isWebinar ? <><Video className="w-3 h-3 mr-1" /> Webinar</> : <><MapPin className="w-3 h-3 mr-1" /> In-Person</>}
            </Badge>
          </div>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
          {event.description && <CardDescription className="line-clamp-2">{event.description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-3">
          {eventDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{format(eventDate, 'PPP')}</span>
              <span className="text-muted-foreground">at {format(eventDate, 'p')}</span>
            </div>
          )}
          {event.event_duration_minutes && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="w-4 h-4" /><span>{event.event_duration_minutes} minutes</span></div>
          )}
          {!isWebinar && event.venue_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4" /><span>{event.venue_name}</span></div>
          )}
          {spotsLeft !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className={spotsLeft <= 5 ? 'text-destructive font-medium' : ''}>{spotsLeft > 0 ? `${spotsLeft} spots left` : 'Fully booked'}</span>
            </div>
          )}
          <div className="pt-2 flex gap-2">
            <Button className="flex-1" size="sm">Register Now</Button>
            {event.whatsapp_group_link && (
              <Button variant="outline" size="sm" asChild>
                <a href={event.whatsapp_group_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const CompetitionCard = ({ competition }: { competition: any }) => {
    const statusConfig = STATUS_CONFIG[competition.status] || STATUS_CONFIG.upcoming;
    const prizes = Array.isArray(competition.prizes) ? competition.prizes : [];

    return (
      <Card
        className={cn("hover:shadow-md transition-all cursor-pointer overflow-hidden", competition.is_featured && "ring-2 ring-primary/50")}
        onClick={() => onOpenCompetition ? onOpenCompetition(competition.slug) : navigate(`/app/learning/competitions/${competition.slug}`)}
      >
        {competition.featured_image && (
          <div className="h-32 overflow-hidden">
            <img src={competition.featured_image} alt={competition.title} className="w-full h-full object-cover" />
          </div>
        )}
        <CardHeader className={competition.featured_image ? 'pt-4 pb-2' : 'pb-2'}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {competition.is_featured && <Badge className="bg-primary/10 text-primary text-xs">Featured</Badge>}
                <Badge variant={statusConfig.variant} className="text-xs">{statusConfig.label}</Badge>
              </div>
              <CardTitle className="text-base line-clamp-1">{competition.title}</CardTitle>
              {competition.category && <CardDescription className="text-xs">{competition.category}</CardDescription>}
            </div>
            <Trophy className="h-5 w-5 text-yellow-500 flex-shrink-0" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {competition.description && <p className="text-sm text-muted-foreground line-clamp-2">{competition.description}</p>}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {competition.start_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(competition.start_date), 'MMM d')}
                {competition.end_date && ` - ${format(new Date(competition.end_date), 'MMM d')}`}
              </span>
            )}
            {competition.submission_deadline && competition.status === 'active' && (
              <span className="flex items-center gap-1 text-yellow-600 font-medium">
                <Clock className="h-3.5 w-3.5" />
                {getTimeRemaining(competition.submission_deadline)}
              </span>
            )}
          </div>
          {prizes.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Gift className="h-3.5 w-3.5 text-primary" />
              {prizes.length} {prizes.length === 1 ? 'Prize' : 'Prizes'}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}><Skeleton className="h-32" /><CardHeader><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /></CardHeader><CardContent><Skeleton className="h-4 w-1/2 mb-2" /><Skeleton className="h-4 w-1/3" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const showEvents = eventType !== 'competitions';
  const showCompetitions = eventType === 'all' || eventType === 'competitions';
  const hasNoContent = showEvents && filteredEvents.length === 0 && (!showCompetitions || !competitions?.length);

  return (
    <div className="space-y-4">
      {/* Icon category selector */}
      <div className="grid grid-cols-4 gap-2">
        {filterOptions.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setEventType(key)}
            className="flex flex-col items-center gap-1.5"
          >
            <div className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center transition-colors",
              eventType === key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <span className={cn(
              "text-xs font-medium",
              eventType === key ? "text-foreground" : "text-muted-foreground"
            )}>{label}</span>
          </button>
        ))}
      </div>

      {/* Events sections */}
      {showEvents && (
        <>
          {todayEvents.length > 0 && (
            <div><h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Badge variant="destructive">Live Today</Badge></h2>
              <div className="grid gap-4 md:grid-cols-2">{todayEvents.map(event => <EventCard key={event.id} event={event} />)}</div>
            </div>
          )}
          {upcomingEvents.length > 0 && (
            <div><h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
              <div className="grid gap-4 md:grid-cols-2">{upcomingEvents.map(event => <EventCard key={event.id} event={event} />)}</div>
            </div>
          )}
          {pastEvents.length > 0 && (
            <div><h2 className="text-lg font-semibold mb-4 text-muted-foreground">Past Events</h2>
              <div className="grid gap-4 md:grid-cols-2 opacity-75">{pastEvents.slice(0, 4).map(event => <EventCard key={event.id} event={event} />)}</div>
            </div>
          )}
        </>
      )}

      {/* Competitions section */}
      {showCompetitions && competitions && competitions.length > 0 && (
        <div>
          {eventType === 'all' && <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" /> Competitions</h2>}
          <div className="grid gap-4 md:grid-cols-2">
            {competitions.map(comp => <CompetitionCard key={comp.id} competition={comp} />)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {hasNoContent && (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events scheduled</h3>
          <p className="text-muted-foreground">Check back soon for upcoming webinars and events!</p>
        </Card>
      )}
      {eventType === 'competitions' && (!competitions || competitions.length === 0) && (
        <Card className="p-12 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No competitions yet</h3>
          <p className="text-muted-foreground">Competitions will be announced soon. Stay tuned!</p>
        </Card>
      )}
    </div>
  );
}
