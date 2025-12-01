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
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { youtubeUrlSchema, whatsappUrlSchema } from "@/lib/validations";

const ContentNew = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content_type: "free_video" as "free_video" | "recorded_course" | "live_webinar" | "batch_class" | "offline_seminar",
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate URLs if provided
      if (formData.youtube_url) {
        const ytValidation = youtubeUrlSchema.safeParse(formData.youtube_url);
        if (!ytValidation.success) {
          toast.error(ytValidation.error.errors[0].message);
          setIsLoading(false);
          return;
        }
      }

      if (formData.whatsapp_group_link) {
        const waValidation = whatsappUrlSchema.safeParse(formData.whatsapp_group_link);
        if (!waValidation.success) {
          toast.error(waValidation.error.errors[0].message);
          setIsLoading(false);
          return;
        }
      }

      // Generate slug from title if not provided
      const slug = formData.slug || formData.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const { error } = await supabase.from("content").insert([
        {
          ...formData,
          slug,
          // YouTube URL available for all content types
          youtube_url: formData.youtube_url || null,
          // Cover image URL
          cover_image_url: formData.cover_image_url || null,
          // WhatsApp group link
          whatsapp_group_link: formData.whatsapp_group_link || null,
          // Display order
          display_order: formData.display_order,
          // Only include relevant fields based on content type
          duration_hours: formData.content_type === "recorded_course" ? formData.duration_hours : null,
          modules_count: formData.content_type === "recorded_course" ? formData.modules_count : null,
          event_date: ["live_webinar", "batch_class", "offline_seminar"].includes(formData.content_type)
            ? formData.event_date || null
            : null,
          event_duration_minutes: ["live_webinar", "batch_class", "offline_seminar"].includes(formData.content_type)
            ? formData.event_duration_minutes
            : null,
          max_capacity: ["live_webinar", "batch_class", "offline_seminar"].includes(formData.content_type)
            ? formData.max_capacity
            : null,
          venue_name: formData.content_type === "offline_seminar" ? formData.venue_name : null,
          venue_address: formData.content_type === "offline_seminar" ? formData.venue_address : null,
        },
      ]);

      if (error) throw error;

      toast.success("Content created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to create content");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Content</CardTitle>
            <CardDescription>Add new educational content to the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cover Image Upload */}
              <ImageUpload
                value={formData.cover_image_url}
                onUpload={(url) => setFormData({ ...formData, cover_image_url: url })}
                onRemove={() => setFormData({ ...formData, cover_image_url: "" })}
              />

              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content_type">Content Type *</Label>
                  <Select
                    value={formData.content_type}
                    onValueChange={(value: any) => setFormData({ ...formData, content_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free_video">Free Video</SelectItem>
                      <SelectItem value="recorded_course">Recorded Course</SelectItem>
                      <SelectItem value="live_webinar">Live Webinar</SelectItem>
                      <SelectItem value="batch_class">Batch Class</SelectItem>
                      <SelectItem value="offline_seminar">Offline Seminar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instructor">Instructor/Speaker</Label>
                    <Input
                      id="instructor"
                      value={formData.instructor_name}
                      onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (BDT)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Set to 0 for free courses
                    </p>
                  </div>
                </div>

                {/* YouTube Video - Available for all content types */}
                <div className="space-y-2">
                  <Label htmlFor="youtube_url">
                    {formData.content_type === "free_video" 
                      ? "YouTube Video URL *" 
                      : "Trailer Video (YouTube URL)"}
                  </Label>
                  <Input
                    id="youtube_url"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                    required={formData.content_type === "free_video"}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.content_type === "free_video" 
                      ? "YouTube URL for the main video content" 
                      : "Add a trailer or preview video (optional)"}
                  </p>
                </div>

                {/* WhatsApp Group Link */}
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_group_link">WhatsApp Group Link</Label>
                  <Input
                    id="whatsapp_group_link"
                    type="url"
                    placeholder="https://chat.whatsapp.com/..."
                    value={formData.whatsapp_group_link}
                    onChange={(e) => setFormData({ ...formData, whatsapp_group_link: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Share your course WhatsApp group link with enrolled students
                  </p>
                </div>

                {/* Content Type Specific Fields */}

                {formData.content_type === "recorded_course" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (Hours)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="0"
                        value={formData.duration_hours}
                        onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="modules">Number of Modules</Label>
                      <Input
                        id="modules"
                        type="number"
                        min="0"
                        value={formData.modules_count}
                        onChange={(e) => setFormData({ ...formData, modules_count: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                )}

                {["live_webinar", "batch_class", "offline_seminar"].includes(formData.content_type) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="event_date">Event Date & Time</Label>
                      <Input
                        id="event_date"
                        type="datetime-local"
                        value={formData.event_date}
                        onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration_minutes">Duration (Minutes)</Label>
                      <Input
                        id="duration_minutes"
                        type="number"
                        min="0"
                        value={formData.event_duration_minutes}
                        onChange={(e) =>
                          setFormData({ ...formData, event_duration_minutes: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                )}

                {["live_webinar", "batch_class", "offline_seminar"].includes(formData.content_type) && (
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Max Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="0"
                      value={formData.max_capacity}
                      onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                )}

                {formData.content_type === "offline_seminar" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="venue_name">Venue Name</Label>
                      <Input
                        id="venue_name"
                        value={formData.venue_name}
                        onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="venue_address">Venue Address</Label>
                      <Textarea
                        id="venue_address"
                        value={formData.venue_address}
                        onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower numbers appear first in the course catalog
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    />
                    <Label htmlFor="published">Publish immediately</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="private"
                      checked={formData.is_private}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
                    />
                    <Label htmlFor="private" className="flex flex-col gap-1">
                      <span>Private (B2B Only)</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        Hide from public catalog - accessible only via direct link
                      </span>
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Creating..." : "Create Content"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ContentNew;
