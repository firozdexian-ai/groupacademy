import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Mode = "description" | "slug" | "image_prompt" | "outline" | "cover_image";

interface Body {
  mode: Mode;
  context: {
    title?: string;
    description?: string;
    content_type?: string;
    profession?: string;
    level?: string;
    cover_prompt?: string;
  };
}

async function callAI(messages: any[], tools?: any[], toolChoice?: any) {
  const body: any = { model: "google/gemini-3-flash-preview", messages };
  if (tools) { body.tools = tools; body.tool_choice = toolChoice; }
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (resp.status === 429 || resp.status === 402) {
    const err = resp.status === 402 ? "AI credits exhausted. Please top up Lovable AI." : "Rate limited, try again shortly.";
    return { error: err, status: resp.status };
  }
  if (!resp.ok) return { error: `AI gateway error ${resp.status}`, status: 500 };
  const data = await resp.json();
  return { data };
}

async function callImage(prompt: string) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-image-preview",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!resp.ok) return { error: `Image gen error ${resp.status}`, status: resp.status };
  const data = await resp.json();
  const url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  return url ? { dataUrl: url } : { error: "No image returned", status: 500 };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { global: { headers: { Authorization: auth } } });
    const { data: u } = await sb.auth.getUser(auth.replace("Bearer ", ""));
    if (!u?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await sb.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body: Body = await req.json();
    const ctx = body.context || {};
    const ctxStr = `Title: ${ctx.title || "(untitled)"}\nType: ${ctx.content_type || "course"}\nProfession: ${ctx.profession || ""}\nLevel: ${ctx.level || ""}\nExisting description: ${ctx.description || "(none)"}`;

    if (body.mode === "description") {
      const r = await callAI([
        { role: "system", content: "You write polished marketing descriptions for online learning products. Output 220-300 chars, no emojis, no markdown, no quotes. Start with the value proposition." },
        { role: "user", content: ctxStr },
      ]);
      if (r.error) return new Response(JSON.stringify({ error: r.error }), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ result: r.data.choices[0].message.content.trim() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body.mode === "slug") {
      const r = await callAI([
        { role: "system", content: "Output ONLY a kebab-case URL slug. 3-6 words, lowercase, hyphens, no punctuation, no quotes." },
        { role: "user", content: `Title: ${ctx.title}\nProfession: ${ctx.profession || ""}` },
      ]);
      if (r.error) return new Response(JSON.stringify({ error: r.error }), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      let slug = r.data.choices[0].message.content.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      // dedup
      const { data: existing } = await sb.from("content").select("id").eq("slug", slug).maybeSingle();
      if (existing) slug = `${slug}-${Math.floor(Math.random() * 900 + 100)}`;
      return new Response(JSON.stringify({ result: slug }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body.mode === "image_prompt") {
      const r = await callAI([
        { role: "system", content: "Generate 3 distinct cover image prompt variations for an online course. Each should be a single descriptive sentence, photorealistic or illustrated style, no text in image. Return JSON only." },
        { role: "user", content: ctxStr },
      ], [{
        type: "function",
        function: {
          name: "image_prompts",
          parameters: {
            type: "object",
            properties: { prompts: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 } },
            required: ["prompts"], additionalProperties: false,
          },
        },
      }], { type: "function", function: { name: "image_prompts" } });
      if (r.error) return new Response(JSON.stringify({ error: r.error }), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const args = JSON.parse(r.data.choices[0].message.tool_calls[0].function.arguments);
      return new Response(JSON.stringify({ result: args.prompts }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body.mode === "cover_image") {
      if (!ctx.cover_prompt) return new Response(JSON.stringify({ error: "cover_prompt required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const img = await callImage(`16:9 cinematic course cover image, no text, no watermark. ${ctx.cover_prompt}`);
      if (img.error) return new Response(JSON.stringify({ error: img.error }), { status: img.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      // upload to storage
      const m = img.dataUrl!.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!m) return new Response(JSON.stringify({ error: "Bad image data" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const bytes = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
      const path = `ai-covers/${crypto.randomUUID()}.png`;
      const { error: upErr } = await sb.storage.from("course-content").upload(path, bytes, { contentType: m[1], upsert: false });
      if (upErr) return new Response(JSON.stringify({ error: upErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: pub } = sb.storage.from("course-content").getPublicUrl(path);
      return new Response(JSON.stringify({ result: pub.publicUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body.mode === "outline") {
      const r = await callAI([
        { role: "system", content: "Draft a course outline of 5-8 modules. Each module: short title (max 8 words) + 1-sentence description. Logical progression from foundation to mastery." },
        { role: "user", content: ctxStr },
      ], [{
        type: "function",
        function: {
          name: "course_outline",
          parameters: {
            type: "object",
            properties: {
              modules: {
                type: "array", minItems: 5, maxItems: 8,
                items: {
                  type: "object",
                  properties: { title: { type: "string" }, description: { type: "string" } },
                  required: ["title", "description"], additionalProperties: false,
                },
              },
            },
            required: ["modules"], additionalProperties: false,
          },
        },
      }], { type: "function", function: { name: "course_outline" } });
      if (r.error) return new Response(JSON.stringify({ error: r.error }), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const args = JSON.parse(r.data.choices[0].message.tool_calls[0].function.arguments);
      return new Response(JSON.stringify({ result: args.modules }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
