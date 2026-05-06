import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return j({ error: "unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return j({ error: "unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return j({ error: "forbidden" }, 403);

    const { item_id, item_type, language_code, payload, source = "ai" } = await req.json();
    if (!item_id || !item_type || !language_code || !payload) {
      return j({ error: "missing fields" }, 400);
    }
    if (!["quiz", "scenario"].includes(item_type)) return j({ error: "bad item_type" }, 400);

    const table = item_type === "quiz" ? "module_quiz_pool" : "module_scenario_pool";
    const { data: item } = await admin.from(table).select("id, options, rubric").eq("id", item_id).maybeSingle();
    if (!item) return j({ error: "item not found" }, 404);

    // Validate
    if (item_type === "quiz" && Array.isArray((item as any).options) && payload.options?.length !== (item as any).options.length) {
      return j({ error: "option count mismatch" }, 422);
    }
    if (item_type === "scenario" && Array.isArray((item as any).rubric) && payload.rubric?.length !== (item as any).rubric.length) {
      return j({ error: "rubric count mismatch" }, 422);
    }

    const { data: upserted, error: upErr } = await admin
      .from("module_item_translations")
      .upsert({
        item_id,
        item_type,
        language_code,
        payload,
        source,
        created_by: user.id,
        reviewed_by: source === "human" ? user.id : null,
        reviewed_at: source === "human" ? new Date().toISOString() : null,
      }, { onConflict: "item_id,item_type,language_code" })
      .select()
      .single();
    if (upErr) return j({ error: upErr.message }, 500);

    await admin.from("module_item_revision_log").insert({
      item_id,
      kind: item_type,
      before: {},
      after: { language_code, payload, source, change_type: "translation" },
      flags_addressed: [],
      applied_by: user.id,
    });

    return j({ ok: true, translation: upserted });
  } catch (e) {
    console.error("ai-item-translate-apply error", e);
    return j({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
