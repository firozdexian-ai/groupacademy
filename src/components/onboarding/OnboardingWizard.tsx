import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  ChevronsUpDown,
  GraduationCap,
  Loader2,
  MapPin,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import {
  listActiveCountries,
  listActiveCareerStages,
  searchOnboardingInstitutions,
  listActiveSchools,
} from "@/domains/profile/repo/profileRepo";
import {
  findWorkforceInstanceByCluster,
  getActiveWorkforceTemplateByKey,
  insertWorkforceInstanceReturningId,
} from "@/domains/workforce/repo/workforceRepo";
import { patchTalentByUser } from "@/domains/talent/repo/talentRepo";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { agentRuntime } from "@/domains/agents/api/agentsApi";

type Country = { id: string; iso2: string; name: string };
type Stage = { id: string; name: string; slug: string; academy_id: string | null };
type Institution = { id: string; name: string; country: string | null };
type School = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  academy_id: string | null;
};

const STEPS = [
  { id: 1, label: "Country", icon: MapPin },
  { id: 2, label: "Career Stage", icon: Briefcase },
  { id: 3, label: "Alma Mater", icon: GraduationCap },
  { id: 4, label: "Profession", icon: Building2 },
];

type FunnelParams = Record<string, string>;
const FUNNEL_KEYS = ["job_id", "ref", "utm_source", "utm_medium", "utm_campaign", "gig_id", "program_id"] as const;

type ProvisionResult = { instance_id: string; created: boolean };

