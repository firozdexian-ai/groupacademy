import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  COMMON_TIMEZONES,
  DEFAULT_EVENT_TZ,
  formatEventTime,
  utcIsoToZonedInput,
  zonedInputToUtcIso,
} from "@/lib/eventTime";

interface EventDateTimeFieldProps {
  utcValue: string; // ISO UTC string stored in central form state
  timezone: string; // IANA zone string (e.g., "Asia/Dhaka")
  onChange: (next: { utcValue: string; timezone: string }) => void;
  label?: string;
  disabled?: boolean; // Extensibility parameter to lock down controls during background mutation transits
}

/**
 * GroUp Academy: Timezone-Aware Live Event Scheduler (V5.6.0)
 * CTO Reference: High-performance datetime picker capturing absolute point-in-time anchors.
 * Architecture: Optimized via reference-stable primitive parsing to prevent rendering waterfalls.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */
export function EventDateTimeField({
  utcValue,
  timezone,
  onChange,
  label = "Event schedule",
  disabled = false,
}: EventDateTimeFieldProps) {
  // Enforce authoritative IANA fallback zone safely if data parameters arrive unassigned
  const targetTz = useMemo(() => {
    return timezone?.trim() || DEFAULT_EVENT_TZ;
  }, [timezone]);

  // Map the background universal ISO string to a zoned wall-clock text fragment for the HTML input field
  const localInputStringValue = useMemo(() => {
    if (!utcValue) return "";
    try {
      return utcIsoToZonedInput(utcValue, targetTz);
    } catch (err) {
      console.error("[Digital Workforce] FAULT: Zoned datetime text compilation failed.", err);
      return "";
    }
  }, [utcValue, targetTz]);

  // --- HANDLER: LOCAL_WALL_CLOCK_MUTATION ---
  const handleLocalTimeChange = (inputDateTimeString: string) => {
    if (disabled) return;

    if (!inputDateTimeString) {
      onChange({ utcValue: "", timezone: targetTz });
      return;
    }

    try {
      // HUD: COMPILING_LOCAL_WALL_CLOCK_TO_UNIVERSAL_UTC_ISO
      const calculatedUtcIso = zonedInputToUtcIso(inputDateTimeString, targetTz);
      onChange({ utcValue: calculatedUtcIso, timezone: targetTz });
    } catch (err) {
      console.error("[Digital Workforce] FAULT: Failed to parse input datetime string.", err);
    }
  };

  // --- HANDLER: TIMEZONE_ANCHOR_MUTATION ---
  const handleTimezoneChange = (nextSelectedTz: string) => {
    if (disabled) return;

    const validatedNextTz = nextSelectedTz?.trim() || DEFAULT_EVENT_TZ;

    // HUD: ADJUSTING_TIMEZONE_CONTEXT_BOUNDARIES
    // Architecture: Keeps the universal point-in-time anchor (utcValue) perfectly stable.
    // Changing the zone updates the local picker display text, rather than shifting global calendar slots.
    onChange({
      utcValue: utcValue || "",
      timezone: validatedNextTz,
    });
  };

  return (
    <div className="space-y-2 text-left select-none animate-in fade-in duration-500">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 pl-0.5">{label}</Label>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr,200px] gap-2">
        {/* INPUT: LOCALIZED_HTML5_DATETIME_FIELD */}
        <Input
          type="datetime-local"
          disabled={disabled}
          value={localInputStringValue}
          onChange={(e) => handleLocalTimeChange(e.target.value)}
          className="rounded-xl h-11 border-2 focus:ring-2 disabled:opacity-50 transition-all font-medium"
        />

        {/* SELECT: IANA_ZONE_SELECTION_TRIGGER */}
        <Select value={targetTz} disabled={disabled} onValueChange={handleTimezoneChange}>
          <SelectTrigger className="rounded-xl h-11 border-2 font-semibold italic focus:ring-2 disabled:opacity-50 bg-card">
            <SelectTriggerValueWrapper placeholder="Select timezone..." />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2 max-h-[280px]">
            {COMMON_TIMEZONES.map((zoneName) => (
              <SelectItem key={zoneName} value={zoneName} className="font-bold text-xs uppercase tracking-tight py-2.5">
                {zoneName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* METRICS HUD: LIVE_DATA_INTEGRITY_SUMMARY_FEED */}
      {utcValue && (
        <div className="text-[11px] font-mono text-muted-foreground/80 space-y-1 p-2 rounded-xl bg-muted/20 border border-dashed border-border/60 mt-1">
          <div className="flex justify-between items-center px-0.5">
            <span className="font-semibold uppercase tracking-wide">📅 Scheduled Target:</span>
            <span className="font-bold text-foreground bg-background px-2 py-0.5 rounded border">
              {formatEventTime(utcValue, targetTz)}
            </span>
          </div>
          <div className="flex justify-between items-center px-0.5 border-t pt-1 border-border/10">
            <span className="font-semibold uppercase tracking-wide">🌐 Stored time (UTC):</span>
            <span className="font-bold text-primary">{formatEventTime(utcValue, "UTC")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Isolated structural wrapper preventing type errors inside dynamic select structures.
 */
function SelectTriggerValueWrapper({ placeholder }: { placeholder: string }) {
  return <SelectValue placeholder={placeholder} />;
}
