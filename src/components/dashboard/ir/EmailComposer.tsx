import { emailNotifications } from "@/lib/emailNotifications";
import { toast } from "sonner";

// Inside the handleSend function:
const handleSendUpdate = async () => {
  if (!selectedInvestor?.email) {
    toast.error("No recipient email found.");
    return;
  }

  const toastId = toast.loading("Sending investor update via GroUp platform...");

  const success = await emailNotifications.investorUpdate(
    selectedInvestor.email,
    emailSubject, // State from your form
    emailBody, // State from your Rich Text editor/textarea
  );

  toast.dismiss(toastId);

  if (success) {
    toast.success("Investor update sent successfully!");
    // Logic to log to 'ir_investor_interactions' table remains here
    onClose();
  } else {
    toast.error("Failed to send via platform. Falling back to email client...");
    window.open(`mailto:${selectedInvestor.email}?subject=${emailSubject}&body=${emailBody}`);
  }
};
