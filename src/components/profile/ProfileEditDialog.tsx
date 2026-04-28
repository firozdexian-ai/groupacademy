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
import { Loader2, User, GraduationCap, Briefcase, Sparkles, Camera, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { EducationEditor, EducationEntry } from "./EducationEditor";
import { ExperienceEditor, ExperienceEntry } from "./ExperienceEditor";
import { SkillsEditor } from "./SkillsEditor";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";

/**
 * GroUp Academy: Profile Management Node (Hardened Type Version)
 * CTO Reference: Authoritative identity editor for talent professional nodes.
 * Fixes: TS2345 (Json incompatibility via explicit cast).
 */

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talent: TalentProfile;
}

export function ProfileEditDialog({ open, onOpenChange, talent }: ProfileEditDialogProps) {
  // IDENTITY_LEDGER: State Management
  const [fullName, setFullName] = useState(talent.fullName || "");
  const [phone, setPhone] = useState(talent.phone || "");
  const [linkedinUrl, setLinkedinUrl] = useState(talent.linkedinUrl || "");
  const [portfolioUrl, setPortfolioUrl] = useState(talent.portfolioUrl || "");
  const [customProfession, setCustomProfession] = useState(talent.customProfession || "");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(talent.profilePhotoUrl || "");

  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [skills, setSkills] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // HYDRATION: Synchronize from talent prop
  useEffect(() => {
    if (talent && open) {
      setFullName(talent.fullName || "");
      setPhone(talent.phone || "");
      setLinkedinUrl(talent.linkedinUrl || "");
      setPortfolioUrl(talent.portfolioUrl || "");
      setCustomProfession(talent.customProfession || "");
      setProfilePhotoUrl(talent.profilePhotoUrl || "");

      const eduData = Array.isArray(talent.education) ? talent.education : [];
      setEducation(
        eduData.map((edu: any) => ({
          institution: edu.institution || "",
          degree: edu.degree || "",
          fieldOfStudy: edu.fieldOfStudy || edu.field_of_study || "",
          startYear: edu.startYear || edu.start_year || "",
          endYear: edu.endYear || edu.end_year || "",
        })),
      );

      const expData = Array.isArray(talent.experience) ? talent.experience : [];
      setExperience(
        expData.map((exp: any) => ({
          company: exp.company || "",
          position: exp.position || exp.title || "",
          startDate: exp.startDate || exp.start_date || "",
          endDate: exp.endDate || exp.end_date || "",
          description: exp.description || "",
        })),
      );

      const skillData = Array.isArray(talent.skills) ? talent.skills : [];
      setSkills(
        skillData.map((skill: any) => (typeof skill === "string" ? skill : skill.name || skill.skill || String(skill))),
      );
    }
  }, [talent, open]);

  const handleExecutiveSave = async () => {
    if (!fullName.trim()) {
      toast.error("Identity Fault: Full name is required.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Synchronizing identity with global ledger...");

    try {
      // CTO FIX: Use 'as any' to bypass Json incompatibility for complex arrays
      const updateData = {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        portfolio_url: portfolioUrl.trim() || null,
        custom_profession: customProfession.trim() || null,
        profile_photo_url: profilePhotoUrl || null,
        education: education.filter((e) => e.institution.trim() || e.degree.trim()) as any,
        experience: experience.filter((e) => e.company.trim() || e.position.trim()) as any,
        skills: skills.filter((s) => s.trim()) as any,
      };

      const { error } = await supabase.from("talents").update(updateData).eq("id", talent.id);

      if (error) throw error;

      toast.success("Identity Synced: Profile updated.", { id: toastId });
      onOpenChange(false);

      // OPTIONAL: Using reload for absolute state sync,
      // Replace with context refresh if available.
      window.location.reload();
    } catch (error: any) {
      console.error("[Registry Fault]:", error);
      toast.error("Transmission Error: Failed to sync identity.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-[32px] border-2 border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3 text-foreground">
            <Zap className="h-6 w-6 text-primary fill-current" /> Profile_Editor
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
            Authorized identity management and credential synchronization
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/20 rounded-2xl p-1 gap-1 border border-border/10">
            <TabsTrigger
              value="photo"
              className="rounded-xl text-[10px] font-black uppercase italic tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg"
            >
              <Camera className="h-3 w-3 mr-1" /> Photo
            </TabsTrigger>
            <TabsTrigger
              value="basic"
              className="rounded-xl text-[10px] font-black uppercase italic tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg"
            >
              <User className="h-3 w-3 mr-1" /> Basic
            </TabsTrigger>
            <TabsTrigger
              value="education"
              className="rounded-xl text-[10px] font-black uppercase italic tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg"
            >
              <GraduationCap className="h-3 w-3 mr-1" /> EDU
            </TabsTrigger>
            <TabsTrigger
              value="experience"
              className="rounded-xl text-[10px] font-black uppercase italic tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg"
            >
              <Briefcase className="h-3 w-3 mr-1" /> EXP
            </TabsTrigger>
            <TabsTrigger
              value="skills"
              className="rounded-xl text-[10px] font-black uppercase italic tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg"
            >
              <Sparkles className="h-3 w-3 mr-1" /> Skills
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[450px] mt-6 pr-4">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <TabsContent value="photo" className="mt-0 pb-6">
                <ProfilePhotoUpload
                  currentPhotoUrl={profilePhotoUrl}
                  fullName={fullName}
                  onPhotoChange={setProfilePhotoUrl}
                />
              </TabsContent>

              <TabsContent value="basic" className="space-y-6 mt-0 text-left">
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase italic text-primary ml-1">Identity_Name *</Label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Node Name"
                      className="h-12 rounded-xl border-2 font-bold bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase italic text-primary ml-1">
                      Communication_Line
                    </Label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+880..."
                      className="h-12 rounded-xl border-2 font-bold bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase italic text-primary ml-1">Functional_Role</Label>
                    <Input
                      value={customProfession}
                      onChange={(e) => setCustomProfession(e.target.value)}
                      placeholder="E.G. SOFTWARE_ARCHITECT"
                      className="h-12 rounded-xl border-2 font-bold bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase italic text-primary ml-1">
                      LinkedIn_Sync_Node
                    </Label>
                    <Input
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="HTTPS://LINKEDIN.COM/IN/..."
                      className="h-12 rounded-xl border-2 font-bold bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase italic text-primary ml-1">
                      Portfolio_Artifact
                    </Label>
                    <Input
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="HTTPS://..."
                      className="h-12 rounded-xl border-2 font-bold bg-background/50"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="education" className="mt-0">
                <EducationEditor education={education} onChange={setEducation} />
              </TabsContent>

              <TabsContent value="experience" className="mt-0">
                <ExperienceEditor experience={experience} onChange={setExperience} />
              </TabsContent>

              <TabsContent value="skills" className="mt-0">
                <SkillsEditor skills={skills} onChange={setSkills} />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-8 gap-3 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="h-12 rounded-xl font-black uppercase italic text-[10px] tracking-widest text-muted-foreground hover:bg-muted/10"
          >
            Abort_Changes
          </Button>
          <Button
            onClick={handleExecutiveSave}
            disabled={isSaving}
            className="h-12 px-8 rounded-xl font-black uppercase italic text-[10px] tracking-widest gap-2 shadow-2xl active:scale-95 transition-all"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {isSaving ? "Syncing_Ledger..." : "Authorize_Sync"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
