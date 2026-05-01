import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { COUNTRIES_WITH_PHONE } from "@/lib/constants/countries";
import { PRO_GOALS, type ProGoalKey } from "../lib/tokens";

/**
 * Gro10x — Riya conversational auth controller.
 *
 * Mirrors the Aisha (talent) hook contract so the UI shell is symmetrical,
 * but adds B2B-specific gates: work-email check, CV upload (optional),
 * role + company confirm, business goals selection.
 *
 * Final commit calls the existing `signup-company` edge function which
 * creates the auth user, finds-or-creates the company, links membership,
 * and grants welcome credits. This avoids forking that critical path.
 */

export type RiyaAction =
  | "welcome"
  | "collect_email"
  | "collect_name"
  | "collect_cv"
  | "confirm_role_company"
  | "collect_goals"
  | "collect_country"
  | "collect_phone"
  | "verify_human"
  | "set_password"
  | "complete";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface CVSuggestion {
  role?: string | null;
  company?: string | null;
  skills?: string[];
}

interface CollectedData {
  email: string;
  name: string;
  countryCode: string;
  country: string;
  phone: string;
  role: string;
  companyName: string;
  goals: ProGoalKey[];
  cvUrl: string | null;
}

const FREE_PROVIDERS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
  "proton.me", "protonmail.com", "live.com", "aol.com", "msn.com",
]);

