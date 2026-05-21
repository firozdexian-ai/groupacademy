import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getInstructorById, updateInstructor } from "@/domains/learning/repo/learningRepo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, UserCheck, Shield, Briefcase, DollarSign } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { cn } from "@/lib/utils";

const InstructorEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    bio: "",
    profile_image_url: "",
    expertise: "",
    team_role: "instructor",
    status: "active",
    hourly_rate: "",
  });

  useEffect(() => {
    if (id) loadInstructor();
  }, [id]);

  const loadInstructor = async () => {
    try {
      setIsLoading(true);
      const data = await getInstructorById(id as string);

      setFormData({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || "",
        bio: data.bio || "",
        profile_image_url: data.profile_image_url || "",
        expertise: data.expertise ? data.expertise.join(", ") : "",
        team_role: data.team_role,
        status: data.status,
        hourly_rate: data.hourly_rate ? data.hourly_rate.toString() : "",
      });
    } catch (error: any) {
      toast.error("Handshake Failed: Unable to retrieve instructor node.");
      navigate("/instructors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // CTO STRATEGY: Sanitize comma-separated string into clean normalized array
      const expertiseArray = formData.expertise
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      await updateInstructor(id as string, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        bio: formData.bio || null,
        profile_image_url: formData.profile_image_url || null,
        expertise: expertiseArray.length > 0 ? expertiseArray : null,
        team_role: formData.team_role,
        status: formData.status,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      });

      toast.success("Profile Synchronized: Instructor record updated.");
      navigate("/instructors");
    } catch (error: any) {
      toast.error(error.message || "Blueprint Update Failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-4 text-muted-foreground">
          Decoding Instructor Identity
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/20 pb-20 selection:bg-primary/10">
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/instructors")}
            className="rounded-xl font-bold uppercase text-[10px] tracking-widest pl-0 hover:bg-transparent"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Nexus Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary/40" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Admin Protocol v2.4
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="flex flex-col gap-8">
          <header>
            <h1 className="text-4xl font-black tracking-tighter">Edit Instructor</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Refine human capital metadata
            </p>
          </header>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[280px,1fr] gap-8 items-start">
            {/* Sidebar: Profile Visuals */}
            <aside className="space-y-6">
              <Card className="rounded-[32px] border-border/40 overflow-hidden shadow-xl shadow-primary/5">
                <CardHeader className="bg-muted/30 pb-4 border-b border-border/20">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Identity Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ImageUpload
                    value={formData.profile_image_url}
                    onUpload={(url) => setFormData({ ...formData, profile_image_url: url })}
                    onRemove={() => setFormData({ ...formData, profile_image_url: "" })}
                    bucket="instructor-profiles"
                  />
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border/40 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">
                      Status Sequence
                    </Label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                      <SelectTrigger className="rounded-xl border-border/40 font-bold text-xs h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active Fleet</SelectItem>
                        <SelectItem value="inactive">Deactivated</SelectItem>
                        <SelectItem value="on_leave">Sabbatical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">
                      Operational Role
                    </Label>
                    <Select
                      value={formData.team_role}
                      onValueChange={(val) => setFormData({ ...formData, team_role: val })}
                    >
                      <SelectTrigger className="rounded-xl border-border/40 font-bold text-xs h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instructor">Lead Instructor</SelectItem>
                        <SelectItem value="speaker">Keynote Speaker</SelectItem>
                        <SelectItem value="teaching_assistant">Support Staff</SelectItem>
                        <SelectItem value="coordinator">Ops Coordinator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Main Information Stack */}
            <div className="space-y-6">
              <Card className="rounded-[32px] border-border/40 overflow-hidden shadow-2xl shadow-primary/5">
                <CardHeader className="bg-muted/30 pb-6 border-b border-border/20">
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" /> Core Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Full Legal Name *
                      </Label>
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="h-12 rounded-xl border-border/40 font-bold focus-visible:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Primary Email *
                      </Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-12 rounded-xl border-border/40 font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Contact Sequence
                      </Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-12 rounded-xl border-border/40"
                        placeholder="+880..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Hourly Compensation (USD)
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.hourly_rate}
                          onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                          className="h-12 rounded-xl border-border/40 pl-9 font-bold"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Skill Taxonomy (Expertise)
                    </Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-4 h-4 w-4 text-primary" />
                      <Input
                        value={formData.expertise}
                        onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                        className="h-12 rounded-xl border-border/40 pl-9 italic"
                        placeholder="AI, Strategy, Ops..."
                      />
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter ml-1">
                      Separate specific skills with commas for neural mapping
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Professional Narrative (Bio)
                    </Label>
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={6}
                      className="rounded-2xl border-border/40 resize-none font-medium leading-relaxed"
                      placeholder="Brief introduction..."
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all"
                >
                  {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  Verify & Synchronize
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/instructors")}
                  className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                >
                  Abort
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default InstructorEdit;
