import { useState, useEffect, useRef, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { resolvePostAuthRoute } from "@/lib/postAuthRoute";
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
  const { accountType, isLoading: accountTypeLoading } = useAccountType();
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

  // REDIRECT GUARD: Wait for account type so company users land on /company
  useEffect(() => {
    if (authLoading || !user || accountTypeLoading) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const dest = resolvePostAuthRoute(accountType, searchParams.get("returnTo"));
        navigate(dest, { replace: true });
      }
    });
  }, [user, authLoading, accountType, accountTypeLoading, navigate, searchParams]);

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

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-xs font-medium mt-4 text-slate-500">Loading…</p>
      </div>
    );
  }

  const isPasswordAction = currentAction === "collect_password" || currentAction === "set_password";
  const isPhoneAction = currentAction === "collect_phone";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-500/10">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity" aria-label="Go home">
          <img src={theme === "dark" ? logoLight : logoDark} alt="GroUp Academy" className="h-7" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[11px] font-semibold text-emerald-700">Secure</span>
        </div>
      </header>

      {/* Agent Status */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-100 shadow-sm z-0">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
            <Sparkles className="w-6 h-6 text-blue-500" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
        </div>
        <div>
          <p className="text-lg font-bold tracking-tight text-slate-900">{agentName}</p>
          <p className="text-xs text-slate-500">Your AI guide</p>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-8 space-y-6">
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
                "max-w-[85%] sm:max-w-[70%] px-6 py-4 text-sm md:text-base leading-relaxed shadow-sm",
                msg.role === "user"
                  ? "bg-blue-500 text-white rounded-[24px] rounded-br-sm font-medium"
                  : "bg-white border border-slate-100 text-slate-700 rounded-[24px] rounded-bl-sm",
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-white border border-slate-100 rounded-[24px] rounded-bl-sm px-6 py-5 shadow-sm">
              <div className="flex gap-1.5">
                {[150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="w-2 h-2 rounded-full bg-blue-500/40 animate-bounce"
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
              className="rounded-full h-12 px-8 gap-2 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-lg group"
            >
              Continue to your dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Conversation Controller */}
      {!isComplete && (
        <div className="border-t border-slate-200 bg-white/95 backdrop-blur-2xl px-4 md:px-6 py-6 pb-8">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-4">
            {currentAction === "collect_password" && flow === "login" && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors ml-2"
              >
                Forgot password?
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
                    className="rounded-full"
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
                    className="h-14 rounded-full border-slate-200 bg-slate-50 focus-visible:ring-blue-500/20 px-6 pr-12 text-base font-medium text-slate-900 placeholder:text-slate-400"
                    autoComplete={currentAction === "collect_email" ? "email" : "off"}
                  />
                  {isPasswordAction && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  )}
                </div>
              )}

              <Button
                type="submit"
                size="icon"
                disabled={isLoading}
                className="h-14 w-14 rounded-full bg-blue-500 hover:bg-blue-600 shrink-0 shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </Button>
            </div>

            {currentAction === "set_password" && passwordValue.length > 0 && (
              <div className="px-4 animate-in slide-in-from-top-1">
                <div className="flex gap-1.5 h-1.5">
                  {[1, 2, 3, 4].map((i) => {
                    const str = getPasswordStrength(passwordValue);
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex-1 rounded-full transition-all duration-500",
                          i <= str.level ? str.color : "bg-slate-200",
                        )}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 text-right mt-2">
                  Strength: <span className="font-semibold text-slate-900">{getPasswordStrength(passwordValue).label}</span>
                </p>
              </div>
            )}
          </form>

          <div className="mt-6 text-center space-y-2">
            <button
              onClick={() => navigate(`/auth/classic?${searchParams.toString()}`)}
              className="block mx-auto text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
            >
              Use email & password instead
            </button>
            <button
              onClick={() => navigate("/for-companies")}
              className="block mx-auto text-xs font-medium text-slate-400 hover:text-blue-600 transition-colors"
            >
              Hiring? Apply for company access →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function getPasswordStrength(password: string) {
  if (password.length < 8) return { level: 1, label: "Too short", color: "bg-rose-500" };
  let s = 1;
  if (password.length >= 12) s++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) s++;
  if (/[^A-Za-z0-9]/.test(password)) s++;

  const maps = [
    { level: 1, label: "Weak", color: "bg-rose-500" },
    { level: 2, label: "Fair", color: "bg-amber-500" },
    { level: 3, label: "Good", color: "bg-blue-500" },
    { level: 4, label: "Strong", color: "bg-emerald-500" },
  ];
  return maps[s - 1];
}

export default AuthChat;
