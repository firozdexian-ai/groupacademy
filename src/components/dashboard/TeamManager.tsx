import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, UserPlus, Shield, Users } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";

type AppRole = Database["public"]["Enums"]["app_role"];

interface TeamMember {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email?: string;
}

export function TeamManager() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("talent_exec");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await withTimeout(
        Promise.resolve(supabase.from("user_roles").select("*").order("created_at", { ascending: false })),
        TIMEOUTS.DEFAULT,
        "Loading team members timed out"
      );
      if (result.error) throw result.error;
      setTeamMembers(result.data || []);
    } catch (error: any) {
      console.error("Error fetching team members:", error);
      setLoadError(error.message || "Failed to load team members");
      toast.error("Failed to load team members");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSubmitting(true);
    try {
      // First, find the user by email in the students table (linked to auth)
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("user_id")
        .eq("email", newEmail.trim())
        .maybeSingle();

      if (studentError) throw studentError;

      if (!student?.user_id) {
        toast.error("User not found. They must sign up first before being assigned a role.");
        return;
      }

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", student.user_id)
        .eq("role", newRole)
        .maybeSingle();

      if (existingRole) {
        toast.error("User already has this role");
        return;
      }

      // Insert the role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: student.user_id,
          role: newRole,
        });

      if (insertError) throw insertError;

      toast.success(`${newRole === 'admin' ? 'Admin' : 'Talent Success Executive'} role assigned successfully`);
      setNewEmail("");
      setIsDialogOpen(false);
      fetchTeamMembers();
    } catch (error) {
      console.error("Error adding team member:", error);
      toast.error("Failed to assign role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRole = async (id: string, role: AppRole) => {
    if (!confirm(`Are you sure you want to remove this ${role} role?`)) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Role removed successfully");
      fetchTeamMembers();
    } catch (error) {
      console.error("Error removing role:", error);
      toast.error("Failed to remove role");
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case "admin":
        return "default";
      case "talent_exec":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "talent_exec":
        return "Talent Success Executive";
      case "student":
        return "Student";
      default:
        return role;
    }
  };

  if (isLoading) {
    return <DashboardTableSkeleton rows={5} columns={4} />;
  }

  if (loadError) {
    return (
      <DashboardErrorState
        title="Failed to load team members"
        message={loadError}
        onRetry={fetchTeamMembers}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Members</h2>
          <p className="text-muted-foreground">
            Manage admin and talent executive roles
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Assign Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Role to User</DialogTitle>
              <DialogDescription>
                Enter the email of an existing user to assign them a role.
                They must have signed up first.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">User Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="talent_exec">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Talent Success Executive
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Admin (Full Access)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Role Permissions:</p>
                {newRole === "talent_exec" ? (
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>CV Outreach Generator</li>
                    <li>Talent Pool Management</li>
                    <li>Portfolio Requests</li>
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Full access to all dashboard features</p>
                )}
              </div>
              <Button
                onClick={handleAddMember}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Assigning..." : "Assign Role"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No team members assigned yet
                </TableCell>
              </TableRow>
            ) : (
              teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-mono text-sm">
                    {member.user_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {getRoleLabel(member.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(member.created_at || "").toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRole(member.id, member.role)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
