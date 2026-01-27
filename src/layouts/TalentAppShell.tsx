import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  GraduationCap,
  Briefcase,
  Globe,
  Bot,
  Sparkles,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Bookmark,
  FileText,
  Settings,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTalent } from "@/hooks/useTalent";
import { usePWADetect } from "@/hooks/usePWADetect";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";
import logoIcon from "@/assets/logo-icon.png";
import { useTheme } from "next-themes";
import { CreditBalance } from "@/components/credits/CreditBalance";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { Separator } from "@/components/ui/separator";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

// Desktop Sidebar Items (Full List)
const DESKTOP_NAV_ITEMS = [
  { path: "/app/feed", label: "Feed", icon: Home },
  { path: "/app/jobs", label: "Jobs", icon: Briefcase },
  { path: "/app/learning", label: "Learn", icon: GraduationCap },
  { path: "/app/services", label: "Services", icon: Sparkles },
  { path: "/app/abroad", label: "Abroad", icon: Globe },
  { path: "/app/agents", label: "AI Agents", icon: Bot },
];

// Mobile Bottom Nav (Priority List - Max 5)
const MOBILE_NAV_ITEMS = [
  { path: "/app/feed", label: "Feed", icon: Home },
  { path: "/app/jobs", label: "Jobs", icon: Briefcase },
  { path: "/app/learning", label: "Learn", icon: GraduationCap },
  { path: "/app/agents", label: "AI", icon: Bot },
];

export function TalentAppShell() {
  const { talent, signOut, isLoading, refreshTalent } = useTalent();
  const { isPWA } = usePWADetect();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Global Onboarding Check
    // If talent exists but hasn't completed onboarding, FORCE the wizard.
    if (talent && !talent.onboardingCompletedAt) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [talent]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleMobileNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleOnboardingComplete = async () => {
    // When wizard finishes, refresh talent data to update 'onboardingCompletedAt'
    // This will cause the useEffect to run again and hide the wizard.
    await refreshTalent();
    setShowOnboarding(false);
    // User remains on the current URL (e.g. /app/jobs/123), preserving the "hook"
  };

  // 1. Loading State (PWA Branded)
  if (isLoading) {
    if (isPWA) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <img src={logoIcon} alt="GroUp Academy" className="w-16 h-16 mb-4 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // 2. Auth Guard
  if (!talent) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    navigate(`/auth?returnTo=${returnUrl}`, { replace: true });
    return null;
  }

  // 3. Onboarding Guard (The Fix)
  // If onboarding is required, render Wizard INSTAEAD of the App Shell.
  // This effectively traps the user until they complete it.
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-background">
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  const logoSrc = theme === "dark" ? logoDark : logoLight;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex w-64 flex-col border-r h-screen sticky top-0 bg-card/50 backdrop-blur-sm z-40">
        {/* Sidebar Header */}
        <div className="p-6 h-16 flex items-center border-b">
          <NavLink to="/app/feed">
            <img src={logoSrc} alt="GroUp Academy" className="h-8" />
          </NavLink>
        </div>

        {/* Sidebar Navigation */}
        <ScrollArea className="flex-1 px-4 py-6">
          <nav className="space-y-2">
            {DESKTOP_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </ScrollArea>

        {/* Sidebar Footer (Profile & Logout) */}
        <div className="p-4 border-t space-y-4 bg-background/50">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={talent?.profilePhotoUrl || undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {talent?.fullName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{talent.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{talent.email}</p>
            </div>
          </div>

          <div className="px-2">
            <CreditBalance variant="compact" />
          </div>

          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50 shadow-sm h-14 px-4 flex items-center justify-between">
          <NavLink to="/app/feed">
            <img src={logoIcon} alt="GroUp" className="h-8 w-8" />
          </NavLink>

          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <Avatar 
              className="h-9 w-9 cursor-pointer ring-2 ring-border hover:ring-primary/50 transition-all"
              onClick={() => navigate('/app/profile')}
            >
              <AvatarImage src={talent?.profilePhotoUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {talent?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Mobile Menu Overlay (Replaces standard menu) */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[60] bg-background flex flex-col animate-in slide-in-from-bottom-5 duration-300">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-bold text-lg">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {/* Profile Card */}
                <div
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border"
                  onClick={() => handleMobileNavClick("/app/profile")}
                >
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={talent?.profilePhotoUrl || undefined} />
                    <AvatarFallback>{talent?.fullName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{talent.fullName}</p>
                    <p className="text-sm text-muted-foreground">View Profile</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Credits */}
                <CreditBalance variant="full" />

                {/* Quick Links Group */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground px-2 mb-2 uppercase tracking-wider">
                    Features
                  </p>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-base"
                    onClick={() => handleMobileNavClick("/app/services")}
                  >
                    <Sparkles className="h-5 w-5 text-purple-500" /> Services Hub
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-base"
                    onClick={() => handleMobileNavClick("/app/abroad")}
                  >
                    <Globe className="h-5 w-5 text-blue-500" /> Study Abroad
                  </Button>
                </div>

                <Separator />

                {/* Personal Links Group */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground px-2 mb-2 uppercase tracking-wider">
                    Personal
                  </p>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-base"
                    onClick={() => handleMobileNavClick("/app/saved")}
                  >
                    <Bookmark className="h-5 w-5" /> Saved Items
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-base"
                    onClick={() => handleMobileNavClick("/app/applications")}
                  >
                    <FileText className="h-5 w-5" /> My Applications
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-base"
                    onClick={() => handleMobileNavClick("/app/services/my-results")}
                  >
                    <Briefcase className="h-5 w-5" /> My Results
                  </Button>
                </div>

                <Separator />

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 text-base text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" /> Sign Out
                </Button>
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto pb-[80px] md:pb-6">
          <div className="hidden md:flex justify-end p-4">
            <div className="flex items-center gap-4">
              <NotificationDropdown />
            </div>
          </div>
          <Outlet />
        </main>
      </div>

      {/* ================= MOBILE BOTTOM NAV (Clean 5 Items) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md nav-float safe-bottom border-t shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around h-[68px] px-1">
          {MOBILE_NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full h-full transition-all active:scale-95",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-xl transition-all duration-300",
                    isActive && "bg-primary/10 translate-y-[-2px]",
                  )}
                >
                  <item.icon
                    className={cn("h-5 w-5 transition-all", isActive && "fill-current")}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span className={cn("text-[10px] font-medium transition-all", isActive && "font-bold")}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}

          {/* Menu Button (Replaces Hamburger) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-full h-full transition-all active:scale-95",
              mobileMenuOpen ? "text-primary" : "text-muted-foreground",
            )}
          >
            <div
              className={cn(
                "p-1.5 rounded-xl transition-all duration-300",
                mobileMenuOpen && "bg-primary/10 translate-y-[-2px]",
              )}
            >
              <Menu
                className={cn("h-5 w-5 transition-all", mobileMenuOpen && "scale-110")}
                strokeWidth={mobileMenuOpen ? 2.5 : 2}
              />
            </div>
            <span className={cn("text-[10px] font-medium transition-all", mobileMenuOpen && "font-bold")}>Menu</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
