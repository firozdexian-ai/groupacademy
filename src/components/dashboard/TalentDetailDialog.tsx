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
  ClipboardList, Coins, Bot, Bell, Send, Check, Circle
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { OUTREACH_TEMPLATES, OutreachProduct } from "@/lib/outreachTemplates";

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
      // Load talent profile
      const { data: talentData } = await supabase
        .from('talents')
        .select('*, profession_category:profession_categories(name)')
        .ilike('email', talentEmail)
        .single();

      if (talentData) {
        setTalent(talentData as TalentProfile);

        // Load additional data with talent ID
        const talentId = talentData.id;
        
        const [creditRes, txRes, sessionsRes, notifsRes, outreachRes, assessments, interviews, salaryAnalyses, portfolios] = await Promise.all([
          supabase.from('talent_credits').select('balance').eq('talent_id', talentId).single(),
          supabase.from('credit_transactions').select('id, amount, transaction_type, description, created_at').eq('talent_id', talentId).order('created_at', { ascending: false }).limit(10),
          supabase.from('agent_chat_sessions').select('id, agent_key, created_at, messages, credits_charged').eq('talent_id', talentId).order('created_at', { ascending: false }).limit(5),
          supabase.from('notifications').select('id, title, message, type, is_read, created_at').eq('talent_id', talentId).order('created_at', { ascending: false }).limit(10),
          supabase.from('outreach_messages').select('id, product, sent_at').eq('talent_id', talentId).order('sent_at', { ascending: false }),
          supabase.from('career_assessments').select('id, created_at, percentage, readiness_level').ilike('email', talentEmail).order('created_at', { ascending: false }),
          supabase.from('mock_interviews').select('id, created_at, selection_percentage, status, job_title').ilike('email', talentEmail).order('created_at', { ascending: false }),
          supabase.from('salary_analyses').select('id, created_at, status, job_title').ilike('email', talentEmail).order('created_at', { ascending: false }),
          supabase.from('portfolio_requests').select('id, created_at, status').ilike('email', talentEmail).order('created_at', { ascending: false })
        ]);

        setCreditBalance(creditRes.data?.balance || 0);
        setTransactions(txRes.data || []);
        setAgentSessions(sessionsRes.data || []);
        setNotifications(notifsRes.data || []);
        setOutreachRecords(outreachRes.data || []);

        // Build activities
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

  // Get outreach status for a product
  const getOutreachSentAt = (product: OutreachProduct): string | null => {
    const record = outreachRecords.find(r => r.product === product);
    return record?.sent_at || null;
  };

  // Products to track
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

  const formatWhatsAppLink = (phone: string | null) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleaned.startsWith('880')) return `https://wa.me/${cleaned}`;
    if (cleaned.startsWith('0')) return `https://wa.me/880${cleaned.slice(1)}`;
    return `https://wa.me/${cleaned}`;
  };

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
            <TabsList className="grid w-full grid-cols-6 text-xs">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="outreach">Outreach</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="credits">Credits</TabsTrigger>
              <TabsTrigger value="sessions">AI Chats</TabsTrigger>
              <TabsTrigger value="notifications">Notifs</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4">
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-4">
                  {talent.profile_photo_url && (
                    <div className="flex justify-center">
                      <img src={talent.profile_photo_url} alt={talent.full_name} className="w-20 h-20 rounded-full object-cover border-2 border-border" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{talent.email}</div>
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{talent.phone || 'No phone'}</div>
                    <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" />{talent.custom_profession || talent.profession_category?.name || 'Not set'}</div>
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />Joined {format(new Date(talent.created_at), 'MMM d, yyyy')}</div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Services Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {talent.services_used?.length > 0 ? talent.services_used.map((s, i) => <Badge key={i} variant="secondary">{s.replace('_', ' ')}</Badge>) : <span className="text-sm text-muted-foreground">None</span>}
                    </div>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    {talent.phone && <Button variant="outline" size="sm" onClick={() => window.open(formatWhatsAppLink(talent.phone), '_blank')}><MessageSquare className="h-4 w-4 mr-1 text-green-600" />WhatsApp</Button>}
                    {talent.cv_url && <Button variant="outline" size="sm" onClick={() => window.open(talent.cv_url!, '_blank')}><FileText className="h-4 w-4 mr-1" />CV</Button>}
                    {talent.linkedin_url && <Button variant="outline" size="sm" onClick={() => window.open(talent.linkedin_url!, '_blank')}><ExternalLink className="h-4 w-4 mr-1" />LinkedIn</Button>}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="outreach" className="mt-4">
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Outreach History
                  </h4>
                  <div className="space-y-2">
                    {/* Welcome message - check welcome_sent_at on talent */}
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {talent.welcome_sent_at ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium text-sm">Welcome Message</p>
                          <p className="text-xs text-muted-foreground">
                            {talent.welcome_sent_at 
                              ? `Sent on ${format(new Date(talent.welcome_sent_at), 'MMM d, yyyy')}`
                              : 'Not sent'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={talent.welcome_sent_at ? 'default' : 'secondary'} className="text-xs">
                        {talent.welcome_sent_at ? 'Sent' : 'Pending'}
                      </Badge>
                    </div>

                    {/* Product outreach from outreach_messages table */}
                    {TRACKED_PRODUCTS.filter(p => p !== 'welcome').map((product) => {
                      const sentAt = getOutreachSentAt(product);
                      const template = OUTREACH_TEMPLATES[product];
                      return (
                        <div key={product} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            {sentAt ? (
                              <Check className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium text-sm">{template.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {sentAt
                                  ? `Sent on ${format(new Date(sentAt), 'MMM d, yyyy')}`
                                  : 'Not pitched yet'}
                              </p>
                            </div>
                          </div>
                          <Badge variant={sentAt ? 'default' : 'secondary'} className="text-xs">
                            {sentAt ? 'Sent' : 'Pending'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary */}
                  <Separator className="my-4" />
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      <strong>{outreachRecords.length + (talent.welcome_sent_at ? 1 : 0)}</strong> of{' '}
                      <strong>{TRACKED_PRODUCTS.length}</strong> outreach messages sent
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
