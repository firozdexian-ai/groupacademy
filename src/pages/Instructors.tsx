import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryWithTimeout, withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Mail,
  Phone,
  ArrowLeft,
  Edit3,
  Trash2,
  ShieldCheck,
  UserCheck,
  MapPin,
  Clock,
  Filter,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CardGridSkeleton } from "@/components/ui/page-loading-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/lib/utils";

interface Instructor {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  profile_image_url: string | null;
  expertise: string[] | null;
  team_role: string;
  status: string;
  hourly_rate: number | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active Fleet", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  inactive: { label: "Deactivated", color: "bg-muted text-muted-foreground border-border" },
  on_leave: { label: "Sabbatical", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
};

const Instructors = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);

  const {
    data: instructors = [],
    isLoading,
    error,
    refetch,
  } = useQueryWithTimeout({
    queryKey: ["instructors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("instructors").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Instructor[];
    },
    timeout: TIMEOUTS.DEFAULT,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return navigate("/auth");

      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single();
      setIsAdmin(roleData?.role === "admin");
    } catch (e) {
      toast.error("Security handshake failed.");
    }
  };

  const filteredInstructors = instructors.filter((instructor) => {
    const matchesSearch =
      !searchQuery ||
      instructor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.expertise?.some((exp) => exp.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === "all" || instructor.team_role === roleFilter;
    const matchesStatus = statusFilter === "all" || instructor.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleDelete = async () => {
    if (!selectedInstructor) return;
    try {
      const { error } = await supabase.from("instructors").delete().eq("id", selectedInstructor.id);
      if (error) throw error;
      toast.success("Instructor node purged.");
      refetch();
      setDeleteDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20 animate-in fade-in duration-700">
      {/* Executive Header */}
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="rounded-full hover:bg-primary/5"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">Faculty Nexus</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Global Teaching Talent Hub
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button
              onClick={() => navigate("/instructors/new")}
              className="rounded-xl h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Personnel
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 space-y-8">
        {/* Intelligence Filters */}
        <Card className="rounded-[32px] border-border/40 bg-card/50 backdrop-blur-md shadow-2xl shadow-primary/5">
          <CardContent className="p-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search Identity, Email, or Skill Domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 rounded-2xl border-border/40 bg-background/50 focus-visible:ring-primary/20"
              />
            </div>
            <div className="flex gap-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl border-border/40 font-bold uppercase text-[10px] tracking-widest">
                  <Filter className="w-3 h-3 mr-2" />
                  <SelectValue placeholder="Function" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Functions</SelectItem>
                  {["instructor", "speaker", "teaching_assistant", "coordinator"].map((r) => (
                    <SelectItem key={r} value={r} className="uppercase text-[10px] font-bold">
                      {r.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-12 rounded-2xl border-border/40 font-bold uppercase text-[10px] tracking-widest">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">Global Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <CardGridSkeleton count={6} columns={3} />
        ) : error ? (
          <ErrorState
            type="server"
            title="Sync Failed"
            description="Could not connect to faculty database."
            onRetry={() => refetch()}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstructors.map((instructor) => {
              const status = statusConfig[instructor.status] || statusConfig.inactive;
              return (
                <Card
                  key={instructor.id}
                  className="rounded-[32px] border-border/40 bg-card hover:shadow-2xl hover:border-primary/20 transition-all group overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="p-8 space-y-6">
                      <div className="flex items-start justify-between">
                        <Avatar className="w-20 h-20 rounded-[28px] border-4 border-background shadow-xl">
                          <AvatarImage src={instructor.profile_image_url || undefined} className="object-cover" />
                          <AvatarFallback className="bg-primary/5 text-primary font-black text-xl">
                            {instructor.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                            status.color,
                          )}
                        >
                          {status.label}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <CardTitle className="text-xl font-black tracking-tight leading-tight group-hover:text-primary transition-colors truncate">
                          {instructor.full_name}
                        </CardTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                          {instructor.team_role.replace("_", " ")}
                        </p>
                      </div>

                      <p className="text-xs font-medium text-muted-foreground leading-relaxed line-clamp-2 italic h-8">
                        "{instructor.bio || "No professional summary provided."}"
                      </p>

                      <div className="flex flex-wrap gap-1.5 h-14 overflow-hidden">
                        {instructor.expertise?.slice(0, 4).map((exp, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-muted/50 text-[9px] font-bold uppercase border-none h-6 px-2"
                          >
                            {exp}
                          </Badge>
                        ))}
                      </div>

                      <div className="pt-6 border-t border-border/40 grid grid-cols-1 gap-2">
                        <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                          <Mail className="w-4 h-4 text-primary/40" />
                          <span className="text-xs font-bold truncate">{instructor.email}</span>
                        </div>
                        {instructor.phone && (
                          <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                            <Phone className="w-4 h-4 text-primary/40" />
                            <span className="text-xs font-bold">{instructor.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="bg-muted/30 px-8 py-4 flex gap-2 border-t border-border/40">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest h-10 hover:bg-primary/10 text-primary"
                          onClick={() => navigate(`/instructors/${instructor.id}/edit`)}
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-2" /> Modify
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl w-10 h-10 p-0 text-rose-500 hover:bg-rose-500/10"
                          onClick={() => {
                            setSelectedInstructor(instructor);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[32px] border-border/40 p-8">
          <AlertDialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter uppercase">
              Purge Instructor?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium">
              You are about to terminate the profile of{" "}
              <span className="font-bold text-foreground">{selectedInstructor?.full_name}</span>. This action is
              irreversible within the current node.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-2xl font-black uppercase text-[10px] tracking-widest">
              Abort
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-500 hover:bg-rose-600 rounded-2xl font-black uppercase text-[10px] tracking-widest"
            >
              Confirm Termination
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Instructors;
