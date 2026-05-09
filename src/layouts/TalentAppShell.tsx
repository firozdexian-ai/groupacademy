import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTalent } from "@/hooks/useTalent";
import { getCountryFlag } from "@/lib/constants/countries";
import { supabase } from "@/integrations/supabase/client";
import {
  Home,
  Briefcase,
  GraduationCap,
  Gift,
  Bot,
  User,
  Bell,
  MessageCircle,
  LogOut,
  Coins,
  Sun,
  Moon,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  Edit2,
  Receipt,
  Wallet,
  Bookmark,
  BookOpen,
  FileText,
  Download,
  ShieldCheck,
  Info,
  Share2,
  Globe,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCredits } from "@/hooks/useCredits";
import { useTheme } from "next-themes";
import { getWhatsAppLink } from "@/lib/constants/support";
import { downloadFile } from "@/lib/downloadFile";
import { toast } from "sonner";
import logoIcon from "@/assets/logo-icon.png";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { useCreditPurchase } from "@/hooks/useCreditPurchase";
import { GlobalAIBubble } from "@/components/ai/GlobalAIBubble";

/**
 * GroUp Academy: Institutional User Experience Perimeter
 * CTO Reference: Authoritative layout shell and navigation orchestrator.
 * Logic: Implements real-time notification sync and bimodal viewport adaptation.
 */

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

