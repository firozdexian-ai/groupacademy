import { useState } from "react";
import { useMarketingGraph } from "./hooks/useMarketingGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Palette } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ImageUpload";

const defaultDraft: any = {
  name: "",
  priority: 0,
  media_type: "gradient",
  gradient_css: "linear-gradient(135deg,#2A7DDE,#33E1E4)",
  overlay_opacity: 0.4,
  text_color: "light",
  is_active: true,
};

export function ThemesTab() {
  const { marketingGraphQuery, mutations: { upsertTheme, deleteTheme } } = useMarketingGraph();
  const { data, isLoading } = marketingGraphQuery;

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>(defaultDraft);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20">
            <Palette className="h-6 w-6 text-fuchsia-600" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Themes</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
              Profile Card Aesthetics
            </p>
          </div>
        </div>
        <Button
          onClick={() => { setDraft(defaultDraft); setOpen(true); }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-fuchsia-500/20 bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
        >
          <Plus className="h-4 w-4" /> Inject Theme
        </Button>
      </div>

      <Card className="rounded-3xl border-2 border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Theme Definition</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4}><Skeleton className="h-16 w-full" /></TableCell></TableRow>
              ) : data?.themes?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 italic uppercase font-black text-xs tracking-widest opacity-30">Zero themes detected.</TableCell></TableRow>
              ) : (
                data?.themes?.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-12 w-12 rounded-xl border-2 border-border/40 shrink-0 overflow-hidden"
                          style={{ background: row.gradient_css || "#2A7DDE" }}
                        >
                          {row.media_type !== "gradient" && (row.poster_url || row.media_url) && (
                            <img src={row.poster_url || row.media_url} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="font-black uppercase text-sm">{row.name || "Untitled"}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Rank {row.priority}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-black uppercase text-[10px]">{row.media_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!row.is_active}
                          onCheckedChange={(checked) => upsertTheme.mutate({ id: row.id, is_active: checked })}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest">{row.is_active ? "LIVE" : "IDLE"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setDraft(row); setOpen(true); }} className="hover:bg-fuchsia-500/10 hover:text-fuchsia-600">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:bg-rose-500/10 hover:text-rose-600" onClick={() => { if (confirm("Purge Theme?")) deleteTheme.mutate(row.id); }}>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase italic tracking-tighter text-xl">Inject Theme</DialogTitle>
            <DialogDescription>Update profile card aesthetics.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Theme Name</Label>
              <Input
                value={draft.name || ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="h-12 rounded-xl border-2 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label>Media Type</Label>
              <Select value={draft.media_type} onValueChange={(v) => setDraft({ ...draft, media_type: v })}>
                <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gradient">Gradient (CSS)</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="gif">Animated GIF</SelectItem>
                  <SelectItem value="video">Video (Muted)</SelectItem>
                  <SelectItem value="lottie">Lottie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {draft.media_type === "gradient" ? (
              <div className="space-y-2">
                <Label>Gradient CSS</Label>
                <Input
                  value={draft.gradient_css || ""}
                  onChange={(e) => setDraft({ ...draft, gradient_css: e.target.value })}
                  className="h-12 rounded-xl border-2 font-mono text-xs"
                />
                <div className="h-16 rounded-xl border-2 border-border/40" style={{ background: draft.gradient_css }} />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Media Payload</Label>
                <ImageUpload
                  value={draft.media_url}
                  onUpload={(url: string) => setDraft({ ...draft, media_url: url })}
                  onRemove={() => setDraft({ ...draft, media_url: null })}
                  bucket="banners"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority Rank</Label>
                <Input
                  type="number"
                  value={draft.priority ?? 0}
                  onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })}
                  className="h-12 rounded-xl border-2 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label>Text Color</Label>
                <Select value={draft.text_color} onValueChange={(v) => setDraft({ ...draft, text_color: v })}>
                  <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Overlay Opacity ({(draft.overlay_opacity ?? 0.4).toFixed(2)})</Label>
              <Slider
                value={[(draft.overlay_opacity ?? 0.4) * 100]}
                onValueChange={([v]) => setDraft({ ...draft, overlay_opacity: v / 100 })}
                min={0}
                max={90}
                step={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Schedule Window</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="datetime-local"
                  value={draft.start_at ? new Date(draft.start_at).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setDraft({ ...draft, start_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="h-12 rounded-xl border-2"
                />
                <Input
                  type="datetime-local"
                  value={draft.end_at ? new Date(draft.end_at).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setDraft({ ...draft, end_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="h-12 rounded-xl border-2"
                />
              </div>
            </div>
          </div>
          <Button
            onClick={() => upsertTheme.mutate(draft, { onSuccess: () => setOpen(false) })}
            className="h-14 rounded-xl font-black uppercase bg-fuchsia-600 hover:bg-fuchsia-700 text-white w-full"
          >
            Enforce Theme
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ThemesTab;
