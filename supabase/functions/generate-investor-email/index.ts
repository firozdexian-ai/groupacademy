import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateEmailRequest {
  investorId: string;
  emailType: "introduction" | "weekly_update" | "special_update";
  newFeedback?: string;
  specialUpdateTopic?: string;
  customInstructions?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { investorId, emailType, newFeedback, specialUpdateTopic, customInstructions } = 
      await req.json() as GenerateEmailRequest;

    // Fetch investor details
    const { data: investor, error: investorError } = await supabase
      .from("ir_investors")
      .select("*, vc_firm:ir_vc_firms(name)")
      .eq("id", investorId)
      .single();

    if (investorError || !investor) {
      throw new Error("Investor not found");
    }

    // Fetch recent interactions
    const { data: interactions } = await supabase
      .from("ir_investor_interactions")
      .select("*")
      .eq("investor_id", investorId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch current metrics
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: credits } = await supabase
      .from("credit_transactions")
      .select("amount")
      .eq("transaction_type", "service_usage")
      .gte("created_at", startOfMonth.toISOString());

    const totalCredits = credits?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
    const mrrUsd = totalCredits * 0.02; // 1 credit = $0.02

    const { count: userCount } = await supabase
      .from("talents")
      .select("*", { count: "exact", head: true });

    // Build context for AI
    const context = {
      investor: {
        name: investor.full_name,
        firm: investor.vc_firm?.name || "Independent",
        interests: investor.investor_interests || [],
        stagePreference: investor.investment_stage_pref,
        relationshipSummary: investor.relationship_summary,
        lastFeedback: investor.last_feedback_summary,
      },
      conversationHistory: interactions?.map((i) => ({
        date: i.created_at,
        type: i.interaction_type,
        subject: i.subject,
        content: i.content?.slice(0, 500),
        sentiment: i.sentiment,
        keyPoints: i.key_points,
      })) || [],
      currentMetrics: {
        mrr: mrrUsd.toFixed(0),
        users: userCount || 0,
        mrrGrowth: "+15%", // TODO: Calculate actual growth
      },
      newFeedback,
      emailType,
      specialUpdateTopic,
      customInstructions,
    };

    // Build the prompt
    const systemPrompt = `You are an expert startup founder writing emails to investors. Write concise, professional, and personalized emails that:
- Reference past conversations and feedback when relevant
- Include specific metrics and progress
- Show genuine engagement with the investor's interests
- Maintain a confident but not arrogant tone
- Keep emails scannable with bullet points for key info
- End with a clear call-to-action when appropriate

Company: GroUp Academy - AI-powered career development platform for emerging markets
Founder: The user (address emails from them)`;

    const userPrompt = `Generate a ${emailType.replace("_", " ")} email for this investor:

INVESTOR CONTEXT:
${JSON.stringify(context.investor, null, 2)}

CONVERSATION HISTORY (recent first):
${JSON.stringify(context.conversationHistory.slice(0, 5), null, 2)}

CURRENT METRICS:
- MRR: $${context.currentMetrics.mrr}
- Users: ${context.currentMetrics.users}
- Growth: ${context.currentMetrics.mrrGrowth} MoM

${newFeedback ? `NEW FEEDBACK TO ADDRESS:\n${newFeedback}\n` : ""}
${specialUpdateTopic ? `SPECIAL UPDATE TOPIC:\n${specialUpdateTopic}\n` : ""}
${customInstructions ? `CUSTOM INSTRUCTIONS:\n${customInstructions}\n` : ""}

Generate the email with:
1. A compelling subject line
2. Personalized greeting
3. Main content appropriate for ${emailType.replace("_", " ")}
4. Professional sign-off

Format your response as JSON:
{
  "subject": "Subject line here",
  "content": "Full email content here"
}`;

    // Call Lovable AI
    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error("Failed to generate email");
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No content generated");
    }

    // Parse the JSON response
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: use the content as-is
        result = {
          subject: `${emailType.replace("_", " ").charAt(0).toUpperCase() + emailType.replace("_", " ").slice(1)} - GroUp Academy`,
          content: aiContent,
        };
      }
    } catch {
      result = {
        subject: `${emailType.replace("_", " ").charAt(0).toUpperCase() + emailType.replace("_", " ").slice(1)} - GroUp Academy`,
        content: aiContent,
      };
    }

    // Log the new feedback as an interaction if provided
    if (newFeedback) {
      await supabase.from("ir_investor_interactions").insert({
        investor_id: investorId,
        interaction_type: "reply_received",
        content: newFeedback,
        subject: "Feedback logged via email composer",
      });

      // Update last_feedback_summary
      await supabase
        .from("ir_investors")
        .update({ last_feedback_summary: newFeedback.slice(0, 500) })
        .eq("id", investorId);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating email:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate email";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
