import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_DESCRIPTION_LENGTH = 500;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Admin access required");

    const { school_id, batch_size = 3, regenerate_all = false } = await req.json();
    if (!school_id) throw new Error("school_id required");

    // Get programs under this school
    const { data: programs } = await supabase
      .from("profession_categories")
      .select("id, name")
      .eq("school_id", school_id);

    if (!programs || programs.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, skipped: 0, remaining: 0, message: "No programs found for this school" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const programIds = programs.map((p: any) => p.id);
    const programMap = Object.fromEntries(programs.map((p: any) => [p.id, p.name]));

    // Get courses for these programs
    const { data: courses } = await supabase
      .from("content")
      .select("id, title, profession_line_id")
      .in("profession_line_id", programIds);

    if (!courses || courses.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, skipped: 0, remaining: 0, message: "No courses found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const courseIds = courses.map((c: any) => c.id);
    const courseMap = Object.fromEntries(courses.map((c: any) => [c.id, { title: c.title, programId: c.profession_line_id }]));

    // Fetch modules
    const { data: allModules } = await supabase
      .from("course_modules")
      .select("id, title, description, content_id")
      .in("content_id", courseIds)
      .order("created_at", { ascending: true })
      .limit(1000);

    // Filter based on threshold (or all if regenerate_all)
    const pendingModules = (allModules || []).filter(
      (m: any) => regenerate_all || (m.description || "").length < MIN_DESCRIPTION_LENGTH
    );

    const shortModules = pendingModules.slice(0, batch_size);
    const totalRemaining = pendingModules.length;

    if (shortModules.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, skipped: 0, remaining: 0, message: "All modules have rich descriptions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build prompt
    const moduleList = shortModules.map((m: any, i: number) => {
      const course = courseMap[m.content_id] || { title: "Unknown", programId: "" };
      const programName = programMap[course.programId] || "Unknown Program";
      return `${i + 1}. Module ID: ${m.id}\n   Course: "${course.title}"\n   Program: "${programName}"\n   Module Title: "${m.title}"`;
    }).join("\n\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a curriculum designer for an online career academy. For each module, generate a rich content guide consisting of 5-7 bullet points. Each bullet point should be a detailed sentence or two that describes a specific concept, framework, technique, or skill the learner will master in this module. 

Format each description as bullet points starting with "• " (bullet character + space). Each bullet should:
- Start with an action verb or topic focus
- Be specific and practical (not generic filler)
- Cover a distinct aspect of the module topic
- Be 1-2 sentences long

The total description should be 500-1500 characters. Focus on what the learner will understand, analyze, apply, or create.

Example format:
• Explain the psychology of visual perception in finance, focusing on how the human brain processes imagery faster than numerical data to establish an immediate emotional connection.
• Identify the core elements of a visual narrative—including setting, protagonist, conflict, and resolution—and how to apply these roles to financial subjects like retirement planning or market volatility.
• Detail the use of composition techniques, such as the Rule of Thirds and leading lines, to direct a viewer's eye toward the most critical data points or calls to action within an image.
• Analyze the symbolic power of metaphors in banking imagery, illustrating how concepts like "liquidity," "growth," and "security" can be represented without relying on literal or cliché stock photos.
• Demonstrate how to select and pair high-quality photography with financial typography to ensure the visual message reinforces the brand's credibility and professionalism.`,
          },
          {
            role: "user",
            content: `Generate rich content guide descriptions for these ${shortModules.length} course modules:\n\n${moduleList}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_descriptions",
              description: "Save generated content guide descriptions for course modules",
              parameters: {
                type: "object",
                properties: {
                  descriptions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        module_id: { type: "string", description: "The UUID of the module" },
                        description: { type: "string", description: "Rich 5-7 bullet point content guide, 500-1500 characters" },
                      },
                      required: ["module_id", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["descriptions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_descriptions" } },
      }),
    });

    clearTimeout(timeout);

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const text = await aiResponse.text();
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please wait and try again.", code: 429 }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please top up.", code: 402 }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI error:", status, text);
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const { descriptions } = JSON.parse(toolCall.function.arguments);

    let updated = 0;
    let skipped = 0;

    for (const item of descriptions) {
      if (!item.module_id || !item.description) {
        skipped++;
        continue;
      }

      // Validation gate: reject descriptions that are too short
      if (item.description.length < MIN_DESCRIPTION_LENGTH) {
        console.warn(`Skipped module ${item.module_id}: description only ${item.description.length} chars (min ${MIN_DESCRIPTION_LENGTH})`);
        skipped++;
        continue;
      }

      const { error: updateError } = await supabase
        .from("course_modules")
        .update({ description: item.description })
        .eq("id", item.module_id);
      if (!updateError) updated++;
      else skipped++;
    }

    return new Response(
      JSON.stringify({
        processed: updated,
        skipped,
        remaining: totalRemaining - updated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("batch-generate-descriptions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
