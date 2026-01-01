import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, Calendar, Trophy, FileText, Video, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTalent } from '@/contexts/TalentContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const LEARNING_SECTIONS = [
  {
    title: 'Career Tracks',
    icon: GraduationCap,
    href: '/app/learning/tracks',
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  },
  {
    title: 'Courses',
    icon: BookOpen,
    href: '/app/learning/courses',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10'
  },
  {
    title: 'Events',
    icon: Calendar,
    href: '/app/learning/events',
    color: 'text-accent',
    bgColor: 'bg-accent/10'
  },
  {
    title: 'Competitions',
    icon: Trophy,
    href: '/app/learning/competitions',
    color: 'text-warning',
    bgColor: 'bg-warning/10'
  },
  {
    title: 'Webinars',
    icon: Video,
    href: '/app/learning/webinars',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10'
  },
  {
    title: 'Blog',
    icon: FileText,
    href: '/app/learning/blog',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  }
];

interface Enrollment {
  id: string;
  status: string;
  content: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    content_type: string;
  };
}

export default function LearningHub() {
  const navigate = useNavigate();
  const { talent } = useTalent();

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['talent-enrollments-preview', talent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          status,
          content:content_id (
            id,
            title,
            slug,
            thumbnail_url,
            content_type
          )
        `)
        .eq('talent_id', talent!.id)
        .in('status', ['active', 'pending_payment'])
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return (data || []) as unknown as Enrollment[];
    },
    enabled: !!talent?.id,
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Compact Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold">Learning & Events</h1>
        <p className="text-xs text-muted-foreground">Grow your skills</p>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-3 gap-3">
        {LEARNING_SECTIONS.map((section) => (
          <Card 
            key={section.title}
            className="cursor-pointer hover:shadow-md transition-all border-0 shadow-sm press-scale"
            onClick={() => navigate(section.href)}
          >
            <CardContent className="p-3 flex flex-col items-center text-center">
              <div className={`w-11 h-11 rounded-xl ${section.bgColor} flex items-center justify-center mb-2`}>
                <section.icon className={`h-5 w-5 ${section.color}`} />
              </div>
              <span className="font-medium text-xs text-foreground leading-tight">{section.title}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Learning Section */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">My Learning</h2>
            {enrollments.length > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {enrollments.length}
              </Badge>
            )}
          </div>
          {enrollments.length > 0 && (
            <button 
              onClick={() => navigate('/app/learning/my-courses')}
              className="text-xs text-primary flex items-center gap-0.5 hover:underline"
            >
              View All
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">No courses enrolled yet</p>
              <button 
                onClick={() => navigate('/app/learning/courses')}
                className="text-xs text-primary font-medium hover:underline"
              >
                Browse Courses →
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {enrollments.map((enrollment) => (
              <Card 
                key={enrollment.id}
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate(`/app/learning/courses/${enrollment.content.slug}`)}
              >
                <CardContent className="p-0">
                  <div className="h-20 bg-muted rounded-t-lg overflow-hidden">
                    {enrollment.content.thumbnail_url ? (
                      <img 
                        src={enrollment.content.thumbnail_url} 
                        alt={enrollment.content.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium line-clamp-2 leading-tight">
                      {enrollment.content.title}
                    </p>
                    <button className="mt-1.5 text-[10px] text-primary font-medium">
                      Continue →
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
