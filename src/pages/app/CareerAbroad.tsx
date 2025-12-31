import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  Briefcase,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const COUNTRIES = [
  { name: 'UK', code: 'UK', flag: '🇬🇧' },
  { name: 'USA', code: 'US', flag: '🇺🇸' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬' },
];

const ABROAD_SECTIONS = [
  {
    title: 'Study Abroad',
    icon: GraduationCap,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    href: '/app/abroad/study'
  },
  {
    title: 'IELTS Prep',
    icon: BookOpen,
    color: 'text-accent-foreground',
    bgColor: 'bg-accent/10',
    href: '/app/abroad/ielts'
  },
  {
    title: 'Jobs Abroad',
    icon: Briefcase,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    href: '/app/jobs?location=abroad'
  }
];

export default function CareerAbroad() {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Compact Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold">Career Abroad</h1>
        <p className="text-xs text-muted-foreground">Explore international opportunities</p>
      </div>

      {/* 3-Column Compact Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {ABROAD_SECTIONS.map((section) => (
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

      {/* Compact Countries Grid */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3">Browse by Country</h2>
        <div className="grid grid-cols-3 gap-2">
          {COUNTRIES.map(country => (
            <Card 
              key={country.code}
              className="cursor-pointer hover:shadow-md transition-all border-0 shadow-sm press-scale"
              onClick={() => navigate(`/app/abroad/study?country=${country.code}`)}
            >
              <CardContent className="p-2.5 flex items-center gap-2">
                <span className="text-lg">{country.flag}</span>
                <span className="font-medium text-xs truncate">{country.name}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Compact IELTS CTA */}
      <Card 
        className="bg-gradient-to-r from-primary/5 to-secondary/5 border-0 shadow-sm cursor-pointer hover:shadow-md transition-all press-scale"
        onClick={() => navigate('/app/abroad/ielts')}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold mb-1">Start IELTS Prep</h3>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                AI-powered mock tests for all sections
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">AI Tests</Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">Materials</Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">Tracking</Badge>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
