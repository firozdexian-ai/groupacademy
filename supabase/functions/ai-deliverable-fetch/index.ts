// Fetches and summarises external deliverable URLs (figma/github/gdrive) so the verifier sees content.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { url } = await req.json();
    if (!url) throw new Error("url required");
    let raw = "";
    try {
      const r = await fetch(url, { redirect: "follow" });
      raw = (await r.text()).slice(0, 8000);
    } catch (_) { raw = `Could not fetch ${url}`; }

    let summary = raw.slice(0, 600);
    if (LOVABLE_API_KEY) {
      try {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "Summarise the deliverable in ≤120 words. Note medium (figma/github/doc/etc), scope, and any obvious quality flags." },
              { role: "user", content: `URL: ${url}\n\n${raw}` },
            ],
          }),
        });
        const j = await resp.json();
        summary = j?.choices?.[0]?.message?.content || summary;
      } catch (_) {}
    }
    return new Response(JSON.stringify({ summary }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
