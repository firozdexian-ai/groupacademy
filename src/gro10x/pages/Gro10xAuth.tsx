import { useEffect, useRef, useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Send, Loader2, Eye, EyeOff, Paperclip, ArrowRight, Sparkles } from "lucide-react";
import { useGro10xAuthChat, type RiyaAction } from "../hooks/useGro10xAuthChat";
import { GRO10X_BG, GRO10X_TEXT, PRO_GOALS, type ProGoalKey } from "../lib/tokens";
import { cn } from "@/lib/utils";

/**
 * Gro10x conversational auth (Riya).
 * Symmetric to the talent AuthChat but with B2B-specific gates:
 * CV upload, role+company confirm, multi-select business goals.
 */
export default function Gro10xAuth() {
  const navigate = useNavigate();
  const {
    messages,
    currentAction,
    isLoading,
    isComplete,
    data,
    initialize,
    handleUserInput,
    handlePasswordSubmit,
    uploadAndParseCV,
    skipCV,
    submitGoals,
    agentName,
  } = useGro10xAuthChat();

  const [text, setText] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [goals, setGoals] = useState<ProGoalKey[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) setTimeout(() => inputRef.current?.focus(), 80);
  }, [currentAction, isLoading]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (currentAction === "set_password") {
      handlePasswordSubmit(password);
      setPassword("");
      return;
    }
    if (!text.trim()) return;
    handleUserInput(text);
    setText("");
  };

  const placeholder = (a: RiyaAction): string =>
    ({
      collect_email: "name@yourcompany.com",
      collect_name: "Your full name",
      confirm_role_company: "e.g. Head of Sales at Acme Corp",
      collect_country: "Country (e.g. United Kingdom)",
      collect_phone: `Mobile number (${data.countryCode})`,
      verify_human: "Type your answer",
      set_password: "Min 8 characters",
    } as Record<string, string>)[a] || "Type a message…";

  const isPasswordStep = currentAction === "set_password";
  const isCVStep = currentAction === "collect_cv";
  const isGoalsStep = currentAction === "collect_goals";

  return (
    <div className={cn(GRO10X_BG, GRO10X_TEXT, "min-h-[100dvh] flex flex-col")}>
      <header className="px-5 pt-6 pb-3 flex items-center justify-between max-w-md mx-auto w-full">
        <button onClick={() => navigate("/gro10x")} className="flex items-center gap-2">
          <img src="/gro10x/icon-192.png" alt="" className="h-7 w-7 rounded-lg" />
          <span className="font-semibold tracking-tight">Gro10x</span>
        </button>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#33E1E4]/10 border border-[#33E1E4]/20">
          <Sparkles className="w-3 h-3 text-[#33E1E4]" />
          <span className="text-[10px] font-semibold text-[#33E1E4]">{agentName}</span>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 max-w-md mx-auto w-full space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex animate-in fade-in slide-in-from-bottom-1 duration-300",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line",
                m.role === "user"
                  ? "bg-[#33E1E4] text-[#06121A] rounded-2xl rounded-br-sm font-medium"
                  : "bg-[#0F172A] border border-white/5 rounded-2xl rounded-bl-sm",
              )}
              dangerouslySetInnerHTML={{
                __html: m.content
                  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\n/g, "<br/>"),
              }}
            />
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#0F172A] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 rounded-full bg-[#33E1E4]/60 animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CV step controls */}
        {isCVStep && !isLoading && (
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#33E1E4] text-[#06121A] text-xs font-semibold"
            >
              <Paperclip className="w-3.5 h-3.5" /> Upload CV
            </button>
            <button
              type="button"
              onClick={skipCV}
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300"
            >
              Skip
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadAndParseCV(f);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {/* Goals chips */}
        {isGoalsStep && !isLoading && (
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap gap-2">
              {PRO_GOALS.map((g) => {
                const on = goals.includes(g.key);
                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() =>
                      setGoals((cur) =>
                        cur.includes(g.key) ? cur.filter((k) => k !== g.key) : [...cur, g.key],
                      )
                    }
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                      on
                        ? "bg-[#33E1E4] text-[#06121A] border-[#33E1E4]"
                        : "bg-white/5 border-white/10 text-slate-300",
                    )}
                  >
                    <span className="mr-1">{g.emoji}</span>
                    {g.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={goals.length === 0}
              onClick={() => submitGoals(goals)}
              className="w-full mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#33E1E4] disabled:opacity-40 text-[#06121A] font-semibold py-2.5 text-sm"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {isComplete && (
          <div className="pt-4">
            <button
              onClick={() => navigate("/gro10x/welcome")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#33E1E4] text-[#06121A] font-semibold py-3"
            >
              Enter your workspace <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div ref={endRef} />
      </main>

      {/* Input bar — hidden during chip-only steps */}
      {!isComplete && !isCVStep && !isGoalsStep && (
        <form
          onSubmit={onSubmit}
          className="border-t border-white/5 bg-[#0B1220]/95 backdrop-blur px-4 py-4 pb-[calc(16px+env(safe-area-inset-bottom))]"
        >
          <div className="max-w-md mx-auto flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type={isPasswordStep && !showPwd ? "password" : "text"}
                value={isPasswordStep ? password : text}
                onChange={(e) =>
                  isPasswordStep ? setPassword(e.target.value) : setText(e.target.value)
                }
                placeholder={placeholder(currentAction)}
                autoComplete={
                  currentAction === "collect_email"
                    ? "email"
                    : isPasswordStep
                    ? "new-password"
                    : "off"
                }
                className="w-full h-12 rounded-full bg-[#0F172A] border border-white/10 px-5 pr-12 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#33E1E4]/50"
              />
              {isPasswordStep && (
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="h-12 w-12 rounded-full bg-[#33E1E4] disabled:opacity-50 grid place-items-center shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#06121A]" />
              ) : (
                <Send className="w-4 h-4 text-[#06121A]" />
              )}
            </button>
          </div>
          <p className="mt-3 text-center text-[11px] text-slate-500">
            Already on Gro10x?{" "}
            <Link to="/auth" className="text-[#33E1E4] hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
