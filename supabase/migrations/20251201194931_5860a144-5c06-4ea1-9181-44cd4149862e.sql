-- Fix empty student_id for Kareeb Sultan Chowdhury
UPDATE public.students 
SET student_id = 'GA-0006' 
WHERE email = 'kareeb@vu.edu.bd' AND student_id = '';

-- Reset the student_id sequence to prevent conflicts
SELECT setval('student_id_seq', (SELECT MAX(SUBSTRING(student_id FROM 4)::INTEGER) FROM public.students WHERE student_id ~ '^GA-[0-9]+$'), true);