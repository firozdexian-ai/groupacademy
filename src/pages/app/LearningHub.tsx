import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, Calendar, Trophy, FileText, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
    title: 'Blog',
    icon: FileText,
    href: '/app/learning/blog',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  },
  {
    title: 'My Learning',
    icon: BookOpen,
    href: '/app/learning/my-courses',
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  }
];

export default function LearningHub() {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Compact Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold">Learning & Events</h1>
        <p className="text-xs text-muted-foreground">Grow your skills</p>
      </div>

      {/* 3-Column Grid - bKash Style */}
      <div className="grid grid-cols-3 gap-3">
        {LEARNING_SECTIONS.map((section) => (
          <Card 
            key={section.title}
            className="cursor-pointer hover:shadow-md transition-all border-0 shadow-sm press-scale"
            onClick={() => navigate(section.href)}
          >
            <CardContent className="p-3 flex flex-col items-center text-center">
              {/* Compact Icon Container */}
              <div className={`w-11 h-11 rounded-xl ${section.bgColor} flex items-center justify-center mb-2`}>
                <section.icon className={`h-5 w-5 ${section.color}`} />
              </div>
              {/* Small Label */}
              <span className="font-medium text-xs text-foreground leading-tight">{section.title}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compact Quick Actions */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => navigate('/app/learning/my-courses')}>
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            My Learning
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => navigate('/app/learning/tracks')}>
            <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
            Career Tracks
          </Button>
        </div>
      </div>
    </div>
  );
}
