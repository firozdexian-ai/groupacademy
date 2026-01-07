import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simplified gender detection using common name patterns
function detectGender(fullName: string): 'male' | 'female' | 'unknown' {
  if (!fullName) return 'unknown';
  
  const nameParts = fullName.toLowerCase().trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  
  // Common Bangladeshi/Bengali male names (simplified list)
  const maleNames = ['mohammad', 'mohammed', 'md', 'muhammad', 'ahmed', 'ahamed', 'rahman', 'rahim', 
    'hasan', 'hassan', 'hossain', 'hussain', 'kabir', 'karim', 'ali', 'haque', 'islam', 'khan', 
    'emon', 'sami', 'sakib', 'sabbir', 'rafiq', 'rakib', 'rony', 'robin', 'rubel', 'ripon',
    'kamal', 'kamrul', 'kazi', 'khaled', 'khalid', 'aziz', 'azad', 'arif', 'ashraf', 'akash',
    'jahangir', 'jahid', 'jamal', 'jamil', 'nazmul', 'nasir', 'nayeem', 'nabil', 'faruk', 
    'farid', 'fahim', 'faisal', 'mamun', 'masud', 'masum', 'monir', 'mostofa', 'mustafa',
    'tanvir', 'tanzim', 'tarek', 'imran', 'iqbal', 'ismail', 'omar', 'osman', 'selim', 
    'sohel', 'sumon', 'zaman', 'zahid', 'zia', 'yasin', 'yusuf', 'habib', 'hafiz', 'hanif'];
  
  // Common Bangladeshi/Bengali female names (simplified list)
  const femaleNames = ['fatima', 'fathema', 'farzana', 'farjana', 'fahmida', 'fariha', 'ferdousi',
    'tahmina', 'tania', 'tasnim', 'taslima', 'tamanna', 'tanjina', 'tahera', 'nasreen', 'nazneen',
    'nadia', 'nafisa', 'nargis', 'nasima', 'nusrat', 'shamima', 'shirin', 'shila', 'shanta',
    'sharmin', 'sadia', 'sabrina', 'salma', 'samia', 'sultana', 'sumaiya', 'sumona', 'sumi',
    'anika', 'asha', 'asma', 'ayesha', 'afsana', 'afrin', 'akhi', 'amena', 'amina', 'anjum',
    'ruma', 'rubina', 'rahima', 'rashida', 'razia', 'ratna', 'rina', 'riya', 'rumana',
    'khadija', 'khaleda', 'kulsum', 'marium', 'mariam', 'maria', 'mita', 'monira', 'moushumi',
    'jasmine', 'jahanara', 'jannatul', 'hasina', 'halima', 'habiba', 'parveen', 'parvin',
    'laila', 'lima', 'lubna', 'begum', 'bilkis', 'bushra', 'zakia', 'zeba', 'dilruba', 'umme'];
  
  // Check each name part
  for (const part of nameParts) {
    if (maleNames.includes(part)) {
      console.log(`Gender: MALE from name: "${part}"`);
      return 'male';
    }
    if (femaleNames.includes(part)) {
      console.log(`Gender: FEMALE from name: "${part}"`);
      return 'female';
    }
  }
  
  // Pattern-based fallback
  if (firstName.endsWith('ma') || firstName.endsWith('na') || firstName.endsWith('ni') || 
      firstName.endsWith('ti') || firstName.endsWith('ri') || firstName.endsWith('ya')) {
    return 'female';
  }
  if (firstName.endsWith('ul') || firstName.endsWith('ur') || firstName.endsWith('im') ||
      firstName.endsWith('id') || firstName.endsWith('ad') || firstName.endsWith('ir')) {
    return 'male';
  }
  
  return 'unknown';
}

// Profession categories for matching
const PROFESSION_CATEGORIES = [
  { id: 'a1c5d82c-1a1a-4b0e-89e8-19c264a3a915', name: 'Banking & Finance', keywords: ['bank', 'finance', 'accounting', 'audit', 'investment'] },
  { id: 'cd947727-350e-4fd3-813b-0034d4cf208e', name: 'Sales & Distribution', keywords: ['sales', 'distribution', 'retail', 'fmcg'] },
  { id: '5ee052f8-2aaf-45b5-8f90-731c23097fef', name: 'Sales & Marketing', keywords: ['marketing', 'brand', 'digital marketing', 'advertising'] },
  { id: '1e71843c-d202-4d96-834e-04fa6c784f16', name: 'Technology & IT', keywords: ['software', 'developer', 'engineer', 'it', 'programmer', 'data'] },
  { id: 'e5489921-ce14-448b-a017-b762a3b72a8d', name: 'Human Resources', keywords: ['hr', 'human resource', 'recruitment', 'talent'] },
  { id: 'a8c5f269-03bd-4589-954e-51eb1e1fbf32', name: 'Operations & Supply Chain', keywords: ['operations', 'supply chain', 'logistics', 'procurement'] },
  { id: '2c541af4-1cc0-4704-81aa-78df992aad6b', name: 'Healthcare & Pharma', keywords: ['health', 'pharma', 'medical', 'hospital'] },
  { id: 'b4038064-ec0f-4814-a966-ca4c9984bca2', name: 'Other', keywords: [] },
];

function matchProfessionCategory(parsedData: any): string | null {
  const textToSearch = JSON.stringify(parsedData).toLowerCase();
  
  for (const category of PROFESSION_CATEGORIES) {
    if (category.keywords.length === 0) continue;
    const matchCount = category.keywords.filter(kw => textToSearch.includes(kw)).length;
    if (matchCount >= 2) return category.id;
  }
  
  return 'b4038064-ec0f-4814-a966-ca4c9984bca2'; // Default to Other
}

