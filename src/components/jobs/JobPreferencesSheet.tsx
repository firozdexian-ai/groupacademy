import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import type { Json } from "@/integrations/supabase/types";
import { JOB_TYPES } from "@/lib/constants/jobTypes";
import { Badge } from "@/components/ui/badge";
import { Globe, Banknote, Building2, Zap, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Neural Matching Preference Ingress
 * CTO Reference: Authoritative interface for defining AI matching constraints.
 */

interface JobPreferences {
  preferred_job_types: string[];
  preferred_locations: string[];
  salary_min: number | null;
  salary_max: number | null;
  industries: string[];
}

const JOB_TYPE_REGISTRY = Object.entries(JOB_TYPES).map(([value, config]) => ({
  value,
  label: config.label,
}));

export function JobPreferencesSheet({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; onSaved?: () => void }) {
  const { talent } = useTalent();
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<JobPreferences>({
    preferred_job_types: [],
    preferred_locations: [],
    salary_min: null,
    salary_max: null,
    industries: [],
  });

  // PROTOCOL: Dynamic Location Discovery
  const { data: activeLocations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ["active-job-locations"],
    queryFn: async () => {
      const { data } = await supabase.from("jobs").select("location").eq("is_active", true).limit(500);
      const locSet = new Set<string>(["Remote"]);
      data?.forEach((j) => {
        if (j.location) locSet.add(j.location);
      });
      return Array.from(locSet).slice(0, 20);
    },
    enabled: open,
  });

  useEffect(() => {
    if (open && talent?.id) loadRegistryPreferences();
  }, [open, talent?.id]);

  const loadRegistryPreferences = async () => {
    const { data } = await supabase.from("talents").select("job_preferences").eq("id", talent!.id).single();
    if (data?.job_preferences) {
      setPreferences(data.job_preferences as unknown as JobPreferences);
    }
  };

  const executeSync = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("talents")
        .update({ job_preferences: preferences as unknown as Json })
        .eq("id", talent!.id);
      if (error) throw error;
      toast.success("NEURAL_MATCHING_SYNCED");
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error("SYNC_FAULT");
    } finally {
      setSaving(false);
    }
  };

  const toggleNode = (key: keyof JobPreferences, value: string) => {
    setPreferences((prev) => {
      const list = prev[key] as string[];
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md rounded-l-[40px] border-l-2 bg-background/95 backdrop-blur-2xl p-0 no-scrollbar">
        {/* HUD: HEADER */}
        <div className="p-8 border-b-2 border-border/10 bg-primary/5">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg">
                <Zap className="h-6 w-6 text-primary fill-current animate-pulse" />
              </div>
              <div className="space-y-1">
                <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                  Match_Constraints
                </SheetTitle>
                <SheetDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                  AI_Deployment_Preference_Registry
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="p-8 space-y-10 pb-24">
          {/* COMPONENT: EMPLOYMENT_TYPE */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground ml-1">
              Vector: Employment_Type
            </Label>
            <div className="grid grid-cols-1 gap-3">
              {JOB_TYPE_REGISTRY.map((type) => (
                <label
                  key={type.value}
                  className={cn(
                    "flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all duration-500",
                    preferences.preferred_job_types.includes(type.value)
                      ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
                      : "border-border/40 hover:border-primary/20 bg-card/50",
                  )}
                >
                  <span className="text-xs font-black uppercase italic tracking-tighter">{type.label}</span>
                  <Checkbox
                    checked={preferences.preferred_job_types.includes(type.value)}
                    onCheckedChange={() => toggleNode("preferred_job_types", type.value)}
                    className="h-5 w-5 rounded-lg border-2"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* COMPONENT: TARGET_LOCATIONS */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground ml-1">
              Vector: Target_Geography
            </Label>
            {loadingLocations ? (
              <Skeleton className="h-24 w-full rounded-2xl opacity-20" />
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {activeLocations.map((loc) => (
                  <Badge
                    key={loc}
                    variant={preferences.preferred_locations.includes(loc) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer px-4 py-2 rounded-xl text-[10px] font-black uppercase italic tracking-widest transition-all border-2",
                      preferences.preferred_locations.includes(loc)
                        ? "shadow-lg shadow-primary/20"
                        : "hover:border-primary/40",
                    )}
                    onClick={() => toggleNode("preferred_locations", loc)}
                  >
                    {loc}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* COMPONENT: COMP_BENCHMARKS */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground ml-1">
              Vector: Fiscal_Benchmarks
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 italic">
                  Registry_Min
                </span>
                <Input
                  type="number"
                  placeholder="000,000"
                  value={preferences.salary_min || ""}
                  className="h-12 bg-muted/20 border-2 rounded-xl font-bold italic tabular-nums focus:ring-primary/20"
                  onChange={(e) => setPreferences((p) => ({ ...p, salary_min: parseInt(e.target.value) || null }))}
                />
              </div>
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 italic">
                  Registry_Max
                </span>
                <Input
                  type="number"
                  placeholder="000,000"
                  value={preferences.salary_max || ""}
                  className="h-12 bg-muted/20 border-2 rounded-xl font-bold italic tabular-nums focus:ring-primary/20"
                  onChange={(e) => setPreferences((p) => ({ ...p, salary_max: parseInt(e.target.value) || null }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/10 border-2 border-border/5 rounded-2xl">
              <ShieldCheck className="h-4 w-4 text-primary opacity-40" />
              <p className="text-[9px] font-medium leading-relaxed italic text-muted-foreground/60">
                Neural layer handles cross-currency parity for BDT/USD matching automatically.
              </p>
            </div>
          </div>
        </div>

        {/* HUD: ACTION_BAR */}
        <div className="absolute bottom-0 left-0 right-0 p-8 border-t-2 border-border/10 bg-background/50 backdrop-blur-3xl">
          <Button
            size="xl"
            onClick={executeSync}
            className="w-full h-16 rounded-[24px] font-black uppercase italic tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary),0.3)] hover:shadow-primary/40 transition-all active:scale-95 gap-3"
            disabled={saving}
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
            FINALIZE_CONSTRAINTS
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
