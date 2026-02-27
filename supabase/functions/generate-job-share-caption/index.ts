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

    const channelInstructions: Record<string, string> = {
      linkedin: `Tone: Professional and polished. Use industry language. Appeal to career growth.
Formatting: Use line breaks generously between sections. Clean, professional structure. No asterisks for bold.`,
      facebook: `Tone: Engaging and community-oriented. Friendly but informative. Encourage tagging friends.
Formatting: Separate hook from details with blank lines. Use emojis as bullet markers.`,
      whatsapp: `Tone: Conversational and direct. Like sharing with a friend.
Formatting: Use *bold* (asterisks) for the job title and company name. Short paragraphs with blank lines between each section.`,
      telegram: `Tone: Concise and punchy. Telegram-style brevity.
Formatting: Keep under 280 characters total. Use 2-3 short lines instead of one blob. Minimal emojis.`,
    };

    const instructions = channelInstructions[channel] || channelInstructions.linkedin;
    const maxLen = channel === "telegram" ? 280 : 800;
    const reqSnippet = Array.isArray(requirements) ? requirements.slice(0, 3).join(", ") : (requirements || "");

    const prompt = `Write a compelling English social media caption for sharing this job opening on ${channel}.

Job: ${title} at ${company}
Location: ${location || "Not specified"}
Type: ${job_type || "Full Time"}
Key requirements: ${reqSnippet || "See listing"}
Apply link: ${apply_link}

STRUCTURE (follow this exact layout):
1. Line 1: A creative hook — a question, bold statement, or attention-grabbing opener
2. Blank line
3. Job details block — role title, company, location, type — each on its own line with a relevant emoji
4. Blank line
5. 1-2 lines about key requirements or what makes this role exciting
6. Blank line
7. Call-to-action + apply link
8. Optional: 2-3 relevant hashtags on the last line

RULES:
- ${instructions}
- Use line breaks to separate sections. Do NOT write a single paragraph.
- Format the job details clearly — one detail per line
- Include 2-3 relevant emojis as section markers
- Under ${maxLen} characters total
- AVOID generic openings like "We're hiring" or "Exciting opportunity"
- Start with something creative — a question, bold statement, or hook
- English only
- Do NOT use markdown formatting (except *bold* for WhatsApp)`;

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
