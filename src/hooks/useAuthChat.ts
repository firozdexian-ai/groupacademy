import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { isPhoneNumber } from "@/lib/validations";

export type AuthAction =
  | "welcome"
  | "collect_email"
  | "collect_password"
  | "collect_name"
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
    country: "BD",
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
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-auth-agent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ context, messages: conversationHistory || [] }),
          }
        );

        if (!res.ok) {
          throw new Error("AI service unavailable");
        }

        return (await res.json()) as { reply: string; action: AuthAction; quiz: QuizData | null };
      } catch {
        return getFallbackResponse(context);
      }
    },
    []
  );

  const getFallbackResponse = (context: Record<string, unknown>): { reply: string; action: AuthAction; quiz: QuizData | null } => {
    const step = context.step as string;
    switch (step) {
      case "welcome":
        return { reply: "স্বাগতম! Welcome to GroUp Academy! 😊 I'm Aisha, your guide. What's your email address?", action: "collect_email", quiz: null };
      case "email_found":
        return { reply: "Welcome back! 🎉 Please enter your password to continue.", action: "collect_password", quiz: null };
      case "email_found_unclaimed":
        return { reply: "We have your profile! Let's set up your login. Please confirm your full name.", action: "collect_name", quiz: null };
      case "email_not_found":
        return { reply: "Let's create your account! What's your full name?", action: "collect_name", quiz: null };
      case "name_collected":
        return { reply: "Great! Now, your phone number please — we'll use it for WhatsApp updates.", action: "collect_phone", quiz: null };
      case "phone_collected":
        return { reply: "Quick human check! 🧮 What is 7 + 5?", action: "verify_human", quiz: { answer: "12" } };
      case "quiz_passed":
        return { reply: "You're human! 🎉 Now create a strong password (at least 8 characters).", action: "set_password", quiz: null };
      case "signup_success":
        return { reply: "🎉 Account created! Welcome to GroUp Academy! You've earned 250 bonus credits!", action: "complete", quiz: null };
      case "signin_success":
        return { reply: "Welcome back! 🎉 You're all set.", action: "complete", quiz: null };
      case "reset_sent":
        return { reply: "Password reset link sent to your email! Check your inbox.", action: "collect_email", quiz: null };
      case "auth_error":
        return { reply: `Hmm, that didn't work: ${context.error}. Let's try again.`, action: (context.retryAction as AuthAction) || "collect_email", quiz: null };
      default:
        return { reply: "What's your email address?", action: "collect_email", quiz: null };
    }
  };

  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await callAgent({ step: "welcome", flow: null });
      addMessage("assistant", response.reply);
      setCurrentAction(response.action);
    } finally {
      setIsLoading(false);
    }
  }, [callAgent, addMessage]);

  const checkEmail = useCallback(async (email: string): Promise<{ exists: boolean; hasUserId: boolean; talentName?: string }> => {
    try {
      const { data, error } = await supabase
        .from("talents")
        .select("id, full_name, user_id")
        .eq("email", email.trim().toLowerCase())
        .limit(1);

      if (error || !data || data.length === 0) {
        return { exists: false, hasUserId: false };
      }

      return {
        exists: true,
        hasUserId: !!data[0].user_id,
        talentName: data[0].full_name,
      };
    } catch {
      return { exists: false, hasUserId: false };
    }
  }, []);

  const handleUserInput = useCallback(
    async (input: string) => {
      if (isLoading || isComplete) return;

      const trimmed = input.trim();
      if (!trimmed) return;

      addMessage("user", trimmed);
      setIsLoading(true);
      setAuthError(null);

      try {
        switch (currentAction) {
          case "collect_email": {
            const email = trimmed.toLowerCase();
            setCollectedData((prev) => ({ ...prev, email }));

            const emailResult = await checkEmail(email);

            if (emailResult.exists && emailResult.hasUserId) {
              setFlow("login");
              const response = await callAgent({
                step: "email_found",
                email,
                talentName: emailResult.talentName,
              });
              addMessage("assistant", response.reply);
              setCurrentAction(response.action);
            } else if (emailResult.exists && !emailResult.hasUserId) {
              setFlow("claim");
              setCollectedData((prev) => ({ ...prev, name: emailResult.talentName || "" }));
              const response = await callAgent({
                step: "email_found_unclaimed",
                email,
                talentName: emailResult.talentName,
              });
              addMessage("assistant", response.reply);
              setCurrentAction(response.action);
            } else {
              setFlow("signup");
              const response = await callAgent({ step: "email_not_found", email });
              addMessage("assistant", response.reply);
              setCurrentAction(response.action);
            }
            break;
          }

          case "collect_name": {
            setCollectedData((prev) => ({ ...prev, name: trimmed }));
            const response = await callAgent({ step: "name_collected", name: trimmed, flow });
            addMessage("assistant", response.reply);
            setCurrentAction(response.action);
            if (response.quiz) setQuiz(response.quiz);
            break;
          }

          case "collect_phone": {
            setCollectedData((prev) => ({ ...prev, phone: trimmed }));
            const response = await callAgent({ step: "phone_collected", flow });
            addMessage("assistant", response.reply);
            setCurrentAction(response.action);
            if (response.quiz) setQuiz(response.quiz);
            break;
          }

          case "verify_human": {
            const userAnswer = trimmed.replace(/\s/g, "");
            const correctAnswer = quiz?.answer?.replace(/\s/g, "");

            if (userAnswer === correctAnswer) {
              const response = await callAgent({ step: "quiz_passed", flow });
              addMessage("assistant", response.reply);
              setCurrentAction(response.action);
              setQuiz(null);
            } else {
              const response = await callAgent({ step: "quiz_failed", flow });
              addMessage("assistant", response.reply);
              setCurrentAction("verify_human");
              if (response.quiz) setQuiz(response.quiz);
            }
            break;
          }

          case "collect_password":
          case "set_password": {
            break;
          }

          default: {
            const lowerInput = trimmed.toLowerCase();
            if (lowerInput.includes("forgot") || lowerInput.includes("reset") || lowerInput.includes("password")) {
              setFlow("reset");
              if (collectedData.email) {
                await handleResetPassword();
              } else {
                const response = await callAgent({ step: "forgot_password_no_email" });
                addMessage("assistant", response.reply);
                setCurrentAction("collect_email");
              }
            }
            break;
          }
        }
      } catch (error) {
        console.error("Auth chat error:", error);
        addMessage("assistant", "Something went wrong. Let's try again. What's your email?");
        setCurrentAction("collect_email");
      } finally {
        setIsLoading(false);
      }
    },
    [currentAction, isLoading, isComplete, flow, quiz, collectedData, callAgent, addMessage, checkEmail]
  );

  const handlePasswordSubmit = useCallback(
    async (password: string) => {
      if (isLoading) return;
      setIsLoading(true);
      setAuthError(null);

      addMessage("user", "••••••••");

      try {
        if (flow === "login") {
          await signIn(collectedData.email, password);
          const response = await callAgent({ step: "signin_success" });
          addMessage("assistant", response.reply);
          setCurrentAction("complete");
          setIsComplete(true);
        } else if (flow === "signup" || flow === "claim") {
          const fullPhone = `${collectedData.countryCode}${collectedData.phone}`;
          const success = await signUp(
            collectedData.name,
            collectedData.email,
            password,
            fullPhone,
            collectedData.country,
            collectedData.countryCode
          );

          if (success) {
            const response = await callAgent({ step: "signup_success" });
            addMessage("assistant", response.reply);
            setCurrentAction("complete");
            setIsComplete(true);
          } else {
            const response = await callAgent({ step: "signup_needs_signin" });
            addMessage("assistant", response.reply || "Account created! Please sign in with your credentials.");
            setFlow("login");
            setCurrentAction("collect_password");
          }
        }
      } catch (error: any) {
        const errorMsg = error?.message || "Authentication failed";
        setAuthError(errorMsg);
        const retryAction = flow === "login" ? "collect_password" : "set_password";
        const response = await callAgent({
          step: "auth_error",
          error: errorMsg,
          flow,
          retryAction,
        });
        addMessage("assistant", response.reply);
        setCurrentAction(retryAction);
      } finally {
        setIsLoading(false);
      }
    },
    [flow, collectedData, isLoading, signIn, signUp, callAgent, addMessage]
  );

  const handleResetPassword = useCallback(async () => {
    if (!collectedData.email) return;
    setIsLoading(true);

    try {
      await resetPassword(collectedData.email);
      const response = await callAgent({ step: "reset_sent", email: collectedData.email });
      addMessage("assistant", response.reply);
      setCurrentAction("collect_email");
      setFlow(null);
    } catch (error: any) {
      addMessage("assistant", "Couldn't send reset link. Please check your email and try again.");
      setCurrentAction("collect_email");
    } finally {
      setIsLoading(false);
    }
  }, [collectedData.email, resetPassword, callAgent, addMessage]);

  const handleForgotPassword = useCallback(async () => {
    setFlow("reset");
    if (collectedData.email) {
      await handleResetPassword();
    } else {
      addMessage("assistant", "No problem! Please enter your email address and I'll send you a reset link.");
      setCurrentAction("collect_email");
    }
  }, [collectedData.email, handleResetPassword, addMessage]);

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
    handleResetPassword,
    updatePhoneData,
    agentName: "Aisha",
  };
}
