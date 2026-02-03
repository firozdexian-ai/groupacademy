import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Phone, 
  Linkedin, 
  Twitter, 
  Building2, 
  Calendar,
  MessageSquare,
  FileText,
  PhoneCall,
  MailOpen,
} from "lucide-react";
import { format } from "date-fns";
import { IR_CONFIG } from "@/lib/irConfig";
import { InteractionLogger } from "./InteractionLogger";
import { useState } from "react";

interface InvestorDetailSheetProps {
  investorId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvestorDetailSheet({ investorId, open, onOpenChange }: InvestorDetailSheetProps) {
  const [showLogger, setShowLogger] = useState(false);
  
  // Fetch investor details
  const { data: investor } = useQuery({
    queryKey: ["ir-investor-detail", investorId],
    queryFn: async () => {
      if (!investorId) return null;
      
      const { data, error } = await supabase
        .from("ir_investors")
        .select("*, vc_firm:ir_vc_firms(id, name, status)")
        .eq("id", investorId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!investorId,
  });
  
  // Fetch interactions
  const { data: interactions } = useQuery({
    queryKey: ["ir-investor-interactions", investorId],
    queryFn: async () => {
      if (!investorId) return [];
      
      const { data, error } = await supabase
        .from("ir_investor_interactions")
        .select("*")
        .eq("investor_id", investorId)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!investorId,
  });
  
  // Fetch emails sent
  const { data: emails } = useQuery({
    queryKey: ["ir-investor-emails", investorId],
    queryFn: async () => {
      if (!investorId) return [];
      
      const { data, error } = await supabase
        .from("ir_email_communications")
        .select("*")
        .eq("investor_id", investorId)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!investorId,
  });
  
  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "email_sent": return <Mail className="h-4 w-4" />;
      case "reply_received": return <MailOpen className="h-4 w-4" />;
      case "meeting": return <Calendar className="h-4 w-4" />;
      case "call": return <PhoneCall className="h-4 w-4" />;
      case "note": return <FileText className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };
  
  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive": return "text-green-500";
      case "negative": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };
  
  const getStatusBadge = (status: string) => {
    const option = IR_CONFIG.SUBSCRIPTION_STATUS_OPTIONS.find((o) => o.value === status);
    return (
      <Badge variant="secondary" className={option?.color}>
        {option?.label || status}
      </Badge>
    );
  };

  if (!investor) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {investor.full_name}
            {getStatusBadge(investor.subscription_status)}
          </SheetTitle>
          <SheetDescription>
            {investor.title && `${investor.title} • `}
            {investor.vc_firm?.name || "Independent"}
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] pr-4">
          <div className="space-y-6 py-4">
            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Contact</h4>
              <div className="space-y-2">
                {investor.email && (
                  <a 
                    href={`mailto:${investor.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="h-4 w-4" />
                    {investor.email}
                  </a>
                )}
                {investor.phone && (
                  <a 
                    href={`tel:${investor.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="h-4 w-4" />
                    {investor.phone}
                  </a>
                )}
                {investor.linkedin_url && (
                  <a 
                    href={investor.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn Profile
                  </a>
                )}
                {investor.twitter_handle && (
                  <a 
                    href={`https://twitter.com/${investor.twitter_handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Twitter className="h-4 w-4" />
                    {investor.twitter_handle}
                  </a>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Interests & Preferences */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Interests & Preferences</h4>
              <div className="flex flex-wrap gap-2">
                {investor.investor_interests?.map((interest) => (
                  <Badge key={interest} variant="outline">
                    {interest}
                  </Badge>
                ))}
                {investor.investment_stage_pref && (
                  <Badge variant="secondary">
                    {investor.investment_stage_pref}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Relationship Summary */}
            {investor.relationship_summary && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Relationship Summary</h4>
                  <p className="text-sm text-muted-foreground">
                    {investor.relationship_summary}
                  </p>
                </div>
              </>
            )}
            
            {/* Last Feedback */}
            {investor.last_feedback_summary && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Latest Feedback</h4>
                  <p className="text-sm text-muted-foreground italic">
                    "{investor.last_feedback_summary}"
                  </p>
                </div>
              </>
            )}
            
            <Separator />
            
            {/* Interaction History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Interaction History</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowLogger(true)}
                >
                  Log Interaction
                </Button>
              </div>
              
              {interactions && interactions.length > 0 ? (
                <div className="space-y-3">
                  {interactions.map((interaction) => (
                    <div 
                      key={interaction.id}
                      className="flex gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className={`mt-0.5 ${getSentimentColor(interaction.sentiment)}`}>
                        {getInteractionIcon(interaction.interaction_type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {IR_CONFIG.INTERACTION_TYPES.find(
                              (t) => t.value === interaction.interaction_type
                            )?.label || interaction.interaction_type}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(interaction.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        {interaction.subject && (
                          <p className="text-sm">{interaction.subject}</p>
                        )}
                        {interaction.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {interaction.content}
                          </p>
                        )}
                        {interaction.key_points && interaction.key_points.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {interaction.key_points.map((point, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {point}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No interactions logged yet
                </p>
              )}
            </div>
            
            {/* Email History */}
            {emails && emails.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Emails Sent</h4>
                  <div className="space-y-2">
                    {emails.map((email) => (
                      <div 
                        key={email.id}
                        className="flex items-center justify-between p-2 rounded border"
                      >
                        <div>
                          <p className="text-sm font-medium">{email.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {email.email_type} • {email.status}
                          </p>
                        </div>
                        {email.sent_at && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(email.sent_at), "MMM d")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* Notes */}
            {investor.notes && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Notes</h4>
                  <p className="text-sm text-muted-foreground">
                    {investor.notes}
                  </p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
        
        {/* Interaction Logger */}
        <InteractionLogger
          investorId={investorId}
          open={showLogger}
          onOpenChange={setShowLogger}
        />
      </SheetContent>
    </Sheet>
  );
}
