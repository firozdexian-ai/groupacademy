import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTalent } from '@/hooks/useTalent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, ArrowRight, CheckCircle, Mic, MicOff, 
  Loader2, Clock, AlertCircle, Brain
} from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  type: 'mcq' | 'voice' | 'text';
  question: string;
  options?: string[];
  timeLimit?: number;
}

interface Assessment {
  id: string;
  job_id: string;
  talent_id: string;
  questions: Question[];
  answers: Record<string, any> | null;
  status: string;
  expires_at: string | null;
  jobs?: {
    title: string;
    company_name: string;
  };
}

export default function JobAssessment() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { talent } = useTalent();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (assessmentId) fetchAssessment();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assessmentId]);

  const fetchAssessment = async () => {
    try {
      const { data, error } = await supabase
        .from('job_assessments')
        .select(`
          *,
          jobs (title, company_name)
        `)
        .eq('id', assessmentId)
        .single();

      if (error) throw error;
      
      // Parse questions from JSON
      const questionsData = Array.isArray(data.questions) 
        ? data.questions as unknown as Question[]
        : [];
      
      const parsedData = {
        ...data,
        questions: questionsData,
        answers: data.answers as Record<string, any> | null
      };
      
      setAssessment(parsedData);
      
      // Pre-fill answers if resuming
      if (parsedData.answers) {
        setAnswers(parsedData.answers);
      }
      
      // Update status to in_progress if pending
      if (data.status === 'pending') {
        await supabase
          .from('job_assessments')
          .update({ 
            status: 'in_progress',
            started_at: new Date().toISOString()
          })
          .eq('id', assessmentId);
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
      toast.error('Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 120) { // 2 minute limit
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleVoiceAnswer = async () => {
    if (!audioBlob || !assessment) return;
    
    const currentQuestion = assessment.questions[currentQuestionIndex];
    
    // For now, store as base64 - in production, upload to storage
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
      handleAnswerChange(currentQuestion.id, {
        type: 'voice',
        data: reader.result
      });
      setAudioBlob(null);
      setRecordingTime(0);
    };
  };

  const handleNext = async () => {
    if (!assessment) return;
    
    const currentQuestion = assessment.questions[currentQuestionIndex];
    
    // Save voice recording if exists
    if (currentQuestion.type === 'voice' && audioBlob) {
      await handleVoiceAnswer();
    }
    
    // Auto-save progress
    await saveProgress();
    
    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setAudioBlob(null);
      setRecordingTime(0);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setAudioBlob(null);
      setRecordingTime(0);
    }
  };

  const saveProgress = async () => {
    if (!assessment) return;
    
    try {
      await supabase
        .from('job_assessments')
        .update({ answers })
        .eq('id', assessment.id);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleSubmit = async () => {
    if (!assessment) return;
    
    // Handle final voice answer
    const currentQuestion = assessment.questions[currentQuestionIndex];
    if (currentQuestion.type === 'voice' && audioBlob) {
      await handleVoiceAnswer();
    }
    
    setSubmitting(true);
    
    try {
      // Save final answers
      await supabase
        .from('job_assessments')
        .update({ 
          answers,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', assessment.id);
      
      // Trigger AI analysis
      const { error: analyzeError } = await supabase.functions.invoke('analyze-job-assessment', {
        body: { assessmentId: assessment.id }
      });
      
      if (analyzeError) {
        console.error('Analysis error:', analyzeError);
        toast.error('Assessment submitted but analysis pending');
      } else {
        toast.success('Assessment completed successfully!');
      }
      
      navigate('/app/applications');
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">Assessment not found</p>
            <Button variant="outline" onClick={() => navigate('/app/applications')} className="mt-4">
              Back to Applications
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assessment.status === 'completed') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Assessment Completed!</h2>
            <p className="text-muted-foreground mb-6">
              Your responses have been submitted and are being analyzed.
            </p>
            <Button onClick={() => navigate('/app/applications')}>
              View My Applications
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check expiry
  if (assessment.expires_at && new Date(assessment.expires_at) < new Date()) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Assessment Expired</h2>
            <p className="text-muted-foreground mb-6">
              This assessment link has expired.
            </p>
            <Button onClick={() => navigate('/app/applications')}>
              View My Applications
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === assessment.questions.length - 1;
  const hasCurrentAnswer = answers[currentQuestion?.id];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">AI Assessment</h1>
          <p className="text-sm text-muted-foreground">
            {assessment.jobs?.title} at {assessment.jobs?.company_name}
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Brain className="h-3 w-3" />
          {currentQuestionIndex + 1}/{assessment.questions.length}
        </Badge>
      </div>

      {/* Progress */}
      <Progress value={progress} className="mb-6 h-2" />

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={currentQuestion.type === 'mcq' ? 'secondary' : 'default'}>
              {currentQuestion.type === 'mcq' ? 'Multiple Choice' : 
               currentQuestion.type === 'voice' ? 'Voice Response' : 'Text Response'}
            </Badge>
          </div>
          <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentQuestion.type === 'mcq' && currentQuestion.options && (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              className="space-y-3"
            >
              {currentQuestion.options.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value={option} id={`option-${idx}`} />
                  <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === 'voice' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 p-6 bg-accent/30 rounded-lg">
                {isRecording ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                      <Mic className="h-8 w-8 text-destructive" />
                    </div>
                    <p className="text-lg font-mono">{formatTime(recordingTime)}</p>
                    <p className="text-sm text-muted-foreground">Recording... (max 2 minutes)</p>
                    <Button onClick={stopRecording} variant="destructive">
                      <MicOff className="h-4 w-4 mr-2" />
                      Stop Recording
                    </Button>
                  </>
                ) : audioBlob || answers[currentQuestion.id]?.type === 'voice' ? (
                  <>
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <p className="text-sm text-muted-foreground">Response recorded</p>
                    <Button onClick={startRecording} variant="outline">
                      Re-record
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <Mic className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Click to start recording your answer</p>
                    <Button onClick={startRecording}>
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </Button>
                  </>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Speak clearly and take your time. You can re-record if needed.
              </p>
            </div>
          )}

          {currentQuestion.type === 'text' && (
            <Textarea
              placeholder="Type your answer here..."
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              rows={6}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        {isLastQuestion ? (
          <Button 
            onClick={handleSubmit}
            disabled={submitting || !hasCurrentAnswer}
            className="flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Assessment
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={handleNext}
            disabled={!hasCurrentAnswer && currentQuestion.type !== 'voice'}
            className="flex-1"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
