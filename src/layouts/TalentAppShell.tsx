import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTalent } from "@/hooks/useTalent";
import { supabase } from "@/integrations/supabase/client";
import { Home, Briefcase, GraduationCap, Sparkles, Globe, Bot, User, Bell, Menu, Search, LogOut, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCredits } from "@/hooks/useCredits";
import logoIcon from "@/assets/logo-icon.png";

// Define strict type for nav items
interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}
export function TalentAppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    talent
  } = useTalent();
  const {
    balance
  } = useCredits();
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // LinkedIn-style Navigation Items
  const navItems: NavItem[] = [{
    label: "Home",
    icon: Home,
    path: "/app/feed"
  }, {
    label: "Jobs",
    icon: Briefcase,
    path: "/app/jobs"
  }, {
    label: "Learning",
    icon: GraduationCap,
    path: "/app/learning"
  }, {
    label: "Services",
    icon: Sparkles,
    path: "/app/services"
  }, {
    label: "Abroad",
    icon: Globe,
    path: "/app/abroad"
  }, {
    label: "AI Agents",
    icon: Bot,
    path: "/app/agents"
  }];
  useEffect(() => {
    if (!talent?.id) return;
    const fetchNotifications = async () => {
      try {
        const {
          count
        } = await supabase.from("notifications" as any).select("id", {
          count: "exact",
          head: true
        }).eq("user_id", talent.id).eq("is_read", false);
        setUnreadCount(count || 0);
      } catch (err) {
        console.error("Error fetching notifications", err);
      }
    };
    fetchNotifications();
  }, [talent?.id]);
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/jobs/all?search=${encodeURIComponent(searchQuery)}`);
    }
  };
  const isActive = (path: string) => {
    if (path === "/app/feed" && location.pathname === "/app/feed") return true;
    if (path !== "/app/feed" && location.pathname.startsWith(path)) return true;
    return false;
  };
  return (
    // FIX: Theme-aware background. Light mode = LinkedIn Gray, Dark mode = Dark Background
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-background font-sans text-foreground transition-colors duration-300">
      {/* --- TOP NAVBAR --- */}
      {/* FIX: Header is white in light mode, dark borderless in dark mode */}
      <header className="sticky top-0 z-50 bg-white dark:bg-background/95 dark:backdrop-blur-sm border-b border-border h-14 px-4 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          {/* Left: Logo & Search */}
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/app/feed")}>
              <img alt="Logo" className="w-8 h-8 rounded" src="/lovable-uploads/9c7f3b64-8763-474e-951b-6420b7c33965.png" />
            </div>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:block relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search"
              // FIX: Input background adapts to theme
              className="h-9 pl-9 bg-[#EEF3F8] dark:bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all w-64 focus:w-80 placeholder:text-muted-foreground" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </form>

            {/* Mobile Search Icon */}
            <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground">
              <Search className="h-5 w-5" />
            </Button>
          </div>

          {/* Center: Navigation (Desktop Only) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-6 h-full">
            {navItems.map(item => <button key={item.path} onClick={() => navigate(item.path)} className={`flex flex-col items-center justify-center w-16 lg:w-20 h-full border-b-2 transition-all duration-200 group
                  ${isActive(item.path) ?
            // FIX: Active state handles dark mode text colors correctly
            "border-black dark:border-white text-black dark:text-white" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <div className="relative">
                  <item.icon className={`h-6 w-6 mb-0.5 ${isActive(item.path) ? "fill-current" : ""}`} />
                </div>
                <span className="text-[10px] lg:text-xs font-medium">{item.label}</span>
              </button>)}
          </nav>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-2 md:gap-4 flex-none">
            {/* Notifications */}
            <button className="relative flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors" onClick={() => navigate("/app/notifications")}>
              <div className="relative">
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>}
              </div>
              <span className="hidden md:block text-[10px] lg:text-xs font-medium mt-0.5">Notifications</span>
            </button>

            <div className="h-8 w-px bg-border hidden md:block mx-1" />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-center justify-center outline-none group text-muted-foreground hover:text-foreground">
                  <Avatar className="h-6 w-6 md:h-6 md:w-6 border border-border cursor-pointer group-hover:opacity-80 transition-opacity">
                    <AvatarImage src={talent?.profilePhotoUrl || ""} />
                    <AvatarFallback className="text-[10px]">ME</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-[10px] lg:text-xs font-medium mt-0.5 flex items-center gap-0.5">
                    Me <span className="text-[8px]">▼</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <div className="flex items-center gap-3 p-2 mb-2 bg-muted/50 rounded-md">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={talent?.profilePhotoUrl || ""} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-sm truncate">{talent?.fullName || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{talent?.email || "Student"}</p>
                  </div>
                </div>
                <DropdownMenuItem onClick={() => navigate("/app/profile")} className="cursor-pointer text-primary font-medium border border-primary justify-center rounded-full mb-2 hover:bg-primary/5">
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Account</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate("/app/profile/edit")} className="cursor-pointer">
                  Settings & Privacy
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Help Center</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-muted-foreground">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Credits */}
            <div className="hidden md:flex flex-col items-end ml-2">
              <Badge variant="secondary" className="gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800">
                <Coins className="h-3 w-3 fill-amber-500 text-amber-600 dark:text-amber-400" />
                <span className="font-bold">{balance}</span>
              </Badge>
            </div>

            {/* Mobile Menu Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden ml-1 text-muted-foreground">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
                <div className="flex flex-col h-full bg-[#F3F2EF] dark:bg-background">
                  <div className="p-4 bg-white dark:bg-card border-b">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12 border">
                        <AvatarImage src={talent?.profilePhotoUrl || ""} />
                        <AvatarFallback>ME</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-lg">{talent?.fullName}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{talent?.email}</p>
                      </div>
                    </div>
                    <Button onClick={() => navigate("/app/profile")} variant="outline" className="w-full rounded-full border-primary text-primary hover:bg-primary/5">
                      View Profile
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto py-2">
                    <div className="px-4 py-2">
                      <h3 className="font-semibold text-sm mb-2 px-2">Credits Balance</h3>
                      <div className="flex items-center gap-2 p-3 bg-white dark:bg-muted/30 rounded-lg border shadow-sm">
                        <Coins className="h-5 w-5 text-amber-500" />
                        <span className="font-bold text-lg">{balance}</span>
                        <span className="text-xs text-muted-foreground ml-auto">Valid until next month</span>
                      </div>
                    </div>
                    <div className="h-px bg-border my-2 mx-4" />
                    <nav className="space-y-1 px-2">
                      {navItems.map(item => <button key={item.path} onClick={() => navigate(item.path)} className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-md transition-colors
                            ${isActive(item.path) ? "bg-white dark:bg-muted shadow-sm text-foreground" : "text-muted-foreground hover:bg-white/50 dark:hover:bg-muted/50"}`}>
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </button>)}
                    </nav>
                  </div>
                  <div className="p-4 border-t bg-white dark:bg-card">
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="max-w-7xl mx-auto py-6 px-0 md:px-4 pb-20 md:pb-6">
        <Outlet />
      </main>

      {/* --- MOBILE BOTTOM TAB BAR --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-background border-t border-border h-16 px-2 flex items-center justify-around z-50 pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        {navItems.slice(0, 5).map(item => <button key={item.path} onClick={() => navigate(item.path)} className={`flex flex-col items-center justify-center w-full h-full transition-colors
              ${isActive(item.path) ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
            <item.icon className={`h-6 w-6 mb-1 ${isActive(item.path) ? "fill-current" : ""}`} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>)}
      </nav>
    </div>
  );
}