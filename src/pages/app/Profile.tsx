import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  Briefcase,
  GraduationCap,
  FileText,
  Edit2,
  Coins,
  LogOut,
  Sparkles,
  Loader2,
  ChevronRight,
  BookOpen,
  History,
  Upload,
  CheckCircle2
} from 'lucide-react';
import { useTalent } from '@/hooks/useTalent';
import { useCredits } from '@/hooks/useCredits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditPurchaseSheet } from '@/components/credits/CreditPurchaseSheet';
import { ApplicationHistoryCard } from '@/components/profile/ApplicationHistoryCard';
import { ServiceHistoryCard } from '@/components/profile/ServiceHistoryCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export default function Profile() {
  const navigate = useNavigate();
  const { talent, signOut, updateTalent, refreshTalent } = useTalent();
  const { balance, isLoading: creditsLoading } = useCredits();
  const [showCreditSheet, setShowCreditSheet] = useState(false);
  const [showEnhanceDialog, setShowEnhanceDialog] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  if (!talent) {
    return null;
  }

  const initials = talent.fullName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleEditProfile = () => {
    navigate('/app/profile/edit');
  };

  const handleEnhanceWithAI = async () => {
    if (!talent.experience || talent.experience.length === 0) {
      toast.error('Please add some work experience first');
      setShowEnhanceDialog(false);
      navigate('/app/profile/edit');
      return;
    }

    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-cover-letter', {
        body: {
          type: 'experience',
          experience: talent.experience,
          profession: talent.customProfession || 'professional'
        }
      });

      if (error) throw error;

      if (data?.enhancedExperience) {
        await updateTalent({
          experience: data.enhancedExperience
        });
        await refreshTalent();
        toast.success('Experience descriptions enhanced!');
      } else {
        toast.info('No enhancements made');
      }
    } catch (error) {
      console.error('Error enhancing experience:', error);
      toast.error('Failed to enhance experience. Please try again.');
    } finally {
      setIsEnhancing(false);
      setShowEnhanceDialog(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Profile Hero Header - bKash Style */}
      <div className="relative mb-6 rounded-3xl overflow-hidden shadow-lg animate-bounce-in">
        {/* Gradient Background */}
        <div className="bg-gradient-primary p-6 pb-8">
          <div className="flex items-start justify-between mb-4">
            <Avatar className="h-20 w-20 ring-4 ring-primary-foreground/30 shadow-xl">
              <AvatarImage src={talent.profilePhotoUrl || undefined} />
              <AvatarFallback className="text-2xl bg-primary-foreground/20 text-primary-foreground font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="secondary" 
              size="icon" 
              className="rounded-xl shadow-md press-scale"
              onClick={handleEditProfile}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
          
          <h1 className="text-xl font-bold text-primary-foreground mb-0.5">{talent.fullName}</h1>
          <p className="text-primary-foreground/80 text-sm">
            {talent.customProfession || 'Career Explorer'}
          </p>
          
          <div className="flex items-center gap-4 mt-3 text-xs text-primary-foreground/70">
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {talent.email}
            </span>
          </div>
        </div>

        {/* Credits Card - Floating */}
        <div className="px-4 -mt-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-warning/15 rounded-lg">
                    <Coins className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    {creditsLoading ? (
                      <Skeleton className="h-6 w-14 mb-0.5" />
                    ) : (
                      <p className="text-xl font-bold">{balance}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground">Credits Available</p>
                  </div>
                </div>
                <Button 
                  size="sm"
                  className="rounded-lg font-semibold press-scale h-8 text-xs"
                  onClick={() => setShowCreditSheet(true)}
                >
                  Buy Credits
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreditPurchaseSheet 
        isOpen={showCreditSheet}
        onClose={() => setShowCreditSheet(false)}
        currentBalance={balance}
      />

      {/* Quick Actions - Horizontal Scroll */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        <Card 
          className="cursor-pointer shadow-sm border-0 flex-shrink-0 w-[110px] press-scale rounded-xl"
          onClick={() => navigate('/app/learning/my-courses')}
        >
          <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <p className="font-semibold text-xs">My Learning</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer shadow-sm border-0 flex-shrink-0 w-[110px] press-scale rounded-xl"
          onClick={handleEditProfile}
        >
          <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
            <div className="p-2 bg-accent/10 rounded-lg">
              <FileText className="h-4 w-4 text-accent" />
            </div>
            <p className="font-semibold text-xs">Edit Profile</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer shadow-sm border-0 flex-shrink-0 w-[110px] press-scale rounded-xl"
          onClick={() => navigate('/app/applications')}
        >
          <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <History className="h-4 w-4 text-secondary" />
            </div>
            <p className="font-semibold text-xs">Applications</p>
          </CardContent>
        </Card>
      </div>

      {/* CV Status Card - Show if no CV uploaded */}
      {!talent.cvUrl && (
        <Card className="mb-5 rounded-2xl shadow-sm border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Upload your CV</p>
                <p className="text-sm text-muted-foreground">Auto-fill your profile & get better job matches</p>
              </div>
              <Button size="sm" onClick={handleEditProfile} className="press-scale">
                Upload
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CV Uploaded Indicator */}
      {talent.cvUrl && (
        <Card className="mb-5 rounded-2xl shadow-sm border-success/20 bg-success/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="text-sm font-medium text-foreground">CV uploaded</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto text-xs"
                onClick={() => window.open(talent.cvUrl!, '_blank')}
              >
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Sections */}
      <div className="space-y-4">
        {/* About */}
        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">About</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleEditProfile} className="press-scale">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {talent.currentStatus ? (
              <p className="text-sm text-muted-foreground">{talent.currentStatus}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Add a summary about yourself...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Experience */}
        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Experience</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowEnhanceDialog(true)}
                disabled={!talent.experience || talent.experience.length === 0}
                className="press-scale text-primary"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Enhance
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {Array.isArray(talent.experience) && talent.experience.length > 0 ? (
              <div className="space-y-3">
                {(talent.experience as any[]).slice(0, 3).map((exp, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="p-2.5 bg-muted rounded-xl h-fit">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{exp.title || exp.position}</p>
                      <p className="text-xs text-muted-foreground">{exp.company}</p>
                      {exp.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Add your work experience...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Education */}
        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Education</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleEditProfile} className="press-scale">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {Array.isArray(talent.education) && talent.education.length > 0 ? (
              <div className="space-y-3">
                {(talent.education as any[]).slice(0, 3).map((edu, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="p-2.5 bg-muted rounded-xl h-fit">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{edu.degree || edu.field}</p>
                      <p className="text-xs text-muted-foreground">{edu.institution}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Add your education...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Skills</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleEditProfile} className="press-scale">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {Array.isArray(talent.skills) && talent.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {talent.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="rounded-lg">
                    {typeof skill === 'string' ? skill : skill.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Add your skills...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Service History */}
        <ServiceHistoryCard />

        {/* My Applications */}
        <ApplicationHistoryCard />
      </div>

      {/* Sign Out */}
      <div className="mt-8">
        <Button 
          variant="outline" 
          className="w-full rounded-xl text-destructive hover:bg-destructive/10 border-destructive/30 press-scale"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Enhance with AI Dialog */}
      <Dialog open={showEnhanceDialog} onOpenChange={setShowEnhanceDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Enhance Experience with AI
            </DialogTitle>
            <DialogDescription>
              AI will improve your work experience descriptions to be more impactful and professional. 
              This helps your profile stand out to employers.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setShowEnhanceDialog(false)}
              disabled={isEnhancing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl"
              onClick={handleEnhanceWithAI}
              disabled={isEnhancing}
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Enhance Now
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
