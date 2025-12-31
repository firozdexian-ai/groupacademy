import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useTalent } from '@/hooks/useTalent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { talent, updateTalent } = useTalent();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: talent?.fullName || '',
    phone: talent?.phone || '',
    customProfession: talent?.customProfession || '',
    currentStatus: talent?.currentStatus || '',
    institution: talent?.institution || '',
    fieldOfStudy: talent?.fieldOfStudy || '',
    linkedinUrl: talent?.linkedinUrl || '',
    portfolioUrl: talent?.portfolioUrl || ''
  });

  if (!talent) {
    navigate('/app/profile');
    return null;
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateTalent({
        fullName: formData.fullName,
        phone: formData.phone,
        customProfession: formData.customProfession,
        currentStatus: formData.currentStatus,
        institution: formData.institution,
        fieldOfStudy: formData.fieldOfStudy,
        linkedinUrl: formData.linkedinUrl,
        portfolioUrl: formData.portfolioUrl
      });
      
      toast.success('Profile updated successfully');
      navigate('/app/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/app/profile')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Edit Profile</h1>
          <p className="text-sm text-muted-foreground">Update your profile information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="Your full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+880 1XXX XXXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customProfession">Profession / Role</Label>
              <Input
                id="customProfession"
                value={formData.customProfession}
                onChange={(e) => handleChange('customProfession', e.target.value)}
                placeholder="e.g., Software Engineer, Marketing Manager"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentStatus">About / Current Status</Label>
              <Textarea
                id="currentStatus"
                value={formData.currentStatus}
                onChange={(e) => handleChange('currentStatus', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={formData.institution}
                onChange={(e) => handleChange('institution', e.target.value)}
                placeholder="University or school name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fieldOfStudy">Field of Study</Label>
              <Input
                id="fieldOfStudy"
                value={formData.fieldOfStudy}
                onChange={(e) => handleChange('fieldOfStudy', e.target.value)}
                placeholder="e.g., Computer Science, Business Administration"
              />
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="portfolioUrl">Portfolio URL</Label>
              <Input
                id="portfolioUrl"
                type="url"
                value={formData.portfolioUrl}
                onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                placeholder="https://yourportfolio.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/app/profile')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
