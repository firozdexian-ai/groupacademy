-- Add phone normalization trigger to talents table
-- This ensures phone numbers are stored in a consistent format

CREATE OR REPLACE FUNCTION public.normalize_talent_phone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only normalize if phone is provided
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    NEW.phone := normalize_phone(NEW.country_code, NEW.phone);
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger (drop first if exists to avoid conflicts)
DROP TRIGGER IF EXISTS tr_normalize_talent_phone ON public.talents;

CREATE TRIGGER tr_normalize_talent_phone
BEFORE INSERT OR UPDATE ON public.talents
FOR EACH ROW
EXECUTE FUNCTION public.normalize_talent_phone();

-- Seed initial feed posts so the feed isn't empty
INSERT INTO public.feed_posts (author_name, author_title, content_type, text_content, tags, is_active, is_pinned) VALUES
  ('GRO10X Team', 'Career Experts', 'tip', 
   '💡 **Resume tip**: Always quantify your achievements. Instead of "Managed a team", write "Led a team of 8 engineers, delivering 3 projects ahead of schedule."

This approach shows impact and makes your experience memorable to recruiters.', 
   ARRAY['CareerTips', 'Resume', 'FreshGraduates'], true, true),
  
  ('GRO10X Team', 'Career Experts', 'announcement', 
   '🎉 **Welcome to your personalized career feed!**

Discover insights, tips, and opportunities tailored for your career journey. Engage with content, vote on polls, and share what inspires you.

Let''s grow together! 🚀', 
   ARRAY['Announcement', 'Welcome'], true, false),
  
  ('GRO10X Team', 'Career Experts', 'poll', 
   'What skill would you like to learn next? Vote and let us know what content you''d find most valuable!', 
   ARRAY['Poll', 'Learning', 'Skills'], true, false),
   
  ('GRO10X Team', 'Career Experts', 'tip', 
   '🎯 **Interview prep tip**: Use the STAR method (Situation, Task, Action, Result) to structure your answers.

Example: "When our project deadline was moved up (Situation), I needed to lead the team to deliver faster (Task). I implemented daily standups and prioritized critical features (Action), resulting in on-time delivery with 95% quality score (Result)."', 
   ARRAY['Interview', 'CareerTips', 'JobSearch'], true, false),
   
  ('GRO10X Team', 'Career Experts', 'news', 
   '📊 **Industry insight**: Remote work opportunities have increased 300% since 2020. Companies are now more open to hiring talent from anywhere.

This is great news for job seekers - your next opportunity might not require relocation!', 
   ARRAY['Industry', 'RemoteWork', 'Trends'], true, false);

-- Update the poll post to include poll options
UPDATE public.feed_posts 
SET poll_options = '[
  {"id": "frontend", "text": "Frontend Development (React, Vue)"},
  {"id": "backend", "text": "Backend Development (Node, Python)"},
  {"id": "data", "text": "Data Science & Analytics"},
  {"id": "ai", "text": "AI & Machine Learning"},
  {"id": "cloud", "text": "Cloud & DevOps"}
]'::jsonb,
poll_ends_at = NOW() + INTERVAL '7 days'
WHERE content_type = 'poll' AND author_name = 'GRO10X Team';