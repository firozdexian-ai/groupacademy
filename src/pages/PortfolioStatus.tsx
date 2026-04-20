import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Search,
  Clock,
  MessageCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Copy,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { withTimeout } from "@/hooks/useDataFetch";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { cn } from "@/lib/utils";

interface PortfolioRequest {
  id: string;
  full_name: string;
  email: string;
  status: string;
  portfolio_url: string | null;
  portfolio_credentials: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "In Review", color: "text-amber-600 bg-amber-500/10 border-amber-500/20", icon: Clock },
  contacted: {
    label: "Handshake Initiated",
    color: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    icon: MessageCircle,
  },
  in_progress: {
    label: "Engineering Phase",
    color: "text-purple-600 bg-purple-500/10 border-purple-500/20",
    icon: Loader2,
  },
  completed: {
    label: "Protocol Active",
    color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    icon: CheckCircle,
  },
  cancelled: { label: "Terminated", color: "text-rose-600 bg-rose-500/10 border-rose-500/20", icon: XCircle },
};

const statusSteps = ["pending", "contacted", "in_progress", "completed"];

export default function PortfolioStatus() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<PortfolioRequest[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await withTimeout(
        Promise.resolve(
          supabase
            .from("portfolio_requests")
            .select("*")
            .eq("email", email.trim().toLowerCase())
            .order("created_at", { ascending: false }),
        ),
        TIMEOUTS.DEFAULT,
        "Search sequence timed out.",
      );

      if (error) throw error;
      setRequests((data || []) as any);

      if (!data?.length) {
        toast({
          title: "Node Not Found",
          description: "No build requests associated with this identity.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({ title: "Sync Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Data Clipped", description: `${label} synchronized to clipboard.` });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      <Navbar />
      <main className="flex-1 container max-w-3xl mx-auto px-6 py-20 animate-in fade-in duration-700">
        <div className="space-y-12">
          <header className="text-center space-y-4">
            <div className="h-16 w-16 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-6">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter">Build Sequence Monitor</h1>
            <p className="text-muted-foreground font-medium max-w-md mx-auto">
              Track the engineering lifecycle of your professional digital artifacts.
            </p>
          </header>

          <Card className="rounded-[32px] border-border/40 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-xl">
            <CardContent className="p-8">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">
                    Identity Filter
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="h-12 rounded-xl bg-background/50 border-border/40 font-bold"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 sm:mt-6 px-8 rounded-xl font-black uppercase tracking-widest text-[10px]"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}{" "}
                  Initialize Search
                </Button>
              </form>
            </CardContent>
          </Card>

          {requests && requests.length > 0 && (
            <div className="space-y-8">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">
                Requests Found: {requests.length}
              </p>
              {requests.map((request) => {
                const config = statusConfig[request.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                const stepIndex = statusSteps.indexOf(request.status);

                return (
                  <Card
                    key={request.id}
                    className="rounded-[40px] border-border/40 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4"
                  >
                    <CardHeader className="p-8 border-b border-border/10 bg-muted/20">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-xl font-black tracking-tighter uppercase">
                            {request.full_name}
                          </CardTitle>
                          <p className="text-[9px] font-mono text-muted-foreground uppercase">
                            NODE_ID: {request.id.slice(0, 12)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest border",
                            config.color,
                          )}
                        >
                          <StatusIcon className="h-3 w-3 mr-2" /> {config.label}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-8 space-y-10">
                      {/* Timeline HUD */}
                      {request.status !== "cancelled" && (
                        <div className="relative pt-2 px-2">
                          <div className="absolute top-[18px] left-0 right-0 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-1000"
                              style={{ width: `${(Math.max(0, stepIndex) / (statusSteps.length - 1)) * 100}%` }}
                            />
                          </div>
                          <div className="relative flex justify-between">
                            {statusSteps.map((step, idx) => {
                              const stepConfig = statusConfig[step];
                              const StepIcon = stepConfig.icon;
                              const isCompleted = idx <= stepIndex;
                              return (
                                <div key={step} className="flex flex-col items-center">
                                  <div
                                    className={cn(
                                      "w-9 h-9 rounded-xl flex items-center justify-center z-10 transition-all duration-500",
                                      isCompleted
                                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                                        : "bg-muted text-muted-foreground/40",
                                    )}
                                  >
                                    <StepIcon className="h-4 w-4" />
                                  </div>
                                  <span
                                    className={cn(
                                      "text-[8px] font-black uppercase tracking-tighter mt-3",
                                      isCompleted ? "text-primary" : "text-muted-foreground/40",
                                    )}
                                  >
                                    {stepConfig.label.split(" ")[0]}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Ready Artifact State */}
                      {request.status === "completed" && request.portfolio_url && (
                        <div className="bg-emerald-500/[0.03] border-2 border-emerald-500/10 rounded-[32px] p-8 space-y-6 animate-in zoom-in-95">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                              <ShieldCheck className="h-6 w-6 text-emerald-500" />
                            </div>
                            <h4 className="font-black uppercase text-sm tracking-tight text-emerald-700">
                              Digital Artifact Live
                            </h4>
                          </div>

                          <div className="grid gap-4">
                            <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-emerald-500/10">
                              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                Global Endpoint
                              </span>
                              <div className="flex items-center gap-3">
                                <a
                                  href={request.portfolio_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5"
                                >
                                  Visit Portfolio <ExternalLink className="h-3 w-3" />
                                </a>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => copyToClipboard(request.portfolio_url!, "Link")}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            {request.portfolio_credentials && (
                              <div className="p-6 bg-muted/20 rounded-2xl border border-border/40 space-y-4">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border/40 pb-2">
                                  Administrative Credentials (CMS)
                                </p>
                                <div className="grid gap-3">
                                  {["email", "password"].map((field) => (
                                    <div key={field} className="flex items-center justify-between">
                                      <span className="text-[9px] font-bold uppercase text-muted-foreground/60">
                                        {field}:
                                      </span>
                                      <div className="flex items-center gap-3">
                                        <code className="text-xs font-mono font-bold">
                                          {request.portfolio_credentials![field]}
                                        </code>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => copyToClipboard(request.portfolio_credentials![field], field)}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/10">
                        <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <span>Logged: {format(new Date(request.created_at), "dd.MM.yy")}</span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span>Sync: {format(new Date(request.updated_at), "dd.MM.yy")}</span>
                        </div>
                        {request.status !== "completed" && (
                          <a
                            href="https://wa.me/8801889825025"
                            target="_blank"
                            className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest hover:opacity-80 transition-opacity"
                          >
                            Support Terminal <ArrowRight className="h-3 w-3" />
                          </a>
                        )}
                      </footer>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
