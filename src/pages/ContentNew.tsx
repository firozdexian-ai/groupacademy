import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Globe, Layers, Youtube, Sparkles } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { youtubeUrlSchema, whatsappUrlSchema } from "@/lib/validations";
import { EventDateTimeField } from "@/components/admin/EventDateTimeField";
import { DEFAULT_EVENT_TZ } from "@/lib/eventTime";

const ContentNew = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content_type: "recorded_course" as any,
    description: "",
    price: 0,
    youtube_url: "",
    cover_image_url: "",
    duration_hours: 0,
    modules_count: 0,
    event_date: "",            // stored as UTC ISO
    event_timezone: DEFAULT_EVENT_TZ,
    event_duration_minutes: 0,
    max_capacity: 0,
    venue_name: "",
    venue_address: "",
    instructor_name: "",
    is_published: true,
    is_private: false,
    display_order: 0,
    whatsapp_group_link: "",
    quiz_enabled: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (formData.youtube_url && !youtubeUrlSchema.safeParse(formData.youtube_url).success) {
        throw new Error("Invalid YouTube URL.");
      }
      if (formData.whatsapp_group_link && !whatsappUrlSchema.safeParse(formData.whatsapp_group_link).success) {
        throw new Error("Invalid WhatsApp link.");
      }

      const finalSlug =
        formData.slug ||
        formData.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const isEvent = ["live_webinar", "batch_class", "offline_seminar"].includes(formData.content_type);

      const payload = {
        ...formData,
        slug: finalSlug,
        duration_hours: formData.content_type === "recorded_course" ? formData.duration_hours : null,
        modules_count: formData.content_type === "recorded_course" ? formData.modules_count : null,
        event_date: isEvent ? formData.event_date || null : null,
        event_timezone: isEvent ? formData.event_timezone : DEFAULT_EVENT_TZ,
        max_capacity: isEvent ? formData.max_capacity : null,
        venue_name: formData.content_type === "offline_seminar" ? formData.venue_name : null,
        venue_address: formData.content_type === "offline_seminar" ? formData.venue_address : null,
      };

      const { error } = await supabase.from("content").insert([payload]);
      if (error) throw error;

      toast.success("Content created");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to create content");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-sm font-semibold">New content</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6">
          <div className="space-y-5">
            <Card className="rounded-2xl border-border/40">
              <CardHeader className="border-b border-border/40 py-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> Basics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <ImageUpload
                  value={formData.cover_image_url}
                  onUpload={(url) => setFormData({ ...formData, cover_image_url: url })}
                  onRemove={() => setFormData({ ...formData, cover_image_url: "" })}
                />

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Title *</Label>
                  <Input
                    placeholder="e.g. Mastering Advanced AI Prompting"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">URL slug</Label>
                    <Input
                      placeholder="auto-generated"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })
                      }
                      className="rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Type *</Label>
                    <Select
                      value={formData.content_type}
                      onValueChange={(val) => setFormData({ ...formData, content_type: val })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recorded_course">Recorded course</SelectItem>
                        <SelectItem value="free_video">Free video</SelectItem>
                        <SelectItem value="live_webinar">Live webinar</SelectItem>
                        <SelectItem value="batch_class">Batch class</SelectItem>
                        <SelectItem value="offline_seminar">Offline seminar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="rounded-xl resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {formData.content_type !== "free_video" && (
              <Card className="rounded-2xl border-border/40">
                <CardHeader className="border-b border-border/40 py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" /> Logistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {["live_webinar", "batch_class", "offline_seminar"].includes(formData.content_type) && (
                    <>
                      <EventDateTimeField
                        utcValue={formData.event_date}
                        timezone={formData.event_timezone}
                        onChange={({ utcValue, timezone }) =>
                          setFormData({ ...formData, event_date: utcValue, event_timezone: timezone })
                        }
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">Capacity</Label>
                          <Input
                            type="number"
                            value={formData.max_capacity}
                            onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 0 })}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">Duration (mins)</Label>
                          <Input
                            type="number"
                            value={formData.event_duration_minutes}
                            onChange={(e) =>
                              setFormData({ ...formData, event_duration_minutes: parseInt(e.target.value) || 0 })
                            }
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {formData.content_type === "offline_seminar" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Venue name</Label>
                        <Input
                          value={formData.venue_name}
                          onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Address</Label>
                        <Input
                          value={formData.venue_address}
                          onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Instructor</Label>
                      <Input
                        value={formData.instructor_name}
                        onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Total hours</Label>
                      <Input
                        type="number"
                        value={formData.duration_hours}
                        onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 0 })}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-2xl border-border/40">
              <CardHeader className="border-b border-border/40 py-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Youtube className="h-4 w-4 text-primary" /> Links
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">YouTube URL</Label>
                  <Input
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">WhatsApp group</Label>
                  <Input
                    value={formData.whatsapp_group_link}
                    onChange={(e) => setFormData({ ...formData, whatsapp_group_link: e.target.value })}
                    placeholder="https://chat.whatsapp.com/..."
                    className="rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="rounded-2xl border-border/40 lg:sticky lg:top-20">
              <CardHeader className="border-b border-border/40 py-3">
                <CardTitle className="text-sm font-semibold">Publish</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Price (USD)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Display order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="rounded-xl"
                  />
                </div>

                <div className="pt-3 border-t border-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Published</Label>
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(c) => setFormData({ ...formData, is_published: c })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Private</Label>
                      <p className="text-[11px] text-muted-foreground">B2B link only</p>
                    </div>
                    <Switch
                      checked={formData.is_private}
                      onCheckedChange={(c) => setFormData({ ...formData, is_private: c })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Quiz</Label>
                      <p className="text-[11px] text-muted-foreground">Certification</p>
                    </div>
                    <Switch
                      checked={formData.quiz_enabled}
                      onCheckedChange={(c) => setFormData({ ...formData, quiz_enabled: c })}
                    />
                  </div>
                </div>

                <Button className="w-full rounded-xl" disabled={isLoading} type="submit">
                  {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Create
                </Button>
              </CardContent>
            </Card>
          </aside>
        </form>
      </main>
    </div>
  );
};

export default ContentNew;
