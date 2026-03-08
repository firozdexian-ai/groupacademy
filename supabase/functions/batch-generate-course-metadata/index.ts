import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateMetadata(
  courses: any[],
  supabase: any
): Promise<{ updated: number; skipped: number }> {
  const courseList = courses.map((c: any, i: number) => {
    const moduleTitles = (c.modules || []).map((m: any) => m.title).join(", ");
    return `${i + 1}. Course ID: ${c.id}\n   Title: "${c.title}"\n   Program: "${c.programName}"\n   Level: "${c.levelName || 'General'}"\n   Modules (${c.modules?.length || 0}): ${moduleTitles}\n   Has Description: ${(c.description || "").length > 50 ? "yes" : "no"}\n   Has Objectives: ${c.learning_objectives?.length ? "yes" : "no"}`;
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
          content: `You are an SEO-savvy curriculum designer. For each course, generate:
1. A compelling course description (150-300 words) that highlights what learners will gain, key topics covered, and career relevance. Write for prospective students browsing a course catalog.
2. 4-6 learning objectives as action-oriented statements starting with verbs like "Analyze", "Design", "Implement", "Evaluate", "Create", "Apply".
3. Estimated hours based on the number of modules (roughly 2-4 hours per module depending on complexity).`,
        },
        {
          role: "user",
          content: `Generate metadata for these ${courses.length} courses:\n\n${courseList}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "save_course_metadata",
            description: "Save course descriptions, learning objectives, and estimated hours",
            parameters: {
              type: "object",
              properties: {
                courses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      course_id: { type: "string" },
                      description: { type: "string", description: "150-300 word course overview" },
                      learning_objectives: {
                        type: "array",
                        items: { type: "string" },
                        description: "4-6 action-oriented learning outcomes",
                      },
                      estimated_hours: { type: "number", description: "Total estimated study hours" },
                    },
                    required: ["course_id", "description", "learning_objectives", "estimated_hours"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["courses"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "save_course_metadata" } },
    }),
  });

  clearTimeout(timeout);

  if (!aiResponse.ok) {
    const status = aiResponse.status;
    const text = await aiResponse.text();
    if (status === 429) throw Object.assign(new Error("Rate limited"), { status: 429 });
    if (status === 402) throw Object.assign(new Error("AI credits exhausted"), { status: 402 });
    console.error("AI error:", status, text);
    throw new Error(`AI gateway error: ${status}`);
  }

  const aiData = await aiResponse.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("No tool call in AI response");

  const { courses: generatedCourses } = JSON.parse(toolCall.function.arguments);

  let updated = 0;
  let skipped = 0;

  for (const c of generatedCourses) {
    if (!c.course_id || !c.description) { skipped++; continue; }
    const { error } = await supabase.from("content").update({
      description: c.description,
      learning_objectives: c.learning_objectives,
      estimated_hours: c.estimated_hours,
    }).eq("id", c.course_id);
    if (!error) updated++;
    else { console.error("Update error:", error); skipped++; }
  }

  return { updated, skipped };
}

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
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) throw new Error("Admin access required");

    const { school_id, batch_size = 5 } = await req.json();
    if (!school_id) throw new Error("school_id required");

    const { data: programs } = await supabase
      .from("profession_categories").select("id, name").eq("school_id", school_id);
    if (!programs?.length) return new Response(JSON.stringify({ updated: 0, skipped: 0, remaining: 0, total: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const programIds = programs.map((p: any) => p.id);
    const programMap = Object.fromEntries(programs.map((p: any) => [p.id, p.name]));

    // Get levels for context
    const { data: levels } = await supabase
      .from("profession_levels").select("id, name").in("profession_category_id", programIds);
    const levelMap = Object.fromEntries((levels || []).map((l: any) => [l.id, l.name]));

    const { data: allCourses } = await supabase
      .from("content").select("id, title, description, learning_objectives, estimated_hours, profession_line_id, profession_level_id")
      .in("profession_line_id", programIds).order("created_at", { ascending: true }).limit(1000);
    const totalAll = (allCourses || []).length;

    // Filter courses needing metadata (no description OR no objectives)
    const pendingCourses = (allCourses || []).filter((c: any) =>
      (c.description || "").length < 50 || !c.learning_objectives?.length || !c.estimated_hours
    );

    const batch = pendingCourses.slice(0, batch_size);
    if (batch.length === 0) {
      return new Response(JSON.stringify({ updated: 0, skipped: 0, remaining: 0, total: totalAll }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch modules for each course in batch
    const batchIds = batch.map((c: any) => c.id);
    const { data: modules } = await supabase
      .from("course_modules").select("id, title, content_id").in("content_id", batchIds).order("display_order");

    const modulesByContent: Record<string, any[]> = {};
    for (const m of (modules || [])) {
      if (!modulesByContent[m.content_id]) modulesByContent[m.content_id] = [];
      modulesByContent[m.content_id].push(m);
    }

    const enrichedBatch = batch.map((c: any) => ({
      ...c,
      programName: programMap[c.profession_line_id] || "Unknown",
      levelName: levelMap[c.profession_level_id] || "",
      modules: modulesByContent[c.id] || [],
    }));

    const result = await generateMetadata(enrichedBatch, supabase);

    // Fresh remaining count
    const { data: freshCourses } = await supabase
      .from("content").select("id, description, learning_objectives, estimated_hours")
      .in("profession_line_id", programIds).limit(1000);
    const freshRemaining = (freshCourses || []).filter((c: any) =>
      (c.description || "").length < 50 || !c.learning_objectives?.length || !c.estimated_hours
    ).length;

    return new Response(
      JSON.stringify({ updated: result.updated, skipped: result.skipped, remaining: freshRemaining, total: totalAll }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("batch-generate-course-metadata error:", e);
    const status = e?.status || 500;
    if (status === 429 || status === 402) {
      return new Response(JSON.stringify({ error: e.message, code: status }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
