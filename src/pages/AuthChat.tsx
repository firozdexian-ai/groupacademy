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

  // Redirect if already authenticated — validate session first to avoid stale-token loops
  useEffect(() => {
    if (!authLoading && user) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          const returnTo = searchParams.get("returnTo");
          const safeReturn = returnTo && returnTo !== "/auth" && returnTo !== "/" ? returnTo : "/app/feed";
          navigate(safeReturn, { replace: true });
        }
      });
    }
  }, [user, authLoading, navigate, searchParams]);

  // Initialize chat
  useEffect(() => {
    if (!initialized && !authLoading && !user) {
      setInitialized(true);
      initialize();
    }
  }, [initialized, authLoading, user, initialize]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentAction, isLoading]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (currentAction === "collect_password" || currentAction === "set_password") {
      if (passwordValue.length < 8 && currentAction === "set_password") {
        return; // Min 8 chars for new passwords
      }
      handlePasswordSubmit(passwordValue);
      setPasswordValue("");
    } else if (currentAction === "collect_phone") {
      const fullPhone = phoneValue;
      if (fullPhone.length < 7) return;
      handleUserInput(fullPhone);
      setPhoneValue("");
    } else {
      if (!inputValue.trim()) return;
      handleUserInput(inputValue);
      setInputValue("");
    }
  };

  const handleEnterPlatform = () => {
    const returnTo = searchParams.get("returnTo");
    const safeReturn = returnTo && returnTo !== "/auth" ? returnTo : "/app/feed";
    navigate(safeReturn, { replace: true });
  };

  const getInputPlaceholder = (action: AuthAction): string => {
    switch (action) {
      case "collect_email": return "Enter your email address...";
      case "collect_name": return "Enter your full name...";
      case "collect_password": return "Enter your password...";
      case "set_password": return "Create a password (min 8 characters)...";
      case "collect_phone": return "Enter your phone number...";
      case "verify_human": return "Type your answer...";
      default: return "Type a message...";
    }
  };

  const getInputType = (action: AuthAction): string => {
    switch (action) {
      case "collect_email": return "email";
      case "collect_password":
      case "set_password": return "password";
      default: return "text";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPasswordAction = currentAction === "collect_password" || currentAction === "set_password";
  const isPhoneAction = currentAction === "collect_phone";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <img
            src={theme === "dark" ? logoLight : logoDark}
            alt="GroUp Academy"
            className="h-8"
          />
        </button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline">Secure & Encrypted</span>
        </div>
      </header>

      {/* Agent Info Bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border-b border-border">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{agentName}</p>
          <p className="text-xs text-muted-foreground">GroUp Academy Gatekeeper • Online</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Complete State — Enter Platform Button */}
        {isComplete && (
          <div className="flex justify-center py-4">
            <Button
              size="lg"
              onClick={handleEnterPlatform}
              className="gap-2 px-8 text-base animate-in fade-in zoom-in duration-500"
            >
              Enter the Platform
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!isComplete && (
        <div className="border-t border-border bg-card px-4 py-3 safe-area-bottom">
          {/* Forgot password hint during login */}
          {currentAction === "collect_password" && flow === "login" && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-primary hover:underline mb-2 block"
            >
              Forgot your password?
            </button>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            {isPhoneAction ? (
              <div className="flex-1">
                <PhoneInput
                  value={phoneValue}
                  countryCode={collectedData.countryCode}
                  onValueChange={(phone) => {
                    setPhoneValue(phone);
                  }}
                  onCountryCodeChange={(countryCode, country) => {
                    updatePhoneData(phoneValue, countryCode, country);
                  }}
                  placeholder="1712345678"
                />
              </div>
            ) : isPasswordAction ? (
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  type={showPassword ? "text" : "password"}
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  placeholder={getInputPlaceholder(currentAction)}
                  disabled={isLoading}
                  autoComplete={currentAction === "set_password" ? "new-password" : "current-password"}
                  minLength={currentAction === "set_password" ? 8 : undefined}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <Input
                ref={inputRef}
                type={getInputType(currentAction)}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={getInputPlaceholder(currentAction)}
                disabled={isLoading}
                autoComplete={currentAction === "collect_email" ? "email" : "off"}
                className="flex-1"
              />
            )}

            <Button
              type="submit"
              size="icon"
              disabled={isLoading}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>

          {/* Classic auth fallback */}
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => {
                const returnTo = searchParams.get("returnTo");
                navigate(`/auth/classic${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`);
              }}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Trouble logging in? Use classic login
            </button>
          </div>

          {/* Password strength for new passwords */}
          {currentAction === "set_password" && passwordValue.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 h-1">
                {[1, 2, 3, 4].map((level) => {
                  const strength = getPasswordStrength(passwordValue);
                  return (
                    <div
                      key={level}
                      className={`flex-1 rounded-full transition-colors ${
                        level <= strength.level ? strength.color : "bg-muted"
                      }`}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground text-right mt-1">
                {getPasswordStrength(passwordValue).label}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function getPasswordStrength(password: string) {
  if (password.length < 8) return { level: 1, label: "Weak", color: "bg-destructive" };
  let s = 1;
  if (password.length >= 12) s++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++;
  if (/\d/.test(password)) s++;
  if (/[^a-zA-Z0-9]/.test(password)) s++;
  if (s <= 2) return { level: 2, label: "Fair", color: "bg-warning" };
  if (s <= 3) return { level: 3, label: "Good", color: "bg-secondary" };
  return { level: 4, label: "Strong", color: "bg-accent" };
}

export default AuthChat;
