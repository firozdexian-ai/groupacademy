import { useState, ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function RoadmapBuilderSheet({ countryCode, children }: { countryCode: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    field_of_study: "",
    degree_level: "masters",
    target_intake: "Fall 2026",
    budget_level: "medium",
    ielts_score: "",
    gpa: "",
    years_experience: "0",
  });

  const submit = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-destination-agent", {
        body: {
          country_code: countryCode,
          intent: "roadmap",
          roadmap_payload: {
            ...form,
            ielts_score: form.ielts_score ? Number(form.ielts_score) : null,
            years_experience: Number(form.years_experience) || 0,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Roadmap ready (${data.credits_spent} credits used)`);
      setOpen(false);
      window.location.assign(`/app/abroad/roadmap/${data.roadmap_id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Build my roadmap</SheetTitle></SheetHeader>
        <div className="space-y-3 py-3">
          <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><Label>Field of study</Label><Input value={form.field_of_study} onChange={(e) => setForm({ ...form, field_of_study: e.target.value })} placeholder="e.g. Computer Science" /></div>
          <div><Label>Degree</Label>
            <select className="w-full border rounded px-3 py-2 bg-background" value={form.degree_level} onChange={(e) => setForm({ ...form, degree_level: e.target.value })}>
              <option value="bachelors">Bachelors</option>
              <option value="masters">Masters</option>
              <option value="phd">PhD</option>
            </select>
          </div>
          <div><Label>Target intake</Label><Input value={form.target_intake} onChange={(e) => setForm({ ...form, target_intake: e.target.value })} /></div>
          <div><Label>Budget level</Label>
            <select className="w-full border rounded px-3 py-2 bg-background" value={form.budget_level} onChange={(e) => setForm({ ...form, budget_level: e.target.value })}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>IELTS</Label><Input type="number" step="0.5" value={form.ielts_score} onChange={(e) => setForm({ ...form, ielts_score: e.target.value })} placeholder="6.5" /></div>
            <div><Label>GPA</Label><Input value={form.gpa} onChange={(e) => setForm({ ...form, gpa: e.target.value })} placeholder="3.5" /></div>
          </div>
          <div><Label>Work experience (years)</Label><Input type="number" value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} /></div>
          <Button onClick={submit} disabled={busy} className="w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Generate Roadmap (3 credits)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
