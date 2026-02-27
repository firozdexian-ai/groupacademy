import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Edit2,
  Sparkles,
  Loader2,
  Plus,
  Settings,
  MapPin,
  Award,
  Languages,
  ArrowLeft,
} from "lucide-react";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileCompletionMeter } from "@/components/profile/ProfileCompletionMeter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCountryFlag, getCountryName } from "@/lib/constants/countries";

export default function Profile() {
  const navigate = useNavigate();
  const { talent, updateTalent, refreshTalent, isLoading: isTalentLoading } = useTalent();
  const [showEnhanceDialog, setShowEnhanceDialog] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  if (isTalentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!talent) return null;

  const initials = talent.fullName
    ? talent.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const navigateEdit = (hash?: string) => {
    navigate(`/app/profile/edit${hash ? `#${hash}` : ""}`);
  };

  const latestExperience = talent.experience?.[0];
  const latestEducation = talent.education?.[0];

  const handleEnhanceWithAI = async () => {
    if (!talent.experience || talent.experience.length === 0) {
      toast.error("Please add some work experience first");
      setShowEnhanceDialog(false);
      navigate("/app/profile/edit");
      return;
    }

    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-cover-letter", {
        body: {
          type: "experience",
          experience: talent.experience,
          profession: talent.customProfession || "professional",
        },
      });

      if (error) throw error;

      if (data?.enhancedExperience) {
        await updateTalent({ experience: data.enhancedExperience });
        await refreshTalent();
        toast.success("Experience descriptions enhanced!");
      } else {
        toast.info("No enhancements made");
      }
    } catch (error) {
      console.error("Error enhancing experience:", error);
      toast.error("Failed to enhance experience. Please try again.");
    } finally {
      setIsEnhancing(false);
      setShowEnhanceDialog(false);
    }
  };

  // Section header helper
  const SectionHeader = ({
    title,
    count,
    section,
    showEnhance,
  }: {
    title: string;
    count?: number;
    section: string;
    showEnhance?: boolean;
  }) => (
    <div className="flex items-center justify-between">
      <CardTitle className="text-base font-semibold">
        {title}
        {count !== undefined && count > 0 && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">({count})</span>
        )}
      </CardTitle>
      <div className="flex items-center gap-1">
        {showEnhance && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary"
            onClick={() => setShowEnhanceDialog(true)}
            disabled={!talent.experience || talent.experience.length === 0}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateEdit(section)}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateEdit(section)}>
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Profile</h1>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigateEdit()}>
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Cover Banner + Profile Card */}
      <div className="relative mb-5 animate-bounce-in">
        {/* Cover */}
        {talent.coverImageUrl ? (
          <img src={talent.coverImageUrl} alt="Cover" className="h-28 w-full object-cover rounded-t-3xl mx-4" />
        ) : (
          <div className="h-28 bg-gradient-primary rounded-t-3xl mx-4" />
        )}

        {/* Profile Info - overlapping the banner */}
        <div className="mx-4 -mt-12 relative">
          <div className="bg-card rounded-2xl shadow-lg p-5 pt-0">
            {/* Avatar */}
            <div className="flex items-end justify-between -mt-8 mb-3">
              <Avatar className="h-20 w-20 ring-4 ring-card shadow-xl">
                <AvatarImage src={talent.profilePhotoUrl || undefined} />
                <AvatarFallback className="text-xl bg-primary text-primary-foreground font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" className="rounded-xl mt-10" onClick={() => navigateEdit()}>
                <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            </div>

            {/* Name & Info */}
            <h2 className="text-lg font-bold">{talent.fullName}</h2>
            <p className="text-sm text-muted-foreground">{talent.customProfession || "Career Explorer"}</p>

            {latestExperience && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {latestExperience.title || (latestExperience as any).position} at {latestExperience.company}
              </p>
            )}
            {latestEducation && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {latestEducation.degree || (latestEducation as any).field} · {latestEducation.institution}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {talent.country && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {talent.countryCode && <span>{getCountryFlag(talent.countryCode)}</span>}
                  {getCountryName(talent.country)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {talent.email}
              </span>
              {talent.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {talent.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completion */}
      <div className="mx-4 mb-4">
        <ProfileCompletionMeter talent={talent} variant="compact" />
      </div>

      {/* Content Sections */}
      <div className="space-y-3 mx-4">
        {/* About */}
        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <SectionHeader title="About" section="about" />
          </CardHeader>
          <CardContent>
            {talent.currentStatus ? (
              <p className="text-sm text-muted-foreground whitespace-pre-line">{talent.currentStatus}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Add a summary about yourself...</p>
            )}
          </CardContent>
        </Card>

        {/* Experience */}
        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <SectionHeader
              title="Experience"
              count={talent.experience?.length}
              section="experience"
              showEnhance
            />
          </CardHeader>
          <CardContent>
            {talent.experience && talent.experience.length > 0 ? (
              <div className="space-y-4">
                {talent.experience.map((exp, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="p-2 bg-muted rounded-xl h-fit mt-0.5">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{exp.title || (exp as any).position}</p>
                      <p className="text-xs text-muted-foreground">{exp.company}</p>
                      {(exp as any).startDate && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(exp as any).startDate} — {(exp as any).endDate || "Present"}
                        </p>
                      )}
                      {exp.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exp.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Add your work experience...</p>
            )}
          </CardContent>
        </Card>

        {/* Education */}
        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <SectionHeader title="Education" count={talent.education?.length} section="education" />
          </CardHeader>
          <CardContent>
            {talent.education && talent.education.length > 0 ? (
              <div className="space-y-4">
                {talent.education.map((edu, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="p-2 bg-muted rounded-xl h-fit mt-0.5">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{edu.degree || (edu as any).field}</p>
                      <p className="text-xs text-muted-foreground">{edu.institution}</p>
                      {((edu as any).startYear || (edu as any).endYear) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(edu as any).startYear} — {(edu as any).endYear || "Present"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Add your education...</p>
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <SectionHeader title="Skills" count={talent.skills?.length} section="skills" />
          </CardHeader>
          <CardContent>
            {talent.skills && talent.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {talent.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="rounded-lg">
                    {typeof skill === "string" ? skill : skill.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Add your skills...</p>
            )}
          </CardContent>
        </Card>

        {/* Honors & Awards */}
        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <SectionHeader title="Honors & Awards" count={talent.achievements?.length} section="achievements" />
          </CardHeader>
          <CardContent>
            {talent.achievements && talent.achievements.length > 0 ? (
              <div className="space-y-3">
                {talent.achievements.map((award: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="p-2 bg-muted rounded-xl h-fit mt-0.5">
                      <Award className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{award.title || award.name}</p>
                      {award.issuer && <p className="text-xs text-muted-foreground">{award.issuer}</p>}
                      {award.date && <p className="text-xs text-muted-foreground">{award.date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Add your honors & awards...</p>
            )}
          </CardContent>
        </Card>

        {/* Languages */}
        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <SectionHeader title="Languages" count={talent.languages?.length} section="languages" />
          </CardHeader>
          <CardContent>
            {talent.languages && talent.languages.length > 0 ? (
              <div className="space-y-2">
                {talent.languages.map((lang, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{lang.language}</span>
                    </div>
                    <Badge variant="outline" className="rounded-lg text-xs">
                      {lang.proficiency}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Add your languages...</p>
            )}
          </CardContent>
        </Card>
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
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowEnhanceDialog(false)} disabled={isEnhancing}>
              Cancel
            </Button>
            <Button className="flex-1 rounded-xl" onClick={handleEnhanceWithAI} disabled={isEnhancing}>
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
