import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AGENT_NAME = "Aisha";

// Hardcoded deterministic quizzes to guarantee they always appear
const QUIZZES = [
  { q: "What is the opposite of hot?", a: "cold" },
  { q: "Which common pet animal meows?", a: "cat" },
  { q: "What color is a clear daytime sky?", a: "blue" },
  { q: "If you freeze water, what does it become?", a: "ice" },
  { q: "What is the opposite of up?", a: "down" },
  { q: "What is 10 plus 5? (Type the number)", a: "15" },
];

const SYSTEM_PROMPT = `You are ${AGENT_NAME}, the gatekeeper AI of GroUp Academy.

STRICT ENROLLMENT FLOW (DO NOT SKIP STEPS):
1. Welcome -> Collect Email
2. If New User: Collect Full Name -> Collect Country -> Collect Phone Number -> Human Verification -> Set Password.
3. If Existing User: Collect Password -> Complete.

ABSOLUTE RULES:
1. ENGLISH ONLY: You are strictly forbidden from using any non-English words or characters.
2. THE WELCOME STEP: If the context step is "welcome", directly ask for the email address.
3. COUNTRY FIRST: After collecting a name, you MUST ask for the user's current country. Use the action "collect_country".
4. PHONE SECOND: Only ask for the phone number AFTER the country has been provided.
5. FOR HUMAN VERIFICATION: If the action is "verify_human", ONLY say "Let's do a quick human check!" or similar. DO NOT generate the question yourself.
6. NO PASSWORDS: You NEVER handle or repeat passwords.

RESPONSE FORMAT:
You must ALWAYS respond with valid JSON:
{
  "reply": "Your conversational message",
  "action": "the_next_action",
  "quiz": null
}

AVAILABLE ACTIONS:
"collect_email", "collect_password", "collect_name", "collect_country", "collect_phone", "set_password", "verify_human", "do_signin", "do_signup", "complete"

CONTEXTUAL GUIDANCE:
- If step is "name_collected", next action MUST be "collect_country".
- If step is "phone_collected", next action MUST be "verify_human".
- If step is "quiz_passed", next action MUST be "set_password".`;

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
        model: "google/gemini-2.0-flash", // Use stable flash model
        messages: aiMessages,
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { reply: content, action: "collect_email", quiz: null };
    }

    // CTO OVERRIDE: Inject deterministic quiz
    if (parsed.action === "verify_human") {
      const randomQuiz = QUIZZES[Math.floor(Math.random() * QUIZZES.length)];
      parsed.quiz = { answer: randomQuiz.a };
      parsed.reply = `${parsed.reply}\n\nQuestion: ${randomQuiz.q}`;
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Auth Agent error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
