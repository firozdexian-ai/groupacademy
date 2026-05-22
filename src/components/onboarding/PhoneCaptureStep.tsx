import { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { useTalent } from "@/hooks/useTalent";
import { findTalentByPhoneExceptId } from "@/domains/talent/repo/talentRepo";
import { trackOnboardingStep } from "@/lib/onboarding/telemetry";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";

interface Props {
  onContinue: () => void;
}

/**
 * Mandatory phone capture step.
 * Used for OAuth/legacy users who completed wizard onboarding but never set a phone.
 * Defaults to talent's existing country (no hard-coded country).
 */
export function PhoneCaptureStep({ onContinue }: Props) {
  const queryClient = useQueryClient();
  const { talent, updateTalent, refreshTalent } = useTalent();

  const [phone, setPhone] = useState("");
  // Default to talent's stored country if any; otherwise leave blank so the PhoneInput
  // shows the user's selection rather than presuming a region.
  const [countryCode, setCountryCode] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Hydrate from talent profile when it arrives.
  useEffect(() => {
    if (!talent) return;
    if (talent.phone) {
      const stripped = talent.phone.startsWith(talent.countryCode || "")
        ? talent.phone.slice((talent.countryCode || "").length)
        : talent.phone;
      setPhone(stripped);
    }
    if (talent.countryCode) setCountryCode(talent.countryCode);
    if (talent.country) setCountry(talent.country);
  }, [talent]);

  useEffect(() => {
    trackOnboardingStep("phone", "view");
    trackEvent("onboarding_phone_capture_mounted");
  }, []);

  const canContinue = useMemo(() => {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 6 && !!countryCode;
  }, [phone, countryCode]);

  async function handleContinue() {
    if (!canContinue || !talent?.id || isSaving) return;

    setIsSaving(true);
    const fullPhone = `${countryCode}${phone.replace(/\D/g, "")}`;
    trackEvent("onboarding_phone_save_requested", { countryCode });

    const toastId = toast.loading("Checking your phone number…");

    try {
      const existing = await findTalentByPhoneExceptId(fullPhone, talent.id);
      if (existing) {
        toast.error("This phone number is already on another account.", { id: toastId });
        trackEvent("onboarding_phone_duplicate_intercepted", { fullPhone });
        setIsSaving(false);
        return;
      }

      const ok = await updateTalent({
        phone: fullPhone,
        country,
        countryCode,
      });
      if (!ok) throw new Error("Could not save phone number.");

      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      await refreshTalent();

      trackOnboardingStep("phone", "next", { talentId: talent.id });
      trackEvent("onboarding_phone_save_success");

      toast.success("Phone number saved.", { id: toastId });
      onContinue();
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      trackError(msg, {
        component: "PhoneCaptureStep",
        action: "commit_onboarding_phone",
        talentId: talent?.id,
      });
      toast.error("Couldn't save your phone — please try again.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col px-4 py-6 max-w-md mx-auto w-full">
      <div className="mb-6 space-y-2 text-center w-full leading-none">
        <div className="mx-auto h-11 w-11 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center mb-3 shadow-inner">
          <Phone className="h-5 w-5 text-primary stroke-[2.2]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground/90 leading-none">
          Add your phone number
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground/80 leading-normal max-w-xs mx-auto pt-1.5">
          We'll use this so employers can reach you about jobs.
        </p>
      </div>

      <div className="w-full">
        <PhoneInput
          value={phone}
          countryCode={countryCode}
          disabled={isSaving}
          onValueChange={setPhone}
          onCountryCodeChange={(dialCode, iso) => {
            trackEvent("onboarding_phone_country_code_altered", { isoCode: iso });
            setCountryCode(dialCode);
            setCountry(iso);
          }}
          className="w-full h-11 rounded-xl border border-border/40 bg-background/50 text-foreground shadow-sm focus:ring-1 focus:ring-ring outline-none font-medium text-sm transition-all"
        />
      </div>

      <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-[max(env(safe-area-inset-bottom),12px)] w-full">
        <Button
          onClick={handleContinue}
          disabled={!canContinue || isSaving}
          type="button"
          className="w-full h-11 rounded-xl text-sm font-semibold shadow-md active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin stroke-[2.5] mr-2" />
              <span>Saving…</span>
            </>
          ) : (
            <>
              <span>Continue</span>
              <ArrowRight className="ml-1.5 h-4 w-4 shrink-0 stroke-[2.5]" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
