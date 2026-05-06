import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * GroUp Academy: Neural Pedagogical Orchestrator
 * CTO Reference: Authoritative Edge Function for context-aware academic coaching.
 * Performance: Hierarchical context hydration with streaming event-pipe.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("UNAUTHORIZED_INGRESS");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // HUD: Dual-Client Initialization
    const supabaseAuth = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // PHASE: Identity_Audit
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { messages, professionLineId, contextType, contextId, moduleId, contentId, mode } = await req.json();
    const isCareerCoach = mode === "career_coach";

    // Resolve talent (id + career profile fields for coach mode)
    let talentId: string | null = null;
    let talentRow: any = null;
    try {
      const { data: t } = await supabaseAdmin
        .from("talents")
        .select(
          "id, full_name, current_status, primary_goal, professional_role_id, experience, skills, professional_roles:professional_role_id(name)",
        )
        .eq("user_id", user.id)
        .maybeSingle();
      talentId = t?.id || null;
      talentRow = t || null;
    } catch (_) {}

    // PHASE: Hierarchical_Context_Hydration
    let systemPrompt = "You are a professional academic coach at GroUp Academy.";
    let instructor: any = null;

    if (professionLineId) {
      const { data } = await supabaseAdmin
        .from("ai_instructors")
        .select(
          `*, profession_categories!inner(name, description, schools(name, description, executive_capability_goal))`,
        )
        .eq("profession_line_id", professionLineId)
        .single();

      instructor = data;
      if (instructor) {
        const profession = instructor.profession_categories;
        const school = profession?.schools;

        systemPrompt = `${instructor.system_prompt}
        
        INSTITUTIONAL CONTEXT:
        - Profession: ${profession?.name}
        - School: ${school?.name}
        - Executive Goal: ${school?.executive_capability_goal}
        - Learning Framework: 6-Stage Journey (Orientation to Progress)`;
      }
    }

    // PHASE: Curriculum_KB_Ingress
    if (instructor?.profession_line_id) {
      const { data: courses } = await supabaseAdmin
        .from("content")
        .select("id, title, description, course_modules(title, description)")
        .eq("profession_line_id", instructor.profession_line_id)
        .eq("is_published", true);

      if (courses) {
        const kb = courses
          .map(
            (c) => `## ${c.title}\n${c.description}\nModules: ${c.course_modules.map((m: any) => m.title).join(", ")}`,
          )
          .join("\n\n");
        systemPrompt += `\n\nCURRICULUM KNOWLEDGE BASE:\n${kb.substring(0, 10000)}`;
      }
    }

    // PHASE: Mastery_Context_Injection
    if (talentId) {
      try {
        const { data: ctx } = await supabaseAdmin.rpc("get_tutor_mastery_context", {
          _talent_id: talentId,
          _module_id: moduleId || null,
          _content_id: contentId || null,
        });
        if (ctx) {
          const weak = (ctx.weak_topics || []).map((t: any) => `${t.tag} (${Math.round(t.mastery * 100)}%)`).join(", ") || "none";
          const strong = (ctx.strong_topics || []).map((t: any) => `${t.tag} (${Math.round(t.mastery * 100)}%)`).join(", ") || "none";
          const creds = (ctx.credentials || []).map((c: any) => `${c.tag}:${c.level}`).join(", ") || "none";
          const last = ctx.last_scenario
            ? `${ctx.last_scenario.tag} (${Math.round((ctx.last_scenario.mastery || 0) * 100)}%)`
            : "none";
          systemPrompt += `\n\nLEARNER MASTERY SNAPSHOT (authoritative; use to personalize coaching)
- Weak topics: ${weak}
- Strong topics: ${strong}
- Earned credentials: ${creds}
- Items due for spaced review: ${ctx.due_for_review_count || 0}
- Last scenario: ${last}

Coach toward weak topics first. Reference their wins by name. If they ask "what should I study", recommend the weakest topic and link to /app/talent-mirror. Keep replies concise and actionable.`.slice(0, 1500);
        }
      } catch (e) {
        console.error("mastery context fetch failed", e);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err: any) {
    console.error("[Sentinel] INSTRUCTOR_CHAT_FAULT:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
