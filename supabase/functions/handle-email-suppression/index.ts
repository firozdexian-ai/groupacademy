// Placeholder — will be implemented during email migration Phase 2
Deno.serve(async (req) => {
  return new Response(JSON.stringify({ status: "not_implemented" }), {
    status: 501,
    headers: { "Content-Type": "application/json" },
  });
});
