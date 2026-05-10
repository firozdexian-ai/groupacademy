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
import { toast } from "sonner";

export default function AbroadDestinationsTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-destinations"],
    queryFn: async () => {
      const { data } = await supabase.from("destination_agents").select("*").order("display_order");
      return data ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ code, active }: { code: string; active: boolean }) => {
      const { error } = await supabase.from("destination_agents").update({ is_active: active }).eq("country_code", code);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-destinations"] }),
  });

  const save = useMutation({
    mutationFn: async (row: any) => {
      const { error } = await supabase.from("destination_agents").update({
        display_name: row.display_name,
        tagline: row.tagline,
        flag_emoji: row.flag_emoji,
        system_prompt: row.system_prompt,
        default_currency: row.default_currency,
        visa_processing_weeks: row.visa_processing_weeks,
      }).eq("country_code", row.country_code);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-destinations"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Destination Agents</h2>
        <p className="text-sm text-muted-foreground">Per-country AI agents for study abroad guidance and roadmap building.</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data?.map((c) => (
            <Card key={c.country_code} className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="text-2xl">{c.flag_emoji ?? "🌍"}</div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{c.display_name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{c.tagline}</div>
                  </div>
                </div>
                <Switch
                  checked={c.is_active}
                  onCheckedChange={(v) => toggle.mutate({ code: c.country_code, active: v })}
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline">{c.default_currency}</Badge>
                <Badge variant="outline">{c.visa_processing_weeks ?? "—"}w visa</Badge>
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={() => setEditing(c)}>Edit</Button>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {editing && (
            <>
              <SheetHeader><SheetTitle>Edit {editing.display_name}</SheetTitle></SheetHeader>
              <div className="space-y-3 mt-4">
                <div><Label>Display name</Label><Input value={editing.display_name} onChange={(e) => setEditing({ ...editing, display_name: e.target.value })} /></div>
                <div><Label>Tagline</Label><Input value={editing.tagline ?? ""} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Flag emoji</Label><Input value={editing.flag_emoji ?? ""} onChange={(e) => setEditing({ ...editing, flag_emoji: e.target.value })} /></div>
                  <div><Label>Currency</Label><Input value={editing.default_currency ?? ""} onChange={(e) => setEditing({ ...editing, default_currency: e.target.value })} /></div>
                </div>
                <div><Label>Visa weeks</Label><Input type="number" value={editing.visa_processing_weeks ?? ""} onChange={(e) => setEditing({ ...editing, visa_processing_weeks: parseInt(e.target.value) || null })} /></div>
                <div><Label>System prompt</Label><Textarea rows={8} value={editing.system_prompt ?? ""} onChange={(e) => setEditing({ ...editing, system_prompt: e.target.value })} /></div>
                <Button className="w-full" disabled={save.isPending} onClick={() => save.mutate(editing)}>Save</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
