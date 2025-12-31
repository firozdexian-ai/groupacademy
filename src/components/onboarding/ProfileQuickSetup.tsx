import { useState, useEffect } from 'react';
import { Camera, User, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTalent } from '@/hooks/useTalent';
import { toast } from 'sonner';

interface ProfileQuickSetupProps {
  onContinue: () => void;
  onSkip: () => void;
}

interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
}

const STATUS_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'fresh_graduate', label: 'Fresh Graduate' },
  { value: 'job_seeking', label: 'Actively Job Seeking' },
  { value: 'working', label: 'Working Professional' },
];

export function ProfileQuickSetup({ onContinue, onSkip }: ProfileQuickSetupProps) {
  const { talent, updateTalent } = useTalent();
  const [professions, setProfessions] = useState<ProfessionCategory[]>([]);
  const [selectedProfession, setSelectedProfession] = useState<string>(talent?.professionCategoryId || '');
  const [currentStatus, setCurrentStatus] = useState<string>(talent?.currentStatus || '');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(talent?.profilePhotoUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfessions();
  }, []);

  async function fetchProfessions() {
    const { data } = await supabase
      .from('profession_categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('display_order');
    
    if (data) {
      setProfessions(data);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !talent?.id) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${talent.id}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-uploads')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-uploads')
        .getPublicUrl(filePath);

      setProfilePhoto(publicUrl);
      toast.success('Photo uploaded!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleContinue() {
    setIsSaving(true);
    try {
      const updates: any = {};
      if (selectedProfession) updates.professionCategoryId = selectedProfession;
      if (currentStatus) updates.currentStatus = currentStatus;
      if (profilePhoto) updates.profilePhotoUrl = profilePhoto;

      if (Object.keys(updates).length > 0) {
        await updateTalent(updates);
      }
      onContinue();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-center px-4 py-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
        Let's set up your profile
      </h2>
      <p className="text-muted-foreground text-center mb-6">
        A complete profile helps you get better matches
      </p>

      {/* Profile Photo - PRIORITY FIRST */}
      <div className="mb-6 w-full">
        <div className="flex flex-col items-center p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium text-primary">Stand out to recruiters</Label>
          </div>
          
          <div className="relative mb-3">
            <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-background shadow-lg">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
              {isUploading ? (
                <Loader2 className="h-5 w-5 text-primary-foreground animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-primary-foreground" />
              )}
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoUpload}
                disabled={isUploading}
              />
            </label>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            {profilePhoto ? 'Tap to change photo' : 'Add a profile photo'}
          </p>
        </div>
      </div>

      {/* Profession */}
      <div className="w-full mb-5">
        <Label className="mb-2 block text-sm font-medium">What field are you in?</Label>
        <Select value={selectedProfession} onValueChange={setSelectedProfession}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select your profession" />
          </SelectTrigger>
          <SelectContent>
            {professions.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Current Status */}
      <div className="w-full mb-6">
        <Label className="mb-3 block text-sm font-medium">What's your current status?</Label>
        <RadioGroup value={currentStatus} onValueChange={setCurrentStatus} className="space-y-2">
          {STATUS_OPTIONS.map(option => (
            <div 
              key={option.value} 
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                currentStatus === option.value 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:bg-muted/50'
              }`}
              onClick={() => setCurrentStatus(option.value)}
            >
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value} className="cursor-pointer flex-1 text-sm">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Actions */}
      <div className="flex flex-col w-full gap-3">
        <Button 
          size="lg" 
          onClick={handleContinue}
          disabled={isSaving}
          className="w-full h-12"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Continue
        </Button>
        <Button 
          variant="ghost" 
          onClick={onSkip}
          disabled={isSaving}
          className="text-muted-foreground"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
