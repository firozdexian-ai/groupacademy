import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Copy, ExternalLink, Loader2, Linkedin, Facebook, MessageSquare, Send, Search, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  gig: { id: string; title: string };
  talentId: string;
  onSubmitted: () => void;
}

const CHANNELS = [
  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "telegram", label: "Telegram", icon: Send },
] as const;

export function CourseSharingGigForm({ gig, talentId, onSubmitted }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shared, setShared] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: refCode } = useQuery({
    queryKey: ["talent-ref-code", talentId],
    queryFn: async () => {
      const { data } = await supabase.from("talents").select("ref_code, id").eq("id", talentId).single();
      return data?.ref_code || data?.id;
    },
  });

  const { data: courses, isLoading } = useQuery({
    queryKey: ["share-active-courses"],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data: recorded } = await supabase
        .from("content")
        .select("id, slug, title, content_type, cover_image_url, credit_cost, price")
        .eq("is_published", true).eq("is_ready", true).eq("is_private", false)
        .eq("content_type", "recorded_course");
      const { data: live } = await supabase
        .from("content")
        .select("id, slug, title, content_type, cover_image_url, credit_cost, price, event_date")
        .eq("is_published", true).eq("is_ready", true).eq("is_private", false)
        .in("content_type", ["live_webinar", "batch_class"])
        .not("event_date", "is", null).gte("event_date", cutoff);
      return [...(recorded || []), ...(live || [])];
    },
  });

  const filtered = useMemo(
    () => (courses || []).filter((c) => !search || c.title.toLowerCase().includes(search.toLowerCase())),
    [courses, search],
  );
  const selected = (courses || []).find((c) => c.id === selectedId);

  const linkFor = (c: any) => {
    if (!c) return "";
    const path = c.content_type === "live_webinar" || c.content_type === "batch_class"
      ? `/webinar/${c.slug}` : `/courses/${c.slug}`;
    return `${window.location.origin}${path}?ref=${refCode || talentId}`;
  };

  const launch = (channel: string) => {
    if (!selected) return;
    const url = linkFor(selected);
    const text = `${selected.title} — ${url}`;
    const protocols: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(selected.title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    };
    window.open(protocols[channel], "_blank");
    if (!shared.includes(channel)) setShared((p) => [...p, channel]);
  };

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("gig_submissions").insert({
        gig_id: gig.id, talent_id: talentId, status: "pending",
        submission_data: { course_id: selected.id, share_url: linkFor(selected), channels: shared, ref_code: refCode },
      }).select("id").single();
      if (error) throw error;
      const { triggerAutoReview } = await import("@/lib/gigAutoReview");
      triggerAutoReview(data.id);
      toast.success("Tracking link active — earn 10 credits per enrollment");
      onSubmitted();
    } catch (e: any) {
      toast.error(e?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-xs font-semibold mb-2 block">1. Pick an active course</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 h-10 rounded-xl" placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="grid gap-2 max-h-56 overflow-y-auto mt-2 rounded-xl border border-border/40 p-2 bg-muted/20">
          {isLoading ? <Skeleton className="h-20 rounded-xl" /> : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No active courses available right now.</p>
          ) : filtered.map((c) => (
            <button key={c.id} onClick={() => setSelectedId(c.id)}
              className={cn("text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3",
                selectedId === c.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-background")}>
              {c.cover_image_url ? <img src={c.cover_image_url} className="h-10 w-10 rounded-lg object-cover shrink-0" /> :
                <div className="h-10 w-10 rounded-lg bg-primary/10 shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{c.title}</p>
                <Badge variant="outline" className="text-[9px] h-4 mt-1">{c.content_type.replace("_"," ")}</Badge>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <>
          <div>
            <Label className="text-xs font-semibold mb-2 block">2. Your unique link</Label>
            <div className="flex gap-2">
              <Input value={linkFor(selected)} readOnly className="text-xs h-10 rounded-xl font-mono" />
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shrink-0"
                onClick={() => { navigator.clipboard.writeText(linkFor(selected)); toast.success("Link copied"); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Earn <strong>10 credits</strong> for every person who enrolls through your link.
            </p>
          </div>

          <div>
            <Label className="text-xs font-semibold mb-2 block">3. Share it</Label>
            <div className="grid grid-cols-2 gap-2">
              {CHANNELS.map((ch) => (
                <Button key={ch.key} variant="outline" className="h-10 rounded-xl text-xs justify-start gap-2"
                  onClick={() => launch(ch.key)}>
                  <ch.icon className="h-4 w-4" /> {ch.label}
                  {shared.includes(ch.key) && <ShieldCheck className="h-3 w-3 ml-auto text-emerald-500" />}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={submit} disabled={submitting || shared.length === 0} className="w-full h-12 rounded-xl">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activate tracking"}
          </Button>
        </>
      )}
    </div>
  );
}
