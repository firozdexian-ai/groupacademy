-- Grant credits to talents who don't have credit records
INSERT INTO public.talent_credits (talent_id, balance)
SELECT t.id, 250
FROM public.talents t
LEFT JOIN public.talent_credits tc ON tc.talent_id = t.id
WHERE tc.id IS NULL;

-- Record welcome bonus transactions for those newly added credits
INSERT INTO public.credit_transactions (talent_id, amount, balance_after, transaction_type, description)
SELECT tc.talent_id, 250, 250, 'welcome_bonus', 'Welcome bonus - credited retroactively'
FROM public.talent_credits tc
LEFT JOIN public.credit_transactions ct ON ct.talent_id = tc.talent_id AND ct.transaction_type = 'welcome_bonus'
WHERE ct.id IS NULL;