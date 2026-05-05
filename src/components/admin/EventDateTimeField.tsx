/**
 * Timezone-aware datetime picker for live events.
 * Stores UTC in parent state but lets admins enter time in the event's local zone.
 */
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

interface Props {
  utcValue: string;       // ISO UTC string stored in parent
  timezone: string;       // IANA zone, default Asia/Dhaka
  onChange: (next: { utcValue: string; timezone: string }) => void;
  label?: string;
}

export function EventDateTimeField({ utcValue, timezone, onChange, label = "Event schedule" }: Props) {
  const tz = timezone || DEFAULT_EVENT_TZ;
  const localValue = utcIsoToZonedInput(utcValue, tz);

  const handleLocal = (next: string) => {
    onChange({ utcValue: next ? zonedInputToUtcIso(next, tz) : "", timezone: tz });
  };

  const handleTz = (nextTz: string) => {
    // keep the wall-clock the user already typed; just change which zone it's interpreted in
    onChange({
      utcValue: localValue ? zonedInputToUtcIso(localValue, nextTz) : utcValue,
      timezone: nextTz,
    });
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr,180px] gap-2">
        <Input
          type="datetime-local"
          value={localValue}
          onChange={(e) => handleLocal(e.target.value)}
          className="rounded-xl"
        />
        <Select value={tz} onValueChange={handleTz}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Timezone" />
          </SelectTrigger>
          <SelectContent>
            {COMMON_TIMEZONES.map((z) => (
              <SelectItem key={z} value={z}>{z}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {utcValue && (
        <div className="text-[11px] text-muted-foreground space-y-0.5 px-1">
          <p>📅 Event starts: <span className="font-medium text-foreground">{formatEventTime(utcValue, tz)}</span></p>
          <p>🌐 In UTC: {formatEventTime(utcValue, "UTC")}</p>
        </div>
      )}
    </div>
  );
}
