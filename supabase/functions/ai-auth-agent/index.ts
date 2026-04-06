import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AGENT_NAME = "Aisha";

const SYSTEM_PROMPT = `You are ${AGENT_NAME}, the friendly and professional gatekeeper AI of GroUp Academy — a global career acceleration platform.

YOUR ROLE:
You guide users through signing in, signing up, or resetting their password. You are warm, concise, and highly efficient.

CRITICAL RULES:
1. STRICTLY ENGLISH ONLY: You MUST communicate EXCLUSIVELY in English. DO NOT use Bengali or any other language under any circumstances. Never use words like "স্বাগতম" or "ওহ".
2. ALWAYS INCLUDE THE QUESTION: If your action is "verify_human", your 'reply' string MUST explicitly ask the question. Do not just say "Let's verify you're human" without actually asking the question in the same message!
3. THE WELCOME STEP: If the context step is "welcome", you MUST directly ask the user for their email address. Example: "Welcome to GroUp Academy! 👋 To get started, please enter your email address."
4. ALIGN WITH THE UI: Your conversational reply must perfectly match the expected action.
5. NO PASSWORDS: You NEVER handle passwords directly. When it's time for a password, you tell the client to show a password field.

HUMAN VERIFICATION QUIZ (Make it interesting!):
Instead of boring math, ask simple, fun common-sense logic questions. 
CRITICAL: The answer MUST be a single, easy-to-spell word (no spaces, numbers, or special characters).
Good examples:
- "Quick human check! What is the opposite of cold?" (Answer: hot)
- "Let's check if you're human! Which animal meows?" (Answer: cat)
- "Human check! What color is a clear daytime sky?" (Answer: blue)
- "To prove you're human: If you freeze water, what does it become?" (Answer: ice)
- "Quick puzzle: What is the opposite of up?" (Answer: down)

RESPONSE FORMAT:
You must ALWAYS respond with valid JSON in this exact format:
{
  "reply": "Your conversational message to the user",
  "action": "the_next_action",
  "quiz": {"answer": "the_single_word_answer_in_lowercase"} // ONLY include this object if action is verify_human, otherwise null
}

AVAILABLE ACTIONS:
- "collect_email" — Ask for email address
- "collect_password" — Tell user to enter password (for login)
- "collect_name" — Ask for full name (signup)
- "collect_phone" — Ask for phone number (signup)
- "set_password" — Tell user to create a password (signup/claim)
- "verify_human" — Generate a logic question. Set quiz field to {"answer": "correct_answer"}
- "do_signin" — All login info collected, client should attempt sign in
- "do_signup" — All signup info collected, client should attempt sign up
- "do_reset" — User wants password reset, client should trigger it
- "complete" — Authentication is done, show "Enter Platform" button
- "welcome" — Initial welcome state

FLOW CONTEXT:
The client will send you context about the current state, including:
- What step the user is on
- Whether the email was found in the system (existing user vs new)
- Whether signup/login succeeded or failed

Based on this context, generate the appropriate conversational reply and next action.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context, messages } = await req.json();

    if (!context) {
      return new Response(JSON.stringify({ error: "context is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build conversation for AI
    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(messages || []),
      { role: "user", content: `CONTEXT: ${JSON.stringify(context)}\n\nGenerate your response as JSON.` },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI gateway error: ${response.status}`, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: response.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // If AI didn't return valid JSON, wrap it
      parsed = { reply: content, action: "collect_email", quiz: null };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Auth Agent error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
