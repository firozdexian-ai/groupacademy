import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTalentAvailability, upsertTalentAvailability } from "@/domains/gigs/repo/gigsRepo";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Activity, Loader2 } from "lucide-react";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AvailabilityData {
  talent_id: string;
  weekly_capacity_hours: number;
  paused_until: string | null;
  notify_via_email: boolean;
  updated_at?: string;
}

/**
 * GroUp Academy: Community Consensus Node (AvailabilityWidget)
 * CTO Reference: High-fidelity workforce tracking component managing talent match capacities.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function AvailabilityWidget() {
  const { talent } = useTalent();
  const queryClient = useQueryClient();

  // Local interaction boundary states
  const [hours, setHours] = useState<number>(10);
  const [paused, setPaused] = useState<boolean>(false);
  const [emailOn, setEmailOn] = useState<boolean>(true);

  // 1. TanStack Query Server State Synchronization (staleTime 5 min configuration)
  const { data, isLoading, error } = useQuery<AvailabilityData | null>({
    queryKey: ["talent-availability", talent?.id],
    enabled: !!talent?.id,
    refetchOnWindowFocus: false,
    queryFn: async () => (await getTalentAvailability(talent!.id)) as AvailabilityData | null,
  });

  // 2. Controlled Hybrid Hydration: Guard against racing loop overrides
  useEffect(() => {
    if (data) {
      setHours(data.weekly_capacity_hours ?? 10);
      setPaused(!!data.paused_until && new Date(data.paused_until) > new Date());
      setEmailOn(data.notify_via_email !== false);
    }
  }, [data]);

  // 3. Instrument Operational Telemetry Boundaries for Query Failures
  useEffect(() => {
    if (error) {
      trackError(error instanceof Error ? error : String(error), {
        component: "AvailabilityWidget",
        action: "fetch_talent_availability_query",
        talentId: talent?.id,
      });
    }
  }, [error, talent?.id]);

  // 4. Hardened Data Mutation Engine (useMutation transition replacing local boolean states)
  const mutation = useMutation({
    mutationFn: async (payload: AvailabilityData) => {
      await upsertTalentAvailability(payload as any);
      return payload;
    },
    onSuccess: (variables) => {
      trackEvent("talent_availability_mutation_success", {
        talentId: talent?.id,
        capacityHours: variables.weekly_capacity_hours,
        isPaused: !!variables.paused_until,
      });

      // Synchronize caching pools instantly across viewports
      queryClient.invalidateQueries({ queryKey: ["talent-availability", talent?.id] });
      toast.success("Gig availability records updated successfully");
    },
    onError: (mutationErr: any) => {
      const parsedMsg = mutationErr instanceof Error ? mutationErr.message : String(mutationErr);

      trackError(parsedMsg, {
        component: "AvailabilityWidget",
        action: "submit_availability_upsert_mutation",
        talentId: talent?.id,
      });

      toast.error(`Mutation settlement failure: ${parsedMsg}`);
    },
  });

  const handleSaveProtocol = () => {
    if (!talent?.id) {
      toast.error("Anonymous security context prevents mutation submission.");
      return;
    }

    const payload: AvailabilityData = {
      talent_id: talent.id,
      weekly_capacity_hours: hours,
      paused_until: paused ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      notify_via_email: emailOn,
      updated_at: new Date().toISOString(),
    };

    mutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-sm select-none animate-pulse">
        <CardHeader className="pb-3 border-b border-border/10">
          <div className="h-4 w-32 rounded bg-muted opacity-60" />
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="h-10 w-full rounded-xl bg-muted/40" />
          <div className="h-6 w-full rounded-xl bg-muted/30" />
          <div className="h-9 w-full rounded-xl bg-primary/20" />
        </CardContent>
      </Card>
    );
  }

  const isSaving = mutation.isPending;

  return (
    <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all duration-300 relative overflow-hidden select-none">
      {/* Decorative Branding Identity Background Gradient */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      {/* Primary Widget Section Header */}
      <CardHeader className="pb-2.5 border-b border-border/20">
        <CardTitle className="text-xs font-bold flex items-center gap-2 text-foreground/90 uppercase tracking-wider">
          <Activity className="w-4 h-4 text-primary animate-pulse" />
          <span>Gig Availability Controls</span>
        </CardTitle>
      </CardHeader>

      {/* Control Input Track Body Node Elements */}
      <CardContent className="p-4 space-y-4 text-xs sm:text-sm font-bold tracking-tight text-foreground/90">
        {/* Metric Capacity Slider Track Row */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-muted-foreground/90 uppercase tracking-wider text-[10px]">Weekly Work Capacity</span>
            <span className="bg-primary/5 border border-primary/10 px-2.5 py-0.5 rounded-md text-primary tabular-nums text-xs">
              {hours} hours
            </span>
          </div>
          <div className="pt-1 select-none">
            <Slider
              value={[hours]}
              onValueChange={(val) => setHours(val[0])}
              min={0}
              max={40}
              step={1}
              disabled={isSaving}
              className="cursor-pointer"
            />
          </div>
        </div>

        {/* Operational Toggle: Match Pause Trigger Rule */}
        <div className="flex items-center justify-between gap-4 py-1.5 border-y border-border/20">
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-foreground/90">Pause Recommendation Matches</span>
            <span className="text-[10px] font-medium text-muted-foreground/70 mt-0.5 leading-none">
              Freezes automated pipelines for 30 days
            </span>
          </div>
          <Switch
            checked={paused}
            onCheckedChange={setPaused}
            disabled={isSaving}
            className="cursor-pointer"
            aria-label="Pause matching queues rule switch toggle"
          />
        </div>

        {/* Operational Toggle: Notification Control Strip */}
        <div className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-foreground/90">Email Digest Updates</span>
            <span className="text-[10px] font-medium text-muted-foreground/70 mt-0.5 leading-none">
              Weekly summary tracking ecosystem metrics
            </span>
          </div>
          <Switch
            checked={emailOn}
            onCheckedChange={setEmailOn}
            disabled={isSaving}
            className="cursor-pointer"
            aria-label="Toggle email digests status tracking selector"
          />
        </div>

        {/* Primary Transaction Settlement Call-To-Action Dispatcher */}
        <Button
          size="sm"
          onClick={handleSaveProtocol}
          disabled={isSaving || !talent?.id}
          className="w-full h-10 rounded-xl font-bold text-xs tracking-wide shadow-sm active:scale-[0.99] transition-all select-none cursor-pointer gap-2 mt-1"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
              <span>Saving Configurations…</span>
            </>
          ) : (
            <span>Commit Capacity Changes</span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
