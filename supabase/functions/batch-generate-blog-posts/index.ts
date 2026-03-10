import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { count = 5, category = "career-advice", topic = "", context = "" } = await req.json();

    const { data: academies } = await supabase.from("academies").select("name, description").eq("is_active", true).limit(10);
    const { data: programs } = await supabase.from("profession_categories").select("name").limit(30);

    const academyContext = (academies || []).map((a: any) => a.name).join(", ");
    const programContext = (programs || []).map((p: any) => p.name).join(", ");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const topicInstruction = topic ? `\n- Focus specifically on: ${topic}` : "";
    const contextInstruction = context ? `\n- Additional context/guidance: ${context}` : "";

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
            content: `You are an SEO content strategist for GroUp Academy, a professional career development platform. Generate unique, high-quality blog posts that provide genuine career advice and industry insights.

Rules:
- Each post should be 600-1000 words in markdown format
- Include practical, actionable advice
- Use a professional but approachable tone
- Generate unique slugs (lowercase, hyphenated)
- Include 3-5 relevant tags
- Write compelling excerpts (150-200 chars)
- Posts should cover diverse career topics across these domains: ${academyContext}
- Programs available: ${programContext}
- Category for all posts: "${category}"
- Author name: "GroUp Academy"${topicInstruction}${contextInstruction}`,
          },
          {
            role: "user",
            content: `Generate ${count} unique SEO-optimized blog posts about career development, industry trends, and professional growth.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_blog_posts",
              description: "Save generated blog posts",
              parameters: {
                type: "object",
                properties: {
                  posts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        slug: { type: "string" },
                        excerpt: { type: "string" },
                        content: { type: "string", description: "Full markdown content" },
                        tags: { type: "array", items: { type: "string" } },
                        category: { type: "string" },
                        reading_time_mins: { type: "number" },
                      },
                      required: ["title", "slug", "excerpt", "content", "tags", "category", "reading_time_mins"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["posts"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_blog_posts" } },
      }),
    });

    clearTimeout(timeout);

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const text = await aiResponse.text();
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      console.error("AI error:", status, text);
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const { posts } = JSON.parse(toolCall.function.arguments);
    let inserted = 0;

    for (const post of posts) {
      const uniqueSlug = `${post.slug}-${Date.now().toString(36)}`;
      const { error } = await supabase.from("blog_posts").insert({
        title: post.title,
        slug: uniqueSlug,
        excerpt: post.excerpt,
        content: post.content,
        tags: post.tags,
        category: post.category,
        reading_time_mins: post.reading_time_mins,
        author_name: "GroUp Academy",
        status: "draft",
      });
      if (!error) inserted++;
      else console.error("Insert error:", error);
    }

    const { count: totalPosts } = await supabase.from("blog_posts").select("id", { count: "exact", head: true });

    return new Response(
      JSON.stringify({ inserted, total_posts: totalPosts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("batch-generate-blog-posts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
