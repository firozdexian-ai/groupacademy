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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Trash2, UserPlus, Shield, Users, Eye, Mail, Phone, Calendar, Briefcase, KeyRound, Copy, Check } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Database } from "@/integrations/supabase/types";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";

type AppRole = Database["public"]["Enums"]["app_role"];

interface TalentInfo {
  email: string;
  full_name: string;
  phone: string | null;
  profile_photo_url: string | null;
  current_status: string | null;
  created_at: string;
  profession_category_id: string | null;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  talent?: TalentInfo | null;
}

export function TeamManager() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("talent_exec");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Password reset state
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetMember, setResetMember] = useState<TeamMember | null>(null);
  const [resetMethod, setResetMethod] = useState<"email" | "temporary">("email");
  const [isResetting, setIsResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // First get user_roles
      const rolesResult = await withTimeout(
        Promise.resolve(supabase.from("user_roles").select("*").order("created_at", { ascending: false })),
        TIMEOUTS.DEFAULT,
        "Loading team members timed out"
      );
      if (rolesResult.error) throw rolesResult.error;

      const roles = rolesResult.data || [];
      
      // Get user IDs to fetch talent info
      const userIds = roles.map(r => r.user_id);
      
      if (userIds.length === 0) {
        setTeamMembers([]);
        setIsLoading(false);
        return;
      }

      // Fetch talent info for these users
      const { data: talents, error: talentsError } = await supabase
        .from("talents")
        .select("user_id, email, full_name, phone, profile_photo_url, current_status, created_at, profession_category_id")
        .in("user_id", userIds);

      if (talentsError) {
        console.error("Error fetching talent info:", talentsError);
      }

      // Map talents to user_ids
      const talentMap = new Map<string, TalentInfo>();
      (talents || []).forEach(t => {
        if (t.user_id) {
          talentMap.set(t.user_id, {
            email: t.email,
            full_name: t.full_name,
            phone: t.phone,
            profile_photo_url: t.profile_photo_url,
            current_status: t.current_status,
            created_at: t.created_at || "",
            profession_category_id: t.profession_category_id,
          });
        }
      });

      // Combine roles with talent info
      const membersWithInfo: TeamMember[] = roles.map(role => ({
        id: role.id,
        user_id: role.user_id,
        role: role.role,
        created_at: role.created_at || "",
        talent: talentMap.get(role.user_id) || null,
      }));

      setTeamMembers(membersWithInfo);
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
      // First, find the user by email in the talents table (linked to auth)
      const { data: talent, error: talentError } = await supabase
        .from("talents")
        .select("user_id")
        .ilike("email", newEmail.trim())
        .maybeSingle();

      if (talentError) throw talentError;

      if (!talent?.user_id) {
        toast.error("User not found. They must sign up first before being assigned a role.");
        return;
      }

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", talent.user_id)
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
          user_id: talent.user_id,
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

  const handleViewDetails = (member: TeamMember) => {
    setSelectedMember(member);
    setIsDetailDialogOpen(true);
  };

  const handleOpenResetDialog = (member: TeamMember) => {
    setResetMember(member);
    setResetMethod("email");
    setTempPassword(null);
    setResetLink(null);
    setCopied(false);
    setIsResetDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetMember?.talent) return;

    setIsResetting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      const response = await supabase.functions.invoke("admin-reset-password", {
        body: {
          targetUserId: resetMember.user_id,
          targetEmail: resetMember.talent.email,
          method: resetMethod,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to reset password");
      }

      const data = response.data;

      if (data.error) {
        throw new Error(data.error);
      }

      if (resetMethod === "temporary" && data.temporaryPassword) {
        setTempPassword(data.temporaryPassword);
        toast.success("Temporary password generated");
      } else if (resetMethod === "email") {
        if (data.resetLink) {
          setResetLink(data.resetLink);
          toast.success("Reset link generated - share it with the user");
        } else {
          toast.success("Password reset email sent");
          setIsResetDialogOpen(false);
        }
      }
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
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
        return "Talent Executive";
      case "student":
        return "Student";
      default:
        return role;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    const statusColors: Record<string, string> = {
      employed: "bg-green-500/10 text-green-600 border-green-500/20",
      student: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      seeking: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      freelancer: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    };
    return (
      <Badge variant="outline" className={statusColors[status] || ""}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return <DashboardTableSkeleton rows={5} columns={5} />;
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
                    <li>Talent Pool & Leads Management</li>
                    <li>CV Outreach Generator</li>
                    <li>Portfolio Requests</li>
                    <li>Job Posting & Management</li>
                    <li>Job Applications Review</li>
                    <li>Companies Management</li>
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
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No team members assigned yet
                </TableCell>
              </TableRow>
            ) : (
              teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.talent?.profile_photo_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {member.talent?.full_name ? getInitials(member.talent.full_name) : "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.talent?.full_name || "Unknown User"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.talent?.email || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {getRoleLabel(member.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(member.talent?.current_status || null)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(member.created_at || "").toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(member)}
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenResetDialog(member)}
                        title="Reset password"
                        disabled={!member.talent}
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRole(member.id, member.role)}
                        title="Remove role"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Team Member Details</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedMember.talent?.profile_photo_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedMember.talent?.full_name ? getInitials(selectedMember.talent.full_name) : "??"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedMember.talent?.full_name || "Unknown User"}
                  </h3>
                  <Badge variant={getRoleBadgeVariant(selectedMember.role)}>
                    {getRoleLabel(selectedMember.role)}
                  </Badge>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedMember.talent?.email || "-"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedMember.talent?.phone || "Not provided"}</span>
                  </div>
                </div>
              </div>

              {/* Status & Dates */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Status & Timeline</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {selectedMember.talent?.current_status 
                        ? selectedMember.talent.current_status.charAt(0).toUpperCase() + selectedMember.talent.current_status.slice(1)
                        : "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Role assigned: {new Date(selectedMember.created_at).toLocaleDateString()}</span>
                  </div>
                  {selectedMember.talent?.created_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Joined platform: {new Date(selectedMember.talent.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* User ID (for admin reference) */}
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  User ID: <code className="bg-muted px-1 py-0.5 rounded">{selectedMember.user_id}</code>
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setTempPassword(null);
          setResetLink(null);
        }
        setIsResetDialogOpen(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Reset password for {resetMember?.talent?.full_name || "this user"}
            </DialogDescription>
          </DialogHeader>
          
          {resetMember?.talent && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={resetMember.talent.profile_photo_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(resetMember.talent.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{resetMember.talent.full_name}</p>
                  <p className="text-sm text-muted-foreground">{resetMember.talent.email}</p>
                </div>
              </div>

              {/* Show result if available */}
              {tempPassword && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-amber-600">Temporary Password Generated</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-background rounded border text-sm font-mono">
                      {tempPassword}
                    </code>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleCopy(tempPassword)}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this password securely. The user should change it immediately after logging in.
                  </p>
                </div>
              )}

              {resetLink && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-blue-600">Reset Link Generated</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-background rounded border text-xs font-mono truncate">
                      {resetLink}
                    </code>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleCopy(resetLink)}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this link with the user. It will expire in 1 hour.
                  </p>
                </div>
              )}

              {/* Method Selection - only show if no result yet */}
              {!tempPassword && !resetLink && (
                <>
                  <div className="space-y-3">
                    <Label>Choose reset method</Label>
                    <RadioGroup 
                      value={resetMethod} 
                      onValueChange={(v) => setResetMethod(v as "email" | "temporary")}
                    >
                      <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="email" id="email-method" className="mt-1" />
                        <div className="space-y-1">
                          <Label htmlFor="email-method" className="cursor-pointer font-medium">
                            Generate Reset Link
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Creates a password reset link you can share with the user
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="temporary" id="temp-method" className="mt-1" />
                        <div className="space-y-1">
                          <Label htmlFor="temp-method" className="cursor-pointer font-medium">
                            Generate Temporary Password
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Sets a temporary password you'll need to share manually
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsResetDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleResetPassword}
                      disabled={isResetting}
                    >
                      {isResetting ? "Processing..." : "Reset Password"}
                    </Button>
                  </div>
                </>
              )}

              {/* Close button when showing result */}
              {(tempPassword || resetLink) && (
                <Button
                  className="w-full"
                  onClick={() => setIsResetDialogOpen(false)}
                >
                  Done
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}