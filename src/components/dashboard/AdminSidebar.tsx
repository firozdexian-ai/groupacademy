import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Video,
  Tv,
  Users,
  Calendar,
  ClipboardList,
  MessageSquare,
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
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
import { useState } from "react";

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
}

const navGroups: NavGroup[] = [
  {
    title: "Talent Management",
    icon: DatabaseIcon,
    roles: ["admin", "talent_exec"],
    items: [
      { title: "Talent Pool", icon: DatabaseIcon, value: "talent" },
      { title: "Lead Hunter", icon: TrendingUp, value: "lead-hunter" },
      { title: "Assessment Leads", icon: ClipboardList, value: "leads" },
      { title: "Mock Interviews", icon: MessageSquare, value: "interviews" },
      { title: "Salary Analysis", icon: TrendingUp, value: "salary" },
      { title: "Portfolio Requests", icon: Briefcase, value: "portfolios" },
      { title: "CV Outreach", icon: Send, value: "outreach" },
    ],
  },
  {
    title: "Recruitment",
    icon: Briefcase,
    roles: ["admin", "talent_exec"],
    items: [
      { title: "Jobs KPIs", icon: TrendingUp, value: "jobs-kpis" },
      { title: "Manage Jobs", icon: Building2, value: "jobs" },
      { title: "Applications", icon: FileCheck, value: "applications" },
      { title: "Companies", icon: Building2, value: "companies" },
      { title: "Contacts", icon: Users, value: "contacts" },
    ],
  },
  {
    title: "Content Management",
    icon: BookOpen,
    roles: ["admin"],
    items: [
      { title: "All Content", icon: BookOpen, value: "all" },
      { title: "Content Outreach", icon: Send, value: "content-outreach" },
      { title: "Free Videos", icon: Video, value: "videos" },
      { title: "Recorded Courses", icon: Tv, value: "courses" },
      { title: "Webinars", icon: Tv, value: "webinars" },
      { title: "Batch Classes", icon: Users, value: "batches" },
      { title: "Seminars", icon: Calendar, value: "seminars" },
      { title: "Blog Posts", icon: FileText, value: "blog" },
      { title: "Study Abroad", icon: GraduationCap, value: "study-abroad" },
      { title: "IELTS Resources", icon: BookOpen, value: "ielts" },
      { title: "Competitions", icon: Trophy, value: "competitions" },
    ],
  },
  {
    title: "Platform Settings",
    icon: UserCog,
    roles: ["admin"],
    items: [
      { title: "Access Codes", icon: Key, value: "codes" },
      { title: "Banners", icon: ImageIcon, value: "banners" },
      { title: "Professions", icon: GraduationCap, value: "professions" },
      { title: "AI Agents", icon: Bot, value: "ai-agents" },
      { title: "Agent Sessions", icon: MessageSquare, value: "agent-sessions" },
      { title: "Credits", icon: Coins, value: "credits" },
      { title: "Notifications", icon: Bell, value: "notifications" },
      { title: "Team Members", icon: UserCog, value: "team" },
    ],
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  userRole?: AppRole | null;
}

export function AdminSidebar({ activeTab, onTabChange, userRole = "admin" }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const filteredNavGroups = navGroups.filter((group) => userRole && group.roles.includes(userRole));

  // Auto-expand group containing active tab
  const activeGroup =
    filteredNavGroups.find((g) => g.items.some((i) => i.value === activeTab))?.title || filteredNavGroups[0]?.title;
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroup);

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
        {/* Overview - Only for admin */}
        {userRole === "admin" && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onTabChange("overview")}
                isActive={activeTab === "overview"}
                tooltip="Dashboard Overview"
                className="hover:bg-accent/50"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="font-medium">Overview</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        {/* Nav Groups */}
        {filteredNavGroups.map((group) => (
          <Collapsible
            key={group.title}
            open={openGroup === group.title}
            onOpenChange={(isOpen) => isOpen && setOpenGroup(group.title)}
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
