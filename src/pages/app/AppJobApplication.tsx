import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTalent } from '@/hooks/useTalent';
import { useCredits } from '@/hooks/useCredits';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, Send, Building2, AlertCircle, CheckCircle, 
  FileText, Loader2, Coins
} from 'lucide-react';
import { toast } from 'sonner';
import { CreditPurchaseSheet } from '@/components/credits/CreditPurchaseSheet';

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  application_email: string | null;
  ai_assessment_enabled: boolean | null;
}

export default function AppJobApplication() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { balance, canAfford, deductCredits, getServiceCost, refreshBalance } = useCredits();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);

  const applicationCost = getServiceCost('JOB_APPLICATION');
  const hasEnoughCredits = canAfford('JOB_APPLICATION');

  useEffect(() => {
    if (id) fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, company_name, company_logo_url, application_email, ai_assessment_enabled')
        .eq('id', id)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!talent || !job) return;

    if (!hasEnoughCredits) {
      setShowPurchaseSheet(true);
      return;
    }

    if (!talent.cvUrl) {
      toast.error('Please upload your CV first');
      navigate('/app/profile/edit');
      return;
    }

    setSubmitting(true);

    try {
      // Create application record
      const { error: appError } = await supabase
        .from('job_applications')
        .insert({
          job_id: job.id,
          talent_id: talent.id,
          professional_id: talent.id, // Using talent ID as professional ID
          cover_letter: coverLetter,
          cv_url: talent.cvUrl,
          delivery_status: 'pending'
        });

      if (appError) throw appError;

      // Deduct credits
      await deductCredits('JOB_APPLICATION', job.id, `Application to ${job.title} at ${job.company_name}`);

      // Trigger email sending via edge function
      await supabase.functions.invoke('send-job-application', {
        body: {
          jobId: job.id,
          talentId: talent.id,
          coverLetter: coverLetter
        }
      });

      // Check if AI assessment is enabled for this job
      if (job.ai_assessment_enabled) {
        try {
          const { data: assessmentData, error: assessmentError } = await supabase.functions.invoke('generate-job-assessment', {
            body: {
              jobId: job.id,
              talentId: talent.id
            }
          });

          if (!assessmentError && assessmentData?.assessmentId) {
            toast.success('Application submitted! Complete the AI assessment to improve your chances.');
            refreshBalance();
            navigate(`/app/job-assessment/${assessmentData.assessmentId}`);
            return;
          }
        } catch (assessmentErr) {
          console.error('Error generating assessment:', assessmentErr);
          // Continue with normal flow if assessment generation fails
        }
      }

      setSubmitted(true);
      toast.success('Application submitted successfully!');
      refreshBalance();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">Job not found</p>
            <Button variant="outline" onClick={() => navigate('/app/jobs')} className="mt-4">
              Browse Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your application to {job.title} at {job.company_name} has been submitted.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/app/applications')}>
                View My Applications
              </Button>
              <Button variant="outline" onClick={() => navigate('/app/jobs')}>
                Browse More Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Apply Now</h1>
          <p className="text-sm text-muted-foreground">Submit your application</p>
        </div>
      </div>

      {/* Job Info */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-3">
            {job.company_logo_url ? (
              <img 
                src={job.company_logo_url} 
                alt={job.company_name}
                className="w-12 h-12 rounded-lg object-cover bg-muted"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <h2 className="font-semibold">{job.title}</h2>
              <p className="text-sm text-muted-foreground">{job.company_name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CV Status */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Your CV
          </CardTitle>
        </CardHeader>
        <CardContent>
          {talent?.cvUrl ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">CV uploaded and ready</span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-destructive">Please upload your CV first</span>
              <Button size="sm" variant="outline" onClick={() => navigate('/app/profile/edit')}>
                Upload CV
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cover Letter */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Cover Letter (Optional)</CardTitle>
          <CardDescription>Write a brief introduction to the employer</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Dear Hiring Manager, I am excited to apply for this position..."
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={6}
          />
        </CardContent>
      </Card>

      {/* Credit Info */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" />
              <span className="text-sm">Application Cost</span>
            </div>
            <span className="font-semibold">{applicationCost} credits</span>
          </div>
          <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
            <span>Your Balance</span>
            <span className={!hasEnoughCredits ? 'text-destructive' : ''}>
              {balance} credits
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button 
        className="w-full" 
        size="lg"
        onClick={handleSubmit}
        disabled={submitting || !talent?.cvUrl}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : !hasEnoughCredits ? (
          <>
            <Coins className="h-4 w-4 mr-2" />
            Get Credits to Apply
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Submit Application
          </>
        )}
      </Button>

      <CreditPurchaseSheet 
        isOpen={showPurchaseSheet} 
        onClose={() => setShowPurchaseSheet(false)}
        currentBalance={balance}
      />
    </div>
  );
}
