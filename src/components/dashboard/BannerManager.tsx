import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Plus, Image as ImageIcon, Loader2, ShieldCheck, Layers, Zap, Layout, RefreshCw } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardCardSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Visual Logic Controller (Banner Manager)
 * High-fidelity orchestrator for promotional artifacts and UI entry points.
 * 2026 Standard: Executive Logic geometry with reinforced placement telemetry.
 */

type PlacementType = "carousel" | "hero" | "learning";

type MediaType = "image" | "gif" | "video";
type FocalPoint = "center" | "top" | "bottom" | "left" | "right";

interface Banner {
  id: string;
  image_url: string;
  link_content_id: string | null;
  display_order: number;
  is_active: boolean;
  placement: PlacementType;
  media_type: MediaType | null;
  media_url: string | null;
  poster_url: string | null;
  link_url: string | null;
  cta_label: string | null;
  focal_point: FocalPoint | null;
  start_at: string | null;
  end_at: string | null;
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
    placement: "carousel" as PlacementType,
    media_type: "image" as MediaType,
    media_url: "",
    poster_url: "",
    link_url: "",
    cta_label: "",
    focal_point: "center" as FocalPoint,
    start_at: "",
    end_at: "",
  });

  useEffect(() => {
    loadRegistryData();
  }, []);

  const loadRegistryData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const bannersResult = await withTimeout(
        Promise.resolve(
          supabase
            .from("banners")
            .select(
              `id, image_url, link_content_id, display_order, is_active, placement, content:link_content_id (id, title)`,
            )
            .order("display_order"),
        ),
        TIMEOUTS.DEFAULT,
        "Registry Link Timeout",
      );
      if (bannersResult.error) throw bannersResult.error;

      // CTO FIX: Assert types for generic database strings to match our strict union types
      const typedBanners = (bannersResult.data as any[]).map((banner) => ({
        ...banner,
        placement: banner.placement as PlacementType,
      })) as Banner[];

      setBanners(typedBanners);

      const contentResult = await withTimeout(
        Promise.resolve(supabase.from("content").select("id, title").eq("is_published", true).order("title")),
        TIMEOUTS.DEFAULT,
        "Logic Source Timeout",
      );
      if (contentResult.error) throw contentResult.error;
      setAvailableContent(contentResult.data || []);
    } catch (error: any) {
      setLoadError(error.message || "Failed to synchronize banners");
      toast.error("Transmission Error: Sync failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateArtifact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.image_url) return toast.error("Logic Fault: Image payload missing");

    try {
      const {
        data: { user },
      } = await withTimeout(supabase.auth.getUser(), TIMEOUTS.AUTH, "Auth Handshake Timeout");
      if (!user) throw new Error("Registry Access Denied");

      const { error } = await withTimeout(
        Promise.resolve(
          supabase.from("banners").insert([
            {
              image_url: newBanner.image_url,
              link_content_id: newBanner.link_content_id === "none" ? null : newBanner.link_content_id,
              display_order: newBanner.display_order,
              placement: newBanner.placement,
              media_type: newBanner.media_type,
              media_url: newBanner.media_url || null,
              poster_url: newBanner.poster_url || null,
              link_url: newBanner.link_url || null,
              cta_label: newBanner.cta_label || null,
              focal_point: newBanner.focal_point,
              start_at: newBanner.start_at ? new Date(newBanner.start_at).toISOString() : null,
              end_at: newBanner.end_at ? new Date(newBanner.end_at).toISOString() : null,
              created_by: user.id,
            },
          ]),
        ),
        TIMEOUTS.DEFAULT,
        "Artifact Insertion Timeout",
      );

      if (error) throw error;
      toast.success("Artifact Deployed: Banner successfully registered.");
      setNewBanner({
        image_url: "",
        link_content_id: "none",
        display_order: 0,
        placement: "carousel",
        media_type: "image",
        media_url: "",
        poster_url: "",
        link_url: "",
        cta_label: "",
        focal_point: "center",
        start_at: "",
        end_at: "",
      });
      loadRegistryData();
    } catch (error: any) {
      toast.error(error.message || "Protocol Error: Deployment failed");
    }
  };

  const handleToggleState = async (bannerId: string, isActive: boolean) => {
    try {
      const { error } = await withTimeout(
        Promise.resolve(supabase.from("banners").update({ is_active: !isActive }).eq("id", bannerId)),
        TIMEOUTS.DEFAULT,
        "Logic State Update Timeout",
      );
      if (error) throw error;
      toast.success(`Node ${!isActive ? "Activated" : "Terminated"}`);
      loadRegistryData();
    } catch (error: any) {
      toast.error("Handshake Failed: State immutable");
    }
  };

  const handlePurgeArtifact = async (bannerId: string) => {
    if (!confirm("Authorize permanent artifact purge?")) return;
    try {
      const { error } = await withTimeout(
        Promise.resolve(supabase.from("banners").delete().eq("id", bannerId)),
        TIMEOUTS.DEFAULT,
        "Purge Protocol Timeout",
      );
      if (error) throw error;
      toast.success("Artifact Purged from Registry");
      loadRegistryData();
    } catch (error: any) {
      toast.error("Purge Failed: Artifact locked by protocol");
    }
  };

  if (isLoading)
    return (
      <div className="space-y-8 animate-pulse">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
    );

  if (loadError)
    return <DashboardErrorState title="Registry Sync Failure" message={loadError} onRetry={loadRegistryData} />;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Creation Node */}
      <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">
                Initialize Artifact
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                1536×512PX Registry Injection (3:1 Ratio)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <form onSubmit={handleCreateArtifact} className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Visual Payload (Image)
                </Label>
                <div className="p-4 rounded-[24px] border-2 border-dashed border-border/40 bg-muted/5 group transition-all hover:border-primary/40">
                  <ImageUpload
                    value={newBanner.image_url}
                    onUpload={(url) => setNewBanner({ ...newBanner, image_url: url })}
                    onRemove={() => setNewBanner({ ...newBanner, image_url: "" })}
                    bucket="course-covers"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Logic Link (Optional)
                  </Label>
                  <Select
                    value={newBanner.link_content_id}
                    onValueChange={(v) => setNewBanner({ ...newBanner, link_content_id: v })}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-2 font-bold bg-background/50">
                      <SelectValue placeholder="Uplink to Academic Node..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-2">
                      <SelectItem value="none" className="font-bold uppercase text-[10px]">
                        No Link Protocol
                      </SelectItem>
                      {availableContent.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="font-bold">
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Spatial Placement
                    </Label>
                    <Select
                      value={newBanner.placement}
                      onValueChange={(v: PlacementType) => setNewBanner({ ...newBanner, placement: v })}
                    >
                      <SelectTrigger className="h-14 rounded-2xl border-2 font-bold bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-2">
                        <SelectItem value="carousel" className="font-bold">
                          CAROUSEL
                        </SelectItem>
                        <SelectItem value="hero" className="font-bold">
                          HERO HUB
                        </SelectItem>
                        <SelectItem value="learning" className="font-bold">
                          ACADEMY
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Logic Order
                    </Label>
                    <Input
                      type="number"
                      value={newBanner.display_order}
                      onChange={(e) => setNewBanner({ ...newBanner, display_order: parseInt(e.target.value) || 0 })}
                      className="h-14 rounded-2xl border-2 font-bold bg-background/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Media Type
                    </Label>
                    <Select
                      value={newBanner.media_type}
                      onValueChange={(v: MediaType) => setNewBanner({ ...newBanner, media_type: v })}
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-2 font-bold bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-2">
                        <SelectItem value="image">Image (JPG/PNG)</SelectItem>
                        <SelectItem value="gif">Animated GIF</SelectItem>
                        <SelectItem value="video">Video (MP4)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Focal Point
                    </Label>
                    <Select
                      value={newBanner.focal_point}
                      onValueChange={(v: FocalPoint) => setNewBanner({ ...newBanner, focal_point: v })}
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-2 font-bold bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-2">
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(newBanner.media_type === "video" || newBanner.media_type === "gif") && (
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      {newBanner.media_type === "video" ? "Video URL (MP4)" : "GIF URL"}
                    </Label>
                    <Input
                      placeholder="https://…"
                      value={newBanner.media_url}
                      onChange={(e) => setNewBanner({ ...newBanner, media_url: e.target.value })}
                      className="h-12 rounded-2xl border-2 bg-background/50"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      The image above is used as a fallback / poster frame.
                    </p>
                  </div>
                )}

                {newBanner.media_type === "video" && (
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Poster Frame URL (optional)
                    </Label>
                    <Input
                      placeholder="https://…"
                      value={newBanner.poster_url}
                      onChange={(e) => setNewBanner({ ...newBanner, poster_url: e.target.value })}
                      className="h-12 rounded-2xl border-2 bg-background/50"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      External Link URL (optional)
                    </Label>
                    <Input
                      placeholder="https://…"
                      value={newBanner.link_url}
                      onChange={(e) => setNewBanner({ ...newBanner, link_url: e.target.value })}
                      className="h-12 rounded-2xl border-2 bg-background/50"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      CTA Label (optional)
                    </Label>
                    <Input
                      placeholder="e.g. Enroll now"
                      value={newBanner.cta_label}
                      onChange={(e) => setNewBanner({ ...newBanner, cta_label: e.target.value })}
                      className="h-12 rounded-2xl border-2 bg-background/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Schedule Start (optional)
                    </Label>
                    <Input
                      type="datetime-local"
                      value={newBanner.start_at}
                      onChange={(e) => setNewBanner({ ...newBanner, start_at: e.target.value })}
                      className="h-12 rounded-2xl border-2 bg-background/50"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Schedule End (optional)
                    </Label>
                    <Input
                      type="datetime-local"
                      value={newBanner.end_at}
                      onChange={(e) => setNewBanner({ ...newBanner, end_at: e.target.value })}
                      className="h-12 rounded-2xl border-2 bg-background/50"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-primary/30 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5" /> Register Artifact
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-primary opacity-50 group-hover:opacity-100 transition-opacity" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Registry Ledger */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/10 backdrop-blur-sm overflow-hidden shadow-sm">
        <CardHeader className="p-8 bg-muted/20 border-b border-border/10 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
              <Layers className="h-5 w-5 text-primary" /> Active Registry ({banners.length})
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadRegistryData}
            className="rounded-full h-10 w-10 hover:bg-primary/10"
          >
            <RefreshCw className="h-4 w-4 text-primary" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {banners.length === 0 ? (
            <div className="py-24 text-center space-y-4 opacity-20 italic">
              <ImageIcon className="h-12 w-12 mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-widest">Registry Node Null</p>
            </div>
          ) : (
            <div className="divide-y divide-border/10">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="group p-8 flex items-center gap-8 transition-all hover:bg-primary/[0.02]"
                >
                  <div className="relative w-48 h-28 rounded-2xl border-2 border-border/40 overflow-hidden shadow-inner shrink-0 group-hover:border-primary/40 transition-all duration-500">
                    <img
                      src={banner.image_url}
                      alt="Artifact"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-black uppercase tracking-tight text-lg italic leading-none truncate max-w-md">
                        {banner.content?.title || "UNLINKED_NODE"}
                      </h4>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={cn(
                            "rounded-lg font-black uppercase text-[8px] tracking-widest px-3 py-1 border-none shadow-sm",
                            banner.placement === "hero"
                              ? "bg-primary text-white"
                              : banner.placement === "learning"
                                ? "bg-amber-500 text-white"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {banner.placement} NODE
                        </Badge>
                        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                          Sequence Index: {banner.display_order}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 pr-4">
                    <div className="flex items-center gap-4 bg-background/50 p-3 rounded-2xl border border-border/10">
                      <Switch
                        checked={banner.is_active}
                        onCheckedChange={() => handleToggleState(banner.id, banner.is_active)}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                      <span
                        className={cn(
                          "text-[9px] font-black uppercase tracking-widest",
                          banner.is_active ? "text-emerald-500" : "text-muted-foreground/40",
                        )}
                      >
                        {banner.is_active ? "LIVE" : "IDLE"}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePurgeArtifact(banner.id)}
                      className="h-12 w-12 rounded-2xl text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="h-5 w-5" />
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
