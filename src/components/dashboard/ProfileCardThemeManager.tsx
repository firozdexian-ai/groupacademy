import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Plus, Loader2, Sparkles } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

type MediaType = "image" | "gif" | "video" | "lottie" | "gradient";
type TextColor = "auto" | "light" | "dark";

interface Theme {
  id: string;
  name: string;
  media_type: MediaType;
  media_url: string | null;
  poster_url: string | null;
  gradient_css: string | null;
  overlay_opacity: number;
  text_color: TextColor;
  start_at: string | null;
  end_at: string | null;
  priority: number;
  is_active: boolean;
}

const empty = (): Partial<Theme> => ({
  name: "",
  media_type: "gradient",
  gradient_css: "linear-gradient(135deg,#2A7DDE,#33E1E4)",
  overlay_opacity: 0.4,
  text_color: "light",
  priority: 0,
  is_active: true,
});

export function ProfileCardThemeManager() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Partial<Theme>>(empty());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("profile_card_themes")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setThemes((data as Theme[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!draft.name || !draft.media_type) {
      toast.error("Name and media type are required.");
      return;
    }
    if (draft.media_type === "gradient" && !draft.gradient_css) {
      toast.error("Provide gradient CSS.");
      return;
    }
    if (draft.media_type !== "gradient" && !draft.media_url) {
      toast.error("Upload media first.");
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("profile_card_themes").insert(draft);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Theme created.");
    setDraft(empty());
    load();
  };

  const toggleActive = async (t: Theme) => {
    const { error } = await (supabase as any)
      .from("profile_card_themes")
      .update({ is_active: !t.is_active })
      .eq("id", t.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this theme?")) return;
    const { error } = await (supabase as any).from("profile_card_themes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted.");
    load();
  };

  const isMedia = draft.media_type !== "gradient";
  const needsPoster = draft.media_type === "video" || draft.media_type === "lottie";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Profile Card Themes
          </CardTitle>
          <CardDescription>
            Doodle-style backgrounds behind the talent profile card. Schedule themes for occasions
            (Eid, Independence Day, New Year, etc.). Highest-priority active theme inside its
            schedule wins.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input
                value={draft.name || ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Eid 2026"
              />
            </div>
            <div>
              <Label>Media type</Label>
              <Select
                value={draft.media_type}
                onValueChange={(v) => setDraft({ ...draft, media_type: v as MediaType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gradient">Gradient (CSS)</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="gif">Animated GIF</SelectItem>
                  <SelectItem value="video">Video (muted, looping)</SelectItem>
                  <SelectItem value="lottie">Lottie (poster fallback)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {draft.media_type === "gradient" && (
            <div>
              <Label>Gradient CSS</Label>
              <Input
                value={draft.gradient_css || ""}
                onChange={(e) => setDraft({ ...draft, gradient_css: e.target.value })}
                placeholder="linear-gradient(135deg,#2A7DDE,#33E1E4)"
              />
              <div
                className="mt-2 h-12 rounded-lg border"
                style={{ background: draft.gradient_css || "transparent" }}
              />
            </div>
          )}

          {isMedia && (
            <div>
              <Label>Media URL</Label>
              <ImageUpload
                value={draft.media_url || ""}
                onUpload={(url) => setDraft({ ...draft, media_url: url })}
                onRemove={() => setDraft({ ...draft, media_url: null })}
                bucket="banners"
              />
            </div>
          )}

          {needsPoster && (
            <div>
              <Label>Poster image (fallback for reduced-motion)</Label>
              <ImageUpload
                value={draft.poster_url || ""}
                onUpload={(url) => setDraft({ ...draft, poster_url: url })}
                onRemove={() => setDraft({ ...draft, poster_url: null })}
                bucket="banners"
              />
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Overlay opacity ({(draft.overlay_opacity ?? 0.55).toFixed(2)})</Label>
              <Slider
                value={[Math.round((draft.overlay_opacity ?? 0.55) * 100)]}
                onValueChange={([v]) => setDraft({ ...draft, overlay_opacity: v / 100 })}
                min={0}
                max={90}
                step={5}
              />
            </div>
            <div>
              <Label>Text color</Label>
              <Select
                value={draft.text_color}
                onValueChange={(v) => setDraft({ ...draft, text_color: v as TextColor })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="light">Light (white)</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Input
                type="number"
                value={draft.priority ?? 0}
                onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Start (optional)</Label>
              <Input
                type="datetime-local"
                value={draft.start_at?.slice(0, 16) || ""}
                onChange={(e) => setDraft({ ...draft, start_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </div>
            <div>
              <Label>End (optional)</Label>
              <Input
                type="datetime-local"
                value={draft.end_at?.slice(0, 16) || ""}
                onChange={(e) => setDraft({ ...draft, end_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add theme
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing themes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : themes.length === 0 ? (
            <div className="text-sm text-muted-foreground">No themes yet.</div>
          ) : (
            <ul className="divide-y">
              {themes.map((t) => (
                <li key={t.id} className="py-3 flex items-center gap-3">
                  <div
                    className="h-12 w-20 rounded-md border overflow-hidden bg-muted shrink-0"
                    style={t.media_type === "gradient" && t.gradient_css ? { background: t.gradient_css } : {}}
                  >
                    {t.media_type !== "gradient" && (t.poster_url || t.media_url) && (
                      <img src={t.poster_url || t.media_url || ""} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{t.name}</span>
                      <Badge variant="outline" className="text-[10px]">{t.media_type}</Badge>
                      <Badge variant="outline" className="text-[10px]">prio {t.priority}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.start_at ? new Date(t.start_at).toLocaleDateString() : "—"} → {t.end_at ? new Date(t.end_at).toLocaleDateString() : "always"}
                    </div>
                  </div>
                  <Switch checked={t.is_active} onCheckedChange={() => toggleActive(t)} />
                  <Button variant="ghost" size="icon" onClick={() => remove(t.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfileCardThemeManager;
