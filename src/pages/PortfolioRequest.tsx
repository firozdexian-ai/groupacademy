import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import MultiFileUpload from "@/components/portfolio/MultiFileUpload";
import { Briefcase, User, FileText, Award, Globe, CheckCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

type Step = 'personal' | 'cv' | 'certificates' | 'social' | 'review';

interface ProfessionCategory {
  id: string;
  name: string;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  professionCategoryId: string;
  cvUrl: string;
  certificates: { name: string; url: string }[];
  achievements: string;
  socialLinks: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
    youtube?: string;
  };
  additionalNotes: string;
}

const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'personal', label: 'Personal Info', icon: <User className="h-4 w-4" /> },
  { id: 'cv', label: 'CV Upload', icon: <FileText className="h-4 w-4" /> },
  { id: 'certificates', label: 'Certificates', icon: <Award className="h-4 w-4" /> },
  { id: 'social', label: 'Social Links', icon: <Globe className="h-4 w-4" /> },
  { id: 'review', label: 'Review', icon: <CheckCircle className="h-4 w-4" /> },
];

export default function PortfolioRequest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string>("");
  const [professionCategories, setProfessionCategories] = useState<ProfessionCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    professionCategoryId: '',
    cvUrl: '',
    certificates: [],
    achievements: '',
    socialLinks: {},
    additionalNotes: '',
  });

  useEffect(() => {
    loadProfessionCategories();
  }, []);

  const loadProfessionCategories = async () => {
    console.log('[PortfolioRequest] Starting to fetch profession categories...');
    setIsLoadingCategories(true);
    
    try {
      const { data, error } = await supabase
        .from('profession_categories')
        .select('id, name')
        .eq('is_active', true)
        .order('display_order');
      
      console.log('[PortfolioRequest] Fetch result:', { data, error });
      
      if (error) {
        console.error('[PortfolioRequest] Error loading profession categories:', error);
        toast({
          title: "Error loading categories",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      if (data) {
        console.log('[PortfolioRequest] Loaded', data.length, 'profession categories:', data);
        setProfessionCategories(data);
      }
    } catch (err) {
      console.error('[PortfolioRequest] Unexpected error:', err);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'personal':
        return !!(formData.fullName && formData.email && formData.phone);
      case 'cv':
        return !!formData.cvUrl;
      case 'certificates':
        return true;
      case 'social':
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSubmit = async () => {
    console.log('[PortfolioRequest] Submit clicked, form data:', formData);
    setIsSubmitting(true);
    
    try {
      const insertData = {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        profession_category_id: formData.professionCategoryId || null,
        cv_url: formData.cvUrl,
        certificates: formData.certificates,
        achievements: formData.achievements,
        social_links: formData.socialLinks,
        additional_notes: formData.additionalNotes,
      };
      
      console.log('[PortfolioRequest] Inserting data:', insertData);
      
      const { data, error } = await supabase
        .from('portfolio_requests')
        .insert(insertData)
        .select('id')
        .single();

      console.log('[PortfolioRequest] Insert result:', { data, error });

      if (error) {
        console.error('[PortfolioRequest] Insert error:', error);
        throw error;
      }

      console.log('[PortfolioRequest] Success! Request ID:', data.id);
      setRequestId(data.id);
      setIsSuccess(true);
      toast({ title: "Request submitted!", description: "We'll contact you on WhatsApp soon." });
    } catch (error: any) {
      console.error('[PortfolioRequest] Submission failed:', error);
      toast({ 
        title: "Submission failed", 
        description: error.message || "Please try again or contact support.", 
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Request Submitted Successfully!</CardTitle>
              <CardDescription>
                Your portfolio request has been received. Our team will contact you on WhatsApp within 24-48 hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Your Request ID</p>
                <p className="font-mono font-semibold">{requestId.slice(0, 8).toUpperCase()}</p>
              </div>
              
              <div className="text-left space-y-2 bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold">What happens next?</h4>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>Our Talent Success Executive will contact you on WhatsApp</li>
                  <li>They will verify your information and discuss your portfolio</li>
                  <li>After payment (BDT 100), we'll create your professional portfolio</li>
                  <li>You'll receive your portfolio link + CMS access within 3-5 days</li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/portfolio-status')}>
                  Check Request Status
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Digital Portfolio Service</h1>
            <p className="text-muted-foreground">
              Get a professional portfolio website created by our team for just BDT 100
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors
                  ${index <= currentStepIndex 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'}
                `}>
                  {step.icon}
                </div>
                <span className={`text-xs text-center hidden sm:block ${
                  index <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-full mt-5 absolute left-1/2 ${
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  }`} style={{ display: 'none' }} />
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStepIndex].label}</CardTitle>
              <CardDescription>
                {currentStep === 'personal' && "Tell us about yourself so we can contact you"}
                {currentStep === 'cv' && "Upload your CV/Resume (PDF or Word document)"}
                {currentStep === 'certificates' && "Add your certificates and achievements (optional)"}
                {currentStep === 'social' && "Share your online presence (optional)"}
                {currentStep === 'review' && "Review your information before submitting"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Personal Info Step */}
              {currentStep === 'personal' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">WhatsApp Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+880 1XXX-XXXXXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profession">Profession Category</Label>
                    <Select
                      value={formData.professionCategoryId}
                      onValueChange={(value) => setFormData({ ...formData, professionCategoryId: value })}
                      disabled={isLoadingCategories}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select your profession"} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {isLoadingCategories ? (
                          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                            Loading...
                          </div>
                        ) : professionCategories.length === 0 ? (
                          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                            No profession categories available
                          </div>
                        ) : (
                          professionCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* CV Upload Step */}
              {currentStep === 'cv' && (
                <div className="space-y-4">
                  <MultiFileUpload
                    bucket="portfolio-uploads"
                    maxFiles={1}
                    acceptedTypes=".pdf,.doc,.docx"
                    value={formData.cvUrl ? [{ name: 'CV', url: formData.cvUrl }] : []}
                    onChange={(files) => setFormData({ ...formData, cvUrl: files[0]?.url || '' })}
                    label="Upload your CV/Resume"
                    description="PDF or Word document (max 10MB)"
                  />
                </div>
              )}

              {/* Certificates Step */}
              {currentStep === 'certificates' && (
                <div className="space-y-4">
                  <MultiFileUpload
                    bucket="portfolio-uploads"
                    maxFiles={10}
                    acceptedTypes=".pdf,.jpg,.jpeg,.png"
                    value={formData.certificates}
                    onChange={(files) => setFormData({ ...formData, certificates: files })}
                    label="Upload Certificates & Documents"
                    description="Upload certificates, awards, or any relevant documents (max 10 files)"
                  />
                  <div>
                    <Label htmlFor="achievements">Achievements & Accomplishments</Label>
                    <Textarea
                      id="achievements"
                      value={formData.achievements}
                      onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                      placeholder="Describe your key achievements, projects, or accomplishments..."
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {/* Social Links Step */}
              {currentStep === 'social' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="linkedin">LinkedIn Profile</Label>
                    <Input
                      id="linkedin"
                      value={formData.socialLinks.linkedin || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        socialLinks: { ...formData.socialLinks, linkedin: e.target.value }
                      })}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  <div>
                    <Label htmlFor="github">GitHub Profile</Label>
                    <Input
                      id="github"
                      value={formData.socialLinks.github || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        socialLinks: { ...formData.socialLinks, github: e.target.value }
                      })}
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Personal Website</Label>
                    <Input
                      id="website"
                      value={formData.socialLinks.website || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        socialLinks: { ...formData.socialLinks, website: e.target.value }
                      })}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="youtube">YouTube Channel</Label>
                    <Input
                      id="youtube"
                      value={formData.socialLinks.youtube || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        socialLinks: { ...formData.socialLinks, youtube: e.target.value }
                      })}
                      placeholder="https://youtube.com/@yourchannel"
                    />
                  </div>
                  <div>
                    <Label htmlFor="additionalNotes">Additional Notes</Label>
                    <Textarea
                      id="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      placeholder="Any specific requirements or preferences for your portfolio..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Review Step */}
              {currentStep === 'review' && (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <User className="h-4 w-4" /> Personal Information
                      </h4>
                      <div className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">Name:</span> {formData.fullName}</p>
                        <p><span className="text-muted-foreground">Email:</span> {formData.email}</p>
                        <p><span className="text-muted-foreground">WhatsApp:</span> {formData.phone}</p>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Documents
                      </h4>
                      <div className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">CV:</span> {formData.cvUrl ? 'Uploaded ✓' : 'Not uploaded'}</p>
                        <p><span className="text-muted-foreground">Certificates:</span> {formData.certificates.length} file(s)</p>
                      </div>
                    </div>

                    {Object.values(formData.socialLinks).some(v => v) && (
                      <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Globe className="h-4 w-4" /> Social Links
                        </h4>
                        <div className="text-sm space-y-1">
                          {formData.socialLinks.linkedin && <p>LinkedIn: {formData.socialLinks.linkedin}</p>}
                          {formData.socialLinks.github && <p>GitHub: {formData.socialLinks.github}</p>}
                          {formData.socialLinks.website && <p>Website: {formData.socialLinks.website}</p>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-primary/10 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Service Fee: BDT 100</h4>
                    <p className="text-sm text-muted-foreground">
                      Payment will be collected via WhatsApp after our team contacts you.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStepIndex === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                {currentStep === 'review' ? (
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Submit Request
                  </Button>
                ) : (
                  <Button onClick={handleNext} disabled={!canProceed()}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}