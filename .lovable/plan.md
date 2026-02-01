
# Add Image Upload to Feed Posts Manager

## Overview

Replace the current "Media Image URL" text input in the Feed Posts Manager with a proper image upload component. This allows admins to drag-and-drop or click to upload images directly, rather than needing to paste external URLs.

---

## What Changes

### Current Behavior
- Admin must find an image URL elsewhere and paste it into a text field
- No image preview until the post is saved
- Prone to broken links if external URLs change

### New Behavior  
- Drag-and-drop or click to upload images directly
- Instant image preview in the form
- Images stored reliably in the backend
- Remove button to clear the uploaded image

---

## Technical Details

### 1. Create Storage Bucket

Create a new `feed-images` bucket to store feed post media:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('feed-images', 'feed-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public can view feed images" ON storage.objects
  FOR SELECT USING (bucket_id = 'feed-images');

-- Allow authenticated users (admins) to upload
CREATE POLICY "Authenticated users can upload feed images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'feed-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete feed images" ON storage.objects
  FOR DELETE USING (bucket_id = 'feed-images');
```

### 2. Update FeedPostsManager.tsx

Replace the Media Image URL input field with the `ImageUpload` component:

**Before** (lines 365-373):
```tsx
<div>
  <Label>Media Image URL</Label>
  <Input
    value={formData.media_url}
    onChange={(e) => setFormData(prev => ({ ...prev, media_url: e.target.value }))}
    placeholder="https://... (image URL)"
  />
</div>
```

**After**:
```tsx
<div>
  <ImageUpload
    value={formData.media_url}
    onUpload={(url) => setFormData(prev => ({ ...prev, media_url: url }))}
    onRemove={() => setFormData(prev => ({ ...prev, media_url: '' }))}
    bucket="feed-images"
  />
</div>
```

### 3. Import Statement

Add the ImageUpload import at the top of FeedPostsManager.tsx:
```tsx
import { ImageUpload } from '@/components/ImageUpload';
```

---

## Files to Modify

| Action | File | Description |
|--------|------|-------------|
| Create | SQL Migration | Add `feed-images` storage bucket with RLS policies |
| Modify | `src/components/dashboard/FeedPostsManager.tsx` | Replace URL input with ImageUpload component |

---

## User Experience After Change

1. Admin opens "Create Post" dialog
2. Sees a drag-and-drop zone instead of a URL text field  
3. Can drag an image or click to browse files
4. Image uploads instantly with loading indicator
5. Preview shows the uploaded image with a remove button
6. Editing existing posts shows the current image with option to replace

---

## Notes

- The existing `ImageUpload` component handles all validation (file type, 5MB limit)
- Images are stored permanently in backend storage - no broken external links
- Existing posts with external URLs will continue to work (the ImageUpload shows them as previews)
