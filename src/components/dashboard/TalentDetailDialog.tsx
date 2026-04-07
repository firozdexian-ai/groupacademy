import { emailNotifications } from "@/lib/emailNotifications";
import { toast } from "sonner"; // [cite: 11, 36]

// Inside the component:
const handlePlatformInvite = async () => {
  const success = await emailNotifications.talentInvite(
    talent.id,
    "Welcome to the platform! We'd love for you to complete your profile.",
  );

  if (success) {
    toast.success("Invite sent via platform!"); // [cite: 11]
    // Optionally log outreach to the contact_outreach table [cite: 452]
  } else {
    toast.error("Failed to send invite.");
  }
};
