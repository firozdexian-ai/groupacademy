import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Sparkles, ArrowLeft, Send, Loader2, Bot, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAIGeneralChat } from "@/hooks/useAIGeneralChat";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export default function AIGeneral() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || undefined;

  const { messages, isStreaming, isLoading, sendMessage } = useAIGeneralChat(initialQuery);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // CTO Fix: Intelligent scroll anchoring
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
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)] flex flex-col bg-background overflow-hidden md:border-x">
      {/* Header - Strategically Fixed */}
      <header className="flex items-center justify-between py-3 px-4 border-b bg-card/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-primary/5"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-primary/10">
              <AvatarFallback className="bg-gradient-to-tr from-blue-600 to-indigo-600">
                <Bot className="h-5 w-5 text-white" />
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 border-2 border-background rounded-full" />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-sm tracking-tight leading-none mb-1 uppercase">AI Concierge</h1>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <span className="text-emerald-500">Online</span>
              <span className="opacity-20">•</span>
              <span>Unlimited Access</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full opacity-30">
          <Info className="h-4 w-4" />
        </Button>
      </header>

      {/* Dynamic Messages Viewport */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 no-scrollbar">
        {isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
              Initializing Neural Link...
            </p>
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-1000">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
              <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                <Sparkles className="h-10 w-10 text-white animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-black tracking-tighter mb-2">Systems Operational</h2>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto font-medium leading-relaxed">
              I am your platform architect. Ask me about career tracks, recruitment status, or how to optimize your
              credits.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 animate-in slide-in-from-bottom-2 duration-300",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            {msg.role === "assistant" && (
              <Avatar className="h-8 w-8 shrink-0 mt-1 shadow-sm border">
                <AvatarFallback className="bg-muted">
                  <Bot className="h-4 w-4 text-primary" />
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none font-medium"
                  : "bg-card text-foreground rounded-tl-none border border-border/50",
              )}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-a:text-primary prose-a:font-black prose-a:no-underline hover:prose-a:underline">
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
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3 justify-start animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
            <div className="bg-muted h-10 w-24 rounded-2xl rounded-tl-none" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input Console */}
      <footer className="shrink-0 border-t bg-card/30 backdrop-blur-xl p-4">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto flex gap-2">
          <Input
            placeholder="Command AI Concierge..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming || isLoading}
            className="flex-1 h-12 bg-background border-border/60 rounded-2xl focus-visible:ring-primary/20 shadow-inner px-5 font-medium"
          />
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 rounded-2xl shadow-lg transition-all active:scale-95"
            disabled={!input.trim() || isStreaming || isLoading}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
