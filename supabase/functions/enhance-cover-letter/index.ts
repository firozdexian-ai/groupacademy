import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. SECURITY: Initialize Supabase Client & Verify User
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. LOGIC: Determine Request Type
    const requestData = await req.json();
    const type = requestData.type || "cover_letter"; // Default to cover letter for backward compatibility

    console.log(`Processing AI request: ${type} for user ${user.id}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userPrompt = "";

    // 3. MODE A: Enhance Experience (For Profile Page)
    if (type === "experience") {
      const { experience, profession } = requestData;

      if (!experience || !Array.isArray(experience)) {
        return new Response(JSON.stringify({ error: "Valid experience array is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      systemPrompt = `You are an expert resume writer. Your task is to rewrite work experience descriptions to be impact-driven, professional, and results-oriented.
      
      Guidelines:
      - Use strong action verbs (e.g., "Spearheaded", "Optimized", "Developed").
      - Quantify results where possible (even if estimating).
      - Keep it concise but professional.
      - Maintain the original meaning but make it sound "senior" and competent.
      - Return ONLY a JSON object where keys are the original indices and values are the new descriptions.`;

      userPrompt = `Please enhance these work experience descriptions for a ${profession || "professional"} role.
      
      Input Data:
      ${JSON.stringify(experience.map((exp: any, i: number) => ({ index: i, role: exp.title, task: exp.description })))}
      
      Return strictly a JSON object: { "0": "New Description...", "1": "New Description..." }`;
    }

    // 4. MODE B: Enhance Cover Letter (For Job Application)
    else {
      const { coverLetter, jobTitle, companyName, candidateName, skills } = requestData;

      if (!coverLetter) {
        return new Response(JSON.stringify({ error: "Cover letter is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const skillsList = Array.isArray(skills)
        ? skills
            .slice(0, 10)
            .map((s: any) => (typeof s === "string" ? s : s.name))
            .join(", ")
        : "";

      systemPrompt = `You are an expert career coach. Enhance this cover letter to be compelling and professional.
      
      Guidelines:
      - Improve clarity and impact.
      - Keep it between 150-300 words.
      - Use a confident tone.
      - End with "Sincerely," followed by the name "${candidateName || "Candidate"}".
      - Return ONLY the enhanced text.`;

      userPrompt = `Enhance this cover letter for a ${jobTitle || "job"} at ${companyName || "a company"}.
      
      Skills: ${skillsList}
      
      Original:
      ${coverLetter}`;
    }

    // 5. Call AI Service
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI Gateway Error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content?.trim();

    if (!aiContent) {
      throw new Error("Empty response from AI");
    }

    // 6. Format Response based on Mode
    if (type === "experience") {
      // Parse the JSON response for experience
      try {
        // Sometimes AI wraps JSON in markdown blocks, strip them
        const cleanJson = aiContent
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        const enhancedMap = JSON.parse(cleanJson);

        // Reconstruct the experience array
        const enhancedExperience = requestData.experience.map((exp: any, i: number) => ({
          ...exp,
          description: enhancedMap[i] || exp.description, // Fallback to original if AI missed one
        }));

        return new Response(JSON.stringify({ enhancedExperience }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        console.error("Failed to parse AI JSON response", e);
        // Fallback: Return original if parsing fails
        return new Response(
          JSON.stringify({ enhancedExperience: requestData.experience, warning: "AI response formatting failed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else {
      // Return simple text for cover letter
      return new Response(JSON.stringify({ enhancedCoverLetter: aiContent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error: unknown) {
    console.error("Error in function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
