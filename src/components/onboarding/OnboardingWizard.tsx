import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

export function OnboardingWizard({
  onComplete,
  funnelOverride,
}: {
  onComplete: () => void;
  funnelOverride?: FunnelParams;
}) {
  const [searchParams] = useSearchParams();
  const funnelParamsRef = useRef<FunnelParams>({});

  // Capture funnel params once on mount (or accept an explicit override from a parent)
  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [step, setStep] = useState(1);
  const [country, setCountry] = useState<Country | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingPhase, setSubmittingPhase] = useState<string>("");

  // Step 1: Countries
  const countriesQ = useQuery({
    queryKey: ["onboarding-countries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gtm_countries")
        .select("id, iso2, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Country[];
    },
  });

  // Step 2: Career stages (with academy_id)
  const stagesQ = useQuery({
    queryKey: ["onboarding-stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("career_stages")
        .select("id, name, slug, academy_id")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return (data ?? []) as Stage[];
    },
  });

  // Step 3: Institutions (universities)
  const institutionsQ = useQuery({
    queryKey: ["onboarding-institutions", country?.name],
    enabled: step >= 3,
    queryFn: async () => {
      let q = supabase
        .from("institutions")
        .select("id, name, country")
        .eq("type", "university")
        .order("name")
        .limit(1000);
      if (country?.name) q = q.ilike("country", country.name);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Institution[];
    },
  });

  // Step 4: Schools (filtered by selected stage's academy)
  const schoolsQ = useQuery({
    queryKey: ["onboarding-schools", stage?.academy_id],
    enabled: step >= 4,
    queryFn: async () => {
      let q = supabase
        .from("schools")
        .select("id, name, slug, description, icon, academy_id")
        .eq("is_active", true)
        .order("display_order");
      // Strict filter when stage maps to an academy; fallback to all active schools otherwise
      if (stage?.academy_id) q = q.eq("academy_id", stage.academy_id);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as School[];
    },
  });

  // Reset downstream selections when stage changes (academy filter shifts)
  useEffect(() => {
    setSchool(null);
  }, [stage?.academy_id]);

  const progress = (step / STEPS.length) * 100;

  const canAdvance = useMemo(() => {
    if (step === 1) return !!country;
    if (step === 2) return !!stage;
    if (step === 3) return !!institution;
    if (step === 4) return !!school;
    return false;
  }, [step, country, stage, institution, school]);

  const provisionOrGetInstance = async (institutionName: string): Promise<ProvisionResult | null> => {
    // 1. Try canonical RPC first
    try {
      const { data, error } = await supabase.rpc("provision_or_get_instance" as never, {
        _cluster_geo_id: institutionName,
        _funnel: funnelParamsRef.current as unknown as object,
      } as never);
      if (!error && data) {
        const id =
          typeof data === "string"
            ? data
            : (data as { instance_id?: string })?.instance_id ?? null;
        if (id) return { instance_id: id, created: false };
      }
    } catch {
      // fall through to manual fallback
    }

    // 2. Lookup existing instance for this geo cluster
    const { data: existing } = await supabase
      .from("workforce_hired_instances")
      .select("id")
      .eq("cluster_geo_id", institutionName)
      .limit(1)
      .maybeSingle();
    if (existing?.id) return { instance_id: existing.id, created: false };

    // 3. Provision a new B2C instance bound to this user as tenant
    const { data: tplRow } = await supabase
      .from("workforce_master_templates")
      .select("id")
      .eq("agent_key", "b2c_campus_ambassador")
      .eq("is_active", true)
      .maybeSingle();

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!tplRow?.id || !userId) return null;

    const { data: created, error: insertErr } = await supabase
      .from("workforce_hired_instances")
      .insert({
        template_id: tplRow.id,
        tenant_id: userId,
        cluster_geo_id: institutionName,
        name_override: `${institutionName} Campus Ambassador`,
        status: "active",
      })
      .select("id")
      .single();
    if (insertErr || !created?.id) return null;
    return { instance_id: created.id, created: true };
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep((s) => s + 1);
      return;
    }
    if (!country || !stage || !institution || !school) return;

    setSubmitting(true);
    const startedAt = Date.now();
    try {
      // --- Phase 1: persist selections to talents ---
      setSubmittingPhase("Saving your profile…");
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user?.id) throw new Error("Not signed in");
      const userId = authData.user.id;

      const { error: updateErr } = await supabase
        .from("talents")
        .update({
          country_id: country.id,
          country_code: country.iso2,
          country: country.name,
          career_stage_id: stage.id,
          institution_id: institution.id,
          institution: institution.name,
          school_id: school.id,
          onboarding_step: 4,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (updateErr) throw updateErr;

      // --- Phase 2: provision/get the campus instance ---
      setSubmittingPhase(`Connecting to ${institution.name} Campus Agent…`);
      const provisioned = await provisionOrGetInstance(institution.name);

      // --- Phase 3: fire-and-forget seed so the first prompt has context ---
      if (provisioned?.instance_id) {
        setSubmittingPhase("Almost ready…");
        try {
          await supabase.functions.invoke("agent-runtime", {
            body: {
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
            },
          });
        } catch (e) {
          // non-blocking
          // eslint-disable-next-line no-console
          console.warn("[OnboardingWizard] agent-runtime seed failed", e);
        }
      }

      // Loading floor: avoid jarring flash
      const elapsed = Date.now() - startedAt;
      if (elapsed < 600) await new Promise((r) => setTimeout(r, 600 - elapsed));

      toast.success(`Connected to ${institution.name} AI Campus Ambassador`, {
        description: `Your ${school.name} pathway is ready.`,
        icon: <Sparkles className="h-4 w-4 text-blue-500" />,
      });
      onComplete();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[OnboardingWizard] Submission failed", err);
      toast.error("Couldn't finish setup", {
        description: "Please try again — your selections are saved.",
      });
    } finally {
      setSubmitting(false);
      setSubmittingPhase("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 font-sans animate-in fade-in duration-500">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center gap-4 px-6 py-5 md:px-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">
            <Zap className="h-5 w-5 fill-blue-500 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900">Set up your account</div>
            <div className="text-xs text-slate-400">
              Step {step} of {STEPS.length} · {STEPS[step - 1].label}
            </div>
          </div>
          <div className="hidden w-64 md:block">
            <Progress value={progress} className="h-2 bg-slate-100" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-6 pb-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = step > s.id;
            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center gap-2 transition-all duration-300",
                  active ? "scale-105 opacity-100" : "opacity-60",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border transition-colors",
                    active && "border-blue-500 bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.45)]",
                    done && "border-emerald-500 bg-emerald-500 text-white",
                    !active && !done && "border-slate-200 bg-white text-slate-400",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span
                  className={cn(
                    "hidden text-xs font-semibold sm:block",
                    active ? "text-blue-600" : done ? "text-emerald-600" : "text-slate-400",
                  )}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && <div className="ml-2 h-[2px] w-6 bg-slate-200" />}
              </div>
            );
          })}
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex h-full w-full max-w-5xl flex-col p-4 md:p-8">
          <div key={step} className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {step === 1 && (
              <SectionHeader
                title="Where are you based?"
                subtitle="We'll tailor opportunities, salaries and academies to your country."
              />
            )}
            {step === 2 && (
              <SectionHeader
                title="What stage are you at?"
                subtitle="This helps us route you to the right academy and AI coach."
              />
            )}
            {step === 3 && (
              <SectionHeader
                title="What's your alma mater?"
                subtitle="We'll connect you with your campus ambassador and alumni network."
              />
            )}
            {step === 4 && (
              <SectionHeader
                title="Which professional school fits you?"
                subtitle={
                  stage?.academy_id
                    ? `Curated for ${stage?.name} talent.`
                    : "Pick the school closest to your professional path."
                }
              />
            )}

            <div className="mt-6">
              {step === 1 && (
                <CardGrid loading={countriesQ.isLoading}>
                  {(countriesQ.data ?? []).map((c) => (
                    <SelectableCard
                      key={c.id}
                      selected={country?.id === c.id}
                      onClick={() => setCountry(c)}
                      title={c.name}
                      subtitle={c.iso2}
                      emoji={isoToEmoji(c.iso2)}
                    />
                  ))}
                  {!countriesQ.isLoading && (countriesQ.data ?? []).length === 0 && (
                    <EmptyState message="No countries available yet." />
                  )}
                </CardGrid>
              )}

              {step === 2 && (
                <CardGrid loading={stagesQ.isLoading}>
                  {(stagesQ.data ?? []).map((s) => (
                    <SelectableCard
                      key={s.id}
                      selected={stage?.id === s.id}
                      onClick={() => setStage(s)}
                      title={s.name}
                      subtitle={s.academy_id ? "Academy mapped" : "General"}
                      icon={<Briefcase className="h-5 w-5 text-blue-500" />}
                    />
                  ))}
                </CardGrid>
              )}

              {step === 3 && (
                <div className="mx-auto w-full max-w-xl">
                  <Popover open={comboOpen} onOpenChange={setComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboOpen}
                        className="h-14 w-full justify-between rounded-2xl border-slate-200 bg-white px-5 text-left text-base font-medium shadow-sm hover:bg-slate-50"
                      >
                        <span className={cn("truncate", !institution && "text-slate-400")}>
                          {institution?.name ?? "Search your university…"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command shouldFilter>
                        <CommandInput placeholder="Type to search…" />
                        <CommandList>
                          {institutionsQ.isLoading ? (
                            <div className="flex items-center justify-center p-6 text-sm text-slate-500">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading universities…
                            </div>
                          ) : (
                            <>
                              <CommandEmpty>No universities found.</CommandEmpty>
                              <CommandGroup>
                                {(institutionsQ.data ?? []).map((i) => (
                                  <CommandItem
                                    key={i.id}
                                    value={i.name}
                                    onSelect={() => {
                                      setInstitution(i);
                                      setComboOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        institution?.id === i.id ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                    <span className="flex-1 truncate">{i.name}</span>
                                    {i.country && (
                                      <span className="ml-2 text-xs text-slate-400">
                                        {i.country}
                                      </span>
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="mt-3 text-center text-xs text-slate-400">
                    Can't find yours? Pick the closest match — you can update it later.
                  </p>
                </div>
              )}

              {step === 4 && (
                <CardGrid loading={schoolsQ.isLoading}>
                  {(schoolsQ.data ?? []).map((s) => (
                    <SelectableCard
                      key={s.id}
                      selected={school?.id === s.id}
                      onClick={() => setSchool(s)}
                      title={s.name}
                      subtitle={s.description ?? undefined}
                      emoji={s.icon ?? undefined}
                      icon={!s.icon ? <Building2 className="h-5 w-5 text-blue-500" /> : undefined}
                    />
                  ))}
                  {!schoolsQ.isLoading && (schoolsQ.data ?? []).length === 0 && (
                    <EmptyState message="No schools mapped yet for this academy." />
                  )}
                </CardGrid>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="sticky bottom-0 mt-8 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1 || submitting}
              className="rounded-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {submitting ? (
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                Connecting you to the {institution?.name} AI Campus Ambassador…
              </div>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canAdvance}
                className="rounded-full bg-blue-600 px-6 hover:bg-blue-700"
              >
                {step === 4 ? "Finish & Connect" : "Continue"}
                <ArrowRight className="ml-2 h-4 w-4" />
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
    <div className="text-center">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-slate-500 md:text-base">{subtitle}</p>
    </div>
  );
}

function CardGrid({ children, loading }: { children: React.ReactNode; loading?: boolean }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">{children}</div>
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
    <button type="button" onClick={onClick} className="text-left">
      <Card
        className={cn(
          "group relative h-full cursor-pointer rounded-2xl border-2 p-4 transition-all duration-200",
          selected
            ? "border-blue-500 bg-blue-50/50 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"
            : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md",
        )}
      >
        {selected && (
          <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
            <Check className="h-3 w-3" />
          </div>
        )}
        <div className="mb-2 text-2xl">
          {emoji ? <span>{emoji}</span> : icon}
        </div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {subtitle && (
          <div className="mt-1 line-clamp-2 text-xs text-slate-500">{subtitle}</div>
        )}
      </Card>
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function isoToEmoji(iso2?: string) {
  if (!iso2 || iso2.length !== 2) return "🌍";
  const A = 0x1f1e6;
  return String.fromCodePoint(...iso2.toUpperCase().split("").map((c) => A + c.charCodeAt(0) - 65));
}
