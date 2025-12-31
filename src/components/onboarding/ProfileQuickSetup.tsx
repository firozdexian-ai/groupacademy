import { useState, useEffect } from 'react';
import { Camera, User, Loader2 } from 'lucide-react';
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
  { value: 'working', label: 'Working Professional' },
  { value: 'career_switcher', label: 'Career Switcher' },
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
        Quick Profile Setup
      </h2>
      <p className="text-muted-foreground text-center mb-8">
        Help us personalize your experience
      </p>

      {/* Profile Photo */}
      <div className="mb-8">
        <Label className="block text-center mb-3">Profile Photo</Label>
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
            {isUploading ? (
              <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
            ) : (
              <Camera className="h-4 w-4 text-primary-foreground" />
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
      </div>

      {/* Profession */}
      <div className="w-full mb-6">
        <Label className="mb-2 block">What field are you in?</Label>
        <Select value={selectedProfession} onValueChange={setSelectedProfession}>
          <SelectTrigger>
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
      <div className="w-full mb-8">
        <Label className="mb-3 block">What's your current status?</Label>
        <RadioGroup value={currentStatus} onValueChange={setCurrentStatus} className="space-y-2">
          {STATUS_OPTIONS.map(option => (
            <div 
              key={option.value} 
              className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => setCurrentStatus(option.value)}
            >
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value} className="cursor-pointer flex-1">
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
          className="w-full"
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
