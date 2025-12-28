import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ProcessingCard } from "@/components/ui/processing-card";
import { 
  ArrowLeft, Upload, FileText, Loader2, CheckCircle2, 
  AlertCircle, Sparkles, Building2, CreditCard, Gift, RefreshCw, Edit3,
  User, FileCheck
} from "lucide-react";
import { toast } from "sonner";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { AuthGate } from "@/components/AuthGate";

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  application_email: string | null;
  application_type: string;
  application_url: string | null;
}

interface UsageInfo {
  freeUsed: number;
  freeRemaining: number;
  isPaid: boolean;
}

const FREE_APPLICATIONS_PER_MONTH = 5;
const PAID_APPLICATION_COST = 50;

const CV_PARSING_STAGES = [
  { progress: 0, message: "Preparing to process your CV..." },
  { progress: 10, message: "Uploading your CV..." },
  { progress: 25, message: "Analyzing document structure..." },
  { progress: 45, message: "AI is extracting your profile..." },
  { progress: 65, message: "Processing skills and experience..." },
  { progress: 85, message: "Finalizing your information..." },
];

const JobApplicationContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { talent, isLoading: talentLoading, refreshTalent, addServiceUsed, isAuthenticated } = useTalent();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Upload CV, 2: Review & Apply
  
  // CV Upload State
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUrl, setCvUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // Manual entry mode
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  
  // Application Form
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [enhancingCoverLetter, setEnhancingCoverLetter] = useState(false);
  
  // Usage/Freemium
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValid, setCodeValid] = useState(false);
  
  // Whether to use existing CV
  const [useExistingCv, setUseExistingCv] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!talentLoading && !isAuthenticated) {
      navigate("/auth", { state: { returnTo: `/jobs/${id}/apply` } });
    }
  }, [talentLoading, isAuthenticated, navigate, id]);

  // Load job and check usage when talent is available
  useEffect(() => {
    if (id) {
      loadJob();
    }
  }, [id]);

  // Check usage when talent is loaded
  useEffect(() => {
    if (talent?.id) {
      checkUsage(talent.id);
      // Pre-fill manual fields from talent
      setManualName(talent.fullName || "");
      setManualEmail(talent.email || "");
      setManualPhone(talent.phone || "");
      
      // If talent has a parsed CV, auto-select to use it
      if (talent.cvUrl && talent.cvParsedAt) {
        setUseExistingCv(true);
      }
    }
  }, [talent]);

  const loadJob = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.DEFAULT);
    
    try {
      const queryPromise = supabase
        .from("jobs")
        .select("id, title, company_name, company_logo_url, application_email, application_type, application_url")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      const abortPromise = new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => 
          reject(new Error("Loading timed out"))
        );
      });

      const { data, error } = await Promise.race([queryPromise, abortPromise]);
      clearTimeout(timeoutId);
      if (error) throw error;
      setJob(data);
      
      // For link-type jobs, redirect immediately
      if (data.application_type === "link" && data.application_url) {
        toast.success("Redirecting to external application...");
        setTimeout(() => {
          window.open(data.application_url, "_blank");
          navigate(`/jobs/${id}`);
        }, 1000);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Error loading job:", error);
      const isTimeout = error?.name === "AbortError" || error?.message?.includes("timed out");
      toast.error(isTimeout ? "Loading took too long. Please try again." : "Job not found");
      navigate("/jobs");
    } finally {
      setLoading(false);
    }
  };

  const checkUsage = async (talentId: string) => {
    const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    // Check by talent_id first, then fall back to professional_id for legacy data
    const { data } = await supabase
      .from("job_application_usage")
      .select("*")
      .or(`talent_id.eq.${talentId},professional_id.eq.${talentId}`)
      .eq("month_year", monthYear)
      .maybeSingle();

    const freeUsed = data?.free_applications_used || 0;
    const freeRemaining = Math.max(0, FREE_APPLICATIONS_PER_MONTH - freeUsed);
    
    setUsage({
      freeUsed,
      freeRemaining,
      isPaid: freeRemaining === 0,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setCvFile(file);
      setCvUrl("");
      setParseError(null);
      setManualMode(false);
      setUseExistingCv(false);
    }
  };

  const uploadAndParseCv = async () => {
    if (!cvFile && !cvUrl) {
      toast.error("Please upload a CV or provide a URL");
      return;
    }

    setParseError(null);
    setManualMode(false);
    let finalCvUrl = cvUrl;
    
    // Upload file if provided
    if (cvFile) {
      setUploading(true);
      try {
        const fileExt = cvFile.name.split('.').pop();
        const fileName = `cv_${Date.now()}.${fileExt}`;
        
        // Use XMLHttpRequest for progress tracking
        finalCvUrl = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = async () => {
            if (xhr.status === 200) {
              const { data: { publicUrl } } = supabase.storage
                .from('portfolio-uploads')
                .getPublicUrl(fileName);
              resolve(publicUrl);
            } else {
              reject(new Error('Upload failed'));
            }
          };

          xhr.onerror = () => reject(new Error('Upload failed'));

          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          
          xhr.open('POST', `${supabaseUrl}/storage/v1/object/portfolio-uploads/${fileName}`);
          xhr.setRequestHeader('Authorization', `Bearer ${supabaseKey}`);
          xhr.send(cvFile);
        });

        setCvUrl(finalCvUrl);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload CV");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    // Parse CV with AI
    setParsing(true);
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("CV parsing timed out")), TIMEOUTS.AI_GENERATION);
      });

      const parsePromise = supabase.functions.invoke('parse-cv', {
        body: { 
          cvUrl: finalCvUrl,
          jobId: id,
          talentId: talent?.id, // Pass talent ID to update their profile
        }
      });

      const response = await Promise.race([parsePromise, timeoutPromise]) as any;

      if (response.error) throw response.error;

      const { professional, parsed } = response.data;
      
      // Update talent's CV info in the talents table
      if (talent?.id && parsed) {
        await supabase
          .from('talents')
          .update({
            cv_url: finalCvUrl,
            cv_parsed_at: new Date().toISOString(),
            education: parsed.education || [],
            experience: parsed.experience || [],
            skills: parsed.skills || [],
          })
          .eq('id', talent.id);
        
        // Refresh talent context
        await refreshTalent();
      }
      
      await checkUsage(talent?.id || professional?.id);
      
      toast.success("CV parsed successfully!");
      setStep(2);
    } catch (error: any) {
      console.error("Parse error:", error);
      const message = error?.message?.includes("timed out")
        ? "CV parsing took too long. Please try again or enter details manually."
        : "Failed to parse CV. Please try again or enter details manually.";
      setParseError(message);
      toast.error(message);
    } finally {
      setParsing(false);
    }
  };

  const proceedWithExistingCv = () => {
    if (talent?.cvUrl) {
      setCvUrl(talent.cvUrl);
      setStep(2);
      toast.success("Using your existing CV");
    }
  };

  const submitManualEntry = async () => {
    if (!manualName.trim() || !manualEmail.trim() || !manualPhone.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      // Update talent profile with manual info
      if (talent?.id) {
        await supabase
          .from("talents")
          .update({
            full_name: manualName,
            phone: manualPhone,
            cv_url: cvUrl || talent.cvUrl || null,
          })
          .eq("id", talent.id);
        
        await refreshTalent();
      }
      
      await checkUsage(talent?.id || "");
      
      toast.success("Profile updated successfully!");
      setManualMode(false);
      setStep(2);
    } catch (error) {
      console.error("Manual entry error:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const enhanceCoverLetter = async () => {
    if (!coverLetter.trim()) {
      toast.error("Please write a cover letter first");
      return;
    }

    setEnhancingCoverLetter(true);
    try {
      const response = await supabase.functions.invoke('enhance-cover-letter', {
        body: {
          coverLetter,
          jobTitle: job?.title,
          companyName: job?.company_name,
          candidateName: talent?.fullName,
          skills: talent?.skills || [],
        }
      });

      if (response.error) throw response.error;

      const { enhancedCoverLetter } = response.data;
      if (enhancedCoverLetter) {
        setCoverLetter(enhancedCoverLetter);
        toast.success("Cover letter enhanced with AI!");
      }
    } catch (error) {
      console.error("Enhance error:", error);
      toast.error("Failed to enhance cover letter");
    } finally {
      setEnhancingCoverLetter(false);
    }
  };

  const validateAccessCode = async () => {
    if (!accessCode.trim()) return;
    
    setValidatingCode(true);
    try {
      const { data: codeData, error: codeError } = await supabase
        .from("job_application_access_codes")
        .select("*")
        .eq("code", accessCode.trim().toUpperCase())
        .eq("email", talent?.email?.toLowerCase() || "")
        .eq("is_used", false)
        .maybeSingle();

      if (codeError || !codeData) {
        toast.error("Invalid or expired access code");
        return;
      }

      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        toast.error("This access code has expired");
        return;
      }

      // Mark code as used
      await supabase
        .from("job_application_access_codes")
        .update({ is_used: true })
        .eq("id", codeData.id);

      setCodeValid(true);
      toast.success("Access code validated!");
    } catch (error) {
      console.error("Error validating code:", error);
      toast.error("Failed to validate code");
    } finally {
      setValidatingCode(false);
    }
  };

  const submitApplication = async () => {
    if (!talent?.id) {
      toast.error("Please complete your profile first");
      setStep(1);
      return;
    }
    
    if (!job) {
      toast.error("Job information not loaded. Please refresh the page.");
      return;
    }

    // Check if already applied
    const { data: existing } = await supabase
      .from("job_applications")
      .select("id")
      .eq("job_id", job.id)
      .eq("talent_id", talent.id)
      .maybeSingle();

    if (existing) {
      toast.error("You have already applied to this job");
      return;
    }

    setSubmitting(true);
    try {
      const isPaidApplication = usage?.isPaid && !codeValid;
      const finalCvUrl = cvUrl || talent.cvUrl;
      
      // Create application with talent_id
      const { data: newApplication, error: appError } = await supabase
        .from("job_applications")
        .insert({
          job_id: job.id,
          talent_id: talent.id,
          professional_id: talent.id, // Keep for backward compatibility
          cv_url: finalCvUrl,
          cover_letter: coverLetter || null,
          is_paid: isPaidApplication,
          application_status: "submitted",
          delivery_status: "pending",
        })
        .select("id")
        .single();

      if (appError) throw appError;

      // Track service usage
      await addServiceUsed('job_application');

      // Update usage
      const monthYear = new Date().toISOString().slice(0, 7);
      
      // Check for existing usage record by talent_id or professional_id
      const { data: usageData } = await supabase
        .from("job_application_usage")
        .select("*")
        .or(`talent_id.eq.${talent.id},professional_id.eq.${talent.id}`)
        .eq("month_year", monthYear)
        .maybeSingle();

      if (usageData) {
        if (!isPaidApplication) {
          await supabase
            .from("job_application_usage")
            .update({ 
              free_applications_used: usageData.free_applications_used + 1,
              talent_id: talent.id // Ensure talent_id is set
            })
            .eq("id", usageData.id);
        } else {
          await supabase
            .from("job_application_usage")
            .update({ 
              paid_applications_count: (usageData.paid_applications_count || 0) + 1,
              talent_id: talent.id // Ensure talent_id is set
            })
            .eq("id", usageData.id);
        }
      } else {
        await supabase
          .from("job_application_usage")
          .insert({
            talent_id: talent.id,
            professional_id: talent.id, // Keep for backward compatibility
            month_year: monthYear,
            free_applications_used: isPaidApplication ? 0 : 1,
            paid_applications_count: isPaidApplication ? 1 : 0,
          });
      }

      // Update delivery status based on job type
      if (job.application_type === 'email') {
        await supabase
          .from('job_applications')
          .update({ 
            delivery_status: 'pending',
            application_status: 'submitted' 
          })
          .eq('id', newApplication.id);
          
        toast.success("Application submitted! Our team will forward it to the employer shortly.");
      } else {
        await supabase
          .from('job_applications')
          .update({ 
            delivery_status: 'sent',
            application_status: 'sent_to_employer' 
          })
          .eq('id', newApplication.id);
          
        toast.success("Application submitted!");
      }
      
      navigate("/my-profile", { state: { applicationSubmitted: true } });
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if talent has a usable existing CV
  const hasExistingCv = talent?.cvUrl && talent?.cvParsedAt;
  const hasProfileData = talent?.fullName && talent?.email;

  if (loading || talentLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-6 max-w-3xl">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/jobs/${id}`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Job
          </Button>

          {/* Job Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {job?.company_logo_url ? (
                  <img 
                    src={job.company_logo_url} 
                    alt={job.company_name}
                    className="w-14 h-14 rounded-lg object-cover bg-muted"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-primary" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold">{job?.title}</h1>
                  <p className="text-muted-foreground">{job?.company_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
              </div>
              <span className="font-medium">Your Profile</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted">
              <div className={`h-full bg-primary transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <span className="font-medium">Review & Apply</span>
            </div>
          </div>

          {/* Step 1: Profile & CV */}
          {step === 1 && (
            <>
              {/* Show Processing Card when parsing */}
              {parsing ? (
                <ProcessingCard
                  title="Parsing Your CV"
                  stages={CV_PARSING_STAGES}
                  duration={45000}
                  className="mb-6"
                />
              ) : parseError ? (
                <Card className="mb-6">
                  <CardContent className="py-8 text-center">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">AI Parsing Failed</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">{parseError}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={uploadAndParseCv} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                      <Button onClick={() => setManualMode(true)}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Enter Manually
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : manualMode ? (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit3 className="w-5 h-5" />
                      Update Your Details
                    </CardTitle>
                    <CardDescription>
                      Review and update your information for this application
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="manual-name">Full Name *</Label>
                      <Input
                        id="manual-name"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="John Doe"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="manual-email">Email *</Label>
                      <Input
                        id="manual-email"
                        type="email"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="mt-1"
                        disabled // Email comes from auth
                      />
                    </div>
                    <div>
                      <Label htmlFor="manual-phone">Phone *</Label>
                      <Input
                        id="manual-phone"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        placeholder="+880 1XXX-XXXXXX"
                        className="mt-1"
                      />
                    </div>
                    
                    {(cvUrl || talent?.cvUrl) && (
                      <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm">CV on file</span>
                      </div>
                    )}
                    
                    <div className="flex gap-3 pt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setManualMode(false);
                          setParseError(null);
                        }}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={submitManualEntry}
                        disabled={submitting || !manualName.trim() || !manualEmail.trim() || !manualPhone.trim()}
                        className="flex-1"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Continue to Apply'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Existing Profile Card */}
                  {hasProfileData && (
                    <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                            <User className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-green-800 dark:text-green-200">
                              Welcome back, {talent?.fullName}!
                            </h3>
                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                              {talent?.email}
                              {talent?.phone && ` • ${talent.phone}`}
                            </p>
                            
                            {/* Existing CV option */}
                            {hasExistingCv && (
                              <div className="mt-4 p-3 bg-white dark:bg-background rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3">
                                  <FileCheck className="w-5 h-5 text-green-600" />
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">CV on file</p>
                                    <p className="text-xs text-muted-foreground">
                                      Last updated: {new Date(talent.cvParsedAt!).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <Button 
                                    size="sm"
                                    onClick={proceedWithExistingCv}
                                  >
                                    Use This CV
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {!hasExistingCv && (
                              <Button 
                                className="mt-3"
                                variant="outline"
                                onClick={() => setStep(2)}
                              >
                                Continue Without CV
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Upload New CV Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        {hasExistingCv ? 'Upload a New CV' : 'Upload Your CV'}
                      </CardTitle>
                      <CardDescription>
                        {hasExistingCv 
                          ? 'Want to use a different CV? Upload a new one here.'
                          : 'Upload your CV and our AI will parse your information automatically'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* File Upload */}
                      <div>
                        <Label>Upload CV File</Label>
                        <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="cv-upload"
                          />
                          <label htmlFor="cv-upload" className="cursor-pointer">
                            {cvFile ? (
                              <div className="flex items-center justify-center gap-2 text-primary">
                                <FileText className="w-8 h-8" />
                                <span className="font-medium">{cvFile.name}</span>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">
                                  Click to upload or drag and drop
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  PDF, DOC, DOCX (max 10MB)
                                </p>
                              </>
                            )}
                          </label>
                        </div>
                        {uploading && (
                          <Progress value={uploadProgress} className="mt-2" />
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <Separator className="flex-1" />
                        <span className="text-sm text-muted-foreground">OR</span>
                        <Separator className="flex-1" />
                      </div>

                      {/* URL Input */}
                      <div>
                        <Label htmlFor="cv-url">CV URL (Google Drive, Dropbox, etc.)</Label>
                        <Input
                          id="cv-url"
                          placeholder="https://drive.google.com/..."
                          value={cvUrl}
                          onChange={(e) => {
                            setCvUrl(e.target.value);
                            setCvFile(null);
                            setUseExistingCv(false);
                          }}
                          className="mt-2"
                        />
                      </div>

                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={uploadAndParseCv}
                        disabled={(!cvFile && !cvUrl) || uploading || parsing}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading... {uploadProgress}%
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Upload & Parse CV
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

          {/* Step 2: Review & Apply */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Profile Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Your Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">{talent?.fullName || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{talent?.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-medium">{talent?.phone || 'Not provided'}</p>
                    </div>
                    {(cvUrl || talent?.cvUrl) && (
                      <div>
                        <Label className="text-muted-foreground">CV</Label>
                        <p className="font-medium text-primary">
                          <a href={cvUrl || talent?.cvUrl || ''} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            View CV
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {talent?.skills && talent.skills.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Skills</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {talent.skills.slice(0, 10).map((skill: any, i: number) => (
                          <Badge key={i} variant="secondary">
                            {typeof skill === 'string' ? skill : skill.name || skill.skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setStep(1)}
                  >
                    Update Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Cover Letter */}
              <Card>
                <CardHeader>
                  <CardTitle>Cover Letter (Optional)</CardTitle>
                  <CardDescription>
                    Add a personalized message to stand out
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Tell the employer why you're the perfect fit for this role..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={5}
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={enhanceCoverLetter}
                      disabled={!coverLetter.trim() || enhancingCoverLetter}
                    >
                      {enhancingCoverLetter ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enhancing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Enhance with AI
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Freemium Status */}
              <Card className={usage?.isPaid && !codeValid ? 'border-amber-500/50' : 'border-green-500/50'}>
                <CardContent className="p-6">
                  {usage?.isPaid && !codeValid ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <CreditCard className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800 dark:text-amber-200">
                            Free Applications Used
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            You've used all {FREE_APPLICATIONS_PER_MONTH} free applications this month. 
                            This application costs BDT {PAID_APPLICATION_COST}.
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="access-code">Have an access code?</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            id="access-code"
                            placeholder="JOB-XXXXXXXX"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                          />
                          <Button 
                            variant="outline"
                            onClick={validateAccessCode}
                            disabled={validatingCode || !accessCode}
                          >
                            {validatingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validate'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <Gift className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          {codeValid ? 'Access Code Applied!' : 'Free Application'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {codeValid 
                            ? 'Your access code has been validated. This application is free!'
                            : `You have ${usage?.freeRemaining || FREE_APPLICATIONS_PER_MONTH} free applications remaining this month.`
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/jobs/${id}`)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  size="lg"
                  onClick={submitApplication}
                  disabled={submitting || !talent?.id}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : usage?.isPaid && !codeValid ? (
                    `Submit Application (BDT ${PAID_APPLICATION_COST})`
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

const JobApplication = () => {
  return (
    <AuthGate message="Sign in to apply for jobs. Your applications will be saved to your profile.">
      <JobApplicationContent />
    </AuthGate>
  );
};

export default JobApplication;
