-- Drop legacy content_gigs RPCs
DROP FUNCTION IF EXISTS public.generate_content_gigs_for_course(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS public.generate_content_gigs_for_course(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.generate_content_gigs_for_school(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.generate_content_gigs_for_all_unready() CASCADE;
DROP FUNCTION IF EXISTS public.release_stale_content_gigs(integer) CASCADE;
DROP FUNCTION IF EXISTS public.release_stale_content_gigs() CASCADE;

-- Drop legacy table
DROP TABLE IF EXISTS public.content_gigs CASCADE;