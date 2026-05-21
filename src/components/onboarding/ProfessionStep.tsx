import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listActiveProfessionCategoriesFull, listProfessionalRolesByCategory } from "@/domains/profile/repo/profileRepo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTalent } from "@/hooks/useTalent";
import { trackOnboardingStep } from "@/lib/onboarding/telemetry";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { ArrowRight, Loader2, Search, Briefcase, Filter } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ProfessionStepProps {
  onContinue: () => void;
}

interface CategoryRow {
  id: string;
  name: string;
}
interface RoleRow {
  id: string;
  name: string;
  profession_category_id: string;
}

/**
 * GroUp Academy: Onboarding Professional Taxonomy Calibration Selector (ProfessionStep)
 * An authoritative operational workflow node calculating candidate discipline categories and assigning custom career coaches.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ProfessionStep({ onContinue }: ProfessionStepProps) {
  const queryClient = useQueryClient();
  const { talent, updateTalent, refreshTalent } = useTalent();

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [catQuery, setCatQuery] = useState("");
  const [roleQuery, setRoleQuery] = useState("");

  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [customProfession, setCustomProfession] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const [isLoadingCats, setIsLoadingCats] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state values cleanly as soon as the underlying profile context payload maps load
  useEffect(() => {
    if (talent) {
      if (talent.professionCategoryId) setSelectedCat(talent.professionCategoryId);
      if (talent.professionalRoleId) setSelectedRole(talent.professionalRoleId);
      if (talent.customProfession) {
        setCustomProfession(talent.customProfession);
        setShowCustom(true);
      }
    }
  }, [talent]);

  // Monitor taxonomy selection view transitions via tracking vectors
  useEffect(() => {
    trackOnboardingStep("profession", "view");
    trackEvent("onboarding_profession_step_mounted");

    let isMounted = true;
    setIsLoadingCats(true);

    const fetchAuthoritativeProfessionCategories = async () => {
      try {
        const data = await listActiveProfessionCategoriesFull();

        if (isMounted) {
          setCategories(data || []);
          setIsLoadingCats(false);
        }
      } catch (err) {
        trackError(err, { component: "ProfessionStep", action: "fetch_profession_categories_api" });
        if (isMounted) setIsLoadingCats(false);
      }
    };

    fetchAuthoritativeProfessionCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  // Isolate sub-role lookup hooks defensively against layout state changes
  useEffect(() => {
    if (!selectedCat) {
      setRoles([]);
      return;
    }

    let isMounted = true;
    setIsLoadingRoles(true);
    trackEvent("onboarding_profession_roles_requested", { categoryId: selectedCat });

    const fetchAuthoritativeProfessionalRoles = async () => {
      try {
        const data = await listProfessionalRolesByCategory(selectedCat);

        if (isMounted) {
          setRoles(data || []);
          setIsLoadingRoles(false);
        }
      } catch (err) {
        trackError(err, {
          component: "ProfessionStep",
          action: "fetch_professional_roles_api",
          categoryId: selectedCat,
        });
        if (isMounted) setIsLoadingRoles(false);
      }
    };

    fetchAuthoritativeProfessionalRoles();

    return () => {
      isMounted = false;
    };
  }, [selectedCat]);

  const filteredCats = useMemo(() => {
    const standardizedQuery = catQuery.trim().toLowerCase();
    return standardizedQuery ? categories.filter((c) => c.name.toLowerCase().includes(standardizedQuery)) : categories;
  }, [catQuery, categories]);

  const filteredRoles = useMemo(() => {
    const standardizedQuery = roleQuery.trim().toLowerCase();
    return standardizedQuery ? roles.filter((r) => r.name.toLowerCase().includes(standardizedQuery)) : roles;
  }, [roleQuery, roles]);

  const canContinue = useMemo(() => {
    if (showCustom) {
      return customProfession.trim().length >= 2;
    }
    return !!selectedCat && !!selectedRole;
  }, [showCustom, customProfession, selectedCat, selectedRole]);

  async function handleContinue() {
    if (!canContinue || isSaving) return;

    setIsSaving(true);
    let isMounted = true;

    trackEvent("onboarding_profession_save_requested", { isCustomTrack: showCustom });
    const toastId = toast.loading("Configuring domain professional classifications...");

    try {
      const updatePayload: Record<string, any> = showCustom
        ? { customProfession: customProfession.trim(), professionCategoryId: null, professionalRoleId: null }
        : { professionCategoryId: selectedCat, professionalRoleId: selectedRole, customProfession: null };

      const isWriteSuccessful = await updateTalent(updatePayload);
      if (!isWriteSuccessful) throw new Error("Core profile database update declined.");

      // Bind an automated system Career Coach as soon as the baseline taxonomy resolves
      if (talent?.id && !showCustom && selectedCat) {
        try {
          const { error: rpcError } = await supabase.rpc("assign_career_coach", { _talent_id: talent.id });
          if (rpcError) throw rpcError;
          trackEvent("onboarding_career_coach_assigned_success");
        } catch (coachErr) {
          trackError(coachErr, { component: "ProfessionStep", action: "assign_career_coach_rpc", talentId: talent.id });
        }
      }

      // Automated Efficiency: Synchronize cache layers globally across dashboard columns instantly
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      await refreshTalent();

      trackOnboardingStep("profession", "next", { custom: showCustom });
      trackEvent("onboarding_profession_save_success");

      toast.success("Professional track configuration compiled.", { id: toastId });

      if (isMounted) {
        onContinue();
      }
    } catch (globalCatchErr: any) {
      const parsedExceptionMsg = globalCatchErr instanceof Error ? globalCatchErr.message : String(globalCatchErr);

      trackError(parsedExceptionMsg, {
        component: "ProfessionStep",
        action: "commit_onboarding_profession_pipeline",
        talentId: talent?.id,
      });

      toast.error(`Ecosystem write sync error: ${parsedExceptionMsg}`, { id: toastId });
    } finally {
      if (isMounted) {
        setIsSaving(false);
      }
    }
  }

  return (
    <div className="flex flex-col px-4 py-6 max-w-xl mx-auto w-full antialiased text-left select-none sm:select-text transform-gpu animate-in fade-in duration-300">
      {/* HUD HEADER TITLE CAPTION */}
      <div className="mb-6 space-y-1.5 text-center select-none w-full leading-none">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground/90 uppercase tracking-wide">
          Define Your Specialization
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground/80 leading-normal max-w-sm mx-auto">
          Specify your vocational category and role tier so our routing maps can match targeted career coaches and
          interview segments.
        </p>
      </div>

      {!showCustom ? (
        <>
          {/* CATEGORY FIELD STREAM LOOKUP SECTOR */}
          <section className="mb-4 w-full min-w-0">
            <div className="flex items-center gap-2 mb-2 pl-0.5 select-none text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 leading-none">
              <Filter className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
              <span>Core Discipline Domain</span>
            </div>

            <div className="relative mb-2 select-none w-full font-semibold text-sm">
              <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 stroke-[2.5]" />
              <Input
                value={catQuery}
                disabled={isSaving}
                onChange={(e) => setCatQuery(e.target.value)}
                placeholder="Query available disciplines matrix (e.g. Technology, Engineering)…"
                className="pl-10 h-11 rounded-xl border border-border/40 bg-background/50 focus-visible:ring-1 focus-visible:ring-ring text-sm tracking-tight text-foreground shadow-sm transition-all"
              />
            </div>

            {isLoadingCats ? (
              <div className="py-8 flex items-center justify-center select-none w-full">
                <Loader2 className="h-5 w-5 animate-spin text-primary stroke-[2.5]" />
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-border/40 bg-background divide-y divide-border/10 shadow-inner w-full font-bold text-xs">
                {filteredCats.slice(0, 80).map((categoryItem) => {
                  const isCatSelected = selectedCat === categoryItem.id;
                  return (
                    <button
                      key={categoryItem.id}
                      type="button"
                      disabled={isSaving}
                      onClick={() => {
                        trackEvent("onboarding_category_selected", { id: categoryItem.id });
                        setSelectedCat(categoryItem.id);
                        setSelectedRole(null);
                        setRoleQuery("");
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 text-xs sm:text-sm hover:bg-muted/10 flex items-center justify-between transition-colors transform-gpu font-medium cursor-pointer leading-none",
                        isCatSelected && "bg-primary/5 border-l-2 border-primary text-primary font-bold shadow-sm",
                      )}
                    >
                      <span className="truncate text-ellipsis pr-2 block select-text">{categoryItem.name}</span>
                      {isCatSelected && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 h-4 bg-primary/10 border-transparent text-primary tracking-wide font-black uppercase rounded leading-none"
                        >
                          Selected
                        </Badge>
                      )}
                    </button>
                  );
                })}
                {filteredCats.length === 0 && (
                  <p className="p-4 text-xs font-semibold text-muted-foreground/60 text-center select-none italic">
                    No matching operational fields found inside registry bounds.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* DYNAMIC SPECIFIC SUB-ROLE LOOKUP SECTOR */}
          {selectedCat && (
            <section className="mb-4 w-full min-w-0 animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2 mb-2 pl-0.5 select-none text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 leading-none">
                <Briefcase className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
                <span>Target Functional Role Position</span>
              </div>

              <div className="relative mb-2 select-none w-full font-semibold text-sm">
                <Briefcase className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 stroke-[2.2]" />
                <Input
                  value={roleQuery}
                  disabled={isSaving}
                  onChange={(e) => setRoleQuery(e.target.value)}
                  placeholder="Query target title allocations (e.g. Fullstack Architect, Data Analyst)…"
                  className="pl-10 h-11 rounded-xl border border-border/40 bg-background/50 focus-visible:ring-1 focus-visible:ring-ring text-sm tracking-tight text-foreground shadow-sm transition-all"
                />
              </div>

              {isLoadingRoles ? (
                <div className="py-8 flex items-center justify-center select-none w-full">
                  <Loader2 className="h-5 w-5 animate-spin text-primary stroke-[2.5]" />
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-border/40 bg-background divide-y divide-border/10 shadow-inner w-full font-bold text-xs">
                  {filteredRoles.slice(0, 100).map((roleItem) => {
                    const isRoleSelected = selectedRole === roleItem.id;
                    return (
                      <button
                        key={roleItem.id}
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                          trackEvent("onboarding_role_selected", { id: roleItem.id });
                          setSelectedRole(roleItem.id);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 text-xs sm:text-sm hover:bg-muted/10 flex items-center justify-between transition-colors transform-gpu font-medium cursor-pointer leading-none",
                          isRoleSelected && "bg-primary/5 border-l-2 border-primary text-primary font-bold shadow-sm",
                        )}
                      >
                        <span className="truncate text-ellipsis pr-2 block select-text">{roleItem.name}</span>
                        {isRoleSelected && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 h-4 bg-primary/10 border-transparent text-primary tracking-wide font-black uppercase rounded leading-none"
                          >
                            Active
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                  {filteredRoles.length === 0 && (
                    <p className="p-4 text-xs font-semibold text-muted-foreground/60 text-center select-none italic">
                      No target functional positions conform to this criteria filter query.
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Fallback override trigger to manually inject roles */}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              trackEvent("onboarding_profession_custom_toggle_clicked");
              setShowCustom(true);
            }}
            className="text-xs font-bold text-muted-foreground/70 hover:text-primary underline underline-offset-4 self-start select-none cursor-pointer transition-colors leading-none outline-none pb-2"
          >
            My specialized professional discipline is not cataloged
          </button>
        </>
      ) : (
        /* CUSTOM FALLBACK INPUT INJECTION FIELD */
        <section className="mb-5 w-full min-w-0 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 mb-2 pl-0.5 select-none text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 leading-none">
            <Briefcase className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
            <span>Inject Custom Operational Vocation</span>
          </div>

          <Input
            value={customProfession}
            disabled={isSaving}
            onChange={(e) => setCustomProfession(e.target.value)}
            placeholder="E.g. Quantitative Marine Biologist, Aerospace Consultant…"
            maxLength={80}
            className="h-11 rounded-xl border border-border/40 bg-background/50 focus-visible:ring-1 focus-visible:ring-ring text-sm tracking-tight text-foreground shadow-sm transition-all"
          />

          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              trackEvent("onboarding_profession_list_toggle_clicked");
              setShowCustom(false);
            }}
            className="mt-3 text-xs font-bold text-muted-foreground/70 hover:text-primary underline underline-offset-4 block text-left select-none cursor-pointer transition-colors leading-none outline-none"
          >
            Return back to systemic mapping directory options
          </button>
        </section>
      )}

      {/* DISPATCH CONTROLS ACCESS COMPONENT PANEL BUTTON */}
      <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-[max(env(safe-area-inset-bottom),12px)] select-none w-full shrink-0">
        <Button
          onClick={handleContinue}
          disabled={!canContinue || isSaving}
          type="button"
          className="w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
              <span>Locking Specialization Indices…</span>
            </>
          ) : (
            <>
              <span>Lock Track Profile & Continue Pathway</span>
              <ArrowRight className="ml-1.5 h-4 w-4 shrink-0 stroke-[2.5]" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
