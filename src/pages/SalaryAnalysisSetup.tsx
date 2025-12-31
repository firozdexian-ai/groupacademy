import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertCircle, Loader2, CheckCircle, FileCheck } from "lucide-react";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useProgressiveLoadingMessage } from "@/hooks/useProgressiveLoadingMessage";
import { AuthGate } from "@/components/AuthGate";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { ExistingCVCard } from "@/components/cv/ExistingCVCard";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";
import { RetryErrorCard, getErrorType } from "@/components/ui/retry-error-card";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";

const SalaryAnalysisSetupContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { talent, user, addServiceUsed, updateTalent, refreshTalent } = useTalent();
  const { canAfford, getServiceCost, balance } = useCredits();
  
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [canProceed, setCanProceed] = useState<boolean | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [showAccessCodeInput, setShowAccessCodeInput] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [cvText, setCvText] = useState("");
  const [cvInputMode, setCvInputMode] = useState<"text" | "file" | "existing">("text");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cvUrl, setCvUrl] = useState("");
  
  const [professionCategories, setProfessionCategories] = useState<any[]>([]);
  const [selectedProfession, setSelectedProfession] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [showCreditSheet, setShowCreditSheet] = useState(false);

  // Check if talent has existing CV
  const hasExistingCv = !!(talent?.cvUrl || talent?.cvText);

  // Auto-fill from talent profile
  useEffect(() => {
    if (talent) {
      setEmail(prev => prev || talent.email || "");
      setFullName(prev => prev || talent.fullName || "");
      setPhone(prev => prev || talent.phone?.replace(/^\+880/, "") || "");
      if (talent.professionCategoryId) {
        setSelectedProfession(prev => prev || talent.professionCategoryId || "");
      }
      // If talent has existing CV, default to using it
      if (hasExistingCv && cvInputMode === "text") {
        setCvInputMode("existing");
        if (talent.cvUrl) setCvUrl(talent.cvUrl);
        if (talent.cvText) setCvText(talent.cvText);
      }
    } else if (user?.email) {
      setEmail(prev => prev || user.email || "");
    }
  }, [talent, user, hasExistingCv]);

  useEffect(() => {
    const loadCategories = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.CATEGORY_LOAD);
      
      try {
        const { data, error } = await supabase
          .from("profession_categories")
          .select("id, name")
          .eq("is_active", true)
          .order("display_order")
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);
        if (error) throw error;
        if (data) setProfessionCategories(data);
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error("Error loading categories:", error);
      }
    };
    loadCategories();
  }, []);

  const { message: loadingMessage } = useProgressiveLoadingMessage(isCheckingEmail);

  const checkEmailCooldown = async () => {
    if (!email.trim()) {
      toast({ title: "Please enter your email", variant: "destructive" });
      return;
    }

    setIsCheckingEmail(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.DEFAULT);
    
    try {
      const { data, error } = await supabase
        .from("salary_analyses")
        .select("created_at")
        .eq("email", email.trim().toLowerCase())
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) throw error;

      if (!data || data.length === 0) {
        setCanProceed(true);
        setShowAccessCodeInput(false);
      } else {
        const lastAnalysis = new Date(data[0].created_at);
        const cooldownEnd = new Date(lastAnalysis.getTime() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();

        if (now >= cooldownEnd) {
          setCanProceed(true);
          setShowAccessCodeInput(false);
        } else {
          const remaining = Math.ceil((cooldownEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          setDaysRemaining(remaining);
          setCanProceed(false);
          setShowAccessCodeInput(true);
        }
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Error checking email:", error);
      const isTimeout = error?.name === "AbortError" || error?.message?.includes("timed out");
      toast({ 
        title: isTimeout ? "Connection timed out" : "Error checking eligibility", 
        description: "Please try again",
        variant: "destructive" 
      });
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const validateAccessCode = async () => {
    if (!accessCode.trim()) {
      toast({ title: "Please enter access code", variant: "destructive" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("salary_analysis_access_codes")
        .select("*")
        .eq("code", accessCode.trim().toUpperCase())
        .eq("email", email.trim().toLowerCase())
        .eq("is_used", false)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error || !data) {
        toast({ title: "Invalid or expired access code", variant: "destructive" });
        return;
      }

      // Mark code as used
      await supabase
        .from("salary_analysis_access_codes")
        .update({ is_used: true })
        .eq("id", data.id);

      setCanProceed(true);
      setShowAccessCodeInput(false);
      toast({ title: "Access code validated!" });
    } catch (error) {
      console.error("Error validating code:", error);
      toast({ title: "Error validating code", variant: "destructive" });
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes("pdf") && !file.type.includes("document")) {
      toast({ title: "Please upload a PDF or document file", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large. Max 10MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setCvFile(file);

    try {
      const fileName = `salary-cv/${Date.now()}-${file.name}`;
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.FILE_UPLOAD);
      
      const { data, error } = await supabase.storage
        .from("portfolio-uploads")
        .upload(fileName, file);

      clearTimeout(timeoutId);

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("portfolio-uploads")
        .getPublicUrl(fileName);

      setCvUrl(publicUrl.publicUrl);
      
      // Sync CV to talents table
      if (talent?.id) {
        await updateTalent({ cvUrl: publicUrl.publicUrl });
        await refreshTalent();
        console.log('[SalaryAnalysisSetup] CV synced to talents table');
      }
      
      toast({ title: "CV uploaded successfully!" });
    } catch (error: any) {
      console.error("Upload error:", error);
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        toast({ 
          title: "Upload timed out", 
          description: "Try pasting your CV text instead",
          variant: "destructive" 
        });
      } else {
        toast({ title: "Upload failed. Try pasting text instead.", variant: "destructive" });
      }
      setCvInputMode("text");
      setCvFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !jobDescription.trim()) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }

    if (!cvText.trim() && !cvUrl) {
      toast({ title: "Please provide your CV (text or file)", variant: "destructive" });
      return;
    }

    // Check credits for logged-in users
    if (talent && !canAfford('SALARY_ANALYSIS')) {
      setShowCreditGate(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate UUID before submission
      const isValidUUID = (str: string | null | undefined): boolean => {
        if (!str) return false;
        const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidV4Regex.test(str);
      };

      // Generate a temporary ID for the analysis
      const tempAnalysisId = crypto.randomUUID();

      // Insert WITH talent_id if available
      const { error } = await supabase
        .from("salary_analyses")
        .insert({
          id: tempAnalysisId,
          user_id: user?.id || null,
          talent_id: talent?.id || null,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() ? `+880${phone.trim()}` : null,
          job_title: jobTitle.trim() || null,
          company_name: companyName.trim() || null,
          job_description: jobDescription.trim(),
          cv_text: cvText.trim() || null,
          cv_url: cvUrl || null,
          profession_category_id: isValidUUID(selectedProfession) ? selectedProfession : null,
          status: "pending"
        });

      if (error) throw error;

      // Note: Credit deduction happens in SalaryAnalysisProcessing after successful analysis
      // Service usage tracking also moves there

      navigate(`/salary-analysis/processing/${tempAnalysisId}`);
    } catch (error) {
      console.error("Submit error:", error);
      toast({ title: "Failed to start analysis", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto max-w-2xl py-12 px-4">
        <ProfileCompletionPrompt variant="banner" className="mb-6" />
        
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">Step 1 of 2</Badge>
          <h1 className="text-3xl font-bold">AI Salary Analysis Setup</h1>
          <p className="text-muted-foreground mt-2">
            Provide your CV and target job details for personalized insights
          </p>
        </div>

        {/* Email Check Section */}
        {canProceed === null && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Check Eligibility</CardTitle>
              <CardDescription>
                First analysis is free! Enter your email to check if you're eligible.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button onClick={checkEmailCooldown} disabled={isCheckingEmail} className="w-full">
                {isCheckingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingMessage}
                  </>
                ) : (
                  "Check Eligibility"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Cooldown Message */}
        {canProceed === false && showAccessCodeInput && (
          <Card className="mb-6 border-amber-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                Cooldown Period Active
              </CardTitle>
              <CardDescription>
                You have {daysRemaining} day(s) remaining before your next free analysis. 
                Use an access code (BDT 100) to analyze now.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="accessCode">Access Code</Label>
                <Input
                  id="accessCode"
                  placeholder="Enter your access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                />
              </div>
              <Button onClick={validateAccessCode} className="w-full">
                Validate Code
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Form */}
        {canProceed && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                You're Eligible!
              </CardTitle>
              <CardDescription>Complete the form below to get your analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Info */}
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChange={(e) => {
                      // Auto-format Bangladesh phone number
                      let value = e.target.value.replace(/\D/g, '');
                      // Remove leading 880 if present
                      if (value.startsWith('880')) {
                        value = value.slice(3);
                      }
                      // Limit to 10 digits (Bangladesh mobile format)
                      value = value.slice(0, 10);
                      setPhone(value);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Bangladesh number without +880</p>
                </div>
              </div>

              {/* Job Details */}
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jobTitle">Target Job Title</Label>
                    <Input
                      id="jobTitle"
                      placeholder="e.g., Senior Developer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      placeholder="e.g., Tech Company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="profession">Profession Category</Label>
                  <Select value={selectedProfession} onValueChange={setSelectedProfession}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <Label htmlFor="jobDescription">Job Description *</Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste the full job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>

              {/* CV Input */}
              <div>
                <Label>Your CV *</Label>
                
                {/* Show ExistingCVCard when talent has CV */}
                {hasExistingCv && cvInputMode === "existing" && (
                  <div className="mt-2">
                    <ExistingCVCard
                      talent={talent}
                      onUseExisting={() => {
                        setCvInputMode("existing");
                        if (talent?.cvUrl) setCvUrl(talent.cvUrl);
                        if (talent?.cvText) setCvText(talent.cvText);
                      }}
                      onUploadNew={() => setCvInputMode("file")}
                    />
                  </div>
                )}
                
                <Tabs value={cvInputMode} onValueChange={(v) => setCvInputMode(v as "text" | "file" | "existing")} className="mt-2">
                  <TabsList className={`grid w-full ${hasExistingCv ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {hasExistingCv && (
                      <TabsTrigger value="existing">
                        <FileCheck className="mr-2 h-4 w-4" />
                        Use Existing
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="text">
                      <FileText className="mr-2 h-4 w-4" />
                      Paste Text
                    </TabsTrigger>
                    <TabsTrigger value="file">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload File
                    </TabsTrigger>
                  </TabsList>
                  {hasExistingCv && cvInputMode !== "existing" && (
                    <TabsContent value="existing" className="mt-4">
                      <ExistingCVCard
                        talent={talent}
                        onUseExisting={() => {
                          if (talent?.cvUrl) setCvUrl(talent.cvUrl);
                          if (talent?.cvText) setCvText(talent.cvText);
                        }}
                        onUploadNew={() => setCvInputMode("file")}
                      />
                    </TabsContent>
                  )}
                  <TabsContent value="text" className="mt-4">
                    <Textarea
                      placeholder="Paste your CV content here..."
                      value={cvText}
                      onChange={(e) => setCvText(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </TabsContent>
                  <TabsContent value="file" className="mt-4">
                    <div className="relative border-2 border-dashed rounded-lg p-8 text-center">
                      {cvUrl ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span>CV uploaded: {cvFile?.name}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setCvUrl("");
                              setCvFile(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <span>Uploading... (max 60s)</span>
                          <p className="text-xs text-muted-foreground">If this takes too long, try pasting text instead</p>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-2">Drop your CV here or click to browse</p>
                          <p className="text-sm text-muted-foreground">PDF or DOC, max 10MB</p>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="sr-only"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Analysis...
                  </>
                ) : (
                  "Start AI Analysis"
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />

      {/* Credit Gate Modal */}
      <CreditGateModal
        isOpen={showCreditGate}
        onClose={() => setShowCreditGate(false)}
        serviceName="Salary Analysis"
        cost={getServiceCost('SALARY_ANALYSIS')}
        currentBalance={balance}
        onConfirm={() => {
          setShowCreditGate(false);
          handleSubmit();
        }}
        onBuyCredits={() => {
          setShowCreditGate(false);
          setShowCreditSheet(true);
        }}
      />

      {/* Credit Purchase Sheet */}
      <CreditPurchaseSheet
        isOpen={showCreditSheet}
        onClose={() => setShowCreditSheet(false)}
        currentBalance={balance}
      />
    </div>
  );
};

// Wrap with AuthGate
const SalaryAnalysisSetup = () => {
  return (
    <AuthGate message="Sign in to access AI Salary Analysis. Your results will be saved to your account.">
      <SalaryAnalysisSetupContent />
    </AuthGate>
  );
};

export default SalaryAnalysisSetup;
