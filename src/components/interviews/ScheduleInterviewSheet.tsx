import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateInterview, type InterviewMode } from "@/hooks/useInterviews";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  applicationId: string;
  companyId: string;
  talentId: string;
  onCreated?: () => void;
}

export function ScheduleInterviewSheet({ open, onOpenChange, applicationId, companyId, talentId, onCreated }: Props) {
  const createInterview = useCreateInterview();
  const [mode, setMode] = useState<InterviewMode>("video");
  const [duration, setDuration] = useState(30);
  const [link, setLink] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [slots, setSlots] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);

  const addSlot = () => setSlots((s) => [...s, ""]);
  const removeSlot = (i: number) => setSlots((s) => s.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, v: string) => setSlots((s) => s.map((x, idx) => (idx === i ? v : x)));

  const submit = async () => {
    const validSlots = slots.filter((s) => !!s).map((s) => new Date(s).toISOString());
    if (!validSlots.length) {
      toast.error("Add at least one time slot");
      return;
    }
    setSaving(true);
    try {
      const id = await createInterview.mutateAsync({
        application_id: applicationId,
        company_id: companyId,
        talent_id: talentId,
        mode,
        meeting_link: mode === "video" ? link : undefined,
        location: mode === "onsite" ? location : undefined,
        note,
        duration_min: duration,
        slots: validSlots,
      });
      setSaving(false);
      if (id) {
        onCreated?.();
        onOpenChange(false);
      }
    } catch {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>Schedule Interview</SheetTitle></SheetHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as InterviewMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
          </div>
          {mode === "video" && (
            <div>
              <Label>Meeting link</Label>
              <Input placeholder="https://meet.google.com/..." value={link} onChange={(e) => setLink(e.target.value)} />
            </div>
          )}
          {mode === "onsite" && (
            <div>
              <Label>Location / Address</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          )}
          <div>
            <Label>Note for candidate</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Proposed time slots</Label>
              <Button variant="ghost" size="sm" onClick={addSlot}><Plus className="h-3 w-3 mr-1" />Add</Button>
            </div>
            {slots.map((s, i) => (
              <div key={i} className="flex gap-2">
                <Input type="datetime-local" value={s} onChange={(e) => updateSlot(i, e.target.value)} />
                {slots.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeSlot(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button className="w-full" onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send to candidate
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
