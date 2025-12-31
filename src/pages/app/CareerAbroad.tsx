import { useNavigate } from 'react-router-dom';
import { 
  Globe, 
  GraduationCap, 
  BookOpen, 
  Briefcase,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const COUNTRIES = [
  { name: 'United Kingdom', code: 'UK', flag: '🇬🇧' },
  { name: 'United States', code: 'US', flag: '🇺🇸' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬' },
];

const ABROAD_SECTIONS = [
  {
    title: 'Study Abroad',
    description: 'Explore universities and programs worldwide',
    icon: GraduationCap,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    href: '/app/abroad/study'
  },
  {
    title: 'IELTS Preparation',
    description: 'AI-powered mock tests and study materials',
    icon: BookOpen,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    href: '/app/abroad/ielts'
  },
  {
    title: 'Jobs Abroad',
    description: 'Find international job opportunities',
    icon: Briefcase,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    href: '/app/jobs?location=abroad'
  }
];

export default function CareerAbroad() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Career Abroad</h1>
        <p className="text-muted-foreground">Explore international opportunities</p>
      </div>

      {/* Main Sections */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {ABROAD_SECTIONS.map((section) => (
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
              <CardTitle className="text-lg mb-1 flex items-center gap-2">
                {section.title}
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Countries */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Browse by Country</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {COUNTRIES.map(country => (
            <Card 
              key={country.code}
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate(`/app/abroad/study?country=${country.code}`)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <span className="text-2xl">{country.flag}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{country.name}</p>
                  <p className="text-xs text-muted-foreground">View Programs</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* IELTS CTA */}
      <Card 
        className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 cursor-pointer hover:shadow-md transition-all"
        onClick={() => navigate('/app/abroad/ielts')}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Start IELTS Preparation</h3>
              <p className="text-muted-foreground mb-4">
                Practice with AI-powered mock tests for Listening, Reading, Writing, and Speaking. 
                Get instant feedback and improve your scores.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">AI Mock Tests</Badge>
                <Badge variant="outline">Study Materials</Badge>
                <Badge variant="outline">Score Tracking</Badge>
                <Badge variant="outline">Practice Tests</Badge>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
