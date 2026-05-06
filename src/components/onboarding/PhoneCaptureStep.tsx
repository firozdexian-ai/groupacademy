import { useState } from "react";
import { ArrowRight, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { useTalent } from "@/hooks/useTalent";
import { supabase } from "@/integrations/supabase/client";
import { trackOnboardingStep } from "@/lib/onboarding/telemetry";
import { toast } from "sonner";

interface Props {
  onContinue: () => void;
}

/**
 * Mandatory phone-capture for OAuth users (Google sign-in skips phone in our
 * classic signup). Only mounted when `talent.phone` is empty.
 */
export function PhoneCaptureStep({ onContinue }: Props) {
  const { talent, updateTalent } = useTalent();
  const [phone, setPhone] = useState(talent?.phone ?? "");
  const [countryCode, setCountryCode] = useState(talent?.countryCode ?? "+880");
  const [country, setCountry] = useState(talent?.country ?? "BD");
  const [isSaving, setIsSaving] = useState(false);

  const canContinue = phone.replace(/\D/g, "").length >= 6;

  async function handleContinue() {
    if (!canContinue || !talent?.id) return;
    setIsSaving(true);
    const fullPhone = `${countryCode}${phone}`;
    try {
      // Cheap pre-check — phone uniqueness is enforced at app-level.
      const { data: existing } = await supabase
        .from("talents")
        .select("id")
        .eq("phone", fullPhone)
        .neq("id", talent.id)
        .maybeSingle();
      if (existing) {
        toast.error("This phone is already in use on another account.");
        setIsSaving(false);
        return;
      }
      const ok = await updateTalent({ phone: fullPhone, country, countryCode });
      if (!ok) throw new Error("save failed");
      trackOnboardingStep("phone", "next", { talentId: talent.id });
      onContinue();
    } catch {
      toast.error("Couldn't save your phone. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col px-4 py-6 max-w-md mx-auto w-full animate-in fade-in duration-500">
      <div className="mb-6 space-y-2 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-2">
          <Phone className="h-6 w-6 text-blue-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Add your phone number</h2>
        <p className="text-sm text-slate-500">
          We use it to verify your account and notify you when an employer responds. Required to continue.
        </p>
      </div>

      <PhoneInput
        value={phone}
        countryCode={countryCode}
        onValueChange={setPhone}
        onCountryCodeChange={(cc, c) => {
          setCountryCode(cc);
          setCountry(c);
        }}
      />

      <div className="sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-6 pb-[max(env(safe-area-inset-bottom),12px)]">
        <Button
          onClick={handleContinue}
          disabled={!canContinue || isSaving}
          className="w-full h-12 rounded-xl text-base"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
