import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { TIMEOUTS } from "@/lib/timeoutConfig";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatPanelProps {
  professionLineId?: string;
  contextType?: "general" | "course" | "module";
  contextId?: string;
  instructorName?: string;
  placeholder?: string;
  className?: string;
  onMessageSent?: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-instructor-chat`;

export function AIChatPanel({
  professionLineId,
  contextType = "general",
  contextId,
  instructorName = "AI Instructor",
  placeholder = "Ask me anything about your career or learning...",
  className = "",
  onMessageSent,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const streamChat = async (userMessages: Message[]) => {
    // Create abort controller for timeout
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, TIMEOUTS.AI_GENERATION);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: userMessages,
          professionLineId,
          contextType,
          contextId,
        }),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      if (resp.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (resp.status === 402) {
        throw new Error("AI service quota exceeded. Please contact support.");
      }
      if (!resp.ok || !resp.body) {
        throw new Error("Failed to get AI response");
      }

      return resp.body;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === "AbortError") {
        throw new Error("Response took too long. Please try again.");
      }
      throw error;
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setLastError(null);
    
    // Notify parent that a message was sent
    onMessageSent?.();

    let assistantContent = "";

    try {
      const stream = await streamChat(newMessages);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return updated;
              });
            }
          } catch {
            // Incomplete JSON, continue buffering
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to get response";
      setLastError(errorMessage);
      toast.error(errorMessage);
      // Remove the empty assistant message if error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRetry = () => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
      if (lastUserMessage) {
        // Remove last user message and retry
        const messagesWithoutLast = messages.slice(0, -1);
        setMessages(messagesWithoutLast);
        setInput(lastUserMessage.content);
        setLastError(null);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-card rounded-lg border ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
        <div className="relative">
          <Avatar className="h-10 w-10 bg-primary/10">
            <AvatarFallback className="bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{instructorName}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> AI Instructor • Online
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Bot className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h4 className="font-medium text-muted-foreground mb-2">
              Chat with {instructorName}
            </h4>
            <p className="text-sm text-muted-foreground/70 max-w-[250px]">
              {placeholder}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-secondary">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            {lastError && !isLoading && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry last message
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}