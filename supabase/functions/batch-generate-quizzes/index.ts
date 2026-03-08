import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateQuizzes(
  modules: any[],
  courseMap: Record<string, { title: string; programName: string }>,
  supabase: any
): Promise<{ inserted: number; skipped: number }> {
  const moduleList = modules.map((m: any, i: number) => {
    const course = courseMap[m.content_id] || { title: "Unknown", programName: "Unknown" };
    return `${i + 1}. Module ID: ${m.id}\n   Content ID: ${m.content_id}\n   Course: "${course.title}"\n   Program: "${course.programName}"\n   Module: "${m.title}"\n   Description: ${(m.description || "").slice(0, 300)}`;
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
          content: `You are a professional educator creating multiple-choice quiz questions for an online career academy. For each module, generate exactly 5 MCQ questions that test understanding of the module's key concepts.

Rules:
- Questions should range from foundational recall to applied/analytical thinking
- Each question must have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Include a brief explanation (1-2 sentences) for the correct answer
- Make distractors plausible but clearly wrong
- Questions should be professional and relevant to the career domain`,
        },
        {
          role: "user",
          content: `Generate 5 quiz questions for each of these ${modules.length} modules:\n\n${moduleList}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "save_quiz_questions",
            description: "Save generated quiz questions for course modules",
            parameters: {
              type: "object",
              properties: {
                modules: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      module_id: { type: "string" },
                      content_id: { type: "string" },
                      questions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            question_text: { type: "string" },
                            option_a: { type: "string" },
                            option_b: { type: "string" },
                            option_c: { type: "string" },
                            option_d: { type: "string" },
                            correct_answer: { type: "string", enum: ["A", "B", "C", "D"] },
                            explanation: { type: "string" },
                          },
                          required: ["question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["module_id", "content_id", "questions"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["modules"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "save_quiz_questions" } },
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

  const { modules: generatedModules } = JSON.parse(toolCall.function.arguments);

  let inserted = 0;
  let skipped = 0;

  for (const mod of generatedModules) {
    if (!mod.module_id || !mod.content_id || !mod.questions?.length) { skipped++; continue; }
    
    for (let i = 0; i < mod.questions.length; i++) {
      const q = mod.questions[i];
      const { error } = await supabase.from("quiz_questions").insert({
        module_id: mod.module_id,
        content_id: mod.content_id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        display_order: i + 1,
      });
      if (!error) inserted++;
      else { console.error("Insert error:", error); skipped++; }
    }
  }

  return { inserted, skipped };
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

    const { school_id, batch_size = 3 } = await req.json();
    if (!school_id) throw new Error("school_id required");

    // Get programs → courses → modules without quizzes
    const { data: programs } = await supabase
      .from("profession_categories").select("id, name").eq("school_id", school_id);
    if (!programs?.length) return new Response(JSON.stringify({ inserted: 0, skipped: 0, remaining: 0, total: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const programIds = programs.map((p: any) => p.id);
    const programMap = Object.fromEntries(programs.map((p: any) => [p.id, p.name]));

    const { data: courses } = await supabase
      .from("content").select("id, title, profession_line_id").in("profession_line_id", programIds);
    if (!courses?.length) return new Response(JSON.stringify({ inserted: 0, skipped: 0, remaining: 0, total: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const courseIds = courses.map((c: any) => c.id);
    const courseMap = Object.fromEntries(courses.map((c: any) => [c.id, { title: c.title, programName: programMap[c.profession_line_id] || "Unknown" }]));

    // Get all modules
    const { data: allModules } = await supabase
      .from("course_modules").select("id, title, description, content_id").in("content_id", courseIds).order("created_at", { ascending: true }).limit(1000);
    const totalAll = (allModules || []).length;

    // Get modules that already have quizzes
    const { data: existingQuizModules } = await supabase
      .from("quiz_questions").select("module_id").in("content_id", courseIds);
    const modulesWithQuizzes = new Set((existingQuizModules || []).map((q: any) => q.module_id));

    const pendingModules = (allModules || []).filter((m: any) => !modulesWithQuizzes.has(m.id));
    const batch = pendingModules.slice(0, batch_size);

    if (batch.length === 0) {
      return new Response(JSON.stringify({ inserted: 0, skipped: 0, remaining: 0, total: totalAll }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result = await generateQuizzes(batch, courseMap, supabase);

    // Fresh remaining count
    const { data: freshQuizModules } = await supabase
      .from("quiz_questions").select("module_id").in("content_id", courseIds);
    const freshWithQuizzes = new Set((freshQuizModules || []).map((q: any) => q.module_id));
    const freshRemaining = (allModules || []).filter((m: any) => !freshWithQuizzes.has(m.id)).length;

    return new Response(
      JSON.stringify({ inserted: result.inserted, skipped: result.skipped, remaining: freshRemaining, total: totalAll }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("batch-generate-quizzes error:", e);
    const status = e?.status || 500;
    if (status === 429 || status === 402) {
      return new Response(JSON.stringify({ error: e.message, code: status }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
