import { useState, useRef, useCallback } from 'react';
import { Upload, Link as LinkIcon, Loader2, Image as ImageIcon, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ImageUploadModalProps {
  open: boolean;
  onClose: () => void;
  onImageSelect: (imageUrl: string) => void;
  language?: 'om' | 'en';
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function ImageUploadModal({
  open,
  onClose,
  onImageSelect,
  language = 'en',
}: ImageUploadModalProps) {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlPreview, setUrlPreview] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);

  const resetState = useCallback(() => {
    setPreviewUrl(null);
    setUploadedUrl(null);
    setUrlInput('');
    setUrlPreview(null);
    setUrlError(null);
    setUploadProgress(0);
    setIsUploading(false);
    setIsValidatingUrl(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Reset states
    setUploadedUrl(null);
    setUploadProgress(0);

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

    // Create local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Start upload
    setIsUploading(true);

    try {
      // Simulate progress (Supabase doesn't provide real progress for storage uploads)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(fileName);

      setUploadProgress(100);
      setUploadedUrl(publicUrl);

      toast({
        title: language === 'om' ? 'Suuraan fe\'ame!' : 'Image uploaded!',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: language === 'om' ? 'Fe\'uun hin milkoofne' : 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      setPreviewUrl(null);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const validateUrl = async (url: string) => {
    if (!url.trim()) {
      setUrlPreview(null);
      setUrlError(null);
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setUrlError(language === 'om' ? 'URL sirrii miti' : 'Invalid URL format');
      setUrlPreview(null);
      return;
    }

    setIsValidatingUrl(true);
    setUrlError(null);

    // Try to load the image
    const img = new window.Image();
    img.onload = () => {
      setUrlPreview(url);
      setUrlError(null);
      setIsValidatingUrl(false);
    };
    img.onerror = () => {
      setUrlError(language === 'om' ? 'Suuraa fe\'uu hin dandeenye' : 'Could not load image');
      setUrlPreview(null);
      setIsValidatingUrl(false);
    };
    img.src = url;
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setUrlInput(url);
    
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateUrl(url);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleInsert = () => {
    if (activeTab === 'upload' && uploadedUrl) {
      onImageSelect(uploadedUrl);
      handleClose();
    } else if (activeTab === 'url' && urlPreview) {
      onImageSelect(urlPreview);
      handleClose();
    }
  };

  const canInsert = 
    (activeTab === 'upload' && uploadedUrl) || 
    (activeTab === 'url' && urlPreview && !urlError);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {language === 'om' ? 'Suuraa Galchi' : 'Insert Image'}
          </DialogTitle>
          <DialogDescription>
            {language === 'om' 
              ? 'Suuraa fe\'i ykn URL galchi' 
              : 'Upload an image or paste a URL'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'url')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {language === 'om' ? "Fe'i" : 'Upload'}
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 pt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <Progress value={uploadProgress} className="w-3/4 h-2" />
                    <span className="text-sm text-muted-foreground mt-2">
                      {uploadProgress}%
                    </span>
                  </div>
                )}
                {uploadedUrl && (
                  <div className="absolute top-2 right-2 bg-success text-success-foreground rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 left-2"
                  onClick={() => {
                    setPreviewUrl(null);
                    setUploadedUrl(null);
                    setUploadProgress(0);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                  'w-full aspect-video border-2 border-dashed rounded-lg',
                  'flex flex-col items-center justify-center gap-3',
                  'hover:border-accent hover:bg-accent/5 transition-colors cursor-pointer',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {language === 'om' ? "Suuraa fe'uuf cuqaasi" : 'Click to upload an image'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, WebP, GIF • Max 5MB
                  </p>
                </div>
              </button>
            )}
          </TabsContent>

          <TabsContent value="url" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">
                {language === 'om' ? 'URL Suuraa' : 'Image URL'}
              </Label>
              <div className="relative">
                <Input
                  id="image-url"
                  value={urlInput}
                  onChange={handleUrlChange}
                  placeholder="https://example.com/image.jpg"
                  className={cn(urlError && 'border-destructive')}
                />
                {isValidatingUrl && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {urlError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {urlError}
                </p>
              )}
            </div>

            {urlPreview && (
              <div className="relative">
                <img
                  src={urlPreview}
                  alt="URL Preview"
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
                <div className="absolute top-2 right-2 bg-success text-success-foreground rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            {language === 'om' ? 'Dhiisi' : 'Cancel'}
          </Button>
          <Button type="button" onClick={handleInsert} disabled={!canInsert}>
            <ImageIcon className="h-4 w-4 mr-2" />
            {language === 'om' ? 'Galchi' : 'Insert Image'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
