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

    const { count = 10, topic = "", context = "" } = await req.json();

    const { data: programs } = await supabase.from("profession_categories").select("name").limit(30);
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
            content: `You are a community manager for GroUp Academy creating engaging social feed posts. Generate diverse posts that mix career tips, motivational content, industry insights, and learning prompts.

Rules:
- Each post should be 50-200 words (social media length)
- Use a mix of content types: tips, questions, insights, announcements
- Include 2-4 relevant hashtag-style tags
- Posts should feel authentic and conversational
- Cover topics across: ${programContext}
- Author name: "GroUp Academy" with title "Career Development Platform"
- Make some posts include questions to drive engagement${topicInstruction}${contextInstruction}`,
          },
          {
            role: "user",
            content: `Generate ${count} diverse community feed posts.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_feed_posts",
              description: "Save generated feed posts",
              parameters: {
                type: "object",
                properties: {
                  posts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text_content: { type: "string" },
                        tags: { type: "array", items: { type: "string" } },
                      },
                      required: ["text_content", "tags"],
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
        tool_choice: { type: "function", function: { name: "save_feed_posts" } },
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
      const { error } = await supabase.from("feed_posts").insert({
        text_content: post.text_content,
        tags: post.tags,
        author_name: "GroUp Academy",
        author_title: "Career Development Platform",
        content_type: "text",
        status: "pending",
        is_active: false,
      });
      if (!error) inserted++;
      else console.error("Insert error:", error);
    }

    const { count: totalPosts } = await supabase.from("feed_posts").select("id", { count: "exact", head: true });

    return new Response(
      JSON.stringify({ inserted, total_posts: totalPosts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("batch-generate-feed-posts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
