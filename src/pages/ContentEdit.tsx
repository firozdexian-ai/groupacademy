import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ImageUpload";
import { youtubeUrlSchema, whatsappUrlSchema } from "@/lib/validations";

export default function ContentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    content_type: "recorded_course" as "batch_class" | "free_video" | "live_webinar" | "offline_seminar" | "recorded_course",
    price: "",
    currency: "USD",
    credit_cost: null as number | null,
    duration_hours: "",
    modules_count: "",
    instructor_name: "",
    venue_name: "",
    venue_address: "",
    event_date: "",
    event_duration_minutes: "",
    max_capacity: "",
    youtube_url: "",
    cover_image_url: "",
    is_published: true,
    is_private: false,
    display_order: 0,
    whatsapp_group_link: "",
  });

  useEffect(() => {
    if (id) {
      loadContent();
    }
  }, [id]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title || "",
        slug: data.slug || "",
        description: data.description || "",
        content_type: data.content_type,
        price: data.price?.toString() || "",
        currency: data.currency || "BDT",
        credit_cost: data.credit_cost ?? null,
        duration_hours: data.duration_hours?.toString() || "",
        modules_count: data.modules_count?.toString() || "",
        instructor_name: data.instructor_name || "",
        venue_name: data.venue_name || "",
        venue_address: data.venue_address || "",
        event_date: data.event_date
          ? new Date(data.event_date).toISOString().slice(0, 16)
          : "",
        event_duration_minutes: data.event_duration_minutes?.toString() || "",
        max_capacity: data.max_capacity?.toString() || "",
        youtube_url: data.youtube_url || "",
        cover_image_url: data.cover_image_url || "",
        is_published: data.is_published ?? true,
        is_private: data.is_private ?? false,
        display_order: data.display_order ?? 0,
        whatsapp_group_link: data.whatsapp_group_link || "",
      });
    } catch (error: any) {
      toast({
        title: "Error loading content",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate URLs if provided
      if (formData.youtube_url) {
        const ytValidation = youtubeUrlSchema.safeParse(formData.youtube_url);
        if (!ytValidation.success) {
          toast({
            title: "Invalid YouTube URL",
            description: ytValidation.error.errors[0].message,
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      }

      if (formData.whatsapp_group_link) {
        const waValidation = whatsappUrlSchema.safeParse(formData.whatsapp_group_link);
        if (!waValidation.success) {
          toast({
            title: "Invalid WhatsApp Link",
            description: waValidation.error.errors[0].message,
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from("content")
        .update({
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          content_type: formData.content_type,
          price: formData.price ? parseFloat(formData.price) : null,
          currency: formData.currency,
          credit_cost: formData.credit_cost,
          duration_hours: formData.duration_hours
            ? parseInt(formData.duration_hours)
            : null,
          modules_count: formData.modules_count
            ? parseInt(formData.modules_count)
            : null,
          instructor_name: formData.instructor_name || null,
          venue_name: formData.venue_name || null,
          venue_address: formData.venue_address || null,
          event_date: formData.event_date || null,
          event_duration_minutes: formData.event_duration_minutes
            ? parseInt(formData.event_duration_minutes)
            : null,
          max_capacity: formData.max_capacity
            ? parseInt(formData.max_capacity)
            : null,
          youtube_url: formData.youtube_url || null,
          cover_image_url: formData.cover_image_url || null,
          whatsapp_group_link: formData.whatsapp_group_link || null,
          is_published: formData.is_published,
          is_private: formData.is_private,
          display_order: formData.display_order,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content updated successfully",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading content...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-6">Edit Content</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cover Image Upload */}
            <ImageUpload
              value={formData.cover_image_url}
              onUpload={(url) => setFormData({ ...formData, cover_image_url: url })}
              onRemove={() => setFormData({ ...formData, cover_image_url: "" })}
            />

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_type">Content Type *</Label>
              <Select
                value={formData.content_type}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, content_type: value })
                }
              >
                <SelectTrigger>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  placeholder="BDT"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit_cost">Credit Cost (Override)</Label>
              <Input
                id="credit_cost"
                type="number"
                value={formData.credit_cost ?? ""}
                onChange={(e) =>
                  setFormData({ 
                    ...formData, 
                    credit_cost: e.target.value ? parseInt(e.target.value) : null 
                  })
                }
                placeholder="Auto-calculated from price if empty"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-calculate from price (1 credit = ৳2). 
                {formData.price && !formData.credit_cost && (
                  <span className="font-medium text-foreground ml-1">
                    Auto: {Math.ceil(parseFloat(formData.price) / 2)} credits
                  </span>
                )}
              </p>
            </div>

            {/* YouTube URL - Available for ALL content types */}
            <div className="space-y-2">
              <Label htmlFor="youtube_url">
                {formData.content_type === "free_video" 
                  ? "YouTube Video URL *" 
                  : "Trailer Video (YouTube URL)"}
              </Label>
              <Input
                id="youtube_url"
                value={formData.youtube_url}
                onChange={(e) =>
                  setFormData({ ...formData, youtube_url: e.target.value })
                }
                placeholder="https://www.youtube.com/watch?v=..."
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
                onChange={(e) =>
                  setFormData({ ...formData, whatsapp_group_link: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Share your course WhatsApp group link with enrolled students
              </p>
            </div>

            {(formData.content_type === "recorded_course" ||
              formData.content_type === "free_video") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="duration_hours">Duration (hours)</Label>
                  <Input
                    id="duration_hours"
                    type="number"
                    value={formData.duration_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_hours: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructor_name">Instructor Name</Label>
                  <Input
                    id="instructor_name"
                    value={formData.instructor_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        instructor_name: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}

            {formData.content_type === "recorded_course" && (
              <div className="space-y-2">
                <Label htmlFor="modules_count">Number of Modules</Label>
                <Input
                  id="modules_count"
                  type="number"
                  value={formData.modules_count}
                  onChange={(e) =>
                    setFormData({ ...formData, modules_count: e.target.value })
                  }
                />
              </div>
            )}

            {(formData.content_type === "live_webinar" ||
              formData.content_type === "batch_class" ||
              formData.content_type === "offline_seminar") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="event_date">Event Date & Time</Label>
                  <Input
                    id="event_date"
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) =>
                      setFormData({ ...formData, event_date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue_name">Venue Name</Label>
                  <Input
                    id="venue_name"
                    value={formData.venue_name}
                    onChange={(e) =>
                      setFormData({ ...formData, venue_name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue_address">Venue Address</Label>
                  <Input
                    id="venue_address"
                    value={formData.venue_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        venue_address: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_duration_minutes">
                      Duration (minutes)
                    </Label>
                    <Input
                      id="event_duration_minutes"
                      type="number"
                      value={formData.event_duration_minutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          event_duration_minutes: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_capacity">Max Capacity</Label>
                    <Input
                      id="max_capacity"
                      type="number"
                      value={formData.max_capacity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_capacity: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
            </>
            )}

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first in the course catalog
              </p>
            </div>

            {/* Publish & Private Toggles */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="published">Publish</Label>
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

            <Button type="submit" className="w-full" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Update Content"}
            </Button>
          </form>
        </Card>

        {/* Course Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Modules</CardTitle>
              <CardDescription>
                Add and manage video lessons for this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`/content/${id}/modules`)}
              >
                Manage Modules
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quiz Assessment</CardTitle>
              <CardDescription>
                Create 10 MCQs to assess student learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`/quiz-manage/${id}`)}
              >
                Manage Quiz
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* B2B Private Link Card */}
        {formData.is_private && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Private Course Link</CardTitle>
              <CardDescription>
                Share this link with your B2B clients to access this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/courses/${formData.slug}`}
                  readOnly
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/courses/${formData.slug}`
                    );
                    setCopiedLink(true);
                    toast({
                      title: "Link copied!",
                      description: "Private course link copied to clipboard",
                    });
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}