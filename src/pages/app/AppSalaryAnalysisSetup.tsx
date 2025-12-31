import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, CheckCircle, FileCheck, ArrowLeft } from "lucide-react";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { ExistingCVCard } from "@/components/cv/ExistingCVCard";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";

export default function AppSalaryAnalysisSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { talent, user, addServiceUsed, updateTalent, refreshTalent } = useTalent();
  const { canAfford, getServiceCost, balance } = useCredits();
  
  const [email, setEmail] = useState("");
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

  const hasExistingCv = !!(talent?.cvUrl || talent?.cvText);

  useEffect(() => {
    if (talent) {
      setEmail(prev => prev || talent.email || "");
      setFullName(prev => prev || talent.fullName || "");
      setPhone(prev => prev || talent.phone?.replace(/^\+880/, "") || "");
      if (talent.professionCategoryId) {
        setSelectedProfession(prev => prev || talent.professionCategoryId || "");
      }
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
      
      const { data, error } = await supabase.storage
        .from("portfolio-uploads")
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("portfolio-uploads")
        .getPublicUrl(fileName);

      setCvUrl(publicUrl.publicUrl);
      
      if (talent?.id) {
        await updateTalent({ cvUrl: publicUrl.publicUrl });
        await refreshTalent();
      }
      
      toast({ title: "CV uploaded successfully!" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed. Try pasting text instead.", variant: "destructive" });
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

    if (talent && !canAfford('SALARY_ANALYSIS')) {
      setShowCreditGate(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const isValidUUID = (str: string | null | undefined): boolean => {
        if (!str) return false;
        const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidV4Regex.test(str);
      };

      const tempAnalysisId = crypto.randomUUID();

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

      navigate(`/salary-analysis/processing/${tempAnalysisId}`);
    } catch (error) {
      console.error("Submit error:", error);
      toast({ title: "Failed to start analysis", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

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
      
      <div className="text-center mb-6">
        <Badge variant="secondary" className="mb-4">AI Salary Analysis</Badge>
        <h1 className="text-2xl font-bold">Get Your Salary Insights</h1>
        <p className="text-muted-foreground mt-2">
          Provide your CV and target job details for personalized insights
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Complete the Form
          </CardTitle>
          <CardDescription>Fill in the details below to get your analysis</CardDescription>
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
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.startsWith('880')) {
                    value = value.slice(3);
                  }
                  value = value.slice(0, 10);
                  setPhone(value);
                }}
              />
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
                  {professionCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="jobDescription">Job Description *</Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>

          {/* CV Input */}
          <div className="space-y-3">
            <Label>Your CV/Resume *</Label>
            <Tabs value={cvInputMode} onValueChange={(v) => setCvInputMode(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                {hasExistingCv && (
                  <TabsTrigger value="existing" className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    Use Existing
                  </TabsTrigger>
                )}
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Paste Text
                </TabsTrigger>
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </TabsTrigger>
              </TabsList>
              
              {hasExistingCv && (
                <TabsContent value="existing" className="mt-4">
                  <ExistingCVCard 
                    talent={talent}
                    onUseExisting={() => {
                      if (talent?.cvUrl) setCvUrl(talent.cvUrl);
                      if (talent?.cvText) setCvText(talent.cvText);
                    }}
                    onUploadNew={() => {}}
                  />
                </TabsContent>
              )}
              
              <TabsContent value="text" className="mt-4">
                <Textarea
                  placeholder="Paste your CV/resume content here..."
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  className="min-h-[200px]"
                />
              </TabsContent>
              
              <TabsContent value="file" className="mt-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {cvFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span>{cvFile.name}</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        className="hidden"
                      />
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload PDF or DOC</p>
                    </label>
                  )}
                  {isUploading && <Loader2 className="h-5 w-5 animate-spin mx-auto mt-2" />}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Analysis...
              </>
            ) : (
              "Start Salary Analysis"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Credit Gate Modal */}
      <CreditGateModal
        isOpen={showCreditGate}
        onClose={() => setShowCreditGate(false)}
        onConfirm={() => {
          setShowCreditGate(false);
          handleSubmit();
        }}
        onBuyCredits={() => {
          setShowCreditGate(false);
          setShowCreditSheet(true);
        }}
        serviceName="AI Salary Analysis"
        cost={getServiceCost('SALARY_ANALYSIS')}
        currentBalance={balance}
      />

      <CreditPurchaseSheet
        isOpen={showCreditSheet}
        onClose={() => setShowCreditSheet(false)}
        currentBalance={balance}
      />
    </div>
  );
}
