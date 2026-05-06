import { useState } from "react";
import { useApplicationMessages } from "@/hooks/useApplicationMessages";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  applicationId: string;
  actorRole: "talent" | "recruiter" | "admin";
}

export function ApplicationMessageThread({ applicationId, actorRole }: Props) {
  const { messages, loading, send } = useApplicationMessages(applicationId);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await send(text, actorRole);
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[300px]">
      <div className="flex-1 overflow-y-auto space-y-2 px-1 py-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_role === actorRole;
            return (
              <div
                key={m.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-1",
                      mine ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="flex items-center gap-2 border-t pt-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          disabled={sending}
        />
        <Button size="icon" onClick={handleSend} disabled={sending || !text.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
