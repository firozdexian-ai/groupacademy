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
import { SimpleFileUpload } from "@/components/portfolio/SimpleFileUpload";
import ProfileBuilderForm, { ProfileData } from "@/components/portfolio/ProfileBuilderForm";
import { Briefcase, User, FileText, Award, Globe, CheckCircle, ArrowLeft, ArrowRight, Loader2, FileUp, PenLine, RefreshCw, Gift, Sparkles, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Brand icon
import iconPortfolio from "@/assets/icons/icon-portfolio.png";

const FREE_PORTFOLIO_LIMIT = 1000;

// UUID validation helper
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Fallback static categories with REAL database UUIDs
const FALLBACK_CATEGORIES: ProfessionCategory[] = [
  { id: '30dbc71e-26de-4131-bd97-073e593f9d93', name: 'Student (Undergraduate)', slug: 'student-undergrad' },
  { id: '30e1aff7-a7fa-4bb1-ac5e-d226e4754930', name: 'Student (Graduate/Masters)', slug: 'student-graduate' },
  { id: '1d65c422-6eef-412c-b843-8ae3d9ac37d5', name: 'Fresh Graduate', slug: 'fresh-graduate' },
  { id: 'a1c5d82c-1a1a-4b0e-89e8-19c264a3a915', name: 'Banking & Finance', slug: 'banking-finance' },
  { id: '5ee052f8-2aaf-45b5-8f90-731c23097fef', name: 'Sales & Marketing', slug: 'sales-marketing' },
  { id: '1e71843c-d202-4d96-834e-04fa6c784f16', name: 'Technology & IT', slug: 'technology-it' },
  { id: 'e5489921-ce14-448b-a017-b762a3b72a8d', name: 'Human Resources', slug: 'hr-admin' },
  { id: 'a8c5f269-03bd-4589-954e-51eb1e1fbf32', name: 'Operations & Supply Chain', slug: 'operations' },
  { id: '2c541af4-1cc0-4704-81aa-78df992aad6b', name: 'Healthcare & Pharma', slug: 'healthcare' },
  { id: 'ba50f709-610e-4770-9d2c-918a39073175', name: 'Career Changer', slug: 'career-changer' },
  { id: 'b4038064-ec0f-4814-a966-ca4c9984bca2', name: 'Other (Specify)', slug: 'other' },
];

type Step = 'personal' | 'cv' | 'certificates' | 'social' | 'review';

interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
}

type CvInputMode = 'upload' | 'url' | 'profile';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  professionCategoryId: string;
  customProfession: string;
  cvInputMode: CvInputMode;
  cvUrl: string;
  cvExternalUrl: string;
  profileData: ProfileData;
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

