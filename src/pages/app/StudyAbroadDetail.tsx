import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GraduationCap, MapPin, Calendar, DollarSign, ArrowLeft, ExternalLink, Clock, Award, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

const COUNTRIES: Record<string, string> = {
  UK: '🇬🇧',
  US: '🇺🇸',
  CA: '🇨🇦',
  AU: '🇦🇺',
  DE: '🇩🇪',
  SG: '🇸🇬',
};

export default function StudyAbroadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: program, isLoading } = useQuery({
    queryKey: ['study-abroad-program', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_abroad_programs')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <GraduationCap className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Program Not Found</h2>
        <p className="text-muted-foreground mb-4">This program may have been removed.</p>
        <Button onClick={() => navigate('/app/abroad/study')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Programs
        </Button>
      </div>
    );
  }

  const requirements = Array.isArray(program.requirements) ? program.requirements : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/abroad/study')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{COUNTRIES[program.country_code] || '🌍'}</span>
            <h1 className="text-xl font-bold">{program.university_name}</h1>
          </div>
          <p className="text-muted-foreground">{program.country_name}</p>
        </div>
        {program.url && (
          <Button asChild>
            <a href={program.url} target="_blank" rel="noopener noreferrer">
              Apply Now
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        )}
      </div>

      {/* Program Details */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{program.program_name}</CardTitle>
              {program.field_of_study && (
                <CardDescription className="mt-1">{program.field_of_study}</CardDescription>
              )}
            </div>
            <div className="flex gap-2">
              {program.featured && (
                <Badge className="bg-primary/10 text-primary">Featured</Badge>
              )}
              {program.scholarship_available && (
                <Badge variant="secondary" className="gap-1">
                  <Award className="h-3 w-3" />
                  Scholarship Available
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {program.degree_type && (
              <div className="flex items-center gap-2 text-sm">
                <div className="p-2 rounded-lg bg-primary/10">
                  <GraduationCap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Degree</p>
                  <p className="font-medium">{program.degree_type}</p>
                </div>
              </div>
            )}
            {program.duration && (
              <div className="flex items-center gap-2 text-sm">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Clock className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Duration</p>
                  <p className="font-medium">{program.duration}</p>
                </div>
              </div>
            )}
            {program.tuition_range && (
              <div className="flex items-center gap-2 text-sm">
                <div className="p-2 rounded-lg bg-accent/10">
                  <DollarSign className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Tuition</p>
                  <p className="font-medium">{program.tuition_range}</p>
                </div>
              </div>
            )}
            {program.application_deadline && (
              <div className="flex items-center gap-2 text-sm">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Calendar className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Deadline</p>
                  <p className="font-medium">{format(new Date(program.application_deadline), 'MMM d, yyyy')}</p>
                </div>
              </div>
            )}
          </div>

          {program.intake_months && program.intake_months.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Intake Months</h3>
              <div className="flex flex-wrap gap-2">
                {program.intake_months.map((month: string) => (
                  <Badge key={month} variant="outline">{month}</Badge>
                ))}
              </div>
            </div>
          )}

          {requirements.length > 0 && (
            <>
              <Separator className="my-4" />
              <div>
                <h3 className="font-medium mb-3">Requirements</h3>
                <ul className="space-y-2">
                  {requirements.map((req: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold mb-1">Interested in this program?</h3>
              <p className="text-sm text-muted-foreground">Get personalized guidance from our career counselors.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/app/agents/career-counselor')}>
                Talk to AI Counselor
              </Button>
              {program.url && (
                <Button asChild>
                  <a href={program.url} target="_blank" rel="noopener noreferrer">
                    Visit Website
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
