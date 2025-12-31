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
  Loader2
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
      // Call AI to enhance experience descriptions
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
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={talent.profilePhotoUrl || undefined} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold">{talent.fullName}</h1>
              <p className="text-muted-foreground">
                {talent.customProfession || 'Career Explorer'}
              </p>
              
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {talent.email}
                </span>
                {talent.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {talent.phone}
                  </span>
                )}
              </div>
            </div>
            
            <Button variant="outline" size="icon" onClick={handleEditProfile}>
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Credits Card */}
      <Card className="mb-6 bg-gradient-to-r from-warning/10 to-warning/5 border-warning/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/20 rounded-full">
                <Coins className="h-6 w-6 text-warning" />
              </div>
              <div>
                {creditsLoading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <p className="text-2xl font-bold">{balance}</p>
                )}
                <p className="text-sm text-muted-foreground">Credits Available</p>
              </div>
            </div>
            <Button onClick={() => setShowCreditSheet(true)}>
              Buy Credits
            </Button>
          </div>
        </CardContent>
      </Card>

      <CreditPurchaseSheet 
        isOpen={showCreditSheet}
        onClose={() => setShowCreditSheet(false)}
        currentBalance={balance}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/app/learning/my-courses')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">My Learning</p>
              <p className="text-xs text-muted-foreground">View courses</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={handleEditProfile}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-sm">Edit Profile</p>
              <p className="text-xs text-muted-foreground">Update details</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Sections */}
      <div className="space-y-4">
        {/* About */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">About</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleEditProfile}>
                <Edit2 className="h-4 w-4" />
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
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Experience</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowEnhanceDialog(true)}
                disabled={!talent.experience || talent.experience.length === 0}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Enhance with AI
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {Array.isArray(talent.experience) && talent.experience.length > 0 ? (
              <div className="space-y-3">
                {(talent.experience as any[]).slice(0, 3).map((exp, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="p-2 bg-muted rounded-lg h-fit">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{exp.title || exp.position}</p>
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
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Education</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleEditProfile}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {Array.isArray(talent.education) && talent.education.length > 0 ? (
              <div className="space-y-3">
                {(talent.education as any[]).slice(0, 3).map((edu, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="p-2 bg-muted rounded-lg h-fit">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{edu.degree || edu.field}</p>
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
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Skills</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleEditProfile}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {Array.isArray(talent.skills) && talent.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {talent.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary">
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
          className="w-full text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Enhance with AI Dialog */}
      <Dialog open={showEnhanceDialog} onOpenChange={setShowEnhanceDialog}>
        <DialogContent>
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
              className="flex-1"
              onClick={() => setShowEnhanceDialog(false)}
              disabled={isEnhancing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
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
