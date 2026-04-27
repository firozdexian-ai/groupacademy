import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Share2,
  Linkedin,
  Facebook,
  MessageCircle,
  Send,
  CheckCircle2,
  Link as LinkIcon,
  Copy,
  Check,
  ClipboardCheck,
  Mic,
  DollarSign,
  Palette,
  Sparkles,
  ExternalLink,
  Zap,
  Globe,
  Activity,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Service Outreach & Attribution Manager
 * CTO Reference: High-fidelity campaign orchestrator for social distribution.
 */

interface ServiceConfig {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

interface ShareLog {
  channel: string;
  shared_at: string;
  service_slug: string;
}

const SERVICES: ServiceConfig[] = [
  {
    id: "CAREER_ASSESSMENT",
    slug: "assessment",
    title: "Career Scorecard",
    description: "Evaluate readiness & technical gaps",
    icon: ClipboardCheck,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "MOCK_INTERVIEW",
    slug: "mock-interview",
    title: "Interview Pulse",
    description: "AI-driven behavioral simulations",
    icon: Mic,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: "SALARY_ANALYSIS",
    slug: "salary-analysis",
    title: "Salary Intelligence",
    description: "Precise market worth calibration",
    icon: DollarSign,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: "PORTFOLIO",
    slug: "portfolio",
    title: "Portfolio Node",
    description: "Showcase verified professional artifacts",
    icon: Palette,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
];

export function ServiceOutreachManager() {
  const [selectedService, setSelectedService] = useState<ServiceConfig | null>(null);
  const [shareLogs, setShareLogs] = useState<ShareLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Share Dialog State
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("linkedin");
  const [customChannel, setCustomChannel] = useState("");

  const loadShareLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from("service_share_logs")
      .select("channel, shared_at, service_slug")
      .order("shared_at", { ascending: false });

    if (error) console.error("Telemetry Fault:", error);
    setShareLogs(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadShareLogs();
  }, [loadShareLogs]);

  const getShareLink = (service: ServiceConfig, source: string) => {
    return `${window.location.origin}/services?service=${service.slug}&source=${source.toLowerCase()}`;
  };

  const recordShare = async (channel: string) => {
    if (!selectedService) return;

    // Optimistic Logic
    const newLog = { channel, shared_at: new Date().toISOString(), service_slug: selectedService.slug };
    setShareLogs((prev) => [newLog, ...prev]);

    const { error } = await supabase.from("service_share_logs").insert({
      service_slug: selectedService.slug,
      channel: channel.toLowerCase(),
    });

    if (error) {
      setShareLogs((prev) => prev.filter((l) => l !== newLog));
      toast.error("System Error: Progress synchronization failed.");
    } else {
      toast.success(`Protocol: Recorded share on ${channel}`);
    }
  };

  const isShared = (service: ServiceConfig, channel: string) =>
    shareLogs.some((log) => log.channel === channel && log.service_slug === service.slug);

  const copyToClipboard = async (text: string, type: "link" | "caption") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(type === "link" ? "Link Authenticated & Copied" : "Caption Template Secured");
    } catch (err) {
      toast.error("Clipboard Fault Detected");
    }
  };

  const handleSocialShare = (platform: string) => {
    if (!selectedService) return;
    const link = getShareLink(selectedService, platform);
    recordShare(platform);

    let url = "";
    const encodedLink = encodeURIComponent(link);
    const encodedText = encodeURIComponent(`${selectedService.title}: ${selectedService.description}`);

    switch (platform) {
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodedText}%0A${encodedLink}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodedLink}&text=${encodedText}`;
        break;
    }
    if (url) window.open(url, "_blank", "width=600,height=600");
  };

  const templates = selectedService
    ? {
        english: `🚀 [ GroUp Academy ]\n\nService: ${selectedService.title}\nInsight: ${selectedService.description}\n\nInitialize here: ${getShareLink(selectedService, activeTab)}\n\n#career #AI #futureofwork`,
        bangla: `📢 [ গ্রুআপ একাডেমি ]\n\nসার্ভিস: ${selectedService.title}\nবিবরণ: ${selectedService.description}\n\nলিংক: ${getShareLink(selectedService, activeTab)}\n\n#career #success #bangladesh`,
      }
    : { english: "", bangla: "" };

  if (isLoading)
    return (
      <div className="grid gap-6 md:grid-cols-2 p-4">
        <Skeleton className="h-40 w-full rounded-[32px]" />
        <Skeleton className="h-40 w-full rounded-[32px]" />
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Zap className="h-8 w-8 fill-current" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Service Pulse</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Campaign Distribution & Attribution Registry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-14 px-6 rounded-2xl border-2 font-black italic gap-2 text-primary">
            <Activity className="h-4 w-4" /> {shareLogs.length} TOTAL TRANSMISSIONS
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          const sharedCount = shareLogs.filter((l) => l.service_slug === service.slug).length;

          return (
            <Card
              key={service.id}
              className="group cursor-pointer rounded-[32px] border-2 border-border/40 bg-card/30 hover:border-primary/40 transition-all duration-500 overflow-hidden shadow-xl"
              onClick={() => {
                setSelectedService(service);
                setIsShareOpen(true);
              }}
            >
              <div className={cn("h-1 w-full", service.color.replace("text", "bg"))} />
              <CardContent className="p-8 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div
                    className={cn(
                      "h-16 w-16 rounded-2xl flex items-center justify-center border-2 transition-transform group-hover:rotate-6 shadow-inner",
                      service.bg,
                      "border-white/5",
                    )}
                  >
                    <Icon className={cn("h-8 w-8", service.color)} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-black uppercase italic tracking-tight">{service.title}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 italic">
                      {service.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {sharedCount > 0 && (
                    <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] italic px-3">
                      {sharedCount} NODES ACTIVE
                    </Badge>
                  )}
                  <Button variant="ghost" size="icon" className="rounded-xl h-12 w-12 hover:bg-primary/10">
                    <ExternalLink className="h-5 w-5 text-primary" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* SHARE DIALOG */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-3xl rounded-[40px] border-4 border-border/40 p-0 overflow-hidden bg-background/95 backdrop-blur-2xl shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10">
            <DialogHeader className="mb-8 text-left">
              <div className="flex items-center gap-5">
                <div className={cn("p-4 rounded-2xl border-2", selectedService?.bg)}>
                  {selectedService && <selectedService.icon className={cn("h-8 w-8", selectedService.color)} />}
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">
                    Promote: {selectedService?.title}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                    Campaign distribution for platform nodes
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex flex-col md:flex-row gap-10">
              {/* SIDEBAR */}
              <div className="w-full md:w-1/3 space-y-3">
                {[
                  {
                    id: "linkedin",
                    label: "LINKEDIN OPS",
                    icon: Linkedin,
                    color: "text-blue-600",
                    bg: "bg-blue-600/5",
                  },
                  {
                    id: "facebook",
                    label: "FACEBOOK FEED",
                    icon: Facebook,
                    color: "text-blue-500",
                    bg: "bg-blue-500/5",
                  },
                  {
                    id: "whatsapp",
                    label: "WHATSAPP DIRECT",
                    icon: MessageCircle,
                    color: "text-green-500",
                    bg: "bg-green-500/5",
                  },
                  { id: "telegram", label: "TELEGRAM CHANNEL", icon: Send, color: "text-sky-500", bg: "bg-sky-500/5" },
                  {
                    id: "custom",
                    label: "CUSTOM TRACKING",
                    icon: LinkIcon,
                    color: "text-muted-foreground",
                    bg: "bg-muted/30",
                  },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveTab(ch.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300",
                      activeTab === ch.id
                        ? "border-primary bg-primary/5 shadow-inner scale-105"
                        : "border-border/40 hover:border-primary/20 bg-muted/20",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <ch.icon className={cn("w-5 h-5", ch.color)} />
                      <span className="font-black uppercase italic text-[10px] tracking-widest">{ch.label}</span>
                    </div>
                    {selectedService && isShared(selectedService, ch.id) && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* CONTENT AREA */}
              <div className="flex-1 space-y-6 text-left">
                {activeTab !== "custom" ? (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="p-6 bg-primary/5 rounded-[32px] border-2 border-primary/10">
                      <p className="text-[10px] font-black uppercase text-primary italic mb-3 flex items-center gap-2">
                        <Globe className="h-3 w-3" /> Regional Template
                      </p>
                      <Textarea
                        value={
                          activeTab === "linkedin" || activeTab === "telegram" ? templates.english : templates.bangla
                        }
                        readOnly
                        className="min-h-[160px] text-xs font-medium bg-transparent border-none focus-visible:ring-0 italic leading-relaxed"
                      />
                      <Button
                        variant="outline"
                        className="w-full mt-4 rounded-xl font-black uppercase text-[10px] italic border-2"
                        onClick={() =>
                          copyToClipboard(
                            activeTab === "linkedin" || activeTab === "telegram" ? templates.english : templates.bangla,
                            "caption",
                          )
                        }
                      >
                        <Copy className="h-3 w-3 mr-2" /> Copy Deployment Caption
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        className="h-16 rounded-2xl font-black uppercase italic text-sm gap-3 shadow-lg"
                        onClick={() => handleSocialShare(activeTab)}
                      >
                        <ExternalLink className="h-5 w-5" /> Launch {activeTab.toUpperCase()}
                      </Button>
                      <Button
                        variant="outline"
                        className="h-16 rounded-2xl font-black uppercase italic text-sm gap-3 border-2"
                        onClick={() =>
                          copyToClipboard(selectedService ? getShareLink(selectedService, activeTab) : "", "link")
                        }
                      >
                        <LinkIcon className="h-5 w-5" /> Copy Tracked Link
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-primary italic ml-2">
                        Channel Identifier
                      </Label>
                      <Input
                        placeholder="e.g. UNIVERSITY_NEWSLETTER_Q2"
                        value={customChannel}
                        onChange={(e) => setCustomChannel(e.target.value)}
                        className="h-14 rounded-2xl border-2 font-black uppercase text-xs tracking-widest"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-primary italic ml-2">
                        Generated Telemetry URL
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={selectedService ? getShareLink(selectedService, customChannel || "custom") : ""}
                          className="h-14 rounded-2xl border-2 font-mono text-[10px] bg-muted/30"
                        />
                        <Button
                          variant="outline"
                          className="h-14 w-14 rounded-2xl border-2"
                          onClick={() =>
                            copyToClipboard(
                              selectedService ? getShareLink(selectedService, customChannel || "custom") : "",
                              "link",
                            )
                          }
                        >
                          <Copy className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      className="w-full h-16 rounded-2xl font-black uppercase italic text-sm"
                      onClick={() => {
                        if (customChannel) recordShare(customChannel);
                      }}
                      disabled={!customChannel}
                    >
                      Register Custom Transmission
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
