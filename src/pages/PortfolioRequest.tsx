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
import ProfileBuilderForm, { ProfileData } from "@/components/portfolio/ProfileBuilderForm";
import { Briefcase, User, FileText, Award, Globe, CheckCircle, ArrowLeft, ArrowRight, Loader2, FileUp, PenLine, RefreshCw, AlertCircle } from "lucide-react";

type Step = 'personal' | 'cv' | 'certificates' | 'social' | 'review';

interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  professionCategoryId: string;
  customProfession: string;
  hasCv: boolean;
  cvUrl: string;
  profileData: ProfileData;
  certificates: { name: string; url: string }[];
  achievements: string;
  socialLinks: {
    linkedin?: string;
    github?: string;
    youtube?: string;
  };
  additionalNotes: string;
}

const emptyProfileData: ProfileData = {
  education: [],
  experience: [],
  skills: [],
  projects: [],
  achievements: [],
};

const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'personal', label: 'Personal Info', icon: <User className="h-4 w-4" /> },
  { id: 'cv', label: 'CV / Profile', icon: <FileText className="h-4 w-4" /> },
  { id: 'certificates', label: 'Certificates', icon: <Award className="h-4 w-4" /> },
  { id: 'social', label: 'Social Links', icon: <Globe className="h-4 w-4" /> },
  { id: 'review', label: 'Review', icon: <CheckCircle className="h-4 w-4" /> },
];

// Format phone number for Bangladesh
const formatBDPhone = (value: string): string => {
  // Remove all non-digits
  let digits = value.replace(/\D/g, '');
  
  // If starts with 880, keep it
  if (digits.startsWith('880')) {
    digits = digits.substring(3);
  }
  
  // Limit to 10 digits (Bangladesh mobile without country code)
  digits = digits.substring(0, 10);
  
  // Format as XXXX-XXXXXX if we have enough digits
  if (digits.length > 4) {
    return `${digits.substring(0, 4)}-${digits.substring(4)}`;
  }
  
  return digits;
};

// Get full phone number with country code
const getFullPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return '';
  return `+880${digits}`;
};

