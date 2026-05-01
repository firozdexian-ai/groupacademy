// Phase 7 — Plain-language brief → agent blueprint
// Input: short brief from admin/company/talent. Output: structured proposal
// (name, agent_key, system_prompt, suggested tools, pricing tier hints).
// Uses Lovable AI Gateway with tool calling for guaranteed structured output.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "UNAUTHORIZED" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: ud } = await userClient.auth.getUser();
    if (!ud?.user) return json({ error: "UNAUTHORIZED" }, 401);

    const { brief, audience = "talent" } = await req.json();
    if (!brief || typeof brief !== "string" || brief.length < 10) {
      return json({ error: "Brief too short" }, 400);
    }

    // Load tool catalog so the model only suggests valid tools
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: tools } = await admin
      .from("agent_tools")
      .select("tool_key, name, description, category");

    const toolList = (tools || [])
      .map((t: any) => `- ${t.tool_key} (${t.category}): ${t.description || t.name}`)
      .join("\n");

    const sys = `You are an expert agent designer for the Agent OS platform. Given a plain-language brief, propose a concrete agent configuration. Pick a clear name, write a focused system prompt (under 200 words), choose 3–8 relevant tools from the catalog, and recommend a pricing tier. Be opinionated, not vague.

Audience: ${audience} (talent | company | admin)

Available tool keys:
${toolList || "(none)"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: brief },
        ],
        tools: [{
          type: "function",
          function: {
            name: "propose_agent",
            description: "Return the proposed agent configuration.",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Short, human name (2-4 words)." },
                agent_key: { type: "string", description: "kebab-case unique key, e.g. 'cv-doctor'" },
                description: { type: "string", description: "One-sentence description for cards/lists." },
                system_prompt: { type: "string", description: "The agent's full system prompt. Be specific about role, tone, and boundaries." },
                allowed_tools: {
                  type: "array",
                  items: { type: "string" },
                  description: "Tool keys from the catalog. Choose 3-8.",
                },
                agent_level: { type: "integer", enum: [1, 2, 3], description: "1=basic (cheap), 2=standard, 3=premium." },
                connection_fee: { type: "number", description: "One-time connection fee in credits (typically 1.25 for L1, 2.5 for L2, 5 for L3). Use 0 for free agents." },
                message_credit_cost: { type: "number", description: "Per-message cost (typically 0.5 for L1, 1 for L2, 2 for L3)." },
                category: { type: "string", description: "career | growth | operations | learning | content | wallet | other" },
                rationale: { type: "string", description: "1-2 sentences explaining why these choices fit the brief." },
              },
              required: ["name", "agent_key", "description", "system_prompt", "allowed_tools", "agent_level", "connection_fee", "message_credit_cost", "category", "rationale"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "propose_agent" } },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return json({ error: "Rate limited. Try again in a moment." }, 429);
      if (res.status === 402) return json({ error: "AI workspace out of credits. Top up to continue." }, 402);
      const t = await res.text();
      console.error("blueprint gateway error", res.status, t);
      return json({ error: "Blueprint generation failed" }, 500);
    }

    const data = await res.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      return json({ error: "No proposal returned" }, 500);
    }

    const proposal = JSON.parse(call.function.arguments);
    return json({ proposal });
  } catch (e) {
    console.error("blueprint error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
