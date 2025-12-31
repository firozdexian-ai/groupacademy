import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, FileText, Trash2, ExternalLink } from 'lucide-react';
import { useTalent } from '@/hooks/useTalent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { supabase } from '@/integrations/supabase/client';

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { talent, updateTalent } = useTalent();
  const [saving, setSaving] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(talent?.profilePhotoUrl || '');
  const [cvUrl, setCvUrl] = useState(talent?.cvUrl || '');
  
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

  const handlePhotoChange = (url: string | null) => {
    setProfilePhotoUrl(url || '');
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !talent) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingCV(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${talent.id}/cv-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('portfolio-uploads')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-uploads')
        .getPublicUrl(fileName);

      setCvUrl(publicUrl);
      toast.success('CV uploaded successfully');
    } catch (error) {
      console.error('CV upload error:', error);
      toast.error('Failed to upload CV');
    } finally {
      setUploadingCV(false);
    }
  };

  const handleRemoveCV = () => {
    setCvUrl('');
  };

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
        portfolioUrl: formData.portfolioUrl,
        profilePhotoUrl: profilePhotoUrl || undefined,
        cvUrl: cvUrl || undefined
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
        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfilePhotoUpload
              currentPhotoUrl={profilePhotoUrl}
              fullName={formData.fullName}
              onPhotoChange={handlePhotoChange}
            />
          </CardContent>
        </Card>

        {/* CV Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CV / Resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cvUrl ? (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">CV uploaded</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(cvUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveCV}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="cv-upload">Upload your CV (PDF or Word, max 5MB)</Label>
                <Input
                  id="cv-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCVUpload}
                  disabled={uploadingCV}
                  className="cursor-pointer"
                />
                {uploadingCV && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

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
