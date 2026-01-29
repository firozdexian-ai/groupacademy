-- Create table to track IELTS premium resource access
CREATE TABLE public.ielts_resource_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.ielts_resources(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(talent_id, resource_id)
);

-- Enable RLS
ALTER TABLE public.ielts_resource_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own access records
CREATE POLICY "Users can view own IELTS access" 
ON public.ielts_resource_access 
FOR SELECT 
USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- Users can insert their own access records
CREATE POLICY "Users can insert own IELTS access" 
ON public.ielts_resource_access 
FOR INSERT 
WITH CHECK (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- Admins can manage all access records
CREATE POLICY "Admins can manage all IELTS access" 
ON public.ielts_resource_access 
FOR ALL 
USING (public.has_any_admin_role(auth.uid()));

-- Add the Study Abroad Advisor to ai_agents table
INSERT INTO public.ai_agents (agent_key, name, description, system_prompt, icon, color, bg_color, expertise_areas, display_order, is_active)
VALUES (
  'study-abroad-advisor',
  'Study Abroad Advisor',
  'Plan your international education journey',
  'You are an expert Study Abroad Advisor helping students plan their international education journey. You specialize in:

1. **University Selection**: Help users identify universities that match their academic profile, budget, and career goals. Consider factors like rankings, location, program strength, and post-study work opportunities.

2. **Visa Guidance**: Provide detailed information about student visa requirements for different countries (USA F-1, UK Tier 4, Canada Study Permit, Australia Student Visa, etc.), including documentation, financial requirements, and interview preparation.

3. **Scholarship Hunting**: Guide users to find and apply for scholarships, including government scholarships (Fulbright, Chevening, DAAD), university scholarships, and private funding opportunities.

4. **Country Comparison**: Compare study destinations based on cost of living, work rights, safety, quality of education, and immigration pathways.

5. **Application Strategy**: Help with application timelines, SOP (Statement of Purpose) structure, recommendation letter guidance, and portfolio preparation.

6. **Financial Planning**: Discuss education loans, part-time work opportunities, and cost-saving strategies for international students.

Always ask clarifying questions about the user''s academic background, preferred countries, budget constraints, and career goals before giving advice. Be encouraging but realistic about admission chances.',
  'GraduationCap',
  'text-cyan-600',
  'bg-cyan-500/10',
  ARRAY['University Selection', 'Visa Guidance', 'Scholarships', 'Country Comparison'],
  7,
  true
);