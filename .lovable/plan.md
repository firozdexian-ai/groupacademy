

# Banking & Finance Full Curriculum + AI Module Guide Generator

## What We're Building

A complete course curriculum for the **Banking & Finance** program with courses organized by level, each with modules and descriptive talking points. Plus an **"AI Generate Guide"** button in the admin Module Management page that auto-generates talking points for any module using AI.

## Curriculum Structure

### Foundation Level (5 courses)

1. **Introduction to Banking Systems** (4 modules)
   - How Banks Work: Deposits, Lending & Interest
   - Central Banking & Monetary Policy Basics
   - Types of Banks: Commercial, Investment, Microfinance
   - Banking Regulations & Compliance Overview

2. **Financial Accounting Essentials** (4 modules)
   - Understanding Financial Statements (Balance Sheet, P&L, Cash Flow)
   - Double-Entry Bookkeeping & Journal Entries
   - Bank Reconciliation & Internal Controls
   - Introduction to IFRS and Local GAAP Standards

3. **Money, Credit & Financial Markets** (4 modules)
   - Time Value of Money & Interest Rate Mechanics
   - Credit Assessment Fundamentals
   - Overview of Capital Markets (Equity, Debt, Derivatives)
   - Foreign Exchange Markets & Currency Basics

4. **Retail Banking Operations** (5 modules)
   - Account Opening, KYC & Customer Onboarding
   - Loan Products: Personal, Auto, Home & Education
   - Payment Systems: Cards, Mobile Banking, RTGS/NEFT
   - Deposit Products & Liability Management
   - Customer Service & Complaint Resolution

5. **Ethics & Risk Awareness in Banking** (4 modules)
   - Professional Ethics & Code of Conduct
   - Anti-Money Laundering (AML) & KYC Compliance
   - Introduction to Operational & Credit Risk
   - Fraud Detection & Prevention Basics

### Intermediate Level (5 courses)

1. **Credit Analysis & Lending** (5 modules)
   - Financial Statement Analysis for Lending Decisions
   - Cash Flow-Based vs Collateral-Based Lending
   - Credit Scoring Models & Risk Rating
   - Loan Structuring & Documentation
   - Non-Performing Assets & Recovery Strategies

2. **Treasury & Investment Banking** (4 modules)
   - Treasury Operations: ALM, Liquidity & Funds Management
   - Fixed Income Securities & Bond Valuation
   - Introduction to Derivatives: Forwards, Futures, Options
   - Mergers, Acquisitions & Advisory Basics

3. **Trade Finance & International Banking** (5 modules)
   - Letters of Credit: Types, Process & UCP 600
   - Documentary Collections & Bank Guarantees
   - Export-Import Financing & Pre/Post Shipment Credit
   - Foreign Exchange Risk Management & Hedging
   - Cross-Border Payment Systems (SWIFT, Correspondent Banking)

4. **Digital Banking & Fintech** (4 modules)
   - Digital Transformation in Banking
   - Payment Gateways, Wallets & Open Banking APIs
   - Blockchain & Distributed Ledger in Financial Services
   - RegTech, InsurTech & Lending Platforms

5. **Risk Management & Basel Framework** (5 modules)
   - Enterprise Risk Management Framework
   - Credit Risk Measurement & Mitigation
   - Market Risk: VaR, Stress Testing, Scenario Analysis
   - Operational Risk & Business Continuity
   - Basel III/IV Capital Adequacy & Liquidity Ratios

### Executive Level (4 courses)

1. **Strategic Banking Management** (4 modules)
   - Bank Strategy, Business Models & Competitive Positioning
   - Branch Transformation & Channel Strategy
   - Performance Metrics: NIM, ROA, ROE, Cost-to-Income
   - Regulatory Strategy & Board Governance

2. **Corporate & Structured Finance** (5 modules)
   - Corporate Credit Appraisal & Large Exposure Management
   - Project Finance & Infrastructure Lending
   - Syndicated Loans & Club Deals
   - Structured Products & Securitization
   - ESG & Sustainable Finance in Banking

3. **Wealth Management & Private Banking** (4 modules)
   - High Net Worth Client Advisory & Relationship Management
   - Portfolio Construction & Asset Allocation
   - Tax Planning, Estate Planning & Succession
   - Alternative Investments: PE, Real Estate, Hedge Funds

4. **Banking Leadership & Innovation** (4 modules)
   - Leading Digital Transformation Initiatives
   - Building & Managing High-Performance Banking Teams
   - AI & Data Analytics in Banking Decision-Making
   - Future of Banking: Embedded Finance, CBDC & Beyond

## Admin Feature: AI Module Guide Generator

An **"AI Generate Guide"** button on the Module Management page that:
- Calls a new edge function `generate-module-guide`
- Takes the course title, module title, and program context
- Returns 5-8 bullet-point talking points for what should be covered
- Populates the module's description field with the generated guide
- Uses Lovable AI (Gemini Flash) for fast, cost-effective generation

## Technical Plan

### Step 1: Database -- Insert Curriculum Data
- Remove the 2 existing Banking & Finance courses (they have no modules/enrollments, just placeholder data)
- Insert 14 new courses into `content` table with proper `profession_line_id` and `profession_level_id`
- Insert ~62 modules into `course_modules` with title, description (talking points), and display_order
- Update `modules_count` on each course to match actual module count

### Step 2: Edge Function -- `generate-module-guide`
- New Deno edge function at `supabase/functions/generate-module-guide/index.ts`
- Accepts: `{ courseTitle, moduleTitle, programName, levelName }`
- System prompt instructs AI to return 5-8 concise talking points for the module
- Returns structured text that serves as the content creation guideline
- Uses `LOVABLE_API_KEY` with `google/gemini-3-flash-preview`

### Step 3: Admin UI -- Add "AI Generate Guide" Button
- In `ModuleManagement.tsx`, add a sparkle/wand button next to each module's description field
- On click: calls the edge function with context, shows loading state
- On success: populates the description textarea with the generated talking points
- Toast notification on success/failure

### Step 4: Update `supabase/config.toml`
- Add `[functions.generate-module-guide]` with `verify_jwt = false`

