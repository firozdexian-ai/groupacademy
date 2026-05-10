/**
 * Phase 4.1 — Admin Course Briefs tab.
 * Create briefs, publish to auto-create instructor jobs, view linked job pipeline.
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Briefcase, ExternalLink, Loader2 } from "lucide-react";
import { useCourseBriefs, useCreateBrief, usePublishBrief } from "@/hooks/useCourseBriefs";
import { Link } from "react-router-dom";

export function LearningCourseBriefsTab() {
  const { data: briefs = [], isLoading } = useCourseBriefs();
  const create = useCreateBrief();
  const publish = usePublishBrief();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    mode: "recorded" as "recorded" | "live_cohort" | "hybrid",
    language: "en",
    duration_weeks: "",
    revenue_share_pct: "60",
    budget_amount: "",
    budget_currency: "BDT",
  });

  const submit = async () => {
    if (!form.title.trim()) return;
    await create.mutateAsync({
      title: form.title,
      summary: form.summary || null,
      mode: form.mode,
      language: form.language,
      duration_weeks: form.duration_weeks ? Number(form.duration_weeks) : null,
      revenue_share_pct: Number(form.revenue_share_pct),
      budget_amount: form.budget_amount ? Number(form.budget_amount) : 0,
      budget_currency: form.budget_currency,
    });
    setOpen(false);
    setForm({ ...form, title: "", summary: "", duration_weeks: "", budget_amount: "" });
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Course Briefs</h2>
          <p className="text-xs text-muted-foreground">
            Define a course slot. Publishing creates a hidden instructor job.
          </p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />New brief</Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>New course brief</SheetTitle></SheetHeader>
            <div className="space-y-3 mt-4">
              <Field label="Title">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <Field label="Summary">
                <Textarea rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Mode">
                  <select
                    className="w-full border rounded-md h-9 px-2 text-sm bg-background"
                    value={form.mode}
                    onChange={(e) => setForm({ ...form, mode: e.target.value as any })}
                  >
                    <option value="recorded">Recorded</option>
                    <option value="live_cohort">Live cohort</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </Field>
                <Field label="Language">
                  <Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
                </Field>
                <Field label="Duration (wks)">
                  <Input type="number" value={form.duration_weeks} onChange={(e) => setForm({ ...form, duration_weeks: e.target.value })} />
                </Field>
                <Field label="Revenue share %">
                  <Input type="number" value={form.revenue_share_pct} onChange={(e) => setForm({ ...form, revenue_share_pct: e.target.value })} />
                </Field>
                <Field label="Flat fee">
                  <Input type="number" value={form.budget_amount} onChange={(e) => setForm({ ...form, budget_amount: e.target.value })} />
                </Field>
                <Field label="Currency">
                  <Input value={form.budget_currency} onChange={(e) => setForm({ ...form, budget_currency: e.target.value })} />
                </Field>
              </div>
              <Button className="w-full" onClick={submit} disabled={create.isPending}>
                {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save as draft
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : briefs.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          No briefs yet. Create one to start hiring an instructor.
        </Card>
      ) : (
        <div className="space-y-2">
          {briefs.map((b) => (
            <Card key={b.id} className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{b.title}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{b.summary}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Badge variant={b.status === "open" ? "default" : "secondary"} className="text-[10px]">
                      {b.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{b.mode}</Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {b.revenue_share_pct}% share
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {b.status === "draft" && (
                    <Button
                      size="sm"
                      onClick={() => publish.mutate(b.id)}
                      disabled={publish.isPending}
                    >
                      Publish
                    </Button>
                  )}
                  {b.instructor_job_id && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/dashboard?tab=jobs&jobId=${b.instructor_job_id}`}>
                        <Briefcase className="h-3.5 w-3.5 mr-1" />
                        Pipeline
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export default LearningCourseBriefsTab;
