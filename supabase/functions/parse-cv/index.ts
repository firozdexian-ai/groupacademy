import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cvText, cvUrl, jobId } = await req.json();
    
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

    const systemPrompt = `You are an expert CV/Resume parser. Extract structured information from the CV text provided.

Return a JSON object with the following structure:
{
  "full_name": "string - full name of the candidate",
  "email": "string - email address",
  "phone": "string - phone number with country code if available",
  "linkedin_url": "string or null - LinkedIn profile URL if mentioned",
  "current_status": "string - one of: studying, job_seeking, employed, business_owner",
  "profile_type": "string - one of: student, early_career, professional, executive",
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
- If a field is not found, use null for strings or empty array for arrays
- For phone numbers, try to include country code (e.g., +880 for Bangladesh)
- Be thorough with skills - extract technical skills, soft skills, languages, tools
- For experience, include internships if mentioned
- Return ONLY valid JSON, no markdown or extra text`;

    const userPrompt = `Parse the following CV and extract all relevant information:

${cvText || 'CV URL provided: ' + cvUrl}

Return the structured JSON data.`;

    console.log('Calling Lovable AI to parse CV...');
    
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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
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

    console.log('CV parsed successfully:', {
      name: parsedData.full_name,
      email: parsedData.email,
      skillsCount: parsedData.skills?.length || 0,
      experienceCount: parsedData.experience?.length || 0
    });

    // Upsert to professionals table
    const professionalData = {
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
      updated_at: new Date().toISOString()
    };

    // Check if professional exists by email
    const { data: existingProfessional } = await supabase
      .from('professionals')
      .select('id')
      .eq('email', parsedData.email)
      .maybeSingle();

    let professional;
    if (existingProfessional) {
      // Update existing professional
      const { data, error } = await supabase
        .from('professionals')
        .update(professionalData)
        .eq('id', existingProfessional.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating professional:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update professional profile', parsed: parsedData }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      professional = data;
      console.log('Updated existing professional:', professional.id);
    } else {
      // Insert new professional
      const { data, error } = await supabase
        .from('professionals')
        .insert(professionalData)
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting professional:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create professional profile', parsed: parsedData }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      professional = data;
      console.log('Created new professional:', professional.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        professional: professional,
        parsed: parsedData
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
