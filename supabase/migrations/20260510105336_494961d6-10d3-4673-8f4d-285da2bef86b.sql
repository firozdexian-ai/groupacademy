CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON public.feed_posts(author_user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_scope ON public.content_reports(scope_id);
CREATE INDEX IF NOT EXISTS idx_competition_submissions_comp ON public.competition_submissions(competition_id);