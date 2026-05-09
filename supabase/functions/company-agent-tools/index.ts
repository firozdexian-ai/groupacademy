// Company Agent Tools — single dispatcher for all company-side agent tool calls.
// Verifies caller, resolves their active company (or company_id sent by runtime),
// runs the requested tool, returns { ok, result, canvas? }.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ToolReq {
  tool_key: string;
  args?: Record<string, unknown>;
  company_id?: string; // optional override from agent-runtime; we still verify membership
}

// ---------- Per-tool argument schemas (Phase Z0 hardening, relaxed) ----------
// We deliberately do NOT enforce uuid() format here — LLMs sometimes pass
// short ids or slugs and the underlying tables/RPCs already validate. We
// only catch obviously bad shapes so the LLM can self-correct on retry.
const idLike = z.string().min(1);
const ToolSchemas: Record<string, z.ZodTypeAny> = {
  create_job: z.object({
    title: z.string().min(2).max(200),
    description: z.string().min(10),
  }).passthrough(),
  publish_job: z.object({ job_id: idLike }).passthrough(),
  list_my_jobs: z.object({ status: z.enum(["all","active","paused","draft"]).optional() }).passthrough(),
  pause_job: z.object({ job_id: idLike }).passthrough(),
  close_job: z.object({ job_id: idLike }).passthrough(),
  get_job_applicants: z.object({ job_id: idLike }).passthrough(),
  move_application_stage: z.object({
    application_id: idLike,
    stage: z.string().min(1),
  }).passthrough(),
  accept_gig_bid: z.object({ bid_id: idLike }).passthrough(),
  search_talent: z.object({}).passthrough(),
  reveal_talent: z.object({ talent_id: idLike }).passthrough(),
  save_to_shortlist: z.object({ talent_id: idLike }).passthrough(),
  list_shortlist: z.object({}).passthrough(),
  get_credit_balance: z.object({}).passthrough(),
  get_ledger: z.object({ days: z.number().int().min(1).max(90).optional() }).passthrough(),
  start_topup: z.object({ amount: z.number().positive() }).passthrough(),
  get_company_profile: z.object({}).passthrough(),
  update_company_profile: z.object({}).passthrough(),
  invite_teammate: z.object({ email: z.string().email() }).passthrough(),
  list_teammates: z.object({}).passthrough(),
  draft_company_post: z.object({ text_content: z.string().min(20).max(2000) }).passthrough(),
  list_pending_drafts: z.object({}).passthrough(),
  publish_company_post: z.object({ draft_id: idLike }).passthrough(),
  discard_company_draft: z.object({ draft_id: idLike }).passthrough(),
};


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return j({ ok: false, error: "UNAUTHORIZED" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return j({ ok: false, error: "UNAUTHORIZED" }, 401);
    const userId = u.user.id;

    const body = (await req.json()) as ToolReq;
    if (!body?.tool_key) return j({ ok: false, error: "tool_key required" }, 400);

    // Resolve company: caller-supplied (verify) OR caller's first active membership
    let companyId = body.company_id ?? null;
    if (companyId) {
      const { data: m } = await admin
        .from("company_members")
        .select("id, role")
        .eq("user_id", userId)
        .eq("company_id", companyId)
        .eq("status", "active")
        .maybeSingle();
      if (!m) return j({ ok: false, error: "NOT_COMPANY_MEMBER" }, 403);
    } else {
      const { data: m } = await admin
        .from("company_members")
        .select("company_id")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!m) return j({ ok: false, error: "NO_COMPANY" }, 403);
      companyId = m.company_id;
    }

    const args = body.args ?? {};
    const schema = ToolSchemas[body.tool_key];
    if (schema) {
      const parsed = schema.safeParse(args);
      if (!parsed.success) {
        return j({ ok: false, error: "BAD_ARGS", tool: body.tool_key, issues: parsed.error.issues }, 400);
      }
    }
    const ctx = { admin, userId, companyId };

    switch (body.tool_key) {
      // --- Riya / jobs ---
      case "create_job":          return j(await create_job(ctx, args));
      case "publish_job":         return j(await publish_job(ctx, args));
      case "list_my_jobs":        return j(await list_my_jobs(ctx, args));
      case "pause_job":           return j(await pause_job(ctx, args));
      case "close_job":           return j(await close_job(ctx, args));
      case "get_job_applicants":  return j(await get_job_applicants(ctx, args));
      case "move_application_stage": return j(await move_application_stage(ctx, args));
      case "accept_gig_bid":      return j(await accept_gig_bid(ctx, args));
      // --- Maya / talent ---
      case "search_talent":       return j(await search_talent(ctx, args));
      case "reveal_talent":       return j(await reveal_talent(ctx, args));
      case "save_to_shortlist":   return j(await save_to_shortlist(ctx, args));
      case "list_shortlist":      return j(await list_shortlist(ctx));
      // --- Bilal / billing ---
      case "get_credit_balance":  return j(await get_credit_balance(ctx));
      case "get_ledger":          return j(await get_ledger(ctx, args));
      case "start_topup":         return j(await start_topup(ctx, args));
      // --- Omar / ops ---
      case "get_company_profile":   return j(await get_company_profile(ctx));
      case "update_company_profile":return j(await update_company_profile(ctx, args));
      case "invite_teammate":       return j(await invite_teammate(ctx, args));
      case "list_teammates":        return j(await list_teammates(ctx));
      // --- Growth / feed ---
      case "draft_company_post":    return j(await draft_company_post(ctx, args));
      case "list_pending_drafts":   return j(await list_pending_drafts(ctx));
      case "publish_company_post":  return j(await publish_company_post(ctx, args));
      case "discard_company_draft": return j(await discard_company_draft(ctx, args));
      default:
        return j({ ok: false, error: `Unknown tool: ${body.tool_key}` }, 400);
    }
  } catch (e: any) {
    console.error("[company-agent-tools] fault", e);
    return j({ ok: false, error: e?.message ?? "TOOL_FAULT" }, 500);
  }
});

