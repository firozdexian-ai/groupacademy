import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, Mail, Phone, Briefcase, FileText, ExternalLink, 
  Target, TrendingUp, MessageSquare, Calendar, Award,
  ClipboardList, Coins, Bot, Bell, Send, Check, Circle,
  GraduationCap, Building2, MapPin, Globe, Copy, Linkedin
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { OUTREACH_TEMPLATES, OutreachProduct, getOutreachEmailLink, getOutreachLinkedInMessage } from "@/lib/outreachTemplates";
import { formatWhatsAppLink, extractFirstName } from "@/lib/utils";
import { getCountryFlag } from "@/lib/constants/countries";
import { toast } from "sonner";

interface TalentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talentEmail: string;
  talentName?: string;
}

interface TalentActivity {
  type: 'assessment' | 'mock_interview' | 'salary_analysis' | 'portfolio_request';
  id: string;
  date: string;
  status?: string;
  score?: number;
  title?: string;
}

interface TalentProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profession_category_id: string | null;
  custom_profession: string | null;
  cv_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  profile_photo_url: string | null;
  services_used: string[];
  created_at: string;
  welcome_sent_at: string | null;
  profession_category?: { name: string } | null;
  // Rich fields
  country: string | null;
  current_status: string | null;
  institution: string | null;
  field_of_study: string | null;
  education: any[] | null;
  experience: any[] | null;
  skills: any[] | null;
}

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

