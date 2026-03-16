import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image, context } = await req.json();
    
    if (!image) {
      return new Response(JSON.stringify({ error: "Image is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a customer support assistant for GroUp Academy, a career development platform in Bangladesh. The platform offers:

- **Jobs Board**: Job listings with AI matching, external application prep
- **Courses & Learning**: Recorded courses, live sessions, career tracks
- **Mock Interviews**: AI-powered mock interviews with detailed feedback
- **Salary Analysis**: AI salary benchmarking and negotiation advice  
- **Portfolio Building**: Professional portfolio creation service
- **Career Assessment**: AI career readiness scorecard
- **AI Agents**: Specialized career coaches (CV writer, interview coach, etc.)
- **Study Abroad**: University programs, IELTS prep, study roadmaps
- **Gigs & Marketplace**: Earn credits by completing micro-tasks
- **Credits System**: Platform currency for premium services (250 welcome bonus)

Analyze the customer conversation screenshot and provide:

1. **Suggested Reply**: A professional, friendly reply in the same language as the customer's message. Be specific about platform features that address their needs. Include pricing/credit costs if relevant.

2. **Recommended Features**: List 2-4 specific platform features/services to suggest to this customer based on their query.

3. **Tone Analysis**: Brief assessment of the customer's tone/intent (e.g., "Curious about services", "Frustrated with process", "Ready to purchase").

4. **Follow-up Actions**: Any internal actions the admin should take (e.g., "Check if user has enrolled", "Verify payment status", "Send access code").

Format your response as JSON with keys: reply, suggestions (array of strings), tone, actions (array of strings).`;

    const userContent: any[] = [];
    
    // Add the image
    const imageData = image.startsWith("data:") ? image : `data:image/png;base64,${image}`;
    userContent.push({
      type: "image_url",
      image_url: { url: imageData },
    });

    // Add optional context
    const textPrompt = context 
      ? `Additional context from admin: ${context}\n\nAnalyze the conversation screenshot above and provide support suggestions.`
      : "Analyze the conversation screenshot above and provide support suggestions.";
    
    userContent.push({ type: "text", text: textPrompt });

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
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Try to parse as JSON, fallback to raw text
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { reply: content, suggestions: [], tone: "Unknown", actions: [] };
    } catch {
      parsed = { reply: content, suggestions: [], tone: "Unknown", actions: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Support assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
