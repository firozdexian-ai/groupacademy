import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, ExternalLink, Share2 } from "lucide-react";
import { toast } from "sonner";

export function ProjectPublicToggle({ projectId }: { projectId: string }) {
  const [pub, setPub] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [views, setViews] = useState(0);
  const [shares, setShares] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("project_public_settings").select("is_public, slug, view_count, share_count")
      .eq("project_id", projectId).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setPub(!!data.is_public); setSlug(data.slug); setViews(data.view_count ?? 0); setShares(data.share_count ?? 0);
      });
  }, [projectId]);

  const toggle = async (next: boolean) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("toggle_project_public", { _project_id: projectId, _public: next });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    const row = data as unknown as { is_public: boolean; slug: string | null };
    setPub(row.is_public); setSlug(row.slug);
    if (next) {
      void supabase.functions.invoke("og-image-render", { body: { project_id: projectId } });
      void supabase.functions.invoke("ai-gig-public-summary", { body: { project_id: projectId } });
    }
    toast.success(next ? "Project is now public" : "Listing unpublished");
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Public listing</p>
            <p className="text-xs text-muted-foreground">Show this project on /projects + leaderboards.</p>
          </div>
          <Switch checked={pub} disabled={loading} onCheckedChange={toggle} />
        </div>
        {pub && slug && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground"><Eye className="h-3 w-3"/> {views}</span>
            <span className="flex items-center gap-1 text-muted-foreground"><Share2 className="h-3 w-3"/> {shares}</span>
            <Button asChild size="sm" variant="outline" className="ml-auto h-7">
              <a href={`/projects/${slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3 mr-1"/>Preview</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