interface AgentSession {
  id: string;
  agent_key: string;
  created_at: string;
  messages: unknown;
  credits_charged: number | null;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface OutreachRecord {
  id: string;
  product: string;
  sent_at: string;
  channel: string;
}

export function TalentDetailDialog({ 
  open, 
  onOpenChange, 
  talentEmail,
  talentName 
}: TalentDetailDialogProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [talent, setTalent] = useState<TalentProfile | null>(null);
  const [activities, setActivities] = useState<TalentActivity[]>([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [agentSessions, setAgentSessions] = useState<AgentSession[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [outreachRecords, setOutreachRecords] = useState<OutreachRecord[]>([]);

  useEffect(() => {
    if (open && talentEmail) {
      loadTalentData();
    }
  }, [open, talentEmail]);

  const loadTalentData = async () => {
    setLoading(true);
    try {
      const { data: talentData } = await supabase
        .from('talents')
        .select('*, profession_category:profession_categories(name)')
        .eq('email', talentEmail.toLowerCase())
        .single();

      if (talentData) {
        setTalent(talentData as unknown as TalentProfile);
        const talentId = talentData.id;
        
        const [creditRes, txRes, sessionsRes, notifsRes, outreachRes, assessments, interviews, salaryAnalyses, portfolios] = await Promise.all([
          supabase.from('talent_credits').select('balance').eq('talent_id', talentId).single(),
          supabase.from('credit_transactions').select('id, amount, transaction_type, description, created_at').eq('talent_id', talentId).order('created_at', { ascending: false }).limit(10),
          supabase.from('agent_chat_sessions').select('id, agent_key, created_at, messages, credits_charged').eq('talent_id', talentId).order('created_at', { ascending: false }).limit(5),
          supabase.from('notifications').select('id, title, message, type, is_read, created_at').eq('talent_id', talentId).order('created_at', { ascending: false }).limit(10),
          supabase.from('outreach_messages').select('id, product, sent_at, channel').eq('talent_id', talentId).order('sent_at', { ascending: false }),
          supabase.from('career_assessments').select('id, created_at, percentage, readiness_level').eq('email', talentEmail.toLowerCase()).order('created_at', { ascending: false }),
          supabase.from('mock_interviews').select('id, created_at, selection_percentage, status, job_title').eq('email', talentEmail.toLowerCase()).order('created_at', { ascending: false }),
          supabase.from('salary_analyses').select('id, created_at, status, job_title').eq('email', talentEmail.toLowerCase()).order('created_at', { ascending: false }),
          supabase.from('portfolio_requests').select('id, created_at, status').eq('email', talentEmail.toLowerCase()).order('created_at', { ascending: false })
        ]);

        setCreditBalance(creditRes.data?.balance || 0);
        setTransactions(txRes.data || []);
        setAgentSessions(sessionsRes.data || []);
        setNotifications(notifsRes.data || []);
        setOutreachRecords((outreachRes.data as unknown as OutreachRecord[]) || []);

        const allActivities: TalentActivity[] = [];
        assessments.data?.forEach(a => allActivities.push({ type: 'assessment', id: a.id, date: a.created_at, score: a.percentage, status: a.readiness_level }));
        interviews.data?.forEach(i => allActivities.push({ type: 'mock_interview', id: i.id, date: i.created_at, score: i.selection_percentage, status: i.status, title: i.job_title }));
        salaryAnalyses.data?.forEach(s => allActivities.push({ type: 'salary_analysis', id: s.id, date: s.created_at, status: s.status, title: s.job_title }));
        portfolios.data?.forEach(p => allActivities.push({ type: 'portfolio_request', id: p.id, date: p.created_at, status: p.status }));
        allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setActivities(allActivities);
      }
    } catch (error) {
      console.error('Error loading talent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOutreachSentAt = (product: OutreachProduct): string | null => {
    const record = outreachRecords.find(r => r.product === product);
    return record?.sent_at || null;
  };

  const TRACKED_PRODUCTS: OutreachProduct[] = ['welcome', 'portfolio', 'mock_interview', 'salary_analysis', 'career_scorecard'];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assessment': return <ClipboardList className="h-4 w-4" />;
      case 'mock_interview': return <Target className="h-4 w-4" />;
      case 'salary_analysis': return <TrendingUp className="h-4 w-4" />;
      case 'portfolio_request': return <Briefcase className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'assessment': return 'Career Assessment';
      case 'mock_interview': return 'Mock Interview';
      case 'salary_analysis': return 'Salary Analysis';
      case 'portfolio_request': return 'Portfolio Request';
      default: return type;
    }
  };

  const navigateToResult = (activity: TalentActivity) => {
    switch (activity.type) {
      case 'assessment':
        navigate(`/assessment-results/${activity.id}`);
        break;
      case 'mock_interview':
        if (activity.status === 'completed') navigate(`/mock-interview/results/${activity.id}`);
        break;
      case 'salary_analysis':
        if (activity.status === 'completed') navigate(`/salary-analysis/results/${activity.id}`);
        break;
    }
    onOpenChange(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const isPlaceholderEmail = (email: string) =>
    !email || email.includes("placeholder") || email.includes("noemail") || email.includes("no-email") || email.endsWith("@linkedin.com");

  const hasRealEmail = talent ? !isPlaceholderEmail(talent.email) : false;

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4 text-blue-600" />;
      case 'linkedin': return <Linkedin className="h-4 w-4 text-blue-700" />;
      default: return <MessageSquare className="h-4 w-4 text-green-600" />;
    }
  };

  const sendOutreachViaChannel = async (product: OutreachProduct, channel: 'email' | 'linkedin') => {
    if (!talent) return;
    const firstName = extractFirstName(talent.full_name);

    // Track outreach
    await supabase.from("outreach_messages").insert({
      talent_id: talent.id,
      product,
      message_content: channel === 'email'
        ? (OUTREACH_TEMPLATES[product].emailTemplate?.(firstName) || '')
        : (OUTREACH_TEMPLATES[product].linkedinTemplate?.(firstName) || ''),
      channel,
    } as any);

    if (channel === 'email' && talent.email) {
      const link = getOutreachEmailLink(talent.email, product, firstName);
      window.open(link, '_blank');
      toast.success(`Email composer opened for ${OUTREACH_TEMPLATES[product].name}`);
    } else if (channel === 'linkedin') {
      const message = getOutreachLinkedInMessage(product, firstName);
      copyToClipboard(message);
      if (talent.linkedin_url) window.open(talent.linkedin_url, '_blank');
      toast.success("LinkedIn message copied — paste it in the DM");
    }

    // Refresh outreach records
    const { data } = await supabase.from('outreach_messages').select('id, product, sent_at, channel').eq('talent_id', talent.id).order('sent_at', { ascending: false });
    setOutreachRecords((data as unknown as OutreachRecord[]) || []);
  };

  // Parse JSONB arrays safely
  const educationArr = Array.isArray(talent?.education) ? talent.education : [];
  const experienceArr = Array.isArray(talent?.experience) ? talent.experience : [];
  const skillsArr = Array.isArray(talent?.skills) ? talent.skills : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {loading ? 'Loading...' : (talent?.full_name || talentName || 'Talent Profile')}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : talent ? (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="w-full overflow-x-auto flex justify-start gap-0 md:grid md:grid-cols-6 text-xs">
              <TabsTrigger value="profile" className="shrink-0">Profile</TabsTrigger>
              <TabsTrigger value="outreach" className="shrink-0">Outreach</TabsTrigger>
              <TabsTrigger value="activities" className="shrink-0">Activities</TabsTrigger>
              <TabsTrigger value="credits" className="shrink-0">Credits</TabsTrigger>
              <TabsTrigger value="sessions" className="shrink-0">AI Chats</TabsTrigger>
              <TabsTrigger value="notifications" className="shrink-0">Notifs</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {talent.profile_photo_url && (
                    <div className="flex justify-center">
                      <img src={talent.profile_photo_url} alt={talent.full_name} className="w-20 h-20 rounded-full object-cover border-2 border-border" />
                    </div>
                  )}

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground shrink-0" /><span className="truncate">{talent.email}</span></div>
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground shrink-0" />{talent.phone || 'No phone'}</div>
                    <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />{talent.custom_profession || talent.profession_category?.name || 'Not set'}</div>
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground shrink-0" />Joined {format(new Date(talent.created_at), 'MMM d, yyyy')}</div>
                    {talent.country && (
                      <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground shrink-0" /><span>{getCountryFlag(talent.country)} {talent.country}</span></div>
                    )}
                    {talent.current_status && (
                      <div className="flex items-center gap-2"><Target className="h-4 w-4 text-muted-foreground shrink-0" /><Badge variant="outline" className="capitalize">{talent.current_status.replace('_', ' ')}</Badge></div>
                    )}
                  </div>

                  <Separator />

                  {/* Skills */}
                  {skillsArr.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5"><Award className="h-4 w-4" />Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {skillsArr.map((s: any, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{typeof s === 'string' ? s : s.name || s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {experienceArr.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5"><Building2 className="h-4 w-4" />Experience</h4>
                      <div className="space-y-2">
                        {experienceArr.slice(0, 5).map((exp: any, i: number) => (
                          <div key={i} className="p-2.5 rounded-lg border text-sm">
                            <p className="font-medium">{exp.title || 'Untitled'}</p>
                            <p className="text-muted-foreground text-xs">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                            {(exp.start_date || exp.end_date) && (
                              <p className="text-muted-foreground text-xs">{exp.start_date || '?'} → {exp.is_current ? 'Present' : (exp.end_date || '?')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {educationArr.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />Education</h4>
                      <div className="space-y-2">
                        {educationArr.map((edu: any, i: number) => (
                          <div key={i} className="p-2.5 rounded-lg border text-sm">
                            <p className="font-medium">{edu.institution || 'Unknown'}</p>
                            <p className="text-muted-foreground text-xs">
                              {[edu.degree, edu.field_of_study].filter(Boolean).join(' in ') || 'No details'}
                            </p>
                            {(edu.start_year || edu.end_year) && (
                              <p className="text-muted-foreground text-xs">{edu.start_year || '?'} – {edu.end_year || 'Present'}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Institution / Field fallback for non-array data */}
                  {educationArr.length === 0 && talent.institution && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />Education</h4>
                      <div className="p-2.5 rounded-lg border text-sm">
                        <p className="font-medium">{talent.institution}</p>
                        {talent.field_of_study && <p className="text-muted-foreground text-xs">{talent.field_of_study}</p>}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Services Used */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Services Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {talent.services_used?.length > 0 ? talent.services_used.map((s, i) => <Badge key={i} variant="secondary">{s.replace('_', ' ')}</Badge>) : <span className="text-sm text-muted-foreground">None</span>}
                    </div>
                  </div>

                  <Separator />

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    {talent.phone && <Button variant="outline" size="sm" onClick={() => window.open(formatWhatsAppLink(talent.phone), '_blank')}><MessageSquare className="h-4 w-4 mr-1 text-green-600" />WhatsApp</Button>}
                    {talent.email && <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${talent.email}`, '_blank')}><Mail className="h-4 w-4 mr-1 text-blue-600" />Email</Button>}
                    {talent.cv_url && <Button variant="outline" size="sm" onClick={() => window.open(talent.cv_url!, '_blank')}><FileText className="h-4 w-4 mr-1" />CV</Button>}
                    {talent.linkedin_url && <Button variant="outline" size="sm" onClick={() => window.open(talent.linkedin_url!, '_blank')}><Linkedin className="h-4 w-4 mr-1 text-blue-700" />LinkedIn</Button>}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="outreach" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2"><Send className="h-4 w-4" />Outreach History & Actions</h4>

                  {/* Multi-channel outreach actions */}
                  <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Outreach</p>
                    {isPlaceholderEmail(talent.email) && (
                      <Badge className="text-[10px] bg-blue-600/10 text-blue-700 border-blue-200 mb-1">LinkedIn Only — No real email</Badge>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {hasRealEmail && (
                        <Button variant="outline" size="sm" onClick={() => sendOutreachViaChannel('welcome', 'email')}>
                          <Mail className="h-3.5 w-3.5 mr-1 text-blue-600" />Email Invite
                        </Button>
                      )}
                      {talent.linkedin_url && (
                        <Button variant="outline" size="sm" onClick={() => sendOutreachViaChannel('welcome', 'linkedin')}>
                          <Linkedin className="h-3.5 w-3.5 mr-1 text-blue-700" />LinkedIn Invite
                        </Button>
                      )}
                      {talent.phone && (
                        <Button variant="outline" size="sm" onClick={() => window.open(formatWhatsAppLink(talent.phone), '_blank')}>
                          <MessageSquare className="h-3.5 w-3.5 mr-1 text-green-600" />WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* History */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {talent.welcome_sent_at ? <Check className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                        <div>
                          <p className="font-medium text-sm">Welcome Message</p>
                          <p className="text-xs text-muted-foreground">{talent.welcome_sent_at ? `Sent on ${format(new Date(talent.welcome_sent_at), 'MMM d, yyyy')}` : 'Not sent'}</p>
                        </div>
                      </div>
                      <Badge variant={talent.welcome_sent_at ? 'default' : 'secondary'} className="text-xs">{talent.welcome_sent_at ? 'Sent' : 'Pending'}</Badge>
                    </div>
                    {TRACKED_PRODUCTS.filter(p => p !== 'welcome').map((product) => {
                      const sentAt = getOutreachSentAt(product);
                      const template = OUTREACH_TEMPLATES[product];
                      const productRecords = outreachRecords.filter(r => r.product === product);
                      const channels = productRecords.map(r => r.channel);
                      return (
                        <div key={product} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            {sentAt ? <Check className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                            <div>
                              <p className="font-medium text-sm">{template.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {sentAt ? `Sent on ${format(new Date(sentAt), 'MMM d, yyyy')}` : 'Not pitched yet'}
                              </p>
                              {channels.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {[...new Set(channels)].map(ch => (
                                    <div key={ch} className="flex items-center gap-0.5">
                                      {getChannelIcon(ch)}
                                      <span className="text-[10px] text-muted-foreground capitalize">{ch}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!sentAt && (
                              <>
                                {hasRealEmail && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => sendOutreachViaChannel(product, 'email')} title="Send via Email">
                                    <Mail className="h-3.5 w-3.5 text-blue-600" />
                                  </Button>
                                )}
                                {talent.linkedin_url && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => sendOutreachViaChannel(product, 'linkedin')} title="Send via LinkedIn">
                                    <Linkedin className="h-3.5 w-3.5 text-blue-700" />
                                  </Button>
                                )}
                              </>
                            )}
                            <Badge variant={sentAt ? 'default' : 'secondary'} className="text-xs">{sentAt ? 'Sent' : 'Pending'}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Separator className="my-4" />
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      <strong>{outreachRecords.length + (talent.welcome_sent_at ? 1 : 0)}</strong> of <strong>{TRACKED_PRODUCTS.length}</strong> outreach messages sent
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="activities" className="mt-4">
              <ScrollArea className="h-[350px] pr-4">
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground"><Award className="h-10 w-10 mx-auto mb-2 opacity-20" /><p>No activities yet</p></div>
                ) : (
                  <div className="space-y-2">
                    {activities.map((a) => (
                      <div key={`${a.type}-${a.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer" onClick={() => navigateToResult(a)}>
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-muted">{getActivityIcon(a.type)}</div>
                          <div>
                            <p className="font-medium text-sm">{getActivityLabel(a.type)}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(a.date), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {a.score !== undefined && <p className="font-semibold text-sm">{a.score}%</p>}
                          {a.status && <Badge variant="outline" className="text-xs">{a.status}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="credits" className="mt-4">
              <ScrollArea className="h-[350px] pr-4">
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 mb-4 flex items-center gap-3">
                  <Coins className="h-8 w-8 text-warning" />
                  <div>
                    <p className="text-2xl font-bold">{creditBalance}</p>
                    <p className="text-sm text-muted-foreground">Credits Available</p>
                  </div>
                </div>
                <h4 className="text-sm font-medium mb-2">Recent Transactions</h4>
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transactions</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-2 rounded border text-sm">
                        <div>
                          <p className="font-medium">{tx.description || tx.transaction_type}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), 'MMM d, yyyy')}</p>
                        </div>
                        <span className={tx.amount >= 0 ? 'text-accent font-medium' : 'text-destructive font-medium'}>
                          {tx.amount >= 0 ? '+' : ''}{tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="sessions" className="mt-4">
              <ScrollArea className="h-[350px] pr-4">
                {agentSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground"><Bot className="h-10 w-10 mx-auto mb-2 opacity-20" /><p>No AI chat sessions</p></div>
                ) : (
                  <div className="space-y-2">
                    {agentSessions.map((s) => {
                      const msgCount = Array.isArray(s.messages) ? s.messages.length : 0;
                      return (
                        <div key={s.id} className="p-3 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm capitalize">{s.agent_key.replace(/_/g, ' ')}</span>
                            </div>
                            <Badge variant="secondary">{msgCount} msgs</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{format(new Date(s.created_at), 'MMM d, yyyy h:mm a')}</p>
                          {s.credits_charged && <p className="text-xs text-muted-foreground">Charged: {s.credits_charged} credits</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="notifications" className="mt-4">
              <ScrollArea className="h-[350px] pr-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground"><Bell className="h-10 w-10 mx-auto mb-2 opacity-20" /><p>No notifications sent</p></div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-3 rounded-lg border ${!n.is_read ? 'bg-primary/5' : ''}`}>
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{n.title}</p>
                          <Badge variant={n.is_read ? "secondary" : "default"} className="text-xs">{n.is_read ? 'Read' : 'Unread'}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), 'MMM d, yyyy h:mm a')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Talent not found in database</p>
            <p className="text-sm mt-1">Email: {talentEmail}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
