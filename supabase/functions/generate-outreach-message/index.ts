import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCT_TEMPLATES = {
  "digital-portfolio": {
    name: "GroUp Academy Digital Portfolio",
    pitch: "First 1000 FREE professional portfolio websites from GroUp Academy",
    value: "Worth $20 - absolutely FREE for a limited time!",
    cta: 'Reply "PORTFOLIO" to claim your free professional portfolio from GroUp Academy',
    link: "/portfolio-request",
  },
  "ai-efficiency": {
    name: "GroUp Academy AI Efficiency Accelerator",
    pitch: "6-session live, interactive batch for practical AI adoption by GroUp Academy",
    value: "Boost your productivity by up to 20% through AI automation",
    cta: 'Reply "AI" to get the course details from GroUp Academy',
    link: "/courses",
  },
  "career-scorecard": {
    name: "GroUp Academy Career Readiness Scorecard",
    pitch: "FREE AI-powered career assessment by GroUp Academy",
    value: "Identify your career gaps and get personalized recommendations",
    cta: 'Reply "SCORE" to take your free assessment with GroUp Academy',
    link: "/career-assessment",
  },
  "mock-interview": {
    name: "GroUp Academy AI Mock Interview",
    pitch: "Practice interviews with AI-powered feedback from GroUp Academy",
    value: "Get your selection percentage and actionable improvement tips",
    cta: 'Reply "INTERVIEW" to start your free practice with GroUp Academy',
    link: "/mock-interview",
  },
  "salary-analysis": {
    name: "GroUp Academy AI Salary Analysis",
    pitch: "Know your market value before negotiations - powered by GroUp Academy",
    value: "Get salary benchmarks and negotiation strategies for Bangladesh market",
    cta: 'Reply "SALARY" to analyze your worth with GroUp Academy',
    link: "/salary-analysis",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. SECURITY: Verify the User
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client to verify user identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse Request
    const { parsedCV, product, professionCategory, senderName, language = "auto" } = await req.json();

    if (!parsedCV || !product) {
      return new Response(JSON.stringify({ error: "parsedCV and product are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productTemplate = PRODUCT_TEMPLATES[product as keyof typeof PRODUCT_TEMPLATES];
    if (!productTemplate) {
      return new Response(JSON.stringify({ error: "Invalid product selected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstName = parsedCV.full_name?.split(" ")[0] || "there";
    const gender = parsedCV.gender || "unknown";

    // Determine appropriate greeting based on gender
    let genderInstruction = "";
    if (gender === "male") {
      genderInstruction = 'Use "ভাই" (Bhai) as the greeting suffix for this male candidate.';
    } else if (gender === "female") {
      genderInstruction = 'Use "আপু" (Apu) as the greeting suffix for this female candidate.';
    } else {
      genderInstruction = "Gender is unknown, so use a neutral greeting without ভাই/আপু suffix.";
    }

    // Determine language for message
    let languageInstruction = "";
    if (language === "bangla") {
      languageInstruction = `
IMPORTANT: Write the ENTIRE message in Bangla (Bengali script). Use natural, conversational Bangla.
- Use appropriate Bangla greetings like "আসসালামু আলাইকুম" or "নমস্কার"
- ${genderInstruction}
- Keep the tone warm and professional in Bangla`;
    } else if (language === "english") {
      languageInstruction = `
IMPORTANT: Write the ENTIRE message in English only. Use professional but friendly English.
- Use greetings like "Hi" or "Hello"
- Keep the tone warm and professional`;
    } else {
      // Auto-detect based on CV content
      languageInstruction = `
Language Selection: Analyze the CV content to determine the best language:
- If the person appears to be from Bangladesh (based on institutions, companies, phone number with +880), use a mix of English with Bangla greetings
- ${genderInstruction}
- If the CV is entirely in English with international companies/institutions, use professional English
- Default to warm, professional English with Bangla touches for Bangladesh professionals`;
    }

    const systemPrompt = `You are a Talent Success Executive at GroUp Academy, Bangladesh's leading AI-powered career acceleration platform. You craft personalized WhatsApp outreach messages for our career services.

You will receive:
1. A parsed CV with the candidate's background
2. A product to promote with its key selling points
3. The profession category that best matches this person
4. The candidate's gender for appropriate greeting

${languageInstruction}

CRITICAL GENDER RULES:
- ${genderInstruction}
- NEVER use "আপু" (Apu) for male candidates
- NEVER use "ভাই" (Bhai) for female candidates
- If gender is "male", you MUST use "ভাই" (Bhai)
- If gender is "female", you MUST use "আপু" (Apu)

Create a warm, personalized WhatsApp message that:
- Opens with a friendly greeting using their first name with the CORRECT gender-appropriate suffix
- Briefly mentions you're reaching out from GroUp Academy
- References 1-2 specific details from their CV (education, company, skills) to show genuine interest
- Connects their background to the value proposition of the product
- Highlights a specific pain point relevant to their career stage
- Presents the GroUp Academy service as the solution
- Ends with a clear, simple call-to-action

Keep the message:
- Under 400 characters for easy WhatsApp reading
- Conversational, warm, and professional
- Focused on their benefit, not features
- Natural and genuine, not salesy
- Include "GroUp Academy" once in the message

Return ONLY the message text, no quotes or formatting.`;

    const userPrompt = `Generate a WhatsApp outreach message for:

**Candidate Profile:**
- Name: ${parsedCV.full_name}
- Gender: ${gender} (${gender === "male" ? "USE ভাই/Bhai" : gender === "female" ? "USE আপু/Apu" : "neutral greeting"})
- Profession Category: ${professionCategory || "Professional"}
- Current Status: ${parsedCV.current_status || "Not specified"}
- Education: ${JSON.stringify(parsedCV.education?.slice(0, 2) || [])}
- Experience: ${JSON.stringify(parsedCV.experience?.slice(0, 2) || [])}
- Skills: ${(parsedCV.skills || []).slice(0, 10).join(", ")}

**Product to Promote:**
- Name: ${productTemplate.name}
- Pitch: ${productTemplate.pitch}
- Value: ${productTemplate.value}
- CTA: ${productTemplate.cta}

**Sender:** ${senderName || "GroUp Academy Team"}

Generate the personalized WhatsApp message:`;

    console.log(`Generating outreach message for user ${user.id} -> ${parsedCV.full_name}`);

    // Add timeout controller for AI call (90 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI service quota exceeded. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Failed to generate message" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let message = aiData.choices?.[0]?.message?.content?.trim() || "";

    // Clean up any quotes
    if (message.startsWith('"') && message.endsWith('"')) {
      message = message.slice(1, -1);
    }

    // Return all phone numbers for selection
    const phoneNumbers = parsedCV.phone_numbers || (parsedCV.phone ? [parsedCV.phone] : []);
    const primaryPhone = parsedCV.phone || phoneNumbers[0] || "";

    // Format phone for WhatsApp link
    let phone = primaryPhone;
    phone = phone.replace(/[\s\-\(\)\+]/g, "");
    if (phone.startsWith("880")) {
      // Already has country code
    } else if (phone.startsWith("0")) {
      phone = "880" + phone.slice(1);
    } else if (phone.length === 10) {
      phone = "880" + phone;
    }

    const whatsappLink = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;

    return new Response(
      JSON.stringify({
        success: true,
        name: parsedCV.full_name,
        phone: primaryPhone,
        phoneNumbers,
        gender,
        whatsappLink,
        message,
        professionCategory,
        productLink: productTemplate.link,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in generate-outreach-message:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
