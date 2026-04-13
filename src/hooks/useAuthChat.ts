import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { COUNTRIES_WITH_PHONE } from "@/lib/constants/countries";

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

const FALLBACK_HUMAN_CHECK: QuizData = {
  answer: "cold",
};

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
  const [authError, setAuthError] = useState<string | null>(null);
  const messageIdCounter = useRef(0);

  const genId = () => {
    messageIdCounter.current += 1;
    return `msg-${messageIdCounter.current}-${Date.now()}`;
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
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ context, messages: conversationHistory || [] }),
        });

        if (!res.ok) throw new Error("AI service unavailable");
        return (await res.json()) as { reply: string; action: AuthAction; quiz: QuizData | null };
      } catch {
        return getFallbackResponse(context);
      }
    },
    [],
  );

  const getFallbackResponse = (
    context: Record<string, unknown>,
  ): { reply: string; action: AuthAction; quiz: QuizData | null } => {
    const step = context.step as string;
    switch (step) {
      case "welcome":
        return {
          reply: "Welcome to GroUp Academy! 😊 I'm Aisha. To get started, what's your email address?",
          action: "collect_email",
          quiz: null,
        };
      case "email_found":
        return {
          reply: "Welcome back! 🎉 Please enter your password to continue.",
          action: "collect_password",
          quiz: null,
        };
      case "email_not_found":
        return { reply: "Let's create your account! What's your full name?", action: "collect_name", quiz: null };
      case "phone_collected":
        return {
          reply: "Let's do a quick human check!\n\nQuestion: What is the opposite of hot?",
          action: "verify_human",
          quiz: FALLBACK_HUMAN_CHECK,
        };
      case "quiz_passed":
        return {
          reply: "Perfect. Now create a password with at least 8 characters.",
          action: "set_password",
          quiz: null,
        };
      case "signup_success":
        return {
          reply: "🎉 Account created! Welcome to GroUp Academy! You've earned 250 bonus credits!",
          action: "complete",
          quiz: null,
        };
      default:
        return { reply: "Let's continue. What's your email?", action: "collect_email", quiz: null };
    }
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

  const checkEmail = useCallback(async (email: string) => {
    const { data, error } = await supabase.rpc("check_auth_email", {
      lookup_email: email.trim().toLowerCase(),
    });
    if (error || !data) return { exists: false, hasUserId: false };
    return data as { exists: boolean; hasUserId: boolean; talentName: string | null };
  }, []);

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
              addMessage("assistant", "Please enter a valid email address.");
              setCurrentAction("collect_email");
              break;
            }
            setCollectedData((prev) => ({ ...prev, email }));
            const emailResult = await checkEmail(email);
            if (emailResult.exists && emailResult.hasUserId) {
              setFlow("login");
              const response = await callAgent({ step: "email_found", email });
              addMessage("assistant", response.reply);
              setCurrentAction("collect_password");
            } else {
              setFlow("signup");
              const response = await callAgent({ step: "email_not_found", email });
              addMessage("assistant", response.reply);
              setCurrentAction("collect_name");
            }
            break;
          }

          case "collect_name": {
            setCollectedData((prev) => ({ ...prev, name: trimmed }));
            addMessage("assistant", `Nice to meet you, ${trimmed}! Which country are you currently based in?`);
            setCurrentAction("collect_country");
            break;
          }

          case "collect_country": {
            const matched = COUNTRIES_WITH_PHONE.find(
              (c) => trimmed.toLowerCase().includes(c.name.toLowerCase()) || trimmed.toUpperCase() === c.code,
            );

            if (!matched) {
              addMessage(
                "assistant",
                "I didn't recognize that country. Could you please type your country name again?",
              );
              setCurrentAction("collect_country");
              break;
            }

            setCollectedData((prev) => ({
              ...prev,
              country: matched.name,
              countryCode: matched.phoneCode,
            }));

            addMessage(
              "assistant",
              `Great! Since you're in ${matched.name}, what is your mobile number? (e.g. ${matched.phoneCode}...)`,
            );
            setCurrentAction("collect_phone");
            break;
          }

          case "collect_phone": {
            const digits = trimmed.replace(/\D/g, "");
            // Strict Bangladesh Validation
            if (collectedData.country === "Bangladesh" && digits.length < 10) {
              addMessage(
                "assistant",
                "That looks like an incomplete number for Bangladesh. Please provide your full mobile number.",
              );
              break;
            }
            // General length check
            if (digits.length < 7) {
              addMessage("assistant", "That number is too short. Please provide a valid mobile number.");
              break;
            }

            setCollectedData((prev) => ({ ...prev, phone: trimmed }));
            const response = await callAgent({ step: "phone_collected", flow });
            addMessage("assistant", response.reply);
            setCurrentAction(response.action);
            if (response.quiz) setQuiz(response.quiz);
            break;
          }

          case "verify_human": {
            const userAnswer = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
            const correctAnswer = quiz?.answer?.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (userAnswer === correctAnswer) {
              const response = await callAgent({ step: "quiz_passed", flow });
              addMessage("assistant", response.reply);
              setCurrentAction("set_password");
              setQuiz(null);
            } else {
              addMessage("assistant", "Not quite! Let's try another: What is the opposite of 'hot'?");
              setQuiz({ answer: "cold" });
            }
            break;
          }

          default:
            setCurrentAction("collect_email");
            break;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [currentAction, isLoading, isComplete, flow, quiz, collectedData, callAgent, addMessage, checkEmail],
  );

  const handlePasswordSubmit = useCallback(
    async (password: string) => {
      if (isLoading) return;
      setIsLoading(true);
      addMessage("user", "••••••••");

      try {
        if (flow === "login") {
          await signIn(collectedData.email, password);
          addMessage("assistant", "Welcome back! You are now logged in.");
          setIsComplete(true);
        } else {
          const cleanPhone = collectedData.phone.replace(/\D/g, "");
          const finalPhone = collectedData.phone.startsWith("+")
            ? collectedData.phone
            : `${collectedData.countryCode}${cleanPhone}`;

          const success = await signUp(
            collectedData.name,
            collectedData.email,
            password,
            finalPhone,
            collectedData.country,
            collectedData.countryCode,
          );

          if (success) {
            const response = await callAgent({ step: "signup_success" });
            addMessage("assistant", response.reply);
            setIsComplete(true);
          } else {
            addMessage(
              "assistant",
              "Your account was created. Please verify your email from your inbox, then come back here and sign in.",
            );
            setFlow("login");
            setCurrentAction("collect_email");
          }
        }
      } catch (error: any) {
        toast.error(error.message);
        addMessage("assistant", `Authentication error: ${error.message}. Please try your password again.`);
      } finally {
        setIsLoading(false);
      }
    },
    [flow, collectedData, isLoading, signIn, signUp, callAgent, addMessage],
  );

  const handleForgotPassword = useCallback(async () => {
    if (!collectedData.email) {
      addMessage("assistant", "Please enter your email first so I can send a reset link.");
      setCurrentAction("collect_email");
      return;
    }
    await resetPassword(collectedData.email);
    addMessage("assistant", "Reset link sent! Please check your inbox.");
  }, [collectedData.email, resetPassword, addMessage]);

  const updatePhoneData = useCallback((phone: string, countryCode: string, country: string) => {
    setCollectedData((prev) => ({ ...prev, phone, countryCode, country }));
  }, []);

  return {
    messages,
    currentAction,
    flow,
    isLoading,
    isComplete,
    collectedData,
    authError,
    initialize,
    handleUserInput,
    handlePasswordSubmit,
    handleForgotPassword,
    updatePhoneData,
    agentName: "Aisha",
  };
}
