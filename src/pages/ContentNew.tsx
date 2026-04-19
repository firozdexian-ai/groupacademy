import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Globe, Layers, Youtube, MessageSquare, MapPin, Calendar, Sparkles } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { youtubeUrlSchema, whatsappUrlSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";

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
    event_date: "",
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
      // 1. Logic Validation
      if (formData.youtube_url && !youtubeUrlSchema.safeParse(formData.youtube_url).success) {
        throw new Error("Invalid YouTube reference format.");
      }
      if (formData.whatsapp_group_link && !whatsappUrlSchema.safeParse(formData.whatsapp_group_link).success) {
        throw new Error("Invalid WhatsApp link sequence.");
      }

      // 2. SEO & Pathing
      const finalSlug =
        formData.slug ||
        formData.title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");

      // 3. Payload Normalization (Sanitizing irrelevant fields per type)
      const isEvent = ["live_webinar", "batch_class", "offline_seminar"].includes(formData.content_type);

      const payload = {
        ...formData,
        slug: finalSlug,
        duration_hours: formData.content_type === "recorded_course" ? formData.duration_hours : null,
        modules_count: formData.content_type === "recorded_course" ? formData.modules_count : null,
        event_date: isEvent ? formData.event_date || null : null,
        max_capacity: isEvent ? formData.max_capacity : null,
        venue_name: formData.content_type === "offline_seminar" ? formData.venue_name : null,
        venue_address: formData.content_type === "offline_seminar" ? formData.venue_address : null,
      };

      const { error } = await supabase.from("content").insert([payload]);
      if (error) throw error;

      toast.success("Academy Record Created");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Blueprint creation failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Nexus
          </Button>
          <Badge
            variant="outline"
            className="font-black uppercase text-[10px] tracking-tighter border-primary/20 text-primary"
          >
            New Content Draft
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8">
          <div className="space-y-8">
            {/* Step 1: Identity */}
            <Card className="rounded-[32px] border-border/40 overflow-hidden shadow-2xl shadow-primary/5">
              <CardHeader className="bg-muted/30 pb-6 border-b border-border/20">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> Core Blueprint
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6 pt-10">
                <ImageUpload
                  value={formData.cover_image_url}
                  onUpload={(url) => setFormData({ ...formData, cover_image_url: url })}
                  onRemove={() => setFormData({ ...formData, cover_image_url: "" })}
                />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Internal Title *
                    </Label>
                    <Input
                      placeholder="e.g. Mastering Advanced AI Prompting"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="h-12 rounded-xl border-border/40 text-sm font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        URL Path (Slug)
                      </Label>
                      <Input
                        placeholder="auto-generated"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })
                        }
                        className="rounded-xl border-border/40 font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Catalog Type *
                      </Label>
                      <Select
                        value={formData.content_type}
                        onValueChange={(val) => setFormData({ ...formData, content_type: val })}
                      >
                        <SelectTrigger className="rounded-xl border-border/40 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recorded_course">Recorded Course</SelectItem>
                          <SelectItem value="free_video">Free Video</SelectItem>
                          <SelectItem value="live_webinar">Live Webinar</SelectItem>
                          <SelectItem value="batch_class">Batch Class</SelectItem>
                          <SelectItem value="offline_seminar">Offline Seminar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Marketplace Meta Description
                    </Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                      className="rounded-2xl border-border/40 resize-none font-medium leading-relaxed"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Logistics (Conditional rendering) */}
            {formData.content_type !== "free_video" && (
              <Card className="rounded-[32px] border-border/40 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <CardHeader className="bg-muted/30 pb-6 border-b border-border/20">
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" /> Delivery Logic
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 grid gap-6">
                  {["live_webinar", "batch_class", "offline_seminar"].includes(formData.content_type) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Event Schedule
                        </Label>
                        <Input
                          type="datetime-local"
                          value={formData.event_date}
                          onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Seats/Capacity
                        </Label>
                        <Input
                          type="number"
                          value={formData.max_capacity}
                          onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 0 })}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Duration (Mins)
                        </Label>
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
                  )}

                  {formData.content_type === "offline_seminar" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Venue Brand
                        </Label>
                        <Input
                          value={formData.venue_name}
                          onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Physical Address
                        </Label>
                        <Input
                          value={formData.venue_address}
                          onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Lead Mentor
                      </Label>
                      <Input
                        value={formData.instructor_name}
                        onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                        className="rounded-xl font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Target Hours
                      </Label>
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

            {/* Step 3: Media Integrations */}
            <Card className="rounded-[32px] border-border/40 overflow-hidden">
              <CardHeader className="bg-muted/30 pb-6 border-b border-border/20">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <Youtube className="h-4 w-4 text-primary" /> Signal Channels
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Stream Endpoint (YouTube)
                  </Label>
                  <Input
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="rounded-xl border-border/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Community Hub (WhatsApp)
                  </Label>
                  <Input
                    value={formData.whatsapp_group_link}
                    onChange={(e) => setFormData({ ...formData, whatsapp_group_link: e.target.value })}
                    placeholder="https://chat.whatsapp.com/..."
                    className="rounded-xl border-border/40"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Controller Panel */}
          <aside className="space-y-6">
            <Card className="rounded-[32px] border-primary/20 bg-primary/[0.02] shadow-xl overflow-hidden sticky top-24">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">
                  Platform Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">
                      Market Price (USD)
                    </Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="rounded-xl border-border/40 h-11 font-black text-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">
                      Catalog Priority
                    </Label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      className="rounded-xl border-border/40 h-11"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-border/20 space-y-5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Publicity</Label>
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(c) => setFormData({ ...formData, is_published: c })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Private</Label>
                      <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-tighter">
                        B2B Link Only
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_private}
                      onCheckedChange={(c) => setFormData({ ...formData, is_private: c })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Assessment</Label>
                      <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-tighter">
                        Certification Quiz
                      </p>
                    </div>
                    <Switch
                      checked={formData.quiz_enabled}
                      onCheckedChange={(c) => setFormData({ ...formData, quiz_enabled: c })}
                    />
                  </div>
                </div>

                <Button
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 group"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 group-hover:scale-110 transition-transform" />
                  )}
                  Initialize Content
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
