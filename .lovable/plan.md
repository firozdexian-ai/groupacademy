
# Marketing & Brand Management -- Full Curriculum + AI Instructor

## Step 1: Rename the Program
Update `profession_categories` to rename "Sales & Marketing" to **"Marketing & Brand Management"** with slug `marketing-brand-management` and updated description.

## Step 2: Remove Placeholder Courses
Delete the 2 existing courses (no modules, no enrollments):
- Digital Marketing Strategy for Corporates
- B2B Sales Mastery

## Step 3: Insert Full Curriculum (14 courses, ~62 modules)

### Foundation Level (5 courses)

1. **Introduction to Marketing Principles** (4 modules)
   - What is Marketing: Core Concepts, the 4Ps & the Marketing Mix
   - Understanding Consumer Behavior & Buying Decisions
   - Market Segmentation, Targeting & Positioning (STP)
   - Introduction to Marketing Research & Data Collection

2. **Brand Fundamentals** (4 modules)
   - What is a Brand: Identity, Image & Equity
   - Brand Architecture: Master Brand, Sub-Brands & Endorsed Brands
   - Crafting Brand Story & Messaging Frameworks
   - Visual Identity: Logo, Color, Typography & Brand Guidelines

3. **Digital Marketing Essentials** (4 modules)
   - Overview of Digital Channels: SEO, SEM, Social, Email, Content
   - Social Media Marketing: Platform Selection & Content Strategy
   - Introduction to Google Ads & Facebook/Meta Ads
   - Email Marketing: List Building, Campaigns & Automation Basics

4. **Content Marketing & Copywriting** (4 modules)
   - Content Strategy: Planning, Calendars & Content Pillars
   - Writing for the Web: Headlines, CTAs & Persuasive Copy
   - Visual Content: Infographics, Short-Form Video & Reels
   - Blogging, SEO Content & Thought Leadership

5. **Marketing Communications & PR** (4 modules)
   - Integrated Marketing Communications (IMC) Framework
   - Press Releases, Media Relations & Earned Media
   - Event Marketing & Experiential Campaigns
   - Crisis Communication & Reputation Management Basics

### Intermediate Level (5 courses)

1. **Brand Strategy & Management** (5 modules)
   - Brand Positioning Frameworks: Perceptual Maps & Competitive Analysis
   - Brand Health Tracking: Awareness, Recall, NPS & Sentiment
   - Brand Extension & Portfolio Strategy
   - Rebranding: When, Why & How to Execute
   - Building Brand Communities & Advocacy Programs

2. **Digital Marketing Strategy** (5 modules)
   - Building a Full-Funnel Digital Strategy (TOFU, MOFU, BOFU)
   - Performance Marketing: Google Ads, Meta Ads & Campaign Optimization
   - SEO Strategy: Technical SEO, On-Page & Link Building
   - Marketing Automation & CRM Integration (HubSpot, Mailchimp)
   - Conversion Rate Optimization & Landing Page Strategy

3. **Market Research & Consumer Insights** (4 modules)
   - Qualitative Research: Focus Groups, Interviews & Ethnography
   - Quantitative Research: Surveys, Conjoint Analysis & Statistical Methods
   - Competitive Intelligence & Market Sizing
   - Turning Insights into Actionable Marketing Strategies

4. **Social Media & Influencer Marketing** (4 modules)
   - Platform-Specific Strategies: Facebook, Instagram, LinkedIn, TikTok
   - Influencer Marketing: Selection, Contracts & ROI Measurement
   - Community Management & Social Listening Tools
   - Social Commerce & Shoppable Content Strategies

5. **Marketing Analytics & ROI** (5 modules)
   - Marketing Metrics That Matter: CAC, LTV, ROAS, CPL
   - Google Analytics & Attribution Modeling
   - Dashboard Building & Reporting for Stakeholders
   - A/B Testing & Experimentation Frameworks
   - Budget Allocation & Media Mix Modeling

### Executive Level (4 courses)

1. **Strategic Marketing Leadership** (4 modules)
   - Developing Annual Marketing Plans & Budget Ownership
   - Go-to-Market Strategy for Product Launches
   - Marketing Organization Design & Team Structure
   - Aligning Marketing with Business Strategy & Revenue Goals

2. **Brand Building at Scale** (5 modules)
   - Building Iconic Brands: Case Studies (Unilever, Grameenphone, bKash)
   - Global vs Local Brand Strategy: Glocalization in Bangladesh Context
   - Employer Branding & Internal Brand Culture
   - Luxury & Premium Brand Management
   - Measuring Brand Equity & Long-Term Brand Valuation

3. **Growth Marketing & Innovation** (4 modules)
   - Growth Hacking Frameworks: AARRR Pirate Metrics
   - Product-Led Growth & Viral Loop Design
   - AI & Martech: Using AI Tools for Personalization & Predictive Marketing
   - Innovation in Marketing: AR/VR, Metaverse & Web3 Applications

4. **Marketing Leadership & Business Impact** (4 modules)
   - CMO Mindset: From Campaign Manager to Business Leader
   - Cross-Functional Leadership: Marketing + Sales + Product Alignment
   - Agency Management: Briefing, Evaluation & Partnership Models
   - Future of Marketing: Privacy, First-Party Data & Ethical Marketing

## Step 4: Create AI Instructor

**Name**: Nadia Chowdhury
**Persona**: A seasoned marketing strategist with 15+ years in brand management and digital marketing across leading FMCG, telecom, and fintech companies in Bangladesh. Former Head of Marketing at a top consumer brand, now focused on developing the next generation of marketing leaders. Uses real examples from brands like Grameenphone, bKash, Walton, PRAN, and international brands operating in Bangladesh.

**Expertise areas**: Brand Strategy, Digital Marketing, Consumer Insights, Content Marketing, Performance Marketing, Social Media, Marketing Analytics, Go-to-Market Strategy, Brand Building, Marketing Leadership

## Technical Details

### Database Operations
- **UPDATE**: Rename profession_categories record (name, slug, description)
- **DELETE**: 2 placeholder courses from content table
- **INSERT**: 14 courses into `content` table with correct `profession_line_id` and `profession_level_id`
- **INSERT**: ~62 modules into `course_modules` with talking-point descriptions
- **INSERT**: 1 AI instructor record into `ai_instructors`
- All courses: `content_type = 'recorded_course'`, `is_published = true`

### IDs
- Program: `5ee052f8-2aaf-45b5-8f90-731c23097fef`
- Foundation: `9578ed0c-dfc6-4e62-a1b6-0a96161cc4fe`
- Intermediate: `7e997803-47f3-423e-9790-da9612328cf5`
- Executive: `b7976d18-957b-4dc4-8a95-bbfd44877225`

### No Code Changes Needed
- Pages dynamically load from database
- AI instructor chat edge function already has the curriculum knowledge base loader built in
