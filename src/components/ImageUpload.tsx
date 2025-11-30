import { useState, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value?: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  bucket?: string;
}

export function ImageUpload({ 
  value, 
  onUpload, 
  onRemove,
  bucket = 'course-covers'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please upload an image file (PNG, JPG, WebP)',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload an image smaller than 5MB',
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onUpload(publicUrl);
      
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadImage(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0]);
    }
  };

  const handleRemove = async () => {
    if (value && onRemove) {
      // Extract file path from URL
      const urlParts = value.split('/');
      const filePath = urlParts[urlParts.length - 1];
      
      try {
        await supabase.storage.from(bucket).remove([filePath]);
        onRemove();
        toast({
          title: 'Success',
          description: 'Image removed successfully',
        });
      } catch (error: any) {
        console.error('Remove error:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to remove image',
          description: error.message,
        });
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Cover Image (16:9)</label>
      
      {value ? (
        <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
          <img 
            src={value} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors aspect-video flex flex-col items-center justify-center
            ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('image-upload')?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG or WebP (max 5MB, 16:9 ratio recommended)
              </p>
            </>
          )}
          <input
            id="image-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
            disabled={uploading}
          />
        </div>
      )}
    </div>
  );
}
