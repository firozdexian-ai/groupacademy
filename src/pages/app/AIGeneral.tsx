import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Sparkles, ArrowLeft, Send, Loader2, Bot, Info, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAIGeneralChat } from "@/hooks/useAIGeneralChat";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

/**
 * Platform Logic: Neural Concierge Interface
 * High-fidelity general-purpose AI chat orchestration.
 * 2026 Standard: Fixed-viewport containment with intelligent route-interception.
 */
export default function AIGeneral() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || undefined;

  const { messages, isStreaming, isLoading, sendMessage } = useAIGeneralChat(initialQuery);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // CTO Logic: Hardware-accelerated scroll anchoring
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, isStreaming]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const msg = input;
    setInput("");
    await sendMessage(msg);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-145px)] md:h-[calc(100vh-80px)] flex flex-col bg-background overflow-hidden md:border-x border-border/40 shadow-2xl">
      {/* Header: Identity List */}
      <header className="flex items-center justify-between py-4 px-6 border-b bg-card/30 backdrop-blur-xl shrink-0 z-20">
        <div className="flex items-center gap-4 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all active:scale-95"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-lg animate-pulse" />
            <Avatar className="h-12 w-12 rounded-2xl border-2 border-emerald-500/20 shadow-xl">
              <AvatarFallback className="bg-gradient-to-tr from-emerald-600 to-teal-700 rounded-[inherit]">
                <Bot className="h-6 w-6 text-white" />
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-background rounded-full shadow-lg" />
          </div>

          <div className="min-w-0">
            <h1 className="font-black text-lg tracking-tighter leading-none mb-1 uppercase">AI Concierge</h1>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              <span className="flex items-center gap-1 text-emerald-500">
                <div className="h-1 w-1 rounded-full bg-current animate-ping" />
                Active uplink
              </span>
              <span className="opacity-20">•</span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Unlimited
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl opacity-30 hover:opacity-100 transition-opacity"
        >
          <Info className="h-4 w-4" />
        </Button>
      </header>

      {/* Dynamic Viewport: Neural Stream */}
      <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8 no-scrollbar scroll-smooth">
        {isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20 stroke-[1.5px]" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
              Initializing AI Match...
            </p>
          </div>
        )}

        {/* Empty State: System Ready */}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
              <div className="relative h-24 w-24 rounded-[40px] bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-2xl rotate-3">
                <Sparkles className="h-12 w-12 text-white animate-pulse" />
              </div>
            </div>
            <h2 className="text-3xl font-black tracking-tighter mb-3 uppercase">Matrix Operational</h2>
            <p className="text-[11px] font-bold text-muted-foreground/60 max-w-xs mx-auto uppercase tracking-widest leading-relaxed italic">
              Platform architect standing by. Interrogate for career tracks, credit logic, or registry status.
            </p>
          </div>
        )}

        {/* Message Threading */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-4 animate-in slide-in-from-bottom-3 duration-500",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            {msg.role === "assistant" && (
              <Avatar className="h-10 w-10 rounded-xl shrink-0 mt-1 shadow-sm border-2 border-border/10">
                <AvatarFallback className="bg-muted rounded-[inherit]">
                  <Bot className="h-5 w-5 text-primary" />
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={cn(
                "max-w-[85%] rounded-[28px] px-6 py-4 shadow-xl transition-all duration-500",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none font-bold shadow-primary/20"
                  : "bg-card text-foreground rounded-tl-none border border-border/40 backdrop-blur-sm",
              )}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-strong:font-black prose-a:text-primary prose-a:font-black prose-a:no-underline hover:prose-a:underline">
                  <ReactMarkdown
                    components={{
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                          target={href?.startsWith("http") ? "_blank" : undefined}
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
                <p className="whitespace-pre-wrap leading-relaxed tracking-tight">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-4 justify-start">
            <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center border border-border/20">
              <Loader2 className="h-5 w-5 animate-spin text-primary opacity-40" />
            </div>
            <div className="bg-muted/30 backdrop-blur-sm h-14 w-32 rounded-[28px] rounded-tl-none animate-pulse" />
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </main>

      {/* Input Console: Logic Trigger */}
      <footer className="shrink-0 border-t border-border/40 bg-card/50 backdrop-blur-2xl p-6">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-3">
          <Input
            placeholder="Command Concierge Matrix..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming || isLoading}
            className={cn(
              "flex-1 h-14 bg-background/50 border-2 border-border/40 rounded-2xl px-6",
              "text-sm font-bold tracking-tight focus-visible:ring-primary/10 focus-visible:border-primary/40 transition-all shadow-inner",
            )}
          />
          <Button
            type="submit"
            size="icon"
            className="h-14 w-14 rounded-2xl bg-primary shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95"
            disabled={!input.trim() || isStreaming || isLoading}
          >
            <Send className="h-6 w-6" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
