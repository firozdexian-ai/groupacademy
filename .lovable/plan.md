

# School of Consulting — Full Build (4 Programs)

Final school in the Freelancing Academy. All 4 programs are empty.

## Programs & Instructors

| Program | ID | Instructor |
|---|---|---|
| Business Consulting | `5bbad988` | Nadia Volkov |
| Career Coaching | `120bebaf` | Danielle Brooks |
| Financial Advisory | `fff3e883` | Martin Adekunle |
| Marketing Strategy | `6c9dce01` | Isabelle Moreau |

## Curriculum

Same structure as previous schools: **14 courses × 4 programs = 56 courses**, **62 modules × 4 programs = 248 modules**, mapped to Foundation/Intermediate/Executive levels.

Full course titles and module counts were detailed in the previously proposed plan — no changes.

## Execution (6 migrations)

1. Delete any placeholder courses if they exist
2. Update `profession_categories` with career outcomes
3. Insert 4 AI instructors with full personas and system prompts
4. Insert 56 courses into `content` (type `recorded_course`)
5. Insert 248 modules into `course_modules`
6. Verify counts

Then update `.lovable/plan.md` to mark the entire Freelancing Academy as **100% complete**.

