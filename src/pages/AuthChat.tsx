import { useState, useEffect, useRef, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAuthChat, AuthAction } from "@/hooks/useAuthChat";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Eye, EyeOff, Loader2, Send, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";
import { cn } from "@/lib/utils";

const AuthChat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const {
    messages,
    currentAction,
    flow,
    isLoading,
    isComplete,
    collectedData,
    initialize,
    handleUserInput,
    handlePasswordSubmit,
    handleForgotPassword,
    updatePhoneData,
    agentName,
  } = useAuthChat();

  const [inputValue, setInputValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // REDIRECT GUARD: Validate fresh session to prevent loops
  useEffect(() => {
    if (!authLoading && user) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          const returnTo = searchParams.get("returnTo");
          const safeReturn = returnTo && !returnTo.includes("/auth") ? returnTo : "/app/feed";
          navigate(safeReturn, { replace: true });
        }
      });
    }
  }, [user, authLoading, navigate, searchParams]);

  useEffect(() => {
    if (!initialized && !authLoading && !user) {
      setInitialized(true);
      initialize();
    }
  }, [initialized, authLoading, user, initialize]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentAction, isLoading]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (currentAction === "collect_password" || currentAction === "set_password") {
      if (passwordValue.length < 8 && currentAction === "set_password") return;
      handlePasswordSubmit(passwordValue);
      setPasswordValue("");
    } else if (currentAction === "collect_phone") {
      if (phoneValue.length < 7) return;
      handleUserInput(phoneValue);
      setPhoneValue("");
    } else {
      if (!inputValue.trim()) return;
      handleUserInput(inputValue);
      setInputValue("");
    }
  };

  const getInputPlaceholder = (action: AuthAction): string => {
    const placeholders: Record<string, string> = {
      collect_email: "name@example.com",
      collect_name: "How should we call you?",
      collect_password: "Enter your secure password",
      set_password: "Create a password (min 8 chars)",
      collect_phone: "Primary contact number",
      verify_human: "Type your answer here...",
    };
    return placeholders[action] || "Type a message...";
  };

  if (authLoading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-4 text-muted-foreground">
          Authenticating Node
        </p>
      </div>
    );

  const isPasswordAction = currentAction === "collect_password" || currentAction === "set_password";
  const isPhoneAction = currentAction === "collect_phone";

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
          <img src={theme === "dark" ? logoLight : logoDark} alt="GroUp Academy" className="h-7" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">AES-256 Verified</span>
        </div>
      </header>

      {/* Agent Status */}
      <div className="flex items-center gap-3 px-6 py-4 bg-primary/[0.02] border-b border-border/40">
        <div className="relative">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-background rounded-full" />
        </div>
        <div>
          <p className="text-sm font-black tracking-tight text-foreground uppercase">{agentName}</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Platform Gatekeeper</p>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex animate-in fade-in slide-in-from-bottom-2 duration-500",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] sm:max-w-[70%] rounded-[24px] px-5 py-3.5 text-sm leading-relaxed shadow-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border/40 text-foreground rounded-bl-md",
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border/40 rounded-[20px] rounded-bl-md px-5 py-4">
              <div className="flex gap-1.5">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="flex justify-center py-8 animate-in zoom-in-95 fade-in duration-700">
            <Button
              size="lg"
              onClick={() => navigate(searchParams.get("returnTo") || "/app/feed")}
              className="rounded-2xl h-14 px-10 gap-3 text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/30 group"
            >
              Initialize Platform Access
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Conversation Controller */}
      {!isComplete && (
        <div className="border-t border-border/40 bg-card/80 backdrop-blur-2xl px-6 py-6 pb-10">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-4">
            {currentAction === "collect_password" && flow === "login" && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors ml-1"
              >
                Recovery Request?
              </button>
            )}

            <div className="flex items-end gap-3">
              {isPhoneAction ? (
                <div className="flex-1">
                  <PhoneInput
                    value={phoneValue}
                    countryCode={collectedData.countryCode}
                    onValueChange={setPhoneValue}
                    onCountryCodeChange={(cc, c) => updatePhoneData(phoneValue, cc, c)}
                  />
                </div>
              ) : (
                <div className="flex-1 relative group">
                  <Input
                    ref={inputRef}
                    type={isPasswordAction && !showPassword ? "password" : "text"}
                    value={isPasswordAction ? passwordValue : inputValue}
                    onChange={(e) =>
                      isPasswordAction ? setPasswordValue(e.target.value) : setInputValue(e.target.value)
                    }
                    placeholder={getInputPlaceholder(currentAction)}
                    className="h-14 rounded-2xl border-border/40 bg-background/50 focus-visible:ring-primary/20 pr-12 text-sm font-medium"
                    autoComplete={currentAction === "collect_email" ? "email" : "off"}
                  />
                  {isPasswordAction && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              )}

              <Button
                type="submit"
                size="icon"
                disabled={isLoading}
                className="h-14 w-14 rounded-2xl shrink-0 shadow-lg shadow-primary/20"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>

            {currentAction === "set_password" && passwordValue.length > 0 && (
              <div className="px-1 animate-in slide-in-from-top-1">
                <div className="flex gap-1.5 h-1">
                  {[1, 2, 3, 4].map((i) => {
                    const str = getPasswordStrength(passwordValue);
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex-1 rounded-full transition-all duration-500",
                          i <= str.level ? str.color : "bg-muted",
                        )}
                      />
                    );
                  })}
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right mt-2">
                  Entropy Level: <span className="text-foreground">{getPasswordStrength(passwordValue).label}</span>
                </p>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate(`/auth/classic?${searchParams.toString()}`)}
              className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
            >
              Legacy Authentication Fallback
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function getPasswordStrength(password: string) {
  if (password.length < 8) return { level: 1, label: "Insufficient", color: "bg-destructive" };
  let s = 1;
  if (password.length >= 12) s++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) s++;
  if (/[^A-Za-z0-9]/.test(password)) s++;
  const maps = [
    { level: 1, label: "Weak", color: "bg-destructive" },
    { level: 2, label: "Vulnerable", color: "bg-warning" },
    { level: 3, label: "Secure", color: "bg-secondary" },
    { level: 4, label: "High Entropy", color: "bg-accent" },
  ];
  return maps[s - 1];
}

export default AuthChat;
