import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AccessCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string;
  contentTitle: string;
  onSuccess: () => void;
}

export const AccessCodeDialog = ({
  open,
  onOpenChange,
  contentId,
  contentTitle,
  onSuccess,
}: AccessCodeDialogProps) => {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsValidating(true);
    try {
      // Validate access code
      const { data: accessCode, error: codeError } = await supabase
        .from("access_codes")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .eq("content_id", contentId)
        .eq("is_active", true)
        .maybeSingle();

      if (codeError) throw codeError;

      if (!accessCode) {
        toast.error("Invalid access code");
        return;
      }

      // Check if code is expired
      if (accessCode.expires_at && new Date(accessCode.expires_at) < new Date()) {
        toast.error("This access code has expired");
        return;
      }

      // Check if code has reached max uses
      if (accessCode.current_uses >= accessCode.max_uses) {
        toast.error("This access code has reached its maximum uses");
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in first");
        return;
      }

      // Get or create student profile
      let student;
      const { data: existingStudent } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingStudent) {
        student = existingStudent;
      } else {
        // Auto-create student profile if missing
        const { data: newStudent, error: studentError } = await supabase
          .from("students")
          .insert([{
            user_id: user.id,
            full_name: user.email?.split('@')[0] || 'Student',
            email: user.email || '',
            phone: '',
            student_id: '',
            status: "free_learner",
          }])
          .select("id")
          .single();

        if (studentError) {
          toast.error("Failed to create profile. Please complete your profile first.");
          return;
        }
        student = newStudent;
      }

      // Create enrollment
      const { error: enrollError } = await supabase.from("enrollments").insert({
        student_id: student.id,
        content_id: contentId,
        status: "active",
        payment_amount: 0, // Already paid outside platform
      });

      if (enrollError) {
        if (enrollError.code === "23505") {
          toast.error("You are already enrolled in this course");
        } else {
          throw enrollError;
        }
        return;
      }

      // Update access code usage
      await supabase
        .from("access_codes")
        .update({ current_uses: accessCode.current_uses + 1 })
        .eq("id", accessCode.id);

      // Update content enrollment count
      const { data: content } = await supabase
        .from("content")
        .select("current_enrollment")
        .eq("id", contentId)
        .single();

      if (content) {
        await supabase
          .from("content")
          .update({ current_enrollment: (content.current_enrollment || 0) + 1 })
          .eq("id", contentId);
      }

      toast.success("Successfully enrolled! Access code validated.");
      onSuccess();
      onOpenChange(false);
      setCode("");
    } catch (error: any) {
      console.error("Error validating access code:", error);
      toast.error("Failed to validate access code. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Access Code</DialogTitle>
          <DialogDescription>
            Enter your access code to enroll in "{contentTitle}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Access Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              maxLength={12}
              className="font-mono uppercase"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Contact admin via WhatsApp to receive your access code after payment
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isValidating || !code.trim()} className="flex-1">
              {isValidating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Validate & Enroll
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
