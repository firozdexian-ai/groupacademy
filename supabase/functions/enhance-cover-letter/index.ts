import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { coverLetter, jobTitle, companyName, candidateName, skills } = await req.json();

    console.log("Enhancing cover letter for:", { jobTitle, companyName, candidateName });

    if (!coverLetter) {
      return new Response(
        JSON.stringify({ error: "Cover letter is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const skillsList = Array.isArray(skills) 
      ? skills.slice(0, 10).map((s: any) => typeof s === 'string' ? s : s.name).join(', ')
      : '';

    const systemPrompt = `You are an expert career coach and professional writer. Your task is to enhance cover letters to make them more compelling, professional, and tailored to the specific job.

Guidelines:
- Keep the core message and intent of the original letter
- Improve clarity, professionalism, and impact
- Make it more concise if it's too long
- Add relevant details about the candidate's fit for the role
- Use a confident but not arrogant tone
- Ensure proper formatting with paragraphs
- Keep it between 150-300 words
- Do NOT add placeholder text like [Your Name] - use the actual candidate name if provided
- ALWAYS end the cover letter with "Sincerely," followed by the candidate's actual name on a new line
- If candidate name is provided, use it exactly as given for the signature
- Return ONLY the enhanced cover letter text, no explanations or commentary`;

    const userPrompt = `Please enhance this cover letter for a ${jobTitle || 'job'} position at ${companyName || 'the company'}.

Candidate Name: ${candidateName || 'Not provided'}
Relevant Skills: ${skillsList || 'Not provided'}

Original Cover Letter:
${coverLetter}

Return only the enhanced cover letter text.`;

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to enhance cover letter" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const enhancedCoverLetter = data.choices?.[0]?.message?.content?.trim();

    if (!enhancedCoverLetter) {
      console.error("No content in AI response:", data);
      return new Response(
        JSON.stringify({ error: "Failed to generate enhanced cover letter" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Cover letter enhanced successfully");

    return new Response(
      JSON.stringify({ enhancedCoverLetter }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Error in enhance-cover-letter function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