export function TalentAppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { talent } = useTalent();
  const { balance } = useCredits();
  const { theme, setTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasCompanyAccess, setHasCompanyAccess] = useState(false);
  const [isContentLead, setIsContentLead] = useState(false);
  const credits = useCreditPurchase();

  // HUD: Institutional Navigation Artifacts
  const desktopNavItems: NavItem[] = [
    { label: "Home", icon: Home, path: "/app/feed" },
    { label: "Jobs", icon: Briefcase, path: "/app/jobs" },
    { label: "Learning", icon: GraduationCap, path: "/app/learning" },
    { label: "Gigs", icon: Gift, path: "/app/gigs" },
    { label: "AI Agents", icon: Bot, path: "/app/agents" },
  ];

  const mobileNavItems: NavItem[] = [
    { label: "Home", icon: Home, path: "/app/feed" },
    { label: "Jobs", icon: Briefcase, path: "/app/jobs" },
    { label: "Learn", icon: GraduationCap, path: "/app/learning" },
    { label: "Gigs", icon: Gift, path: "/app/gigs" },
    { label: "AI Agents", icon: Bot, path: "/app/agents" },
  ];

  // PHASE: Real-Time_Notification_Orchestration
  useEffect(() => {
    if (!talent?.id) return;
    const fetchInstitutionalAlerts = async () => {
      try {
        const { count } = await supabase
          .from("notifications")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("talent_id", talent.id)
          .eq("is_read", false);
        setUnreadCount(count || 0);
      } catch (err) {
        console.error("ALERT_SYNC_FAULT", err);
      }
    };
    fetchInstitutionalAlerts();

    const channel = supabase
      .channel("notification-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `talent_id=eq.${talent.id}` },
        () => {
          fetchInstitutionalAlerts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [talent?.id]);

  // PHASE: Company_Portal_Access_Check
  useEffect(() => {
    if (!talent?.id) {
      setHasCompanyAccess(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from("company_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active");
      if (!cancelled) setHasCompanyAccess((count ?? 0) > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [talent?.id]);

  // PHASE: Content_Lead_Role_Check
  useEffect(() => {
    if (!talent?.id) {
      setIsContentLead(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("role", "content_lead" as any);
      if (!cancelled) setIsContentLead((count ?? 0) > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [talent?.id]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/ai-general?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const isActive = (path: string) => {
    if (path === "/app/feed" && location.pathname === "/app/feed") return true;
    if (path !== "/app/feed" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-background font-sans text-foreground transition-colors duration-300">
      {/* --- HUD: TOP NAVIGATION PERIMETER --- */}
      <header className="sticky top-0 z-50 bg-white dark:bg-background/95 dark:backdrop-blur-sm border-b border-border h-14 px-3 md:px-4 shadow-sm">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-2">
          {/* MOBILE_VIEWPORT_SENTINEL */}
          <div className="flex md:hidden items-center gap-2 w-full">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <button className="flex-shrink-0">
                  <Avatar className="h-8 w-8 border border-border cursor-pointer">
                    <AvatarImage src={talent?.profilePhotoUrl || ""} />
                    <AvatarFallback className="text-[10px]">ME</AvatarFallback>
                  </Avatar>
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                <div className="flex flex-col h-full bg-muted/30 dark:bg-background">
                  <div className="flex items-center justify-between px-4 py-3 bg-card border-b">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSidebarOpen(false)}>
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <span className="font-semibold text-base">Profile & Settings</span>
                    </div>
                    <img src={logoIcon} alt="Logo" className="h-7 w-7 rounded" />
                  </div>

                  <div className="px-4 py-4 bg-card border-b">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-14 w-14 border-2 border-primary/20">
                        <AvatarImage src={talent?.profilePhotoUrl || ""} />
                        <AvatarFallback className="text-sm">
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base truncate">{talent?.fullName || "Talent Node"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {talent?.countryCode && <span className="mr-1">{getCountryFlag(talent.countryCode)}</span>}
                          {talent?.phone || ""}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{talent?.email || ""}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigate("/app/profile/edit");
                          setSidebarOpen(false);
                        }}
                        className="p-2 rounded-full hover:bg-muted"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="py-2 space-y-0.5">
                      {([
                        { icon: Coins, label: "Buy Credits", action: () => credits.open() },
                        { icon: Receipt, label: "Transactions", action: () => navigate("/app/transactions") },
                        { icon: Wallet, label: "Withdraw earnings", action: () => navigate("/app/withdrawals") },
                        { icon: BarChart3, label: "Creator Analytics", action: () => navigate("/app/creator/analytics"), suffix: "New" },
                        { icon: Bookmark, label: "Saved Jobs", action: () => navigate("/app/saved") },
                        { icon: BookOpen, label: "My Learning", action: () => navigate("/app/learning/my-courses") },
                        { icon: Globe, label: "Study & Work Abroad", action: () => navigate("/app/abroad"), suffix: "New" },
                        { icon: FileText, label: "My Applications", action: () => navigate("/app/applications") },
                        ...(hasCompanyAccess
                          ? [{ icon: Sparkles, label: "Switch to Company Portal", action: () => window.open("/company", "_blank") }]
                          : []),
                        {
                          icon: Download,
                          label: "Download CV",
                          action: () => {
                            if (talent?.cvUrl) downloadFile(talent.cvUrl, `${talent.fullName || "cv"}-resume.pdf`);
                            else toast.info("No CV uploaded yet. Add one from your profile.");
                          },
                        },
                        {
                          icon: ShieldCheck,
                          label: "Verify your profile",
                          action: () => navigate("/app/profile/verify"),
                        },
                        {
                          icon: HelpCircle,
                          label: "Help Center",
                          action: () => window.open(getWhatsAppLink("Hi! I need help with the app"), "_blank"),
                        },
                        { icon: Info, label: "About GroUp Academy", action: () => window.open("/", "_blank") },
                        {
                          icon: Share2,
                          label: "Refer the app",
                          action: async () => {
                            const data = { title: "GroUp Academy", url: window.location.origin };
                            if (navigator.share) await navigator.share(data);
                            else {
                              await navigator.clipboard.writeText(data.url);
                              toast.success("Link copied to clipboard.");
                            }
                          },
                        },
                        
                      ] as { icon: any; label: string; action: () => void; suffix?: string }[]).map(({ icon: Icon, label, action, suffix }) => (
                        <button
                          key={label}
                          onClick={() => {
                            action?.();
                            if (action && !["Download CV", "Help Center", "Refer the app"].includes(label))
                              setSidebarOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium hover:bg-muted/60"
                        >
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <span className="flex-1 text-left">{label}</span>
                          {suffix ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                              {suffix}
                            </span>
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                          )}
                        </button>
                      ))}
                      <div className="flex items-center gap-3 px-5 py-3">
                        {theme === "dark" ? (
                          <Moon className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Sun className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="flex-1 text-sm font-medium">Dark Mode</span>
                        <Switch
                          checked={theme === "dark"}
                          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                        />
                      </div>
                    </div>
                  </ScrollArea>

                  <div className="p-4 border-t bg-card">
                    <Button
                      variant="ghost"
                      className="w-full text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        handleSignOut();
                        setSidebarOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <form onSubmit={handleSearch} className="flex-1 relative">
              <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-pulse" />
              <Input
                placeholder="Ask AI General..."
                className="h-9 pl-9 pr-3 bg-[#EEF3F8] dark:bg-muted/50 border-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <button className="relative flex-shrink-0" onClick={() => navigate("/app/messages")} aria-label="Messages">
              <MessageCircle className="h-6 w-6 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* DESKTOP_VIEWPORT_SENTINEL */}
          <div className="hidden md:flex items-center flex-1 gap-2">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/app/feed")}>
              <img
                alt="Logo"
                className="w-8 h-8 rounded"
                src="/lovable-uploads/9c7f3b64-8763-474e-951b-6420b7c33965.png"
              />
            </div>
            <form onSubmit={handleSearch} className="relative w-full max-w-xs">
              <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-pulse" />
              <Input
                placeholder="Ask AI General anything..."
                className="h-9 pl-9 bg-[#EEF3F8] dark:bg-muted/50 border-none transition-all w-64 focus:w-80"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <nav className="hidden md:flex items-center gap-1 lg:gap-6 h-full">
            {desktopNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center w-16 lg:w-20 h-full border-b-2 transition-all group ${isActive(item.path) ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-muted-foreground"}`}
              >
                <item.icon className={`h-6 w-6 mb-0.5 ${isActive(item.path) ? "fill-current" : ""}`} />
                <span className="text-[10px] lg:text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4 flex-none">
            <button
              className="relative flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => navigate("/app/messages")}
            >
              <MessageCircle className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              <span className="text-[10px] font-medium mt-0.5">Messages</span>
            </button>
            <div className="h-8 w-px bg-border mx-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-center justify-center outline-none group text-muted-foreground">
                  <Avatar className="h-6 w-6 border border-border">
                    <AvatarImage src={talent?.profilePhotoUrl || ""} />
                    <AvatarFallback className="text-[10px]">ME</AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] font-medium mt-0.5">Me ▼</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-2">
                <div className="flex items-center gap-3 p-2 mb-2 bg-muted/50 rounded-md">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={talent?.profilePhotoUrl || ""} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-sm truncate">{talent?.fullName || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{talent?.email || ""}</p>
                  </div>
                </div>
                <DropdownMenuItem
                  onClick={() => navigate("/app/profile")}
                  className="text-primary font-medium border border-primary justify-center rounded-full mb-2"
                >
                  View Profile
                </DropdownMenuItem>

                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Account</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate("/app/profile/edit")} className="cursor-pointer">
                  <Edit2 className="h-4 w-4 mr-2" /> Settings & Privacy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/profile/verify")} className="cursor-pointer">
                  <ShieldCheck className="h-4 w-4 mr-2" /> Verify your profile
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Activity</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate("/app/saved")} className="cursor-pointer">
                  <Bookmark className="h-4 w-4 mr-2" /> Saved Jobs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/applications")} className="cursor-pointer">
                  <FileText className="h-4 w-4 mr-2" /> My Applications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/learning/my-courses")} className="cursor-pointer">
                  <BookOpen className="h-4 w-4 mr-2" /> My Learning
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/transactions")} className="cursor-pointer">
                  <Receipt className="h-4 w-4 mr-2" /> Transactions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/withdrawals")} className="cursor-pointer">
                  <Wallet className="h-4 w-4 mr-2" /> Withdraw earnings
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Quick actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => credits.open()} className="cursor-pointer">
                  <Coins className="h-4 w-4 mr-2 text-amber-500" /> Buy Credits
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (talent?.cvUrl) downloadFile(talent.cvUrl, `${talent.fullName || "cv"}-resume.pdf`);
                    else toast.info("No CV uploaded yet. Add one from your profile.");
                  }}
                  className="cursor-pointer"
                >
                  <Download className="h-4 w-4 mr-2" /> Download CV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/abroad")} className="cursor-pointer">
                  <Globe className="h-4 w-4 mr-2" /> Study & Work Abroad
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">New</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    const data = { title: "GroUp Academy", url: window.location.origin };
                    if (navigator.share) await navigator.share(data);
                    else {
                      await navigator.clipboard.writeText(data.url);
                      toast.success("Link copied to clipboard.");
                    }
                  }}
                  className="cursor-pointer"
                >
                  <Share2 className="h-4 w-4 mr-2" /> Refer the app
                </DropdownMenuItem>

                {hasCompanyAccess && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => window.open("/company", "_blank")}
                      className="cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4 mr-2 text-primary" /> Switch to Company Portal
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => window.open(getWhatsAppLink("Hi!"), "_blank")}
                  className="cursor-pointer"
                >
                  <HelpCircle className="h-4 w-4 mr-2" /> Help Center
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="cursor-pointer"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => credits.open()}
              className="group"
              aria-label="Buy credits"
            >
              <Badge
                variant="secondary"
                className="gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800 cursor-pointer group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors"
              >
                <Coins className="h-3 w-3 fill-amber-500" />
                <span className="font-bold">{balance}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 ml-1">+ Buy</span>
              </Badge>
            </button>
          </div>
        </div>
      </header>

      {/* --- HUD: MAIN_CONTENT_NODES --- */}
      <main className="max-w-7xl mx-auto py-2 md:py-6 px-0 md:px-4 pb-24 md:pb-6">
        <Outlet />
      </main>

      {/* GLOBAL: Credit Purchase Sheet (any component can open via useCreditPurchase) */}
      <CreditPurchaseSheet
        isOpen={credits.isOpen}
        onClose={credits.close}
        currentBalance={balance}
      />

      {/* GLOBAL: Floating AI Assistant — Career Coach by default, context-aware */}
      <GlobalAIBubble />

      {/* --- HUD: MOBILE BOTTOM TAB BAR --- */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-background border-t border-border px-2 flex items-center justify-around z-50 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]"
        style={{
          height: "calc(60px + env(safe-area-inset-bottom, 0px))",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {mobileNavItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive(item.path) ? "text-primary" : "text-gray-500"}`}
          >
            <item.icon className={`h-5 w-5 mb-0.5 ${isActive(item.path) ? "fill-current" : ""}`} />
            <span className="text-[10px] font-medium">{item.label}</span>
            {isActive(item.path) && <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
