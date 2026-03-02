

# Program 1: Data Science & Analytics — Full Curriculum Build

## Overview
Build out the **Data Science & Analytics** program with 14 globally-relevant courses (replacing 2 placeholders), ~60 modules, and 1 AI Instructor. This follows the same pattern as the School of Business programs.

## Step 1: Update Program Metadata
- Update `career_outcome` for Data Science & Analytics (currently null)
- Career outcome: "Data Analyst, Business Intelligence Analyst, Data Scientist, Analytics Engineer"

## Step 2: Delete 2 Placeholder Courses
Remove the existing placeholders:
- "SQL & Data Visualization for Business"
- "Business Intelligence with Power BI"

## Step 3: Insert 14 Courses (3 levels)

### Foundation (5 courses)
| # | Title | Modules |
|---|-------|---------|
| 1 | Introduction to Data Science & Analytics | 4 |
| 2 | Statistics & Probability for Data Analysis | 5 |
| 3 | SQL for Data Professionals | 4 |
| 4 | Data Visualization Fundamentals | 4 |
| 5 | Excel & Spreadsheets for Analytics | 4 |

### Intermediate (5 courses)
| # | Title | Modules |
|---|-------|---------|
| 1 | Python for Data Analysis | 5 |
| 2 | Exploratory Data Analysis & Feature Engineering | 4 |
| 3 | Business Intelligence & Dashboard Design | 4 |
| 4 | Statistical Modeling & Hypothesis Testing | 4 |
| 5 | Data Wrangling & ETL Pipelines | 4 |

### Executive (4 courses)
| # | Title | Modules |
|---|-------|---------|
| 1 | Advanced Machine Learning for Analytics | 5 |
| 2 | Big Data Technologies & Cloud Analytics | 4 |
| 3 | Data Strategy & Analytics Leadership | 4 |
| 4 | Real-World Capstone: End-to-End Analytics Project | 4 |

**Total: 14 courses, 61 modules**

## Step 4: Create AI Instructor

- **Name**: Dr. Elena Vasquez
- **Persona**: A globally experienced data scientist with 12+ years across fintech, healthcare, and e-commerce. Former lead analyst at a Fortune 500 company. Known for making complex statistical concepts intuitive through real-world datasets and business scenarios.
- **Expertise**: Data Analysis, Python, SQL, Machine Learning, Statistical Modeling, Data Visualization, BI Tools, Big Data, Cloud Analytics
- **Teaching style**: Methodical and curious; encourages learners to think critically about data before jumping to conclusions. Uses industry case studies (Netflix, Airbnb, Spotify) and emphasizes reproducibility and storytelling with data.

## Execution Order
1. Update program career_outcome
2. Delete 2 placeholder courses
3. Insert 14 courses with levels
4. Insert ~61 modules across all courses
5. Insert AI Instructor (Dr. Elena Vasquez)

All done via database insert/update operations — no code changes needed.
