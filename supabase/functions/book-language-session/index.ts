// Book a language session — validates, creates booking, generates Jitsi room
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace("Bearer ", "");
    if (!token) return json({ error: "missing token" }, 401);

    const userClient = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData } = await userClient.auth.getUser(token);
    if (!userData?.user) return json({ error: "unauthorized" }, 401);
    const talentId = userData.user.id;

    const admin = createClient(SUPA_URL, SERVICE_KEY);

    const body = await req.json();
    const instructorUserId = String(body.instructor_user_id || "");
    const language = String(body.language_code || "");
    const scheduledAt = String(body.scheduled_at || "");
    const durationMins = Number(body.duration_mins || 30);
    if (!instructorUserId || !language || !scheduledAt) return json({ error: "missing fields" }, 400);

    const { data: instructor } = await admin
      .from("language_instructors")
      .select("hourly_rate_credits, is_active, teaches_languages")
      .eq("user_id", instructorUserId)
      .maybeSingle();
    if (!instructor || !instructor.is_active) return json({ error: "instructor unavailable" }, 404);
    if (!(instructor.teaches_languages ?? []).includes(language)) {
      return json({ error: "instructor does not teach this language" }, 400);
    }

    const credits = Math.round(((instructor.hourly_rate_credits || 50) * durationMins) / 60);
    const meetUrl = `https://meet.jit.si/grpacademy-${crypto.randomUUID().slice(0, 8)}`;

    const { data: booking, error } = await admin
      .from("language_bookings")
      .insert({
        talent_user_id: talentId,
        instructor_user_id: instructorUserId,
        language_code: language,
        scheduled_at: scheduledAt,
        duration_mins: durationMins,
        credits_spent: credits,
        meet_url: meetUrl,
      })
      .select("*")
      .single();
    if (error) return json({ error: error.message }, 500);

    return json({ ok: true, booking });
  } catch (e: any) {
    return json({ error: e?.message ?? "unknown" }, 500);
  }
});

function json(b: any, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
