CREATE OR REPLACE FUNCTION public.get_feed_engagement(_post_ids uuid[], _talent_id uuid DEFAULT NULL)
RETURNS TABLE (
  post_id uuid,
  reaction_counts jsonb,
  user_reaction text,
  poll_counts jsonb,
  user_vote text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH posts AS (
    SELECT unnest(_post_ids) AS post_id
  ),
  reactions AS (
    SELECT
      r.post_id,
      jsonb_object_agg(r.reaction_type, r.cnt) AS counts
    FROM (
      SELECT post_id, reaction_type::text AS reaction_type, COUNT(*)::int AS cnt
      FROM public.post_reactions
      WHERE post_id = ANY(_post_ids)
      GROUP BY post_id, reaction_type
    ) r
    GROUP BY r.post_id
  ),
  user_reactions AS (
    SELECT post_id, reaction_type::text AS reaction_type
    FROM public.post_reactions
    WHERE post_id = ANY(_post_ids) AND _talent_id IS NOT NULL AND talent_id = _talent_id
  ),
  polls AS (
    SELECT
      pv.post_id,
      jsonb_object_agg(pv.option_id, pv.cnt) AS counts
    FROM (
      SELECT post_id, option_id, COUNT(*)::int AS cnt
      FROM public.poll_votes
      WHERE post_id = ANY(_post_ids)
      GROUP BY post_id, option_id
    ) pv
    GROUP BY pv.post_id
  ),
  user_votes AS (
    SELECT post_id, option_id
    FROM public.poll_votes
    WHERE post_id = ANY(_post_ids) AND _talent_id IS NOT NULL AND talent_id = _talent_id
  )
  SELECT
    p.post_id,
    COALESCE(r.counts, '{}'::jsonb) AS reaction_counts,
    ur.reaction_type AS user_reaction,
    COALESCE(pl.counts, '{}'::jsonb) AS poll_counts,
    uv.option_id AS user_vote
  FROM posts p
  LEFT JOIN reactions r ON r.post_id = p.post_id
  LEFT JOIN user_reactions ur ON ur.post_id = p.post_id
  LEFT JOIN polls pl ON pl.post_id = p.post_id
  LEFT JOIN user_votes uv ON uv.post_id = p.post_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_feed_engagement(uuid[], uuid) TO authenticated, anon;