export function useGro10xAuthChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentAction, setCurrentAction] = useState<RiyaAction>("welcome");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<CVSuggestion | null>(null);
  const [data, setData] = useState<CollectedData>({
    email: "",
    name: "",
    countryCode: "+880",
    country: "Bangladesh",
    phone: "",
    role: "",
    companyName: "",
    goals: [],
    cvUrl: null,
  });

  const idCounter = useRef(0);
  const genId = () => {
    idCounter.current += 1;
    return `RIYA_MSG_${idCounter.current}_${Date.now()}`;
  };

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    setMessages((prev) => [...prev, { id: genId(), role, content, timestamp: new Date() }]);
  }, []);

  // ---- Edge-function bridge (Riya). We have a non-AI deterministic fallback
  //      for every step so the flow never bricks if the gateway is down.
  const callRiya = useCallback(
    async (context: Record<string, unknown>) => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-company-auth-agent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ context, messages: [] }),
          },
        );
        if (!res.ok) throw new Error("RIYA_GATEWAY_FAULT");
        return (await res.json()) as { reply: string; action: RiyaAction; quiz?: { answer: string } | null };
      } catch {
        return null;
      }
    },
    [],
  );

  const initialize = useCallback(async () => {
    if (messages.length > 0) return;
    setIsLoading(true);
    addMessage(
      "assistant",
      "Hi, I'm Riya — your Gro10x concierge. I'll set up your professional workspace in under 60 seconds.\n\nWhat's your work email?",
    );
    setCurrentAction("collect_email");
    setIsLoading(false);
  }, [messages.length, addMessage]);

  // ---- CV upload helper. Stores the file in the public 'cvs' bucket
  //      under a temp path keyed by email; parse-cv reads it back.
  const uploadAndParseCV = useCallback(
    async (file: File) => {
      setIsLoading(true);
      addMessage("user", `📎 ${file.name}`);
      try {
        const safeKey = data.email.replace(/[^a-z0-9]/gi, "_") || `anon_${Date.now()}`;
        const path = `gro10x-prelaunch/${safeKey}-${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("cvs").upload(path, file, {
          upsert: true,
          contentType: file.type || "application/pdf",
        });
        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from("cvs").getPublicUrl(path);
        const cvUrl = pub.publicUrl;

        // Best-effort: parse to extract role + company suggestions
        let suggestion: CVSuggestion = {};
        try {
          const { data: parsed } = await supabase.functions.invoke("parse-cv", {
            body: { cvUrl, mode: "lite" },
          });
          if (parsed) {
            suggestion = {
              role: parsed.current_role || parsed.headline || parsed.role || null,
              company: parsed.current_company || parsed.company || null,
              skills: parsed.skills || [],
            };
          }
        } catch (e) {
          console.warn("[Riya] CV parse non-fatal:", e);
        }

        setData((d) => ({
          ...d,
          cvUrl,
          name: d.name || (suggestion as any).full_name || d.name,
          role: suggestion.role || d.role,
          companyName: suggestion.company || d.companyName,
        }));
        setSuggested(suggestion);

        if (suggestion.role || suggestion.company) {
          addMessage(
            "assistant",
            `Great — I picked up:\n• **Role:** ${suggestion.role || "—"}\n• **Company:** ${suggestion.company || "—"}\n\nIs this correct? You can edit before continuing.`,
          );
          setCurrentAction("confirm_role_company");
        } else {
          addMessage(
            "assistant",
            "Got your CV. I couldn't auto-detect your role — what's your current role and company name?",
          );
          setCurrentAction("confirm_role_company");
        }
      } catch (err: any) {
        console.error("[Riya] upload error:", err);
        addMessage("assistant", "I couldn't read that file. You can skip and type your role + company manually.");
        setCurrentAction("confirm_role_company");
      } finally {
        setIsLoading(false);
      }
    },
    [data.email, addMessage],
  );

  const skipCV = useCallback(() => {
    addMessage("user", "Skip CV");
    addMessage("assistant", "No problem — what's your current role and company name?");
    setCurrentAction("confirm_role_company");
  }, [addMessage]);

  // ---- Main text-input handler (one-question-per-turn)
  const handleUserInput = useCallback(
    async (input: string) => {
      if (isLoading || isComplete) return;
      const trimmed = input.trim();
      if (!trimmed) return;
      addMessage("user", trimmed);
      setIsLoading(true);

      try {
        switch (currentAction) {
          case "collect_email": {
            const email = trimmed.toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              addMessage("assistant", "That doesn't look like a valid email. Please try again.");
              break;
            }
            const domain = email.split("@")[1];
            if (FREE_PROVIDERS.has(domain)) {
              addMessage(
                "assistant",
                "Gro10x is for teams — please use your **work email** (not gmail/yahoo/etc).",
              );
              break;
            }
            setData((d) => ({ ...d, email }));
            addMessage("assistant", "Perfect. What's your full name?");
            setCurrentAction("collect_name");
            break;
          }

          case "collect_name": {
            if (trimmed.length < 2) {
              addMessage("assistant", "Could you share your full name?");
              break;
            }
            setData((d) => ({ ...d, name: trimmed }));
            addMessage(
              "assistant",
              `Nice to meet you, ${trimmed.split(" ")[0]}.\n\nWant to upload your CV? It speeds things up — I can pre-fill your role and company. Or you can skip.`,
            );
            setCurrentAction("collect_cv");
            break;
          }

          case "confirm_role_company": {
            // User can either type "Role @ Company" or just confirm
            const parts = trimmed.split(/\s+at\s+|\s+@\s+|,\s*/i);
            const role = (parts[0] || data.role || trimmed).trim();
            const company = (parts[1] || data.companyName || "").trim();
            if (!role || !company) {
              addMessage(
                "assistant",
                "Please share both — e.g. *Head of Sales at Acme Corp*",
              );
              break;
            }
            setData((d) => ({ ...d, role, companyName: company }));
            addMessage(
              "assistant",
              "Got it. What brings you to Gro10x? Tap all that apply, then send.",
            );
            setCurrentAction("collect_goals");
            break;
          }

          case "collect_country": {
            const matched = COUNTRIES_WITH_PHONE.find(
              (c) =>
                trimmed.toLowerCase().includes(c.name.toLowerCase()) ||
                trimmed.toUpperCase() === c.code,
            );
            if (!matched) {
              addMessage("assistant", "I don't recognize that country. Try the full name (e.g. *United Kingdom*).");
              break;
            }
            setData((d) => ({ ...d, country: matched.name, countryCode: matched.phoneCode }));
            addMessage(
              "assistant",
              `Thanks. What's your mobile number? (we'll prefix ${matched.phoneCode})`,
            );
            setCurrentAction("collect_phone");
            break;
          }

          case "collect_phone": {
            const digits = trimmed.replace(/\D/g, "");
            if (digits.length < 7) {
              addMessage("assistant", "That number looks too short. Please re-enter.");
              break;
            }
            setData((d) => ({ ...d, phone: digits }));
            // Server-controlled human check — try Riya, fall back deterministically.
            const r = await callRiya({ action: "verify_human" });
            const fallbackQ = "Quick human check!\n\nWhat is the opposite of cold?";
            const fallbackA = "hot";
            addMessage("assistant", r?.reply || fallbackQ);
            setQuizAnswer((r?.quiz?.answer || fallbackA).toLowerCase());
            setCurrentAction("verify_human");
            break;
          }

          case "verify_human": {
            const ans = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
            const expected = (quizAnswer || "").replace(/[^a-z0-9]/g, "");
            if (ans !== expected) {
              addMessage("assistant", "That's not quite right. Try again.");
              break;
            }
            addMessage("assistant", "Verified ✅ Last step — create a password (min 8 characters).");
            setCurrentAction("set_password");
            break;
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, isComplete, currentAction, data, quizAnswer, addMessage, callRiya],
  );

  // ---- Goals submission (chip multi-select)
  const submitGoals = useCallback(
    (goals: ProGoalKey[]) => {
      if (goals.length === 0) {
        addMessage("assistant", "Pick at least one — it helps me set up the right agents for you.");
        return;
      }
      const labels = goals
        .map((g) => PRO_GOALS.find((p) => p.key === g)?.label || g)
        .join(", ");
      setData((d) => ({ ...d, goals }));
      addMessage("user", labels);
      addMessage("assistant", "Perfect — I'll pin the right agents. Which country are you based in?");
      setCurrentAction("collect_country");
    },
    [addMessage],
  );

  // ---- Final commit: create the workspace via signup-company.
  const handlePasswordSubmit = useCallback(
    async (password: string) => {
      if (isLoading) return;
      if (password.length < 8) {
        addMessage("assistant", "Password must be at least 8 characters.");
        return;
      }
      setIsLoading(true);
      addMessage("user", "••••••••");
      try {
        const finalPhone = `${data.countryCode}${data.phone}`;
        const { data: result, error } = await supabase.functions.invoke("signup-company", {
          body: {
            email: data.email,
            password,
            full_name: data.name,
            phone: finalPhone,
            company_name: data.companyName,
            country: data.country,
            industry: null,
            company_size: null,
            website: null,
          },
        });
        if (error) throw error;
        if ((result as any)?.error) throw new Error((result as any).error);

        // Auto sign-in so the user lands directly in the workspace
        const { error: siErr } = await supabase.auth.signInWithPassword({
          email: data.email,
          password,
        });
        if (siErr) throw siErr;

        // Persist onboarding context so /gro10x/welcome can resume nicely
        try {
          localStorage.setItem(
            "gro10x:onboarding",
            JSON.stringify({
              goals: data.goals,
              role: data.role,
              cvUrl: data.cvUrl,
              completedAt: new Date().toISOString(),
            }),
          );
        } catch {
          /* ignore storage errors */
        }

        addMessage(
          "assistant",
          `🎉 Welcome to Gro10x, ${data.name.split(" ")[0]}! Your workspace at **${data.companyName}** is ready.`,
        );
        setIsComplete(true);
      } catch (err: any) {
        console.error("[Riya] signup error:", err);
        toast.error(err.message || "Sign-up failed");
        addMessage(
          "assistant",
          `Hmm — ${err.message || "something went wrong"}. Want to try a different password?`,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, data, addMessage],
  );

  return {
    messages,
    currentAction,
    isLoading,
    isComplete,
    data,
    suggested,
    initialize,
    handleUserInput,
    handlePasswordSubmit,
    uploadAndParseCV,
    skipCV,
    submitGoals,
    setRoleCompany: (role: string, companyName: string) =>
      setData((d) => ({ ...d, role, companyName })),
    agentName: "Riya",
  };
}
