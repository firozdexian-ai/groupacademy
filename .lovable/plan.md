

# Career Tracks Redesign -- Academy Tabs with Icon Strip + Current Enrollment

## Overview

Restructure the Tracks tab to use the standardized icon-strip navigation (matching All Courses and Events tabs) with 4 categories: **My Program**, **Executive Academy**, **Freelancing Academy**, and **Entrepreneurship Academy**. The existing Technical Academy will be renamed/replaced with Freelancing Academy, and a new Entrepreneurship Academy will be added.

## Database Changes

### 1. Update existing "Technical Academy" to "Freelancing Academy"
- Rename the existing Technical Academy record (keeping its ID to preserve school relationships)
- Update slug to `freelancing-academy`
- Update description to focus on freelancing, gig economy, and Fiverr-type skills

### 2. Create new "Entrepreneurship Academy"
- Insert a new academy with `academy_type: 'entrepreneurship'`, display_order 3
- Create starter schools under it (e.g., "School of Startup & Venture", "School of E-Commerce", "School of Social Enterprise")

### 3. Update schools under Freelancing Academy
- Rename existing Technical Academy schools to reflect freelancing focus (e.g., "School of Digital Freelancing", "School of Creative Services", "School of Technical Services")

## Frontend Changes

### File: `src/components/learning/TracksTab.tsx`

**Replace the Radix TabsList/TabsTrigger with the icon-strip pattern** used in CoursesTab and EventsTab:

- 4-icon `grid grid-cols-4 gap-2` strip at the top
- Icons: `BookOpen` (My Program), `Building2` (Executive), `Laptop` (Freelancing), `Rocket` (Entrepreneurship)
- State-based filtering instead of Radix Tabs
- "My Program" is the first/default tab

**My Program tab content:**
- Query the user's enrollments joined with profession_categories to show which career track they are enrolled in
- Show an "Active" card with progress if enrolled
- Show a "Completed" section if any tracks are fully completed
- If not enrolled, show an empty state prompting them to browse academies

**Academy tabs (Executive, Freelancing, Entrepreneurship):**
- Filter academies by `academy_type` or slug
- Display schools and profession lines exactly as they do now (the card grid is good)
- Keep the same profession card design with AI instructor badge

### No changes to other files

The icon-strip pattern replaces the horizontal TabsList that was misaligned. This brings Tracks in line with the visual style of All Courses and Events tabs.

## Technical Details

### Database Migration

```sql
-- Rename Technical Academy to Freelancing Academy
UPDATE academies 
SET name = 'Freelancing Academy', 
    slug = 'freelancing-academy', 
    academy_type = 'freelancing',
    description = 'Build marketable skills for freelancing platforms like Fiverr, Upwork, and the gig economy.'
WHERE slug = 'technical-academy';

-- Insert Entrepreneurship Academy
INSERT INTO academies (name, slug, academy_type, description, display_order, is_active)
VALUES ('Entrepreneurship Academy', 'entrepreneurship-academy', 'entrepreneurship', 
        'Launch and grow your own business with practical entrepreneurship skills.', 3, true);

-- Rename schools under Freelancing Academy to match new focus
UPDATE schools SET name = 'School of Digital Freelancing', slug = 'school-of-digital-freelancing' 
WHERE slug = 'school-of-skilled-trades-engineering';
-- (similar updates for other Technical Academy schools)

-- Create starter schools for Entrepreneurship Academy
INSERT INTO schools (name, slug, academy_id, description, display_order, is_active)
VALUES 
  ('School of Startup & Venture', 'school-of-startup-venture', 
   (SELECT id FROM academies WHERE slug = 'entrepreneurship-academy'),
   'From idea validation to funding and scaling.', 1, true),
  ('School of E-Commerce', 'school-of-ecommerce',
   (SELECT id FROM academies WHERE slug = 'entrepreneurship-academy'),
   'Build and grow online businesses and digital stores.', 2, true),
  ('School of Social Enterprise', 'school-of-social-enterprise',
   (SELECT id FROM academies WHERE slug = 'entrepreneurship-academy'),
   'Create businesses that drive social impact.', 3, true);
```

### File: `src/components/learning/TracksTab.tsx`

- Remove Radix `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` imports
- Add icon-strip navigation with `grid grid-cols-4 gap-2`
- Add state: `selectedCategory` with values `'my-program' | 'executive' | 'freelancing' | 'entrepreneurship'`
- Default to `'my-program'`
- For "My Program": fetch user's talent_id from auth, query enrollments joined with content (profession_categories) to show active/completed tracks
- For academy tabs: filter the existing `academies` data by `academy_type` and render schools + professions as before
- Use `BookOpen`, `Building2`, `Laptop`, `Rocket` icons from lucide-react

### No new dependencies needed

