import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client to verify user identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims?.sub) {
      console.error("Auth error:", claimsError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { cvUrls, batchId } = await req.json();

    if (!cvUrls || !Array.isArray(cvUrls) || cvUrls.length === 0) {
      return new Response(JSON.stringify({ error: "cvUrls array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!batchId) {
      return new Response(JSON.stringify({ error: "batchId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Admin Client for database operations
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Starting batch processing for ${cvUrls.length} CVs, batchId: ${batchId} by user: ${userId}`);

    // Update batch status to processing
    await supabaseAdmin
      .from("batch_uploads")
      .update({ status: "processing", file_count: cvUrls.length, uploaded_by: userId })
      .eq("id", batchId);

    // Process CVs using background task - PASS THE AUTH HEADER
    (globalThis as any).EdgeRuntime?.waitUntil?.(processBatch(supabaseAdmin, cvUrls, batchId, authHeader)) ||
      processBatch(supabaseAdmin, cvUrls, batchId, authHeader);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processing ${cvUrls.length} CVs in background`,
        batchId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Error in batch-parse-cvs:", error);
    return new Response(JSON.stringify({ error: error?.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processBatch(supabase: any, cvUrls: string[], batchId: string, authHeader: string) {
  let processed = 0;
  let skipped = 0;
  let failed = 0;
  const errorLog: any[] = [];
  const NINETY_DAYS_AGO = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  for (const cvUrl of cvUrls) {
    try {
      console.log(`Processing CV: ${cvUrl}`);

      // Call the parse-cv function using the USER'S AUTH TOKEN
      const parseResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/parse-cv`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader, // CRITICAL: Pass the user's token
        },
        body: JSON.stringify({ cvUrl }),
      });

      if (!parseResponse.ok) {
        const errorText = await parseResponse.text();
        console.error(`Failed to parse CV ${cvUrl}:`, errorText);
        failed++;
        errorLog.push({ url: cvUrl, error: errorText });
        continue;
      }

      const parsedData = await parseResponse.json();

      if (parsedData.error) {
        console.error(`Parse error for ${cvUrl}:`, parsedData.error);
        failed++;
        errorLog.push({ url: cvUrl, error: parsedData.error });
        continue;
      }

      const email = parsedData.parsed?.email?.toLowerCase() || parsedData.email?.toLowerCase();

      if (!email) {
        console.log(`No email found in CV: ${cvUrl}`);
        failed++;
        errorLog.push({ url: cvUrl, error: "No email found in CV" });
        continue;
      }

      // Check if talent exists and was recently parsed
      const { data: existingTalent } = await supabase
        .from("talents")
        .select("id, cv_parsed_at")
        .ilike("email", email)
        .single();

      if (existingTalent?.cv_parsed_at && existingTalent.cv_parsed_at > NINETY_DAYS_AGO) {
        console.log(`Skipping ${email} - CV parsed within 90 days`);
        skipped++;
        continue;
      }

      // Prepare talent data (flatten structure if needed)
      const data = parsedData.parsed || parsedData;

      const talentData: any = {
        full_name: data.full_name || email.split("@")[0],
        email: email,
        phone: data.phone || null,
        cv_url: cvUrl,
        cv_text: null, // We don't store the full text for batch uploads
        cv_parsed_at: new Date().toISOString(),
        batch_upload_id: batchId,
        linkedin_url: data.linkedin_url || null,
        current_status: data.current_status || null,
        education: data.education || [],
        experience: data.experience || [],
        skills: data.skills || [],
        projects: data.projects || [],
        achievements: data.achievements || [],
        profession_category_id: parsedData.professionCategoryId || null,
        updated_at: new Date().toISOString(),
      };

      if (existingTalent) {
        // Update existing talent
        const { error: updateError } = await supabase.from("talents").update(talentData).eq("id", existingTalent.id);

        if (updateError) {
          console.error(`Failed to update talent ${email}:`, updateError);
          failed++;
          errorLog.push({ url: cvUrl, email, error: updateError.message });
        } else {
          processed++;
          console.log(`Updated talent: ${email}`);
        }
      } else {
        // Insert new talent
        const { error: insertError } = await supabase.from("talents").insert(talentData);

        if (insertError) {
          console.error(`Failed to insert talent ${email}:`, insertError);
          failed++;
          errorLog.push({ url: cvUrl, email, error: insertError.message });
        } else {
          processed++;
          console.log(`Created talent: ${email}`);
        }
      }

      // Update progress periodically
      if ((processed + skipped + failed) % 5 === 0) {
        await supabase
          .from("batch_uploads")
          .update({
            processed_count: processed,
            skipped_count: skipped,
            failed_count: failed,
            error_log: errorLog,
          })
          .eq("id", batchId);
      }
    } catch (err: any) {
      console.error(`Error processing CV ${cvUrl}:`, err);
      failed++;
      errorLog.push({ url: cvUrl, error: err.message });
    }
  }

  // Final update
  await supabase
    .from("batch_uploads")
    .update({
      status: "completed",
      processed_count: processed,
      skipped_count: skipped,
      failed_count: failed,
      error_log: errorLog,
      completed_at: new Date().toISOString(),
    })
    .eq("id", batchId);

  console.log(`Batch ${batchId} completed: ${processed} processed, ${skipped} skipped, ${failed} failed`);
}
