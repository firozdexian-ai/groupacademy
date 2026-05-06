import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, Search, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTalent } from "@/hooks/useTalent";
import { trackOnboardingStep } from "@/lib/onboarding/telemetry";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfessionStepProps {
  onContinue: () => void;
}

interface CategoryRow { id: string; name: string }
interface RoleRow { id: string; name: string; profession_category_id: string }

export function ProfessionStep({ onContinue }: ProfessionStepProps) {
  const { talent, updateTalent } = useTalent();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [catQuery, setCatQuery] = useState("");
  const [roleQuery, setRoleQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(talent?.professionCategoryId ?? null);
  const [selectedRole, setSelectedRole] = useState<string | null>(talent?.professionalRoleId ?? null);
  const [customProfession, setCustomProfession] = useState(talent?.customProfession ?? "");
  const [showCustom, setShowCustom] = useState(false);
  const [isLoadingCats, setIsLoadingCats] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    trackOnboardingStep("profession", "view");
    (async () => {
      const { data } = await supabase
        .from("profession_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      setCategories(data ?? []);
      setIsLoadingCats(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedCat) { setRoles([]); return; }
    setIsLoadingRoles(true);
    (async () => {
      const { data } = await supabase
        .from("professional_roles")
        .select("id, name, profession_category_id")
        .eq("profession_category_id", selectedCat)
        .eq("is_active", true)
        .order("name");
      setRoles(data ?? []);
      setIsLoadingRoles(false);
    })();
  }, [selectedCat]);

  const filteredCats = useMemo(() => {
    const q = catQuery.trim().toLowerCase();
    return q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories;
  }, [catQuery, categories]);

  const filteredRoles = useMemo(() => {
    const q = roleQuery.trim().toLowerCase();
    return q ? roles.filter((r) => r.name.toLowerCase().includes(q)) : roles;
  }, [roleQuery, roles]);

  const canContinue = showCustom
    ? customProfession.trim().length >= 2
    : !!selectedCat && !!selectedRole;

  async function handleContinue() {
    if (!canContinue) return;
    setIsSaving(true);
    try {
      const payload: any = showCustom
        ? { customProfession: customProfession.trim(), professionCategoryId: null, professionalRoleId: null }
        : { professionCategoryId: selectedCat, professionalRoleId: selectedRole, customProfession: null };
      const ok = await updateTalent(payload);
      if (!ok) throw new Error("save failed");
      trackOnboardingStep("profession", "next", { custom: showCustom });
      onContinue();
    } catch {
      toast.error("Couldn't save your profession. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col px-4 py-6 max-w-xl mx-auto w-full animate-in fade-in duration-500">
      <div className="mb-6 space-y-2 text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">What do you do?</h2>
        <p className="text-sm text-slate-500">Pick your field and role — we'll match coaches and jobs to it.</p>
      </div>

      {!showCustom ? (
        <>
          <section className="mb-5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 block">Field</label>
            <div className="relative mb-2">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={catQuery}
                onChange={(e) => setCatQuery(e.target.value)}
                placeholder="Search fields…"
                className="pl-9 h-11 rounded-xl"
              />
            </div>
            {isLoadingCats ? (
              <div className="py-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                {filteredCats.slice(0, 80).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setSelectedCat(c.id); setSelectedRole(null); setRoleQuery(""); }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between",
                      selectedCat === c.id && "bg-blue-50 text-blue-700 font-semibold",
                    )}
                  >
                    <span>{c.name}</span>
                    {selectedCat === c.id && <span className="text-xs">Selected</span>}
                  </button>
                ))}
                {filteredCats.length === 0 && (
                  <div className="p-4 text-sm text-slate-500 text-center">No matches.</div>
                )}
              </div>
            )}
          </section>

          {selectedCat && (
            <section className="mb-5 animate-in fade-in slide-in-from-top-1 duration-300">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 block">Role</label>
              <div className="relative mb-2">
                <Briefcase className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={roleQuery}
                  onChange={(e) => setRoleQuery(e.target.value)}
                  placeholder="Search roles…"
                  className="pl-9 h-11 rounded-xl"
                />
              </div>
              {isLoadingRoles ? (
                <div className="py-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                  {filteredRoles.slice(0, 100).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id)}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50",
                        selectedRole === r.id && "bg-blue-50 text-blue-700 font-semibold",
                      )}
                    >
                      {r.name}
                    </button>
                  ))}
                  {filteredRoles.length === 0 && (
                    <div className="p-4 text-sm text-slate-500 text-center">No matches.</div>
                  )}
                </div>
              )}
            </section>
          )}

          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-4 self-start mb-4"
          >
            My role isn't listed
          </button>
        </>
      ) : (
        <section className="mb-5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 block">Your profession</label>
          <Input
            value={customProfession}
            onChange={(e) => setCustomProfession(e.target.value)}
            placeholder="e.g. Marine Biologist"
            maxLength={80}
            className="h-11 rounded-xl"
          />
          <button
            type="button"
            onClick={() => setShowCustom(false)}
            className="mt-3 text-sm text-slate-500 hover:text-slate-700 underline underline-offset-4"
          >
            Pick from the list instead
          </button>
        </section>
      )}

      <div className="sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-4 pb-[max(env(safe-area-inset-bottom),12px)]">
        <Button
          onClick={handleContinue}
          disabled={!canContinue || isSaving}
          className="w-full h-12 rounded-xl text-base"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );
}
