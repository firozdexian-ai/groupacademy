import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Plus, Image as ImageIcon } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardCardSkeleton, DashboardErrorState } from "./DashboardSkeleton";

interface Banner {
  id: string;
  image_url: string;
  link_content_id: string | null;
  display_order: number;
  is_active: boolean;
  content?: {
    id: string;
    title: string;
  } | null;
}

interface Content {
  id: string;
  title: string;
}

export const BannerManager = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [availableContent, setAvailableContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newBanner, setNewBanner] = useState({
    image_url: "",
    link_content_id: "none",
    display_order: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const bannersResult = await withTimeout(
        Promise.resolve(supabase.from("banners").select(`id, image_url, link_content_id, display_order, is_active, content:link_content_id (id, title)`).order("display_order")),
        TIMEOUTS.DEFAULT,
        "Loading banners timed out"
      );
      if (bannersResult.error) throw bannersResult.error;
      setBanners(bannersResult.data || []);

      const contentResult = await withTimeout(
        Promise.resolve(supabase.from("content").select("id, title").eq("is_published", true).order("title")),
        TIMEOUTS.DEFAULT,
        "Loading content timed out"
      );
      if (contentResult.error) throw contentResult.error;
      setAvailableContent(contentResult.data || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      setLoadError(error.message || "Failed to load banners");
      toast.error("Failed to load banners");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBanner.image_url) {
      toast.error("Please upload a banner image");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("banners").insert([
        {
          image_url: newBanner.image_url,
          link_content_id: newBanner.link_content_id === "none" ? null : newBanner.link_content_id,
          display_order: newBanner.display_order,
          created_by: user.id,
        },
      ]);

      if (error) throw error;

      toast.success("Banner created successfully");
      setNewBanner({ image_url: "", link_content_id: "none", display_order: 0 });
      loadData();
    } catch (error: any) {
      console.error("Error creating banner:", error);
      toast.error(error.message || "Failed to create banner");
    }
  };

  const handleToggleActive = async (bannerId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("banners")
        .update({ is_active: !isActive })
        .eq("id", bannerId);

      if (error) throw error;

      toast.success(`Banner ${!isActive ? "activated" : "deactivated"}`);
      loadData();
    } catch (error: any) {
      console.error("Error updating banner:", error);
      toast.error("Failed to update banner");
    }
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    try {
      const { error } = await supabase.from("banners").delete().eq("id", bannerId);

      if (error) throw error;

      toast.success("Banner deleted successfully");
      loadData();
    } catch (error: any) {
      console.error("Error deleting banner:", error);
      toast.error("Failed to delete banner");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
    );
  }

  if (loadError) {
    return (
      <DashboardErrorState
        title="Failed to load banners"
        message={loadError}
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Banner */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Banner</CardTitle>
          <CardDescription>
            Upload a 1200x400px image (3:1 aspect ratio) for the course catalog carousel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateBanner} className="space-y-4">
            <div className="space-y-2">
              <Label>Banner Image (1200x400px recommended) *</Label>
              <ImageUpload
                value={newBanner.image_url}
                onUpload={(url) => setNewBanner({ ...newBanner, image_url: url })}
                onRemove={() => setNewBanner({ ...newBanner, image_url: "" })}
                bucket="course-covers"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link_content">Link to Course (Optional)</Label>
              <Select
                value={newBanner.link_content_id}
                onValueChange={(value) =>
                  setNewBanner({ ...newBanner, link_content_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course to link..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No link</SelectItem>
                  {availableContent.map((content) => (
                    <SelectItem key={content.id} value={content.id}>
                      {content.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={newBanner.display_order}
                onChange={(e) =>
                  setNewBanner({ ...newBanner, display_order: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first in the carousel
              </p>
            </div>

            <Button type="submit" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create Banner
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Banners */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Banners ({banners.length})</CardTitle>
          <CardDescription>Manage your promotional banners</CardDescription>
        </CardHeader>
        <CardContent>
          {banners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No banners yet. Create your first banner above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  {/* Banner Preview */}
                  <div className="w-32 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                    <img
                      src={banner.image_url}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Banner Info */}
                  <div className="flex-1">
                    <p className="font-medium">
                      {banner.content?.title || "No linked course"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Order: {banner.display_order}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={banner.is_active}
                        onCheckedChange={() =>
                          handleToggleActive(banner.id, banner.is_active)
                        }
                      />
                      <Label className="text-sm">
                        {banner.is_active ? "Active" : "Inactive"}
                      </Label>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(banner.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
