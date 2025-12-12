import { useLocation, useNavigate } from "react-router-dom";
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
  Database,
  Key,
  Image,
  GraduationCap,
  ChevronDown,
  LogOut,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NavItem {
  title: string;
  icon: React.ElementType;
  value: string;
}

interface NavGroup {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Content Management",
    icon: BookOpen,
    items: [
      { title: "All Content", icon: BookOpen, value: "all" },
      { title: "Free Videos", icon: Video, value: "videos" },
      { title: "Recorded Courses", icon: Tv, value: "courses" },
      { title: "Webinars", icon: Tv, value: "webinars" },
      { title: "Batch Classes", icon: Users, value: "batches" },
      { title: "Seminars", icon: Calendar, value: "seminars" },
    ],
  },
  {
    title: "Career Services Leads",
    icon: ClipboardList,
    items: [
      { title: "Assessment Leads", icon: ClipboardList, value: "leads" },
      { title: "Mock Interviews", icon: MessageSquare, value: "interviews" },
      { title: "Portfolio Requests", icon: Briefcase, value: "portfolios" },
      { title: "Salary Analysis", icon: TrendingUp, value: "salary" },
    ],
  },
  {
    title: "Jobs Board",
    icon: Building2,
    items: [
      { title: "Manage Jobs", icon: Building2, value: "jobs" },
      { title: "Applications", icon: FileCheck, value: "applications" },
      { title: "Companies", icon: Building2, value: "companies" },
    ],
  },
  {
    title: "Talent & Outreach",
    icon: Database,
    items: [
      { title: "CV Outreach", icon: Send, value: "outreach" },
      { title: "Talent Pool", icon: Database, value: "talent" },
    ],
  },
  {
    title: "Platform Settings",
    icon: GraduationCap,
    items: [
      { title: "Access Codes", icon: Key, value: "codes" },
      { title: "Banners", icon: Image, value: "banners" },
      { title: "Professions", icon: GraduationCap, value: "professions" },
    ],
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  // Determine which group should be open based on active tab
  const getOpenGroups = () => {
    const openGroups: string[] = [];
    navGroups.forEach((group) => {
      if (group.items.some((item) => item.value === activeTab)) {
        openGroups.push(group.title);
      }
    });
    return openGroups;
  };

  const openGroups = getOpenGroups();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold truncate">GroUp Academy</h1>
              <p className="text-xs text-muted-foreground truncate">Operations Portal</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Overview */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onTabChange("overview")}
                isActive={activeTab === "overview"}
                tooltip="Overview"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Nav Groups */}
        {navGroups.map((group) => (
          <Collapsible
            key={group.title}
            defaultOpen={openGroups.includes(group.title)}
            className="group/collapsible"
          >
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-md transition-colors flex items-center justify-between pr-2">
                  <div className="flex items-center gap-2">
                    <group.icon className="w-4 h-4" />
                    {!isCollapsed && <span>{group.title}</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.value}>
                        <SidebarMenuButton
                          onClick={() => onTabChange(item.value)}
                          isActive={activeTab === item.value}
                          tooltip={item.title}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}

        {/* Quick Links */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>Quick Links</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/students")} tooltip="Students">
                  <Users className="w-4 h-4" />
                  <span>Students</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/enrollments")} tooltip="Enrollments">
                  <BookOpen className="w-4 h-4" />
                  <span>Enrollments</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/instructors")} tooltip="Instructors">
                  <Users className="w-4 h-4" />
                  <span>Instructors</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/sessions")} tooltip="Sessions">
                  <Calendar className="w-4 h-4" />
                  <span>Sessions</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
