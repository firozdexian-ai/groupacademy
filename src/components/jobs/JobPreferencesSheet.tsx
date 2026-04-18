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
import { Globe, Banknote, Building2 } from "lucide-react";

interface JobPreferences {
  preferred_job_types: string[];
  preferred_locations: string[];
  salary_min: number | null;
  salary_max: number | null;
  industries: string[];
}

const JOB_TYPE_OPTIONS = Object.entries(JOB_TYPES).map(([value, config]) => ({
  value,
  label: config.label,
}));

export function JobPreferencesSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { talent } = useTalent();
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<JobPreferences>({
    preferred_job_types: [],
    preferred_locations: [],
    salary_min: null,
    salary_max: null,
    industries: [],
  });

  /**
   * CTO Audit Fix: Dynamic Location Discovery
   * Fetches the top 20 active locations from the database to replace hardcoded list
   */
  const { data: dynamicLocations = [], isLoading: loadingLocations } = useQuery({
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
    if (open && talent?.id) loadPreferences();
  }, [open, talent?.id]);

  const loadPreferences = async () => {
    const { data } = await supabase.from("talents").select("job_preferences").eq("id", talent!.id).single();
    if (data?.job_preferences) {
      setPreferences(data.job_preferences as unknown as JobPreferences);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("talents")
        .update({
          job_preferences: preferences as unknown as Json,
        })
        .eq("id", talent!.id);
      if (error) throw error;
      toast.success("Matching preferences updated!");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof JobPreferences, value: string) => {
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
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">Matching Preferences</SheetTitle>
          <SheetDescription>Our AI uses these to calculate your Match Score for every job.</SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-8 pb-10">
          {/* Job Types */}
          <div className="space-y-4">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Employment Type
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {JOB_TYPE_OPTIONS.map((type) => (
                <label
                  key={type.value}
                  className={cn(
                    "flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all",
                    preferences.preferred_job_types.includes(type.value)
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:bg-muted",
                  )}
                >
                  <Checkbox
                    checked={preferences.preferred_job_types.includes(type.value)}
                    onCheckedChange={() => toggle("preferred_job_types", type.value)}
                  />
                  <span className="text-xs font-medium">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-4">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Globe className="w-4 h-4" /> Target Locations
            </Label>
            {loadingLocations ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {dynamicLocations.map((loc) => (
                  <Badge
                    key={loc}
                    variant={preferences.preferred_locations.includes(loc) ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1 text-xs font-normal"
                    onClick={() => toggle("preferred_locations", loc)}
                  >
                    {loc}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Salary - Audit Fix: Currency Agnostic */}
          <div className="space-y-4">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Banknote className="w-4 h-4" /> Monthly Compensation (Preferred)
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground">Minimum</span>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={preferences.salary_min || ""}
                  onChange={(e) => setPreferences((p) => ({ ...p, salary_min: parseInt(e.target.value) || null }))}
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground">Maximum</span>
                <Input
                  type="number"
                  placeholder="e.g. 150000"
                  value={preferences.salary_max || ""}
                  onChange={(e) => setPreferences((p) => ({ ...p, salary_max: parseInt(e.target.value) || null }))}
                />
              </div>
            </div>
            <p className="text-[10px] italic text-muted-foreground">
              *AI automatically converts BDT and USD for cross-market matching.
            </p>
          </div>

          <Button onClick={handleSave} className="w-full h-12 shadow-lg" disabled={saving}>
            {saving ? <Loader2 className="animate-spin mr-2" /> : null}
            Update AI Profile
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
function Loader2({ className }: { className?: string }) {
  return <Building2 className={cn("animate-spin", className)} />;
}
