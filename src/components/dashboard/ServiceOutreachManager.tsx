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
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ServiceConfig {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
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
    description: "Evaluate your readiness & skills gap",
    icon: ClipboardCheck,
    color: "text-primary",
  },
  {
    id: "MOCK_INTERVIEW",
    slug: "mock-interview",
    title: "Mock Interview",
    description: "Practice with AI-driven scenarios",
    icon: Mic,
    color: "text-accent-foreground",
  },
  {
    id: "SALARY_ANALYSIS",
    slug: "salary-analysis",
    title: "Salary Analysis",
    description: "Know your market worth accurately",
    icon: DollarSign,
    color: "text-warning",
  },
  {
    id: "PORTFOLIO",
    slug: "portfolio",
    title: "Portfolio",
    description: "Build & showcase your best work",
    icon: Palette,
    color: "text-secondary",
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

  // Load all share logs
  const loadShareLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from("service_share_logs")
      .select("channel, shared_at, service_slug")
      .order("shared_at", { ascending: false });

    if (error) {
      console.error("Error loading service share logs:", error);
    }
    setShareLogs(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadShareLogs();
  }, [loadShareLogs]);

  const getShareLink = (service: ServiceConfig, source: string) => {
    // Use public route for external sharing to enable anonymous tracking
    return `${window.location.origin}/services?service=${service.slug}&source=${source}`;
  };

  const recordShare = async (channel: string) => {
    if (!selectedService) return;

    // Optimistic Update
    setShareLogs((prev) => [
      ...prev,
      { channel, shared_at: new Date().toISOString(), service_slug: selectedService.slug },
    ]);

    const { error } = await supabase.from("service_share_logs").insert({
      service_slug: selectedService.slug,
      channel: channel,
      shared_at: new Date().toISOString(),
    });

    if (error) {
      // Revert if failed
      setShareLogs((prev) =>
        prev.filter((l) => !(l.channel === channel && l.service_slug === selectedService.slug))
      );
      toast.error("Failed to save progress. Check connection.");
    } else {
      toast.success(`Marked as shared on ${channel}`);
    }
  };

  const isShared = (service: ServiceConfig, channel: string) =>
    shareLogs.some((log) => log.channel === channel && log.service_slug === service.slug);

  const copyLink = async (source: string) => {
    if (!selectedService) return;
    const link = getShareLink(selectedService, source);
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied!");
    } catch {}
  };

  const templates = selectedService
    ? {
        english: `🚀 Career Service: ${selectedService.title}\n💡 ${selectedService.description}\n🔗 Try it now: ${getShareLink(selectedService, activeTab)}\n\n#career #growth`,
        bangla: `📢 ক্যারিয়ার সার্ভিস: ${selectedService.title}\n💡 ${selectedService.description}\n🔗 লিংক: ${getShareLink(selectedService, activeTab)}\n\n#bdjobs #career`,
      }
    : { english: "", bangla: "" };

  const copyTemplate = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Caption copied!");
    } catch {}
  };

  const handleSocialShare = (platform: "linkedin" | "facebook" | "whatsapp" | "telegram") => {
    if (!selectedService) return;
    const link = getShareLink(selectedService, platform);
    recordShare(platform);
    let url = "";
    switch (platform) {
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(`${selectedService.title}: ${selectedService.description}\n${link}`)}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(selectedService.title)}`;
        break;
    }
    window.open(url, "_blank", "width=600,height=600");
  };

  const handleOpenShare = (service: ServiceConfig) => {
    setSelectedService(service);
    setIsShareOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Service Outreach
          </CardTitle>
          <CardDescription>
            Promote career services on social media with tracked links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              const sharedCount = shareLogs.filter((l) => l.service_slug === service.slug).length;

              return (
                <Card
                  key={service.id}
                  className="cursor-pointer hover:border-primary/50 transition-all"
                  onClick={() => handleOpenShare(service)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Icon className={`h-5 w-5 ${service.color}`} />
                      </div>
                      <div>
                        <h3 className="font-medium">{service.title}</h3>
                        <p className="text-xs text-muted-foreground">{service.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sharedCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {sharedCount} shares
                        </Badge>
                      )}
                       <Button size="sm" variant="outline" className="gap-1">
                        <Share2 className="h-3 w-3" /> <span className="hidden sm:inline">Promote</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Promote: {selectedService?.title}</DialogTitle>
            <DialogDescription>Share on social media to drive traffic.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-6 mt-4">
            <div className="w-full sm:w-1/3 sm:border-r sm:pr-6 space-y-4 border-b sm:border-b-0 pb-4 sm:pb-0">
              <div className="space-y-2">
                {[
                  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
                  { id: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-500" },
                  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-green-500" },
                  { id: "telegram", label: "Telegram", icon: Send, color: "text-sky-500" },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveTab(ch.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all ${
                      activeTab === ch.id ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ch.icon className={`w-4 h-4 ${ch.color}`} /> <span>{ch.label}</span>
                    </div>
                    {selectedService && isShared(selectedService, ch.id) && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                  </button>
                ))}
                <div className="pt-2 mt-2 border-t">
                  <button
                    onClick={() => setActiveTab("custom")}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all ${
                      activeTab === "custom" ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <LinkIcon className="w-4 h-4 text-gray-500" />
                      <span>Custom Link</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              {(activeTab === "linkedin" || activeTab === "facebook") && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-md text-sm border border-blue-100">
                    <p className="font-semibold mb-1">Social Strategy</p>
                    Post on feed & groups.
                  </div>
                  <div>
                    <Label className="mb-2 block">Post Template ({activeTab})</Label>
                    <Textarea
                      value={activeTab === "linkedin" ? templates.english : templates.bangla}
                      readOnly
                      rows={6}
                      className="text-xs bg-muted/30"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyTemplate(activeTab === "linkedin" ? templates.english : templates.bangla)
                      }
                      className="mt-2 w-full"
                    >
                      <Copy className="w-3 h-3 mr-2" /> Copy Caption
                    </Button>
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleSocialShare(activeTab as any)}
                  >
                    <Share2 className="w-4 h-4 mr-2" /> Share Direct
                  </Button>
                </div>
              )}

              {(activeTab === "whatsapp" || activeTab === "telegram") && (
                <div className="space-y-4">
                  <div className="bg-green-50 p-3 rounded-md text-sm border border-green-100">
                    <p className="font-semibold mb-1">Direct Share</p>
                    Share in channels/groups.
                  </div>

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleSocialShare(activeTab as any)}
                  >
                    Open App
                  </Button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OR COPY LINK</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={selectedService ? getShareLink(selectedService, activeTab) : ""}
                      className="bg-muted text-xs"
                    />
                    <Button variant="outline" onClick={() => copyLink(activeTab)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      recordShare(activeTab);
                      toast.success("Marked!");
                    }}
                    disabled={selectedService ? isShared(selectedService, activeTab) : true}
                  >
                    {selectedService && isShared(selectedService, activeTab) ? (
                      <>
                        <Check className="w-4 h-4 mr-2" /> Done
                      </>
                    ) : (
                      "Mark as Done Manually"
                    )}
                  </Button>
                </div>
              )}

              {activeTab === "custom" && (
                <div className="space-y-4">
                  <div>
                    <Label>Channel Name</Label>
                    <Input
                      placeholder="e.g., Discord, Newsletter"
                      value={customChannel}
                      onChange={(e) => setCustomChannel(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Tracked Link</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        readOnly
                        value={
                          selectedService
                            ? getShareLink(selectedService, customChannel.toLowerCase() || "custom")
                            : ""
                        }
                        className="bg-muted text-xs"
                      />
                      <Button
                        variant="outline"
                        onClick={() => copyLink(customChannel.toLowerCase() || "custom")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      if (customChannel) {
                        recordShare(customChannel.toLowerCase());
                        toast.success("Marked!");
                      }
                    }}
                    disabled={!customChannel}
                  >
                    Mark as Shared
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
