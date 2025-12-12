import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Link, Loader2, MessageSquare, Copy, ExternalLink, User, Briefcase, CheckCircle, Phone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PRODUCTS = [
  { id: 'digital-portfolio', name: 'Digital Portfolio Creation', badge: 'First 1000 FREE' },
  { id: 'ai-efficiency', name: 'AI Efficiency Accelerator', badge: null },
  { id: 'career-scorecard', name: 'Career Readiness Scorecard', badge: 'FREE' },
  { id: 'mock-interview', name: 'AI Mock Interview', badge: 'First FREE' },
  { id: 'salary-analysis', name: 'AI Salary Analysis', badge: null },
];

const PROFESSION_CATEGORIES = [
  { id: 'a1c5d82c-1a1a-4b0e-89e8-19c264a3a915', name: 'Banking & Finance' },
  { id: 'cd947727-350e-4fd3-813b-0034d4cf208e', name: 'Sales & Distribution' },
  { id: '5ee052f8-2aaf-45b5-8f90-731c23097fef', name: 'Sales & Marketing' },
  { id: '1e71843c-d202-4d96-834e-04fa6c784f16', name: 'Technology & IT' },
  { id: 'e5489921-ce14-448b-a017-b762a3b72a8d', name: 'Human Resources' },
  { id: 'a8c5f269-03bd-4589-954e-51eb1e1fbf32', name: 'Operations & Supply Chain' },
  { id: '2c541af4-1cc0-4704-81aa-78df992aad6b', name: 'Healthcare & Pharma' },
  { id: '30dbc71e-26de-4131-bd97-073e593f9d93', name: 'Student (Undergraduate)' },
  { id: '30e1aff7-a7fa-4bb1-ac5e-d226e4754930', name: 'Student (Graduate/Masters)' },
  { id: '1d65c422-6eef-412c-b843-8ae3d9ac37d5', name: 'Fresh Graduate' },
  { id: 'ba50f709-610e-4770-9d2c-918a39073175', name: 'Career Changer' },
  { id: 'b4038064-ec0f-4814-a966-ca4c9984bca2', name: 'Other' },
];

const LANGUAGE_OPTIONS = [
  { id: 'auto', name: 'Auto-Detect', description: 'AI selects based on CV' },
  { id: 'english', name: 'English', description: 'Professional English only' },
  { id: 'bangla', name: 'Bangla (বাংলা)', description: 'Full Bangla message' },
];

const SENDER_OPTIONS = [
  { id: 'firoz', name: 'Firoz' },
  { id: 'anika', name: 'Anika' },
  { id: 'rodoshi', name: 'Rodoshi' },
  { id: 'custom', name: 'Custom...' },
];

interface OutreachResult {
  name: string;
  phone: string;
  phoneNumbers: string[];
  gender: string;
  whatsappLink: string | null;
  message: string;
  professionCategory: string;
  productLink: string;
}

const GENDER_OPTIONS = [
  { id: 'male', name: '♂ Male (ভাই)', description: 'Uses ভাই (Bhai) greeting' },
  { id: 'female', name: '♀ Female (আপু)', description: 'Uses আপু (Apu) greeting' },
  { id: 'unknown', name: '? Neutral', description: 'No gender-specific greeting' },
];

