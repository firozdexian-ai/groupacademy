import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { TEMPLATES } from "../_shared/transactional-email-templates/registry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  template: string; // The key from our TEMPLATES registry
  talent_id: string;
  data?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { template, talent_id, data } = (await req.json()) as EmailRequest;

    // 1. Validate Template
    const templateConfig = TEMPLATES[template];
    if (!templateConfig) throw new Error(`Invalid template: ${template}`);

    // 2. Fetch Talent Details
    const { data: talent, error: talentErr } = await supabaseAdmin
      .from("talents")
      .select("full_name, email")
      .eq("id", talent_id)
      .single();

    if (talentErr || !talent?.email) throw new Error("Talent not found");

    // 3. Prepare Email via Lovable Mail Queue
    // We send via notify.groupacademy.online
    const subject =
      typeof templateConfig.subject === "function" ? templateConfig.subject(data) : templateConfig.subject;

    // Logic for Lovable native queueing
    // Note: This uses the service role to bypass RLS for logging
    const { data: mailData, error: mailError } = await supabaseAdmin.rpc("enqueue_email", {
      recipient: talent.email,
      subject: subject,
      template_name: template,
      template_data: {
        name: talent.full_name || "there",
        ...data,
      },
      from_email: "GroUp Academy <notify@groupacademy.online>",
    });

    if (mailError) throw mailError;

    // 4. Log to internal audit table
    await supabaseAdmin.from("email_send_log").insert({
      talent_id,
      template_name: template,
      recipient: talent.email,
      status: "enqueued",
      metadata: data,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Email Queue Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
