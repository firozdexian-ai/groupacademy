import { useSearchParams, useNavigate } from "react-router-dom";
import { Sparkles, ArrowLeft, Send, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAIGeneralChat } from "@/hooks/useAIGeneralChat";
import ReactMarkdown from "react-markdown";

export default function AIGeneral() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || undefined;

  const { messages, isStreaming, isLoading, sendMessage } = useAIGeneralChat(initialQuery);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const msg = input;
    setInput("");
    await sendMessage(msg);
  };

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 px-1 border-b border-border shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/app/feed")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
          <AvatarFallback className="bg-transparent">
            <Sparkles className="h-4 w-4 text-blue-600" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="font-semibold text-sm">AI General</h1>
          <p className="text-xs text-muted-foreground">Your platform guide • Free</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 px-1 space-y-4">
        {isLoading && messages.length === 0 && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-blue-600" />
            </div>
            <h2 className="font-semibold text-lg">Hi! I'm AI General 👋</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Ask me anything about the platform — jobs, courses, AI agents, gigs, study abroad, and more. I'll guide you to the right place!
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <Avatar className="h-7 w-7 shrink-0 mt-1 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                <AvatarFallback className="bg-transparent">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&_a]:text-primary [&_a]:underline [&_a]:font-medium">
                  <ReactMarkdown
                    components={{
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          onClick={(e) => {
                            if (href?.startsWith("/")) {
                              e.preventDefault();
                              navigate(href);
                            }
                          }}
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {msg.content || "..."}
                  </ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-2">
            <Avatar className="h-7 w-7 shrink-0 mt-1 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <AvatarFallback className="bg-transparent">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="shrink-0 border-t border-border p-3 flex gap-2">
        <Input
          placeholder="Ask AI General anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming || isLoading}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!input.trim() || isStreaming || isLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