export default function PortfolioRequest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string>("");
  const [professionCategories, setProfessionCategories] = useState<ProfessionCategory[]>([]);
  const [categoriesStatus, setCategoriesStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    professionCategoryId: '',
    customProfession: '',
    hasCv: true,
    cvUrl: '',
    profileData: emptyProfileData,
    certificates: [],
    achievements: '',
    socialLinks: {},
    additionalNotes: '',
  });

  useEffect(() => {
    loadProfessionCategories();
  }, []);

  const loadProfessionCategories = async () => {
    setCategoriesStatus('loading');
    
    try {
      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const { data, error } = await supabase
        .from('profession_categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order')
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('[PortfolioRequest] Error loading categories:', error);
        setCategoriesStatus('error');
        return;
      }
      
      if (data && data.length > 0) {
        setProfessionCategories(data);
        setCategoriesStatus('loaded');
      } else {
        setCategoriesStatus('error');
      }
    } catch (err: any) {
      console.error('[PortfolioRequest] Failed to load categories:', err);
      setCategoriesStatus('error');
    }
  };

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const selectedCategory = professionCategories.find(c => c.id === formData.professionCategoryId);
  const isOtherCategory = selectedCategory?.slug === 'other';

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'personal':
        const hasName = formData.fullName.trim().length >= 2;
        const hasEmail = formData.email.includes('@');
        const hasPhone = formData.phone.replace(/\D/g, '').length >= 10;
        const hasCategory = !!formData.professionCategoryId || categoriesStatus === 'error';
        const hasCustomProfession = !isOtherCategory || formData.customProfession.trim().length > 0;
        return hasName && hasEmail && hasPhone && hasCategory && hasCustomProfession;
      case 'cv':
        return formData.hasCv ? !!formData.cvUrl : formData.profileData.education.length > 0;
      case 'certificates':
      case 'social':
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

  const handlePhoneChange = (value: string) => {
    const formatted = formatBDPhone(value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const fullPhone = getFullPhone(formData.phone);
    const isOther = selectedCategory?.slug === 'other';
    const professionCategoryId = formData.professionCategoryId || null;
    
    try {
      const insertData = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: fullPhone,
        profession_category_id: professionCategoryId,
        custom_profession: isOther ? formData.customProfession.trim() : null,
        cv_url: formData.hasCv ? formData.cvUrl : null,
        profile_data: (!formData.hasCv ? formData.profileData : {}) as unknown as any,
        certificates: formData.certificates as unknown as any,
        achievements: formData.achievements.trim() || null,
        social_links: formData.socialLinks as unknown as any,
        additional_notes: formData.additionalNotes.trim() || null,
      };

      const { data, error } = await supabase
        .from('portfolio_requests')
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      // Create professional profile (non-blocking)
      try {
        await supabase
          .from('professionals')
          .upsert({
            full_name: formData.fullName.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: fullPhone,
            profession_category_id: professionCategoryId,
            custom_profession: isOther ? formData.customProfession.trim() : null,
            cv_url: formData.hasCv ? formData.cvUrl : null,
            education: formData.profileData.education as unknown as any,
            experience: formData.profileData.experience as unknown as any,
            skills: formData.profileData.skills as unknown as any,
            projects: formData.profileData.projects as unknown as any,
            achievements: formData.profileData.achievements as unknown as any,
            linkedin_url: formData.socialLinks.linkedin || null,
            services_used: ['portfolio'] as unknown as any,
          }, { onConflict: 'email' });
        console.log('[PortfolioRequest] Professional profile created');
      } catch (e) {
        console.log('[PortfolioRequest] Professional profile skipped:', e);
      }

      setRequestId(data.id);
      setIsSuccess(true);
      toast({ title: "Request submitted!", description: "We'll contact you on WhatsApp soon." });
    } catch (error: any) {
      console.error('[PortfolioRequest] Submission failed:', error);
      
      let message = "Please try again or contact support.";
      if (error.message?.includes('duplicate')) {
        message = "You've already submitted a request with this email.";
      } else if (error.message?.includes('network')) {
        message = "Network error. Please check your internet connection.";
      }
      
      toast({ 
        title: "Submission failed", 
        description: message, 
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group categories for better UX
  const studentCategories = professionCategories.filter(c => 
    ['student-undergrad', 'student-graduate', 'fresh-graduate'].includes(c.slug)
  );
  const professionalCategories = professionCategories.filter(c => 
    !['student-undergrad', 'student-graduate', 'fresh-graduate', 'career-changer', 'other'].includes(c.slug)
  );
  const otherCategories = professionCategories.filter(c => 
    ['career-changer', 'other'].includes(c.slug)
  );

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
              </div>
            ))}
          </div>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStepIndex].label}</CardTitle>
              <CardDescription>
                {currentStep === 'personal' && "Tell us about yourself so we can contact you"}
                {currentStep === 'cv' && "Upload your CV or fill in your information"}
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
                    <div className="flex">
                      <div className="flex items-center px-3 bg-muted border border-r-0 border-input rounded-l-md text-sm text-muted-foreground">
                        +880
                      </div>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="1XXX-XXXXXX"
                        className="rounded-l-none"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Enter your 10-digit Bangladesh mobile number</p>
                  </div>
                  <div>
                    <Label htmlFor="profession">Profession / Status *</Label>
                    {categoriesStatus === 'loading' ? (
                      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading categories...</span>
                      </div>
                    ) : categoriesStatus === 'error' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 border border-destructive/50 rounded-md bg-destructive/5">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span className="text-sm text-muted-foreground">Failed to load categories</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={loadProfessionCategories}
                            className="ml-auto"
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Retry
                          </Button>
                        </div>
                        <Input
                          value={formData.customProfession}
                          onChange={(e) => setFormData({ ...formData, customProfession: e.target.value })}
                          placeholder="Enter your profession or field of study"
                        />
                      </div>
                    ) : (
                      <Select
                        value={formData.professionCategoryId}
                        onValueChange={(value) => setFormData({ ...formData, professionCategoryId: value, customProfession: '' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your profession or status" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {studentCategories.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                Students & Fresh Graduates
                              </div>
                              {studentCategories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </>
                          )}
                          {professionalCategories.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                                Professionals
                              </div>
                              {professionalCategories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </>
                          )}
                          {otherCategories.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                                Other
                              </div>
                              {otherCategories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  {isOtherCategory && (
                    <div>
                      <Label htmlFor="customProfession">Specify Your Profession / Field of Study *</Label>
                      <Input
                        id="customProfession"
                        value={formData.customProfession}
                        onChange={(e) => setFormData({ ...formData, customProfession: e.target.value })}
                        placeholder="e.g., International Relations, Philosophy, Architecture"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* CV Upload Step */}
              {currentStep === 'cv' && (
                <div className="space-y-4">
                  {/* Toggle between CV upload and Profile Builder */}
                  <div className="flex gap-2 p-1 bg-muted rounded-lg">
                    <Button
                      type="button"
                      variant={formData.hasCv ? "default" : "ghost"}
                      className="flex-1"
                      onClick={() => setFormData({ ...formData, hasCv: true })}
                    >
                      <FileUp className="h-4 w-4 mr-2" />
                      I have a CV
                    </Button>
                    <Button
                      type="button"
                      variant={!formData.hasCv ? "default" : "ghost"}
                      className="flex-1"
                      onClick={() => setFormData({ ...formData, hasCv: false })}
                    >
                      <PenLine className="h-4 w-4 mr-2" />
                      Fill in my info
                    </Button>
                  </div>

                  {formData.hasCv ? (
                    <MultiFileUpload
                      bucket="portfolio-uploads"
                      maxFiles={1}
                      acceptedTypes=".pdf,.doc,.docx"
                      value={formData.cvUrl ? [{ name: 'CV', url: formData.cvUrl }] : []}
                      onChange={(files) => setFormData({ ...formData, cvUrl: files[0]?.url || '' })}
                      label="Upload your CV/Resume"
                      description="PDF or Word document (max 10MB)"
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-4 rounded-lg text-sm">
                        <p className="font-medium mb-1">Don't have a CV? No problem!</p>
                        <p className="text-muted-foreground">
                          Fill in your information below and we'll use it to create your portfolio. 
                          Start with Education and add at least one entry to continue.
                        </p>
                      </div>
                      <ProfileBuilderForm
                        value={formData.profileData}
                        onChange={(profileData) => setFormData({ ...formData, profileData })}
                      />
                    </div>
                  )}
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
                        <p><span className="text-muted-foreground">WhatsApp:</span> {getFullPhone(formData.phone)}</p>
                        <p><span className="text-muted-foreground">Category:</span> {selectedCategory?.name || formData.customProfession || 'Not specified'}</p>
                        {isOtherCategory && formData.customProfession && (
                          <p><span className="text-muted-foreground">Field:</span> {formData.customProfession}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Documents & Profile
                      </h4>
                      <div className="text-sm space-y-1">
                        {formData.hasCv ? (
                          <p><span className="text-muted-foreground">CV:</span> {formData.cvUrl ? 'Uploaded ✓' : 'Not uploaded'}</p>
                        ) : (
                          <>
                            <p><span className="text-muted-foreground">Profile Info:</span> Filled manually ✓</p>
                            <p><span className="text-muted-foreground">Education:</span> {formData.profileData.education.length} entries</p>
                            <p><span className="text-muted-foreground">Experience:</span> {formData.profileData.experience.length} entries</p>
                            <p><span className="text-muted-foreground">Skills:</span> {formData.profileData.skills.length} skills</p>
                          </>
                        )}
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
                          {formData.socialLinks.youtube && <p>YouTube: {formData.socialLinks.youtube}</p>}
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
