import { useState, useEffect } from "react";
import { getCurrentUserId } from "@/lib/auth";
import { listJobChannelPosts, insertJobChannelPost } from "@/domains/jobs/repo/jobsRepo";
import { generateJobShareCaption } from "@/domains/jobs/api/jobsApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Sparkles,
  Copy,
  CheckCircle2,
  MessageCircle,
  Linkedin,
  Facebook,
  Mail,
  Zap,
  ShieldCheck,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { InlineSpinner } from "@/components/common/InlineSpinner";

/**
 * GroUp Academy: Social Syndication Node
 * CTO Reference: Neural-driven caption generator and cross-channel posting registry.
 */

const CHANNELS = [
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-success", bg: "bg-success/10" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-primary", bg: "bg-primary/10" },
  { key: "facebook", label: "Facebook", icon: Facebook, color: "text-accent", bg: "bg-accent/10" },
  { key: "email", label: "Email", icon: Mail, color: "text-warning", bg: "bg-warning/10" },
] as const;

interface Props {
  job: {
    id: string;
    title: string;
    company_name: string;
    location: string | null;
    job_type: string | null;
    application_type: string;
    application_url: string | null;
    application_email: string | null;
  };
}

export function ChannelPromotionCard({ job }: Props) {
  const [activeChannel, setActiveChannel] = useState<(typeof CHANNELS)[number]["key"]>("whatsapp");
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [posted, setPosted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchSyndicationState = async () => {
      const data = await listJobChannelPosts(job.id);
      setPosted(new Set(data.map((d) => d.channel)));
    };
    fetchSyndicationState();
  }, [job.id]);

  const applyLink =
    job.application_type === "link"
      ? job.application_url
      : job.application_type === "email"
        ? `mailto:${job.application_email}`
        : `${window.location.origin}/jobs/${job.id}`;

  const handleGenerate = async (channel: string) => {
    setGenerating(true);
    const toastId = toast.loading(`Initializing neural drafting for ${channel.toUpperCase()}...`);

    try {
      const data = await generateJobShareCaption({
        title: job.title,
        company: job.company_name,
        location: job.location,
        job_type: job.job_type,
        apply_link: applyLink,
        channel,
      });

      setCaptions((c) => ({ ...c, [channel]: data?.caption || "" }));
      toast.success("Intelligence Extracted: Caption optimized.", { id: toastId });
    } catch (err: any) {
      toast.error("Neural Fault: " + err.message, { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPosted = async (channel: string) => {
    const uid = await getCurrentUserId();
    try {
      await insertJobChannelPost({
        job_id: job.id,
        channel,
        posted_by: uid || null,
        caption: captions[channel] || null,
      });
    } catch (error: any) {
      return toast.error("Error: " + error.message);
    }

    setPosted((p) => new Set(p).add(channel));
    toast.success(`Syndication logged on ${channel}`);
  };

  return (
    <Card className="rounded-2xl border border-border/60 bg-card shadow-xl overflow-hidden animate-in fade-in duration-500">
      <CardHeader className="p-6 border-b border-border/10 bg-muted/10">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <CardTitle className="text-lg font-semibold uppercase italic tracking-tight leading-none">
              {job.title}
            </CardTitle>
            <CardDescription className="text-[10px] font-bold mt-1">
              Syndication Node — {job.company_name}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="h-7 px-3 rounded-full border-2 font-semibold text-[9px] gap-1.5 uppercase"
          >
            <Share2 className="h-3 w-3" /> {posted.size}/{CHANNELS.length} SYNCED
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* CHANNEL SELECTION NODES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            const isPosted = posted.has(c.key);
            const isActive = activeChannel === c.key;
            return (
              <Button
                key={c.key}
                variant="ghost"
                className={cn(
                  "h-12 rounded-2xl border-2 transition-all font-black uppercase text-[10px] italic tracking-tighter gap-2",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]"
                    : "border-border/20 hover:bg-primary/5",
                  isPosted && !isActive ? "border-success/30 bg-success/5 text-success" : "",
                )}
                onClick={() => setActiveChannel(c.key)}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : c.color)} />
                <span className="hidden sm:inline">{c.label}</span>
                {isPosted && <CheckCircle2 className="h-3 w-3 ml-auto text-success fill-success/10" />}
              </Button>
            );
          })}
        </div>

        {/* PAYLOAD EDITOR */}
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
          <div className="relative group">
            <div className="absolute top-3 right-3 z-10">
              <Badge className="bg-background/80 backdrop-blur-sm border-2 font-semibold text-[8px] uppercase">
                {captions[activeChannel]?.length || 0} CH_COUNT
              </Badge>
            </div>
            <Textarea
              rows={6}
              placeholder={`Initialize draft for ${activeChannel.toUpperCase()}...`}
              className="rounded-3xl border-2 font-medium italic text-sm leading-relaxed bg-muted/5 p-6 focus-visible:ring-primary shadow-inner"
              value={captions[activeChannel] || ""}
              onChange={(e) => setCaptions((c) => ({ ...c, [activeChannel]: e.target.value }))}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              size="sm"
              variant="outline"
              className="h-11 px-5 rounded-xl border-2 font-semibold uppercase text-[10px] tracking-widest gap-2 hover:bg-primary/5"
              onClick={() => handleGenerate(activeChannel)}
              disabled={generating}
            >
              {generating ? (
                <InlineSpinner size="sm" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary fill-primary/20" />
              )}
              Neural Optimization
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-11 px-5 rounded-xl border-2 font-semibold uppercase text-[10px] tracking-widest gap-2"
              disabled={!captions[activeChannel]}
              onClick={() => {
                navigator.clipboard.writeText(captions[activeChannel]);
                toast.success("Artifact Secured to Clipboard");
              }}
            >
              <Copy className="h-4 w-4" /> Secure Copy
            </Button>

            <Button
              size="sm"
              className="h-11 px-6 rounded-xl font-semibold uppercase text-[10px] tracking-widest gap-2 shadow-lg ml-auto"
              disabled={!captions[activeChannel] || posted.has(activeChannel)}
              onClick={() => handleMarkPosted(activeChannel)}
            >
              <Zap className="h-4 w-4 fill-current" /> Finalize Syndication
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
