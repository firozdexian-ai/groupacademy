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
import MultiFileUpload from "@/components/portfolio/MultiFileUpload";
import { SimpleFileUpload } from "@/components/portfolio/SimpleFileUpload";
import ProfileBuilderForm, { ProfileData } from "@/components/portfolio/ProfileBuilderForm";
import { Briefcase, User, FileText, Award, Globe, CheckCircle, ArrowLeft, ArrowRight, Loader2, FileUp, PenLine, Gift, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useTalent } from "@/hooks/useTalent";
import { ExistingCVCard } from "@/components/cv/ExistingCVCard";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";

const FREE_PORTFOLIO_LIMIT = 1000;

const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

type Step = 'personal' | 'cv' | 'certificates' | 'social' | 'review';

interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
}

type CvInputMode = 'upload' | 'url' | 'profile' | 'existing';

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

export default function AppPortfolioRequest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { talent, user, addServiceUsed } = useTalent();
  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string>("");
  const [professionCategories, setProfessionCategories] = useState<ProfessionCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [portfolioCount, setPortfolioCount] = useState<number | null>(null);
  
  const remainingFree = portfolioCount !== null ? Math.max(0, FREE_PORTFOLIO_LIMIT - portfolioCount) : null;
  const isFreePromotion = remainingFree !== null && remainingFree > 0;
  
  const hasExistingCv = !!(talent?.cvUrl);
  
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
    if (talent) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || talent.fullName || '',
        email: prev.email || talent.email || '',
        phone: prev.phone || talent.phone || '',
        professionCategoryId: prev.professionCategoryId || talent.professionCategoryId || '',
        cvUrl: prev.cvUrl || talent.cvUrl || '',
        socialLinks: {
          ...prev.socialLinks,
          linkedin: prev.socialLinks.linkedin || talent.linkedinUrl || '',
        },
        cvInputMode: talent.cvUrl ? 'existing' : prev.cvInputMode,
      }));
    }
  }, [talent]);

  useEffect(() => {
    loadProfessionCategories();
    loadPortfolioCount();
  }, []);

  const loadPortfolioCount = async () => {
    try {
      const { count, error } = await supabase
        .from('portfolio_requests')
        .select('*', { count: 'exact', head: true });
      
      if (!error) setPortfolioCount(count || 0);
    } catch (err) {
      console.error('Failed to load portfolio count:', err);
    }
  };

  const loadProfessionCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('profession_categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order');
      
      if (!error && data) {
        setProfessionCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const selectedCategory = professionCategories.find(c => c.id === formData.professionCategoryId);
  const isOtherCategory = selectedCategory?.slug === 'other';
  
  const effectiveCvUrl = formData.cvInputMode === 'url' 
    ? formData.cvExternalUrl 
    : formData.cvInputMode === 'existing' 
      ? talent?.cvUrl || formData.cvUrl 
      : formData.cvUrl;

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'personal':
        const hasBasicInfo = !!(formData.fullName && formData.email && formData.phone);
        const hasValidCategory = formData.professionCategoryId && (!isOtherCategory || formData.customProfession);
        return hasBasicInfo && !!hasValidCategory;
      case 'cv':
        if (formData.cvInputMode === 'upload') return !!formData.cvUrl;
        if (formData.cvInputMode === 'url') return !!formData.cvExternalUrl && formData.cvExternalUrl.startsWith('http');
        if (formData.cvInputMode === 'existing') return !!talent?.cvUrl;
        return formData.profileData.education.length > 0;
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const professionCategoryId = formData.professionCategoryId && isValidUUID(formData.professionCategoryId) 
      ? formData.professionCategoryId 
      : null;
    
    try {
      const tempRequestId = crypto.randomUUID();
      
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
          talent_id: talent?.id || null,
        });

      if (error) throw error;

      if (talent?.id) {
        await addServiceUsed('portfolio');
      }

      setRequestId(tempRequestId);
      setIsSuccess(true);
      toast({ title: "Request submitted!", description: "We'll contact you on WhatsApp soon." });
    } catch (error: any) {
      console.error('Submission failed:', error);
      toast({ 
        title: "Submission failed", 
        description: error.message || "Please try again.", 
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Request Submitted!</CardTitle>
            <CardDescription>
              Our team will contact you on WhatsApp within 24-48 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Your Request ID</p>
              <p className="font-mono font-semibold">{requestId.slice(0, 8).toUpperCase()}</p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/app/services')}>
                Back to Services
              </Button>
              <Button variant="outline" onClick={() => navigate('/portfolio-status')}>
                Check Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => navigate('/app/services')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Services
      </Button>

      <ProfileCompletionPrompt variant="banner" className="mb-6" />

      {/* Free promotion banner */}
      {isFreePromotion && (
        <Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-primary">FREE for first 1,000 users!</p>
                <p className="text-sm text-muted-foreground">
                  {remainingFree} spots remaining
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center mb-6">
        <Badge variant="secondary" className="mb-4">Digital Portfolio</Badge>
        <h1 className="text-2xl font-bold">Request Your Portfolio</h1>
        <p className="text-muted-foreground mt-2">
          Get a professionally designed portfolio website
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div 
            key={s.id}
            className={`flex items-center gap-2 ${i <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <div className={`p-2 rounded-full ${i <= currentStepIndex ? 'bg-primary/10' : 'bg-muted'}`}>
              {s.icon}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${i < currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStepIndex].label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Personal Info Step */}
          {currentStep === 'personal' && (
            <>
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone (WhatsApp) *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+880XXXXXXXXX"
                />
              </div>
              <div>
                <Label>Profession *</Label>
                <Select 
                  value={formData.professionCategoryId} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, professionCategoryId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select profession" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isOtherCategory && (
                <div>
                  <Label>Specify Profession *</Label>
                  <Input
                    value={formData.customProfession}
                    onChange={(e) => setFormData(prev => ({ ...prev, customProfession: e.target.value }))}
                    placeholder="Your profession"
                  />
                </div>
              )}
            </>
          )}

          {/* CV Step */}
          {currentStep === 'cv' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {hasExistingCv && (
                  <Button
                    variant={formData.cvInputMode === 'existing' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, cvInputMode: 'existing' }))}
                  >
                    <FileCheck className="h-4 w-4 mr-1" />
                    Existing
                  </Button>
                )}
                <Button
                  variant={formData.cvInputMode === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, cvInputMode: 'upload' }))}
                >
                  <FileUp className="h-4 w-4 mr-1" />
                  Upload
                </Button>
                <Button
                  variant={formData.cvInputMode === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, cvInputMode: 'url' }))}
                >
                  <Globe className="h-4 w-4 mr-1" />
                  URL
                </Button>
                <Button
                  variant={formData.cvInputMode === 'profile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, cvInputMode: 'profile' }))}
                >
                  <PenLine className="h-4 w-4 mr-1" />
                  Build
                </Button>
              </div>

              {formData.cvInputMode === 'existing' && hasExistingCv && (
                <ExistingCVCard 
                  talent={talent} 
                  onUseExisting={() => setFormData(prev => ({ ...prev, cvUrl: talent?.cvUrl || '' }))}
                  onUploadNew={() => setFormData(prev => ({ ...prev, cvInputMode: 'upload' }))}
                />
              )}

              {formData.cvInputMode === 'upload' && (
                <SimpleFileUpload
                  accept=".pdf,.doc,.docx"
                  onFileUploaded={(url) => setFormData(prev => ({ ...prev, cvUrl: url }))}
                  onUrlProvided={(url) => setFormData(prev => ({ ...prev, cvUrl: url }))}
                  currentValue={formData.cvUrl}
                />
              )}

              {formData.cvInputMode === 'url' && (
                <div>
                  <Label>CV/Resume URL</Label>
                  <Input
                    value={formData.cvExternalUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, cvExternalUrl: e.target.value }))}
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              )}

              {formData.cvInputMode === 'profile' && (
                <ProfileBuilderForm
                  value={formData.profileData}
                  onChange={(data) => setFormData(prev => ({ ...prev, profileData: data }))}
                />
              )}
            </div>
          )}

          {/* Certificates Step */}
          {currentStep === 'certificates' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Upload certificates (optional)</p>
              <MultiFileUpload
                bucket="portfolio-uploads"
                value={formData.certificates.map(c => ({ name: c.name, url: c.url }))}
                onChange={(files) => setFormData(prev => ({ 
                  ...prev, 
                  certificates: files.map(f => ({ name: f.name, url: f.url }))
                }))}
                label="Certificates & Documents"
                description="Upload your certificates, transcripts, or other supporting documents"
              />
              <div>
                <Label>Key Achievements</Label>
                <Textarea
                  value={formData.achievements}
                  onChange={(e) => setFormData(prev => ({ ...prev, achievements: e.target.value }))}
                  placeholder="List your key achievements..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          {/* Social Step */}
          {currentStep === 'social' && (
            <div className="space-y-4">
              <div>
                <Label>LinkedIn URL</Label>
                <Input
                  value={formData.socialLinks.linkedin || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                  }))}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div>
                <Label>GitHub URL</Label>
                <Input
                  value={formData.socialLinks.github || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    socialLinks: { ...prev.socialLinks, github: e.target.value }
                  }))}
                  placeholder="https://github.com/..."
                />
              </div>
              <div>
                <Label>Personal Website</Label>
                <Input
                  value={formData.socialLinks.website || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    socialLinks: { ...prev.socialLinks, website: e.target.value }
                  }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  placeholder="Any additional information..."
                />
              </div>
            </div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p><strong>Name:</strong> {formData.fullName}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Phone:</strong> {formData.phone}</p>
                <p><strong>Profession:</strong> {selectedCategory?.name || 'Not selected'}</p>
                <p><strong>CV:</strong> {effectiveCvUrl ? 'Provided' : 'Not provided'}</p>
                <p><strong>Certificates:</strong> {formData.certificates.length} uploaded</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            {currentStepIndex > 0 && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            {currentStep !== 'review' ? (
              <Button 
                className="flex-1" 
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                className="flex-1" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Request
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
