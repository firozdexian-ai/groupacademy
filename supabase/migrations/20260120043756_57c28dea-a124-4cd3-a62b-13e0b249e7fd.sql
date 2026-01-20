-- 1. Add external_url column to blog_posts table if it doesn't exist
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS external_url TEXT;

-- 2. Create the 'blog-images' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable RLS policies for the new bucket
-- Allow public read access to all blog images
CREATE POLICY "Public Access Blog Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'blog-images' );

-- Allow authenticated users (admins) to upload
CREATE POLICY "Authenticated Upload Blog Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'blog-images' );

-- Allow authenticated users to update/delete
CREATE POLICY "Authenticated Update Blog Images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'blog-images' );

CREATE POLICY "Authenticated Delete Blog Images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'blog-images' );