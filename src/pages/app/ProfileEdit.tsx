import { useState, useEffect } from 'react';
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
import { SkillsEditor } from '@/components/profile/SkillsEditor';
import { ExperienceEditor, ExperienceEntry } from '@/components/profile/ExperienceEditor';
import { EducationEditor, EducationEntry } from '@/components/profile/EducationEditor';
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

  // Parse skills from talent data
  const parseSkills = (): string[] => {
    if (!talent?.skills) return [];
    return talent.skills.map((s: any) => 
      typeof s === 'string' ? s : (s?.name || s?.skill || String(s))
    );
  };

  // Parse experience from talent data
  const parseExperience = (): ExperienceEntry[] => {
    if (!talent?.experience) return [];
    return talent.experience.map((exp: any) => ({
      company: exp.company || '',
      position: exp.position || exp.title || '',
      startDate: exp.startDate || exp.start_date || '',
      endDate: exp.endDate || exp.end_date || '',
      description: exp.description || ''
    }));
  };

  // Parse education from talent data
  const parseEducation = (): EducationEntry[] => {
    if (!talent?.education) return [];
    return talent.education.map((edu: any) => ({
      institution: edu.institution || '',
      degree: edu.degree || '',
      fieldOfStudy: edu.fieldOfStudy || edu.field_of_study || edu.field || '',
      startYear: edu.startYear || edu.start_year || '',
      endYear: edu.endYear || edu.end_year || edu.year || ''
    }));
  };

  const [skills, setSkills] = useState<string[]>(parseSkills());
  const [experience, setExperience] = useState<ExperienceEntry[]>(parseExperience());
  const [education, setEducation] = useState<EducationEntry[]>(parseEducation());

  // Update states when talent loads
  useEffect(() => {
    if (talent) {
      setFormData({
        fullName: talent.fullName || '',
        phone: talent.phone || '',
        customProfession: talent.customProfession || '',
        currentStatus: talent.currentStatus || '',
        institution: talent.institution || '',
        fieldOfStudy: talent.fieldOfStudy || '',
        linkedinUrl: talent.linkedinUrl || '',
        portfolioUrl: talent.portfolioUrl || ''
      });
      setProfilePhotoUrl(talent.profilePhotoUrl || '');
      setCvUrl(talent.cvUrl || '');
      setSkills(parseSkills());
      setExperience(parseExperience());
      setEducation(parseEducation());
    }
  }, [talent?.id]);

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
        cvUrl: cvUrl || undefined,
        skills: skills as any,
        experience: experience as any,
        education: education as any
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

        {/* Skills */}
        <Card>
          <CardContent className="pt-6">
            <SkillsEditor 
              skills={skills} 
              onChange={setSkills} 
            />
          </CardContent>
        </Card>

        {/* Experience */}
        <Card>
          <CardContent className="pt-6">
            <ExperienceEditor
              experience={experience}
              onChange={setExperience}
            />
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardContent className="pt-6">
            <EducationEditor
              education={education}
              onChange={setEducation}
            />
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
