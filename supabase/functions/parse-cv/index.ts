import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========== HARDCODED NAME-TO-GENDER MAPPING ==========
// Common Bangladeshi/Bengali names for reliable gender detection
const MALE_NAMES = new Set([
  'mohammad', 'mohammed', 'md', 'muhammad', 'ahmed', 'ahamed', 'rahman', 'rahim', 'hasan', 'hassan', 
  'hossain', 'hussain', 'kabir', 'karim', 'ali', 'haque', 'haq', 'islam', 'khan', 'miah', 'mia',
  'emon', 'sami', 'sakib', 'sabit', 'sabbir', 'saber', 'sharif', 'shafiq', 'shohag', 'shimul',
  'rafiq', 'rakib', 'rony', 'robin', 'rubel', 'ripon', 'rajib', 'rajesh', 'raj', 'raju',
  'kamal', 'kamrul', 'kazi', 'kibria', 'khaled', 'khalid', 'khorshed', 'koushik',
  'aziz', 'azad', 'arif', 'ashraf', 'ashik', 'ashfaq', 'akash', 'akter', 'alamin', 'alamgir',
  'billah', 'babul', 'badrul', 'bashar', 'babu', 'bulbul',
  'jahangir', 'jahid', 'jamal', 'jamil', 'jubayer', 'joynal', 'jalal',
  'nazmul', 'nasir', 'nayeem', 'nabil', 'nahid', 'noman', 'nurul',
  'faruk', 'farid', 'farib', 'fahim', 'faisal', 'fazlul', 'firoz', 'foysal',
  'mamun', 'masud', 'masum', 'mizanur', 'minhaj', 'monir', 'mostakim', 'mostofa', 'mustafa', 'mukul',
  'tanvir', 'tanzim', 'tarek', 'tarik', 'tariq', 'touhid', 'tofazzal', 'tushar', 'tuhin',
  'imran', 'ifty', 'iqbal', 'ismail',
  'omar', 'obaidur', 'osman',
  'parvez', 'polash',
  'selim', 'sohel', 'sumon', 'sudip', 'sazzad', 'sajid', 'salim', 'salam', 'saiful', 'sakir',
  'zaman', 'zahid', 'zahir', 'zia', 'zubayer',
  'yasin', 'yusuf', 'younus',
  'habib', 'hafiz', 'hanif', 'helal', 'hemell',
  'liton', 'limon',
  'gazi', 'golam',
  'delwar', 'didar',
  'wazed', 'wahid',
  'victor', 'vicky'
]);

const FEMALE_NAMES = new Set([
  'fatima', 'fathema', 'farzana', 'farjana', 'fahmida', 'fariha', 'farha', 'ferdousi',
  'tahmina', 'tania', 'tasnim', 'taslima', 'tamanna', 'tanjina', 'tanzila', 'tahera',
  'nasreen', 'nazneen', 'nadia', 'nafisa', 'nargis', 'nasima', 'nahida', 'nusrat', 'nipa',
  'shamima', 'shirin', 'shila', 'shanta', 'sharmin', 'sadia', 'sabrina', 'salma', 'samia', 
  'samantha', 'sigma', 'sultana', 'sumaiya', 'sumona', 'sumi', 'shumi', 'swarna',
  'anika', 'asha', 'asma', 'ayesha', 'afsana', 'afrin', 'akhi', 'amena', 'amina', 'anjum', 'anny',
  'rodoshi', 'ruma', 'rubina', 'rahima', 'rashida', 'razia', 'ratna', 'rina', 'riya', 'rumana',
  'khadija', 'khaleda', 'kohinoor', 'kulsum',
  'marium', 'mariam', 'maria', 'mita', 'mitu', 'monira', 'moushumi', 'mukta', 'munni', 'moni',
  'jasmine', 'jahanara', 'jannatul', 'jerin', 'jui', 'julia', 'jhumur',
  'hasina', 'halima', 'habiba', 'hena',
  'parveen', 'parvin', 'poly', 'popy', 'priya', 'puja', 'papiya',
  'laila', 'lata', 'lima', 'lipi', 'lubna', 'lucky',
  'begum', 'bilkis', 'bushra', 'beauty',
  'zakia', 'zeba', 'zerin', 'zinnat',
  'dilruba', 'dalia', 'dina',
  'ishrat', 'israt',
  'umme', 'urmi',
  'yasmeen', 'yasmin',
  'chandni', 'champa',
  'eva', 'elma'
]);

