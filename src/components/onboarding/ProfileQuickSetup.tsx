import { useState, useEffect } from "react";
import { Camera, User, Loader2, Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileQuickSetupProps {
  onContinue: () => void;
  onSkip: () => void;
}

const STATUS_NODES = [
  { value: "student", label: "Student", sub: "Currently enrolled in studies" },
  { value: "fresh_graduate", label: "Fresh Graduate", sub: "Recently completed studies" },
  { value: "job_seeking", label: "Actively Looking", sub: "Ready for immediate roles" },
  { value: "working", label: "Employed", sub: "Currently working professional" },
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

    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image too large — keep it under 5MB.");

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
      toast.success("Profile photo uploaded.");
    } catch (error) {
      toast.error("Upload failed. Please try again.");
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
      toast.error("Couldn't save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-xl mx-auto text-left w-full animate-in fade-in duration-700">
      <div className="mb-12 space-y-3 text-center">
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-tight">
          A bit about you
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Tell us your career focus and where you're at right now.
        </p>
      </div>

      {/* COMPONENT: VISUAL_ID_HANGER */}
      <div className="mb-10 w-full">
        <div className="flex flex-col items-center p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>

          <div className="flex items-center gap-3 mb-8 relative z-10">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Profile photo
            </span>
          </div>

          <div className="relative mb-6 group z-10">
            <div className="w-36 h-36 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-md transition-transform duration-500 group-hover:scale-105">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-16 w-16 text-slate-300" />
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-all shadow-lg active:scale-95 border-4 border-white">
              {isUploading ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
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

          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {profilePhoto ? (
              <span className="text-emerald-500 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3"/> Photo uploaded</span>
            ) : "Add a clear, professional photo"}
          </p>
        </div>
      </div>

      {/* FORM: TRAJECTORY_MAPPING */}
      <div className="w-full space-y-10">
        <div className="space-y-4">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">
            Career track
          </Label>
          <Select value={selectedProfession} onValueChange={setSelectedProfession}>
            <SelectTrigger className="h-14 bg-white border-slate-200 rounded-2xl font-bold text-slate-900 shadow-sm focus:ring-blue-500/20">
              <SelectValue placeholder="Pick your main focus…" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
              {professions.map((p) => (
                <SelectItem key={p.id} value={p.id} className="font-bold text-sm py-3 text-slate-700">
                  {p.name.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">
            Current status
          </Label>
          <RadioGroup value={currentStatus} onValueChange={setCurrentStatus} className="grid grid-cols-1 gap-3">
            {STATUS_NODES.map((option) => (
              <div
                key={option.value}
                onClick={() => setCurrentStatus(option.value)}
                className={cn(
                  "group flex items-center justify-between p-5 rounded-[24px] border transition-all duration-300 cursor-pointer",
                  currentStatus === option.value
                    ? "border-blue-500 bg-blue-50 shadow-sm scale-[1.02]"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50",
                )}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-black uppercase tracking-tight text-slate-900">{option.label}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {option.sub}
                  </span>
                </div>
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className={cn(
                    "h-6 w-6 border-2",
                    currentStatus === option.value ? "bg-blue-500 border-blue-500 text-white" : "border-slate-300",
                  )}
                />
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      {/* FOOTER: ACTION_BAR */}
      <div className="flex flex-col w-full gap-4 mt-12 pt-8 border-t border-slate-200">
        <Button
          size="lg"
          onClick={finalizeSetup}
          disabled={isSaving}
          className="w-full h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-sm gap-3"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save and continue
          {!isSaving && <ArrowRight className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          onClick={onSkip}
          className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors h-12 rounded-full"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}