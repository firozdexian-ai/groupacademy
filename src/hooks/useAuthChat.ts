import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { COUNTRIES_WITH_PHONE } from "@/lib/constants/countries";

/**
 * Conversational auth flow controller for Aisha (sign-in / sign-up assistant).
 */

export type AuthAction =
  | "welcome"
  | "collect_email"
  | "collect_password"
  | "collect_name"
  | "collect_country"
  | "collect_phone"
  | "set_password"
  | "verify_human"
  | "do_signin"
  | "do_signup"
  | "do_reset"
  | "complete";

export type AuthFlow = "login" | "signup" | "claim" | "reset" | null;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface QuizData {
  answer: string;
}
interface CollectedData {
  email: string;
  name: string;
  phone: string;
  countryCode: string;
  country: string;
}

// Interface for RPC response typing
interface EmailCheckResponse {
  exists: boolean;
  hasUserId: boolean;
  talentName: string | null;
}

const FALLBACK_HUMAN_CHECK: QuizData = { answer: "cold" };

export function useAuthChat() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentAction, setCurrentAction] = useState<AuthAction>("welcome");
  const [flow, setFlow] = useState<AuthFlow>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [collectedData, setCollectedData] = useState<CollectedData>({
    email: "",
    name: "",
    phone: "",
    countryCode: "+880",
    country: "Bangladesh",
  });
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const messageIdCounter = useRef(0);

  const genId = () => {
    messageIdCounter.current += 1;
    return `MSG_ARTIFACT_${messageIdCounter.current}_${Date.now()}`;
  };

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    const msg: ChatMessage = { id: genId(), role, content, timestamp: new Date() };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const callAgent = useCallback(
    async (context: Record<string, unknown>, conversationHistory?: Array<{ role: string; content: string }>) => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-auth-agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ context, messages: conversationHistory || [] }),
        });
        if (!res.ok) throw new Error("NEURAL_SERVICE_FAULT");
        return (await res.json()) as { reply: string; action: AuthAction; quiz: QuizData | null };
      } catch {
        return getFallbackProtocol(context);
      }
    },
    [],
  );

  const getFallbackProtocol = (
    context: Record<string, unknown>,
  ): { reply: string; action: AuthAction; quiz: QuizData | null } => {
    const step = context.step as string;
    const protocols: Record<string, any> = {
      welcome: {
        reply: "Hi, I'm Aisha 👋 What email should I use to set you up?",
        action: "collect_email",
      },
      email_found: {
        reply: "Welcome back! Enter your password to continue.",
        action: "collect_password",
      },
      email_not_found: {
        reply: "Looks like you're new here. What's your full name?",
        action: "collect_name",
      },
      phone_collected: {
        reply: "Quick check to make sure you're human.\n\nQuestion: What is the opposite of hot?",
        action: "verify_human",
        quiz: FALLBACK_HUMAN_CHECK,
      },
      quiz_passed: {
        reply: "Great. Now create a password (at least 8 characters).",
        action: "set_password",
      },
      signup_success: {
        reply: "You're in 🎉 Welcome to GroUp Academy. We've added 250 welcome credits to your wallet.",
        action: "complete",
      },
    };
    return protocols[step] || protocols.welcome;
  };

  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await callAgent({ step: "welcome", flow: null });
      addMessage("assistant", response.reply);
      setCurrentAction(response.action === "welcome" ? "collect_email" : response.action);
    } finally {
      setIsLoading(false);
    }
  }, [callAgent, addMessage]);

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
            if (!email.includes("@")) {
              addMessage("assistant", "That doesn't look like a valid email — try again?");
              return;
            }
            setCollectedData((prev) => ({ ...prev, email }));

            const { data } = await supabase.rpc("check_auth_email", { lookup_email: email });

            // REINFORCED: Double-assertion to resolve TS2352 overlap error
            const emailResult = data as unknown as EmailCheckResponse;

            if (emailResult?.exists && emailResult?.hasUserId) {
              setFlow("login");
              const res = await callAgent({ step: "email_found", email });
              addMessage("assistant", res.reply);
              setCurrentAction("collect_password");
            } else {
              setFlow("signup");
              const res = await callAgent({ step: "email_not_found", email });
              addMessage("assistant", res.reply);
              setCurrentAction("collect_name");
            }
            break;
          }

          case "collect_name":
            setCollectedData((prev) => ({ ...prev, name: trimmed }));
            addMessage("assistant", `Identity noted, ${trimmed}. In which country is your current base?`);
            setCurrentAction("collect_country");
            break;

          case "collect_country": {
            const matched = COUNTRIES_WITH_PHONE.find(
              (c) => trimmed.toLowerCase().includes(c.name.toLowerCase()) || trimmed.toUpperCase() === c.code,
            );
            if (!matched) {
              addMessage(
                "assistant",
                "REGISTRY_ERROR: Country not recognized. Please re-input your institutional base.",
              );
              return;
            }
            setCollectedData((prev) => ({ ...prev, country: matched.name, countryCode: matched.phoneCode }));
            addMessage(
              "assistant",
              `Acknowledged. For ${matched.name}, what is your mobile artifact number? (e.g. ${matched.phoneCode}...)`,
            );
            setCurrentAction("collect_phone");
            break;
          }

          case "collect_phone": {
            const digits = trimmed.replace(/\D/g, "");
            if (collectedData.country === "Bangladesh" && digits.length < 10) {
              addMessage("assistant", "INCOMPLETE_DATA: Bangladesh mobile artifacts require 11 digits.");
              return;
            }
            setCollectedData((prev) => ({ ...prev, phone: trimmed }));
            const res = await callAgent({ step: "phone_collected", flow });
            addMessage("assistant", res.reply);
            setCurrentAction(res.action);
            if (res.quiz) setQuiz(res.quiz);
            break;
          }

          case "verify_human": {
            const userAns = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
            const correctAns = quiz?.answer?.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (userAns === correctAns) {
              const res = await callAgent({ step: "quiz_passed", flow });
              addMessage("assistant", res.reply);
              setCurrentAction("set_password");
            } else {
              addMessage("assistant", "VAL_FAULT: Incorrect. Let's re-try: What is the opposite of 'hot'?");
              setQuiz({ answer: "cold" });
            }
            break;
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [currentAction, isLoading, isComplete, flow, quiz, collectedData, callAgent, addMessage],
  );

  const handlePasswordSubmit = useCallback(
    async (password: string) => {
      if (isLoading) return;
      setIsLoading(true);
      addMessage("user", "••••••••");
      try {
        if (flow === "login") {
          await signIn(collectedData.email, password);
          addMessage("assistant", "SESSION_ESTABLISHED: Access granted.");
          setIsComplete(true);
        } else {
          const finalPhone = collectedData.phone.startsWith("+")
            ? collectedData.phone
            : `${collectedData.countryCode}${collectedData.phone.replace(/\D/g, "")}`;
          const success = await signUp(
            collectedData.name,
            collectedData.email,
            password,
            finalPhone,
            collectedData.country,
            collectedData.countryCode,
          );
          if (success) {
            const res = await callAgent({ step: "signup_success" });
            addMessage("assistant", res.reply);
            setIsComplete(true);
          } else {
            addMessage("assistant", "SIGNUP_PENDING: Please verify your email artifact, then return to synchronize.");
            setFlow("login");
            setCurrentAction("collect_email");
          }
        }
      } catch (err: any) {
        toast.error(err.message);
        addMessage("assistant", `AUTH_ERROR: ${err.message}. Please re-input credentials.`);
      } finally {
        setIsLoading(false);
      }
    },
    [flow, collectedData, isLoading, signIn, signUp, callAgent, addMessage],
  );

  return {
    messages,
    currentAction,
    flow,
    isLoading,
    isComplete,
    collectedData,
    initialize,
    handleUserInput,
    handlePasswordSubmit,
    handleForgotPassword: async () => {
      if (!collectedData.email) return addMessage("assistant", "EMAIL_REQUIRED: Provide email for recovery sync.");
      await resetPassword(collectedData.email);
      addMessage("assistant", "RECOVERY_LINK_DEPLOYED: Check your inbox.");
    },
    updatePhoneData: (phone: string, countryCode: string, country: string) =>
      setCollectedData((prev) => ({ ...prev, phone, countryCode, country })),
    agentName: "Aisha",
  };
}
