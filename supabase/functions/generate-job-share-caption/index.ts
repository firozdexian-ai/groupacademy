import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, company, location, job_type, requirements, apply_link, channel } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const channelTones: Record<string, string> = {
      linkedin: "Professional and polished. Use industry language. Appeal to career growth.",
      facebook: "Engaging and community-oriented. Friendly but informative. Encourage tagging friends.",
      whatsapp: "Conversational and direct. Like sharing with a friend. Short paragraphs.",
      telegram: "Concise and punchy. Maximum 280 characters. Telegram-style brevity.",
    };

    const tone = channelTones[channel] || channelTones.linkedin;
    const maxLen = channel === "telegram" ? 280 : 500;
    const reqSnippet = Array.isArray(requirements) ? requirements.slice(0, 3).join(", ") : (requirements || "");

    const prompt = `Write a compelling English social media caption for sharing this job opening on ${channel}.

Job: ${title} at ${company}
Location: ${location || "Not specified"}
Type: ${job_type || "Full Time"}
Key requirements: ${reqSnippet || "See listing"}
Apply link: ${apply_link}

Rules:
- Tone: ${tone}
- Include 2-3 relevant emojis
- Include the apply link naturally at the end
- Under ${maxLen} characters total
- Make it unique and attention-grabbing
- AVOID generic openings like "We're hiring" or "Exciting opportunity"
- Start with something creative — a question, bold statement, or hook
- English only
- Do NOT use markdown formatting`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a social media copywriter. Return ONLY the caption text, nothing else." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const caption = result.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ caption }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-job-share-caption error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
