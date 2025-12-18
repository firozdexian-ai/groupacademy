import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { 
  ArrowLeft, Upload, FileText, Loader2, CheckCircle2, 
  AlertCircle, Sparkles, Building2, CreditCard, Gift
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

interface ParsedCV {
  full_name?: string;
  email?: string;
  phone?: string;
  education?: any[];
  experience?: any[];
  skills?: any[];
}

interface UsageInfo {
  freeUsed: number;
  freeRemaining: number;
  isPaid: boolean;
}

const FREE_APPLICATIONS_PER_MONTH = 5;
const PAID_APPLICATION_COST = 50;

const JobApplicationContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Upload CV, 2: Review & Apply
  
  // CV Upload State
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUrl, setCvUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedCV | null>(null);
  
  // Professional Info
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  
  // Application Form
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Usage/Freemium
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValid, setCodeValid] = useState(false);

  useEffect(() => {
    if (id) {
      loadJob();
      checkExistingProfile();
    }
  }, [id]);

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

  const checkExistingProfile = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.DEFAULT);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const queryPromise = supabase
          .from("professionals")
          .select("*")
          .eq("email", user.email)
          .single();

        const abortPromise = new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => 
            reject(new Error("Profile check timed out"))
          );
        });

        const { data: profile } = await Promise.race([queryPromise, abortPromise]);
        clearTimeout(timeoutId);

        if (profile) {
          setExistingProfile(profile);
          setProfessionalId(profile.id);
          setParsedData({
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            education: Array.isArray(profile.education) ? profile.education : [],
            experience: Array.isArray(profile.experience) ? profile.experience : [],
            skills: Array.isArray(profile.skills) ? profile.skills : [],
          });
          await checkUsage(profile.id);
        }
      } else {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Error checking profile:", error);
      // Non-critical, silently fail
    }
  };

  const checkUsage = async (profId: string) => {
    const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const { data } = await supabase
      .from("job_application_usage")
      .select("*")
      .eq("professional_id", profId)
      .eq("month_year", monthYear)
      .single();

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
    }
  };

  const uploadAndParseCv = async () => {
    if (!cvFile && !cvUrl) {
      toast.error("Please upload a CV or provide a URL");
      return;
    }

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
          const formData = new FormData();
          formData.append('file', cvFile);

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

    // Parse CV with AI (90-second timeout for AI parsing)
    setParsing(true);
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("CV parsing timed out")), TIMEOUTS.AI_GENERATION);
      });

      const parsePromise = supabase.functions.invoke('parse-cv', {
        body: { 
          cvUrl: finalCvUrl,
          jobId: id 
        }
      });

      const response = await Promise.race([parsePromise, timeoutPromise]) as any;

      if (response.error) throw response.error;

      const { professional, parsedData: parsed } = response.data;
      
      setProfessionalId(professional.id);
      setParsedData(parsed);
      setExistingProfile(professional);
      
      await checkUsage(professional.id);
      
      toast.success("CV parsed successfully!");
      setStep(2);
    } catch (error: any) {
      console.error("Parse error:", error);
      const message = error?.message?.includes("timed out")
        ? "CV parsing took too long. Please try again."
        : "Failed to parse CV. Please try again.";
      toast.error(message);
    } finally {
      setParsing(false);
    }
  };

  const validateAccessCode = async () => {
    if (!accessCode.trim()) return;
    
    setValidatingCode(true);
    try {
      // Validate against job_application_access_codes table
      const { data: codeData, error: codeError } = await supabase
        .from("job_application_access_codes")
        .select("*")
        .eq("code", accessCode.trim().toUpperCase())
        .eq("email", parsedData?.email?.toLowerCase() || existingProfile?.email?.toLowerCase())
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
    if (!professionalId || !job) {
      toast.error("Missing required information");
      return;
    }

    // Check if already applied
    const { data: existing } = await supabase
      .from("job_applications")
      .select("id")
      .eq("job_id", job.id)
      .eq("professional_id", professionalId)
      .single();

    if (existing) {
      toast.error("You have already applied to this job");
      return;
    }

    setSubmitting(true);
    try {
      const isPaidApplication = usage?.isPaid && !codeValid;
      
      // Create application
      const { data: newApplication, error: appError } = await supabase
        .from("job_applications")
        .insert({
          job_id: job.id,
          professional_id: professionalId,
          cv_url: cvUrl || existingProfile?.cv_url,
          cover_letter: coverLetter || null,
          is_paid: isPaidApplication,
          application_status: "submitted",
          delivery_status: "pending",
        })
        .select("id")
        .single();

      if (appError) throw appError;

      // Update usage
      const monthYear = new Date().toISOString().slice(0, 7);
      
      if (!isPaidApplication) {
        // Increment free usage
        const { data: usageData } = await supabase
          .from("job_application_usage")
          .select("*")
          .eq("professional_id", professionalId)
          .eq("month_year", monthYear)
          .single();

        if (usageData) {
          await supabase
            .from("job_application_usage")
            .update({ free_applications_used: usageData.free_applications_used + 1 })
            .eq("id", usageData.id);
        } else {
          await supabase
            .from("job_application_usage")
            .insert({
              professional_id: professionalId,
              month_year: monthYear,
              free_applications_used: 1,
            });
        }
      } else {
        // Increment paid count
        const { data: usageData } = await supabase
          .from("job_application_usage")
          .select("*")
          .eq("professional_id", professionalId)
          .eq("month_year", monthYear)
          .single();

        if (usageData) {
          await supabase
            .from("job_application_usage")
            .update({ paid_applications_count: (usageData.paid_applications_count || 0) + 1 })
            .eq("id", usageData.id);
        } else {
          await supabase
            .from("job_application_usage")
            .insert({
              professional_id: professionalId,
              month_year: monthYear,
              free_applications_used: 0,
              paid_applications_count: 1,
            });
        }
      }

      // For email-type jobs, mark as pending manual forward
      // For link-type jobs, this shouldn't reach here but handle gracefully
      if (job.application_type === 'email') {
        // Don't auto-send email - mark for manual forward
        await supabase
          .from('job_applications')
          .update({ 
            delivery_status: 'pending',
            application_status: 'submitted' 
          })
          .eq('id', newApplication.id);
          
        toast.success("Application submitted! Our team will forward it to the employer shortly.");
      } else {
        // Link type - mark as completed
        await supabase
          .from('job_applications')
          .update({ 
            delivery_status: 'sent',
            application_status: 'sent_to_employer' 
          })
          .eq('id', newApplication.id);
          
        toast.success("Application submitted!");
      }
      
      navigate("/jobs", { state: { applicationSubmitted: true } });
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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
              <span className="font-medium">Upload CV</span>
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

          {/* Step 1: Upload CV */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Your CV
                </CardTitle>
                <CardDescription>
                  Upload your CV and our AI will parse your information automatically
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {existingProfile ? (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          Profile Found: {existingProfile.full_name}
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          We found your existing profile. You can proceed directly or upload a new CV to update it.
                        </p>
                        <Button 
                          className="mt-3" 
                          onClick={() => setStep(2)}
                        >
                          Use Existing Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <Separator className={existingProfile ? '' : 'hidden'} />

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
                  ) : parsing ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                      Parsing with AI...
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
          )}

          {/* Step 2: Review & Apply */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Parsed Profile */}
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
                      <p className="font-medium">{parsedData?.full_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{parsedData?.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-medium">{parsedData?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  {parsedData?.skills && parsedData.skills.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Skills</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {parsedData.skills.slice(0, 10).map((skill: any, i: number) => (
                          <Badge key={i} variant="secondary">
                            {typeof skill === 'string' ? skill : skill.name}
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
                    Update CV
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
                <CardContent>
                  <Textarea
                    placeholder="Tell the employer why you're the perfect fit for this role..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={5}
                  />
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
                  disabled={submitting}
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
