import { useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import {
  Flag,
  LayoutDashboard,
  BookOpen,
  Video,
  Tv,
  Users,
  Calendar,
  ClipboardList,
  MessageSquare,
  MessageCircle,
  Briefcase,
  TrendingUp,
  Building2,
  FileCheck,
  ShieldCheck,
  Send,
  Database as DatabaseIcon,
  Key,
  Image as ImageIcon,
  GraduationCap,
  LogOut,
  UserCog,
  Bot,
  Coins,
  Bell,
  Trophy,
  FileText,
  BarChart2,
  Building,
  ChevronDown,
  BarChart,
  PieChart,
  Sparkles,
  Globe,
  Map,
  Settings,
  Megaphone,
  Target,
  Landmark,
  Mail,
  CreditCard,
  Factory,
  Network,
  Zap,
  Store,
  Layers,
  School,
  Share2,
  PhoneCall,
  Palette,
  Handshake,
  Upload,
  UserPlus,
  UserCheck,
  Wallet,
  Mic,
  Languages,
  Phone,
  Lock,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface NavItem {
  title: string;
  icon: React.ElementType;
  value: string;
}

interface NavGroup {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
  roles: AppRole[];
  companyScoped?: boolean;
}

// 1. CTO FIX: Unified all navigation items into a Single Source of Truth
const navGroups: NavGroup[] = [
  {
    title: "Executive Overview",
    icon: LayoutDashboard,
    roles: ["admin", "super_admin"],
    items: [
      { title: "Lifetime Metrics", value: "overview-lifetime", icon: LayoutDashboard },
      { title: "Monthly", value: "overview-month", icon: Calendar },
      { title: "Quarterly", value: "overview-quarter", icon: BarChart },
      { title: "Business Analyst", value: "overview-analyst", icon: Sparkles },
      { title: "Report Builder", value: "overview-reports", icon: FileText },
    ],
  },
  {
    title: "Talent Ecology",
    icon: Users,
    roles: ["admin", "super_admin", "talent_exec"],
    items: [
      { title: "Overview", value: "talent-overview", icon: LayoutDashboard },
      { title: "Talent Pool", value: "talent", icon: DatabaseIcon },
      { title: "Talent Upload", value: "talent-upload", icon: Upload },
      { title: "Outreach Console", value: "talent-outreach", icon: MessageSquare },
      { title: "WhatsApp Line", value: "talent-wa-channel", icon: Phone },
      { title: "Creator Economy", value: "talent-creator-economy", icon: Sparkles },
      { title: "Lead Hunter", value: "lead-hunter", icon: Target },
      { title: "Professions & Roles", value: "professions", icon: GraduationCap },
    ],
  },
  {
    title: "Companies",
    icon: Building2,
    roles: ["admin", "talent_exec"],
    companyScoped: true,
    items: [
      { title: "Overview", icon: LayoutDashboard, value: "companies-overview" },
      { title: "Companies", icon: Building2, value: "companies" },
      { title: "Industries", icon: Factory, value: "industries" },
      { title: "Contacts", icon: Users, value: "contacts" },
      { title: "Company Agents", icon: Bot, value: "company-agents" },
      { title: "WhatsApp Line", icon: Phone, value: "companies-wa-channel" },
      { title: "Contact Unlocks", icon: Lock, value: "companies-unlocks" },
    ],
  },
  {
    title: "AI Agents",
    icon: Bot,
    roles: ["admin"],
    items: [
      { title: "Agent OS Overview", icon: LayoutDashboard, value: "agents-overview" },
      { title: "Channels & Triggers", icon: Zap, value: "agents-channels" },
      { title: "Tools & Skills", icon: Network, value: "agents-tools" },
      { title: "Agent Studio", icon: Sparkles, value: "agents-studio" },
      { title: "B2C Agents", icon: Users, value: "agents-b2c" },
      { title: "Platform Tools", icon: Sparkles, value: "agents-platform" },
      { title: "B2B Agents", icon: Building2, value: "agents-b2b" },
      { title: "User-Generated", icon: UserCog, value: "agents-ugc" },
      { title: "Marketplace", icon: Store, value: "agents-marketplace" },
      { title: "Payouts", icon: Coins, value: "agents-payouts" },
      { title: "Sessions Log", icon: MessageSquare, value: "agents-sessions" },
      { title: "Proactive Engine", icon: Zap, value: "agent-outreach" },
      { title: "Agent Insights", icon: BarChart, value: "agents-insights" },
    ],
  },
  {
    title: "Investors & IR",
    icon: Landmark,
    roles: ["admin"],
    items: [
      { title: "IR Overview", icon: LayoutDashboard, value: "ir-overview" },
      { title: "IR Dashboard", icon: LayoutDashboard, value: "ir-dashboard" },
      { title: "MRR / ARR Targets", icon: Target, value: "ir-targets" },
      { title: "VC Firms", icon: Building2, value: "ir-vcs" },
      { title: "Investors", icon: Users, value: "ir-investors" },
      { title: "Pipeline (Kanban)", icon: Target, value: "ir-pipeline" },
      { title: "Key Influencers", icon: Handshake, value: "ir-influencers" },
      { title: "Data Room", icon: FileText, value: "ir-dataroom" },
      { title: "Unit Economics", icon: Target, value: "ir-economics" },
      { title: "Email Updates", icon: Mail, value: "ir-emails" },
    ],
  },
  {
    title: "Institutions",
    icon: School,
    roles: ["admin"],
    items: [
      { title: "Dashboard", icon: LayoutDashboard, value: "inst-overview" },
      { title: "Institution Types", icon: Layers, value: "inst-types" },
      { title: "Registry", icon: School, value: "institutions" },
      { title: "Partner Orgs", icon: Handshake, value: "partner-orgs" },
      { title: "Clubs & Depts", icon: Network, value: "inst-clubs" },
      { title: "Representatives", icon: Users, value: "inst-reps" },
      { title: "Events", icon: Trophy, value: "inst-events" },
    ],
  },
  {
    title: "Team & HR",
    icon: UserCog,
    roles: ["admin"],
    items: [
      { title: "Dashboard", icon: LayoutDashboard, value: "hr-overview" },
      { title: "Grades & Levels", icon: Layers, value: "hr-grades" },
      { title: "Verticals", icon: Network, value: "hr-verticals" },
      { title: "Functions", icon: Network, value: "hr-functions" },
      { title: "Teams", icon: Users, value: "hr-teams" },
      { title: "Workforce", icon: UserCog, value: "hr-workforce" },
      { title: "Targets", icon: Target, value: "hr-targets" },
      { title: "Onboarding", icon: ClipboardList, value: "hr-onboarding" },
      { title: "Payroll", icon: Coins, value: "hr-payroll" },
    ],
  },
  {
    title: "Geography (GTM)",
    icon: Globe,
    roles: ["admin"],
    items: [
      { title: "Dashboard", icon: LayoutDashboard, value: "gtm-overview" },
      { title: "Countries", icon: Globe, value: "gtm-countries" },
      { title: "States / Regions", icon: Map, value: "gtm-states" },
      { title: "Cities", icon: Map, value: "gtm-cities" },
      { title: "Clusters", icon: Network, value: "gtm-clusters" },
      { title: "Knowledge Packs", icon: FileText, value: "gtm-knowledge" },
    ],
  },
  {
    title: "Content & UGC",
    icon: FileText,
    roles: ["admin"],
    items: [
      { title: "Overview", icon: LayoutDashboard, value: "ugc-overview" },
      { title: "Free Videos", icon: Video, value: "ugc-videos" },
      { title: "Blog Posts", icon: FileText, value: "ugc-blog" },
      { title: "Feed Posts", icon: MessageSquare, value: "ugc-feed" },
      { title: "Competitions", icon: Trophy, value: "ugc-competitions" },
    ],
  },
  {
    title: "Gig Economy",
    icon: Briefcase,
    roles: ["admin"],
    items: [
      { title: "Overview",          icon: LayoutDashboard, value: "gigs-overview" },
      { title: "AI Scoper Queue",   icon: Sparkles,        value: "gigs-scoper" },
      { title: "Quick Action Gigs", icon: Zap,             value: "gigs-quick-actions" },
      { title: "Marketplace Gigs",  icon: Store,           value: "gigs-marketplace" },
      { title: "Course Projects",   icon: Layers,          value: "gigs-course-projects" },
      { title: "Client Projects",   icon: Briefcase,       value: "gigs-client-projects" },
      { title: "Managed Projects",  icon: Network,         value: "gigs-managed-projects" },
      { title: "Submissions",       icon: FileCheck,       value: "gigs-submissions" },
      { title: "Verification",      icon: ShieldCheck,     value: "gigs-verification" },
      { title: "Reviewer Program",  icon: Users,           value: "gigs-reviewers" },
      { title: "Matchmaker",        icon: Target,          value: "gigs-matchmaker" },
      { title: "Workers Wallet",    icon: Coins,           value: "gigs-workers-wallet" },
    ],
  },
  {
    title: "Jobs",
    icon: Briefcase,
    roles: ["admin", "talent_exec"],
    companyScoped: true,
    items: [
      { title: "Overview",          icon: LayoutDashboard, value: "jobs-overview" },
      { title: "Upload & Approval", icon: Upload,          value: "jobs-upload" },
      { title: "Jobs Manager",      icon: Briefcase,       value: "jobs-hub" },
      { title: "Applications",      icon: Users,           value: "jobs-applications" },
      { title: "Kanban Pipeline",   icon: Users,           value: "jobs-pipeline" },
      { title: "Sourcing",          icon: UserPlus,        value: "jobs-sourcing" },
      { title: "Talent CRM",        icon: UserCheck,       value: "jobs-talent-crm" },
      { title: "Assessments",       icon: ClipboardList,   value: "jobs-assessments" },
    ],
  },
  {
    title: "Learning",
    icon: BookOpen,
    roles: ["admin"],
    items: [
      { title: "Dashboard",        icon: LayoutDashboard, value: "learning-overview" },
      { title: "Academies",        icon: GraduationCap,   value: "learning-academies" },
      { title: "Schools",          icon: School,          value: "learning-schools" },
      { title: "Pro Lives",        icon: Users,           value: "learning-pro-lives" },
      { title: "AI Career Tracks", icon: Sparkles,        value: "learning-career-tracks" },
      { title: "Recorded Courses", icon: Tv,              value: "learning-courses" },
      { title: "Webinars",         icon: Calendar,        value: "learning-webinars" },
      { title: "Enrollments",      icon: Users,           value: "learning-enrollments" },
      { title: "Progress",         icon: BarChart2,       value: "learning-progress" },
      { title: "Graduates",        icon: Trophy,          value: "learning-graduates" },
      { title: "B2B Courses",      icon: Building,        value: "learning-b2b-courses" },
      { title: "Course Briefs",    icon: Sparkles,        value: "learning-course-briefs" },
      { title: "Cohorts",          icon: Users,           value: "learning-cohorts" },
      { title: "Moderation",       icon: Flag,            value: "learning-moderation" },
      { title: "B2B Engagements",  icon: Building,        value: "learning-b2b-engagements" },
      { title: "Payouts",          icon: Wallet,          value: "learning-payouts" },
      { title: "JSON Importer",    icon: Upload,          value: "learning-json-importer" },
    ],
  },
  // Legacy Gig Economy group removed — unified above.
  {
    title: "Career Abroad",
    icon: Globe,
    roles: ["admin"],
    items: [
      { title: "Dashboard", icon: LayoutDashboard, value: "abroad-overview" },
      { title: "Destinations", icon: Globe, value: "abroad-destinations" },
      { title: "Applications", icon: ClipboardList, value: "abroad-applications" },
      { title: "Uni Programs", icon: GraduationCap, value: "abroad-programs" },
      { title: "IELTS Prompts", icon: Mic, value: "abroad-ielts-prompts" },
      { title: "IELTS Resources", icon: BookOpen, value: "abroad-ielts-resources" },
      { title: "Language Lab", icon: Languages, value: "abroad-language-lab" },
      { title: "Roadmap Leads", icon: Map, value: "abroad-roadmap-leads" },
    ],
  },
  {
    title: "Marketing",
    icon: Megaphone,
    roles: ["admin", "talent_exec"],
    items: [
      { title: "Analytics",          icon: PieChart,      value: "marketing-analytics" },
      { title: "Channels",           icon: Share2,        value: "marketing-channels" },
      { title: "Community Whatsapp", icon: PhoneCall,     value: "marketing-community-wa" },
      { title: "Community Groups",   icon: Users,         value: "marketing-community-groups" },
      { title: "Admins & Reps",      icon: UserCog,       value: "marketing-admins-reps" },
      { title: "Talent Outreach",    icon: Send,          value: "marketing-talent-outreach" },
      { title: "Content Outreach",   icon: BookOpen,      value: "marketing-content-outreach" },
      { title: "Service Outreach",   icon: Sparkles,      value: "marketing-service-outreach" },
      { title: "Leads",              icon: ClipboardList, value: "marketing-leads" },
      { title: "Banners",            icon: ImageIcon,     value: "marketing-banners" },
      { title: "Themes",             icon: Palette,       value: "marketing-themes" },
      { title: "Access Codes",       icon: Key,           value: "marketing-access-codes" },
    ],
  },
  {
    title: "FinOps",
    icon: Coins,
    roles: ["admin"],
    items: [
      { title: "Dashboard", icon: LayoutDashboard, value: "fin-overview" },
      { title: "Talent Credits", icon: Coins, value: "credits" },
      { title: "Gro10x Credits", icon: Coins, value: "gro10x-credits" },
      { title: "Company Credits", icon: Coins, value: "company-credits" },
      { title: "Transactions", icon: BarChart, value: "transactions" },
      { title: "Pay Infra", icon: CreditCard, value: "payments" },
      { title: "Invoices", icon: CreditCard, value: "invoices" },
      { title: "Withdrawals", icon: Coins, value: "withdrawals" },
    ],
  },
  {
    title: "Platform Config",
    icon: Settings,
    roles: ["admin"],
    items: [
      { title: "Support AI", icon: Sparkles, value: "support-assistant" },
      { title: "Team Members", icon: UserCog, value: "hr-team" },
      { title: "Notifications", icon: Bell, value: "notifications" },
    ],
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  userRole?: AppRole | null;
  adminScope?: "super" | "internal" | "company" | "none";
}

export function AdminSidebar({ activeTab, onTabChange, userRole = "admin", adminScope = "super" }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const filteredNavGroups = useMemo<NavGroup[]>(() => {
    return navGroups.filter((group) => {
      if (adminScope === "company") return group.companyScoped === true;
      if (!userRole) return false;
      return group.roles.includes(userRole);
    });
  }, [adminScope, userRole]);

  const activeGroupTitle = useMemo<string | undefined>(() => {
    const foundGroup = filteredNavGroups.find((g) =>
      g.items.some((i) => i.value === activeTab || (i.value === "overview-lifetime" && activeTab === "overview")),
    );
    if (foundGroup) return foundGroup.title;
    if (filteredNavGroups.length > 0) return filteredNavGroups[0].title;
    return undefined;
  }, [activeTab, filteredNavGroups]);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    return new Set(activeGroupTitle ? [activeGroupTitle] : []);
  });

  // 2. CTO FIX: Force sidebar to auto-expand the correct folder when active tab changes externally
  useEffect(() => {
    if (activeGroupTitle) {
      setOpenGroups((prev) => new Set(prev).add(activeGroupTitle));
    }
  }, [activeGroupTitle]);

  const toggleGroup = (title: string, isOpen: boolean) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (isOpen) next.add(title);
      else next.delete(title);
      return next;
    });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-background/95 backdrop-blur-xl">
      <SidebarHeader className="border-b border-border/40 px-4 py-4 h-[72px] flex items-center bg-muted/10">
        <div className="flex items-center gap-4 w-full">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden transition-all duration-300">
              <span className="font-black text-sm tracking-tight truncate italic">GRO10X OS</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-bold truncate">
                {userRole === "talent_exec" ? "Talent Operations" : "Executive Console"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-3 gap-2 overflow-y-auto no-scrollbar">
        {/* Agentic Dashboard (Chat) — Top Level Action */}
        {(userRole === "admin" || userRole === "super_admin") &&
          (() => {
            const isChat = location.pathname.startsWith("/dashboard/chat");
            return (
              <SidebarGroup className="p-0 mb-2">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Agentic Dashboard"
                      onClick={() => navigate("/dashboard/chat")}
                      isActive={isChat}
                      className={cn(
                        "h-12 transition-all duration-300",
                        isChat
                          ? "bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-md rounded-xl"
                          : "hover:bg-primary/10 text-muted-foreground font-bold uppercase tracking-widest text-[10px] rounded-xl",
                      )}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-[10px]">AI Co-Pilot</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            );
          })()}

        {/* Dynamic Nav Groups */}
        {filteredNavGroups.map((group) => (
          <Collapsible
            key={group.title}
            open={openGroups.has(group.title)}
            onOpenChange={(isOpen) => toggleGroup(group.title, isOpen)}
            className="group/collapsible mb-1"
          >
            <SidebarGroup className="p-0">
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={group.title}
                  className={cn(
                    "font-black uppercase tracking-wider text-[11px] h-10 transition-colors",
                    openGroups.has(group.title)
                      ? "text-foreground"
                      : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 rounded-xl",
                  )}
                >
                  <group.icon className="w-4 h-4" />
                  <span>{group.title}</span>
                  <ChevronDown className="ml-auto w-4 h-4 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>

              <CollapsibleContent className="animate-in slide-in-from-top-2 duration-200">
                <SidebarMenu className="pl-2 mt-2 space-y-1 border-l-2 ml-4 border-border/30">
                  {group.items.map((item) => {
                    // Normalize overview active state logic
                    const isItemActive =
                      activeTab === item.value || (item.value === "overview-lifetime" && activeTab === "overview");

                    return (
                      <SidebarMenuItem key={item.value}>
                        <SidebarMenuButton
                          onClick={() => onTabChange(item.value)}
                          isActive={isItemActive}
                          className={cn(
                            "h-10 text-[10px] uppercase tracking-widest transition-all duration-300",
                            isItemActive
                              ? "bg-primary/10 text-primary font-black border-r-4 border-primary rounded-none shadow-sm"
                              : "text-muted-foreground font-bold hover:bg-muted/30 hover:text-foreground rounded-lg",
                          )}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}

        {/* External: Company Portal (B2B view) */}
        {userRole === "admin" && (
          <SidebarMenu className="mt-4 pt-4 border-t border-border/20">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => window.open("/company", "_blank")}
                tooltip="Open Company Portal"
                className="hover:bg-blue-500/10 text-blue-500/70 hover:text-blue-600 font-black uppercase text-[10px] tracking-widest h-10 rounded-xl transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span>B2B Portal View</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4 bg-muted/5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Sign out"
              className="text-destructive/70 hover:bg-destructive/10 hover:text-destructive font-black uppercase text-[10px] tracking-widest h-10 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Terminate Session</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
