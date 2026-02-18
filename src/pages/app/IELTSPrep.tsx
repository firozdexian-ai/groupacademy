import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Headphones, BookOpen, PenTool, Mic, ArrowLeft, Play, FileText, CheckCircle, Clock, Lock, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditGateModal } from '@/components/credits/CreditGateModal';
import { CreditPurchaseSheet } from '@/components/credits/CreditPurchaseSheet';
import { useCredits } from '@/hooks/useCredits';
import { useTalent } from '@/hooks/useTalent';
import { getServiceCost } from '@/lib/creditPricing';
import { toast } from '@/hooks/use-toast';

const SECTIONS = [
  { id: 'listening', name: 'Listening', icon: Headphones, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { id: 'reading', name: 'Reading', icon: BookOpen, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { id: 'writing', name: 'Writing', icon: PenTool, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { id: 'speaking', name: 'Speaking', icon: Mic, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
];

const CONTENT_TYPE_ICONS: Record<string, typeof Play> = {
  video: Play,
  article: FileText,
  practice: CheckCircle,
  mock_test: Clock,
  tips: BookOpen,
};

interface IELTSResource {
  id: string;
  title: string;
  description: string | null;
  section: string;
  content_type: string;
  content_url: string | null;
  is_free: boolean;
  duration_mins: number | null;
  difficulty_level: string | null;
}

export default function IELTSPrep() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('listening');
  const [selectedResource, setSelectedResource] = useState<IELTSResource | null>(null);
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  const { talent } = useTalent();
  const { balance, deductCredits, refreshBalance } = useCredits();
  const ieltsCost = getServiceCost('IELTS_MOCK');

  // Fetch user's unlocked resources
  const { data: unlockedResources, refetch: refetchAccess } = useQuery({
    queryKey: ['ielts-access', talent?.id],
    queryFn: async () => {
      if (!talent?.id) return [];
      const { data, error } = await supabase
        .from('ielts_resource_access')
        .select('resource_id')
        .eq('talent_id', talent.id);
      if (error) throw error;
      return data?.map(r => r.resource_id) || [];
    },
    enabled: !!talent?.id,
  });

  const { data: resources, isLoading } = useQuery({
    queryKey: ['ielts-resources', activeSection],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ielts_resources')
        .select('*')
        .eq('section', activeSection)
        .eq('is_active', true)
        .order('display_order')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allResources } = useQuery({
    queryKey: ['ielts-resources-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ielts_resources')
        .select('section, is_free')
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
  });

  const getSectionStats = (sectionId: string) => {
    if (!allResources) return { total: 0, free: 0 };
    const sectionResources = allResources.filter(r => r.section === sectionId);
    return {
      total: sectionResources.length,
      free: sectionResources.filter(r => r.is_free).length,
    };
  };

  const isResourceUnlocked = (resourceId: string, isFree: boolean) => {
    if (isFree) return true;
    return unlockedResources?.includes(resourceId) || false;
  };

  const handleResourceClick = (resource: IELTSResource) => {
    if (isResourceUnlocked(resource.id, resource.is_free)) {
      if (resource.content_url) {
        window.open(resource.content_url, '_blank');
      } else {
        toast({
          title: 'Content Not Available',
          description: 'This resource content is not yet available.',
          variant: 'destructive',
        });
      }
    } else {
      // Show credit gate for premium resources
      setSelectedResource(resource);
      setShowCreditGate(true);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!selectedResource || !talent?.id) return;
    
    setIsUnlocking(true);
    try {
      const success = await deductCredits('IELTS_MOCK', selectedResource.id, `Unlocked: ${selectedResource.title}`);
      
      if (success) {
        // Track access in database
        const { error } = await supabase
          .from('ielts_resource_access')
          .insert({
            talent_id: talent.id,
            resource_id: selectedResource.id,
          });
        
        if (error) {
          console.error('Failed to track access:', error);
          toast({
            title: 'Error',
            description: 'Failed to save access. Please try again.',
            variant: 'destructive',
          });
          return;
        }
        
        // Refetch access list
        await refetchAccess();
        await refreshBalance();
        
        toast({
          title: 'Resource Unlocked! 🎉',
          description: `You now have access to "${selectedResource.title}"`,
        });
        
        setShowCreditGate(false);
        
        // Open the resource
        if (selectedResource.content_url) {
          window.open(selectedResource.content_url, '_blank');
        }
      }
    } catch (error) {
      console.error('Error unlocking resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to unlock resource. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  const currentSection = SECTIONS.find(s => s.id === activeSection);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/abroad')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">IELTS Preparation</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-muted-foreground text-sm">Master all four IELTS sections</p>
            <Badge variant="secondary" className="gap-1">
              <Coins className="h-3 w-3 text-warning" />
              {ieltsCost} credits/resource
            </Badge>
          </div>
        </div>
      </div>

      {/* Section Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {SECTIONS.map(section => {
          const stats = getSectionStats(section.id);
          const SectionIcon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <Card 
              key={section.id}
              className={`cursor-pointer transition-all ${isActive ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-sm'}`}
              onClick={() => setActiveSection(section.id)}
            >
              <CardContent className="p-4">
                <div className={`p-2 rounded-xl ${section.bgColor} w-fit mb-2`}>
                  <SectionIcon className={`h-5 w-5 ${section.color}`} />
                </div>
                <h3 className="font-semibold">{section.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.total} resources {stats.free > 0 && `• ${stats.free} free`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resources List */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {currentSection && (
              <>
                <div className={`p-2 rounded-lg ${currentSection.bgColor}`}>
                  <currentSection.icon className={`h-5 w-5 ${currentSection.color}`} />
                </div>
                <h2 className="text-lg font-semibold">{currentSection.name} Resources</h2>
              </>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : resources && resources.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {resources.map((resource) => {
              const ContentIcon = CONTENT_TYPE_ICONS[resource.content_type] || FileText;
              const unlocked = isResourceUnlocked(resource.id, resource.is_free);
              
              return (
                <Card key={resource.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ContentIcon className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs capitalize">
                          {resource.content_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      {resource.is_free ? (
                        <Badge className="bg-green-500/10 text-green-600">Free</Badge>
                      ) : unlocked ? (
                        <Badge className="bg-primary/10 text-primary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Unlocked
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          {ieltsCost} credits
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium mb-1">{resource.title}</h3>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {resource.duration_mins && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {resource.duration_mins} min
                          </span>
                        )}
                        {resource.difficulty_level && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {resource.difficulty_level}
                          </Badge>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant={unlocked ? "default" : "outline"}
                        onClick={() => handleResourceClick(resource)}
                      >
                        {unlocked ? 'Start' : 'Unlock'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              {currentSection && (
                <currentSection.icon className={`h-10 w-10 mx-auto ${currentSection.color} mb-4`} />
              )}
              <h3 className="text-lg font-semibold mb-2">No Resources Yet</h3>
              <p className="text-muted-foreground mb-4">
                {currentSection?.name} preparation materials will be added soon.
              </p>
              <Button variant="outline" onClick={() => navigate('/app/agents/ielts-tutor')}>
                Practice with AI Tutor
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Practice CTA - Now links directly to IELTS Tutor */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI-Powered Speaking Practice</h3>
                <p className="text-sm text-muted-foreground">
                  Practice your speaking skills with our IELTS AI Tutor and get instant feedback.
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/app/agents/ielts-tutor')}>
              Start Practice
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Credit Gate Modal */}
      <CreditGateModal
        isOpen={showCreditGate}
        onClose={() => {
          setShowCreditGate(false);
          setSelectedResource(null);
        }}
        onConfirm={handleConfirmPurchase}
        onBuyCredits={() => {
          setShowCreditGate(false);
          setShowPurchaseSheet(true);
        }}
        serviceName={selectedResource?.title || 'IELTS Resource'}
        cost={ieltsCost}
        currentBalance={balance}
        isLoading={isUnlocking}
      />

      {/* Credit Purchase Sheet */}
      <CreditPurchaseSheet
        isOpen={showPurchaseSheet}
        onClose={() => setShowPurchaseSheet(false)}
        currentBalance={balance}
      />
    </div>
  );
}
