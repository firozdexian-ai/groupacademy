-- Add module_id column to quiz_questions for per-module quizzes
ALTER TABLE quiz_questions 
ADD COLUMN module_id uuid REFERENCES course_modules(id) ON DELETE CASCADE;

-- Create index for efficient lookups
CREATE INDEX idx_quiz_questions_module_id ON quiz_questions(module_id);

-- Note: Existing questions with NULL module_id will continue to work
-- They can be migrated to specific modules via admin UI