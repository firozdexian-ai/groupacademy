import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Mail, Phone, ArrowLeft, Edit, Trash2 } from "lucide-react";
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
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";

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

const Instructors = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);

  const { data: instructors = [], isLoading, error, refetch } = useQuery({
    queryKey: ["instructors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Instructor[];
    },
    retry: 2,
    retryDelay: 1000,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userResult = await withTimeout(
        Promise.resolve(supabase.auth.getUser()),
        TIMEOUTS.AUTH,
        "Authentication check timed out"
      );
      if (!userResult.data?.user) {
        navigate("/auth");
        return;
      }
      const rolesResult = await withTimeout(
        Promise.resolve(supabase.from("user_roles").select("role").eq("user_id", userResult.data.user.id).single()),
        TIMEOUTS.AUTH,
        "Loading roles timed out"
      );
      setIsAdmin(rolesResult.data?.role === "admin");
    } catch (error: any) {
      console.error("Auth check error:", error);
      toast.error("Failed to verify authentication");
    }
  };

  const filteredInstructors = instructors.filter((instructor) => {
    const matchesSearch = !searchQuery || 
      instructor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.expertise?.some((exp) => exp.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === "all" || instructor.team_role === roleFilter;
    const matchesStatus = statusFilter === "all" || instructor.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleDelete = async () => {
    if (!selectedInstructor) return;

    try {
      const { error } = await supabase
        .from("instructors")
        .delete()
        .eq("id", selectedInstructor.id);

      if (error) throw error;

      toast.success("Instructor deleted successfully");
      refetch();
      setDeleteDialogOpen(false);
      setSelectedInstructor(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete instructor");
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      instructor: "bg-blue-100 text-blue-700",
      speaker: "bg-purple-100 text-purple-700",
      teaching_assistant: "bg-green-100 text-green-700",
      coordinator: "bg-orange-100 text-orange-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      inactive: "bg-gray-100 text-gray-700",
      on_leave: "bg-yellow-100 text-yellow-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const formatRole = (role: string) => {
    return role.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/dashboard")} size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">Team & Instructors</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Manage your teaching team</p>
              </div>
            </div>
            {isAdmin && (
              <Button onClick={() => navigate("/instructors/new")} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Instructor
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, email, or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="speaker">Speaker</SelectItem>
                <SelectItem value="teaching_assistant">Teaching Assistant</SelectItem>
                <SelectItem value="coordinator">Coordinator</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <CardGridSkeleton count={6} columns={3} />
        ) : error ? (
          <ErrorState
            type="server"
            title="Failed to load instructors"
            description="We couldn't load the instructors. Please try again."
            onRetry={() => refetch()}
          />
        ) : filteredInstructors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                  ? "No instructors found matching your filters"
                  : "No instructors yet"}
              </p>
              {isAdmin && (
                <Button onClick={() => navigate("/instructors/new")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Instructor
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredInstructors.map((instructor) => (
              <Card key={instructor.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4 mb-4">
                    <Avatar className="w-12 h-12 sm:w-16 sm:h-16 shrink-0">
                      <AvatarImage src={instructor.profile_image_url || undefined} />
                      <AvatarFallback className="text-sm sm:text-lg">
                        {instructor.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg mb-1 truncate">{instructor.full_name}</CardTitle>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge className={`${getRoleColor(instructor.team_role)} text-xs`} variant="secondary">
                          {formatRole(instructor.team_role)}
                        </Badge>
                        <Badge className={`${getStatusColor(instructor.status)} text-xs`} variant="secondary">
                          {instructor.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {instructor.bio && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">{instructor.bio}</p>
                  )}

                  {instructor.expertise && instructor.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {instructor.expertise.slice(0, 3).map((exp, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {exp}
                        </Badge>
                      ))}
                      {instructor.expertise.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{instructor.expertise.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{instructor.email}</span>
                    </div>
                    {instructor.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{instructor.phone}</span>
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2 pt-4 mt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/instructors/${instructor.id}/edit`)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
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
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Instructor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedInstructor?.full_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Instructors;
