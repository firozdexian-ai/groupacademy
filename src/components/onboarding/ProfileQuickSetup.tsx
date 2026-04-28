import { useState, useEffect } from "react";
import { Camera, User, Loader2, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Identity Synthesis Node (ProfileQuickSetup)
 * CTO Reference: Authoritative node for profile initialization and photo sync.
 */

interface ProfileQuickSetupProps {
  onContinue: () => void;
  onSkip: () => void;
}

const STATUS_NODES = [
  { value: "student", label: "ACADEMIC_TRACK", sub: "Currently enrolled" },
  { value: "fresh_graduate", label: "ENTRY_VECTOR", sub: "Recent grad" },
  { value: "job_seeking", label: "ACTIVE_RECRUIT", sub: "Ready for deployment" },
  { value: "working", label: "ESTABLISHED_OPS", sub: "Working professional" },
];

export function ProfileQuickSetup({ onContinue, onSkip }: ProfileQuickSetupProps) {
  const { talent, updateTalent } = useTalent();
  const [professions, setProfessions] = useState<any[]>([]);
  const [selectedProfession, setSelectedProfession] = useState<string>(talent?.professionCategoryId || "");
  const [currentStatus, setCurrentStatus] = useState<string>(talent?.currentStatus || "");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(talent?.profilePhotoUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfessionRegistry();
  }, []);

  async function fetchProfessionRegistry() {
    const { data } = await supabase
      .from("profession_categories")
      .select("id, name")
      .eq("is_active", true)
      .order("display_order");
    if (data) setProfessions(data);
  }

  async function handlePhotoIngress(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !talent?.id) return;

    if (!file.type.startsWith("image/")) return toast.error("PROTOCOL_ERROR: Invalid image format");
    if (file.size > 5 * 1024 * 1024) return toast.error("DATA_LIMIT: File must be under 5MB");

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${talent.id}/profile_v3.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-uploads")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("portfolio-uploads").getPublicUrl(filePath);

      setProfilePhoto(publicUrl);
      toast.success("IDENTITY_IMAGE_SYNCED");
    } catch (error) {
      toast.error("SYNC_FAULT");
    } finally {
      setIsUploading(false);
    }
  }

  async function finalizeSetup() {
    setIsSaving(true);
    try {
      const payload: any = {};
      if (selectedProfession) payload.professionCategoryId = selectedProfession;
      if (currentStatus) payload.currentStatus = currentStatus;
      if (profilePhoto) payload.profilePhotoUrl = profilePhoto;

      if (Object.keys(payload).length > 0) {
        await updateTalent(payload);
      }
      onContinue();
    } catch (error) {
      toast.error("COMMIT_FAULT");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-lg mx-auto text-left animate-in fade-in duration-700">
      <div className="mb-10 space-y-2 text-center">
        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground leading-none">
          Initialize_Identity
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground italic opacity-60">
          Sync professional artifacts for global matching
        </p>
      </div>

      {/* COMPONENT: VISUAL_ID_HANGER */}
      <div className="mb-8 w-full">
        <div className="flex flex-col items-center p-6 rounded-[32px] bg-primary/5 border-2 border-primary/20 shadow-inner relative overflow-hidden">
          <Zap className="absolute -top-4 -right-4 h-24 w-24 text-primary opacity-5 rotate-12" />

          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">
              Recruiter_Signal_Priority
            </span>
          </div>

          <div className="relative mb-4 group">
            <div className="w-32 h-32 rounded-[40px] bg-muted flex items-center justify-center overflow-hidden border-4 border-background shadow-2xl transition-transform duration-500 group-hover:scale-105">
              {profilePhoto ? (
                <img src={profilePhoto} alt="SYNC_ID" className="w-full h-full object-cover" />
              ) : (
                <User className="h-14 w-14 text-muted-foreground/30" />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary rounded-2xl flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-all shadow-xl active:scale-90">
              {isUploading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoIngress}
                disabled={isUploading}
              />
            </label>
          </div>

          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground italic opacity-60">
            {profilePhoto ? "NODE_VERIFIED" : "Awaiting_Visual_Ingress"}
          </p>
        </div>
      </div>

      {/* FORM: TRAJECTORY_MAPPING */}
      <div className="w-full space-y-8">
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground ml-1">
            Primary_Trajectory
          </Label>
          <Select value={selectedProfession} onValueChange={setSelectedProfession}>
            <SelectTrigger className="h-14 bg-background/50 border-2 rounded-2xl font-bold italic shadow-sm focus:ring-primary/20">
              <SelectValue placeholder="Initialize selection..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-2">
              {professions.map((p) => (
                <SelectItem key={p.id} value={p.id} className="font-bold italic uppercase py-3">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground ml-1">
            Status_Registry
          </Label>
          <RadioGroup value={currentStatus} onValueChange={setCurrentStatus} className="grid grid-cols-1 gap-3">
            {STATUS_NODES.map((option) => (
              <div
                key={option.value}
                onClick={() => setCurrentStatus(option.value)}
                className={cn(
                  "group flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-500 cursor-pointer",
                  currentStatus === option.value
                    ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
                    : "border-border/40 hover:border-primary/20 bg-card/50",
                )}
              >
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase italic tracking-tighter">{option.label}</span>
                  <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">
                    {option.sub}
                  </span>
                </div>
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className={cn(
                    "h-5 w-5 border-2",
                    currentStatus === option.value ? "bg-primary border-primary text-white" : "border-muted",
                  )}
                />
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      {/* FOOTER: ACTION_BAR */}
      <div className="flex flex-col w-full gap-4 mt-12 pt-6 border-t-2 border-border/10">
        <Button
          size="xl"
          onClick={finalizeSetup}
          disabled={isSaving}
          className="w-full h-16 rounded-[24px] font-black uppercase italic tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary),0.2)] hover:shadow-primary/40 transition-all active:scale-95 gap-3"
        >
          {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
          VERIFY_AND_COMMENCE
        </Button>
        <Button
          variant="ghost"
          onClick={onSkip}
          className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          AUTHORIZE_SYNC_SKIP
        </Button>
      </div>
    </div>
  );
}
