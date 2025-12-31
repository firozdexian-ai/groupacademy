import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, Calendar, Trophy, FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const LEARNING_SECTIONS = [
  {
    title: 'Career Tracks',
    description: 'Structured learning paths for your profession',
    icon: GraduationCap,
    href: '/app/learning/tracks',
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  },
  {
    title: 'Courses',
    description: 'Self-paced courses and workshops',
    icon: BookOpen,
    href: '/app/learning/courses',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10'
  },
  {
    title: 'Webinars & Events',
    description: 'Live sessions and networking opportunities',
    icon: Calendar,
    href: '/app/learning/events',
    color: 'text-accent',
    bgColor: 'bg-accent/10'
  },
  {
    title: 'Competitions',
    description: 'Showcase your skills and win prizes',
    icon: Trophy,
    href: '/app/learning/competitions',
    color: 'text-warning',
    bgColor: 'bg-warning/10'
  },
  {
    title: 'Free Content & Blogs',
    description: 'Articles, tutorials, and career tips',
    icon: FileText,
    href: '/app/learning/blog',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  }
];

export default function LearningHub() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Learning & Events</h1>
        <p className="text-muted-foreground">Grow your skills and advance your career</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {LEARNING_SECTIONS.map((section) => (
          <Card 
            key={section.title}
            className="cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate(section.href)}
          >
            <CardHeader className="pb-3">
              <div className={`p-3 rounded-xl ${section.bgColor} w-fit`}>
                <section.icon className={`h-6 w-6 ${section.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-1 flex items-center justify-between">
                {section.title}
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate('/app/learning/my-courses')}>
            <BookOpen className="h-4 w-4 mr-2" />
            My Learning
          </Button>
          <Button variant="outline" onClick={() => navigate('/app/learning/tracks')}>
            <GraduationCap className="h-4 w-4 mr-2" />
            Explore Career Tracks
          </Button>
        </div>
      </div>
    </div>
  );
}
