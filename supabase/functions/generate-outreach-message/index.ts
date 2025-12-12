import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRODUCT_TEMPLATES = {
  'digital-portfolio': {
    name: 'Digital Portfolio Creation',
    pitch: 'First 1000 FREE professional portfolio websites',
    value: 'BDT 100 value - absolutely FREE',
    cta: 'Reply "PORTFOLIO" to claim your free professional portfolio',
    link: '/portfolio-request',
  },
  'ai-efficiency': {
    name: 'AI Efficiency Accelerator',
    pitch: '6-session live, interactive batch for practical AI adoption',
    value: 'Up to 20% efficiency gains through automation',
    cta: 'Reply "AI" to get the details',
    link: '/courses',
  },
  'career-scorecard': {
    name: 'Career Readiness Scorecard',
    pitch: 'FREE AI-powered career assessment',
    value: 'Identify your career gaps and get personalized recommendations',
    cta: 'Reply "SCORE" to take your free assessment',
    link: '/career-assessment',
  },
  'mock-interview': {
    name: 'AI Mock Interview',
    pitch: 'Practice interviews with AI-powered feedback',
    value: 'Get your selection percentage and improvement tips',
    cta: 'Reply "INTERVIEW" to start your free practice',
    link: '/mock-interview',
  },
  'salary-analysis': {
    name: 'AI Salary Analysis',
    pitch: 'Know your market value before negotiations',
    value: 'Get salary benchmarks and negotiation strategies',
    cta: 'Reply "SALARY" to analyze your worth',
    link: '/salary-analysis',
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { parsedCV, product, professionCategory, senderName, language = 'auto' } = await req.json();
    
    if (!parsedCV || !product) {
      return new Response(
        JSON.stringify({ error: 'parsedCV and product are required' }),
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

    const productTemplate = PRODUCT_TEMPLATES[product as keyof typeof PRODUCT_TEMPLATES];
    if (!productTemplate) {
      return new Response(
        JSON.stringify({ error: 'Invalid product selected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firstName = parsedCV.full_name?.split(' ')[0] || 'there';
    
    // Determine language for message
    let languageInstruction = '';
    if (language === 'bangla') {
      languageInstruction = `
IMPORTANT: Write the ENTIRE message in Bangla (Bengali script). Use natural, conversational Bangla.
- Use appropriate Bangla greetings like "আসসালামু আলাইকুম" or "নমস্কার"
- Use "ভাই" for males or "আপু" for females
- Keep the tone warm and professional in Bangla`;
    } else if (language === 'english') {
      languageInstruction = `
IMPORTANT: Write the ENTIRE message in English only. Use professional but friendly English.
- Use greetings like "Hi" or "Hello"
- Keep the tone warm and professional`;
    } else {
      // Auto-detect based on CV content
      languageInstruction = `
Language Selection: Analyze the CV content to determine the best language:
- If the person appears to be from Bangladesh (based on institutions, companies, phone number with +880), use a mix of English with Bangla greetings ("Bhai/Apu")
- If the CV is entirely in English with international companies/institutions, use professional English
- Default to warm, professional English with Bangla touches for Bangladesh professionals`;
    }
    
    const systemPrompt = `You are an expert at crafting personalized WhatsApp outreach messages for career services.

You will receive:
1. A parsed CV with the candidate's background
2. A product to promote with its key selling points
3. The profession category that best matches this person

${languageInstruction}

Create a warm, personalized WhatsApp message that:
- Opens with a friendly greeting using their first name
- References specific details from their CV (education, experience, skills) to show you've read their profile
- Connects their background to the value proposition of the product
- Highlights pain points they might face in their career stage
- Presents the product as a solution
- Ends with a clear call-to-action

Keep the message:
- Under 500 characters for WhatsApp readability
- Conversational and warm
- Focused on benefits, not features
- Natural, not salesy

Return ONLY the message text, no quotes or formatting.`;

    const userPrompt = `Generate a WhatsApp outreach message for:

**Candidate Profile:**
- Name: ${parsedCV.full_name}
- Profession Category: ${professionCategory || 'Professional'}
- Current Status: ${parsedCV.current_status || 'Not specified'}
- Education: ${JSON.stringify(parsedCV.education?.slice(0, 2) || [])}
- Experience: ${JSON.stringify(parsedCV.experience?.slice(0, 2) || [])}
- Skills: ${(parsedCV.skills || []).slice(0, 10).join(', ')}

**Product to Promote:**
- Name: ${productTemplate.name}
- Pitch: ${productTemplate.pitch}
- Value: ${productTemplate.value}
- CTA: ${productTemplate.cta}

**Sender:** ${senderName || 'GroUp Academy Team'}

Generate the personalized WhatsApp message:`;

    console.log('Generating outreach message for:', parsedCV.full_name, 'Product:', product);
    
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
        JSON.stringify({ error: 'Failed to generate message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    let message = aiData.choices?.[0]?.message?.content?.trim() || '';
    
    // Clean up any quotes
    if (message.startsWith('"') && message.endsWith('"')) {
      message = message.slice(1, -1);
    }

    // Format phone for WhatsApp link
    let phone = parsedCV.phone || '';
    phone = phone.replace(/[\s\-\(\)\+]/g, '');
    if (phone.startsWith('880')) {
      // Already has country code
    } else if (phone.startsWith('0')) {
      phone = '880' + phone.slice(1);
    } else if (phone.length === 10) {
      phone = '880' + phone;
    }

    const whatsappLink = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;

    console.log('Generated outreach message successfully');

    return new Response(
      JSON.stringify({
        success: true,
        name: parsedCV.full_name,
        phone: parsedCV.phone,
        whatsappLink,
        message,
        professionCategory,
        productLink: productTemplate.link,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-outreach-message:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
