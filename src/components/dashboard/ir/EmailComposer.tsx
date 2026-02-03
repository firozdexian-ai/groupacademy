import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Send, 
  Sparkles, 
  Loader2, 
  Mail, 
  Copy, 
  ExternalLink,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { IR_CONFIG, formatUSD, creditsToUsd } from "@/lib/irConfig";
import { format } from "date-fns";

export function EmailComposer() {
  const queryClient = useQueryClient();
  
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>("");
  const [emailType, setEmailType] = useState<string>("weekly_update");
  const [newFeedback, setNewFeedback] = useState<string>("");
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Fetch investors
  const { data: investors } = useQuery({
    queryKey: ["ir-investors-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ir_investors")
        .select("id, full_name, email, vc_firm:ir_vc_firms(name)")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });
  
  // Fetch selected investor details
  const { data: investor } = useQuery({
    queryKey: ["ir-investor-context", selectedInvestorId],
    queryFn: async () => {
      if (!selectedInvestorId) return null;
      
      const { data, error } = await supabase
        .from("ir_investors")
        .select("*, vc_firm:ir_vc_firms(name)")
        .eq("id", selectedInvestorId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedInvestorId,
  });
  
  // Fetch investor interactions
  const { data: interactions } = useQuery({
    queryKey: ["ir-investor-interactions-context", selectedInvestorId],
    queryFn: async () => {
      if (!selectedInvestorId) return [];
      
      const { data, error } = await supabase
        .from("ir_investor_interactions")
        .select("*")
        .eq("investor_id", selectedInvestorId)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedInvestorId,
  });
  
  // Fetch current metrics for AI context
  const { data: metrics } = useQuery({
    queryKey: ["ir-metrics-for-email"],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      // Get credit usage this month
      const { data: credits } = await supabase
        .from("credit_transactions")
        .select("amount")
        .eq("transaction_type", "service_usage")
        .gte("created_at", startOfMonth.toISOString());
      
      const totalCredits = credits?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
      
      // Get user count
      const { count: userCount } = await supabase
        .from("talents")
        .select("*", { count: "exact", head: true });
      
      return {
        mrr: creditsToUsd(totalCredits),
        users: userCount || 0,
      };
    },
  });
  
  // Generate email with AI
  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      
      const { data, error } = await supabase.functions.invoke("generate-investor-email", {
        body: {
          investorId: selectedInvestorId,
          emailType,
          newFeedback: newFeedback || undefined,
          customInstructions: customInstructions || undefined,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSubject(data.subject || "");
      setContent(data.content || "");
      toast.success("Email generated!");
    },
    onError: (error) => {
      toast.error("Failed to generate: " + error.message);
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });
  
  // Save email as draft or sent
  const saveMutation = useMutation({
    mutationFn: async (status: "draft" | "sent") => {
      const { error } = await supabase
        .from("ir_email_communications")
        .insert({
          investor_id: selectedInvestorId,
          email_type: emailType,
          subject,
          content,
          ai_generated: true,
          status,
          sent_at: status === "sent" ? new Date().toISOString() : null,
        });
      
      if (error) throw error;
      
      // If sent, also log as interaction
      if (status === "sent") {
        await supabase
          .from("ir_investor_interactions")
          .insert({
            investor_id: selectedInvestorId,
            interaction_type: "email_sent",
            subject,
            content,
          });
        
        // Update last_contacted_at
        await supabase
          .from("ir_investors")
          .update({ last_contacted_at: new Date().toISOString() })
          .eq("id", selectedInvestorId);
      }
    },
    onSuccess: (_, status) => {
      toast.success(status === "sent" ? "Email logged as sent" : "Draft saved");
      queryClient.invalidateQueries({ queryKey: ["ir-email-communications"] });
      queryClient.invalidateQueries({ queryKey: ["ir-investor-interactions"] });
    },
    onError: (error) => {
      toast.error("Failed to save: " + error.message);
    },
  });
  
  const openInMailClient = () => {
    if (!investor?.email) {
      toast.error("No email address for this investor");
      return;
    }
    
    const mailtoUrl = `mailto:${investor.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`;
    window.open(mailtoUrl, "_blank");
    
    // Mark as sent after opening mail client
    saveMutation.mutate("sent");
  };
  
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Email Updates</h2>
        <p className="text-muted-foreground">
          Generate and send AI-personalized emails to investors
        </p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Investor Selection & Context */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Investor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedInvestorId} onValueChange={setSelectedInvestorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose investor" />
                </SelectTrigger>
                <SelectContent>
                  {investors?.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.full_name} {inv.vc_firm?.name && `(${inv.vc_firm.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IR_CONFIG.EMAIL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          
          {/* Context Panel */}
          {investor && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Context (Auto-loaded)</CardTitle>
                <CardDescription>
                  AI will use this to personalize the email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {investor.vc_firm && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{investor.vc_firm.name}</Badge>
                  </div>
                )}
                
                {investor.investor_interests && investor.investor_interests.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Interests</p>
                    <div className="flex flex-wrap gap-1">
                      {investor.investor_interests.map((i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {i}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {investor.investment_stage_pref && (
                  <div>
                    <p className="text-xs text-muted-foreground">Stage Preference</p>
                    <p className="text-sm">{investor.investment_stage_pref}</p>
                  </div>
                )}
                
                {investor.last_feedback_summary && (
                  <div>
                    <p className="text-xs text-muted-foreground">Last Feedback</p>
                    <p className="text-sm italic">"{investor.last_feedback_summary}"</p>
                  </div>
                )}
                
                {interactions && interactions.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Recent Interactions</p>
                    {interactions.slice(0, 3).map((int) => (
                      <div key={int.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        <span>
                          {IR_CONFIG.INTERACTION_TYPES.find((t) => t.value === int.interaction_type)?.label}
                        </span>
                        <span>•</span>
                        <span>{format(new Date(int.created_at), "MMM d")}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {metrics && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Current Metrics</p>
                    <p className="text-sm">
                      MRR: {formatUSD(metrics.mrr)} • Users: {metrics.users}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* New Feedback Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paste Reply/Feedback</CardTitle>
              <CardDescription>
                Add any recent reply to inform the AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
                placeholder="Paste investor's reply or meeting notes here..."
                rows={3}
              />
            </CardContent>
          </Card>
          
          {/* Custom Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Any specific points to include..."
                rows={2}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Right: Email Composer */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Compose Email</CardTitle>
                <CardDescription>
                  {investor?.full_name 
                    ? `To: ${investor.full_name} <${investor.email || "no email"}>` 
                    : "Select an investor to compose email"}
                </CardDescription>
              </div>
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={!selectedInvestorId || isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate with AI
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Email content will appear here after AI generation..."
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  disabled={!content}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  onClick={() => saveMutation.mutate("draft")}
                  disabled={!selectedInvestorId || !subject || saveMutation.isPending}
                >
                  Save Draft
                </Button>
                <Button
                  onClick={openInMailClient}
                  disabled={!investor?.email || !subject || !content}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Open in Email Client
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