function j(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type Ctx = { admin: any; userId: string; companyId: string };

// ===================== Riya / jobs =====================

async function create_job(ctx: Ctx, a: any) {
  const { data: company } = await ctx.admin.from("companies").select("name, logo_url").eq("id", ctx.companyId).single();
  const { data, error } = await ctx.admin.from("jobs").insert({
    title: a.title,
    description: a.description,
    company_id: ctx.companyId,
    company_name: company?.name ?? "Unknown",
    company_logo_url: company?.logo_url ?? null,
    location: a.location ?? null,
    job_type: a.job_type ?? "full_time",
    experience_level: a.experience_level ?? "mid",
    salary_range_min: a.salary_min ?? null,
    salary_range_max: a.salary_max ?? null,
    salary_currency: a.salary_currency ?? "USD",
    requirements: a.required_skills ?? [],
    application_type: a.application_type ?? "internal",
    application_email: a.application_email ?? null,
    application_url: a.application_url ?? null,
    deadline: a.deadline ?? null,
    posted_by: ctx.userId,
    is_active: false, // draft until publish
  }).select("id, title").single();
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    result: { job_id: data.id, status: "draft" },
    canvas: { type: "job_draft", payload: { job_id: data.id } },
    user_message: `Draft created: "${data.title}". Open the canvas to review and publish.`,
  };
}

async function publish_job(ctx: Ctx, a: any) {
  const { data: job } = await ctx.admin.from("jobs").select("id, title, company_id, is_active").eq("id", a.job_id).maybeSingle();
  if (!job || job.company_id !== ctx.companyId) return { ok: false, error: "Job not found" };
  if (job.is_active) return { ok: false, error: "Job is already live" };
  const charge = await ctx.admin.rpc("charge_company_credits", {
    p_company_id: ctx.companyId, p_amount: 5, p_txn_type: "service_usage",
    p_service_type: "job_post", p_description: `Publish job: ${job.title}`, p_reference_id: job.id,
  });
  if (!charge.data?.ok) return { ok: false, error: charge.data?.error ?? "CHARGE_FAILED", balance: charge.data?.balance };
  await ctx.admin.from("jobs").update({ is_active: true }).eq("id", job.id);
  return {
    ok: true, result: { job_id: job.id, status: "active", credits_spent: 5 },
    user_message: `"${job.title}" is now live. 5 credits deducted. New balance: ${charge.data.balance}.`,
  };
}

async function list_my_jobs(ctx: Ctx, a: any) {
  let q = ctx.admin.from("jobs").select("id, title, location, is_active, created_at, deadline").eq("company_id", ctx.companyId).order("created_at", { ascending: false }).limit(20);
  const status = a.status ?? "all";
  if (status === "active") q = q.eq("is_active", true);
  else if (status === "paused" || status === "draft") q = q.eq("is_active", false);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, result: { jobs: data ?? [] }, canvas: { type: "job_list", payload: { jobs: data ?? [] } } };
}

async function pause_job(ctx: Ctx, a: any) {
  const { error } = await ctx.admin.from("jobs").update({ is_active: false }).eq("id", a.job_id).eq("company_id", ctx.companyId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, result: { job_id: a.job_id, status: "paused" } };
}