export function CVOutreachGenerator() {
  const [inputMode, setInputMode] = useState<'upload' | 'url' | 'text'>('url');
  const [cvUrl, setCvUrl] = useState('');
  const [cvText, setCvText] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [selectedProduct, setSelectedProduct] = useState('digital-portfolio');
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [selectedSender, setSelectedSender] = useState('firoz');
  const [customSenderName, setCustomSenderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OutreachResult | null>(null);
  const [parsedCV, setParsedCV] = useState<any>(null);
  const [selectedPhone, setSelectedPhone] = useState<string>('');
  const [overrideGender, setOverrideGender] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFile(file);
    }
  };

  const getSenderName = () => {
    if (selectedSender === 'custom') {
      return customSenderName || 'GroUp Academy Team';
    }
    return SENDER_OPTIONS.find(s => s.id === selectedSender)?.name || 'Firoz';
  };

  const processCV = async () => {
    if (inputMode === 'url' && !cvUrl) {
      toast.error('Please enter a CV URL');
      return;
    }
    if (inputMode === 'upload' && !cvFile) {
      toast.error('Please upload a CV file');
      return;
    }
    if (inputMode === 'text' && !cvText.trim()) {
      toast.error('Please paste profile text');
      return;
    }

    setIsProcessing(true);
    setResult(null);
    setParsedCV(null);
    setSelectedPhone('');
    setOverrideGender(null);

    try {
      let cvTextOrUrl = cvUrl;
      let useTextMode = false;

      // If file upload, first upload to storage then get URL
      if (inputMode === 'upload' && cvFile) {
        const fileName = `outreach-cvs/${Date.now()}-${cvFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('portfolio-uploads')
          .upload(fileName, cvFile);

        if (uploadError) {
          throw new Error('Failed to upload CV: ' + uploadError.message);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('portfolio-uploads')
          .getPublicUrl(fileName);

        cvTextOrUrl = publicUrl;
      } else if (inputMode === 'text') {
        cvTextOrUrl = cvText;
        useTextMode = true;
      }

      // Step 1: Parse the CV
      toast.info('Parsing CV...');
      const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-cv', {
        body: useTextMode 
          ? { cvText: cvTextOrUrl, serviceType: 'cv_outreach' }
          : { cvUrl: cvTextOrUrl, serviceType: 'cv_outreach' }
      });

      if (parseError) {
        throw new Error(parseError.message || 'Failed to parse CV');
      }

      if (!parseData?.success) {
        throw new Error(parseData?.error || 'Failed to parse CV');
      }

      setParsedCV(parseData.parsed);
      
      // Get profession category name
      const professionCategoryId = parseData.professional?.profession_category_id || parseData.professionCategoryId;
      const professionCategory = PROFESSION_CATEGORIES.find(c => c.id === professionCategoryId)?.name || 
                                  determineProfessionFromCV(parseData.parsed);

      // Step 2: Generate outreach message
      toast.info('Generating personalized message...');
      const { data: messageData, error: messageError } = await supabase.functions.invoke('generate-outreach-message', {
        body: {
          parsedCV: parseData.parsed,
          product: selectedProduct,
          professionCategory,
          senderName: getSenderName(),
          language: selectedLanguage
        }
      });

      if (messageError) {
        throw new Error(messageError.message || 'Failed to generate message');
      }

      if (!messageData?.success) {
        throw new Error(messageData?.error || 'Failed to generate message');
      }

      const phoneNumbers = messageData.phoneNumbers || (messageData.phone ? [messageData.phone] : []);
      
      setResult({
        name: messageData.name,
        phone: messageData.phone,
        phoneNumbers,
        gender: messageData.gender || 'unknown',
        whatsappLink: messageData.whatsappLink,
        message: messageData.message,
        professionCategory: messageData.professionCategory,
        productLink: messageData.productLink,
      });
      
      // Set default selected phone
      if (phoneNumbers.length > 0) {
        setSelectedPhone(phoneNumbers[0]);
      }

      toast.success('Outreach message generated!');

    } catch (error: any) {
      console.error('Error processing CV:', error);
      toast.error(error.message || 'Failed to process CV');
    } finally {
      setIsProcessing(false);
    }
  };

  const determineProfessionFromCV = (parsed: any): string => {
    const text = JSON.stringify(parsed).toLowerCase();
    if (text.includes('bank') || text.includes('finance') || text.includes('accounting')) return 'Banking & Finance';
    if (text.includes('sales') || text.includes('marketing') || text.includes('distribution')) return 'Sales & Marketing';
    if (text.includes('software') || text.includes('developer') || text.includes('engineer') || text.includes('it')) return 'Technology & IT';
    if (text.includes('hr') || text.includes('human resource')) return 'Human Resources';
    if (text.includes('operations') || text.includes('supply chain') || text.includes('logistics')) return 'Operations & Supply Chain';
    if (text.includes('health') || text.includes('pharma') || text.includes('medical')) return 'Healthcare & Pharma';
    if (text.includes('student') || text.includes('university') || text.includes('college')) return 'Student';
    return 'Professional';
  };

  const copyMessage = () => {
    if (result?.message) {
      navigator.clipboard.writeText(result.message);
      toast.success('Message copied to clipboard');
    }
  };

  const getWhatsAppLink = (phone: string, message: string) => {
    let formattedPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    if (formattedPhone.startsWith('880')) {
      // Already has country code
    } else if (formattedPhone.startsWith('0')) {
      formattedPhone = '880' + formattedPhone.slice(1);
    } else if (formattedPhone.length === 10 || formattedPhone.length === 11) {
      formattedPhone = '880' + formattedPhone;
    }
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  const openWhatsApp = () => {
    if (result?.message && (selectedPhone || result.phone)) {
      const link = getWhatsAppLink(selectedPhone || result.phone, result.message);
      window.open(link, '_blank');
    }
  };

  // Regenerate message with overridden gender
  const regenerateWithGender = async (newGender: string) => {
    if (!parsedCV || !result) return;
    
    setIsRegenerating(true);
    setOverrideGender(newGender);
    
    try {
      // Create a copy of parsedCV with the new gender
      const updatedCV = { ...parsedCV, gender: newGender };
      
      const { data: messageData, error: messageError } = await supabase.functions.invoke('generate-outreach-message', {
        body: {
          parsedCV: updatedCV,
          product: selectedProduct,
          professionCategory: result.professionCategory,
          senderName: getSenderName(),
          language: selectedLanguage
        }
      });

      if (messageError) throw new Error(messageError.message);
      if (!messageData?.success) throw new Error(messageData?.error || 'Failed to regenerate');

      setResult(prev => prev ? {
        ...prev,
        gender: newGender,
        message: messageData.message,
        whatsappLink: messageData.whatsappLink
      } : null);
      
      toast.success(`Message regenerated with ${newGender} greeting`);
    } catch (error: any) {
      console.error('Error regenerating message:', error);
      toast.error('Failed to regenerate message');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            CV Outreach Generator
          </CardTitle>
          <CardDescription>
            Upload or paste a CV URL, select a product, and generate personalized WhatsApp outreach messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'upload' | 'url' | 'text')}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <Link className="w-4 h-4" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Text
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="cvUrl">CV URL (Supabase Storage or any public link)</Label>
                    <Input
                      id="cvUrl"
                      placeholder="https://...supabase.co/storage/.../cv.pdf"
                      value={cvUrl}
                      onChange={(e) => setCvUrl(e.target.value)}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="upload" className="mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="cvFile">Upload CV File</Label>
                    <Input
                      id="cvFile"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                    />
                    {cvFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {cvFile.name}
                      </p>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="text" className="mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="cvText">Paste Profile Text</Label>
                    <Textarea
                      id="cvText"
                      placeholder="Paste email content, LinkedIn profile, social media post, or any text describing the professional..."
                      value={cvText}
                      onChange={(e) => setCvText(e.target.value)}
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Great for capturing talent from emails, social media posts, or LinkedIn profiles
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product to Promote</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCTS.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center gap-2">
                          {product.name}
                          {product.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {product.badge}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Message Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        <div className="flex flex-col">
                          <span>{lang.name}</span>
                          <span className="text-xs text-muted-foreground">{lang.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senderName">Sender Name</Label>
                <Select value={selectedSender} onValueChange={setSelectedSender}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SENDER_OPTIONS.map((sender) => (
                      <SelectItem key={sender.id} value={sender.id}>
                        {sender.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSender === 'custom' && (
                  <Input
                    placeholder="Enter custom sender name"
                    value={customSenderName}
                    onChange={(e) => setCustomSenderName(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          </div>

          <Button 
            onClick={processCV} 
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 mr-2" />
                Generate Outreach Message
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <CheckCircle className="w-5 h-5" />
              Outreach Ready
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{result.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Briefcase className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <Badge variant="outline">{result.professionCategory}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone(s)</p>
                  <p className="font-semibold">{result.phoneNumbers?.length || 0} found</p>
                </div>
              </div>
            </div>

            {/* Gender Override Section */}
            <div className="space-y-2 p-4 rounded-lg border bg-muted/20">
              <Label className="flex items-center gap-2">
                Gender Detection
                <Badge variant={result.gender === 'male' ? 'default' : result.gender === 'female' ? 'secondary' : 'outline'}>
                  {result.gender === 'male' ? '♂ Male (ভাই)' : result.gender === 'female' ? '♀ Female (আপু)' : '? Unknown'}
                </Badge>
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Wrong gender detected? Click to regenerate the message with correct greeting:
              </p>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((gender) => (
                  <Button
                    key={gender.id}
                    variant={result.gender === gender.id ? "default" : "outline"}
                    size="sm"
                    disabled={isRegenerating || result.gender === gender.id}
                    onClick={() => regenerateWithGender(gender.id)}
                  >
                    {isRegenerating && overrideGender === gender.id ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : null}
                    {gender.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Phone Selection */}
            {result.phoneNumbers && result.phoneNumbers.length > 1 && (
              <div className="space-y-2">
                <Label>Select Phone Number for WhatsApp</Label>
                <div className="flex flex-wrap gap-2">
                  {result.phoneNumbers.map((phone, idx) => (
                    <Button
                      key={idx}
                      variant={selectedPhone === phone ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPhone(phone)}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      {phone}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Preview */}
            <div className="space-y-3">
              <Label>Generated Message</Label>
              <Textarea
                value={result.message}
                readOnly
                className="min-h-[150px] bg-muted/30"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {selectedPhone || result.phone ? (
                <Button onClick={openWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open WhatsApp ({selectedPhone || result.phone})
                </Button>
              ) : (
                <Button disabled className="flex-1">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  No phone number found
                </Button>
              )}
              <Button variant="outline" onClick={copyMessage} className="flex-1">
                <Copy className="w-4 h-4 mr-2" />
                Copy Message
              </Button>
            </div>

            {/* Parsed CV Summary */}
            {parsedCV && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Parsed Profile Data</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Education:</strong> {parsedCV.education?.map((e: any) => `${e.degree} from ${e.institution}`).join(', ') || 'N/A'}</p>
                  <p><strong>Experience:</strong> {parsedCV.experience?.map((e: any) => `${e.title} at ${e.company}`).join(', ') || 'N/A'}</p>
                  <p><strong>Skills:</strong> {parsedCV.skills?.slice(0, 10).join(', ') || 'N/A'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
