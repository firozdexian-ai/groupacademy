import { useEffect, useMemo, useState } from "react";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Sparkles, Check, Languages } from "lucide-react";
import { toast } from "sonner";
import { useItemRewrite, type QuizSuggestion, type ScenarioSuggestion } from "@/hooks/useItemRewrite";
import { useItemTranslate, SUPPORTED_TRANSLATION_LANGS } from "@/hooks/useItemTranslate";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: "quiz" | "scenario";
  itemId: string | null;
  flags: string[];
  onApplied?: () => void;
}

export function ItemRewriteSheet({ open, onOpenChange, kind, itemId, flags, onApplied }: Props) {
  const { loading, error, data, generate, apply, reset } = useItemRewrite();
  const [notes, setNotes] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const [draft, setDraft] = useState<any>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (open && itemId) {
      setPicked(null); setDraft(null); setNotes("");
      generate(kind, itemId, flags);
    }
    if (!open) reset();
  }, [open, itemId, kind, flags.join(","), generate, reset]);

  const suggestions = data?.suggestions ?? [];

  const pick = (i: number) => {
    setPicked(i);
    setDraft(JSON.parse(JSON.stringify(suggestions[i])));
  };

  const handleApply = async () => {
    if (!itemId || !draft) return;
    setApplying(true);
    try {
      const res = await apply(kind, itemId, draft, flags);
      toast.success("Item updated. Serve counters reset.");
      onApplied?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> AI rewrite & translate
          </SheetTitle>
          <SheetDescription className="text-xs">
            Rewrite resets serve counters. Translation saves a sidecar copy without touching the original.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="rewrite" className="mt-3">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="rewrite" className="text-xs"><Sparkles className="h-3 w-3 mr-1" /> Rewrite</TabsTrigger>
            <TabsTrigger value="translate" className="text-xs"><Languages className="h-3 w-3 mr-1" /> Translate</TabsTrigger>
          </TabsList>

          <TabsContent value="rewrite" className="space-y-3 py-3">
          <div className="flex flex-wrap gap-1.5">
            {flags.map(f => <Badge key={f} variant="destructive" className="text-[10px]">{f}</Badge>)}
          </div>

          {!picked && (
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-widest">Optional author notes</Label>
              <Textarea
                placeholder="e.g. keep the example domain, add a numerical edge case…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="text-xs min-h-[64px]"
              />
              <Button
                size="sm" variant="outline"
                disabled={loading || !itemId}
                onClick={() => itemId && generate(kind, itemId, flags, notes)}
              >
                Regenerate with notes
              </Button>
            </div>
          )}

          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          )}

          {error && !loading && (
            <Card><CardContent className="py-4 text-center space-y-2">
              <AlertTriangle className="h-5 w-5 mx-auto text-destructive" />
              <p className="text-xs text-muted-foreground">{error}</p>
              <Button size="sm" variant="outline" onClick={() => itemId && generate(kind, itemId, flags, notes)}>
                Retry
              </Button>
            </CardContent></Card>
          )}

          {!loading && !error && picked === null && suggestions.map((s, i) => (
            <Card key={i} className="border-primary/20">
              <CardContent className="py-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold">{s.label}</p>
                  <Button size="sm" onClick={() => pick(i)}>Use this</Button>
                </div>
                <p className="text-[11px] text-muted-foreground">{s.change_summary}</p>
                {kind === "quiz" ? (
                  <QuizPreview s={s as QuizSuggestion} />
                ) : (
                  <ScenarioPreview s={s as ScenarioSuggestion} />
                )}
              </CardContent>
            </Card>
          ))}

          {picked !== null && draft && (
            <Card>
              <CardContent className="py-3 space-y-3">
                {kind === "quiz" ? (
                  <QuizEditor draft={draft} setDraft={setDraft} />
                ) : (
                  <ScenarioEditor draft={draft} setDraft={setDraft} />
                )}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                  <Button size="sm" variant="ghost" onClick={() => { setPicked(null); setDraft(null); }}>
                    Back to options
                  </Button>
                  <Button size="sm" onClick={handleApply} disabled={applying}>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    {applying ? "Applying…" : "Apply revision"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          </TabsContent>

          <TabsContent value="translate" className="py-3">
            <TranslatePanel kind={kind} itemId={itemId} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function TranslatePanel({ kind, itemId }: { kind: "quiz" | "scenario"; itemId: string | null }) {
  const { loading, applying, draft, setDraft, generate, apply } = useItemTranslate();
  const [lang, setLang] = useState<string>("bn");
  const [edited, setEdited] = useState<any>(null);

  useEffect(() => { setEdited(draft?.translated ?? null); }, [draft]);

  if (!itemId) return null;

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label className="text-[11px] uppercase tracking-widest">Target language</Label>
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SUPPORTED_TRANSLATION_LANGS.map(l => (
                <SelectItem key={l.code} value={l.code} className="text-xs">{l.name} ({l.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" disabled={loading} onClick={() => generate(itemId, kind, lang)}>
          {loading ? "Generating…" : draft ? "Regenerate" : "Generate"}
        </Button>
      </div>

      {loading && <Skeleton className="h-32 w-full rounded-xl" />}

      {draft && edited && (
        <div className="space-y-3">
          <Card><CardContent className="py-3 space-y-2">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Original</p>
            <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-2 rounded">{JSON.stringify(draft.source, null, 2)}</pre>
          </CardContent></Card>

          <Card className="border-primary/30"><CardContent className="py-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-widest text-primary">Translation ({draft.language_name})</p>
              <Badge variant="outline" className="text-[10px]">editable</Badge>
            </div>
            <Textarea
              value={JSON.stringify(edited, null, 2)}
              onChange={e => {
                try { setEdited(JSON.parse(e.target.value)); } catch { /* ignore parse-in-progress */ }
              }}
              className="text-xs font-mono min-h-[180px]"
            />
            <div className="flex justify-end pt-2 border-t border-border/40">
              <Button size="sm" disabled={applying} onClick={() => apply(itemId, kind, draft.language_code, edited, "ai")}>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                {applying ? "Saving…" : `Save ${draft.language_code} translation`}
              </Button>
            </div>
          </CardContent></Card>
        </div>
      )}
    </div>
  );
}

function QuizPreview({ s }: { s: QuizSuggestion }) {
  return (
    <div className="space-y-1.5 text-xs">
      <p className="font-medium">{s.question}</p>
      <ul className="space-y-1">
        {s.options.map((o, i) => (
          <li key={i} className={i === s.correct_index ? "text-success-green font-bold" : "text-muted-foreground"}>
            {String.fromCharCode(65 + i)}. {o}
          </li>
        ))}
      </ul>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Difficulty: {s.difficulty}</p>
    </div>
  );
}

function ScenarioPreview({ s }: { s: ScenarioSuggestion }) {
  return (
    <div className="space-y-1.5 text-xs">
      <p className="font-medium">{s.title}</p>
      <p className="text-muted-foreground whitespace-pre-wrap line-clamp-6">{s.scenario_prompt}</p>
      <div className="space-y-0.5 pt-1">
        {s.rubric.map((r, i) => (
          <p key={i} className="text-[11px]">
            <span className="font-bold">{r.criterion}</span>{" "}
            <span className="text-muted-foreground">({Math.round(r.weight * 100)}%) — {r.description}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function QuizEditor({ draft, setDraft }: { draft: any; setDraft: (d: any) => void }) {
  const upd = (k: string, v: any) => setDraft({ ...draft, [k]: v });
  const updOpt = (i: number, v: string) => {
    const next = [...(draft.options ?? [])]; next[i] = v; setDraft({ ...draft, options: next });
  };
  return (
    <div className="space-y-2 text-xs">
      <Label className="text-[11px] uppercase tracking-widest">Question</Label>
      <Textarea value={draft.question ?? ""} onChange={e => upd("question", e.target.value)} className="text-xs min-h-[64px]" />
      <Label className="text-[11px] uppercase tracking-widest">Options (mark correct)</Label>
      {(draft.options ?? []).map((o: string, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <Button
            type="button" size="sm"
            variant={draft.correct_index === i ? "default" : "outline"}
            className="w-8 h-8 p-0"
            onClick={() => upd("correct_index", i)}
          >
            {String.fromCharCode(65 + i)}
          </Button>
          <Input value={o} onChange={e => updOpt(i, e.target.value)} className="text-xs h-8" />
        </div>
      ))}
      <Label className="text-[11px] uppercase tracking-widest">Difficulty</Label>
      <div className="flex gap-1">
        {(["easy", "medium", "hard"] as const).map(d => (
          <Button key={d} size="sm" variant={draft.difficulty === d ? "default" : "outline"} onClick={() => upd("difficulty", d)} className="capitalize">
            {d}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ScenarioEditor({ draft, setDraft }: { draft: any; setDraft: (d: any) => void }) {
  const upd = (k: string, v: any) => setDraft({ ...draft, [k]: v });
  const updRub = (i: number, k: string, v: any) => {
    const next = [...(draft.rubric ?? [])];
    next[i] = { ...next[i], [k]: v };
    setDraft({ ...draft, rubric: next });
  };
  return (
    <div className="space-y-2 text-xs">
      <Label className="text-[11px] uppercase tracking-widest">Title</Label>
      <Input value={draft.title ?? ""} onChange={e => upd("title", e.target.value)} className="text-xs h-8" />
      <Label className="text-[11px] uppercase tracking-widest">Scenario prompt</Label>
      <Textarea value={draft.scenario_prompt ?? ""} onChange={e => upd("scenario_prompt", e.target.value)} className="text-xs min-h-[120px]" />
      <Label className="text-[11px] uppercase tracking-widest">Rubric</Label>
      {(draft.rubric ?? []).map((r: any, i: number) => (
        <div key={i} className="space-y-1 border border-border/40 rounded-lg p-2">
          <Input value={r.criterion ?? ""} onChange={e => updRub(i, "criterion", e.target.value)} placeholder="Criterion" className="text-xs h-7" />
          <Input
            type="number" step="0.05" min={0} max={1}
            value={r.weight ?? 0}
            onChange={e => updRub(i, "weight", Number(e.target.value))}
            className="text-xs h-7" placeholder="Weight 0–1"
          />
          <Textarea value={r.description ?? ""} onChange={e => updRub(i, "description", e.target.value)} className="text-xs min-h-[48px]" placeholder="Description" />
        </div>
      ))}
    </div>
  );
}