export default function PortfolioRequest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string>("");
  const [professionCategories, setProfessionCategories] = useState<ProfessionCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryLoadError, setCategoryLoadError] = useState(false);
  const [portfolioCount, setPortfolioCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  
  const remainingFree = portfolioCount !== null ? Math.max(0, FREE_PORTFOLIO_LIMIT - portfolioCount) : null;
  const isFreePromotion = remainingFree !== null && remainingFree > 0;
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    professionCategoryId: '',
    customProfession: '',
    cvInputMode: 'upload',
    cvUrl: '',
    cvExternalUrl: '',
    profileData: emptyProfileData,
    certificates: [],
    achievements: '',
    socialLinks: {},
    additionalNotes: '',
  });

  useEffect(() => {
    loadProfessionCategories();
    loadPortfolioCount();
    
    // Load form backup from localStorage
    const backup = localStorage.getItem('portfolio_form_backup');
    if (backup) {
      try {
        const parsed = JSON.parse(backup);
        setFormData(prev => ({ ...prev, ...parsed }));
        console.log('[PortfolioRequest] Restored form data from backup');
      } catch (e) {
        console.log('[PortfolioRequest] Could not parse form backup');
      }
    }
  }, []);
  
  // Save form data to localStorage on changes
  useEffect(() => {
    if (formData.fullName || formData.email) {
      localStorage.setItem('portfolio_form_backup', JSON.stringify({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        professionCategoryId: formData.professionCategoryId,
        customProfession: formData.customProfession,
        cvInputMode: formData.cvInputMode,
        cvExternalUrl: formData.cvExternalUrl,
        achievements: formData.achievements,
        socialLinks: formData.socialLinks,
        additionalNotes: formData.additionalNotes,
        // Don't save uploaded files/profile data as they're too large
      }));
    }
  }, [formData.fullName, formData.email, formData.phone, formData.professionCategoryId, formData.customProfession, formData.cvInputMode, formData.cvExternalUrl, formData.achievements, formData.socialLinks, formData.additionalNotes]);

  const loadPortfolioCount = async () => {
    setIsLoadingCount(true);
    
    // 15-second timeout for count loading
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Count loading timed out')), 15000);
    });
    
    try {
      const fetchPromise = supabase
        .from('portfolio_requests')
        .select('*', { count: 'exact', head: true });
      
      const { count, error } = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (error) {
        console.error('[PortfolioRequest] Error loading portfolio count:', error);
      } else {
        setPortfolioCount(count || 0);
      }
    } catch (err) {
      console.error('[PortfolioRequest] Failed to load portfolio count:', err);
      // Don't block the form, just use a default
      setPortfolioCount(0);
    } finally {
      setIsLoadingCount(false);
    }
  };

  const loadProfessionCategories = async () => {
    setIsLoadingCategories(true);
    setCategoryLoadError(false);
    
    // Create a timeout promise (10 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), 10000);
    });
    
    try {
      const fetchPromise = supabase
        .from('profession_categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order');
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (error) {
        console.error('[PortfolioRequest] Error loading profession categories:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        setProfessionCategories(data);
      } else {
        // No data returned, use fallback
        console.log('[PortfolioRequest] No categories from DB, using fallback');
        setProfessionCategories(FALLBACK_CATEGORIES);
      }
    } catch (err) {
      console.error('[PortfolioRequest] Failed to load categories, using fallback:', err);
      setCategoryLoadError(true);
      setProfessionCategories(FALLBACK_CATEGORIES);
      toast({
        title: "Using offline categories",
        description: "Couldn't load latest categories. You can still proceed.",
      });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const selectedCategory = professionCategories.find(c => c.id === formData.professionCategoryId);
  const isOtherCategory = selectedCategory?.slug === 'other';
  
  // Get the effective CV URL (either from upload or external)
  const effectiveCvUrl = formData.cvInputMode === 'url' ? formData.cvExternalUrl : formData.cvUrl;

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'personal':
        const hasBasicInfo = !!(formData.fullName && formData.email && formData.phone);
        const hasValidCategory = formData.professionCategoryId && (!isOtherCategory || formData.customProfession);
        return hasBasicInfo && !!hasValidCategory;
      case 'cv':
        // Either has CV (uploaded or URL) OR has filled profile data with at least education
        if (formData.cvInputMode === 'upload') return !!formData.cvUrl;
        if (formData.cvInputMode === 'url') return !!formData.cvExternalUrl && formData.cvExternalUrl.startsWith('http');
        return formData.profileData.education.length > 0;
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
    setIsSubmitting(true);
    
    // Validate UUID before submission - only send valid UUIDs
    const professionCategoryId = formData.professionCategoryId && isValidUUID(formData.professionCategoryId) 
      ? formData.professionCategoryId 
      : null;
    
    if (formData.professionCategoryId && !professionCategoryId) {
      console.warn('[PortfolioRequest] Invalid UUID detected, sending null for profession_category_id');
    }
    
    // Overall 60-second timeout for submission
    const submissionTimeout = setTimeout(() => {
      setIsSubmitting(false);
      toast({ 
        title: "Submission timed out", 
        description: "Please check your internet connection and try again.", 
        variant: "destructive",
        duration: 10000,
      });
    }, 60000);
    
    try {
      // Generate a local request ID for confirmation (anonymous users can't SELECT after INSERT)
      const tempRequestId = crypto.randomUUID();
      
      // Insert WITHOUT .select() to avoid RLS SELECT permission issues for anonymous users
      const { error } = await supabase
        .from('portfolio_requests')
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          profession_category_id: professionCategoryId,
          custom_profession: isOtherCategory ? formData.customProfession : null,
          cv_url: effectiveCvUrl || null,
          profile_data: (formData.cvInputMode === 'profile' ? formData.profileData : {}) as unknown as any,
          certificates: formData.certificates as unknown as any,
          achievements: formData.achievements,
          social_links: formData.socialLinks as unknown as any,
          additional_notes: formData.additionalNotes,
        });

      if (error) {
        console.error('[PortfolioRequest] Insert error:', error);
        throw error;
      }

      // Create professional profile using CHECK-THEN-INSERT pattern (avoids RLS UPDATE issues for anonymous users)
      try {
        // 10-second timeout for professional profile creation
        const profTimeout = new Promise<void>((_, reject) => 
          setTimeout(() => reject(new Error('Profile creation timed out')), 10000)
        );
        
        const profInsert = (async () => {
          // First check if professional exists by email
          const { data: existing } = await supabase
            .from('professionals')
            .select('id')
            .eq('email', formData.email)
            .maybeSingle();
          
          // Only INSERT if doesn't exist (avoid UPDATE RLS issues)
          if (!existing) {
            await supabase.from('professionals').insert({
              full_name: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              profession_category_id: professionCategoryId,
              custom_profession: isOtherCategory ? formData.customProfession : null,
              cv_url: effectiveCvUrl || null,
              education: formData.profileData.education as unknown as any,
              experience: formData.profileData.experience as unknown as any,
              skills: formData.profileData.skills as unknown as any,
              projects: formData.profileData.projects as unknown as any,
              achievements: formData.profileData.achievements as unknown as any,
              linkedin_url: formData.socialLinks.linkedin || null,
              services_used: ['portfolio'] as unknown as any,
            });
            console.log('[PortfolioRequest] Professional profile created');
          } else {
            console.log('[PortfolioRequest] Professional already exists, skipping insert');
          }
        })();
        
        await Promise.race([profInsert, profTimeout]).catch((err) => {
          console.log('[PortfolioRequest] Professional profile creation skipped:', err.message);
        });
      } catch (profError) {
        console.log('[PortfolioRequest] Professional profile creation skipped:', profError);
        // Non-blocking - portfolio request already saved
      }

      clearTimeout(submissionTimeout);
      // Clear form backup on success
      localStorage.removeItem('portfolio_form_backup');
      setRequestId(tempRequestId);
      setIsSuccess(true);
      toast({ title: "Request submitted!", description: "We'll contact you on WhatsApp soon." });
    } catch (error: any) {
      clearTimeout(submissionTimeout);
      console.error('[PortfolioRequest] Submission failed:', error);
      toast({ 
        title: "Submission failed", 
        description: error.message || "Please try again or contact support.", 
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      clearTimeout(submissionTimeout);
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
            <div className="icon-container-lg mx-auto mb-6">
              <img src={iconPortfolio} alt="Digital Portfolio" className="w-11 h-11 object-contain" />
            </div>
            <Badge className="mb-4 gap-2 border-primary/30 text-primary" variant="outline">
              <Sparkles className="w-3 h-3" />
              Professional Portfolio Creation
            </Badge>
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">Digital Portfolio Service</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Get a professional portfolio website created by our career experts
            </p>
          </div>

          {/* Free Promotion Banner */}
          {!isLoadingCount && (
            <div className={`mb-6 p-4 rounded-lg border-2 ${
              isFreePromotion 
                ? 'bg-primary/5 border-primary/20' 
                : 'bg-muted border-border'
            }`}>
              {isFreePromotion ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Gift className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">First 1000 Free!</span>
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Limited Offer
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Get your portfolio created absolutely free
                      </p>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <div className="text-2xl font-bold text-primary">{remainingFree}</div>
                    <p className="text-xs text-muted-foreground">spots remaining</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="font-semibold">Professional Portfolio Service</span>
                      <p className="text-sm text-muted-foreground">
                        Get your portfolio created by our expert team
                      </p>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <div className="text-2xl font-bold">BDT 100</div>
                    <p className="text-xs text-muted-foreground">one-time fee</p>
                  </div>
                </div>
              )}
            </div>
          )}

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
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Auto-format Bangladesh phone numbers
                        // Remove non-digits except +
                        value = value.replace(/[^\d+]/g, '');
                        // If starts with 0, replace with +880
                        if (value.startsWith('0')) {
                          value = '+880' + value.slice(1);
                        }
                        // If starts with 880 (without +), add +
                        if (value.startsWith('880') && !value.startsWith('+')) {
                          value = '+' + value;
                        }
                        // If user enters just digits starting with 1, assume Bangladesh
                        if (/^1\d{9}$/.test(value)) {
                          value = '+880' + value;
                        }
                        setFormData({ ...formData, phone: value });
                      }}
                      placeholder="01XXX-XXXXXX"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Bangladesh numbers will be auto-formatted with +880
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="profession">Profession / Status *</Label>
                      {categoryLoadError && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={loadProfessionCategories}
                          className="h-6 text-xs"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                    <Select
                      value={formData.professionCategoryId}
                      onValueChange={(value) => setFormData({ ...formData, professionCategoryId: value, customProfession: '' })}
                      disabled={isLoadingCategories}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select your profession or status"} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {isLoadingCategories ? (
                          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                            Loading...
                          </div>
                        ) : (
                          <>
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
                          </>
                        )}
                      </SelectContent>
                    </Select>
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
                  {/* Toggle between CV upload/URL and Profile Builder */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                    <Button
                      type="button"
                      variant={formData.cvInputMode !== 'profile' ? "default" : "ghost"}
                      className="flex-1"
                      onClick={() => setFormData({ ...formData, cvInputMode: 'upload' })}
                    >
                      <FileUp className="h-4 w-4 mr-2" />
                      <span>Upload / Link</span>
                    </Button>
                    <Button
                      type="button"
                      variant={formData.cvInputMode === 'profile' ? "default" : "ghost"}
                      className="flex-1"
                      onClick={() => setFormData({ ...formData, cvInputMode: 'profile' })}
                    >
                      <PenLine className="h-4 w-4 mr-2" />
                      <span>Fill Info</span>
                    </Button>
                  </div>

                  {(formData.cvInputMode === 'upload' || formData.cvInputMode === 'url') && (
                    <div className="space-y-4">
                      <SimpleFileUpload
                        onFileUploaded={(url) => setFormData({ ...formData, cvUrl: url, cvExternalUrl: '' })}
                        onUrlProvided={(url) => setFormData({ ...formData, cvExternalUrl: url, cvUrl: '' })}
                        currentValue={formData.cvUrl || formData.cvExternalUrl}
                        accept=".pdf,.doc,.docx"
                        maxSizeMB={10}
                      />
                    </div>
                  )}

                  {formData.cvInputMode === 'profile' && (
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
                        <p><span className="text-muted-foreground">Category:</span> {selectedCategory?.name || 'Not selected'}</p>
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
                        {formData.cvInputMode === 'upload' && (
                          <p><span className="text-muted-foreground">CV:</span> {formData.cvUrl ? 'Uploaded ✓' : 'Not uploaded'}</p>
                        )}
                        {formData.cvInputMode === 'url' && (
                          <p><span className="text-muted-foreground">CV Link:</span> {formData.cvExternalUrl ? 'Provided ✓' : 'Not provided'}</p>
                        )}
                        {formData.cvInputMode === 'profile' && (
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
