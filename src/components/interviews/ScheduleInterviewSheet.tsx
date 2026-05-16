import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Calendar, Link2, MapPin, ClipboardList } from "lucide-react";
import { useCreateInterview, type InterviewMode } from "@/hooks/useInterviews";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  applicationId: string;
  companyId: string;
  talentId: string;
  onCreated?: () => void;
}

/**
 * GroUp Academy: Recruitment Evaluation Node (ScheduleInterviewSheet)
 * CTO Reference: Authoritative orchestration drawer dispatching multi-slot availability options.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ScheduleInterviewSheet({ open, onOpenChange, applicationId, companyId, talentId, onCreated }: Props) {
  const createInterview = useCreateInterview();
  const [mode, setMode] = useState<InterviewMode>("video");
  const [duration, setDuration] = useState<number>(30);
  const [link, setLink] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [slots, setSlots] = useState<string[]>([""]);

  // Track panel view lifecycles across centralized telemetry channels
  useEffect(() => {
    if (open && applicationId) {
      trackEvent("interview_scheduling_drawer_opened", { applicationId, companyId, talentId });
    }
  }, [open, applicationId, companyId, talentId]);

  if (!applicationId || !companyId || !talentId) {
    trackError("ScheduleInterviewSheet mounted without valid transactional identifiers.", {
      component: "ScheduleInterviewSheet",
      action: "null_pointer_assertion",
    });
    return null;
  }

  const addSlot = () => {
    trackEvent("interview_scheduling_slot_added", { currentCount: slots.length });
    setSlots((s) => [...s, ""]);
  };

  const removeSlot = (targetIndex: number) => {
    trackEvent("interview_scheduling_slot_removed", { targetIndex });
    setSlots((s) => s.filter((_, idx) => idx !== targetIndex));
  };

  const updateSlot = (targetIndex: number, dateStringValue: string) => {
    setSlots((s) => s.map((x, idx) => (idx === targetIndex ? dateStringValue : x)));
  };

  const handleFormSubmissionProtocol = async () => {
    // Standard data cleansing pass filtering blank rows gracefully
    const validSlots = slots
      .filter((s) => !!s?.trim())
      .map((s) => {
        try {
          return new Date(s).toISOString();
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean) as string[];

    if (!validSlots.length) {
      toast.error("Please supply at least one valid date-time slot allocation variant.");
      return;
    }

    if (mode === "video" && !link.trim()) {
      toast.error("Video configuration mode requires a verified destination meeting link string.");
      return;
    }

    if (mode === "onsite" && !location.trim()) {
      toast.error("On-site deployment configurations require a physical address lookup string.");
      return;
    }

    const toastId = toast.loading("Deploying availability options to candidate ledger...");

    trackEvent("interview_scheduling_mutation_submitted", {
      applicationId,
      slotsCount: validSlots.length,
      mode,
    });

    try {
      // 1. Mutation Sync Integration: Leveraging hook features cleanly over local hook definitions
      const responseInterviewId = await createInterview.mutateAsync({
        application_id: applicationId,
        company_id: companyId,
        talent_id: talentId,
        mode,
        meeting_link: mode === "video" ? link.trim() : undefined,
        location: mode === "onsite" ? location.trim() : undefined,
        note: note.trim(),
        duration_min: Number(duration) || 30,
        slots: validSlots,
      });

      trackEvent("interview_scheduling_mutation_success", { responseInterviewId, applicationId });
      toast.success("Evaluation matrix dispatched successfully to candidate profiles", { id: toastId });

      onCreated?.();
      onOpenChange(false);

      // Reset interaction fields to default state frames upon success
      setSlots([""]);
      setLink("");
      setLocation("");
      setNote("");
    } catch (err: any) {
      const parsedExceptionMsg = err instanceof Error ? err.message : String(err);

      // 2. Incident Ingestion: Forward processing failures straight to administrative monitoring systems
      trackError(parsedExceptionMsg, {
        component: "ScheduleInterviewSheet",
        action: "submit_create_interview_mutation",
        applicationId,
        companyId,
      });

      toast.error(`Ecosystem negotiation timeout: ${parsedExceptionMsg}`, { id: toastId });
    }
  };

  const isMutationProcessing = createInterview.isPending;

  return (
    <Sheet
      open={open}
      onOpenChange={(visibleState) => {
        if (!isMutationProcessing) {
          onOpenChange(visibleState);
          if (!visibleState) trackEvent("interview_scheduling_drawer_dismissed", { applicationId });
        }
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-background/98 backdrop-blur-xl border-l border-border/40 overflow-y-auto p-6 pt-safe pb-safe-bottom antialiased selection:bg-primary/20 shadow-2xl transition-all duration-300 select-none sm:select-text"
        style={{ contentVisibility: "auto" }}
      >
        {/* Immersive Section Header */}
        <SheetHeader className="text-left mb-6 border-b border-border/10 pb-4 select-none">
          <SheetTitle className="text-base font-bold tracking-tight text-foreground flex items-center gap-2 uppercase tracking-wider">
            <Calendar className="h-4 w-4 text-primary stroke-[2.2]" />
            <span>Configure Interview Matrix</span>
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground/90 leading-normal mt-1">
            Establish evaluation tracking criteria, duration limits, and calendar slots. The platform will dispatch an
            optimization selection screen straight to the candidate.
          </SheetDescription>
        </SheetHeader>

        {/* Input Controls Container Track */}
        <div className="space-y-4 text-xs font-bold text-foreground/90 tracking-tight">
          <div className="grid grid-cols-2 gap-4 w-full select-none">
            <div className="space-y-1 text-left">
              <Label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider pl-0.5">
                Evaluation Mode
              </Label>
              <Select
                value={mode}
                onValueChange={(v) => {
                  setMode(v as InterviewMode);
                  trackEvent("interview_scheduling_mode_changed", { mode: v, applicationId });
                }}
                disabled={isMutationProcessing}
              >
                <SelectTrigger className="w-full h-10 rounded-xl border border-border/40 bg-card/40 focus:ring-1 focus:ring-ring text-xs font-bold tracking-tight cursor-pointer">
                  <SelectValue placeholder="Select path mode" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/40 shadow-xl bg-background/95 backdrop-blur-md font-semibold text-xs text-foreground/90 select-none">
                  <SelectItem value="video" className="cursor-pointer font-bold py-2 text-xs">
                    Video Call
                  </SelectItem>
                  <SelectItem value="phone" className="cursor-pointer font-bold py-2 text-xs">
                    Voice / Phone Link
                  </SelectItem>
                  <SelectItem value="onsite" className="cursor-pointer font-bold py-2 text-xs">
                    On-Site / Physical
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 text-left">
              <Label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider pl-0.5">
                Duration Blocks
              </Label>
              <Input
                type="number"
                min={15}
                max={180}
                step={15}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) || 30)}
                disabled={isMutationProcessing}
                className="rounded-xl border border-border/40 bg-card/40 h-10 text-xs sm:text-sm font-bold tracking-tight focus-visible:ring-1 focus-visible:ring-ring text-foreground/90 tabular-nums shadow-sm"
              />
            </div>
          </div>

          {/* Conditional Logic Content Blocks Ingress */}
          {mode === "video" && (
            <div className="space-y-1 text-left animate-in slide-in-from-top-1 duration-200">
              <Label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider pl-0.5 select-none">
                Meeting Room Telemetry Link
              </Label>
              <div className="relative w-full">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 stroke-[2.2]" />
                <Input
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  disabled={isMutationProcessing}
                  className="rounded-xl border border-border/40 bg-card/40 pl-10 h-10 text-xs sm:text-sm font-bold tracking-tight focus-visible:ring-1 focus-visible:ring-ring text-foreground/90"
                />
              </div>
            </div>
          )}

          {mode === "onsite" && (
            <div className="space-y-1 text-left animate-in slide-in-from-top-1 duration-200">
              <Label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider pl-0.5 select-none">
                Physical Deployment Address
              </Label>
              <div className="relative w-full">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 stroke-[2.2]" />
                <Input
                  placeholder="E.g. Building 4, Level 12, Banani Headquarters"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isMutationProcessing}
                  className="rounded-xl border border-border/40 bg-card/40 pl-10 h-10 text-xs sm:text-sm font-bold tracking-tight focus-visible:ring-1 focus-visible:ring-ring text-foreground/90"
                />
              </div>
            </div>
          )}

          <div className="space-y-1 text-left">
            <Label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider pl-0.5 select-none">
              Strategic Brief Note for Candidate
            </Label>
            <Textarea
              placeholder="Outline high-level structural parameters, technical framework scopes, or case studies targets to review ahead of synchronization windows..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              disabled={isMutationProcessing}
              className="resize-none rounded-xl text-xs sm:text-sm font-medium border border-border/40 bg-card/30 focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary/40 leading-relaxed p-4 select-text"
            />
          </div>

          {/* Time Slot Dynamic Mutator Grid Track */}
          <div className="space-y-2 pt-2 border-t border-border/10">
            <div className="flex items-center justify-between select-none">
              <Label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider pl-0.5">
                Proposed Evaluation Windows
              </Label>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={addSlot}
                disabled={isMutationProcessing || slots.length >= 8}
                className="h-6 rounded-lg text-[10px] font-extrabold uppercase tracking-wide px-2.5 border-border/60 hover:bg-accent cursor-pointer shadow-sm shrink-0 flex items-center gap-1 focus-visible:ring-1"
              >
                <Plus className="h-3 w-3 text-primary stroke-[2.5]" />
                <span>Add Slot</span>
              </Button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {slots.map((slotValue, slotIndex) => (
                <div
                  key={slotIndex}
                  className="flex gap-2 items-center w-full animate-in slide-in-from-right-2 duration-150"
                >
                  <Input
                    type="datetime-local"
                    value={slotValue}
                    onChange={(e) => updateSlot(slotIndex, e.target.value)}
                    disabled={isMutationProcessing}
                    className="rounded-xl border border-border/40 bg-card/40 h-10 text-xs sm:text-sm font-bold tracking-tight focus-visible:ring-1 focus-visible:ring-ring text-foreground/90 tabular-nums cursor-pointer"
                  />
                  {slots.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      disabled={isMutationProcessing}
                      onClick={() => removeSlot(slotIndex)}
                      className="h-9 w-9 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0 transition-all active:scale-90"
                      aria-label={`Purge time choice entry option row number ${slotIndex + 1}`}
                    >
                      <Trash2 className="h-4 w-4 stroke-[2.2]" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Primary Transaction Trigger Button Ribbon */}
          <Button
            className="w-full h-11 rounded-xl font-bold text-xs tracking-wide shadow-md active:scale-[0.99] transition-transform select-none cursor-pointer gap-2 mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleFormSubmissionProtocol}
            disabled={isMutationProcessing}
          >
            {isMutationProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                <span>Transmitting Matrix Parameters…</span>
              </>
            ) : (
              <span>Dispatch Evaluation Windows to Candidate</span>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
