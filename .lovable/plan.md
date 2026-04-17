

The user reports CV parsing failed during signup yesterday. Let me investigate the CV parsing flow to find a long-lasting fix.

Key files to inspect:
- `supabase/functions/parse-cv/index.ts` — the parser
- `src/components/onboarding/CVUploadStep.tsx` — signup CV upload
- Recent edge function logs for `parse-cv`
- Stack overflow hint suggests scanned PDFs need OCR fallback