/**
 * GroUp Academy: Multi-Stage Personalization Onboarding Wizard (OnboardingWizard)
 * An authoritative system layout managing user segmentation, geo clusters, and automated campus agent allocations.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function OnboardingWizard({
  onComplete,
  funnelOverride,
  preAuth = false,
}: {
  onComplete: () => void;
  funnelOverride?: FunnelParams;
  /** When true, selections are stashed in sessionStorage instead of written to the DB. */
  preAuth?: boolean;
}) {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const funnelParamsRef = useRef<FunnelParams>({});

  // 1. Thread Hardening Gate: Protect against asynchronous execution writes over disconnected components
  const isMountedRef = useRef<boolean>(true);

  // Capture funnel attributes once on context setup mount pass safely
  useEffect(() => {
    isMountedRef.current = true;

    if (funnelOverride && Object.keys(funnelOverride).length > 0) {
      funnelParamsRef.current = { ...funnelOverride };
      return;
    }
    const captured: FunnelParams = {};
    for (const key of FUNNEL_KEYS) {
      const value = searchParams.get(key);
      if (value) captured[key] = value;
    }
    funnelParamsRef.current = captured;

    trackEvent("onboarding_wizard_mounted", { funnelKeysLogged: Object.keys(captured) });

    return () => {
      isMountedRef.current = false;
    };
  }, [funnelOverride, searchParams]);

  const [step, setStep] = useState(1);
  const [country, setCountry] = useState<Country | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [instQuery, setInstQuery] = useState("");
  const [debouncedInstQuery, setDebouncedInstQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittingPhase, setSubmittingPhase] = useState<string>("");

  // Debounce the institution search input (200ms) so we don't fire on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedInstQuery(instQuery.trim()), 200);
    return () => clearTimeout(t);
  }, [instQuery]);

  // Step 1 Ingress: Fetch authorized market operational countries
  const countriesQ = useQuery({
    queryKey: ["onboarding-countries"],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      return (await listActiveCountries()) as Country[];
    },
  });

  // Step 2 Ingress: Fetch structural candidate operational career stages
  const stagesQ = useQuery({
    queryKey: ["onboarding-stages"],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      return (await listActiveCareerStages()) as Stage[];
    },
  });

  // Step 3 Ingress: Server-side institution search.
  // Country acts as a *soft* filter — if zero matches with country, we re-query globally.
  const institutionsQ = useQuery({
    queryKey: ["onboarding-institutions", country?.name ?? "", debouncedInstQuery],
    enabled: step >= 3,
    staleTime: 60 * 1000,
    queryFn: async () => {
      return (await searchOnboardingInstitutions({
        query: debouncedInstQuery,
        countryName: country?.name ?? null,
      })) as Institution[];
    },
  });

  // Step 4 Ingress: Fetch professional sub-schools mapped via segment classifications
  const schoolsQ = useQuery({
    queryKey: ["onboarding-schools", stage?.academy_id],
    enabled: step >= 4,
    staleTime: 15 * 60 * 1000,
    queryFn: async () => {
      return (await listActiveSchools(stage?.academy_id ?? null)) as School[];
    },
  });

  // Instrument continuous analytical tracking maps over internal server sub-query exceptions
  useEffect(() => {
    const primaryWizardFetchError = countriesQ.error || stagesQ.error || institutionsQ.error || schoolsQ.error;
    if (primaryWizardFetchError) {
      trackError(primaryWizardFetchError, {
        component: "OnboardingWizard",
        action: "fetch_onboarding_wizard_lookups",
      });
    }
  }, [countriesQ.error, stagesQ.error, institutionsQ.error, schoolsQ.error]);

  // Reset downstream metrics sequentially when academy clusters drift
  useEffect(() => {
    setSchool(null);
  }, [stage?.academy_id]);

  const progress = useMemo(() => (step / STEPS.length) * 100, [step]);

  const canAdvance = useMemo(() => {
    if (step === 1) return !!country;
    if (step === 2) return !!stage;
    if (step === 3) return !!institution;
    if (step === 4) return !!school;
    return false;
  }, [step, country, stage, institution, school]);

  const provisionOrGetInstance = async (institutionName: string): Promise<ProvisionResult | null> => {
    try {
      const { data, error } = await supabase.rpc(
        "provision_or_get_instance" as never,
        {
          _cluster_geo_id: institutionName,
          _funnel: funnelParamsRef.current as unknown as object,
        } as never,
      );
      if (!error && data) {
        const id = typeof data === "string" ? data : ((data as { instance_id?: string })?.instance_id ?? null);
        if (id) return { instance_id: id, created: false };
      }
    } catch (rpcErr) {
      trackError(rpcErr, { component: "OnboardingWizard", action: "provisionOrGetInstance_rpc_fallback" });
    }

    const existing = await findWorkforceInstanceByCluster(institutionName);
    if (existing?.id) return { instance_id: existing.id, created: false };

    const tplRow = await getActiveWorkforceTemplateByKey("b2c_campus_ambassador");

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!tplRow?.id || !userId) return null;

    const createdId = await insertWorkforceInstanceReturningId({
      template_id: tplRow.id,
      tenant_id: userId,
      cluster_geo_id: institutionName,
      name_override: `${institutionName} Campus Ambassador`,
      status: "active",
    });
    if (!createdId) return null;
    return { instance_id: createdId, created: true };
  };

  const handleNext = async () => {
    if (step < 4) {
      trackEvent("onboarding_wizard_step_advanced", { currentStep: step, nextStep: step + 1 });
      setStep((s) => s + 1);
      return;
    }
    if (!country || !stage || !institution || !school) return;

    // Pre-auth mode: stash selections in sessionStorage and hand control back
    // to the host page (which will swap in the auth panel).
    if (preAuth) {
      try {
        sessionStorage.setItem(
          "pending_onboarding",
          JSON.stringify({
            country,
            stage,
            institution,
            school,
            funnelParams: funnelParamsRef.current,
            stashedAt: Date.now(),
          }),
        );
      } catch {
        /* sessionStorage may be unavailable in privacy mode — ignore. */
      }
      trackEvent("onboarding_wizard_preauth_stashed");
      onComplete();
      return;
    }

    setSubmitting(true);
    const startedAt = Date.now();
    trackEvent("onboarding_wizard_submission_started");

    try {
      setSubmittingPhase("Saving your profile parameters…");
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user?.id) throw new Error("Authentication index token lost. Please log in.");
      const userId = authData.user.id;

      const isFreeform = institution.id.startsWith("freeform:");
      await patchTalentByUser(userId, {
        country_id: country.id,
        country_code: country.iso2,
        country: country.name,
        career_stage_id: stage.id,
        institution_id: isFreeform ? null : institution.id,
        institution: institution.name,
        school_id: school.id,
        onboarding_step: 4,
        onboarding_completed_at: new Date().toISOString(),
      });

      setSubmittingPhase(`Connecting to ${institution.name} Campus Agent…`);
      const provisioned = await provisionOrGetInstance(institution.name);

      if (provisioned?.instance_id) {
        setSubmittingPhase("Almost ready…");
        try {
          await agentRuntime({
            instance_id: provisioned.instance_id,
            subject_kind: "talent",
            subject_id: userId,
            silent_seed: true,
            seed_context: {
              funnelParams: funnelParamsRef.current,
              institution: institution.name,
              school: school.slug,
              stage: stage.slug,
            },
          });
        } catch (e) {
          trackError(e, { component: "OnboardingWizard", action: "agent_runtime_seed_silent_invoke" });
        }
      }

      // Smooth Animation Floor Base Guard: Defeat violent layout flickers
      const elapsed = Date.now() - startedAt;
      if (elapsed < 600) await new Promise((r) => setTimeout(r, 600 - elapsed));

      if (isMountedRef.current) {
        toast.success(`Connected to ${institution.name} AI Campus Ambassador`, {
          description: `Your ${school.name} specialization pathway is configured and live.`,
          icon: <Sparkles className="h-4 w-4 text-blue-500 stroke-[2.2]" />,
        });

        trackEvent("onboarding_wizard_completed_success");

        // Invalidate profile query client states to trigger fresh workspace hydration rolls
        await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
        await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

        onComplete();
      }
    } catch (err: any) {
      const errorStringParsed = err instanceof Error ? err.message : String(err);

      trackError(errorStringParsed, {
        component: "OnboardingWizard",
        action: "commit_final_onboarding_wizard_data_api",
      });

      toast.error("Ecosystem sync error: Setup execution timed out.", {
        description: "Please attempt confirmation again — your chosen options remain active.",
      });
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
        setSubmittingPhase("");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background font-sans text-left select-none sm:select-text transform-gpu animate-in fade-in duration-300">
      {/* HUD HEADER COVER BAR METRIC PLOTS ROW */}
      <header className="border-b border-border/40 bg-card/90 backdrop-blur-xl shrink-0 select-none w-full">
        <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 shadow-inner">
              <Zap className="h-5 w-5 fill-primary/10 text-primary stroke-[2.2] animate-pulse" />
            </div>
            <div className="min-w-0 flex flex-col justify-center leading-none">
              <h1 className="text-sm font-bold text-foreground/90 uppercase tracking-wide leading-none">
                Initialize Trajectory Index
              </h1>
              <span className="text-[11px] font-bold text-muted-foreground/60 block leading-none pt-1">
                Stage {step} of {STEPS.length} &bull; {STEPS[step - 1].label} Analysis
              </span>
            </div>
          </div>
          <div className="hidden w-64 md:block select-none leading-none">
            <Progress value={progress} className="h-2 bg-muted rounded-full shadow-inner" />
          </div>
        </div>

        {/* PROGRESS STEPPER DOTS LAYER HEADER */}
        <div className="flex items-center justify-center gap-5 pb-4 max-w-4xl mx-auto w-full px-4 border-t border-border/5 pt-3.5">
          {STEPS.map((stepConfig, index) => {
            const Icon = stepConfig.icon || MapPin;
            const isStepActive = step === stepConfig.id;
            const isStepDone = step > stepConfig.id;

            return (
              <div
                key={stepConfig.id}
                className={cn(
                  "flex items-center gap-2 transition-all duration-300 select-none leading-none",
                  isStepActive ? "scale-102 opacity-100 font-bold" : "opacity-50 font-medium",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-mono font-bold transition-all shadow-sm leading-none shrink-0",
                    isStepActive &&
                      "border-primary bg-primary text-primary-foreground shadow-[0_0_10px_rgba(59,130,246,0.35)]",
                    isStepDone && "border-emerald-500 bg-emerald-500 text-white",
                    !isStepActive && !isStepDone && "border-border/40 bg-background text-muted-foreground/60",
                  )}
                >
                  {isStepDone ? (
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  ) : (
                    <Icon className="h-3.5 w-3.5 stroke-[2.2]" />
                  )}
                </div>
                <span
                  className={cn(
                    "hidden text-[11px] uppercase tracking-wider sm:block leading-none",
                    isStepActive ? "text-primary font-black" : "text-muted-foreground/60",
                  )}
                >
                  {stepConfig.label}
                </span>
                {index < STEPS.length - 1 && <div className="ml-2 h-[1px] w-6 bg-border/20 shrink-0 hidden sm:block" />}
              </div>
            );
          })}
        </div>
      </header>

      {/* HUD CONTAINER BODY SECTION FOR INDIVIDUAL DISPLAY TILES */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="mx-auto flex h-full w-full max-w-5xl flex-col p-4 py-8 md:p-8 justify-between">
          <div key={step} className="flex-1 animate-in fade-in slide-in-from-bottom-1 duration-200 w-full">
            {step === 1 && (
              <SectionHeader
                title="Determine Base Geographical Region"
                subtitle="We match dynamic localized criteria indices, local baseline compensations, and regional operational academies based on your country parameters."
              />
            )}
            {step === 2 && (
              <SectionHeader
                title="Identify Professional Persona Tier"
                subtitle="Calibrate target experience curves so we can route alignment matrices to the correct organizational cluster and customized AI counselor."
              />
            )}
            {step === 3 && (
              <SectionHeader
                title="Specify Academic Institutional Core"
                subtitle="Synchronize your workspace ledger configuration to activate localized peer connections, network circles, and campus ambassador lines."
              />
            )}
            {step === 4 && (
              <SectionHeader
                title="Target Specific Specialization Sub-School"
                subtitle={
                  stage?.academy_id
                    ? `Curated specific instructional tracks optimized for ${stage?.name} candidate metrics.`
                    : "Select the authoritative professional discipline matching your immediate path projection."
                }
              />
            )}

            <div className="mt-6 w-full min-w-0">
              {step === 1 && (
                <CardGrid loading={countriesQ.isLoading}>
                  {(countriesQ.data ?? []).map((countryItem) => (
                    <SelectableCard
                      key={countryItem.id}
                      selected={country?.id === countryItem.id}
                      onClick={() => setCountry(countryItem)}
                      title={countryItem.name}
                      subtitle={countryItem.iso2}
                      emoji={isoToEmoji(countryItem.iso2)}
                    />
                  ))}
                  {!countriesQ.isLoading && (countriesQ.data ?? []).length === 0 && (
                    <EmptyState message="No baseline geographical clusters registered inside the active database map grid rows." />
                  )}
                </CardGrid>
              )}

              {step === 2 && (
                <CardGrid loading={stagesQ.isLoading}>
                  {(stagesQ.data ?? []).map((stageItem) => (
                    <SelectableCard
                      key={stageItem.id}
                      selected={stage?.id === stageItem.id}
                      onClick={() => setStage(stageItem)}
                      title={stageItem.name}
                      subtitle={stageItem.academy_id ? "Institutional Track Mapped" : "General Horizon Mapping"}
                      icon={<Briefcase className="h-4.5 w-4.5 text-primary stroke-[2.2]" />}
                    />
                  ))}
                </CardGrid>
              )}

              {step === 3 && (
                <div className="mx-auto w-full max-w-xl animate-in zoom-in-99 duration-200 text-left font-bold text-xs tracking-tight">
                  <Popover open={comboOpen} onOpenChange={setComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        type="button"
                        aria-expanded={comboOpen}
                        className="h-14 w-full justify-between rounded-xl border border-border/40 bg-background px-4 text-left text-sm font-bold tracking-tight shadow-sm hover:bg-muted/10 outline-none focus:ring-1 focus:ring-ring select-none"
                      >
                        <span className={cn("truncate text-ellipsis", !institution && "text-muted-foreground/50")}>
                          {institution?.name ?? "Search academic university ledger matrix…"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground/50 stroke-[2.2]" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0 rounded-xl border border-border/40 bg-background shadow-2xl overflow-hidden font-semibold text-xs"
                      align="start"
                    >
                      <Command shouldFilter={false}>
                        <CommandInput
                          value={instQuery}
                          onValueChange={setInstQuery}
                          placeholder="Type your university name…"
                          className="text-xs h-10 border-none font-bold outline-none"
                        />
                        <CommandList className="max-h-64 font-bold text-xs select-none">
                          {institutionsQ.isLoading ? (
                            <div className="p-2 space-y-1.5">
                              {[0, 1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className="h-8 rounded-md bg-muted/40 animate-pulse"
                                  style={{ animationDelay: `${i * 60}ms` }}
                                />
                              ))}
                            </div>
                          ) : (
                            <>
                              <CommandEmpty className="p-4 text-xs font-semibold text-muted-foreground text-center">
                                No match. Try a shorter name, or add it below.
                              </CommandEmpty>
                              <CommandGroup className="font-bold text-xs p-1">
                                {(institutionsQ.data ?? []).map((instItem) => (
                                  <CommandItem
                                    key={instItem.id}
                                    value={instItem.name}
                                    onSelect={() => {
                                      trackEvent("onboarding_institution_node_selected", { name: instItem.name });
                                      setInstitution(instItem);
                                      setComboOpen(false);
                                    }}
                                    className="cursor-pointer font-bold text-xs rounded-lg py-2 flex items-center gap-2"
                                  >
                                    <Check
                                      className={cn(
                                        "h-4 w-4 stroke-[2.5] text-primary shrink-0",
                                        institution?.id === instItem.id ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                    <span className="flex-1 truncate text-ellipsis select-text selection:bg-primary/10">
                                      {instItem.name}
                                    </span>
                                    {instItem.country && (
                                      <Badge
                                        variant="outline"
                                        className="ml-2 text-[9px] font-extrabold uppercase px-1.5 h-4 bg-muted/60 border-border/20 text-muted-foreground shrink-0 leading-none rounded"
                                      >
                                        {instItem.country}
                                      </Badge>
                                    )}
                                  </CommandItem>
                                ))}
                                {instQuery.trim().length >= 2 && (
                                  <CommandItem
                                    value={`__add__${instQuery}`}
                                    onSelect={() => {
                                      const name = instQuery.trim();
                                      if (!name) return;
                                      trackEvent("onboarding_institution_freeform_added", { name });
                                      setInstitution({
                                        id: `freeform:${name}`,
                                        name,
                                        country: country?.name ?? null,
                                      });
                                      setComboOpen(false);
                                    }}
                                    className="cursor-pointer font-bold text-xs rounded-lg py-2 flex items-center gap-2 text-primary"
                                  >
                                    <span className="flex-1 truncate">
                                      Add &ldquo;{instQuery.trim()}&rdquo; as my university
                                    </span>
                                  </CommandItem>
                                )}
                              </CommandGroup>
                            </>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="mt-3.5 text-center text-[11px] font-semibold text-muted-foreground/50 italic leading-normal select-none">
                    Can&apos;t trace your absolute cluster node? Match closest approximate operational index bounds
                    &mdash; profile maps remain variable later.
                  </p>
                </div>
              )}

              {step === 4 && (
                <CardGrid loading={schoolsQ.isLoading}>
                  {(schoolsQ.data ?? []).map((schoolItem) => (
                    <SelectableCard
                      key={schoolItem.id}
                      selected={school?.id === schoolItem.id}
                      onClick={() => setSchool(schoolItem)}
                      title={schoolItem.name}
                      subtitle={schoolItem.description ?? undefined}
                      emoji={schoolItem.icon ?? undefined}
                      icon={
                        !schoolItem.icon ? <Building2 className="h-4.5 w-4.5 text-primary stroke-[2.2]" /> : undefined
                      }
                    />
                  ))}
                  {!schoolsQ.isLoading && (schoolsQ.data ?? []).length === 0 && (
                    <EmptyState message="No vocational sub-school structures mapped for this active academy pipeline group allocation." />
                  )}
                </CardGrid>
              )}
            </div>
          </div>

          {/* HUD COMMAND TRANSACTION CONFIG NAVIGATION FOOTER ACTIONS STRIP */}
          <div className="sticky bottom-0 mt-10 flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-background/95 p-4 shadow-sm backdrop-blur select-none w-full shrink-0">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                const prevStepNum = Math.max(1, step - 1);
                trackEvent("onboarding_wizard_step_backtrack_clicked", { fromStep: step, toStep: prevStepNum });
                setStep(prevStepNum);
              }}
              disabled={step === 1 || submitting}
              className="rounded-xl h-9 px-4 font-bold uppercase text-[10px] tracking-wide text-muted-foreground hover:bg-accent shrink-0 cursor-pointer"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4 stroke-[2.5]" />
              <span>Back</span>
            </Button>

            {submitting ? (
              <div className="flex items-center gap-2.5 text-xs font-bold text-muted-foreground/80 tabular-nums animate-pulse pl-1 flex-1 justify-end truncate">
                <Loader2 className="h-4 w-4 animate-spin text-primary stroke-[2.5] shrink-0" />
                <span className="truncate text-ellipsis block italic">
                  {submittingPhase || `Connecting you to the ${institution?.name || "Target Cluster"} Campus Hub…`}
                </span>
              </div>
            ) : (
              <Button
                onClick={handleNext}
                type="button"
                disabled={!canAdvance}
                className="rounded-xl h-9 px-4 font-extrabold uppercase text-[10px] tracking-wider gap-1 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                <span>{step === 4 ? "Finalize Synchronization & Link" : "Continue Ingress"}</span>
                <ArrowRight className="ml-1 h-4 w-4 shrink-0 stroke-[2.5]" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center select-none w-full leading-none mb-2">
      <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground/90 uppercase tracking-wide leading-none">
        {title}
      </h2>
      <p className="mt-2 text-[11px] font-semibold text-muted-foreground/70 leading-normal max-w-xl mx-auto italic">
        {subtitle}
      </p>
    </div>
  );
}

function CardGrid({ children, loading }: { children: React.ReactNode; loading?: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 w-full select-none">
        <Loader2 className="h-5 w-5 animate-spin text-primary stroke-[2.5]" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 w-full min-w-0 font-bold text-xs tracking-tight">
      {children}
    </div>
  );
}

function SelectableCard({
  selected,
  onClick,
  title,
  subtitle,
  emoji,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  emoji?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xl block transform-gpu active:scale-[0.995]"
    >
      <Card
        className={cn(
          "group relative h-full cursor-pointer rounded-xl border p-4 transition-all duration-300 shadow-sm flex flex-col justify-start w-full min-w-0 leading-none overflow-hidden",
          selected
            ? "border-primary bg-primary/5 shadow-inner"
            : "border-border/40 bg-card/60 backdrop-blur-md hover:border-border/80 hover:shadow-md hover:-translate-y-0.5",
        )}
      >
        {selected && (
          <div className="absolute right-2 top-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm select-none">
            <Check className="h-3 w-3 stroke-[2.5]" />
          </div>
        )}
        <div className="mb-3 text-xl leading-none select-none h-6 flex items-center shrink-0">
          {emoji ? <span className="leading-none">{emoji}</span> : icon}
        </div>
        <div className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-tight line-clamp-1 truncate select-text pr-2 w-full">
          {title}
        </div>
        {subtitle && (
          <div className="mt-1.5 line-clamp-2 text-ellipsis text-[10px] font-semibold text-muted-foreground/60 leading-normal italic select-text pr-1 w-full">
            {subtitle}
          </div>
        )}
      </Card>
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full rounded-xl border border-dashed border-border/60 bg-background/50 p-10 text-center text-xs font-semibold text-muted-foreground/60 leading-normal max-w-md mx-auto select-none italic">
      {message}
    </div>
  );
}

function isoToEmoji(iso2?: string) {
  if (!iso2 || iso2.length !== 2) return "🌍";
  const BASE_UNICODE_OFFSET = 0x1f1e6;
  return String.fromCodePoint(
    ...iso2
      .toUpperCase()
      .split("")
      .map((c) => BASE_UNICODE_OFFSET + c.charCodeAt(0) - 65),
  );
}
