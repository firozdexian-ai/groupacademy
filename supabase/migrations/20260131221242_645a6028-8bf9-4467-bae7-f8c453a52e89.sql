-- Create post types enum
CREATE TYPE post_content_type AS ENUM (
  'text', 'poll', 'tip', 'news', 'announcement', 'media'
);

-- Create reaction types enum  
CREATE TYPE reaction_type AS ENUM (
  'like', 'insightful', 'celebrate', 'support'
);

-- Feed posts table
CREATE TABLE public.feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_avatar text,
  author_title text,
  content_type post_content_type NOT NULL DEFAULT 'text',
  text_content text NOT NULL,
  media_url text,
  poll_options jsonb,
  poll_ends_at timestamptz,
  link_url text,
  link_preview jsonb,
  tags text[] DEFAULT '{}',
  is_pinned boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Post reactions table
CREATE TABLE public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES feed_posts(id) ON DELETE CASCADE,
  talent_id uuid REFERENCES talents(id) ON DELETE CASCADE,
  reaction_type reaction_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, talent_id)
);

-- Poll votes table
CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES feed_posts(id) ON DELETE CASCADE,
  talent_id uuid REFERENCES talents(id) ON DELETE CASCADE,
  option_id text NOT NULL,
  voted_at timestamptz DEFAULT now(),
  UNIQUE(post_id, talent_id)
);

-- RLS Policies
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can view active posts
CREATE POLICY "Anyone can view active posts"
  ON feed_posts FOR SELECT
  USING (is_active = true);

-- Admins can manage posts
CREATE POLICY "Admins can manage posts"
  ON feed_posts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view all reactions (for counts)
CREATE POLICY "Anyone can view reactions"
  ON post_reactions FOR SELECT
  USING (true);

-- Users can manage own reactions
CREATE POLICY "Users can manage own reactions"
  ON post_reactions FOR INSERT
  WITH CHECK (talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own reactions"
  ON post_reactions FOR DELETE
  USING (talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid()));

-- Users can vote on polls
CREATE POLICY "Users can vote on polls"
  ON poll_votes FOR INSERT
  WITH CHECK (talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid()));

-- Users can view all poll votes (for results)
CREATE POLICY "Anyone can view poll votes"
  ON poll_votes FOR SELECT
  USING (true);

-- Add indexes for performance
CREATE INDEX idx_feed_posts_active ON feed_posts(is_active, created_at DESC);
CREATE INDEX idx_feed_posts_pinned ON feed_posts(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX idx_poll_votes_post ON poll_votes(post_id);