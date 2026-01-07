import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[health-check] Function invoked');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const checks: Record<string, { status: 'ok' | 'error'; message?: string; latency?: number }> = {};
  
  // Check 1: Database connectivity
  try {
    const startDb = Date.now();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { error } = await supabase.from('talents').select('id').limit(1);
    const latencyDb = Date.now() - startDb;
    
    if (error) {
      checks.database = { status: 'error', message: error.message, latency: latencyDb };
    } else {
      checks.database = { status: 'ok', latency: latencyDb };
    }
  } catch (err) {
    checks.database = { status: 'error', message: err instanceof Error ? err.message : 'Unknown error' };
  }

  // Check 2: AI service availability
  try {
    const startAi = Date.now();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      checks.ai_service = { status: 'error', message: 'LOVABLE_API_KEY not configured' };
    } else {
      // Simple ping to verify API key works (minimal request)
      const response = await fetch('https://ai.gateway.lovable.dev/v1/models', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}` },
      });
      const latencyAi = Date.now() - startAi;
      
      if (response.ok) {
        checks.ai_service = { status: 'ok', latency: latencyAi };
      } else {
        checks.ai_service = { status: 'error', message: `API returned ${response.status}`, latency: latencyAi };
      }
    }
  } catch (err) {
    checks.ai_service = { status: 'error', message: err instanceof Error ? err.message : 'Unknown error' };
  }

  // Check 3: Environment variables
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'LOVABLE_API_KEY'];
  const missingVars = requiredEnvVars.filter(v => !Deno.env.get(v));
  
  if (missingVars.length > 0) {
    checks.environment = { status: 'error', message: `Missing: ${missingVars.join(', ')}` };
  } else {
    checks.environment = { status: 'ok' };
  }

  // Overall status
  const allOk = Object.values(checks).every(c => c.status === 'ok');
  
  return new Response(
    JSON.stringify({
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    }),
    { 
      status: allOk ? 200 : 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});
