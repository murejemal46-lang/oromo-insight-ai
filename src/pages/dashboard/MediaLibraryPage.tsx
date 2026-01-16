import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Search,
  Grid,
  List,
  Trash2,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Check,
  Upload,
  X,
  FileImage,
  MoreVertical,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ImageUpload } from '@/components/dashboard/ImageUpload';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StorageFile {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any> | null;
}

export default function MediaLibraryPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImage, setSelectedImage] = useState<StorageFile | null>(null);
  const [imageToDelete, setImageToDelete] = useState<StorageFile | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch user's images from storage
  const { data: images = [], isLoading } = useQuery({
    queryKey: ['media-library', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase.storage
        .from('article-images')
        .list(user.id, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        console.error('Error fetching images:', error);
        throw error;
      }

      // Filter out folders
      return (data || []).filter((file) => file.id) as unknown as StorageFile[];
    },
    enabled: !!user,
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (file: StorageFile) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.storage
        .from('article-images')
        .remove([`${user.id}/${file.name}`]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
      toast({
        title: language === 'om' ? 'Haqame' : 'Deleted',
        description: language === 'om' ? 'Suuraan haqameera' : 'Image has been deleted',
      });
      setImageToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get public URL for an image
  const getImageUrl = (file: StorageFile) => {
    if (!user) return '';
    const { data } = supabase.storage
      .from('article-images')
      .getPublicUrl(`${user.id}/${file.name}`);
    return data.publicUrl;
  };

  // Copy URL to clipboard
  const copyToClipboard = async (file: StorageFile) => {
    const url = getImageUrl(file);
    await navigator.clipboard.writeText(url);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: language === 'om' ? 'Garagalfame' : 'Copied',
      description: language === 'om' ? 'URL garagalfameera' : 'URL copied to clipboard',
    });
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Filter images by search query
  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) return images;
    const query = searchQuery.toLowerCase();
    return images.filter((img) => img.name.toLowerCase().includes(query));
  }, [images, searchQuery]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">
              {language === 'om' ? 'Kuusaa Miidiyaa' : 'Media Library'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'om'
                ? 'Suuraalee olkaa\'amanii kee bulchi'
                : 'Manage your uploaded images'}
            </p>
          </div>
          <Button onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            {language === 'om' ? 'Suuraa Olkaa\'i' : 'Upload Image'}
          </Button>
        </div>

        {/* Search and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={language === 'om' ? 'Suuraalee barbaadi...' : 'Search images...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
            <TabsList>
              <TabsTrigger value="grid">
                <Grid className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {filteredImages.length} {language === 'om' ? 'suuraalee' : 'images'}
          </span>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="h-auto p-1"
            >
              <X className="w-3 h-3 mr-1" />
              {language === 'om' ? 'Haqii' : 'Clear'}
            </Button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
              : 'space-y-2'
          )}>
            {[...Array(10)].map((_, i) => (
              <Skeleton
                key={i}
                className={viewMode === 'grid' ? 'aspect-square rounded-lg' : 'h-16'}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredImages.length === 0 && (
          <div className="text-center py-16">
            <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">
              {searchQuery
                ? (language === 'om' ? 'Suuraa hin argamne' : 'No images found')
                : (language === 'om' ? 'Suuraa hin jiru' : 'No images yet')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? (language === 'om' ? 'Jecha barbaaddu jijjiiri' : 'Try a different search term')
                : (language === 'om' ? 'Suuraa jalqabaa olkaa\'i' : 'Upload your first image to get started')}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsUploadOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                {language === 'om' ? 'Suuraa Olkaa\'i' : 'Upload Image'}
              </Button>
            )}
          </div>
        )}

        {/* Grid View */}
        {!isLoading && filteredImages.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredImages.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card
                    className="group relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    onClick={() => setSelectedImage(file)}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-square bg-muted">
                        <img
                          src={getImageUrl(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(file);
                          }}
                        >
                          {copiedId === file.id ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(getImageUrl(file), '_blank');
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageToDelete(file);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* List View */}
        {!isLoading && filteredImages.length > 0 && viewMode === 'list' && (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredImages.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card
                    className="group cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedImage(file)}
                  >
                    <CardContent className="p-3 flex items-center gap-4">
                      <div className="w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
                        <img
                          src={getImageUrl(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.metadata?.size || 0)} •{' '}
                          {format(new Date(file.created_at), 'PP')}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyToClipboard(file)}>
                            <Copy className="w-4 h-4 mr-2" />
                            {language === 'om' ? 'URL Garagalchi' : 'Copy URL'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(getImageUrl(file), '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {language === 'om' ? 'Bani' : 'Open'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setImageToDelete(file)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {language === 'om' ? 'Haqi' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'om' ? 'Suuraa Olkaa\'i' : 'Upload Image'}
            </DialogTitle>
            <DialogDescription>
              {language === 'om'
                ? 'Suuraa haaraa kuusaa miidiyaa keessatti olkaa\'i'
                : 'Upload a new image to your media library'}
            </DialogDescription>
          </DialogHeader>
          <ImageUpload
            value=""
            onChange={(url) => {
              if (url) {
                queryClient.invalidateQueries({ queryKey: ['media-library'] });
                setIsUploadOpen(false);
                toast({
                  title: language === 'om' ? 'Milkaa\'e' : 'Success',
                  description: language === 'om' ? 'Suuraan olkaa\'ameera' : 'Image uploaded successfully',
                });
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{selectedImage?.name}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden bg-muted">
                <img
                  src={getImageUrl(selectedImage)}
                  alt={selectedImage.name}
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>{formatFileSize(selectedImage.metadata?.size || 0)}</span>
                <span>•</span>
                <span>{selectedImage.metadata?.mimetype}</span>
                <span>•</span>
                <span>{format(new Date(selectedImage.created_at), 'PPpp')}</span>
              </div>
            </div>
          )}
          <DialogFooter className="flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => selectedImage && copyToClipboard(selectedImage)}>
              <Copy className="w-4 h-4 mr-2" />
              {language === 'om' ? 'URL Garagalchi' : 'Copy URL'}
            </Button>
            <Button
              variant="outline"
              onClick={() => selectedImage && window.open(getImageUrl(selectedImage), '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {language === 'om' ? 'Bani' : 'Open Original'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedImage) {
                  setImageToDelete(selectedImage);
                  setSelectedImage(null);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {language === 'om' ? 'Haqi' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!imageToDelete} onOpenChange={() => setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'om' ? 'Suuraa haqi?' : 'Delete image?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'om'
                ? 'Kun hin deebi\'u. Suuraan kun dhaabbataan ni haqama.'
                : 'This action cannot be undone. This image will be permanently deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'om' ? 'Dhiisi' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => imageToDelete && deleteMutation.mutate(imageToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {language === 'om' ? 'Haqi' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
