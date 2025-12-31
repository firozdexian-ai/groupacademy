import { useState, useEffect } from "react";
import { TalentProfile } from "@/contexts/TalentContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, User, GraduationCap, Briefcase, Sparkles, Camera } from "lucide-react";
import { toast } from "sonner";
import { EducationEditor, EducationEntry } from "./EducationEditor";
import { ExperienceEditor, ExperienceEntry } from "./ExperienceEditor";
import { SkillsEditor } from "./SkillsEditor";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talent: TalentProfile;
  onSave: (data: Partial<TalentProfile>) => Promise<boolean>;
}

export function ProfileEditDialog({
  open,
  onOpenChange,
  talent,
}: ProfileEditDialogProps) {
  // Basic info state
  const [fullName, setFullName] = useState(talent.fullName);
  const [phone, setPhone] = useState(talent.phone || "");
  const [linkedinUrl, setLinkedinUrl] = useState(talent.linkedinUrl || "");
  const [portfolioUrl, setPortfolioUrl] = useState(talent.portfolioUrl || "");
  const [customProfession, setCustomProfession] = useState(talent.customProfession || "");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(talent.profilePhotoUrl || "");
  
  // Education, experience, skills state
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Initialize data from talent prop
  useEffect(() => {
    if (talent) {
      setFullName(talent.fullName);
      setPhone(talent.phone || "");
      setLinkedinUrl(talent.linkedinUrl || "");
      setPortfolioUrl(talent.portfolioUrl || "");
      setCustomProfession(talent.customProfession || "");
      setProfilePhotoUrl(talent.profilePhotoUrl || "");
      
      // Parse education array
      if (talent.education && Array.isArray(talent.education)) {
        setEducation(talent.education.map((edu: any) => ({
          institution: edu.institution || "",
          degree: edu.degree || "",
          fieldOfStudy: edu.fieldOfStudy || edu.field_of_study || "",
          startYear: edu.startYear || edu.start_year || "",
          endYear: edu.endYear || edu.end_year || "",
        })));
      } else {
        setEducation([]);
      }
      
      // Parse experience array
      if (talent.experience && Array.isArray(talent.experience)) {
        setExperience(talent.experience.map((exp: any) => ({
          company: exp.company || "",
          position: exp.position || exp.title || "",
          startDate: exp.startDate || exp.start_date || "",
          endDate: exp.endDate || exp.end_date || "",
          description: exp.description || "",
        })));
      } else {
        setExperience([]);
      }
      
      // Parse skills array
      if (talent.skills && Array.isArray(talent.skills)) {
        // Handle both string arrays and object arrays
        setSkills(talent.skills.map((skill: any) => 
          typeof skill === 'string' ? skill : (skill.name || skill.skill || String(skill))
        ));
      } else {
        setSkills([]);
      }
    }
  }, [talent, open]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    setIsSaving(true);
    try {
      
      const updateData: any = {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        portfolio_url: portfolioUrl.trim() || null,
        custom_profession: customProfession.trim() || null,
        profile_photo_url: profilePhotoUrl || null,
        education: education.filter(e => e.institution || e.degree),
        experience: experience.filter(e => e.company || e.position),
        skills: skills.filter(s => s.trim()),
      };

      const { error } = await supabase
        .from("talents")
        .update(updateData)
        .eq("id", talent.id);

      if (error) {
        console.error("Error updating profile:", error);
        toast.error("Failed to update profile");
        return;
      }

      toast.success("Profile updated successfully");
      onOpenChange(false);
      
      // Trigger page refresh to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal and professional information
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="photo" className="text-xs">
              <Camera className="h-3 w-3 mr-1 hidden sm:inline" />
              Photo
            </TabsTrigger>
            <TabsTrigger value="basic" className="text-xs">
              <User className="h-3 w-3 mr-1 hidden sm:inline" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="education" className="text-xs">
              <GraduationCap className="h-3 w-3 mr-1 hidden sm:inline" />
              Education
            </TabsTrigger>
            <TabsTrigger value="experience" className="text-xs">
              <Briefcase className="h-3 w-3 mr-1 hidden sm:inline" />
              Experience
            </TabsTrigger>
            <TabsTrigger value="skills" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1 hidden sm:inline" />
              Skills
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4 pr-4">
            <TabsContent value="photo" className="mt-0">
              <div className="py-6">
                <ProfilePhotoUpload
                  currentPhotoUrl={profilePhotoUrl}
                  fullName={fullName}
                  onPhotoChange={setProfilePhotoUrl}
                />
              </div>
            </TabsContent>

            <TabsContent value="basic" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession">Profession / Job Title</Label>
                <Input
                  id="profession"
                  value={customProfession}
                  onChange={(e) => setCustomProfession(e.target.value)}
                  placeholder="e.g. Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio URL</Label>
                <Input
                  id="portfolio"
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </TabsContent>

            <TabsContent value="education" className="mt-0">
              <EducationEditor 
                education={education} 
                onChange={setEducation} 
              />
            </TabsContent>

            <TabsContent value="experience" className="mt-0">
              <ExperienceEditor 
                experience={experience} 
                onChange={setExperience} 
              />
            </TabsContent>

            <TabsContent value="skills" className="mt-0">
              <SkillsEditor 
                skills={skills} 
                onChange={setSkills} 
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
