import { useState } from "react";
import { useGtmGraph } from "./hooks/useGtmGraph";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, FileText, ShieldAlert, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function GtmKnowledgeTab() {
  const { gtmGraphQuery, mutations: { upsertKnowledgePack, deleteKnowledgePack } } = useGtmGraph();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ is_published: false, kind: "general", display_order: 0 });

  const packs = gtmGraphQuery.data?.knowledgePacks ?? [];
  const countries = gtmGraphQuery.data?.countries ?? [];

  return (
    <div className="space-y-6 p-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <FileText className="h-7 w-7 text-indigo-600" />
            <h1 className="text-3xl font-black uppercase tracking-tight">Knowledge Packs</h1>
          </div>
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">
            Country-Scoped CMS & Informational Nodes
          </p>
        </div>
        <Button
          onClick={() => { setDraft({ is_published: false, kind: "general", display_order: 0 }); setOpen(true); }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="h-4 w-4" /> Inject Content
        </Button>
      </div>

      {/* Registry Table */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-widest">Content Registry</CardTitle>
          <CardDescription>{packs.length} content nodes deployed</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content Node (Title)</TableHead>
                <TableHead>Target Country</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gtmGraphQuery.isLoading ? (
                <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ) : packs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Zero CMS nodes detected.</TableCell></TableRow>
              ) : (
                packs.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-indigo-500" />
                        <span className="font-bold">{row.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        {countries.find((c: any) => c.iso2 === row.country_code)?.name || row.country_code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-[10px] font-black">{row.kind}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={row.is_published ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}>
                        {row.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setDraft(row); setOpen(true); }} className="hover:bg-indigo-500/10 hover:text-indigo-600">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { if (confirm("Purge Content?")) deleteKnowledgePack.mutate(row.id); }} className="hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Deployment Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-indigo-600" />
              <div>
                <DialogTitle>Content Deployment</DialogTitle>
                <DialogDescription>Inject country-scoped Markdown into the platform.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Node Title</Label>
              <Input
                placeholder="e.g. Bangladesh Visa Guide"
                value={draft.title || ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="h-14 rounded-xl border-2 font-bold bg-muted/20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Country</Label>
                <Select value={draft.country_code || ""} onValueChange={(v) => setDraft({ ...draft, country_code: v })}>
                  <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {countries.map((c: any) => (
                      <SelectItem key={c.iso2} value={c.iso2}>{c.name} ({c.iso2})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Classification</Label>
                <Select value={draft.kind || "general"} onValueChange={(v) => setDraft({ ...draft, kind: v })}>
                  <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="visa">Visa & Legal</SelectItem>
                    <SelectItem value="housing">Housing</SelectItem>
                    <SelectItem value="employment">Employment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Deployment Status</Label>
                <Select value={String(draft.is_published)} onValueChange={(v) => setDraft({ ...draft, is_published: v === "true" })}>
                  <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Published</SelectItem>
                    <SelectItem value="false">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Markdown Body</Label>
              <Textarea
                placeholder="# Heading&#10;&#10;Body content..."
                value={draft.body_markdown || ""}
                onChange={(e) => setDraft({ ...draft, body_markdown: e.target.value })}
                className="min-h-[300px] rounded-2xl border-2 font-mono text-sm bg-muted/20 p-4"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Source URL (Optional)</Label>
                <Input placeholder="https://" value={draft.source_url || ""} onChange={(e) => setDraft({ ...draft, source_url: e.target.value })} className="h-12 rounded-xl border-2 font-mono text-xs bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sort Priority</Label>
                <Input type="number" placeholder="0" value={draft.display_order || 0} onChange={(e) => setDraft({ ...draft, display_order: Number(e.target.value) })} className="h-12 rounded-xl border-2 font-black bg-background/50" />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)} className="h-14 px-8 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest italic text-muted-foreground">Abort</Button>
            <Button
              disabled={!draft.title || !draft.country_code || upsertKnowledgePack.isPending}
              onClick={() => upsertKnowledgePack.mutate(draft, { onSuccess: () => setOpen(false) })}
              className="h-14 px-10 rounded-[24px] font-black uppercase italic tracking-tighter text-lg gap-3 shadow-xl flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <ShieldAlert className="h-5 w-5" /> Authorize Injection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GtmKnowledgeTab;
