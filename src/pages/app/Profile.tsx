import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Edit2,
  Sparkles,
  Loader2,
  Settings,
  MapPin,
  Award,
  Languages,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Target,
} from "lucide-react";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileCompletionMeter } from "@/components/profile/ProfileCompletionMeter";
import { ProfileSectionEditor } from "@/components/profile/ProfileSectionEditor";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCountryFlag, getCountryName } from "@/lib/constants/countries";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: List Identity Node
 * High-fidelity orchestrator for career artifact management and neural profile synthesis.
 * 2026 Standard: Executive Logic geometry with reinforced AI handshake protocols.
 */

export default function Profile() {
  const navigate = useNavigate();
  const { talent, updateTalent, refreshTalent, isLoading: isTalentLoading } = useTalent();
  const [showEnhanceDialog, setShowEnhanceDialog] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [editingSection, setEditingSection] = useState<
    "about" | "experience" | "education" | "skills" | "achievements" | "languages" | null
  >(null);

  const handleSectionSave = useCallback(
    async (_section: string | null, data: any) => {
      try {
        await updateTalent(data);
        await refreshTalent();
        toast.success("Profile updated.");
      } catch {
        toast.error("Sync failed.");
      }
    },
    [updateTalent, refreshTalent],
  );

  if (isTalentLoading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary stroke-[1.5px]" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
          Syncing List Node...
        </p>
      </div>
    );

  if (!talent) return null;

  const initials = talent.fullName
    ? talent.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ID";

  const latestExperience = talent.experience?.[0];
  const latestEducation = talent.education?.[0];

  const handleEnhanceWithAI = async () => {
    if (!talent.experience?.length) {
      toast.error("Please add experience first.");
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
        toast.success("Descriptions enhanced.");
      }
    } catch (error) {
      toast.error("Generation timed out.");
    } finally {
      setIsEnhancing(false);
      setShowEnhanceDialog(false);
    }
  };

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
    <div className="flex items-center justify-between pb-2 border-b border-border/10 mb-4">
      <div className="flex items-center gap-3">
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary italic">{title}</h3>
        {count !== undefined && count > 0 && (
          <Badge
            variant="secondary"
            className="h-5 px-1.5 rounded-md text-[9px] font-black bg-muted/50 text-muted-foreground/60"
          >
            {count.toString().padStart(2, "0")}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showEnhance && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary hover:bg-primary/10 transition-all active:scale-90"
            onClick={() => setShowEnhanceDialog(true)}
            disabled={!talent.experience?.length}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted/50 transition-all active:scale-90"
          onClick={() => setEditingSection(section as any)}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto pb-40 animate-in fade-in duration-700">
      {/* Dynamic Command Header */}
      <header className="flex items-center justify-between px-6 py-6 sticky top-0 z-20 bg-background/60 backdrop-blur-xl border-b border-border/10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-10 w-10 hover:bg-primary/5 transition-all"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-xl font-black uppercase tracking-tighter italic">Identity List</h1>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                Verified Logic Sync v2.6
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl h-10 w-10 hover:bg-primary/5"
          onClick={() => navigate("/app/profile/edit")}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      {/* Hero Module: Visual Identity Artifact */}
      <div className="relative mb-8 px-6">
        <div className="rounded-[32px] overflow-hidden shadow-2xl relative">
          {talent.coverImageUrl ? (
            <img src={talent.coverImageUrl} alt="Cover" className="h-36 w-full object-cover grayscale-[0.3]" />
          ) : (
            <div className="h-36 bg-gradient-to-br from-primary via-blue-600 to-primary opacity-90" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        <div className="relative -mt-16 px-6">
          <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
            <CardContent className="p-8 pt-0">
              <div className="flex items-end justify-between -mt-10 mb-6">
                <Avatar className="h-28 w-28 ring-8 ring-background/10 shadow-2xl rounded-[32px]">
                  <AvatarImage src={talent.profilePhotoUrl || undefined} className="object-cover" />
                  <AvatarFallback className="text-3xl bg-primary text-primary-foreground font-black italic rounded-[32px]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-2xl h-11 px-6 border-2 font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary/5"
                  onClick={() => navigate("/app/profile/edit")}
                >
                  <Zap className="h-3.5 w-3.5 mr-2 text-primary" /> Recalibrate
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">
                    {talent.fullName}
                  </h2>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] italic">
                    {talent.customProfession || "CANDIDATE_EXPLORER"}
                  </p>
                </div>

                <div className="grid gap-2 border-t border-border/10 pt-4">
                  {latestExperience && (
                    <div className="flex items-center gap-3 text-[11px] font-medium italic text-foreground/80">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground/40" />
                      <span className="truncate">
                        {latestExperience.title} <span className="opacity-40 px-1">@</span> {latestExperience.company}
                      </span>
                    </div>
                  )}
                  {latestEducation && (
                    <div className="flex items-center gap-3 text-[11px] font-medium italic text-foreground/80">
                      <GraduationCap className="h-3.5 w-3.5 text-muted-foreground/40" />
                      <span className="truncate">
                        {latestEducation.degree || latestEducation.fieldOfStudy} · {latestEducation.institution}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 pt-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 border-t border-border/10">
                  {talent.country && (
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {talent.countryCode && (
                        <span className="text-base leading-none">{getCountryFlag(talent.countryCode)}</span>
                      )}
                      {getCountryName(talent.country)}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <Mail className="h-3 w-3" /> {talent.email}
                  </span>
                  {talent.phone && (
                    <span className="flex items-center gap-2">
                      <Phone className="h-3 w-3" /> {talent.phone}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Logic Progress HUD */}
      <div className="px-6 mb-10">
        <ProfileCompletionMeter talent={talent} variant="compact" />
      </div>

      {/* Artifact Viewport */}
      <div className="space-y-6 px-6">
        {/* About Node */}
        <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-xl">
          <CardHeader className="p-8 pb-4">
            <SectionHeader title="AI Summary" section="about" />
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="p-6 rounded-2xl bg-muted/10 border-2 border-dashed border-border/40 italic font-medium text-sm text-foreground/70 leading-relaxed selection:bg-primary/20">
              {talent.currentStatus || "Loading summary..."}
            </div>
          </CardContent>
        </Card>

        {/* Experience Ledger */}
        <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-xl">
          <CardHeader className="p-8 pb-4">
            <SectionHeader
              title="Professional Ledger"
              count={talent.experience?.length}
              section="experience"
              showEnhance
            />
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-8">
            {talent.experience?.length ? (
              talent.experience.map((exp, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="h-12 w-12 rounded-2xl bg-muted/50 border border-border/20 flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6">
                    <Briefcase className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <p className="font-black uppercase tracking-tight text-base leading-none italic">{exp.title}</p>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{exp.company}</p>
                    <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
                      {exp.startDate} — {exp.endDate || "PRESENT_NODE"}
                    </p>
                    {exp.description && (
                      <p className="text-xs font-medium text-foreground/60 leading-relaxed pt-2 line-clamp-3 italic">
                        "{exp.description}"
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[10px] font-black uppercase text-muted-foreground/30 italic py-10 text-center tracking-widest">
                Experience Artifacts Missing
              </p>
            )}
          </CardContent>
        </Card>

        {/* Logic Grid: Education & Skills */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Education */}
          <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4">
              <SectionHeader title="Academic Base" count={talent.education?.length} section="education" />
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              {talent.education?.length ? (
                talent.education.map((edu, i) => (
                  <div key={i} className="space-y-1.5">
                    <p className="font-black uppercase tracking-tighter text-sm italic">
                      {edu.degree || edu.fieldOfStudy}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase">{edu.institution}</p>
                  </div>
                ))
              ) : (
                <p className="text-[9px] font-black uppercase text-muted-foreground/20 italic">No Base Logic Sync'd</p>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4">
              <SectionHeader title="Skill Nodes" count={talent.skills?.length} section="skills" />
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="flex flex-wrap gap-2">
                {talent.skills?.length ? (
                  talent.skills.map((skill, i) => (
                    <Badge
                      key={i}
                      className="rounded-lg bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-2.5 py-1 tracking-widest"
                    >
                      {typeof skill === "string" ? skill : skill.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-[9px] font-black uppercase text-muted-foreground/20 italic">
                    No Logic Units Detected
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Honors Ledger */}
        <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-xl">
          <CardHeader className="p-8 pb-4">
            <SectionHeader title="Reward Artifacts" count={talent.achievements?.length} section="achievements" />
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-6">
            {talent.achievements?.length ? (
              talent.achievements.map((award: any, i: number) => (
                <div key={i} className="flex gap-4 items-center group">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5 text-amber-500/40" />
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-tight text-xs italic">{award.title || award.name}</p>
                    {award.issuer && (
                      <p className="text-[9px] font-bold text-muted-foreground/50 uppercase">{award.issuer}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[9px] font-black uppercase text-muted-foreground/20 italic">
                No High-Value Rewards Logged
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Synthesis Modal: AI Logic */}
      <Dialog open={showEnhanceDialog} onOpenChange={setShowEnhanceDialog}>
        <DialogContent className="rounded-[40px] border-2 border-border/40 bg-background/80 backdrop-blur-2xl p-10 max-w-md">
          <DialogHeader className="text-center">
            <div className="w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center mx-auto mb-6 rotate-3 border-2 border-primary/20">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
              Neural Enhancement
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40 mt-3 italic">
              Executing AI Synthesis on Professional Ledger Artifacts.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-10">
            <Button
              className="h-16 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-primary/30"
              onClick={handleEnhanceWithAI}
              disabled={isEnhancing}
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" /> Generating Logic...
                </>
              ) : (
                <>
                  <Target className="h-5 w-5 mr-3" /> Authorize Synthesis
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest"
              onClick={() => setShowEnhanceDialog(false)}
              disabled={isEnhancing}
            >
              Terminate Protocol
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProfileSectionEditor
        section={editingSection}
        onClose={() => setEditingSection(null)}
        onSave={handleSectionSave}
        talent={talent}
      />
    </div>
  );
}
