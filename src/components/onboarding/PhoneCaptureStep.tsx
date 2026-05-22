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
import { cn } from "@/lib/utils";

interface Props {
  onContinue: () => void;
}

/**
 * GroUp Academy: Identity Verification Phone Capture Component (PhoneCaptureStep)
 * Mandatory telephone validation step intercepting OAuth users to configure critical employer notification lines.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function PhoneCaptureStep({ onContinue }: Props) {
  const queryClient = useQueryClient();
  const { talent, updateTalent, refreshTalent } = useTalent();

  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+880");
  const [country, setCountry] = useState("BD");
  const [isSaving, setIsSaving] = useState(false);

  // Hydrate local screen buffers cleanly as soon as the underlying profile engine chunk loads
  useEffect(() => {
    if (talent) {
      if (talent.phone) {
        // Strip out prefixed country codes cleanly if present to fit input patterns
        const strippedPhoneBody = talent.phone.startsWith(talent.countryCode || "")
          ? talent.phone.slice((talent.countryCode || "").length)
          : talent.phone;
        setPhone(strippedPhoneBody);
      }
      if (talent.countryCode) setCountryCode(talent.countryCode);
      if (talent.country) setCountry(talent.country);
    }
  }, [talent]);

  // Monitor identity credential wizard view progressions via analytical parameters
  useEffect(() => {
    trackOnboardingStep("phone", "view");
    trackEvent("onboarding_phone_capture_mounted");
  }, []);

  // Compute dynamic string input lengths processing checks recursively
  const canContinue = useMemo(() => {
    const sanitizedNumericDigitsOnlyStr = phone.replace(/\D/g, "");
    return sanitizedNumericDigitsOnlyStr.length >= 6;
  }, [phone]);

  async function handleContinue() {
    if (!canContinue || !talent?.id || isSaving) return;

    setIsSaving(true);
    let isMounted = true;

    const absoluteConcatenatedFullPhoneStr = `${countryCode}${phone.replace(/\D/g, "")}`;
    trackEvent("onboarding_phone_save_requested", { countryCodeTarget: countryCode });

    const toastId = toast.loading("Verifying communication channel unique index boundaries...");

    try {
      // Cheap Unique Pre-Check Constraint Boundary Pass ahead of database write updates
      const existingTalentRowMatch = await findTalentByPhoneExceptId(absoluteConcatenatedFullPhoneStr, talent.id);

      if (existingTalentRowMatch) {
        toast.error(
          "Uniqueness Exception: This phone parameter is already associated with another active identity folder.",
          { id: toastId },
        );
        trackEvent("onboarding_phone_duplicate_intercepted", { fullPhone: absoluteConcatenatedFullPhoneStr });
        if (isMounted) setIsSaving(false);
        return;
      }

      // Commit configuration changes down to user metadata tables
      const isProfilePersistOk = await updateTalent({
        phone: absoluteConcatenatedFullPhoneStr,
        country,
        countryCode,
      });

      if (!isProfilePersistOk) {
        throw new Error("Core database profile layout update transaction declined.");
      }

      // Automated Efficiency: Synchronize query client state records instantly to cascade indicator balances
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      await refreshTalent();

      trackOnboardingStep("phone", "next", { talentId: talent.id });
      trackEvent("onboarding_phone_save_success");

      toast.success("Communication channels calibrated successfully.", { id: toastId });

      if (isMounted) {
        onContinue();
      }
    } catch (globalCatchExceptionErr: any) {
      const errorMsgParsed =
        globalCatchExceptionErr instanceof Error ? globalCatchExceptionErr.message : String(globalCatchExceptionErr);

      trackError(errorMsgParsed, {
        component: "PhoneCaptureStep",
        action: "commit_onboarding_phone_ingestion_pipeline",
        talentId: talent?.id,
      });

      toast.error(`Ecosystem write verification error: ${errorMsgParsed}`, { id: toastId });
    } finally {
      if (isMounted) {
        setIsSaving(false);
      }
    }
  }

  return (
    <div className="flex flex-col px-4 py-6 max-w-md mx-auto w-full antialiased text-left select-none sm:select-text transform-gpu animate-in fade-in duration-300">
      {/* HUD HEADER COVER SECTOR */}
      <div className="mb-6 space-y-2 text-center select-none w-full leading-none">
        <div className="mx-auto h-11 w-11 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center mb-3 shadow-inner">
          <Phone className="h-5 w-5 text-primary stroke-[2.2] animate-pulse" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground/90 uppercase tracking-wide leading-none">
          Verify Communications Route
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground/80 leading-normal max-w-xs mx-auto pt-1.5 italic">
          We use this parameter channel to confirm your unique credentials and forward alerts when response elements
          settle inside your folder tracker.
        </p>
      </div>

      {/* PHONE INPUT RIG MECHANISM INTERFACE */}
      <div className="w-full font-semibold text-sm tracking-tight border-b border-border/5 pb-4">
        <PhoneInput
          value={phone}
          countryCode={countryCode}
          disabled={isSaving}
          onValueChange={(nextPhoneInputValueString) => setPhone(nextPhoneInputValueString)}
          onCountryCodeChange={(nextCountryDialCodeStr, nextCountryIsoCodeStr) => {
            trackEvent("onboarding_phone_country_code_altered", { isoCode: nextCountryIsoCodeStr });
            setCountryCode(nextCountryDialCodeStr);
            setCountry(nextCountryIsoCodeStr);
          }}
          className="w-full h-11 rounded-xl border border-border/40 bg-background/50 text-foreground shadow-sm focus:ring-1 focus:ring-ring outline-none font-medium text-sm transition-all"
        />
      </div>

      {/* DISPATCH CONTROLS STRIP TIMELINE COMPONENT PANEL */}
      <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-[max(env(safe-area-inset-bottom),12px)] select-none w-full shrink-0">
        <Button
          onClick={handleContinue}
          disabled={!canContinue || isSaving}
          type="button"
          className="w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
              <span>Checking Registry Parameters…</span>
            </>
          ) : (
            <>
              <span>Lock Verification & Continue Pathway</span>
              <ArrowRight className="ml-1.5 h-4 w-4 shrink-0 stroke-[2.5]" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
