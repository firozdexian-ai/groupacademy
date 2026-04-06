

# CTO Technical Reference Document — GroUp Academy Platform

Generate a comprehensive PDF document for the CTO that serves as a debugging and development reference guide. The document will be created using Python's `reportlab` library and saved to `/mnt/documents/`.

## Document Contents

### 1. Technology Stack & Architecture
- React 18 + Vite 5 + TypeScript 5 + Tailwind CSS v3 + shadcn/ui
- Supabase (auth, DB, storage, edge functions, realtime)
- Key dependencies: React Query, React Router v6, recharts, jsPDF, xlsx, react-markdown, vite-plugin-pwa
- Build config: manual chunks for vendor-react, vendor-ui, vendor-charts, vendor-pdf, vendor-query, vendor-supabase

### 2. Folder Structure Map
- Full directory tree with purpose annotations for every folder under `src/` and `supabase/`

### 3. Route Map — All 80+ Routes
- Public routes, Admin routes, App routes (from App.tsx) with the exact file each route renders

### 4. Admin Dashboard — Tab-to-File Mapping
- All 10 nav groups, each tab value → the component file it renders (from Dashboard.tsx switch/case)

### 5. Edge Functions Registry
- All 41 edge functions with purpose, input/output summary

### 6. Hooks Reference
- All 27 custom hooks with what each does and which components consume them

### 7. Utility Libraries
- All files under `src/lib/` with purpose

### 8. Component Directory
- All 25 component subdirectories with file counts and purpose

### 9. Database Tables Quick Reference
- Key tables, their primary purpose, and which components/hooks interact with them

### 10. Debugging Playbook
- Common bug categories → which files to check first
- E.g., "Job counts wrong" → JobsManager.tsx, JobsKPIDashboard.tsx; "Credits not deducting" → useAgentChat.ts, creditPricing.ts, deduct_credits RPC

## Implementation
- Single Python script using reportlab
- Output: `/mnt/documents/GroUp_Academy_CTO_Technical_Reference.pdf`
- QA: Convert pages to images, inspect all pages

