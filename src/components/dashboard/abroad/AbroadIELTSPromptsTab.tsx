import { useState } from "react";
import { useAbroadGraph } from "hooks/useAbroadGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Mic, ShieldCheck, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AbroadIELTSPromptsTab() {
  const {
    abroadGraphQuery,
    mutations: { upsertIeltsAttempt, deleteIeltsAttempt },
  } = useAbroadGraph();
  const { data, isLoading } = abroadGraphQuery;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ score: 0 });

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-violet-500">
            <Mic className="h-8 w-8 text-violet-500 fill-violet-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              IELTS Attempts
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            AI Scored Mock Submissions
          </p>
        </div>
        <Button
          onClick={() => {
            setDraft({ score: 0 });
            setOpen(true);
          }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-violet-500/20 bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Plus className="h-4 w-4" /> Inject Score
        </Button>
      </header>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-400 via-purple-500 to-indigo-600" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 border-b-2 border-border/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 pl-8">
                    Prompt ID
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Talent Node</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Band Score</TableHead>
                  <TableHead className="text-right py-5 pr-8">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/5">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-20 text-center">
                      <Skeleton className="h-8 w-32 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : data?.ieltsAttempts?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-20 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground/50 italic"
                    >
                      Zero attempts detected.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.ieltsAttempts?.map((row) => (
                    <TableRow key={row.id} className="group hover:bg-violet-500/[0.02]">
                      <TableCell className="py-6 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-background border-2 border-border/20 flex items-center justify-center shrink-0">
                            <Mic className="h-3 w-3 text-violet-500" />
                          </div>
                          <span className="font-mono text-xs uppercase tracking-tight text-muted-foreground">
                            {row.prompt_id?.substring(0, 8) || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-[10px] text-foreground font-black flex items-center gap-1.5">
                          <User className="h-3 w-3 text-violet-500" />{" "}
                          {row.user_id ? row.user_id.substring(0, 8) : "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {row.score ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black uppercase text-sm tracking-widest">
                            Band {row.score}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-amber-500 border-amber-500/20 bg-amber-500/10 font-bold uppercase text-[9px] tracking-widest"
                          >
                            Pending Scoring
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDraft(row);
                              setOpen(true);
                            }}
                            className="hover:bg-violet-500/10 hover:text-violet-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm("Purge Attempt?")) deleteIeltsAttempt.mutate(row.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[40px] p-8 border-4 border-border/40 text-left">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-violet-500 flex items-center gap-2">
              <Mic className="h-6 w-6" /> Evaluate Attempt
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic">
              Update AI or manual band score.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Prompt Node ID
                </Label>
                <Input
                  placeholder="UUID"
                  value={draft.prompt_id || ""}
                  onChange={(e) => setDraft({ ...draft, prompt_id: e.target.value })}
                  className="h-14 rounded-xl border-2 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Talent User ID
                </Label>
                <Input
                  placeholder="UUID"
                  value={draft.user_id || ""}
                  onChange={(e) => setDraft({ ...draft, user_id: e.target.value })}
                  className="h-14 rounded-xl border-2 font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-1">
                Band Score (0-9)
              </Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="9"
                placeholder="e.g. 7.5"
                value={draft.score || ""}
                onChange={(e) => setDraft({ ...draft, score: Number(e.target.value) })}
                className="h-14 rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 font-black text-emerald-600 text-lg"
              />
            </div>
          </div>
          <Button
            disabled={!draft.user_id || upsertIeltsAttempt.isPending}
            onClick={() => {
              const payload = { ...draft, ai_band_score: draft.score };
              delete payload.score;
              delete payload.status;
              upsertIeltsAttempt.mutate(payload, { onSuccess: () => setOpen(false) });
            }}
            className="h-14 rounded-xl font-black uppercase bg-violet-600 hover:bg-violet-700 text-white"
          >
            <ShieldCheck className="mr-2 h-5 w-5" /> Enforce Score
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AbroadIELTSPromptsTab;