// Function to detect gender from name using hardcoded lists + pattern analysis
function detectGender(fullName: string): 'male' | 'female' | 'unknown' {
  if (!fullName) return 'unknown';
  
  const nameParts = fullName.toLowerCase().trim().split(/\s+/);
  
  // Check each name part against the lists
  for (const part of nameParts) {
    if (MALE_NAMES.has(part)) {
      console.log(`Gender detected as MALE from name part: "${part}"`);
      return 'male';
    }
    if (FEMALE_NAMES.has(part)) {
      console.log(`Gender detected as FEMALE from name part: "${part}"`);
      return 'female';
    }
  }
  
  // Pattern-based fallback for common Bangladeshi name endings
  const firstName = nameParts[0] || '';
  
  // Female patterns (names often end in these)
  if (firstName.endsWith('ma') || firstName.endsWith('na') || firstName.endsWith('ni') || 
      firstName.endsWith('ti') || firstName.endsWith('ri') || firstName.endsWith('mi') ||
      firstName.endsWith('ya') || firstName.endsWith('ka') || firstName.endsWith('ta')) {
    console.log(`Gender inferred as FEMALE from pattern in: "${firstName}"`);
    return 'female';
  }
  
  // Male patterns
  if (firstName.endsWith('ul') || firstName.endsWith('ur') || firstName.endsWith('im') ||
      firstName.endsWith('id') || firstName.endsWith('ad') || firstName.endsWith('ed') ||
      firstName.endsWith('ir') || firstName.endsWith('az') || firstName.endsWith('an') ||
      firstName.endsWith('on') || firstName.endsWith('el')) {
    console.log(`Gender inferred as MALE from pattern in: "${firstName}"`);
    return 'male';
  }
  
  console.log(`Gender UNKNOWN for name: "${fullName}"`);
  return 'unknown';
}

// Profession categories for matching
const PROFESSION_CATEGORIES = [
  { id: 'a1c5d82c-1a1a-4b0e-89e8-19c264a3a915', name: 'Banking & Finance', keywords: ['bank', 'finance', 'accounting', 'audit', 'investment', 'treasury', 'credit'] },
  { id: 'cd947727-350e-4fd3-813b-0034d4cf208e', name: 'Sales & Distribution', keywords: ['sales', 'distribution', 'retail', 'channel', 'fmcg', 'trade'] },
  { id: '5ee052f8-2aaf-45b5-8f90-731c23097fef', name: 'Sales & Marketing', keywords: ['marketing', 'brand', 'digital marketing', 'advertising', 'pr', 'communications'] },
  { id: '1e71843c-d202-4d96-834e-04fa6c784f16', name: 'Technology & IT', keywords: ['software', 'developer', 'engineer', 'it', 'programmer', 'data', 'cloud', 'tech'] },
  { id: 'e5489921-ce14-448b-a017-b762a3b72a8d', name: 'Human Resources', keywords: ['hr', 'human resource', 'recruitment', 'talent', 'training', 'l&d'] },
  { id: 'a8c5f269-03bd-4589-954e-51eb1e1fbf32', name: 'Operations & Supply Chain', keywords: ['operations', 'supply chain', 'logistics', 'procurement', 'warehouse', 'inventory'] },
  { id: '2c541af4-1cc0-4704-81aa-78df992aad6b', name: 'Healthcare & Pharma', keywords: ['health', 'pharma', 'medical', 'hospital', 'doctor', 'nurse', 'clinical'] },
  { id: '30dbc71e-26de-4131-bd97-073e593f9d93', name: 'Student (Undergraduate)', keywords: [] },
  { id: '30e1aff7-a7fa-4bb1-ac5e-d226e4754930', name: 'Student (Graduate/Masters)', keywords: [] },
  { id: '1d65c422-6eef-412c-b843-8ae3d9ac37d5', name: 'Fresh Graduate', keywords: [] },
  { id: 'ba50f709-610e-4770-9d2c-918a39073175', name: 'Career Changer', keywords: [] },
  { id: 'b4038064-ec0f-4814-a966-ca4c9984bca2', name: 'Other', keywords: [] },
];

