import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import type { Json } from "@/integrations/supabase/types";

interface JobPreferences {
  preferred_job_types: string[];
  preferred_locations: string[];
  salary_min: number | null;
  salary_max: number | null;
  industries: string[];
}

const JOB_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
  { value: "remote", label: "Remote" },
  { value: "freelance", label: "Freelance" },
];

const LOCATIONS = [
  "Dhaka",
  "Chittagong",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Remote",
  "Anywhere in Bangladesh",
];

const INDUSTRIES = [
  "Technology",
  "Finance & Banking",
  "Healthcare",
  "Education",
  "NGO/Development",
  "Manufacturing",
  "Retail",
  "Media & Entertainment",
  "Government",
  "Startup",
];

interface JobPreferencesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobPreferencesSheet({ open, onOpenChange }: JobPreferencesSheetProps) {
  const { talent } = useTalent();
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<JobPreferences>({
    preferred_job_types: [],
    preferred_locations: [],
    salary_min: null,
    salary_max: null,
    industries: [],
  });

  useEffect(() => {
    if (open && talent?.id) {
      loadPreferences();
    }
  }, [open, talent?.id]);

  const loadPreferences = async () => {
    if (!talent?.id) return;
    
    const { data, error } = await supabase
      .from("talents")
      .select("job_preferences")
      .eq("id", talent.id)
      .single();

    if (!error && data?.job_preferences) {
      const prefs = data.job_preferences as unknown as JobPreferences;
      setPreferences({
        preferred_job_types: prefs.preferred_job_types || [],
        preferred_locations: prefs.preferred_locations || [],
        salary_min: prefs.salary_min || null,
        salary_max: prefs.salary_max || null,
        industries: prefs.industries || [],
      });
    }
  };

  const handleSave = async () => {
    if (!talent?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("talents")
        .update({ job_preferences: preferences as unknown as Json })
        .eq("id", talent.id);

      if (error) throw error;
      toast.success("Preferences saved!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const toggleJobType = (value: string) => {
    setPreferences(prev => ({
      ...prev,
      preferred_job_types: prev.preferred_job_types.includes(value)
        ? prev.preferred_job_types.filter(t => t !== value)
        : [...prev.preferred_job_types, value],
    }));
  };

  const toggleLocation = (value: string) => {
    setPreferences(prev => ({
      ...prev,
      preferred_locations: prev.preferred_locations.includes(value)
        ? prev.preferred_locations.filter(l => l !== value)
        : [...prev.preferred_locations, value],
    }));
  };

  const toggleIndustry = (value: string) => {
    setPreferences(prev => ({
      ...prev,
      industries: prev.industries.includes(value)
        ? prev.industries.filter(i => i !== value)
        : [...prev.industries, value],
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Job Preferences</SheetTitle>
          <SheetDescription>
            Set your preferences to get better job recommendations
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Job Types */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Preferred Job Types</Label>
            <div className="grid grid-cols-2 gap-2">
              {JOB_TYPES.map(type => (
                <label
                  key={type.value}
                  className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={preferences.preferred_job_types.includes(type.value)}
                    onCheckedChange={() => toggleJobType(type.value)}
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Preferred Locations</Label>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map(location => (
                <label
                  key={location}
                  className="flex items-center gap-2 px-3 py-1.5 border rounded-full cursor-pointer hover:bg-muted/50 transition-colors text-sm"
                >
                  <Checkbox
                    checked={preferences.preferred_locations.includes(location)}
                    onCheckedChange={() => toggleLocation(location)}
                    className="h-3.5 w-3.5"
                  />
                  <span>{location}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Salary Range */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Salary Expectations (BDT/month)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Minimum</Label>
                <Input
                  type="number"
                  placeholder="e.g. 30000"
                  value={preferences.salary_min || ""}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    salary_min: e.target.value ? parseInt(e.target.value) : null,
                  }))}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Maximum</Label>
                <Input
                  type="number"
                  placeholder="e.g. 80000"
                  value={preferences.salary_max || ""}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    salary_max: e.target.value ? parseInt(e.target.value) : null,
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Industries */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Industries of Interest</Label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map(industry => (
                <label
                  key={industry}
                  className="flex items-center gap-2 px-3 py-1.5 border rounded-full cursor-pointer hover:bg-muted/50 transition-colors text-sm"
                >
                  <Checkbox
                    checked={preferences.industries.includes(industry)}
                    onCheckedChange={() => toggleIndustry(industry)}
                    className="h-3.5 w-3.5"
                  />
                  <span>{industry}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
