CREATE POLICY "Members can read own company credits"
  ON public.company_credits FOR SELECT
  TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Members can read own company txns"
  ON public.company_credit_transactions FOR SELECT
  TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));