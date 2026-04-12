import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { emailNotifications } from "@/lib/emailNotifications";
import { Mail, UserPlus, Phone, Globe, Briefcase, Calendar, CheckCircle2, FileText, ExternalLink } from "lucide-react";
import { getCountryFlag } from "@/lib/constants/countries";

interface TalentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talent?: any;
  talentEmail?: string;
  talentName?: string;
}

export const TalentDetailDialog = ({
  open,
  onOpenChange,
  talent,
  talentEmail,
  talentName,
}: TalentDetailDialogProps) => {
  const displayTalent = talent || {
    email: talentEmail,
    full_name: talentName,
    id: null,
  };

  if (!displayTalent.email && !displayTalent.full_name) return null;

  const handlePlatformInvite = async () => {
    if (!displayTalent.id) {
      toast.error("Cannot send platform invite: Missing Talent ID.");
      return;
    }

    const toastId = toast.loading("Sending branded invite...");

    const success = await emailNotifications.talentInvite(
      displayTalent.id,
      "Join GroUp Academy to access AI career tools and exclusive job matches.",
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
          <div className="flex justify-between items-start pr-8">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {displayTalent.full_name || "Talent Profile"}
                {displayTalent.user_id ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">Registered</Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                    Uploaded
                  </Badge>
                )}
              </DialogTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Added on {displayTalent.created_at ? new Date(displayTalent.created_at).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <Button
              onClick={handlePlatformInvite}
              disabled={!displayTalent.id || !!displayTalent.user_id}
              className="bg-blue-600 hover:bg-blue-700 flex gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {displayTalent.user_id ? "Already Registered" : "Send Platform Invite"}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                const text = `Hi ${displayTalent.full_name || ""}, We'd love to connect on GroUp Academy.`;
                navigator.clipboard.writeText(text);
                window.open(`mailto:${displayTalent.email}`);
              }}
              className="flex gap-2"
            >
              <Mail className="h-4 w-4" />
              Direct Email
            </Button>

            {displayTalent.phone && (
              <Button
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => window.open(`https://wa.me/${displayTalent.phone.replace(/\D/g, "")}`, "_blank")}
              >
                <Phone className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Contact Details
              </h3>
              <div className="grid gap-3">
                <div className="bg-muted/30 p-3 rounded-md">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Email Address</p>
                  <p className="text-sm font-medium">{displayTalent.email || "Not provided"}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-md">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Phone Number</p>
                  <p className="text-sm font-medium">{displayTalent.phone || "Not provided"}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-md">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Location</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg">{getCountryFlag(displayTalent.country)}</span>
                    <p className="text-sm font-medium">{displayTalent.country || "Pending"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Professional Profile
              </h3>
              <div className="grid gap-3">
                <div className="bg-muted/30 p-3 rounded-md">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Profession</p>
                  <p className="text-sm font-medium">{displayTalent.custom_profession || "General Talent"}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-md">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Assets</p>
                  <div className="flex gap-2 mt-2">
                    {displayTalent.cv_url ? (
                      <Badge
                        variant="secondary"
                        className="cursor-pointer gap-1"
                        onClick={() => window.open(displayTalent.cv_url)}
                      >
                        <FileText className="h-3 w-3" /> CV Available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground italic border-dashed">
                        No CV Uploaded
                      </Badge>
                    )}
                    {displayTalent.linkedin_url && (
                      <Badge
                        variant="secondary"
                        className="cursor-pointer gap-1"
                        onClick={() => window.open(displayTalent.linkedin_url)}
                      >
                        <ExternalLink className="h-3 w-3" /> LinkedIn
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Platform Insights
            </h3>
            <div className="bg-slate-50 border rounded-lg p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{displayTalent.services_used?.length || 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Services</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{displayTalent.credit_balance || 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Credits</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{displayTalent.total_applications || 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Job Apps</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{displayTalent.onboarding_completed_at ? "YES" : "NO"}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Onboarded</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
