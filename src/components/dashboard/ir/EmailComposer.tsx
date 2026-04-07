import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { emailNotifications } from "@/lib/emailNotifications";
import { Send, X } from "lucide-react";

interface EmailComposerProps {
  selectedInvestor?: { email: string; full_name?: string };
  onClose: () => void;
}

export const EmailComposer = ({ selectedInvestor, onClose }: EmailComposerProps) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleSendUpdate = async () => {
    if (!selectedInvestor?.email) {
      toast.error("No recipient email found.");
      return;
    }

    const toastId = toast.loading("Queueing update via GroUp platform...");

    const success = await emailNotifications.investorUpdate(selectedInvestor.email, subject, body);

    toast.dismiss(toastId);

    if (success) {
      toast.success("Investor update enqueued successfully!");
      onClose();
    } else {
      toast.error("Failed to send investor update. Please try again.");
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-center border-bottom pb-2">
        <h3 className="text-lg font-semibold">New Investor Update</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase">Recipient</label>
        <Input value={selectedInvestor?.email || ""} disabled className="bg-slate-50" />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
        <Input
          placeholder="Update regarding Q1 growth..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase">Message</label>
        <Textarea
          placeholder="Type your message here..."
          className="min-h-[200px]"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <Button onClick={handleSendUpdate} className="w-full bg-blue-600 hover:bg-blue-700 flex gap-2">
        <Send className="h-4 w-4" />
        Send via Platform
      </Button>
    </div>
  );
};
