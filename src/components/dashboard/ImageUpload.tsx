import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/hooks/use-toast';
import { useLanguageStore } from '@/store/useLanguageStore';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: language === 'om' ? 'Gosa faayilii dogoggoraa' : 'Invalid file type',
        description: language === 'om' 
          ? 'JPEG, PNG, WebP, ykn GIF qofa' 
          : 'Only JPEG, PNG, WebP, or GIF allowed',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: language === 'om' ? 'Faayiliin guddaa dha' : 'File too large',
        description: language === 'om' 
          ? 'Hangii guddaan 5MB' 
          : 'Maximum size is 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(fileName);

      setPreview(publicUrl);
      onChange(publicUrl);

      toast({
        title: language === 'om' ? 'Suuraan fe\'ame' : 'Image uploaded',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: language === 'om' ? 'Fe\'uun hin milkoofne' : 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Featured image preview"
            className="w-full aspect-video object-cover rounded-lg border"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-1" />
              )}
              {language === 'om' ? 'Jijjiiri' : 'Change'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRemove}
            >
              <X className="w-4 h-4 mr-1" />
              {language === 'om' ? 'Haqi' : 'Remove'}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-3 hover:border-accent hover:bg-accent/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              <span className="text-sm text-muted-foreground">
                {language === 'om' ? 'Fe\'aa jira...' : 'Uploading...'}
              </span>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {language === 'om' ? 'Suuraa fe\'i' : 'Upload an image'}
                </p>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, WebP, GIF • Max 5MB
                </p>
              </div>
            </>
          )}
        </button>
      )}
    </div>
  );
}
