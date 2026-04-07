import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { emailNotifications } from "@/lib/emailNotifications";
import { Mail, UserPlus } from "lucide-react";

/**
 * CTO Note:
 * We use an extended interface to support legacy callers (Passing email/name strings)
 * and new callers (Passing the full Talent object) to prevent build errors.
 */
interface TalentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talent?: any; // New: Full database object
  talentEmail?: string; // Legacy: String passed from Assessment/Lead managers
  talentName?: string; // Legacy: String passed from Assessment/Lead managers
}

export const TalentDetailDialog = ({
  open,
  onOpenChange,
  talent,
  talentEmail,
  talentName,
}: TalentDetailDialogProps) => {
  // Construct a display object regardless of how the parent component calls this dialog
  const displayTalent = talent || {
    email: talentEmail,
    full_name: talentName,
    id: null,
  };

  if (!displayTalent.email && !displayTalent.full_name) return null;

  const handlePlatformInvite = async () => {
    // Platform tracking requires a Talent ID to log the outreach
    if (!displayTalent.id) {
      toast.error("Cannot send platform invite: Missing Talent ID. Please use Direct Email.");
      return;
    }

    const toastId = toast.loading("Sending branded invite from GroUp Academy...");

    const success = await emailNotifications.talentInvite(
      displayTalent.id,
      "We've identified you as a top candidate. Join GroUp Academy to access AI career tools and exclusive job matches.",
    );

    toast.dismiss(toastId);

    if (success) {
      toast.success("Invite sent successfully!");
    } else {
      toast.error("Failed to send platform invite.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {displayTalent.full_name || "Talent Profile"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Action Bar: High-Conversion Platform Invites + Legacy Backup */}
          <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <Button
              onClick={handlePlatformInvite}
              disabled={!displayTalent.id}
              className="bg-blue-600 hover:bg-blue-700 flex gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Send Platform Invite
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                const text = `Hi ${displayTalent.full_name || ""},\n\nWe'd love to connect with you on GroUp Academy.\n\nBest regards`;
                navigator.clipboard.writeText(text);
                window.open(`mailto:${displayTalent.email}`);
              }}
              className="flex gap-2"
            >
              <Mail className="h-4 w-4" />
              Direct Email (Backup)
            </Button>
          </div>

          {/* Quick Info Grid */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                <p className="text-sm font-medium">{displayTalent.email || "Not provided"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Country</h4>
                <p className="text-sm font-medium">{displayTalent.country || "Pending Normalization"}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