function matchProfessionCategory(parsedData: any): string | null {
  const textToSearch = JSON.stringify(parsedData).toLowerCase();
  
  // Check profile type for student categories
  if (parsedData.profile_type === 'student') {
    if (parsedData.education?.some((e: any) => e.degree?.toLowerCase().includes('master') || e.degree?.toLowerCase().includes('mba'))) {
      return '30e1aff7-a7fa-4bb1-ac5e-d226e4754930'; // Graduate/Masters
    }
    return '30dbc71e-26de-4131-bd97-073e593f9d93'; // Undergraduate
  }
  
  // Check for fresh graduate
  if (parsedData.current_status === 'job_seeking' && (!parsedData.experience || parsedData.experience.length === 0)) {
    return '1d65c422-6eef-412c-b843-8ae3d9ac37d5'; // Fresh Graduate
  }
  
  // Match by keywords
  for (const category of PROFESSION_CATEGORIES) {
    if (category.keywords.length === 0) continue;
    const matchCount = category.keywords.filter(kw => textToSearch.includes(kw)).length;
    if (matchCount >= 2) {
      return category.id;
    }
  }
  
  // Default to Other if no match
  return 'b4038064-ec0f-4814-a966-ca4c9984bca2';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cvText, cvUrl, jobId, serviceType } = await req.json();
    
    if (!cvText && !cvUrl) {
      return new Response(
        JSON.stringify({ error: 'Either cvText or cvUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // CRITICAL FIX: Actually fetch CV content from URL if provided
    let actualCvText = cvText || '';
    let pdfBase64: string | null = null;
    
    if (cvUrl && !cvText) {
      console.log('Fetching CV content from URL:', cvUrl);
      try {
        const cvResponse = await fetch(cvUrl);
        if (!cvResponse.ok) {
          console.error('Failed to fetch CV from URL:', cvResponse.status);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch CV from URL. Please ensure the URL is publicly accessible.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const contentType = cvResponse.headers.get('content-type') || '';
        const urlLower = cvUrl.toLowerCase();
        
        // Detect file type from URL extension as fallback
        const isPdf = contentType.includes('application/pdf') || urlLower.endsWith('.pdf');
        const isDocx = contentType.includes('application/vnd.openxmlformats') || 
                       contentType.includes('application/msword') ||
                       urlLower.endsWith('.docx') || urlLower.endsWith('.doc');
        const isText = contentType.includes('text/') || contentType.includes('application/json');
        
        if (isPdf) {
          // For PDFs, convert to base64 and send as vision input
          console.log('PDF detected - converting to base64 for vision analysis');
          const buffer = await cvResponse.arrayBuffer();
          const uint8Array = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          pdfBase64 = btoa(binary);
          console.log('PDF converted to base64, size:', pdfBase64.length);
          actualCvText = 'PDF document attached as image for analysis.';
        } else if (isDocx) {
          // For DOCX files, try to extract text content
          console.log('DOCX detected - attempting text extraction');
          const buffer = await cvResponse.arrayBuffer();
          const textDecoder = new TextDecoder('utf-8');
          const rawText = textDecoder.decode(buffer);
          
          // DOCX files contain XML - extract readable text between tags
          const textContent = rawText
            .replace(/<[^>]*>/g, ' ')
            .replace(/&[a-z]+;/gi, ' ')
            .replace(/[^\x20-\x7E\u00A0-\u00FF\u0980-\u09FF\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (textContent.length > 100) {
            actualCvText = textContent;
            console.log('DOCX text extracted, length:', actualCvText.length);
          } else {
            console.log('DOCX text extraction minimal, sending raw content');
            actualCvText = `This is a DOCX document. Please extract information from the following content:\n\n${rawText.substring(0, 50000)}`;
          }
        } else if (isText) {
          actualCvText = await cvResponse.text();
          console.log('Text CV content fetched, length:', actualCvText.length);
        } else {
          // For other document types, try text extraction
          const buffer = await cvResponse.arrayBuffer();
          const textDecoder = new TextDecoder('utf-8');
          const attemptedText = textDecoder.decode(buffer);
          
          const readableChars = attemptedText.replace(/[^\x20-\x7E\n\r\t]/g, '').length;
          const totalChars = attemptedText.length;
          
          if (totalChars > 0 && readableChars / totalChars > 0.3) {
            actualCvText = attemptedText.replace(/[^\x20-\x7E\u00A0-\u00FF\u0980-\u09FF\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
            console.log('Document text extracted, length:', actualCvText.length);
          } else {
            console.log('Binary document with low text ratio - cannot parse as vision');
            return new Response(
              JSON.stringify({ error: 'This document format is not supported. Please upload a PDF or paste the CV text directly.' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (fetchError) {
        console.error('Error fetching CV from URL:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch CV content. Please check the URL or paste CV text directly.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const systemPrompt = `You are an expert CV/Resume parser. Extract structured information from the CV text or document provided.

Return a JSON object with the following structure:
{
  "full_name": "string - full name of the candidate",
  "email": "string or null - email address if found",
  "phone": "string - primary phone number with country code if available",
  "phone_numbers": ["array of all phone numbers found in the CV"],
  "linkedin_url": "string or null - LinkedIn profile URL if mentioned",
  "current_status": "string - one of: studying, job_seeking, employed, business_owner",
  "profile_type": "string - one of: student, early_career, professional, executive",
  "gender": "string - one of: male, female, unknown (infer from name - Bangladeshi/Bengali names: names ending in 'a', 'i', 'ma', 'ni', 'ti' are usually female; common male names include Rahman, Ahmed, Hasan, Kabir, Emon, Sami, Kaies, Aziz, Mohammad; common female names include Tahmina, Samantha, Sigma, Fatima, Anika, Rodoshi)",
  "education": [
    {
      "institution": "string - school/university name",
      "degree": "string - degree type (BSc, MBA, etc.)",
      "field": "string - field of study",
      "start_year": "string - start year",
      "end_year": "string - end year or 'Present'"
    }
  ],
  "experience": [
    {
      "company": "string - company name",
      "title": "string - job title",
      "duration": "string - e.g., '2020-2023' or '2 years'",
      "description": "string - brief description of responsibilities"
    }
  ],
  "skills": ["array of skill names as strings"],
  "projects": [
    {
      "name": "string - project name",
      "description": "string - brief description"
    }
  ],
  "achievements": [
    {
      "title": "string - achievement title",
      "description": "string - brief description"
    }
  ],
  "certifications": ["array of certification names as strings"]
}

Important:
- Extract ALL information available in the CV
- Extract ALL phone numbers found (mobile, home, work) into phone_numbers array
- The "phone" field should be the primary/mobile number
- If a field is not found, use null for strings or empty array for arrays
- For phone numbers, try to include country code (e.g., +880 for Bangladesh)
- Be thorough with skills - extract technical skills, soft skills, languages, tools
- For experience, include internships if mentioned
- For gender, use Bangladeshi/Bengali name patterns to infer - if unsure, use "unknown"
- Return ONLY valid JSON, no markdown or extra text`;

    // Build the user message - either text or multimodal with PDF
    let userMessage: any;
    
    if (pdfBase64) {
      console.log('Sending PDF as vision input to AI');
      userMessage = {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Parse the following CV/Resume document and extract all relevant information. Return the structured JSON data.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:application/pdf;base64,${pdfBase64}`
            }
          }
        ]
      };
    } else {
      userMessage = {
        role: 'user',
        content: `Parse the following CV and extract all relevant information:

${actualCvText}

Return the structured JSON data.`
      };
    }

    console.log('Calling Lovable AI to parse CV, using vision:', !!pdfBase64, 'text length:', actualCvText.length);
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          userMessage
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service quota exceeded. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to parse CV with AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    let parsedContent = aiData.choices?.[0]?.message?.content;
    
    if (!parsedContent) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'AI returned empty response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up JSON if wrapped in markdown
    parsedContent = parsedContent.trim();
    if (parsedContent.startsWith('```json')) {
      parsedContent = parsedContent.slice(7);
    }
    if (parsedContent.startsWith('```')) {
      parsedContent = parsedContent.slice(3);
    }
    if (parsedContent.endsWith('```')) {
      parsedContent = parsedContent.slice(0, -3);
    }
    parsedContent = parsedContent.trim();

    let parsedData;
    try {
      parsedData = JSON.parse(parsedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, parsedContent);
      return new Response(
        JSON.stringify({ error: 'Failed to parse CV data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== RELIABLE GENDER DETECTION ==========
    // First try hardcoded name matching, then fall back to AI detection
    const aiGender = parsedData.gender;
    const reliableGender = detectGender(parsedData.full_name);
    
    // Use hardcoded detection if it found a match, otherwise use AI's guess
    if (reliableGender !== 'unknown') {
      parsedData.gender = reliableGender;
      console.log(`Gender OVERRIDDEN by hardcoded detection: AI said "${aiGender}", using "${reliableGender}"`);
    } else if (aiGender && aiGender !== 'unknown') {
      console.log(`Using AI gender detection: "${aiGender}"`);
    } else {
      parsedData.gender = 'unknown';
      console.log('Gender remains UNKNOWN - no match found');
    }

    console.log('CV parsed successfully:', {
      name: parsedData.full_name,
      email: parsedData.email,
      gender: parsedData.gender,
      genderSource: reliableGender !== 'unknown' ? 'hardcoded' : 'ai',
      phoneNumbers: parsedData.phone_numbers?.length || 0,
      skillsCount: parsedData.skills?.length || 0,
      experienceCount: parsedData.experience?.length || 0
    });

    // Match profession category
    const professionCategoryId = matchProfessionCategory(parsedData);
    console.log('Matched profession category:', professionCategoryId);

    // Skip database insert if no email found - still return parsed data for outreach
    if (!parsedData.email) {
      console.log('No email found in CV - skipping database insert but returning parsed data');
      return new Response(
        JSON.stringify({
          success: true,
          parsed: parsedData,
          professional: null,
          professionCategoryId,
          warning: 'No email found - professional profile not created'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if professional exists by email
    const { data: existingProfessional } = await supabase
      .from('professionals')
      .select('id, services_used')
      .eq('email', parsedData.email)
      .maybeSingle();

    // Build services_used entry
    const serviceEntry = {
      service: serviceType || 'cv_parse',
      date: new Date().toISOString(),
      count: 1
    };

    // Prepare professional data
    const professionalData: any = {
      full_name: parsedData.full_name,
      email: parsedData.email,
      phone: parsedData.phone,
      linkedin_url: parsedData.linkedin_url,
      current_status: parsedData.current_status,
      profile_type: parsedData.profile_type || 'professional',
      education: parsedData.education || [],
      experience: parsedData.experience || [],
      skills: parsedData.skills || [],
      projects: parsedData.projects || [],
      achievements: parsedData.achievements || [],
      cv_url: cvUrl || null,
      profession_category_id: professionCategoryId,
      updated_at: new Date().toISOString()
    };

    let professional;
    if (existingProfessional) {
      // Update services_used array
      const existingServices = (existingProfessional.services_used as any[]) || [];
      const existingServiceIndex = existingServices.findIndex((s: any) => s.service === serviceEntry.service);
      
      if (existingServiceIndex >= 0) {
        existingServices[existingServiceIndex].count = (existingServices[existingServiceIndex].count || 0) + 1;
        existingServices[existingServiceIndex].date = serviceEntry.date;
      } else {
        existingServices.push(serviceEntry);
      }
      
      professionalData.services_used = existingServices;

      // Update existing professional
      const { data, error } = await supabase
        .from('professionals')
        .update(professionalData)
        .eq('id', existingProfessional.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating professional:', error);
        // Still return parsed data even if update fails
        return new Response(
          JSON.stringify({ 
            success: true, 
            parsed: parsedData, 
            professional: null,
            professionCategoryId,
            warning: 'Failed to update professional profile'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      professional = data;
      console.log('Updated existing professional:', professional.id);
    } else {
      // Insert new professional with initial service
      professionalData.services_used = [serviceEntry];
      
      const { data, error } = await supabase
        .from('professionals')
        .insert(professionalData)
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting professional:', error);
        // Still return parsed data even if insert fails
        return new Response(
          JSON.stringify({ 
            success: true, 
            parsed: parsedData, 
            professional: null,
            professionCategoryId,
            warning: 'Failed to create professional profile'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      professional = data;
      console.log('Created new professional:', professional.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        parsed: parsedData,
        professional,
        professionCategoryId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-cv function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
