import { useState, useMemo, useEffect, useRef } from "react";
import { useApplicationMessages } from "@/domains/jobs";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "sonner";

// UI Primitive Matrix Registries
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, MessageSquare, ShieldAlert } from "lucide-react";
import { formatDistanceToNow, isValid } from "date-fns";
import { cn } from "@/lib/utils";

interface ApplicationMessageThreadProps {
  applicationId: string;
  actorRole: "talent" | "recruiter" | "admin";
}

/**
 * GroUp Academy: Application Correspondence Thread (V5.6.0)
 * CTO Reference: High-performance chat viewport managing application pipeline message logs.
 * Architecture: Reference-stable layout iterations eliminating inline temporal allocations.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */
export function ApplicationMessageThread({ applicationId, actorRole }: ApplicationMessageThreadProps) {
  const { messages = [], loading, send } = useApplicationMessages(applicationId);

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- SENSOR: SECURITY_IDENTITY_INGRESS_SYNC ---
  useEffect(() => {
    let isCurrent = true;

    (async () => {
      const user = await getCurrentUser();
      if (user && isCurrent) {
        setActiveUserId(user.id);
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, []);

  // Structural scroll synchronization rules anchor container alignments seamlessly
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // --- PHASE: CALCULATIONS_COMPILATION_PIPELINE ---
  // Memoize conversation records arrays to completely bypass inline runtime parser lookups
  const processedMessagesList = useMemo(() => {
    return messages.map((msg: any) => {
      const messageDateInstance = new Date(msg.created_at);

      const relativeTimeLabel = isValid(messageDateInstance)
        ? formatDistanceToNow(messageDateInstance, { addSuffix: true })
        : "Recent Ingress";

      // Architecture Guard: Match ownership with explicit user profile IDs securely.
      // Falls back defensively to role parameters if session references are compiling.
      const isMessageOwnerMine = activeUserId ? msg.sender_id === activeUserId : msg.sender_role === actorRole;

      return {
        ...msg,
        relativeTimeLabel,
        isMessageOwnerMine,
        cleanBody: String(msg.body || "").trim(),
      };
    });
  }, [messages, activeUserId, actorRole]);

  // --- HANDLER: ATOMIC_MESSAGE_DISPATCH_HANDSHAKE ---
  const handleSendMessagePipeline = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const cleanMessageText = inputText.trim();
    if (!cleanMessageText || isSending) return;

    setIsSending(true);
    try {
      // HUD: RE-ROUTING_TRANSACTION_PAYLOAD_UPSTREAM
      await send(cleanMessageText, actorRole);
      setInputText(""); // Clear state text parameters strictly *after* successful write confirmation
    } catch (err: any) {
      // Digital Workforce Anomaly Trigger: Essential for monitoring communication channel interruptions
      console.error("[Digital Workforce] ANOMALY: Application correspondence dispatch failed.", {
        applicationId,
        actorRole,
        message: err.message,
      });
      toast.error("Failed to transmit query down the network line.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[350px] bg-card/10 rounded-2xl border-2 overflow-hidden select-none text-left">
      {/* HUD: THREAD_MATRIX_VIEWPORT */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/5 scrollbar-thin scroll-smooth"
      >
        {loading ? (
          <div className="h-full flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : processedMessagesList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-16 opacity-40">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              No artifacts recorded.
            </p>
            <p className="text-[9px] font-medium text-muted-foreground/80 italic mt-0.5">
              Initialize a dialogue to commence pipeline sync.
            </p>
          </div>
        ) : (
          processedMessagesList.map((msg) => {
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full animate-in fade-in duration-200",
                  msg.isMessageOwnerMine ? "justify-end animate-slide-in-from-bottom-1" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-[20px] px-4 py-3 text-sm leading-relaxed shadow-sm break-words",
                    msg.isMessageOwnerMine
                      ? "bg-primary text-primary-foreground font-medium rounded-br-sm"
                      : "bg-card border-2 border-border/20 text-foreground font-medium rounded-bl-sm",
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.cleanBody}</p>

                  <p
                    className={cn(
                      "text-[9px] font-semibold tracking-wide font-mono mt-1.5 text-right opacity-80 tabular-nums",
                      msg.isMessageOwnerMine ? "text-primary-foreground/70" : "text-muted-foreground/60",
                    )}
                  >
                    {msg.relativeTimeLabel}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* HUD: COMPOSER_COMMAND_INGRESS_BAR */}
      <form
        onSubmit={handleSendMessagePipeline}
        className="p-3 border-t border-border/10 bg-card/60 backdrop-blur-md flex items-center gap-2 flex-shrink-0"
      >
        <Input
          value={inputText}
          disabled={loading || isSending}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isSending ? "Serializing uplink transmission packets..." : "Type your message..."}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSendMessagePipeline();
            }
          }}
          className="flex-1 h-11 rounded-xl bg-background border-2 italic font-medium px-4 focus-visible:ring-primary/20 shadow-inner disabled:opacity-50"
        />
        <Button
          size="icon"
          type="submit"
          disabled={loading || isSending || !inputText.trim()}
          className="h-11 w-11 rounded-xl shrink-0 shadow-md active:scale-[0.98] transition-all disabled:cursor-not-allowed"
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
