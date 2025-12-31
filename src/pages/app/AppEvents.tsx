import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Clock, Users, Video, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isPast, isToday, isFuture } from 'date-fns';

type EventType = 'all' | 'live_webinar' | 'offline_seminar';

export default function AppEvents() {
  const [eventType, setEventType] = useState<EventType>('all');

  const { data: events, isLoading } = useQuery({
    queryKey: ['app-events', eventType],
    queryFn: async () => {
      let query = supabase
        .from('content')
        .select(`
          id,
          title,
          description,
          content_type,
          event_date,
          event_duration_minutes,
          venue_name,
          venue_address,
          max_capacity,
          current_enrollment,
          cover_image_url,
          thumbnail_url,
          slug,
          whatsapp_group_link
        `)
        .eq('is_published', true)
        .in('content_type', ['live_webinar', 'offline_seminar'])
        .order('event_date', { ascending: true });

      if (eventType !== 'all') {
        query = query.eq('content_type', eventType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const upcomingEvents = events?.filter(e => e.event_date && isFuture(new Date(e.event_date))) || [];
  const todayEvents = events?.filter(e => e.event_date && isToday(new Date(e.event_date))) || [];
  const pastEvents = events?.filter(e => e.event_date && isPast(new Date(e.event_date)) && !isToday(new Date(e.event_date))) || [];

  const EventCard = ({ event }: { event: typeof events[0] }) => {
    const eventDate = event.event_date ? new Date(event.event_date) : null;
    const isWebinar = event.content_type === 'live_webinar';
    const spotsLeft = event.max_capacity ? event.max_capacity - (event.current_enrollment || 0) : null;

    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        {event.cover_image_url && (
          <div className="aspect-video relative overflow-hidden">
            <img 
              src={event.cover_image_url} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <Badge 
              className="absolute top-3 left-3"
              variant={isWebinar ? "default" : "secondary"}
            >
              {isWebinar ? (
                <><Video className="w-3 h-3 mr-1" /> Webinar</>
              ) : (
                <><MapPin className="w-3 h-3 mr-1" /> In-Person</>
              )}
            </Badge>
          </div>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
          {event.description && (
            <CardDescription className="line-clamp-2">{event.description}</CardDescription>
          )}
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{event.event_duration_minutes} minutes</span>
            </div>
          )}

          {!isWebinar && event.venue_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{event.venue_name}</span>
            </div>
          )}

          {spotsLeft !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className={spotsLeft <= 5 ? 'text-destructive font-medium' : ''}>
                {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Fully booked'}
              </span>
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <Button className="flex-1" size="sm">
              Register Now
            </Button>
            {event.whatsapp_group_link && (
              <Button variant="outline" size="sm" asChild>
                <a href={event.whatsapp_group_link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72 mb-6" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <Skeleton className="aspect-video" />
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Webinars & Events</h1>
        <p className="text-muted-foreground">Join live sessions and networking opportunities</p>
      </div>

      {/* Filter Tabs */}
      <Tabs value={eventType} onValueChange={(v) => setEventType(v as EventType)} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="live_webinar">Webinars</TabsTrigger>
          <TabsTrigger value="offline_seminar">In-Person</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Today's Events */}
      {todayEvents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge variant="destructive">Live Today</Badge>
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {todayEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Past Events</h2>
          <div className="grid gap-4 md:grid-cols-2 opacity-75">
            {pastEvents.slice(0, 4).map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {events?.length === 0 && (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events scheduled</h3>
          <p className="text-muted-foreground">
            Check back soon for upcoming webinars and events!
          </p>
        </Card>
      )}
    </div>
  );
}