serve(async (req) => {
  // Log immediately at function entry for deployment verification
  console.log('[parse-cv] Function invoked at:', new Date().toISOString());
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { cvText, cvUrl, serviceType } = body;
    
    console.log('[parse-cv] Request received:', { 
      hasCvText: !!cvText, 
      hasCvUrl: !!cvUrl, 
      cvUrlLength: cvUrl?.length,
      serviceType 
    });
    
    if (!cvText && !cvUrl) {
      console.error('[parse-cv] No CV content provided');
      return new Response(
        JSON.stringify({ error: 'Either cvText or cvUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('[parse-cv] LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch CV content from URL if provided
    let actualCvText = cvText || '';
    let pdfBase64: string | null = null;
    
    if (cvUrl && !cvText) {
      console.log('[parse-cv] Fetching CV from URL:', cvUrl);
      try {
        const cvResponse = await fetch(cvUrl);
        if (!cvResponse.ok) {
          console.error('[parse-cv] Failed to fetch CV:', cvResponse.status);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch CV from URL' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const contentType = cvResponse.headers.get('content-type') || '';
        const urlLower = cvUrl.toLowerCase();
        const isPdf = contentType.includes('application/pdf') || urlLower.endsWith('.pdf');
        
        if (isPdf) {
          console.log('[parse-cv] PDF detected, converting to base64');
          const buffer = await cvResponse.arrayBuffer();
          const uint8Array = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          pdfBase64 = btoa(binary);
          actualCvText = 'PDF document attached for analysis.';
          console.log('[parse-cv] PDF converted, base64 size:', pdfBase64.length);
        } else {
          // Try text extraction for other formats
          const buffer = await cvResponse.arrayBuffer();
          const textDecoder = new TextDecoder('utf-8');
          const rawText = textDecoder.decode(buffer);
          
          // Clean up extracted text
          actualCvText = rawText
            .replace(/<[^>]*>/g, ' ')
            .replace(/[^\x20-\x7E\u00A0-\u00FF\u0980-\u09FF\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          console.log('[parse-cv] Text extracted, length:', actualCvText.length);
        }
      } catch (fetchError) {
        console.error('[parse-cv] Error fetching CV:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch CV content' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const systemPrompt = `You are an expert CV/Resume parser. Extract structured information from the CV.

Return a JSON object:
{
  "full_name": "string",
  "email": "string or null",
  "phone": "string",
  "linkedin_url": "string or null",
  "current_status": "studying | job_seeking | employed | business_owner",
  "profile_type": "student | early_career | professional | executive",
  "gender": "male | female | unknown",
  "education": [{ "institution": "string", "degree": "string", "field": "string" }],
  "experience": [{ "company": "string", "title": "string", "duration": "string", "description": "string" }],
  "skills": ["string"],
  "projects": [{ "name": "string", "description": "string" }],
  "achievements": [{ "title": "string", "description": "string" }],
  "certifications": ["string"]
}

Important: Extract ALL information available. Return ONLY valid JSON.`;

    // Build message for AI
    let userMessage: any;
    if (pdfBase64) {
      userMessage = {
        role: 'user',
        content: [
          { type: 'text', text: 'Parse this CV/Resume and extract all information. Return JSON only.' },
          { type: 'image_url', image_url: { url: `data:application/pdf;base64,${pdfBase64}` } }
        ]
      };
    } else {
      userMessage = {
        role: 'user',
        content: `Parse this CV and extract all information:\n\n${actualCvText}\n\nReturn JSON only.`
      };
    }

    console.log('[parse-cv] Calling AI, vision mode:', !!pdfBase64);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    
    let aiResponse: Response | null = null;
    let retryCount = 0;
    
    while (retryCount <= 2) {
      try {
        aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'system', content: systemPrompt }, userMessage],
          }),
          signal: controller.signal,
        });
        
        if (aiResponse.ok) break;
        
        if (aiResponse.status >= 500 && retryCount < 2) {
          console.log(`[parse-cv] AI returned ${aiResponse.status}, retrying...`);
          retryCount++;
          await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
        } else {
          break;
        }
      } catch (fetchErr) {
        if (retryCount >= 2) throw fetchErr;
        retryCount++;
        await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
      }
    }

    clearTimeout(timeoutId);

    if (!aiResponse || !aiResponse.ok) {
      console.error('[parse-cv] AI API failed:', aiResponse?.status);
      return new Response(
        JSON.stringify({ error: 'Failed to parse CV with AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    let parsedContent = aiData.choices?.[0]?.message?.content;
    
    if (!parsedContent) {
      console.error('[parse-cv] Empty AI response');
      return new Response(
        JSON.stringify({ error: 'AI returned empty response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up JSON
    parsedContent = parsedContent.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let parsedData;
    try {
      parsedData = JSON.parse(parsedContent);
    } catch (parseError) {
      console.error('[parse-cv] Failed to parse JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse CV data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Apply reliable gender detection
    const reliableGender = detectGender(parsedData.full_name);
    if (reliableGender !== 'unknown') {
      parsedData.gender = reliableGender;
    }

    console.log('[parse-cv] Parsed successfully:', {
      name: parsedData.full_name,
      email: parsedData.email,
      gender: parsedData.gender,
      skills: parsedData.skills?.length || 0,
      experience: parsedData.experience?.length || 0
    });

    // Match profession category
    const professionCategoryId = matchProfessionCategory(parsedData);

    // Return success without database operations for talent use
    return new Response(
      JSON.stringify({
        success: true,
        parsed: parsedData,
        professionCategoryId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[parse-cv] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
