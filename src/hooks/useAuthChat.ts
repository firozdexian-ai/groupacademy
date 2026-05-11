import { useReducer, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { COUNTRIES_WITH_PHONE } from "@/lib/constants/countries";
import { AuthAgentReplySchema, AuthActionSchema } from "@/lib/schemas/authAgent";

/**
 * Conversational auth flow controller for Aisha (sign-in / sign-up assistant).
 * Implemented as a reducer-driven state machine so transitions are deterministic.
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
interface EmailCheckResponse {
  exists: boolean;
  hasUserId: boolean;
  talentName: string | null;
}

const FALLBACK_HUMAN_CHECK: QuizData = { answer: "cold" };

interface AuthChatState {
  messages: ChatMessage[];
  currentAction: AuthAction;
  flow: AuthFlow;
  isLoading: boolean;
  isComplete: boolean;
  collected: CollectedData;
  quiz: QuizData | null;
  error: string | null;
  instanceId: string | null;
  agentName: string;
}

type Action =
  | { type: "RESET" }
  | { type: "ADD_MESSAGE"; role: "user" | "assistant"; content: string }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_ACTION"; value: AuthAction }
  | { type: "SET_FLOW"; value: AuthFlow }
  | { type: "PATCH_COLLECTED"; value: Partial<CollectedData> }
  | { type: "SET_QUIZ"; value: QuizData | null }
  | { type: "SET_ERROR"; value: string | null }
  | { type: "SET_INSTANCE"; instanceId: string | null; agentName: string }
  | { type: "COMPLETE" };

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `m_${Date.now()}_${Math.random()}`;

const initialState: AuthChatState = {
  messages: [],
  currentAction: "welcome",
  flow: null,
  isLoading: false,
  isComplete: false,
  collected: { email: "", name: "", phone: "", countryCode: "+880", country: "Bangladesh" },
  quiz: null,
  error: null,
  instanceId: null,
  agentName: "Aisha",
};

function reducer(state: AuthChatState, action: Action): AuthChatState {
  switch (action.type) {
    case "RESET":
      return initialState;
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: genId(), role: action.role, content: action.content, timestamp: new Date() },
        ],
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.value };
    case "SET_ACTION":
      return { ...state, currentAction: action.value };
    case "SET_FLOW":
      return { ...state, flow: action.value };
    case "PATCH_COLLECTED":
      return { ...state, collected: { ...state.collected, ...action.value } };
    case "SET_QUIZ":
      return { ...state, quiz: action.value };
    case "SET_ERROR":
      return { ...state, error: action.value };
    case "SET_INSTANCE":
      return { ...state, instanceId: action.instanceId, agentName: action.agentName };
    case "COMPLETE":
      return { ...state, isComplete: true };
    default:
      return state;
  }
}

function getFallbackProtocol(
  context: Record<string, unknown>,
): { reply: string; action: AuthAction; quiz: QuizData | null } {
  const step = context.step as string;
  const protocols: Record<string, { reply: string; action: AuthAction; quiz?: QuizData }> = {
    welcome: { reply: "Hi, I'm Aisha 👋 What email should I use to set you up?", action: "collect_email" },
    email_found: { reply: "Welcome back! Enter your password to continue.", action: "collect_password" },
    email_not_found: { reply: "Looks like you're new here. What's your full name?", action: "collect_name" },
    phone_collected: {
      reply: "Quick check to make sure you're human.\n\nQuestion: What is the opposite of hot?",
      action: "verify_human",
      quiz: FALLBACK_HUMAN_CHECK,
    },
    quiz_passed: { reply: "Great. Now create a password (at least 8 characters).", action: "set_password" },
    signup_success: {
      reply: "You're in 🎉 Welcome to GroUp Academy. We've added 250 welcome credits to your wallet.",
      action: "complete",
    },
  };
  const p = protocols[step] || protocols.welcome;
  return { reply: p.reply, action: p.action, quiz: p.quiz ?? null };
}

export function useAuthChat() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const callAgent = useCallback(
    async (
      context: Record<string, unknown>,
      conversationHistory?: Array<{ role: string; content: string }>,
    ) => {
      const s = stateRef.current;
      // Always inject WaaS instance binding + visitor country so the
      // ai-auth-agent function loads the correct persona from
      // workforce_hired_instances (mkt-seo-01 country variant).
      const enrichedContext = {
        ...context,
        instance_id: s.instanceId,
        country: context.country ?? s.collected.country,
      };
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-auth-agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ context: enrichedContext, messages: conversationHistory || [] }),
        });
        if (!res.ok) throw new Error("agent_unreachable");
        const json = await res.json();
        const parsed = AuthAgentReplySchema.safeParse(json);
        if (!parsed.success) {
          console.warn("[Aisha] Agent reply failed validation, using fallback.", parsed.error.flatten());
          return getFallbackProtocol(enrichedContext);
        }
          const safeQuiz: QuizData | null =
            parsed.data.quiz && parsed.data.quiz.answer ? { answer: parsed.data.quiz.answer } : null;
          return { reply: parsed.data.reply, action: parsed.data.action, quiz: safeQuiz };
      } catch {
        return getFallbackProtocol(enrichedContext);
      }
    },
    [],
  );

  const bootstrapMarketingInstance = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/marketing-agent-bootstrap`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({}),
        },
      );
      const json = await res.json();
      const country: string = json?.country || "Bangladesh";
      const instanceId: string | null = json?.instance_id ?? null;
      const agentName: string = json?.agent_name || "Aisha";
      // Pre-seed the user's country (and matching dial code) from geo.
      const matched = COUNTRIES_WITH_PHONE.find((c) => c.name === country);
      dispatch({
        type: "PATCH_COLLECTED",
        value: {
          country,
          countryCode: matched?.phoneCode ?? "+880",
        },
      });
      dispatch({ type: "SET_INSTANCE", instanceId, agentName });
      stateRef.current = {
        ...stateRef.current,
        instanceId,
        agentName,
        collected: {
          ...stateRef.current.collected,
          country,
          countryCode: matched?.phoneCode ?? stateRef.current.collected.countryCode,
        },
      };
    } catch (err) {
      console.warn("[Aisha] marketing-agent-bootstrap failed, using defaults.", err);
    }
  }, []);

  const initialize = useCallback(async () => {
    dispatch({ type: "SET_LOADING", value: true });
    try {
      // 1) Bind to a country-specific marketing WaaS instance first.
      await bootstrapMarketingInstance();
      // 2) Then greet using that persona.
      const response = await callAgent({ step: "welcome", flow: null });
      dispatch({ type: "ADD_MESSAGE", role: "assistant", content: response.reply });
      dispatch({
        type: "SET_ACTION",
        value: response.action === "welcome" ? "collect_email" : response.action,
      });
    } finally {
      dispatch({ type: "SET_LOADING", value: false });
    }
  }, [callAgent, bootstrapMarketingInstance]);

  const handleUserInput = useCallback(
    async (input: string) => {
      const s = stateRef.current;
      if (s.isLoading || s.isComplete) return;
      const trimmed = input.trim();
      if (!trimmed) return;

      dispatch({ type: "ADD_MESSAGE", role: "user", content: trimmed });
      dispatch({ type: "SET_LOADING", value: true });

      try {
        switch (s.currentAction) {
          case "collect_email": {
            const email = trimmed.toLowerCase();
            if (!email.includes("@")) {
              dispatch({
                type: "ADD_MESSAGE",
                role: "assistant",
                content: "That doesn't look like a valid email — try again?",
              });
              return;
            }
            dispatch({ type: "PATCH_COLLECTED", value: { email } });
            const { data } = await supabase.rpc("check_auth_email", { lookup_email: email });
            const emailResult = data as unknown as EmailCheckResponse;

            if (emailResult?.exists && emailResult?.hasUserId) {
              dispatch({ type: "SET_FLOW", value: "login" });
              const res = await callAgent({ step: "email_found", email });
              dispatch({ type: "ADD_MESSAGE", role: "assistant", content: res.reply });
              dispatch({ type: "SET_ACTION", value: "collect_password" });
            } else {
              dispatch({ type: "SET_FLOW", value: "signup" });
              const res = await callAgent({ step: "email_not_found", email });
              dispatch({ type: "ADD_MESSAGE", role: "assistant", content: res.reply });
              dispatch({ type: "SET_ACTION", value: "collect_name" });
            }
            break;
          }

          case "collect_name":
            dispatch({ type: "PATCH_COLLECTED", value: { name: trimmed } });
            dispatch({
              type: "ADD_MESSAGE",
              role: "assistant",
              content: `Nice to meet you, ${trimmed}. Which country are you in?`,
            });
            dispatch({ type: "SET_ACTION", value: "collect_country" });
            break;

          case "collect_country": {
            const matched = COUNTRIES_WITH_PHONE.find(
              (c) =>
                trimmed.toLowerCase().includes(c.name.toLowerCase()) || trimmed.toUpperCase() === c.code,
            );
            if (!matched) {
              dispatch({
                type: "ADD_MESSAGE",
                role: "assistant",
                content:
                  "I didn't recognise that country — could you type it again? (e.g. United States, India, Bangladesh)",
              });
              return;
            }
            dispatch({
              type: "PATCH_COLLECTED",
              value: { country: matched.name, countryCode: matched.phoneCode },
            });
            dispatch({
              type: "ADD_MESSAGE",
              role: "assistant",
              content: `Got it. What's your mobile number? (e.g. ${matched.phoneCode}…)`,
            });
            dispatch({ type: "SET_ACTION", value: "collect_phone" });
            break;
          }

          case "collect_phone": {
            const digits = trimmed.replace(/\D/g, "");
            if (digits.length < 7) {
              dispatch({
                type: "ADD_MESSAGE",
                role: "assistant",
                content: "That phone number looks short — please enter the full number.",
              });
              return;
            }
            dispatch({ type: "PATCH_COLLECTED", value: { phone: trimmed } });
            const res = await callAgent({ step: "phone_collected", flow: s.flow });
            dispatch({ type: "ADD_MESSAGE", role: "assistant", content: res.reply });
            dispatch({ type: "SET_ACTION", value: res.action });
            if (res.quiz) dispatch({ type: "SET_QUIZ", value: res.quiz });
            break;
          }

          case "verify_human": {
            const userAns = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
            const correctAns = s.quiz?.answer?.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (userAns === correctAns) {
              const res = await callAgent({ step: "quiz_passed", flow: s.flow });
              dispatch({ type: "ADD_MESSAGE", role: "assistant", content: res.reply });
              dispatch({ type: "SET_ACTION", value: "set_password" });
            } else {
              dispatch({
                type: "ADD_MESSAGE",
                role: "assistant",
                content: "Not quite — what's the opposite of 'hot'?",
              });
              dispatch({ type: "SET_QUIZ", value: { answer: "cold" } });
            }
            break;
          }
        }
      } finally {
        dispatch({ type: "SET_LOADING", value: false });
      }
    },
    [callAgent],
  );

  const handlePasswordSubmit = useCallback(
    async (password: string) => {
      const s = stateRef.current;
      if (s.isLoading) return;
      dispatch({ type: "SET_LOADING", value: true });
      dispatch({ type: "ADD_MESSAGE", role: "user", content: "••••••••" });

      try {
        if (s.flow === "login") {
          await signIn(s.collected.email, password);
          dispatch({
            type: "ADD_MESSAGE",
            role: "assistant",
            content: "Signed in. Taking you to your dashboard…",
          });
          dispatch({ type: "COMPLETE" });
        } else {
          const finalPhone = s.collected.phone.startsWith("+")
            ? s.collected.phone
            : `${s.collected.countryCode}${s.collected.phone.replace(/\D/g, "")}`;
          const success = await signUp(
            s.collected.name,
            s.collected.email,
            password,
            finalPhone,
            s.collected.country,
            s.collected.countryCode,
          );
          if (success) {
            const res = await callAgent({ step: "signup_success" });
            dispatch({ type: "ADD_MESSAGE", role: "assistant", content: res.reply });
            dispatch({ type: "COMPLETE" });
          } else {
            dispatch({
              type: "ADD_MESSAGE",
              role: "assistant",
              content: "Something went wrong creating your account. Let's try again.",
            });
            dispatch({ type: "SET_FLOW", value: "login" });
            dispatch({ type: "SET_ACTION", value: "collect_email" });
          }
        }
      } catch (err: any) {
        const msg = err?.message
          ? `${err.message} — please try again.`
          : "Something went wrong. Please try again.";
        dispatch({ type: "ADD_MESSAGE", role: "assistant", content: msg });
        dispatch({ type: "SET_ERROR", value: err?.message ?? "unknown" });
      } finally {
        dispatch({ type: "SET_LOADING", value: false });
      }
    },
    [signIn, signUp, callAgent],
  );

  const handleForgotPassword = useCallback(async () => {
    const s = stateRef.current;
    if (!s.collected.email) {
      dispatch({
        type: "ADD_MESSAGE",
        role: "assistant",
        content: "Please share your email first so I can send the reset link.",
      });
      return;
    }
    await resetPassword(s.collected.email);
    dispatch({ type: "ADD_MESSAGE", role: "assistant", content: "Reset link sent — check your inbox." });
  }, [resetPassword]);

  const updatePhoneData = useCallback((phone: string, countryCode: string, country: string) => {
    dispatch({ type: "PATCH_COLLECTED", value: { phone, countryCode, country } });
  }, []);

  return {
    messages: state.messages,
    currentAction: state.currentAction,
    flow: state.flow,
    isLoading: state.isLoading,
    isComplete: state.isComplete,
    collectedData: state.collected,
    error: state.error,
    initialize,
    handleUserInput,
    handlePasswordSubmit,
    handleForgotPassword,
    updatePhoneData,
    agentName: state.agentName,
    instanceId: state.instanceId,
    // Re-export schema enum for callers that want to assert action types.
    AuthActionSchema,
  };
}
