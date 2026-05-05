DROP VIEW IF EXISTS public.v_top_hyped_posts_week;
CREATE VIEW public.v_top_hyped_posts_week WITH (security_invoker = true) AS
SELECT post_id, COUNT(*) AS hypes_week
FROM public.post_hypes
WHERE created_at > now() - interval '7 days'
GROUP BY post_id
ORDER BY hypes_week DESC
LIMIT 10;