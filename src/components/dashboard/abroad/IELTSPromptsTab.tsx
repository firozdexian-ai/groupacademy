import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const SECTIONS = ["writing", "speaking", "reading", "listening"];

export default function IELTSPromptsTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [section, setSection] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-ielts-prompts", section],
    queryFn: async () => {
      let q = supabase.from("ielts_prompts").select("*").order("created_at", { ascending: false }).limit(200);
      if (section !== "all") q = q.eq("section", section);
      const { data } = await q;
      return data ?? [];
    },
  });

  const upsert = useMutation({
    mutationFn: async (row: any) => {
      const payload = {
        section: row.section,
        title: row.title,
        prompt_text: row.prompt_text,
        target_band: row.target_band ?? null,
        is_active: row.is_active ?? true,
      };
      if (row.id) {
        const { error } = await supabase.from("ielts_prompts").update(payload).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ielts_prompts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-ielts-prompts"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("ielts_prompts").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ielts-prompts"] }),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold">IELTS Prompts</h2>
          <p className="text-sm text-muted-foreground">Curate prompts that power the AI mock test sections.</p>
        </div>
        <Button size="sm" onClick={() => setEditing({ section: "writing", is_active: true })}>
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>

      <Select value={section} onValueChange={setSection}>
        <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sections</SelectItem>
          {SECTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="space-y-2">
          {data?.map((p) => (
            <Card key={p.id} className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-sm">{p.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{p.prompt_text}</div>
                </div>
                <Switch checked={p.is_active} onCheckedChange={(v) => toggle.mutate({ id: p.id, active: v })} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="capitalize">{p.section}</Badge>
                {p.target_band && <Badge variant="outline">Band {p.target_band}+</Badge>}
                <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditing(p)}>Edit</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {editing && (
            <>
              <SheetHeader><SheetTitle>{editing.id ? "Edit" : "New"} prompt</SheetTitle></SheetHeader>
              <div className="space-y-3 mt-4">
                <div>
                  <Label>Section</Label>
                  <Select value={editing.section} onValueChange={(v) => setEditing({ ...editing, section: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SECTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Title</Label><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                <div><Label>Prompt text</Label><Textarea rows={8} value={editing.prompt_text ?? ""} onChange={(e) => setEditing({ ...editing, prompt_text: e.target.value })} /></div>
                <div><Label>Target band (optional)</Label><Input type="number" step="0.5" value={editing.target_band ?? ""} onChange={(e) => setEditing({ ...editing, target_band: parseFloat(e.target.value) || null })} /></div>
                <Button className="w-full" disabled={upsert.isPending} onClick={() => upsert.mutate(editing)}>Save</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
