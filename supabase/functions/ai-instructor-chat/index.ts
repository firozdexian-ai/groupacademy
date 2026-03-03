import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
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

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client to verify user identity
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. PARSE REQUEST
    const { messages, professionLineId, contextType, contextId, sessionId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 3. LOGIC: Use Service Role for Internal Data Fetching
    // We use the service role here to fetch system prompts which might be restricted
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch AI Instructor details
    let systemPrompt = "You are a helpful career and learning assistant for GroUp Academy.";
    let instructor: any = null;

    if (professionLineId) {
      const { data: instructorData } = await supabaseAdmin
        .from("ai_instructors")
        .select(
          `
          *,
          profession_categories!inner(
            name,
            description,
            schools(name, description, executive_capability_goal)
          )
        `,
        )
        .eq("profession_line_id", professionLineId)
        .single();

      instructor = instructorData;

      if (instructor) {
        const professionLine = instructor.profession_categories;
        // @ts-ignore - Supabase types join handling
        const school = professionLine?.schools;

        // Build context-aware system prompt
        systemPrompt = `${instructor.system_prompt}

PROFESSION LINE CONTEXT:
- Profession: ${professionLine?.name || "General"}
- Description: ${professionLine?.description || ""}
${
  school
    ? `- School: ${school.name}
- School Focus: ${school.description}
- Executive Capability Goal: ${school.executive_capability_goal}`
    : ""
}

EXPERTISE AREAS: ${instructor.expertise_areas?.join(", ") || "General career guidance"}

PERSONA: ${instructor.persona}

IMPORTANT GUIDELINES:
1. Always be encouraging and supportive while being honest about areas for improvement
2. Relate concepts to real-world global market contexts, using diverse international examples
3. For enrolled students asking about course content, provide detailed explanations
4. For general users, provide career guidance and recommend relevant courses
5. Use practical examples from ${professionLine?.name || "the profession"}
6. When discussing skills, reference the 6-stage learning journey: Orientation → Learn → Discuss → Practice → Assess → Progress`;
      }
    }

    // Fetch FULL curriculum knowledge base for the program
    if (instructor?.profession_line_id) {
      const { data: allCourses } = await supabaseAdmin
        .from("content")
        .select("id, title, description")
        .eq("profession_line_id", instructor.profession_line_id)
        .eq("is_published", true)
        .order("display_order");

      if (allCourses && allCourses.length > 0) {
        // Fetch all modules for these courses in one query
        const courseIds = allCourses.map((c: any) => c.id);
        const { data: allModules } = await supabaseAdmin
          .from("course_modules")
          .select("content_id, title, description, display_order")
          .in("content_id", courseIds)
          .order("display_order");

        let curriculumKB = "\n\nFULL CURRICULUM KNOWLEDGE BASE:";
        for (const course of allCourses) {
          curriculumKB += `\n\n## ${course.title}`;
          if (course.description) {
            curriculumKB += `\n${course.description.substring(0, 200)}`;
          }
          const courseModules = (allModules || [])
            .filter((m: any) => m.content_id === course.id)
            .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
          for (const mod of courseModules) {
            curriculumKB += `\n- ${mod.title}`;
            if (mod.description) {
              // Cap each module description to prevent token overflow
              curriculumKB += `: ${mod.description.substring(0, 300)}`;
            }
          }
        }

        // Cap total KB size to ~12000 chars to prevent token overflow
        if (curriculumKB.length > 12000) {
          curriculumKB = curriculumKB.substring(0, 12000) + "\n... (additional modules available)";
        }

        systemPrompt += curriculumKB;
        systemPrompt += "\n\nUse this curriculum knowledge to answer questions about any topic in the program, even if the student is not currently viewing that specific module.";
      }
    }

    // If context is a specific course or module, add that context
    if (contextType === "course" && contextId) {
      const { data: course } = await supabaseAdmin
        .from("content")
        .select("title, description, learning_objectives")
        .eq("id", contextId)
        .single();

      if (course) {
        systemPrompt += `

CURRENT COURSE CONTEXT:
- Course: ${course.title}
- Description: ${course.description || ""}
- Learning Objectives: ${JSON.stringify(course.learning_objectives || [])}

Focus your answers on this course content when the student asks questions about their learning.`;
      }
    }

    if (contextType === "module" && contextId) {
      const { data: moduleData } = await supabaseAdmin
        .from("course_modules")
        .select("title, description, learning_objectives, content_id")
        .eq("id", contextId)
        .single();

      if (moduleData) {
        // Fetch course title separately
        const { data: courseData } = await supabaseAdmin
          .from("content")
          .select("title")
          .eq("id", moduleData.content_id)
          .single();

        systemPrompt += `

CURRENT MODULE CONTEXT:
- Course: ${courseData?.title || "Unknown"}
- Module: ${moduleData.title}
- Description: ${moduleData.description || ""}
- Learning Objectives: ${moduleData.learning_objectives?.join(", ") || ""}

Focus your answers on this specific module content.`;
      }
    }

    console.log(`AI Instructor Chat - User: ${user.id}, Context: ${contextType || "general"}`);

    // Add timeout controller for AI call (90 seconds for streaming)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    // Call Lovable AI Gateway
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service busy or limit reached. Please try again." }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return streaming response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI Instructor chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
