
# Add Sample Courses to All Executive Academy Schools

## Overview
Add 2 sample courses to each of the 20 empty programs across 5 Executive Academy schools (the School of AI & Strategy already has courses). That's **40 new courses** total.

## Courses by School

### School of Business (4 programs, 3 need courses)
- **Banking & Finance**: "Corporate Banking Fundamentals" (6h, 5 modules) + "Trade Finance & International Banking" (8h, 6 modules)
- **Sales & Marketing**: "Digital Marketing Strategy for Corporates" (7h, 5 modules) + "B2B Sales Mastery" (6h, 4 modules)
- **Operations & Supply Chain**: "Supply Chain Management Essentials" (8h, 6 modules) + "Lean Operations & Process Improvement" (5h, 4 modules)
- **Healthcare & Pharma**: "Healthcare Management & Administration" (7h, 5 modules) + "Pharmaceutical Business & Compliance" (6h, 5 modules)

### School of Technology (4 programs)
- **Data Science & Analytics**: "SQL & Data Visualization for Business" (8h, 6 modules) + "Business Intelligence with Power BI" (6h, 5 modules)
- **Cybersecurity**: "Cybersecurity Fundamentals for Professionals" (7h, 5 modules) + "Information Security & Risk Management" (8h, 6 modules)
- **Technology & IT**: "IT Infrastructure & Networking Essentials" (6h, 5 modules) + "Enterprise Software & Systems Management" (7h, 5 modules)
- **Cloud & DevOps**: "Cloud Computing with AWS Fundamentals" (8h, 6 modules) + "DevOps & CI/CD Pipeline Mastery" (7h, 5 modules)

### School of Creative & Arts (4 programs)
- **Graphic Design**: "Brand Identity & Visual Design" (6h, 5 modules) + "Digital Illustration & Layout Design" (7h, 5 modules)
- **Content Writing**: "Professional & Business Writing" (5h, 4 modules) + "Content Strategy & Storytelling" (6h, 5 modules)
- **Video Production**: "Corporate Video Production" (8h, 6 modules) + "Motion Graphics & Video Editing" (7h, 5 modules)
- **UX/UI Design**: "UX Research & Design Thinking" (7h, 5 modules) + "UI Design Systems & Prototyping" (8h, 6 modules)

### School of Leadership & HR (4 programs)
- **Project Management**: "PMP-Ready Project Management" (10h, 8 modules) + "Agile & Scrum for Teams" (6h, 5 modules)
- **Executive Leadership**: "Strategic Leadership & Decision Making" (7h, 5 modules) + "Leading High-Performance Teams" (6h, 4 modules)
- **Human Resources**: "HR Management & Talent Acquisition" (7h, 5 modules) + "Employee Engagement & Retention" (5h, 4 modules)
- **Organizational Development**: "Change Management & Organizational Design" (7h, 5 modules) + "Learning & Development Strategy" (6h, 5 modules)

### School of Finance & Accounting (4 programs)
- **Financial Analysis**: "Financial Modeling & Valuation" (8h, 6 modules) + "Corporate Finance Essentials" (6h, 5 modules)
- **Auditing & Compliance**: "Internal Audit & Risk Assessment" (7h, 5 modules) + "Regulatory Compliance Frameworks" (6h, 5 modules)
- **Tax & Advisory**: "Corporate Tax Planning & Strategy" (7h, 5 modules) + "Advisory Services & Business Consulting" (6h, 4 modules)
- **Investment Management**: "Portfolio Management & Analysis" (8h, 6 modules) + "Equity Research & Valuation" (7h, 5 modules)

## Technical Details

- **Database only** -- 40 INSERT statements into the `content` table
- Each course: `content_type = 'recorded_course'`, `is_published = true`, unique slug, description, duration, and module count
- No frontend changes needed -- existing pages dynamically load courses from the database
