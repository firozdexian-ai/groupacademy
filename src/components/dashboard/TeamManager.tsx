import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Trash2,
  UserPlus,
  Shield,
  Users,
  Eye,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  KeyRound,
  Copy,
  Check,
  Activity,
  Zap,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Database } from "@/integrations/supabase/types";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Internal Workforce Command Center
 * CTO Reference: Authoritative orchestrator for workforce roles and security protocols.
 * Fixed TS2304 by restoring the handleOpenResetDialog function.
 */

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

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetMember, setResetMember] = useState<TeamMember | null>(null);
  const [resetMethod, setResetMethod] = useState<"email" | "temporary">("email");
  const [isResetting, setIsResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchTeamMembers = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const fetchProtocol = async () => {
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("*")
          .order("created_at", { ascending: false });

        if (rolesError) throw rolesError;
        if (!roles || roles.length === 0) return { data: [], error: null };

        const userIds = roles.map((r) => r.user_id);
        const { data: talents, error: talentsError } = await supabase
          .from("talents")
          .select(
            "user_id, email, full_name, phone, profile_photo_url, current_status, created_at, profession_category_id",
          )
          .in("user_id", userIds);

        if (talentsError) console.error("Identity Sync Fault:", talentsError);

        const talentMap = new Map<string, TalentInfo>();
        (talents || []).forEach((t) => {
          if (t.user_id) talentMap.set(t.user_id, t as unknown as TalentInfo);
        });

        const membersWithInfo: TeamMember[] = roles.map((role) => ({
          id: role.id,
          user_id: role.user_id,
          role: role.role as AppRole,
          created_at: role.created_at || "",
          talent: talentMap.get(role.user_id) || null,
        }));

        return { data: membersWithInfo, error: null };
      };

      const result = (await withTimeout(fetchProtocol(), TIMEOUTS.DEFAULT, "Workforce synchronization timed out")) as {
        data: TeamMember[];
        error: any;
      };

      if (result.error) throw result.error;
      setTeamMembers(result.data || []);
    } catch (error: any) {
      console.error("Workforce Fault:", error);
      setLoadError(error.message || "Failed to load team members");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const handleAddMember = async () => {
    if (!newEmail.trim()) {
      toast.error("Protocol Fault: Email identifier required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: talent, error: talentError } = await supabase
        .from("talents")
        .select("user_id")
        .ilike("email", newEmail.trim())
        .maybeSingle();

      if (talentError) throw talentError;
      if (!talent?.user_id) {
        toast.error("Identity NotFound: User must register an account before role assignment.");
        return;
      }

      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", talent.user_id)
        .eq("role", newRole)
        .maybeSingle();

      if (existingRole) {
        toast.error("Protocol Redundancy: Node already possesses this authority.");
        return;
      }

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: talent.user_id, role: newRole });

      if (insertError) throw insertError;

      toast.success(`Protocol Successful: ${newRole.toUpperCase()} authority deployed.`);
      setNewEmail("");
      setIsDialogOpen(false);
      fetchTeamMembers();
    } catch (error) {
      toast.error("Transmission Fault: Failed to assign authority.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRole = async (id: string, role: AppRole) => {
    if (!confirm(`Are you sure you want to terminate ${role.toUpperCase()} authority?`)) return;
    try {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
      toast.success("Protocol Successful: Authority revoked.");
      fetchTeamMembers();
    } catch (error) {
      toast.error("Termination Fault: Role removal failed.");
    }
  };

  // RESTORED: Missing function to open reset dialog
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
      const response = await supabase.functions.invoke("admin-reset-password", {
        body: { targetUserId: resetMember.user_id, targetEmail: resetMember.talent.email, method: resetMethod },
      });
      if (response.error) throw response.error;
      const data = response.data;
      if (data.error) throw new Error(data.error);

      if (resetMethod === "temporary" && data.temporaryPassword) {
        setTempPassword(data.temporaryPassword);
        toast.success("Key Deployed: Temporary password generated.");
      } else if (resetMethod === "email") {
        if (data.resetLink) {
          setResetLink(data.resetLink);
          toast.success("Key Deployed: Manual reset link generated.");
        } else {
          toast.success("Transmission Successful: Reset email dispatched.");
          setIsResetDialogOpen(false);
        }
      }
    } catch (error: any) {
      toast.error("Security Fault: Password reset failed.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Artifact Secured to Clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (isLoading)
    return (
      <div className="p-8">
        <DashboardTableSkeleton rows={8} columns={6} />
      </div>
    );
  if (loadError) return <DashboardErrorState title="Registry Failure" message={loadError} onRetry={fetchTeamMembers} />;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <ShieldCheck className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Workforce Hub</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Administrative Hierarchy & Security Protocol Center
          </p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="h-14 px-6 rounded-2xl border-2 font-black italic gap-2 text-primary">
            <Activity className="h-4 w-4" /> {teamMembers.length} ACTIVE NODES
          </Badge>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 px-8 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg">
                <UserPlus className="h-5 w-5" /> Deploy Authority
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-[40px] border-4 p-8 overflow-hidden bg-background">
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                  Authority Deployment
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest">
                  Assign workforce permissions to a verified identity.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 pt-4 text-left">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary italic">Identity Email</Label>
                  <Input
                    placeholder="node@groupacademy.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="h-14 rounded-2xl border-2 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary italic">Protocol Level</Label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                    <SelectTrigger className="h-14 rounded-2xl border-2 font-black uppercase text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      <SelectItem value="talent_exec" className="font-bold text-[10px]">
                        TALENT_SUCCESS_EXECUTIVE
                      </SelectItem>
                      <SelectItem value="admin" className="font-bold text-[10px]">
                        FULL_SYSTEM_ADMIN
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddMember}
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-[24px] font-black uppercase italic tracking-tighter text-xl gap-3 shadow-xl"
                >
                  {isSubmitting ? <RefreshCw className="animate-spin" /> : <Zap className="fill-current" />} Assign
                  Authority
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* TEAM REGISTRY */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 pl-8">
                  Workforce Node
                </TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Auth Protocol</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Deployment Date</TableHead>
                <TableHead className="text-right py-6 pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow
                  key={member.id}
                  className="group border-b border-border/5 hover:bg-muted/10 transition-colors"
                >
                  <TableCell className="py-6 pl-8">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarImage src={member.talent?.profile_photo_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-black italic">
                          {member.talent?.full_name ? getInitials(member.talent.full_name) : "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-black text-sm uppercase italic tracking-tight">
                          {member.talent?.full_name || "NULL_ENTITY"}
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                          {member.talent?.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "font-black text-[9px] uppercase italic border-2",
                        member.role === "admin"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {member.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase italic text-muted-foreground/60 tracking-tighter">
                        Verified
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] font-black italic text-muted-foreground/40">
                    {new Date(member.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedMember(member);
                          setIsDetailDialogOpen(true);
                        }}
                        className="hover:bg-primary/10"
                      >
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenResetDialog(member)}
                        disabled={!member.talent}
                        className="hover:bg-primary/10"
                      >
                        <KeyRound className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRole(member.id, member.role)}
                        className="hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MEMBER DETAIL DIALOG */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-md rounded-[40px] border-4 p-10 bg-background overflow-hidden text-left">
          <div className="h-2 w-full bg-primary absolute top-0 left-0" />
          {selectedMember && (
            <div className="space-y-8">
              <div className="flex items-center gap-5 border-b pb-6">
                <Avatar className="h-20 w-20 border-4 border-primary/10 shadow-xl">
                  <AvatarImage src={selectedMember.talent?.profile_photo_url || ""} />
                  <AvatarFallback className="bg-primary/5 text-primary text-2xl font-black italic">
                    {selectedMember.talent?.full_name ? getInitials(selectedMember.talent.full_name) : "??"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    {selectedMember.talent?.full_name || "NULL_NODE"}
                  </h3>
                  <Badge className="bg-primary/10 text-primary border-none font-black italic text-[10px] mt-2 uppercase">
                    {selectedMember.role}
                  </Badge>
                </div>
              </div>
              <div className="space-y-4">
                <StatNode icon={Mail} label="Transmission Email" value={selectedMember.talent?.email || "-"} />
                <StatNode icon={Phone} label="Contact String" value={selectedMember.talent?.phone || "NOT_PROVIDED"} />
                <StatNode
                  icon={Calendar}
                  label="Deployment Date"
                  value={new Date(selectedMember.created_at).toLocaleDateString()}
                />
              </div>
              <div className="pt-4 border-t opacity-40">
                <p className="text-[9px] font-black uppercase tracking-widest italic">Global Instance ID</p>
                <code className="text-[10px] font-mono">{selectedMember.user_id}</code>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PASSWORD RESET DIALOG */}
      <Dialog
        open={isResetDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setTempPassword(null);
            setResetLink(null);
          }
          setIsResetDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-md rounded-[40px] border-4 p-10 bg-background text-left">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <KeyRound className="text-primary h-6 w-6" /> Security Recalibration
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic">
              Reset workforce access key for {resetMember?.talent?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-6">
            {tempPassword ? (
              <div className="p-6 bg-amber-500/5 border-2 border-amber-500/20 rounded-3xl space-y-4 animate-in zoom-in-95">
                <p className="text-[10px] font-black uppercase text-amber-600 italic">Temporal Key Generated</p>
                <div className="flex gap-2">
                  <code className="flex-1 p-4 bg-background rounded-2xl border-2 font-mono text-lg font-black tracking-widest">
                    {tempPassword}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(tempPassword)}
                    className="h-14 w-14 rounded-2xl border-2"
                  >
                    <Check className="h-6 w-6 text-green-500" />
                  </Button>
                </div>
                <p className="text-[9px] font-bold text-muted-foreground italic">
                  Share this key securely. Force change required on ingress.
                </p>
              </div>
            ) : resetLink ? (
              <div className="p-6 bg-primary/5 border-2 border-primary/20 rounded-3xl space-y-4">
                <p className="text-[10px] font-black uppercase text-primary italic">External Reset Protocol</p>
                <div className="flex gap-2">
                  <code className="flex-1 p-4 bg-background rounded-2xl border-2 text-[10px] font-mono truncate">
                    {resetLink}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(resetLink)}
                    className="h-14 w-14 rounded-2xl border-2"
                  >
                    <Check className="h-6 w-6 text-green-500" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <RadioGroup
                  value={resetMethod}
                  onValueChange={(v) => setResetMethod(v as "email" | "temporary")}
                  className="grid gap-4"
                >
                  <div className="flex items-center space-x-3 p-4 border-2 rounded-2xl cursor-pointer hover:bg-muted/10 transition-all">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="font-black uppercase italic text-xs cursor-pointer">
                      Dispatch Reset Email
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border-2 rounded-2xl cursor-pointer hover:bg-muted/10 transition-all">
                    <RadioGroupItem value="temporary" id="temp" />
                    <Label htmlFor="temp" className="font-black uppercase italic text-xs cursor-pointer">
                      Generate Temporal Password
                    </Label>
                  </div>
                </RadioGroup>
                <Button
                  onClick={handleResetPassword}
                  disabled={isResetting}
                  className="w-full h-16 rounded-[24px] font-black uppercase italic tracking-tighter text-xl gap-3 shadow-xl"
                >
                  {isResetting ? <RefreshCw className="animate-spin" /> : <Zap className="fill-current" />} Recalibrate
                  Keys
                </Button>
              </>
            )}
            {(tempPassword || resetLink) && (
              <Button
                className="w-full h-14 rounded-2xl font-black uppercase italic"
                onClick={() => setIsResetDialogOpen(false)}
              >
                Protocol Finalized
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatNode({ icon: Icon, label, value }: any) {
  return (
    <div className="p-5 bg-muted/20 rounded-2xl border-2 border-border/5 space-y-1">
      <p className="text-[9px] font-black uppercase text-muted-foreground/60 italic flex items-center gap-2">
        <Icon className="h-3 w-3 text-primary" /> {label}
      </p>
      <p className="text-sm font-black italic">{value}</p>
    </div>
  );
}
