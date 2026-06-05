import { useEffect, useState, useCallback } from "react";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import {
  listApplicationMessages,
  insertApplicationMessage,
  markApplicationMessagesRead,
  subscribeToApplicationMessages,
  type ApplicationMessageRow,
} from "@/domains/jobs/repo/jobsRepo";


/**
 * GroUp Academy: Application Messaging Orchestrator (V2.2.0)
 * Phase 10a: DB access goes through jobsRepo. Realtime channel stays
 * inline because it's a subscription, not a query.
 */

export type ApplicationMessage = ApplicationMessageRow;

export function useApplicationMessages(applicationId: string | undefined) {
  const [messages, setMessages] = useState<ApplicationMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      const rows = await listApplicationMessages(applicationId);
      setMessages(rows);
    } catch (err) {
      console.error("[Digital Workforce] FAULT: Message sync failed.", err);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime subscription (delegated to repo channel helper).
  useEffect(() => {
    if (!applicationId) return;
    return subscribeToApplicationMessages(applicationId, (next) => {
      setMessages((prev) => (prev.find((m) => m.id === next.id) ? prev : [...prev, next]));
    });
  }, [applicationId]);


  const send = useCallback(
    async (body: string, senderRole: "talent" | "recruiter" | "admin") => {
      if (!applicationId || !body.trim()) return;
      try {
        const user = await getCurrentUser();
        if (!user) throw new Error("AUTH_SYNC_REQUIRED");
        await insertApplicationMessage({
          applicationId,
          senderId: user.id,
          senderRole,
          body: body.trim(),
        });
      } catch (err) {
        console.error("[Digital Workforce] ANOMALY: Messaging handshake failed.", err);
        toast.error("Communication Sync Failed", {
          description: "Reporting anomaly to Admin Chat for intervention.",
        });
      }
    },
    [applicationId],
  );

  const markRead = useCallback(async () => {
    if (!applicationId) return;
    try {
      const user = await getCurrentUser();
      if (!user) return;
      await markApplicationMessagesRead({
        applicationId,
        currentUserId: user.id,
      });
    } catch (err) {
      console.warn("[Digital Workforce] Non-critical: Read receipt sync delayed.", err);
    }
  }, [applicationId]);

  return { messages, loading, send, markRead, reload: load };
}

