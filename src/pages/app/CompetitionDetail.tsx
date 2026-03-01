import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTalent } from '@/contexts/TalentContext';
import { Trophy, Calendar, Users, ArrowLeft, Clock, Gift, CheckCircle, Upload, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  upcoming: { label: 'Upcoming', color: 'bg-blue-500' },
  active: { label: 'Active', color: 'bg-green-500' },
  judging: { label: 'Under Judging', color: 'bg-yellow-500' },
  completed: { label: 'Completed', color: 'bg-gray-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500' },
};

interface CompetitionDetailProps {
  inlineSlug?: string;
  onBack?: () => void;
}

export default function CompetitionDetail({ inlineSlug, onBack }: CompetitionDetailProps) {
  const params = useParams();
  const slug = inlineSlug || params.slug;
  const navigate = useNavigate();
  const { talent } = useTalent();
  const queryClient = useQueryClient();
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionDescription, setSubmissionDescription] = useState('');
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const isInline = !!inlineSlug;
  const handleBack = onBack || (() => navigate('/app/learning/competitions'));

  const { data: competition, isLoading } = useQuery({
    queryKey: ['competition', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: mySubmission } = useQuery({
    queryKey: ['my-competition-submission', competition?.id, talent?.id],
    queryFn: async () => {
      if (!competition?.id || !talent?.id) return null;
      const { data, error } = await supabase
        .from('competition_submissions')
        .select('*')
        .eq('competition_id', competition.id)
        .eq('talent_id', talent.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!competition?.id && !!talent?.id,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!competition || !talent) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('competition_submissions')
        .upsert({
          competition_id: competition.id,
          talent_id: talent.id,
          submission_url: submissionUrl,
          description: submissionDescription,
          status: 'submitted',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Submission received!');
      setIsSubmitDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['my-competition-submission'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Trophy className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Competition Not Found</h2>
        <Button onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[competition.status] || STATUS_CONFIG.upcoming;
  const prizes = Array.isArray(competition.prizes) ? competition.prizes : [];
  const canSubmit = competition.status === 'active' && talent && !mySubmission;
  const daysLeft = competition.submission_deadline 
    ? differenceInDays(new Date(competition.submission_deadline), new Date())
    : null;

  return (
    <div className={isInline ? "pb-28 sm:pb-6" : "max-w-4xl mx-auto px-4 py-6 pb-28 sm:pb-6"}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {competition.is_featured && (
              <Badge className="bg-primary/10 text-primary">Featured</Badge>
            )}
            <Badge className={`${statusConfig.color} text-white`}>{statusConfig.label}</Badge>
          </div>
          <h1 className="text-lg font-bold">{competition.title}</h1>
        </div>
        <Trophy className="h-6 w-6 text-warning" />
      </div>

      {/* Featured Image */}
      {competition.featured_image && (
        <div className="h-36 sm:h-52 overflow-hidden rounded-xl mb-4">
          <img 
            src={competition.featured_image} 
            alt={competition.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content - Single Column Flow */}
      <div className="space-y-4">
        {/* Key Info Strip */}
        <div className="grid grid-cols-2 gap-3">
          {competition.start_date && (
            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Duration</p>
                <p className="text-sm font-medium truncate">
                  {format(new Date(competition.start_date), 'MMM d')}
                  {competition.end_date && ` – ${format(new Date(competition.end_date), 'MMM d')}`}
                </p>
              </div>
            </div>
          )}
          {competition.submission_deadline && (
            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Deadline</p>
                <p className="text-sm font-medium truncate">
                  {format(new Date(competition.submission_deadline), 'MMM d, yyyy')}
                </p>
                {daysLeft !== null && daysLeft >= 0 && (
                  <p className="text-xs text-warning font-medium">
                    {daysLeft === 0 ? 'Ends today!' : `${daysLeft}d left`}
                  </p>
                )}
              </div>
            </div>
          )}
          {competition.max_participants && (
            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Participants</p>
                <p className="text-sm font-medium">{competition.max_participants} max</p>
              </div>
            </div>
          )}
        </div>

        {/* About */}
        <div>
          <h3 className="text-base font-semibold mb-2">About</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {competition.description || 'No description available.'}
          </p>
        </div>

        {/* Rules */}
        {competition.rules && (
          <div>
            <h3 className="text-base font-semibold mb-2">Rules & Guidelines</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{competition.rules}</p>
          </div>
        )}

        {/* Prizes */}
        {prizes.length > 0 && (
          <div>
            <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              Prizes
            </h3>
            <ul className="space-y-1.5">
              {prizes.map((prize: any, index: number) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="h-5 w-5 p-0 justify-center text-[10px]">{index + 1}</Badge>
                  <span>{typeof prize === 'string' ? prize : prize.name || prize.description || `Prize ${index + 1}`}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit Entry */}
        {canSubmit && (
          <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full hidden sm:flex" size="lg">
                <Upload className="h-4 w-4 mr-2" />
                Submit Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Your Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Submission URL</Label>
                  <Input
                    placeholder="https://..."
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Link to your project, portfolio, or submission file
                  </p>
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    placeholder="Brief description of your submission..."
                    value={submissionDescription}
                    onChange={(e) => setSubmissionDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button 
                  className="w-full"
                  onClick={() => submitMutation.mutate()}
                  disabled={!submissionUrl || submitMutation.isPending}
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Entry'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {!talent && competition.status === 'active' && (
          <Button className="w-full hidden sm:flex" onClick={() => navigate('/auth')}>
            Sign in to Participate
          </Button>
        )}

        {/* My Submission */}
        {mySubmission && (
          <Card className="border-primary/50">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Your Submission
                </CardTitle>
                <Badge>{mySubmission.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {mySubmission.submission_url && (
                <a 
                  href={mySubmission.submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 mb-2 text-sm"
                >
                  View Submission <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {mySubmission.description && (
                <p className="text-sm text-muted-foreground">{mySubmission.description}</p>
              )}
              {mySubmission.feedback && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Feedback</p>
                  <p className="text-sm text-muted-foreground">{mySubmission.feedback}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sticky bottom CTA on mobile */}
      {canSubmit && (
        <div className="fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur border-t p-3 flex gap-2 sm:hidden z-30">
          <Button className="flex-1" onClick={() => setIsSubmitDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Submit Entry
          </Button>
        </div>
      )}
      {!talent && competition.status === 'active' && (
        <div className="fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur border-t p-3 sm:hidden z-30">
          <Button className="w-full" onClick={() => navigate('/auth')}>
            Sign in to Participate
          </Button>
        </div>
      )}
    </div>
  );
}