async function close_job(ctx: Ctx, a: any) {
  const { error } = await ctx.admin.from("jobs").update({ is_active: false, deadline: new Date().toISOString() }).eq("id", a.job_id).eq("company_id", ctx.companyId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, result: { job_id: a.job_id, status: "closed" } };
}

async function get_job_applicants(ctx: Ctx, a: any) {
  const { data, error } = await ctx.admin
    .from("job_applications")
    .select("id, talent_id, created_at, status, talents(id, full_name, country, headline)")
    .eq("job_id", a.job_id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return { ok: false, error: error.message };
  return { ok: true, result: { count: data?.length ?? 0, applicants: data ?? [] } };
}

// ===================== Maya / talent =====================

async function search_talent(ctx: Ctx, a: any) {
  let q = ctx.admin
    .from("talents")
    .select("id, full_name, country, headline, profession, years_experience, skills")
    .order("updated_at", { ascending: false })
    .limit(Math.min(a.limit ?? 10, 25));
  if (a.country) q = q.ilike("country", `%${a.country}%`);
  if (a.profession) q = q.ilike("profession", `%${a.profession}%`);
  if (a.min_experience_years) q = q.gte("years_experience", a.min_experience_years);
  if (a.keywords) q = q.or(`headline.ilike.%${a.keywords}%,profession.ilike.%${a.keywords}%`);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  // Redact: only return first name + initial
  const redacted = (data ?? []).map((t: any) => ({
    id: t.id,
    name_redacted: redactName(t.full_name),
    country: t.country,
    headline: t.headline,
    profession: t.profession,
    years_experience: t.years_experience,
    skills: (t.skills ?? []).slice(0, 6),
  }));
  return {
    ok: true,
    result: { count: redacted.length, talents: redacted },
    canvas: { type: "talent_results", payload: { talents: redacted } },
  };
}

function redactName(name: string | null): string {
  if (!name) return "Candidate";
  const parts = name.trim().split(/\s+/);
  return parts[0] + (parts[1] ? ` ${parts[1][0]}.` : "");
}

async function reveal_talent(ctx: Ctx, a: any) {
  const { data: existing } = await ctx.admin
    .from("company_talent_reveals")
    .select("id")
    .eq("company_id", ctx.companyId)
    .eq("talent_id", a.talent_id)
    .maybeSingle();
  let credits = 0;
  if (!existing) {
    const charge = await ctx.admin.rpc("charge_company_credits", {
      p_company_id: ctx.companyId, p_amount: 5, p_txn_type: "service_usage",
      p_service_type: "talent_reveal", p_description: "Talent contact reveal", p_reference_id: a.talent_id,
    });
    if (!charge.data?.ok) return { ok: false, error: charge.data?.error ?? "CHARGE_FAILED", balance: charge.data?.balance };
    credits = 5;
    await ctx.admin.from("company_talent_reveals").insert({
      company_id: ctx.companyId, talent_id: a.talent_id, revealed_by: ctx.userId, credits_spent: 5,
    });
  }
  const { data: t } = await ctx.admin.from("talents")
    .select("id, full_name, email, phone, country, headline, profession, linkedin_url")
    .eq("id", a.talent_id).maybeSingle();
  if (!t) return { ok: false, error: "Talent not found" };
  return {
    ok: true, result: { talent: t, credits_spent: credits },
    canvas: { type: "talent_card", payload: { talent: t } },
    user_message: credits ? `Revealed. 5 credits deducted.` : `Already revealed earlier — no charge.`,
  };
}

async function save_to_shortlist(ctx: Ctx, a: any) {
  const { error } = await ctx.admin.from("company_talent_shortlists").insert({
    company_id: ctx.companyId, talent_id: a.talent_id, added_by: ctx.userId, note: a.note ?? null,
  });
  if (error && !error.message.includes("duplicate")) return { ok: false, error: error.message };
  return { ok: true, result: { saved: true } };
}

async function list_shortlist(ctx: Ctx) {
  const { data, error } = await ctx.admin
    .from("company_talent_shortlists")
    .select("id, note, created_at, talents(id, full_name, country, headline, profession)")
    .eq("company_id", ctx.companyId)
    .order("created_at", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, result: { shortlist: data ?? [] }, canvas: { type: "shortlist", payload: { items: data ?? [] } } };
}

// ===================== Bilal / billing =====================

async function get_credit_balance(ctx: Ctx) {
  const { data } = await ctx.admin.from("company_credits").select("balance, earned_balance").eq("company_id", ctx.companyId).maybeSingle();
  return { ok: true, result: { balance: Number(data?.balance ?? 0), earned: Number(data?.earned_balance ?? 0) } };
}

async function get_ledger(ctx: Ctx, a: any) {
  const days = Math.min(Math.max(a.days ?? 30, 1), 90);
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await ctx.admin
    .from("company_credit_transactions")
    .select("amount, balance_after, transaction_type, service_type, description, created_at")
    .eq("company_id", ctx.companyId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return { ok: false, error: error.message };
  return { ok: true, result: { days, count: data?.length ?? 0, entries: data ?? [] }, canvas: { type: "ledger", payload: { days, entries: data ?? [] } } };
}

async function start_topup(ctx: Ctx, a: any) {
  const amount = Number(a.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Invalid amount" };
  // Stripe checkout creation is handled by an existing function; we surface the intent + canvas.
  return {
    ok: true,
    result: { amount, checkout_pending: true },
    canvas: { type: "topup", payload: { amount, company_id: ctx.companyId } },
    user_message: `Top-up for ${amount} credits prepared. Confirm in the canvas to proceed to checkout.`,
  };
}

// ===================== Omar / ops =====================

async function get_company_profile(ctx: Ctx) {
  const { data, error } = await ctx.admin.from("companies").select("id, name, website, industry, address, country, about, logo_url, banner_url, linkedin_url, facebook_url, operating_hours, is_verified").eq("id", ctx.companyId).maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "NOT_FOUND" };
  const missing: string[] = [];
  if (!data.about) missing.push("about");
  if (!data.industry) missing.push("industry");
  if (!data.linkedin_url) missing.push("linkedin_url");
  if (!data.banner_url) missing.push("banner_url");
  if (!data.logo_url) missing.push("logo_url");
  if (!data.operating_hours || Object.keys(data.operating_hours ?? {}).length === 0) missing.push("operating_hours");
  return { ok: true, result: { profile: data, missing }, canvas: { type: "company_profile", payload: { profile: data, missing } } };
}

async function update_company_profile(ctx: Ctx, a: any) {
  const allowed = ["website","industry","about","linkedin_url","banner_url","logo_url","address","country","operating_hours"];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (a[k] !== undefined) patch[k] = a[k];
  if (!Object.keys(patch).length) return { ok: false, error: "No fields to update" };
  const { data, error } = await ctx.admin.from("companies").update(patch).eq("id", ctx.companyId).select("*").single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, result: { profile: data, updated_fields: Object.keys(patch) }, canvas: { type: "company_profile", payload: { profile: data, missing: [] } } };
}

async function invite_teammate(ctx: Ctx, a: any) {
  const email = String(a.email ?? "").trim().toLowerCase();
  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) return { ok: false, error: "Invalid email" };
  const role = ["owner","admin","member"].includes(a.role) ? a.role : "member";
  const { error } = await ctx.admin.from("company_members").insert({
    company_id: ctx.companyId, role, status: "invited", invited_email: email,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, result: { invited: email, role }, user_message: `Invitation queued for ${email}. They'll be linked the moment they sign up.` };
}

async function list_teammates(ctx: Ctx) {
  const { data, error } = await ctx.admin.from("company_members")
    .select("id, role, status, invited_email, user_id, created_at")
    .eq("company_id", ctx.companyId)
    .order("created_at", { ascending: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, result: { members: data ?? [] }, canvas: { type: "team", payload: { members: data ?? [] } } };
}

// ===================== Growth / feed =====================

async function draft_company_post(ctx: Ctx, a: any) {
  const text = String(a.text_content ?? "").trim();
  if (text.length < 20) return { ok: false, error: "Post too short (min 20 chars)" };
  if (text.length > 2000) return { ok: false, error: "Post too long (max 2000 chars)" };
  const tags = Array.isArray(a.tags)
    ? a.tags.filter((t: unknown) => typeof t === "string").slice(0, 6)
    : [];
  const { data, error } = await ctx.admin.from("company_post_drafts").insert({
    company_id: ctx.companyId,
    author_user_id: ctx.userId,
    agent_key: a.agent_key ?? "growth",
    text_content: text,
    tags,
    link_url: a.link_url ?? null,
    media_url: a.media_url ?? null,
    status: "pending",
  }).select("id, text_content").single();
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    result: { draft_id: data.id, status: "pending" },
    canvas: { type: "post_draft", payload: { draft_id: data.id, text: data.text_content } },
    user_message: `Draft saved. Open the Feed tab to review and publish.`,
  };
}

async function list_pending_drafts(ctx: Ctx) {
  const { data, error } = await ctx.admin
    .from("company_post_drafts")
    .select("id, text_content, tags, agent_key, created_at, status")
    .eq("company_id", ctx.companyId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return { ok: false, error: error.message };
  return { ok: true, result: { count: data?.length ?? 0, drafts: data ?? [] } };
}

async function publish_company_post(ctx: Ctx, a: any) {
  // Owner-only: verify role
  const { data: m } = await ctx.admin
    .from("company_members")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("company_id", ctx.companyId)
    .eq("status", "active")
    .maybeSingle();
  if (!m || (m.role !== "owner" && m.role !== "admin")) {
    return { ok: false, error: "Only company owners or admins can publish" };
  }

  const { data: draft } = await ctx.admin
    .from("company_post_drafts")
    .select("id, company_id, text_content, tags, link_url, media_url, status")
    .eq("id", a.draft_id)
    .maybeSingle();
  if (!draft || draft.company_id !== ctx.companyId) return { ok: false, error: "Draft not found" };
  if (draft.status !== "pending") return { ok: false, error: `Already ${draft.status}` };

  const { data: company } = await ctx.admin
    .from("companies")
    .select("name, logo_url")
    .eq("id", ctx.companyId)
    .single();

  const { data: post, error: postErr } = await ctx.admin.from("feed_posts").insert({
    author_name: company?.name ?? "Company",
    author_title: "Company",
    author_avatar: company?.logo_url ?? null,
    content_type: "text",
    text_content: draft.text_content,
    tags: draft.tags ?? [],
    link_url: draft.link_url,
    media_url: draft.media_url,
    author_type: "company",
    author_company_id: ctx.companyId,
    author_user_id: ctx.userId,
    status: "published",
    is_active: true,
  }).select("id").single();
  if (postErr) return { ok: false, error: postErr.message };

  await ctx.admin
    .from("company_post_drafts")
    .update({ status: "published", published_post_id: post.id })
    .eq("id", draft.id);

  return {
    ok: true,
    result: { post_id: post.id, draft_id: draft.id },
    user_message: `Published to your company feed.`,
  };
}

async function discard_company_draft(ctx: Ctx, a: any) {
  const { error } = await ctx.admin
    .from("company_post_drafts")
    .update({ status: "discarded" })
    .eq("id", a.draft_id)
    .eq("company_id", ctx.companyId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, result: { draft_id: a.draft_id, status: "discarded" } };
}

// ===================== Phase B3: ATS + Gig acceptance =====================

const PIPELINE_STATUSES = new Set([
  "submitted","sent_to_employer","viewed","shortlisted","rejected","withdrawn","hired",
]);

async function move_application_stage(ctx: Ctx, a: any) {
  const appId = String(a.application_id ?? "").trim();
  const to = String(a.to_status ?? "").trim();
  if (!appId) return { ok: false, error: "application_id required" };
  if (!PIPELINE_STATUSES.has(to)) return { ok: false, error: `Invalid stage: ${to}` };

  // Verify the application belongs to a job in this company.
  const { data: app } = await ctx.admin
    .from("job_applications")
    .select("id, job_id, application_status, jobs!inner(company_id, title)")
    .eq("id", appId)
    .maybeSingle();
  if (!app || (app as any).jobs?.company_id !== ctx.companyId) {
    return { ok: false, error: "Application not found in this company" };
  }
  const from = (app as any).application_status;

  const { error } = await ctx.admin
    .from("job_applications")
    .update({ application_status: to })
    .eq("id", appId);
  if (error) return { ok: false, error: error.message };

  // Best-effort notification (mirrors useEmployerPipeline.move)
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/notify-application-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ application_id: appId, status: to }),
    });
  } catch (_) { /* ignore */ }

  return {
    ok: true,
    result: { application_id: appId, from, to, job_title: (app as any).jobs?.title ?? null },
    user_message: `Moved applicant from "${from}" → "${to}".`,
  };
}

async function accept_gig_bid(ctx: Ctx, a: any) {
  const bidId = String(a.bid_id ?? "").trim();
  if (!bidId) return { ok: false, error: "bid_id required" };

  const { data, error } = await ctx.admin.rpc("accept_gig_bid", {
    p_bid_id: bidId,
    p_company_id: ctx.companyId,
  });
  if (error) return { ok: false, error: error.message };
  if (data && typeof data === "object" && (data as any).ok === false) {
    return { ok: false, error: (data as any).error ?? "ACCEPT_FAILED", balance: (data as any).balance };
  }
  return {
    ok: true,
    result: data ?? { accepted: true, bid_id: bidId },
    user_message: `Bid accepted. Credits escrowed and contract created.`,
  };
}

