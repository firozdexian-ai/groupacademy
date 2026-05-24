# Phase A13: Admin Dialog & Sheet Chrome Polish

After A11 (buttons/inputs) and A12 (cards/tables), the last remaining visual outlier in the admin surface is **modal chrome**: `<Dialog>`, `<Sheet>`, `<AlertDialog>`, and `<Popover>` instances still ship with heavy `rounded-3xl`, `shadow-2xl`, `border-2`, `bg-card/80 backdrop-blur-2xl` styling that no longer matches the flat card system.

## Scope (in)

Files: `src/domains/*/components/admin/**` + `src/platform/admin/**` + `src/shells/admin/**` (~60–90 files touched).

Regex-only className sweeps on Dialog/Sheet/AlertDialog/Popover/DropdownMenu content:

- `rounded-3xl` → `rounded-2xl` (modal containers)
- `rounded-[28px]` / `rounded-[32px]` on modals → `rounded-2xl`
- `shadow-2xl` / `shadow-xl` on modal content → `shadow-lg`
- `border-2 border-border/*` on modals → `border border-border/60`
- `bg-card/80 backdrop-blur-2xl` / `bg-card/60 backdrop-blur-xl` → `bg-card` (keep `backdrop-blur-sm` only on the overlay scrim, not the content panel)
- DialogHeader / SheetHeader: drop `border-b-2`, `tracking-[0.2em]`, `text-[11px] font-black uppercase` → `text-base font-semibold` titles, `text-sm text-muted-foreground` descriptions
- DialogFooter / SheetFooter: drop `border-t-2 pt-8` → `border-t pt-4`
- Close buttons / `<X>` icons: standardize to `h-8 w-8 rounded-md` ghost

Inline form elements *inside* modals already covered by A11/A12 — no re-sweep needed.

## Scope (out)

- No changes to the shared `src/components/ui/dialog.tsx` / `sheet.tsx` primitives (shadcn baseline stays).
- No changes to talent/gro10x/public app modals.
- No layout, grid, spacing-rhythm, copy, or behavior changes.
- No replacement of custom modals with the primitive — purely className polish on existing ones.

## Approach

1. `rg -l "DialogContent|SheetContent|AlertDialogContent|PopoverContent" src/domains/*/components/admin src/platform/admin src/shells/admin` to enumerate.
2. `rg -n "rounded-3xl|shadow-2xl|backdrop-blur-2xl|backdrop-blur-xl|border-2 border-border|tracking-\[0\.2em\]|text-\[11px\] font-black"` scoped to those files for the audit baseline.
3. Run three regex passes (modal radius/shadow, header/footer chrome, blur removal) via `line_replace`.
4. Spot-check at `/dashboard?tab=jobs-applications` (JobFormDialog), `/dashboard?tab=ir-dashboard` (InvestorDetailSheet), `/dashboard?tab=talent-pool` (TalentDetailDialog).
5. Re-run audit; expect 0 hits inside admin domains/shells after.

## Files most affected (sampling)

- `src/domains/jobs/components/admin/hub/JobFormDialog.tsx`
- `src/domains/jobs/components/admin/hub/AddExternalApplicationDialog.tsx`
- `src/domains/ir/components/admin/InvestorDetailSheet.tsx`
- `src/domains/ir/components/admin/EmailComposer.tsx`
- `src/domains/ir/components/admin/InteractionLogger.tsx`
- `src/domains/talent/components/admin/TalentDetailDialog.tsx`
- `src/domains/learning/components/admin/modules/FlashcardEditor.tsx`
- `src/domains/learning/components/admin/modules/QuizResultsViewer.tsx`
- `src/domains/marketing/components/admin/leads/*Manager.tsx` (5 files with detail sheets)
- `src/domains/companies/components/admin/CompanyAgentsTab.tsx` (config drawer)
- `src/domains/gtm/components/admin/ConfirmPurge.tsx` (AlertDialog)

## Acceptance

- 0 hits for `rounded-3xl`, `shadow-2xl`, `backdrop-blur-2xl`, `backdrop-blur-xl`, `border-2 border-border`, `tracking-[0.2em]`, `text-[11px] font-black` across admin modals.
- Modals visually match A12 cards (`rounded-2xl border border-border/60 bg-card shadow-lg`).
- No behavioral regressions — every Dialog still opens, submits, closes.

## Why this phase next

A11 + A12 normalized 90% of admin surface area but modals are the last "loud" element. After A13, the entire admin shell shares one chrome vocabulary, unblocking the lower-priority empty-state and JSDoc sweeps as pure cleanup.
