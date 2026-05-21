import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { insertInstructor } from "@/domains/learning/repo/learningRepo";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2, UserPlus, Shield, Briefcase, DollarSign, Sparkles } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { cn } from "@/lib/utils";

const InstructorNew = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // CTO Strategy: Sanitize expertise string into unique normalized array
      const expertiseArray = Array.from(
        new Set(
          formData.expertise
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.length > 0),
        ),
      );

      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        bio: formData.bio || null,
        profile_image_url: formData.profile_image_url || null,
        expertise: expertiseArray.length > 0 ? expertiseArray : null,
        team_role: formData.team_role,
        status: formData.status,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      };

      await withTimeout(
        insertInstructor(payload),
        TIMEOUTS.DEFAULT,
        "Handshake timeout: Database write delayed.",
      );

      toast.success("Identity Created: New instructor node active.");
      navigate("/instructors");
    } catch (error: any) {
      toast.error(error.message || "Blueprint creation failed.");
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <header>
            <h1 className="text-4xl font-black tracking-tighter">Add Instructor</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Onboard new human capital to the ecosystem
            </p>
          </header>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[280px,1fr] gap-8 items-start">
            {/* Sidebar: Identity & Status */}
            <aside className="space-y-6">
              <Card className="rounded-[32px] border-border/40 overflow-hidden shadow-xl shadow-primary/5">
                <CardHeader className="bg-muted/30 pb-4 border-b border-border/20">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Profile Artifact
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
                      Initial Status
                    </Label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                      <SelectTrigger className="rounded-xl border-border/40 font-bold text-xs h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active Fleet</SelectItem>
                        <SelectItem value="inactive">Reserve</SelectItem>
                        <SelectItem value="on_leave">Sabbatical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">
                      Primary Function
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
                        <SelectItem value="teaching_assistant">Teaching Assistant</SelectItem>
                        <SelectItem value="coordinator">Program Coordinator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content: Core Intel */}
            <div className="space-y-6">
              <Card className="rounded-[32px] border-border/40 overflow-hidden shadow-2xl shadow-primary/5">
                <CardHeader className="bg-muted/30 pb-6 border-b border-border/20">
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" /> Personnel Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Full Legal Name *
                      </Label>
                      <Input
                        placeholder="Dr. Sarah Connor"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="h-12 rounded-xl border-border/40 font-bold focus-visible:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Verified Email *
                      </Label>
                      <Input
                        type="email"
                        placeholder="sarah.c@academy.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-12 rounded-xl border-border/40 font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Mobile Sequence
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
                        Compensation (USD/hr)
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
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 flex items-center gap-2">
                      <Sparkles className="h-3 w-3" /> Professional Taxonomy (Expertise)
                    </Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={formData.expertise}
                        onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                        className="h-12 rounded-xl border-border/40 pl-9 italic"
                        placeholder="Deep Learning, Product Architecture, GTM Strategy..."
                      />
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter ml-1">
                      Separate skills with commas for neural mapping
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Identity Bio
                    </Label>
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={6}
                      className="rounded-2xl border-border/40 resize-none font-medium leading-relaxed"
                      placeholder="Executive summary of professional background..."
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  Verify & Initialize
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

export default InstructorNew;
