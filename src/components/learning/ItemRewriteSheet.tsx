import { useEffect, useMemo, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { AlertTriangle, Sparkles, Check, Languages, ArrowLeft, ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useItemRewrite, type QuizSuggestion, type ScenarioSuggestion } from "@/hooks/useItemRewrite";
import { useItemTranslate, SUPPORTED_TRANSLATION_LANGS } from "@/hooks/useItemTranslate";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: "quiz" | "scenario";
  itemId: string | null;
  flags: string[];
  onApplied?: () => void;
}

/**
 * GroUp Academy: Psychometric Item Calibration Hub (ItemRewriteSheet)
 * CTO Reference: Authoritative slide-out controller for generative content rewrites and multi-lingual translation sidecars.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ItemRewriteSheet({ open, onOpenChange, kind, itemId, flags = [], onApplied }: Props) {
  const queryClient = useQueryClient();
  const { loading, error, data, generate, apply, reset } = useItemRewrite();

  const [notes, setNotes] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const [draft, setDraft] = useState<any>(null);
  const [applying, setApplying] = useState(false);

  // Memoize flag keys safely to disarm array pointer reconciliation loops
  const serializedFlagsKey = useMemo(() => {
    return Array.isArray(flags) ? flags.filter(Boolean).sort().join(",") : "";
  }, [flags]);

  // Monitor psychometric alignment session initialization sequences via telemetry
  useEffect(() => {
    if (open && itemId) {
      trackEvent("ai_calibration_session_started", { itemId, kind, flagsCount: flags.length });
      setPicked(null);
      setDraft(null);
      setNotes("");

      generate({ kind, itemId, flags });
    }

    if (!open) {
      reset();
    }
  }, [open, itemId, kind, serializedFlagsKey, generate, reset]);

  const suggestions = data?.suggestions ?? [];

  const handlePickSuggestionNode = (suggestionIndex: number) => {
    if (!suggestions[suggestionIndex]) return;
    trackEvent("ai_calibration_suggestion_node_selected", { suggestionIndex, itemId });

    setPicked(suggestionIndex);
    setDraft(JSON.parse(JSON.stringify(suggestions[suggestionIndex])));
  };

  const handleApplyCalibrationPatch = async () => {
    if (!itemId || !draft) return;

    setApplying(true);
    const toastId = toast.loading("Applying psychometric item modifications into main core registry...");

    trackEvent("ai_calibration_patch_requested", { itemId, kind });

    try {
      await apply({ kind, itemId, patch: draft, flagsAddressed: flags });

      // Automated Efficiency: Synchronize cache streams immediately across workspace panels
      queryClient.invalidateQueries({ queryKey: ["item-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["module-analytics"] });

      toast.success("Calibration item synchronized cleanly. Counter metrics reset.", { id: toastId });
      trackEvent("ai_calibration_patch_success", { itemId });

      if (onApplied) onApplied();
      onOpenChange(false);
    } catch (err: any) {
      const parsedExceptionMsg = err instanceof Error ? err.message : String(err);

      trackError(parsedExceptionMsg, {
        component: "ItemRewriteSheet",
        action: "apply_calibration_patch_api",
        itemId,
        kind,
      });

      toast.error(`Ecosystem calibration processing error: ${parsedExceptionMsg}`, { id: toastId });
    } finally {
      setApplying(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(visibleState) => {
        if (!applying) {
          onOpenChange(visibleState);
          if (!visibleState) trackEvent("ai_calibration_session_dismissed", { itemId });
        }
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-background/98 backdrop-blur-xl border-l border-border/40 overflow-y-auto p-6 pt-safe pb-safe-bottom antialiased select-none sm:select-text transform-gpu shadow-2xl transition-all duration-300 flex flex-col h-full max-h-[100vh] max-h-[100svh]"
        style={{ contentVisibility: "auto" }}
      >
        {/* HUD LEVEL 1: BRANDED UTILITY TITLE HEADER STRIP */}
        <SheetHeader className="text-left select-none border-b border-border/10 pb-4 shrink-0 w-full">
          <SheetTitle className="text-base font-bold tracking-tight text-foreground/90 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary fill-primary/10 animate-pulse stroke-[2.2]" />
            <span>AI Calibration & Localized Translation Interface</span>
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground/80 leading-normal mt-1">
            Dynamic optimization shifts baseline psychometric items, resetting system exposure tallies. Multi-lingual
            localization persists decoupled copies into sidecar stores without altering core schemas.
          </SheetDescription>
        </SheetHeader>

        {/* HUD LEVEL 2: FUNCTIONAL MULTI-TIER PROCESSING TABS */}
        <Tabs
          defaultValue="rewrite"
          className="mt-3 flex-1 flex flex-col min-w-0 w-full"
          onValueChange={(tabValue) => {
            trackEvent("ai_calibration_tab_swapped", { activeTab: tabValue, itemId });
          }}
        >
          <TabsList className="grid grid-cols-2 bg-muted/30 border border-border/40 rounded-xl select-none p-1 shrink-0 w-full">
            <TabsTrigger
              value="rewrite"
              className="text-xs font-bold uppercase tracking-wider rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5 py-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary stroke-[2.2]" /> <span>Generative Rewrite</span>
            </TabsTrigger>
            <TabsTrigger
              value="translate"
              className="text-xs font-bold uppercase tracking-wider rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5 py-1.5"
            >
              <Languages className="h-3.5 w-3.5 text-primary stroke-[2.2]" /> <span>Locale Translation</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB SEGMENT A: GENERATIVE AI REWRITE PROTOCOLS */}
          <TabsContent value="rewrite" className="space-y-4 py-3 flex-1 flex flex-col min-w-0 overflow-y-auto pr-1">
            <div className="flex flex-wrap items-center gap-1.5 select-none w-full max-w-full">
              {flags.filter(Boolean).map((flagItem) => (
                <Badge
                  key={flagItem}
                  variant="destructive"
                  className="text-[9px] font-extrabold px-2 h-5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm uppercase tracking-wide leading-none flex items-center shrink-0"
                >
                  Anomaly: {flagItem?.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>

            {!picked && (
              <div className="space-y-2 p-3.5 rounded-xl border border-border/40 bg-card/30 text-left w-full select-none shadow-sm animate-in fade-in duration-200 shrink-0">
                <Label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block pl-0.5">
                  Strategic Custom Context Directives
                </Label>
                <Textarea
                  placeholder="E.g. Maintain initial commercial entity variables, add multi-currency parsing limits, or append strict edge case scenarios..."
                  value={notes}
                  disabled={loading}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs sm:text-sm font-medium border border-border/30 bg-background/50 focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary/40 leading-relaxed min-h-[64px] resize-none select-text p-3 rounded-xl"
                />
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  disabled={loading || !itemId}
                  onClick={() => {
                    trackEvent("ai_calibration_regeneration_requested", { itemId, notesLength: notes.length });
                    if (itemId) generate({ kind, itemId, flags, notes: notes.trim() });
                  }}
                  className="h-8 rounded-xl font-bold uppercase text-[10px] tracking-wide border-border/60 hover:bg-accent mt-1.5 shadow-sm cursor-pointer"
                >
                  <RefreshCw className={cn("h-3 w-3 mr-1 text-primary stroke-[2.2]", loading && "animate-spin")} />
                  <span>Regenerate Suggestions Matrix</span>
                </Button>
              </div>
            )}

            {loading && (
              <div className="space-y-3.5 select-none w-full animate-pulse flex-1">
                <Skeleton className="h-28 w-full rounded-2xl opacity-60" />
                <Skeleton className="h-44 w-full rounded-2xl opacity-40" />
              </div>
            )}

            {error && !loading && (
              <Card className="border border-rose-500/20 bg-rose-500/5 rounded-2xl text-left w-full max-w-full shrink-0">
                <CardContent className="p-5 text-center space-y-4 select-none">
                  <AlertTriangle className="h-5 w-5 mx-auto text-rose-500 stroke-[2.2]" />
                  <p className="text-xs font-semibold text-muted-foreground/80 italic select-text selection:bg-rose-500/10 leading-normal">
                    {error}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => {
                      trackEvent("ai_calibration_retry_triggered", { itemId });
                      if (itemId) generate({ kind, itemId, flags, notes: notes.trim() });
                    }}
                    className="h-8 rounded-xl border-border/60 hover:bg-accent font-bold uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer"
                  >
                    <span>Retry Ingress Sync</span>
                  </Button>
                </CardContent>
              </Card>
            )}

            {!loading &&
              !error &&
              picked === null &&
              suggestions.map((suggestionItem, index) => {
                if (!suggestionItem) return null;
                return (
                  <Card
                    key={index}
                    className="border border-primary/20 bg-primary/[0.005] dark:bg-primary/[0.001] rounded-2xl shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-200 text-left w-full"
                  >
                    <CardContent className="p-4 space-y-3 w-full min-w-0">
                      <div className="flex items-center justify-between gap-4 select-none border-b border-border/10 pb-2 w-full leading-none">
                        <p className="text-xs font-extrabold text-foreground/90 uppercase tracking-wide truncate max-w-[70%]">
                          {suggestionItem.label || `Calibration Variant Node #${index + 1}`}
                        </p>
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => handleSelectedSuggestionNode(index)}
                          className="h-7 px-3 text-[10px] font-bold tracking-wide uppercase rounded-xl shadow-sm active:scale-95 transition-transform cursor-pointer shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <span>Select Option Model</span>
                        </Button>
                      </div>

                      <div className="p-3 bg-muted/20 border border-border/20 rounded-xl select-text text-left">
                        <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider block mb-0.5 select-none leading-none pl-0.5">
                          Generative Optimization Audit Summary
                        </span>
                        <p className="text-[11px] font-medium leading-relaxed italic text-muted-foreground/90 break-words pl-0.5 pr-2">
                          {suggestionItem.change_summary || "Adjusting structure parameters safely."}
                        </p>
                      </div>

                      <div className="pt-1.5 border-t border-border/5 w-full min-w-0">
                        {kind === "quiz" ? (
                          <QuizPreview s={suggestionItem as QuizSuggestion} />
                        ) : (
                          <ScenarioPreview s={suggestionItem as ScenarioSuggestion} />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

            {picked !== null && draft && (
              <Card className="border border-border/40 bg-card rounded-2xl shadow-sm overflow-hidden animate-in zoom-in-98 duration-200 text-left w-full">
                <CardContent className="p-4 space-y-4 w-full min-w-0">
                  {kind === "quiz" ? (
                    <QuizEditor draft={draft} setDraft={setDraft} />
                  ) : (
                    <ScenarioEditor draft={draft} setDraft={setDraft} />
                  )}

                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/20 select-none w-full leading-none">
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => {
                        trackEvent("ai_calibration_editor_back_clicked", { itemId });
                        setPicked(null);
                        setDraft(null);
                      }}
                      className="h-8 rounded-xl font-bold text-[10px] uppercase border border-border/40 text-muted-foreground hover:bg-accent tracking-tight flex items-center gap-1 cursor-pointer shadow-sm transition-transform active:scale-95"
                    >
                      <ArrowLeft className="h-3 w-3 stroke-[2.5]" />
                      <span>Back to Suggestions</span>
                    </Button>

                    <Button
                      size="sm"
                      type="button"
                      onClick={handleApplyCalibrationPatch}
                      disabled={applying}
                      className="h-8 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-wide gap-1.5 cursor-pointer shadow-sm shrink-0 transition-transform active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {applying ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                          <span>Committing Alignment…</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                          <span>Commit Revision Framework</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB SEGMENT B: DECOUPLED SIDE-CAR LOCALE TRANSLATION PIPELINE */}
          <TabsContent value="translate" className="py-3 flex-1 flex flex-col min-w-0 overflow-y-auto pr-1">
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

  // 2. Safe Parsing Hardening Strategy: Decouple raw string values from real-time JSON validation locks
  const [rawJsonTextString, setRawJsonTextString] = useState("");
  const [isJsonTextStringValid, setIsJsonTextStringValid] = useState(true);

  // Hydrate local string state records when model payload mutations resolve
  useEffect(() => {
    if (draft?.translated) {
      const stringifiedPayload = JSON.stringify(draft.translated, null, 2);
      setRawJsonTextString(stringifiedPayload);
      setIsJsonTextStringValid(true);
    } else {
      setRawJsonTextString("");
      setIsJsonTextStringValid(true);
    }
  }, [draft]);

  if (!itemId) return null;

  const handleLanguageTriggerSelection = (targetLanguageCodeStr: string) => {
    if (!targetLanguageCodeStr) return;
    trackEvent("ai_translation_lang_changed", { itemId, targetLanguageCode: targetLanguageCodeStr });
    setLang(targetLanguageCodeStr);
  };

  const handleApplyTranslationPayload = async () => {
    if (!draft || !rawJsonTextString.trim()) return;

    try {
      // Final confirmation validation boundary pass ahead of remote socket dispatch
      const validatedJsonPayloadNode = JSON.parse(rawJsonTextString.trim());

      trackEvent("ai_translation_save_requested", { itemId, langCode: draft.language_code });
      const toastId = toast.loading(
        `Persisting localized sidecar dictionary [${draft.language_code}] into repository...`,
      );

      await apply({
        item_id: itemId,
        item_type: kind,
        language_code: draft.language_code,
        payload: validatedJsonPayloadNode,
        source: "ai",
      });

      toast.success(`Decoupled translation node [${draft.language_code.toUpperCase()}] committed successfully`, {
        id: toastId,
      });
      trackEvent("ai_translation_save_success", { itemId, langCode: draft.language_code });
    } catch (parseValidationErr) {
      toast.error("Lexical compilation lock: The mutation state buffer contains malformed structural syntax.");
      setIsJsonTextStringValid(false);
    }
  };

  return (
    <div className="space-y-4 text-left font-bold text-xs tracking-tight text-foreground/90 w-full min-w-0">
      <div className="flex gap-3.5 items-end w-full select-none">
        <div className="flex-1 text-left space-y-1">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block pl-0.5">
            Target Destination Locale
          </Label>
          <Select value={lang} onValueChange={handleLanguageTriggerSelection} disabled={loading}>
            <SelectTrigger className="w-full h-9 rounded-xl border border-border/40 bg-card/40 focus:ring-1 focus:ring-ring text-xs font-bold tracking-tight cursor-pointer">
              <SelectValue placeholder="Select target dictionary locale" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-border/40 shadow-xl bg-background/95 backdrop-blur-md font-semibold text-xs text-foreground/90 select-none">
              {SUPPORTED_TRANSLATION_LANGS.map((l) => (
                <SelectItem key={l.code} value={l.code} className="cursor-pointer font-bold py-2 text-xs">
                  {l.name} ({l.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          size="sm"
          type="button"
          disabled={loading}
          onClick={() => {
            trackEvent("ai_translation_generation_triggered", { itemId, targetLanguageCode: lang });
            generate({ item_id: itemId, item_type: kind, target_language: lang });
          }}
          className="h-9 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-wide shrink-0 shadow-sm transition-transform active:scale-[0.99] cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
              <span>Translating Node…</span>
            </>
          ) : (
            <span>Compile Language Sidecar</span>
          )}
        </Button>
      </div>

      {loading && <Skeleton className="h-36 w-full rounded-2xl select-none opacity-60 animate-pulse mt-2" />}

      {draft && rawJsonTextString && (
        <div className="space-y-4 text-left w-full min-w-0 animate-in fade-in duration-300">
          <Card className="border border-border/40 bg-muted/10 rounded-2xl shadow-sm overflow-hidden select-text text-left w-full min-w-0">
            <CardContent className="p-3.5 space-y-1.5 w-full min-w-0">
              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider block select-none leading-none pl-0.5">
                Original Source Document Reference
              </span>
              <pre className="text-xs font-mono font-medium whitespace-pre-wrap bg-muted/40 border p-3 rounded-xl max-h-40 overflow-y-auto selection:bg-primary/10 select-all leading-relaxed break-all w-full">
                {JSON.stringify(draft.source, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "border border-border/40 bg-card rounded-2xl shadow-sm overflow-hidden w-full min-w-0 text-left",
              !isJsonTextStringValid && "border-rose-500/30 shadow-[0_0_15px_-5px_rgba(239,68,68,0.2)]",
            )}
          >
            <CardContent className="p-4 space-y-3.5 w-full min-w-0">
              <div className="flex items-center justify-between gap-4 select-none leading-none border-b border-border/10 pb-2 w-full">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary pl-0.5">
                  Localized Manifest Modification Array ({draft.language_name || draft.language_code?.toUpperCase()})
                </p>
                <Badge
                  variant={isJsonTextStringValid ? "outline" : "destructive"}
                  className="text-[9px] font-extrabold h-4.5 px-2 rounded tracking-wide uppercase select-none shadow-sm leading-none flex items-center shrink-0"
                >
                  {isJsonTextStringValid ? "Editable Buffer Token" : "Malformed JSON Syntax"}
                </Badge>
              </div>

              {/* Textarea buffer updates live character arrays safely without triggering realtime parsing runtime exceptions */}
              <Textarea
                value={rawJsonTextString}
                onChange={(e) => {
                  const runningTextStringValue = e.target.value;
                  setRawJsonTextString(runningTextStringValue);

                  // Proactive inline lint verification validation pass shortcut checklist
                  try {
                    JSON.parse(runningTextStringValue.trim());
                    setIsJsonTextStringValid(true);
                  } catch {
                    setIsJsonTextStringValid(false); // Flag lexical syntax discrepancy visually
                  }
                }}
                className={cn(
                  "text-xs font-mono font-semibold min-h-[160px] max-h-64 p-3.5 leading-relaxed bg-muted/20 border border-border/30 rounded-xl resize-y focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary/40 text-foreground/90 select-text",
                  !isJsonTextStringValid &&
                    "focus-visible:ring-rose-500/30 focus-visible:border-rose-500/40 text-rose-700 dark:text-rose-400 font-bold",
                )}
              />

              <div className="flex justify-end pt-1.5 border-t border-border/5 select-none w-full">
                <Button
                  size="sm"
                  type="button"
                  disabled={applying || !isJsonTextStringValid || !rawJsonTextString.trim()}
                  onClick={handleApplyTranslationPayload}
                  className="h-8 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-wide gap-1.5 shrink-0 shadow-sm transition-transform active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {applying ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                      <span>Saving Dictionary…</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Save Localized Sidecar</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function QuizPreview({ s }: { s: QuizSuggestion }) {
  if (!s) return null;
  const optionsCollectionBuffer = Array.isArray(s.options) ? s.options : [];

  return (
    <div className="space-y-2 text-xs font-bold text-foreground/90 tracking-tight text-left w-full min-w-0">
      <p className="font-extrabold text-sm sm:text-base leading-snug break-words select-text">{s.question}</p>
      <ul className="space-y-1.5 w-full min-w-0 select-text font-semibold">
        {optionsCollectionBuffer.map((optionTextItem, optionIdx) => {
          const isCorrectIndexNode = optionIdx === Number(s.correct_index);
          return (
            <li
              key={optionIdx}
              className={cn(
                "p-2.5 rounded-xl border flex items-start gap-2.5 break-all leading-tight",
                isCorrectIndexNode
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold"
                  : "bg-muted/10 border-border/20 text-muted-foreground/90 font-medium",
              )}
            >
              <span
                className={cn(
                  "h-5 w-5 rounded-md flex items-center justify-center border text-[10px] font-mono shrink-0 select-none",
                  isCorrectIndexNode
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                    : "bg-background border-border/40 text-muted-foreground",
                )}
              >
                {String.fromCharCode(64 + optionIdx + 1)}
              </span>
              <span className="flex-1 min-w-0 pt-0.5">{optionTextItem}</span>
            </li>
          );
        })}
      </ul>
      <div className="pt-1.5 border-t border-border/5 select-none">
        <Badge
          variant="outline"
          className="text-[9px] font-extrabold h-4.5 rounded uppercase tracking-wider bg-background/50 border-border/40 text-muted-foreground/80 shadow-sm px-2"
        >
          Target Difficulty Complexity: {s.difficulty || "Standard"}
        </Badge>
      </div>
    </div>
  );
}

function ScenarioPreview({ s }: { s: ScenarioSuggestion }) {
  if (!s) return null;
  const rubricRowsCollectionBuffer = Array.isArray(s.rubric) ? s.rubric : [];

  return (
    <div className="space-y-3.5 text-xs font-bold text-foreground/90 tracking-tight text-left w-full min-w-0">
      <p className="font-extrabold text-sm sm:text-base leading-tight break-words select-text pr-1">{s.title}</p>
      <p className="text-muted-foreground/80 font-medium whitespace-pre-wrap line-clamp-6 leading-relaxed select-text break-words bg-muted/10 p-3 rounded-xl border border-border/10 shadow-inner">
        {s.scenario_prompt}
      </p>

      <div className="space-y-1.5 pt-1 w-full min-w-0 text-left">
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/60 block pl-0.5 select-none leading-none mb-1">
          Target Psychometric Evaluation Criteria rubrics
        </span>
        <div className="space-y-2 w-full min-w-0 select-text">
          {rubricRowsCollectionBuffer.map((rubricRowItem, rowIdx) => {
            if (!rubricRowItem) return null;
            return (
              <p
                key={rowIdx}
                className="text-[11px] sm:text-xs font-bold leading-normal break-words flex flex-col sm:flex-row sm:items-start gap-1 p-2 rounded-xl bg-muted/20 border border-border/10 shadow-sm"
              >
                <span className="text-primary font-extrabold uppercase tracking-wider text-[10px] shrink-0 sm:w-28 truncate select-none border-b sm:border-b-0 sm:border-r border-border/20 pb-0.5 sm:pb-0 sm:pr-2 block mb-0.5 sm:mb-0 tabular-nums">
                  {rowIdx + 1}. {rubricRowItem.criterion}:
                </span>{" "}
                <span className="text-muted-foreground/90 font-medium flex-1 min-w-0">
                  <span className="font-mono text-foreground/90 font-bold bg-muted/40 border rounded px-1 py-0.5 text-[10px] shadow-sm tracking-wide shrink-0 select-none mr-1.5 leading-none tabular-nums">
                    {Math.round(Number(rubricRowItem.weight || 0) * 100)}% weight
                  </span>
                  <span>{rubricRowItem.description}</span>
                </span>
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuizEditor({ draft, setDraft }: { draft: any; setDraft: (d: any) => void }) {
  const upd = (k: string, v: any) => setDraft({ ...draft, [k]: v });
  const updOpt = (i: number, v: string) => {
    const next = [...(draft.options ?? [])];
    next[i] = v;
    setDraft({ ...draft, options: next });
  };

  const optionsCollectionBuffer = Array.isArray(draft.options) ? draft.options : [];

  return (
    <div className="space-y-3.5 text-xs font-bold text-foreground/90 tracking-tight text-left w-full min-w-0">
      <div className="space-y-1 w-full text-left">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block pl-0.5 select-none">
          Question Stem Formula
        </Label>
        <Textarea
          value={draft.question ?? ""}
          onChange={(e) => upd("question", e.target.value)}
          className="text-xs sm:text-sm font-semibold text-foreground/90 border border-border/30 bg-muted/10 rounded-xl leading-relaxed p-3.5 resize-none min-h-[64px] focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary/40 select-text"
        />
      </div>

      <div className="space-y-1.5 w-full text-left">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block pl-0.5 select-none">
          Distractor Options Array Layout Matrix (Select correct parameter key)
        </Label>
        <div className="space-y-2 w-full select-none">
          {optionsCollectionBuffer.map((optionStrItem, index) => {
            const isTargetCorrectOptionNode = Number(draft.correct_index) === index;
            return (
              <div
                key={index}
                className="flex items-center gap-2.5 w-full group animate-in slide-in-from-left-1 duration-150"
              >
                <Button
                  type="button"
                  size="sm"
                  variant={isTargetCorrectOptionNode ? "default" : "outline"}
                  className={cn(
                    "w-8 h-8 rounded-lg font-mono font-extrabold text-xs shrink-0 select-none p-0 transition-transform active:scale-90 cursor-pointer shadow-sm border border-border/60",
                    isTargetCorrectOptionNode &&
                      "bg-emerald-600 hover:bg-emerald-600 border-transparent text-white shadow-inner",
                  )}
                  onClick={() => {
                    trackEvent("ai_calibration_editor_key_marked", { correctIdx: index });
                    upd("correct_index", index);
                  }}
                >
                  <span>{String.fromCharCode(64 + index + 1)}</span>
                </Button>
                <Input
                  value={optionStrItem || ""}
                  onChange={(e) => updOpt(index, e.target.value)}
                  className="text-xs sm:text-sm font-semibold h-8 rounded-xl border border-border/40 bg-card/40 focus-visible:ring-1 focus-visible:ring-ring text-foreground/90 select-text shadow-sm w-full"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5 pt-1 border-t border-border/10 w-full text-left select-none">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block pl-0.5">
          Ecosystem Target Complexity Difficulty
        </Label>
        <div className="flex flex-wrap items-center gap-1.5">
          {(["easy", "medium", "hard"] as const).map((diffTokenStr) => {
            const isDiffActive = draft.difficulty === diffTokenStr;
            return (
              <Button
                key={diffTokenStr}
                size="sm"
                type="button"
                variant={isDiffActive ? "default" : "outline"}
                onClick={() => {
                  trackEvent("ai_calibration_editor_difficulty_swapped", { difficulty: diffTokenStr });
                  upd("difficulty", diffTokenStr);
                }}
                className={cn(
                  "capitalize rounded-lg h-7 px-3 text-[10px] font-bold tracking-wide cursor-pointer border border-border/40 shadow-sm transition-transform active:scale-90",
                  isDiffActive && "bg-primary border-transparent text-primary-foreground shadow-inner font-extrabold",
                )}
              >
                {diffTokenStr}
              </Button>
            );
          })}
        </div>
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

  const rubricsCollectionBuffer = Array.isArray(draft.rubric) ? draft.rubric : [];

  return (
    <div className="space-y-3.5 text-xs font-bold text-foreground/90 tracking-tight text-left w-full min-w-0">
      <div className="space-y-1 w-full text-left">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block pl-0.5 select-none">
          Simulation Title Heading
        </Label>
        <Input
          value={draft.title ?? ""}
          onChange={(e) => upd("title", e.target.value)}
          className="text-xs sm:text-sm font-semibold h-9 rounded-xl border border-border/40 bg-card/40 focus-visible:ring-1 focus-visible:ring-ring text-foreground/90 select-text shadow-sm w-full"
        />
      </div>

      <div className="space-y-1 w-full text-left">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block pl-0.5 select-none">
          Cognitive Simulation Prompt Context Narrative
        </Label>
        <Textarea
          value={draft.scenario_prompt ?? ""}
          onChange={(e) => upd("scenario_prompt", e.target.value)}
          className="text-xs sm:text-sm font-semibold text-foreground/90 border border-border/30 bg-muted/10 rounded-xl leading-relaxed p-3.5 resize-y min-h-[120px] max-h-48 focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary/40 select-text w-full"
        />
      </div>

      <div className="space-y-2 pt-2 border-t border-border/10 w-full text-left">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block pl-0.5 select-none">
          Evaluation Rubric Matrix Blocks
        </Label>
        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 w-full">
          {rubricsCollectionBuffer.map((rubricRowItem: any, index: number) => {
            if (!rubricRowItem) return null;
            return (
              <div
                key={index}
                className="space-y-2 border border-border/40 bg-muted/10 rounded-xl p-3 shadow-inner text-left w-full min-w-0 animate-in slide-in-from-right-1 duration-150"
              >
                <div className="grid grid-cols-1 sm:grid-cols-[1fr,120px] gap-2 w-full">
                  <Input
                    value={rubricRowItem.criterion ?? ""}
                    onChange={(e) => updRub(index, "criterion", e.target.value)}
                    placeholder="Criterion key heading"
                    className="text-xs font-bold h-7 rounded-lg border border-border/40 bg-background/50 focus-visible:ring-1 focus-visible:ring-ring select-text shadow-sm w-full"
                  />
                  <Input
                    type="number"
                    step="0.05"
                    min={0}
                    max={1}
                    value={rubricRowItem.weight ?? 0}
                    onChange={(e) => updRub(index, "weight", Number(e.target.value) || 0)}
                    className="text-xs font-mono font-bold h-7 rounded-lg border border-border/40 bg-background/50 focus-visible:ring-1 focus-visible:ring-ring text-primary select-text shadow-sm w-full tabular-nums"
                    placeholder="Weight fractional 0–1"
                  />
                </div>
                <Textarea
                  value={rubricRowItem.description ?? ""}
                  onChange={(e) => updRub(index, "description", e.target.value)}
                  className="text-xs font-medium border border-border/30 bg-background/40 focus-visible:ring-1 focus-visible:ring-ring leading-normal min-h-[44px] resize-none select-text p-2 rounded-lg w-full"
                  placeholder="Criterion performance execution threshold description..."
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
