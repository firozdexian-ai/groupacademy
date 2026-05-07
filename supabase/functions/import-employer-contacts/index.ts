// Bulk import employer contacts from CSV (admin only) — v2
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimal CSV parser handling quoted fields, embedded commas/newlines, and "" escapes.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cur += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
      else if (c === "\r") { /* skip */ }
      else { cur += c; }
    }
  }
  if (cur.length > 0 || row.length > 0) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(v => v && v.trim().length));
}

function normalizeBdPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  let d = digits;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("880")) {
    // already E.164 BD
  } else if (d.startsWith("0") && d.length === 11) {
    d = "88" + d; // 01XXXXXXXXX -> 8801XXXXXXXXX
  } else if (d.startsWith("1") && d.length === 10) {
    d = "880" + d;
  } else if (d.length === 13 && d.startsWith("8801")) {
    // ok
  } else {
    return null;
  }
  if (!/^8801\d{9}$/.test(d)) return null;
  return d;
}

function isJunkName(name: string): boolean {
  if (!name) return true;
  const t = name.trim();
  if (t.length < 2) return true;
  if (/^\d+$/.test(t)) return true;
  if (/^[^a-zA-Z\u0980-\u09FF]+$/.test(t)) return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const userId = userData?.user?.id;
    if (userErr || !userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const csvText: string = body?.csv ?? "";
    const source: string = body?.source ?? "employer_import_2026_05";
    const dryRun: boolean = !!body?.dry_run;
    if (!csvText || csvText.length < 10) {
      return new Response(JSON.stringify({ error: "csv body required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      return new Response(JSON.stringify({ error: "CSV has no data" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const header = rows[0].map(h => h.trim());
    const idx = (name: string) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());

    const iFirst = idx("First Name");
    const iMiddle = idx("Middle Name");
    const iLast = idx("Last Name");
    const iOrg = idx("Organization Name");
    const iTitle = idx("Organization Title");
    const iEmail1 = idx("E-mail 1 - Value");
    const iPhone1 = idx("Phone 1 - Value");
    const iPhone2 = idx("Phone 2 - Value");
    const iPhone3 = idx("Phone 3 - Value");
    const iNotes = idx("Notes");

    let inserted = 0, updated = 0, skipped = 0;
    const sampleSkipped: { reason: string; raw: string }[] = [];

    // Cache companies by normalized name
    const companyCache = new Map<string, string>();

    async function getOrCreateCompany(rawName: string): Promise<string | null> {
      const name = rawName.trim();
      if (!name) return null;
      const key = name.toLowerCase();
      if (companyCache.has(key)) return companyCache.get(key)!;
      const { data: existing } = await admin.from("companies").select("id").ilike("name", name).limit(1).maybeSingle();
      if (existing?.id) { companyCache.set(key, existing.id); return existing.id; }
      if (dryRun) return "00000000-0000-0000-0000-000000000000";
      const { data: created, error } = await admin.from("companies").insert({
        name,
        country: "Bangladesh",
        source: "employer_csv_import",
      }).select("id").single();
      if (error || !created) return null;
      companyCache.set(key, created.id);
      return created.id;
    }

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const fullName = [row[iFirst], row[iMiddle], row[iLast]].filter(Boolean).map(s => s.trim()).join(" ").trim();
      const orgName = iOrg >= 0 ? (row[iOrg] ?? "").trim() : "";
      const phoneRaw = [row[iPhone1], row[iPhone2], row[iPhone3]].filter(Boolean)[0] ?? "";
      const phone = normalizeBdPhone(phoneRaw);
      const email = iEmail1 >= 0 ? (row[iEmail1] ?? "").trim() || null : null;
      const designation = iTitle >= 0 ? (row[iTitle] ?? "").trim() || null : null;
      const notes = iNotes >= 0 ? (row[iNotes] ?? "").trim() || null : null;

      if (!phone) {
        skipped++;
        if (sampleSkipped.length < 20) sampleSkipped.push({ reason: "invalid_phone", raw: `${fullName} | ${phoneRaw}` });
        continue;
      }
      if (isJunkName(fullName)) {
        skipped++;
        if (sampleSkipped.length < 20) sampleSkipped.push({ reason: "junk_name", raw: `${fullName} | ${phone}` });
        continue;
      }
      if (!orgName) {
        skipped++;
        if (sampleSkipped.length < 20) sampleSkipped.push({ reason: "no_company", raw: `${fullName} | ${phone}` });
        continue;
      }

      const companyId = await getOrCreateCompany(orgName);
      if (!companyId) { skipped++; continue; }
      if (dryRun) { inserted++; continue; }

      // Upsert by whatsapp_number (unique partial index)
      const { data: existingContact } = await admin
        .from("contacts").select("id").eq("whatsapp_number", phone).maybeSingle();

      if (existingContact?.id) {
        await admin.from("contacts").update({
          full_name: fullName,
          email: email ?? undefined,
          designation: designation ?? undefined,
          company_id: companyId,
          phone,
          notes: notes ?? undefined,
          source,
          updated_at: new Date().toISOString(),
        }).eq("id", existingContact.id);
        updated++;
      } else {
        const { error } = await admin.from("contacts").insert({
          full_name: fullName,
          email,
          phone,
          whatsapp_number: phone,
          designation,
          company_id: companyId,
          notes,
          source,
        });
        if (error) {
          skipped++;
          if (sampleSkipped.length < 20) sampleSkipped.push({ reason: "insert_error", raw: error.message });
        } else {
          inserted++;
        }
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      total_rows: rows.length - 1,
      inserted,
      updated,
      skipped,
      dry_run: dryRun,
      sample_skipped: sampleSkipped,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
