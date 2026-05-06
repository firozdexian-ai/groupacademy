// Review queue: returns SM-2 due topics for the learner across all modules,
// each paired with sampled quiz items biased toward that topic.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DueRow {
  module_id: string;
  content_id: string;
  topic_tag: string;
  mastery: number;
  ease: number;
  interval_days: number;
  due_at: string;
  last_reviewed_at: string | null;
}

interface PoolItem {
  id: string;
  module_id: string;
  question: string;
  options: unknown;
  correct_index: number;
  explanation: string | null;
  difficulty: string | null;
  topic_tags: string[] | null;
}

interface ReviewTopic {
  module_id: string;
  content_id: string;
  topic_tag: string;
  mastery: number;
  ease: number;
  interval_days: number;
  due_at: string;
  last_reviewed_at: string | null;
  module_title?: string | null;
  content_title?: string | null;
  items: Omit<PoolItem, "module_id">[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body.limit ?? 10), 1), 25);
    const itemsPerTopic = Math.min(
      Math.max(Number(body.items_per_topic ?? 4), 1),
      10,
    );
    const moduleId: string | undefined = typeof body.module_id === "string"
      ? body.module_id
      : undefined;
    const includeUpcoming = Boolean(body.include_upcoming ?? false);

    // 1. Pull due (or upcoming) topics for this learner
    let q = supabase
      .from("talent_skill_profile")
      .select(
        "module_id, content_id, topic_tag, mastery, ease, interval_days, due_at, last_reviewed_at",
      )
      .eq("talent_id", user.id)
      .order("due_at", { ascending: true })
      .limit(limit);

    if (!includeUpcoming) {
      q = q.lte("due_at", new Date().toISOString());
    }
    if (moduleId) {
      q = q.eq("module_id", moduleId);
    }

    const { data: dueData, error: dueErr } = await q;
    if (dueErr) {
      return new Response(JSON.stringify({ error: dueErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const due = (dueData ?? []) as DueRow[];
    if (due.length === 0) {
      return new Response(
        JSON.stringify({ topics: [], total_due: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Fetch pool items for involved modules in one query
    const moduleIds = [...new Set(due.map((d) => d.module_id))];
    const { data: poolData, error: poolErr } = await supabase
      .from("module_quiz_pool")
      .select(
        "id, module_id, question, options, correct_index, explanation, difficulty, topic_tags",
      )
      .in("module_id", moduleIds);

    if (poolErr) {
      return new Response(JSON.stringify({ error: poolErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const pool = (poolData ?? []) as PoolItem[];

    // 3. Lookup module + content titles for UX context
    const { data: modulesMeta } = await supabase
      .from("course_modules")
      .select("id, title, content_id")
      .in("id", moduleIds);

    const contentIds = [
      ...new Set((modulesMeta ?? []).map((m) => m.content_id as string)),
    ];
    const { data: contentMeta } = contentIds.length > 0
      ? await supabase
        .from("course_contents")
        .select("id, title")
        .in("id", contentIds)
      : { data: [] as Array<{ id: string; title: string }> };

    const moduleTitleById = new Map<string, string>();
    const moduleContentById = new Map<string, string>();
    for (const m of modulesMeta ?? []) {
      moduleTitleById.set(m.id as string, (m.title as string) ?? "");
      moduleContentById.set(m.id as string, (m.content_id as string) ?? "");
    }
    const contentTitleById = new Map<string, string>();
    for (const c of contentMeta ?? []) {
      contentTitleById.set(c.id as string, (c.title as string) ?? "");
    }

    // 4. For each due topic, sample items biased toward the topic_tag
    const topics: ReviewTopic[] = due.map((d) => {
      const modPool = pool.filter((p) => p.module_id === d.module_id);
      const tagged = modPool.filter((p) =>
        (p.topic_tags ?? []).includes(d.topic_tag)
      );
      const others = modPool.filter((p) =>
        !(p.topic_tags ?? []).includes(d.topic_tag)
      );
      const picked = [
        ...shuffle(tagged).slice(0, itemsPerTopic),
        ...shuffle(others).slice(
          0,
          Math.max(0, itemsPerTopic - Math.min(tagged.length, itemsPerTopic)),
        ),
      ].slice(0, itemsPerTopic);

      const items = picked.map(({ module_id: _m, ...rest }) => rest);

      const contentId = moduleContentById.get(d.module_id) ?? d.content_id;
      return {
        ...d,
        module_title: moduleTitleById.get(d.module_id) ?? null,
        content_title: contentTitleById.get(contentId) ?? null,
        items,
      };
    });

    // 5. Total due count (independent of limit) for badge display
    const { count: totalDueCount } = await supabase
      .from("talent_skill_profile")
      .select("topic_tag", { count: "exact", head: true })
      .eq("talent_id", user.id)
      .lte("due_at", new Date().toISOString());

    return new Response(
      JSON.stringify({
        topics,
        total_due: totalDueCount ?? topics.length,
        now: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
