import { useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo } from "react";
import {
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
  Handshake,
  Upload,
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
  /** When true, this group is shown to company_admin scope as well (read scoped to their company). */
  companyScoped?: boolean;
}

const navGroups: NavGroup[] = [
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
    ],
  },
  {
    title: "AI Agents",
    icon: Bot,
    roles: ["admin"],
    items: [
      { title: "Agent OS Overview", icon: LayoutDashboard, value: "agents-overview" },
      { title: "Channels & Triggers", icon: Zap, value: "agents-channels" },
      { title: "Tools, Skills & Connectors", icon: Network, value: "agents-tools" },
      { title: "Agent Studio (Builder)", icon: Sparkles, value: "agents-studio" },
      { title: "Gro10x B2C Agents", icon: Users, value: "agents-b2c" },
      { title: "Platform Tool-Agents", icon: Sparkles, value: "agents-platform" },
      { title: "Company / B2B Agents", icon: Building2, value: "agents-b2b" },
      { title: "User-Generated Agents", icon: UserCog, value: "agents-ugc" },
      { title: "Marketplace", icon: Store, value: "agents-marketplace" },
      { title: "Marketplace Payouts", icon: Coins, value: "agents-payouts" },
      { title: "Sessions Log", icon: MessageSquare, value: "agents-sessions" },
      { title: "Agent Insights", icon: BarChart, value: "agents-insights" },
    ],
  },
  {
    title: "Investors & High-Value Stakeholders",
    icon: Landmark,
    roles: ["admin"],
    items: [
      { title: "IR Overview", icon: LayoutDashboard, value: "ir-overview" },
      { title: "IR Dashboard", icon: LayoutDashboard, value: "ir-dashboard" },
      { title: "MRR / ARR Targets", icon: Target, value: "ir-targets" },
      { title: "VC Firms", icon: Building2, value: "ir-vcs" },
      { title: "Investors", icon: Users, value: "ir-investors" },
      { title: "Key Influencers", icon: Handshake, value: "ir-influencers" },
      { title: "Email Updates", icon: Mail, value: "ir-emails" },
    ],
  },
  {
    title: "Institutions & Organizations",
    icon: School,
    roles: ["admin"],
    items: [
      { title: "Dashboard", icon: LayoutDashboard, value: "inst-overview" },
      { title: "Institution Types", icon: Layers, value: "inst-types" },
      { title: "Institutions Registry", icon: School, value: "institutions" },
      { title: "Partner Organizations", icon: Handshake, value: "partner-orgs" },
      { title: "Clubs & Departments", icon: Network, value: "inst-clubs" },
      { title: "Representatives", icon: Users, value: "inst-reps" },
      { title: "Events & Competitions", icon: Trophy, value: "inst-events" },
      { title: "Outreach Agent", icon: Send, value: "inst-outreach" },
      { title: "Query Agent", icon: Sparkles, value: "inst-analyst" },
    ],
  },
  {
    title: "Team & Workforce",
    icon: UserCog,
    roles: ["admin"],
    items: [
      { title: "Dashboard", icon: LayoutDashboard, value: "hr-overview" },
      { title: "Grades & Levels", icon: Layers, value: "hr-grades" },
      { title: "Verticals", icon: Network, value: "hr-verticals" },
      { title: "Functions", icon: Network, value: "hr-functions" },
      { title: "Teams", icon: Users, value: "hr-teams" },
      { title: "Workforce Members", icon: UserCog, value: "workforce" },
      { title: "Targets & Incentives", icon: Target, value: "hr-targets" },
      { title: "Onboarding", icon: ClipboardList, value: "hr-onboarding" },
      { title: "Rewards & Payroll", icon: Coins, value: "hr-payroll" },
    ],
  },
  {
    title: "GTM (Geography)",
    icon: Globe,
    roles: ["admin"],
    items: [
      { title: "Dashboard", icon: LayoutDashboard, value: "gtm-overview" },
      { title: "Countries", icon: Globe, value: "gtm-countries" },
      { title: "States / Regions", icon: Map, value: "gtm-states" },
      { title: "Cities", icon: Map, value: "gtm-cities" },
      { title: "Clusters", icon: Network, value: "gtm-clusters" },
    ],
  },
  {
    title: "UGC & Contents",
    icon: FileText,
    roles: ["admin"],
    items: [
      { title: "Content Overview", icon: LayoutDashboard, value: "ugc-overview" },
      { title: "Free Videos", icon: Video, value: "videos" },
      { title: "Blog Posts", icon: FileText, value: "blog" },
      { title: "Feed Posts", icon: MessageSquare, value: "feed-posts" },
      { title: "Competitions & Events", icon: Trophy, value: "competitions" },
      { title: "Submissions, Gigs & Payouts", icon: FileCheck, value: "gig-submissions" },
      { title: "Manage Gigs", icon: Briefcase, value: "gigs" },
      { title: "Marketplace Gigs", icon: Store, value: "marketplace-gigs" },
    ],
  },
  {
    title: "Jobs",
    icon: Briefcase,
    roles: ["admin", "talent_exec"],
    companyScoped: true,
    items: [
      { title: "Jobs Overview", icon: LayoutDashboard, value: "jobs-overview" },
      { title: "Jobs Upload & Approval", icon: Upload, value: "jobs-upload" },
      { title: "Jobs Manager", icon: Briefcase, value: "jobs-hub" },
      { title: "Applications", icon: Users, value: "applications" },
      { title: "Pipeline (Kanban)", icon: Users, value: "applications-pipeline" },
      { title: "Sourcing & Lists", icon: Users, value: "sourcing-admin" },
      { title: "Talent Pipeline (CRM)", icon: Users, value: "sourcing-pipeline" },
      { title: "Jobs Assessments", icon: ClipboardList, value: "jobs-assessments" },
    ],
  },
  {
    title: "Learn",
    icon: BookOpen,
    roles: ["admin"],
    items: [
      { title: "Dashboard", icon: LayoutDashboard, value: "learn-overview" },
      { title: "Academies", icon: GraduationCap, value: "academies" },
      { title: "Schools", icon: School, value: "schools" },
      { title: "Professional Lives", icon: Users, value: "professional-lives" },
      { title: "Career Track AI Courses", icon: Sparkles, value: "career-tracks" },
      { title: "Recorded Courses", icon: Tv, value: "courses" },
      { title: "Online Courses", icon: Calendar, value: "webinars" },
      { title: "Enrollments", icon: Users, value: "enrollments" },
      { title: "Learner Progress", icon: BarChart, value: "learner-progress" },
      { title: "Graduates", icon: Trophy, value: "graduates" },
      { title: "B2B Courses", icon: Building2, value: "b2b-courses" },
    ],
  },
  {
    title: "Gig Economy",
    icon: Briefcase,
    roles: ["admin"],
    items: [
      { title: "Dashboard", icon: LayoutDashboard, value: "gig-overview" },
      { title: "Quick Action Gigs", icon: Zap, value: "quick-action-gigs" },
      { title: "Course Projects", icon: Layers, value: "course-projects" },
      { title: "Client Projects", icon: Store, value: "client-projects" },
      { title: "Gig Submissions", icon: FileCheck, value: "gig-submissions" },
      { title: "Gig Workers & Wallet", icon: Coins, value: "gig-workers-wallet" },
    ],
  },
  {
    title: "Career Abroad",
    icon: Globe,
    roles: ["admin"],
    items: [
      { title: "Dashboard", icon: LayoutDashboard, value: "abroad-overview" },
      { title: "University Programs", icon: GraduationCap, value: "study-abroad" },
      { title: "IELTS Resources", icon: BookOpen, value: "ielts" },
      { title: "Roadmap Leads", icon: Map, value: "roadmap-leads" },
    ],
  },
  {
    title: "Marketing & Outreach",
    icon: Megaphone,
    roles: ["admin", "talent_exec"],
    items: [
      { title: "Analytics Overview", icon: PieChart, value: "analytics" },
      { title: "Channels", icon: Network, value: "mkt-channels" },
      { title: "Community Groups", icon: Users, value: "mkt-community" },
      { title: "Admins & Reps", icon: UserCog, value: "mkt-admins-reps" },
      { title: "Talent Outreach", icon: Send, value: "outreach" },
      { title: "Content Outreach", icon: BookOpen, value: "content-outreach" },
      { title: "Service & Agent Outreach", icon: Sparkles, value: "service-outreach" },
      { title: "Leads & Activities", icon: ClipboardList, value: "leads-activities" },
      { title: "Banner Management", icon: ImageIcon, value: "banners" },
      { title: "Profile Card Themes", icon: Sparkles, value: "profile-card-themes" },
      { title: "Access Codes", icon: Key, value: "codes" },
    ],
  },
  {
    title: "Finance & Monetization",
    icon: Coins,
    roles: ["admin"],
    items: [
      { title: "Dashboard", icon: LayoutDashboard, value: "fin-overview" },
      { title: "Talent Credits", icon: Coins, value: "credits" },
      { title: "Gro10x Credits", icon: Coins, value: "gro10x-credits" },
      { title: "Company Credits", icon: Coins, value: "company-credits" },
      { title: "Transactions", icon: BarChart, value: "transactions" },
      { title: "Payment Infrastructure", icon: CreditCard, value: "payments" },
      { title: "Invoices & Payments", icon: CreditCard, value: "invoices" },
      { title: "Withdrawals", icon: Coins, value: "withdrawals" },
    ],
  },
  {
    title: "Platform Config & Others",
    icon: Settings,
    roles: ["admin"],
    items: [
      { title: "Support AI", icon: Sparkles, value: "support-assistant" },
      { title: "Team Members", icon: UserCog, value: "team" },
      { title: "Notifications Center", icon: Bell, value: "notifications" },
    ],
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  userRole?: AppRole | null;
  /** Drives sidebar filtering. Defaults to "super" for backward compatibility. */
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

  // Determine the active group title based on the activeTab
  const activeGroupTitle = useMemo<string | undefined>(() => {
    const foundGroup = filteredNavGroups.find((g) => g.items.some((i) => i.value === activeTab));

    if (foundGroup) {
      return foundGroup.title;
    }

    if (filteredNavGroups.length > 0) {
      return filteredNavGroups[0].title;
    }

    return undefined;
  }, [activeTab, filteredNavGroups]);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    return new Set(activeGroupTitle ? [activeGroupTitle] : []);
  });

  const toggleGroup = (title: string, isOpen: boolean) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (isOpen) next.add(title);
      else next.delete(title);
      return next;
    });
  };

  return (
    <Sidebar collapsible="icon" className="border-r bg-background">
      <SidebarHeader className="border-b px-4 py-3 h-[60px] flex items-center">
        <div className="flex items-center gap-3 w-full">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0 text-primary-foreground shadow-sm">
            <BookOpen className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden transition-all duration-300">
              <span className="font-bold text-sm tracking-tight truncate">GroUp Academy</span>
              <span className="text-[10px] text-muted-foreground uppercase font-medium truncate">
                {userRole === "talent_exec" ? "Talent Portal" : "Admin Console"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 gap-2">
        {/* Agentic Dashboard (Chat) — top-level link */}
        {(userRole === "admin" || userRole === "super_admin") &&
          (() => {
            const isChat = location.pathname.startsWith("/dashboard/chat");
            return (
              <SidebarGroup className="p-0">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Agentic Dashboard"
                      onClick={() => navigate("/dashboard/chat")}
                      isActive={isChat}
                      className={`font-medium ${isChat ? "bg-primary/10 text-primary" : "hover:bg-accent/50"}`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            );
          })()}

        {/* Overview group - admin & super_admin */}
        {(userRole === "admin" || userRole === "super_admin") &&
          (() => {
            const overviewItems = [
              { title: "Lifetime", value: "overview-lifetime", icon: LayoutDashboard },
              { title: "Monthly", value: "overview-month", icon: Calendar },
              { title: "Quarterly", value: "overview-quarter", icon: BarChart },
              { title: "Business Analyst", value: "overview-analyst", icon: Sparkles },
              { title: "Report Builder", value: "overview-reports", icon: FileText },
            ];
            const isOverviewActive = activeTab === "overview" || activeTab.startsWith("overview-");
            return (
              <Collapsible
                open={openGroups.has("Overview") || isOverviewActive}
                onOpenChange={(isOpen) => toggleGroup("Overview", isOpen)}
                className="group/collapsible"
              >
                <SidebarGroup className="p-0">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Overview" className="font-medium hover:bg-accent/50">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Overview</span>
                      <ChevronDown className="ml-auto w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="pl-2 mt-1 space-y-0.5 border-l ml-4 border-border/50">
                      {overviewItems.map((item) => (
                        <SidebarMenuItem key={item.value}>
                          <SidebarMenuButton
                            onClick={() => onTabChange(item.value)}
                            isActive={
                              activeTab === item.value ||
                              (item.value === "overview-lifetime" && activeTab === "overview")
                            }
                            className={`h-9 text-sm ${
                              activeTab === item.value ||
                              (item.value === "overview-lifetime" && activeTab === "overview")
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            );
          })()}

        {/* Talent group - admin, super_admin, talent_exec */}
        {(userRole === "admin" || userRole === "super_admin" || userRole === "talent_exec") &&
          (() => {
            const talentItems = [
              { title: "Overview", value: "talent-overview", icon: LayoutDashboard },
              { title: "Talent Pool", value: "talent", icon: DatabaseIcon },
              { title: "Talent Upload", value: "talent-upload", icon: Upload },
              { title: "Creator Economy", value: "talent-creator-economy", icon: Sparkles },
              { title: "Lead Hunter", value: "lead-hunter", icon: Target },
              { title: "Professions & Roles", value: "professions", icon: GraduationCap },
            ];
            const isTalentActive =
              activeTab === "talent" ||
              activeTab === "lead-hunter" ||
              activeTab === "professions" ||
              activeTab.startsWith("talent-");
            return (
              <Collapsible
                open={openGroups.has("Talent") || isTalentActive}
                onOpenChange={(isOpen) => toggleGroup("Talent", isOpen)}
                className="group/collapsible"
              >
                <SidebarGroup className="p-0">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Talent" className="font-medium hover:bg-accent/50">
                      <Users className="w-4 h-4" />
                      <span>Talent</span>
                      <ChevronDown className="ml-auto w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="pl-2 mt-1 space-y-0.5 border-l ml-4 border-border/50">
                      {talentItems.map((item) => (
                        <SidebarMenuItem key={item.value}>
                          <SidebarMenuButton
                            onClick={() => onTabChange(item.value)}
                            isActive={activeTab === item.value}
                            className={`h-9 text-sm ${
                              activeTab === item.value
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            );
          })()}

        {/* Nav Groups */}
        {filteredNavGroups.map((group) => (
          <Collapsible
            key={group.title}
            open={openGroups.has(group.title)}
            onOpenChange={(isOpen) => toggleGroup(group.title, isOpen)}
            className="group/collapsible"
          >
            <SidebarGroup className="p-0">
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={group.title}
                  className="font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50"
                >
                  <group.icon className="w-4 h-4" />
                  <span>{group.title}</span>
                  <ChevronDown className="ml-auto w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <SidebarMenu className="pl-2 mt-1 space-y-0.5 border-l ml-4 border-border/50">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.value}>
                      <SidebarMenuButton
                        onClick={() => onTabChange(item.value)}
                        isActive={activeTab === item.value}
                        className={`h-9 text-sm ${activeTab === item.value ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}

        {/* External: Company Portal (B2B view) */}
        {userRole === "admin" && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => window.open("/company", "_blank")}
                tooltip="Open Company Portal"
                className="hover:bg-accent/50 text-muted-foreground hover:text-foreground"
              >
                <Building2 className="w-4 h-4" />
                <span>Company Portal</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Sign out"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
