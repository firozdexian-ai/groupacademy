import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createStudentProfile } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, UserCircle } from "lucide-react";

interface ProfileCompletionFormProps {
  user: any;
  onComplete: (profile: any) => void;
}

export const ProfileCompletionForm = ({ user, onComplete }: ProfileCompletionFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Use shared profile creation function
      const success = await createStudentProfile(
        user.id,
        formData.fullName,
        user.email || '',
        formData.phone,
        'free_learner'
      );

      if (success) {
        toast.success("Profile completed successfully!");
        // Fetch the created profile to pass to onComplete
        const { data } = await supabase
          .from("students")
          .select("*")
          .eq("user_id", user.id)
          .single();
        
        if (data) {
          onComplete(data);
        }
      } else {
        toast.error("Failed to complete profile. Please try again.");
      }
    } catch (error: any) {
      console.error("Profile completion error:", error);
      toast.error("Failed to complete profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Complete Your Profile</CardTitle>
        </div>
        <CardDescription>
          We need a few more details to set up your learning account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email || ''}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+8801234567890"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || !formData.fullName.trim()}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Complete Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
