import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

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
      // Parse expertise as array
      const expertiseArray = formData.expertise
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      const { error } = await withTimeout(
        Promise.resolve(supabase.from("instructors").insert([
          {
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone || null,
            bio: formData.bio || null,
            profile_image_url: formData.profile_image_url || null,
            expertise: expertiseArray.length > 0 ? expertiseArray : null,
            team_role: formData.team_role,
            status: formData.status,
            hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
          },
        ])),
        TIMEOUTS.DEFAULT,
        "Insert timed out"
      );

      if (error) throw error;

      toast.success("Instructor added successfully!");
      navigate("/instructors");
    } catch (error: any) {
      toast.error(error.message || "Failed to add instructor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate("/instructors")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Instructors
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Add New Instructor</CardTitle>
            <CardDescription>Add a new team member or instructor to the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image */}
              <div className="space-y-2">
                <Label>Profile Image</Label>
                <ImageUpload
                  value={formData.profile_image_url}
                  onUpload={(url) => setFormData({ ...formData, profile_image_url: url })}
                  onRemove={() => setFormData({ ...formData, profile_image_url: "" })}
                  bucket="instructor-profiles"
                />
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+880..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate (USD)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="1000"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                  />
                </div>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="team_role">Team Role *</Label>
                  <Select value={formData.team_role} onValueChange={(value) => setFormData({ ...formData, team_role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="speaker">Speaker</SelectItem>
                      <SelectItem value="teaching_assistant">Teaching Assistant</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  placeholder="Brief introduction and background..."
                />
              </div>

              {/* Expertise */}
              <div className="space-y-2">
                <Label htmlFor="expertise">Expertise (comma-separated)</Label>
                <Input
                  id="expertise"
                  placeholder="AI, Machine Learning, Product Management"
                  value={formData.expertise}
                  onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Enter multiple expertise areas separated by commas
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Adding..." : "Add Instructor"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/instructors")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InstructorNew;
