-- Add new enum values for academy_type
ALTER TYPE academy_type ADD VALUE IF NOT EXISTS 'freelancing';
ALTER TYPE academy_type ADD VALUE IF NOT EXISTS 'entrepreneurship';