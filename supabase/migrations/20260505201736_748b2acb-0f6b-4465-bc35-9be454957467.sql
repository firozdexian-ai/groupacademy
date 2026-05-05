DROP VIEW IF EXISTS public.v_talent_transaction_volume;
CREATE VIEW public.v_talent_transaction_volume
WITH (security_invoker = true) AS
SELECT t.id AS talent_id, COALESCE(SUM(ABS(ct.amount)), 0)::numeric(14,1) AS volume
FROM public.talents t
LEFT JOIN public.credit_transactions ct ON ct.talent_id = t.id
GROUP BY t.id;
GRANT SELECT ON public.v_talent_transaction_volume TO authenticated, anon;