import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseTitle, moduleTitle, programName, levelName } = await req.json();

    if (!courseTitle || !moduleTitle) {
      return new Response(
        JSON.stringify({ error: "courseTitle and moduleTitle are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a curriculum design expert for professional education programs. Your task is to generate a concise content creation guide for a specific course module.

Given the context of the program, level, course, and module, return 5-8 bullet-point talking points that describe what should be covered in this module. Each bullet point should be a clear, actionable topic that a content creator can use to build lessons, videos, or reading materials.

Rules:
- Keep each bullet point to 1-2 sentences max
- Be specific and practical, not vague
- Cover the key concepts, frameworks, tools, or skills relevant to the module topic
- Order from foundational concepts to more advanced/applied ones
- Use bullet points with "•" prefix
- Do NOT include any headers, introductions, or closing remarks — just the bullet points`;

    const userPrompt = `Program: ${programName || "Professional Development"}
Level: ${levelName || "General"}
Course: ${courseTitle}
Module: ${moduleTitle}

Generate the content guide for this module:`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const guide = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ guide }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-module-guide error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
