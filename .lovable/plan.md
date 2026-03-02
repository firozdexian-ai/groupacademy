

# Program 4: Cloud & DevOps — Full Curriculum Build

## Current State
- **Program ID**: `7aec39bb-a47f-4cef-9d57-140c1f34339c`
- **Career outcome**: Not set (null)
- **Courses**: 2 placeholders (no levels, no modules)
- **AI Instructor**: None

## Step 1: Update Program Metadata
- Set `career_outcome` to "Cloud Engineer, DevOps Engineer, Site Reliability Engineer, Platform Engineer"

## Step 2: Delete 2 Placeholder Courses
Remove:
- "Cloud Computing with AWS Fundamentals"
- "DevOps & CI/CD Pipeline Mastery"

## Step 3: Insert 14 Courses (3 levels)

### Foundation (5 courses)
| # | Title | Modules |
|---|-------|---------|
| 1 | Introduction to Cloud Computing | 4 |
| 2 | Linux Fundamentals & Shell Scripting | 5 |
| 3 | Networking & Virtualization Essentials | 4 |
| 4 | Version Control & Collaboration with Git | 4 |
| 5 | Introduction to DevOps Culture & Practices | 4 |

### Intermediate (5 courses)
| # | Title | Modules |
|---|-------|---------|
| 1 | AWS Core Services & Architecture | 5 |
| 2 | Containers & Docker in Practice | 5 |
| 3 | CI/CD Pipelines & Automation | 4 |
| 4 | Infrastructure as Code with Terraform | 4 |
| 5 | Monitoring, Logging & Observability | 4 |

### Executive (4 courses)
| # | Title | Modules |
|---|-------|---------|
| 1 | Kubernetes & Container Orchestration | 5 |
| 2 | Multi-Cloud & Hybrid Cloud Strategies | 4 |
| 3 | Site Reliability Engineering & Platform Engineering | 4 |
| 4 | Capstone: Design & Deploy a Production Cloud Platform | 4 |

**Total: 14 courses, 66 modules**

## Step 4: Create AI Instructor

- **Name**: Kofi Mensah
- **Persona**: A cloud infrastructure architect with 13+ years building and scaling distributed systems across AWS, Azure, and GCP. Former SRE lead at a global fintech unicorn. AWS Solutions Architect Professional and CKA certified. Known for making infrastructure concepts tangible through architecture diagrams and real deployment scenarios.
- **Expertise**: AWS, Azure, GCP, Docker, Kubernetes, Terraform, CI/CD, Linux, Monitoring, Site Reliability Engineering, Infrastructure as Code
- **Teaching style**: Architecture-first and hands-on; starts with "what does the production system look like" before diving into individual tools. Uses real-world outage post-mortems (AWS us-east-1, GitLab database incident) and progressive build-up labs. Emphasizes automation, reliability, and cost optimization at every stage.

## Execution Order
1. Update career_outcome
2. Delete 2 placeholder courses
3. Insert 14 courses with correct level IDs
4. Insert 66 modules across all courses
5. Insert AI Instructor (Kofi Mensah)

## Technical Details
- **Level IDs**: Foundation (`9578ed0c-...`), Intermediate (`7e997803-...`), Executive (`b7976d18-...`)
- All operations are data inserts/updates/deletes -- no code changes needed
- Courses use type `recorded_course`, status `published`, `is_active = true`

