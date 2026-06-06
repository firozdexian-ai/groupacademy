import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { updateTalentById } from "@/domains/talent/repo/talentRepo";
import { useTalent } from "@/hooks/useTalent";
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
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Loader2, User, GraduationCap, Briefcase, Sparkles, Camera, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { EducationEditor, EducationEntry } from "./EducationEditor";
import { ExperienceEditor, ExperienceEntry } from "./ExperienceEditor";
import { SkillsEditor } from "./SkillsEditor";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import type { TalentProfile } from "@/contexts/TalentContext";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talent: TalentProfile;
}

/**
 * GroUp Academy: Authoritative Professional Identity Gateway Master Editor (ProfileEditDialog)
 * An operational sandbox orchestrating academic records, career histories, skill matrices, and profile hydration tasks.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ProfileEditDialog({ open, onOpenChange, talent }: ProfileEditDialogProps) {
  const queryClient = useQueryClient();
  const { refreshTalent } = useTalent();
  const isMountedRef = useRef<boolean>(true);

  // IDENTITY_LEDGER: State Configuration Management
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [customProfession, setCustomProfession] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");

  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [skills, setSkills] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Synchronize component lifecycles to safely drop background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // HYDRATION LIFECYCLE: Safe structural data mapping from parent talent prop variables
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
          institution: String(edu?.institution || ""),
          degree: String(edu?.degree || ""),
          fieldOfStudy: String(edu?.fieldOfStudy || edu?.field_of_study || ""),
          startYear: String(edu?.startYear || edu?.start_year || ""),
          endYear: String(edu?.endYear || edu?.end_year || ""),
        })),
      );

      const expData = Array.isArray(talent.experience) ? talent.experience : [];
      setExperience(
        expData.map((exp: any) => ({
          company: String(exp?.company || ""),
          position: String(exp?.position || exp?.title || ""),
          startDate: String(exp?.startDate || exp?.start_date || ""),
          endDate: String(exp?.endDate || exp?.end_date || ""),
          description: String(exp?.description || ""),
        })),
      );

      const skillData = Array.isArray(talent.skills) ? talent.skills : [];
      setSkills(
        skillData.map((skill: any) =>
          typeof skill === "string" ? skill : String(skill?.name || skill?.skill || skill),
        ),
      );

      trackEvent("profile_editor_hydration_complete");
    }
  }, [talent, open]);

  const handleExecutiveSave = async () => {
    const sanitizedFullName = fullName.trim();
    if (!sanitizedFullName) {
      toast.error("Please enter your full name.");
      return;
    }

    setIsSaving(true);
    trackEvent("profile_editor_save_requested");
    const dynamicToastTrackerId = toast.loading("Saving profile…");

    try {
      // Pack parameters defensively with explicit cast schema configurations
      const compiledNextUpdateData = {
        full_name: sanitizedFullName,
        phone: phone.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        portfolio_url: portfolioUrl.trim() || null,
        custom_profession: customProfession.trim() || null,
        profile_photo_url: profilePhotoUrl || null,
        education: education.filter((e) => e.institution.trim() || e.degree.trim()) as any,
        experience: experience.filter((e) => e.company.trim() || e.position.trim()) as any,
        skills: skills.filter((s) => s.trim()) as any,
      };

      await updateTalentById(talent.id, compiledNextUpdateData);

      // Automated Efficiency: Evaporate user cache indexes across dependent panels instantly
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      if (refreshTalent) {
        await refreshTalent();
      }

      if (isMountedRef.current) {
        toast.success("Profile saved.", { id: dynamicToastTrackerId });
        trackEvent("profile_editor_save_success");
        onOpenChange(false);
      }
    } catch (caughtPipelineExceptionErr: any) {
      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, {
        component: "ProfileEditDialog",
        action: "commit_profile_editor_save_api",
      });

      toast.error(`Save failed: ${formattedExceptionMsgStr}`, { id: dynamicToastTrackerId });
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(vState) => {
        if (!isSaving) {
          onOpenChange(vState);
          if (!vState) trackEvent("profile_editor_dialog_closed");
        }
      }}
    >
      <DialogContent className="sm:max-w-xl rounded-xl border border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl p-5 sm:p-6 text-left antialiased overflow-hidden transform-gpu select-none sm:select-text flex flex-col justify-center">
        {/* HUD LEVEL 1: GATEWAY DIALOG ROW HEADER CONTAINER */}
        <DialogHeader className="mb-4 text-left select-none shrink-0 leading-none w-full">
          <div className="flex items-center gap-2.5 leading-none w-full">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/5 text-primary flex items-center justify-center shrink-0 shadow-inner">
              <Zap className="h-4 w-4 text-primary fill-primary/10 stroke-[2.2] animate-pulse" />
            </div>
            <div className="min-w-0 flex flex-col justify-center leading-none flex-1">
              <DialogTitle className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide leading-none">
                Edit Profile
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none pt-1">
                Update your profile details below
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* HUD LEVEL 2: COMPOSITE SELECTION TABS TRIGGER DECK PANEL LIST */}
        <Tabs
          value={activeTab}
          onValueChange={(tab) => {
            trackEvent("profile_editor_tab_swapped", { activeTab: tab });
            setActiveTab(tab);
          }}
          className="w-full min-w-0 font-bold text-xs tracking-tight"
        >
          <TabsList className="grid w-full grid-cols-5 h-9 bg-muted/20 border border-border/40 p-0.5 rounded-xl gap-0.5 select-none leading-none items-center font-mono">
            <TabsTrigger
              value="photo"
              className="rounded-lg text-[10px] font-bold uppercase tracking-wider py-1 cursor-pointer text-muted-foreground transition-all flex items-center justify-center gap-1"
            >
              <Camera className="h-3.5 w-3.5 stroke-[2.2]" /> <span>Photo</span>
            </TabsTrigger>
            <TabsTrigger
              value="basic"
              className="rounded-lg text-[10px] font-bold uppercase tracking-wider py-1 cursor-pointer text-muted-foreground transition-all flex items-center justify-center gap-1"
            >
              <User className="h-3.5 w-3.5 stroke-[2.2]" /> <span>Basic</span>
            </TabsTrigger>
            <TabsTrigger
              value="education"
              className="rounded-lg text-[10px] font-bold uppercase tracking-wider py-1 cursor-pointer text-muted-foreground transition-all flex items-center justify-center gap-1"
            >
              <GraduationCap className="h-3.5 w-3.5 stroke-[2.2]" /> <span>Edu</span>
            </TabsTrigger>
            <TabsTrigger
              value="experience"
              className="rounded-lg text-[10px] font-bold uppercase tracking-wider py-1 cursor-pointer text-muted-foreground transition-all flex items-center justify-center gap-1"
            >
              <Briefcase className="h-3.5 w-3.5 stroke-[2.2]" /> <span>Exp</span>
            </TabsTrigger>
            <TabsTrigger
              value="skills"
              className="rounded-lg text-[10px] font-bold uppercase tracking-wider py-1 cursor-pointer text-muted-foreground transition-all flex items-center justify-center gap-1"
            >
              <Sparkles className="h-3.5 w-3.5 stroke-[2.2]" /> <span>Skills</span>
            </TabsTrigger>
          </TabsList>

          {/* HUD LEVEL 3: SCROLL LAYOUT INTERFACE CANVAS CONTENT FRAME */}
          <ScrollArea className="h-[400px] sm:h-[450px] mt-4 pr-1.5 w-full min-w-0 text-left">
            <div className="w-full min-w-0 select-text font-bold text-xs flex flex-col justify-center animate-in fade-in duration-200">
              <TabsContent value="photo" className="mt-0 pb-2 w-full outline-none focus-visible:ring-0">
                <ProfilePhotoUpload
                  currentPhotoUrl={profilePhotoUrl}
                  fullName={fullName}
                  onPhotoChange={setProfilePhotoUrl}
                />
              </TabsContent>

              <TabsContent
                value="basic"
                className="space-y-4 mt-0 w-full outline-none focus-visible:ring-0 text-left font-bold text-xs text-foreground"
              >
                <div className="grid grid-cols-1 gap-4 w-full">
                  <div className="space-y-1.5 text-left w-full min-w-0">
                    <Label className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none">
                      Full Name *
                    </Label>
                    <Input
                      value={fullName}
                      disabled={isSaving}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name..."
                      className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner w-full block"
                    />
                  </div>

                  <div className="space-y-1.5 text-left w-full min-w-0">
                    <Label className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none">
                      Phone Number
                    </Label>
                    <Input
                      type="tel"
                      value={phone}
                      disabled={isSaving}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="E.g. +8801XXXXXXXXX"
                      className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner font-mono block select-text tracking-wide"
                    />
                  </div>

                  <div className="space-y-1.5 text-left w-full min-w-0">
                    <Label className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none">
                      Profession / Title
                    </Label>
                    <Input
                      value={customProfession}
                      disabled={isSaving}
                      onChange={(e) => setCustomProfession(e.target.value)}
                      placeholder="E.g. Senior Software Engineer"
                      className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner w-full block"
                    />
                  </div>

                  <div className="space-y-1.5 text-left w-full min-w-0">
                    <Label className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none">
                      LinkedIn Profile URL
                    </Label>
                    <Input
                      value={linkedinUrl}
                      disabled={isSaving}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner font-mono text-primary/80 block select-text w-full"
                    />
                  </div>

                  <div className="space-y-1.5 text-left w-full min-w-0">
                    <Label className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none">
                      Portfolio Website URL
                    </Label>
                    <Input
                      value={portfolioUrl}
                      disabled={isSaving}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://yourportfolio.com"
                      className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner font-mono text-primary/80 block select-text w-full"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="education" className="mt-0 w-full outline-none focus-visible:ring-0">
                <EducationEditor education={education} onChange={setEducation} />
              </TabsContent>

              <TabsContent value="experience" className="mt-0 w-full outline-none focus-visible:ring-0">
                <ExperienceEditor experience={experience} onChange={setExperience} />
              </TabsContent>

              <TabsContent value="skills" className="mt-0 w-full outline-none focus-visible:ring-0">
                <SkillsEditor skills={skills} onChange={setSkills} />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        {/* HUD LEVEL 4: FOOTER ACTION CONFIRMATION OVERLAY TRACK BUTTON ROW */}
        <DialogFooter className="mt-5 gap-2.5 sm:gap-0 select-none border-t border-border/10 pt-4 w-full shrink-0 flex items-center justify-end font-bold text-xs">
          <Button
            variant="ghost"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="h-9 px-4 rounded-xl text-muted-foreground hover:text-foreground font-bold uppercase text-[10px] tracking-wide shrink-0 transition-colors cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleExecutiveSave}
            disabled={isSaving}
            className="h-9 px-5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
                <span>Save profile</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
