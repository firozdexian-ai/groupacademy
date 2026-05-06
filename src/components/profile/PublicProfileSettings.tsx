import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Copy, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePublicProfileSettings } from "@/hooks/usePublicProfileSettings";
import { Link } from "react-router-dom";

export function PublicProfileSettings() {
  const { data, isLoading, update, claimHandle } = usePublicProfileSettings();
  const { toast } = useToast();
  const [handleInput, setHandleInput] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (data) {
      setHandleInput(data.public_handle ?? "");
      setBio(data.public_bio ?? "");
    }
  }, [data]);

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (!data) return null;

  const publicUrl = data.public_handle ? `${window.location.origin}/t/${data.public_handle}` : null;

  const onClaim = async () => {
    try {
      await claimHandle.mutateAsync(handleInput.toLowerCase().trim());
      toast({ title: "Handle saved", description: "Your public handle is locked in." });
    } catch (e: any) {
      toast({ title: "Couldn't save handle", description: e.message, variant: "destructive" });
    }
  };

  const onSaveBio = async () => {
    await update.mutateAsync({ public_bio: bio });
    toast({ title: "Bio updated" });
  };

  const copyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    toast({ title: "Link copied" });
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4 text-primary" />
          Public profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Make profile public</p>
            <p className="text-xs text-muted-foreground">Recruiters and peers can view your verified skills.</p>
          </div>
          <Switch
            checked={data.public_profile_enabled}
            onCheckedChange={(v) => update.mutate({ public_profile_enabled: v })}
          />
        </div>

        {data.public_profile_enabled && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Handle</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center rounded-md border bg-muted/30 px-2 text-sm">
                  <span className="text-muted-foreground">/t/</span>
                  <Input
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="your-name"
                    className="border-0 bg-transparent h-9 px-1 focus-visible:ring-0"
                    maxLength={40}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={onClaim}
                  disabled={!handleInput || handleInput === data.public_handle || claimHandle.isPending}
                >
                  {claimHandle.isPending ? "..." : "Save"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">3-40 chars: lowercase letters, numbers, hyphens.</p>
            </div>

            {publicUrl && (
              <div className="rounded-xl bg-success-green/10 border border-success-green/30 p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-success-green">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Live at:
                </div>
                <code className="text-xs break-all block">{publicUrl}</code>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={copyLink}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                    <a href={publicUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" /> View
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {!data.public_handle && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-600 flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Pick a handle to activate your public link.
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Short bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 240))}
                placeholder="One-line tagline shown on your public profile."
                rows={2}
                className="text-sm"
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">{bio.length}/240</p>
                <Button size="sm" variant="ghost" onClick={onSaveBio} disabled={bio === (data.public_bio ?? "")}>
                  Save bio
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm">Show verified skills</p>
                <Switch
                  checked={data.public_show_credentials}
                  onCheckedChange={(v) => update.mutate({ public_show_credentials: v })}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm">Show mastery snapshot</p>
                <Switch
                  checked={data.public_show_mastery}
                  onCheckedChange={(v) => update.mutate({ public_show_mastery: v })}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
