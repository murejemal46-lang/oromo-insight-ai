import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Send, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { toast } from '@/hooks/use-toast';

export function JournalistRequestForm() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  const { data: existingRequest, isLoading } = useQuery({
    queryKey: ['journalist-request', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('journalist_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('journalist_requests')
        .insert({
          user_id: user.id,
          reason,
          portfolio_url: portfolioUrl || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalist-request'] });
      toast({
        title: language === 'om' ? 'Gaaffiin ergame!' : 'Request submitted!',
        description: language === 'om' 
          ? 'Gaaffiin kee gamaaggamaaf ergameera.'
          : 'Your request has been submitted for review.',
      });
      setReason('');
      setPortfolioUrl('');
    },
    onError: (error: any) => {
      toast({
        title: language === 'om' ? 'Dogoggora' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">{language === 'om' ? 'Fe\'aa jira...' : 'Loading...'}</div>
        </CardContent>
      </Card>
    );
  }

  // Show status if request exists
  if (existingRequest) {
    const statusConfig = {
      pending: {
        icon: Clock,
        color: 'text-warning',
        bg: 'bg-warning/10',
        title: language === 'om' ? 'Gaaffiin Eeggataa Jira' : 'Request Pending',
        description: language === 'om' 
          ? 'Gaaffiin kee gamaaggamaa jira. Obsa qabadhu.'
          : 'Your request is being reviewed. Please be patient.',
      },
      approved: {
        icon: CheckCircle,
        color: 'text-success',
        bg: 'bg-success/10',
        title: language === 'om' ? 'Gaaffiin Fudhatame!' : 'Request Approved!',
        description: language === 'om'
          ? 'Amma gaazexeessaa taateetta. Fuula haaromsi barruulee barreessuu jalqabuuf.'
          : 'You are now a journalist. Refresh the page to start writing articles.',
      },
      rejected: {
        icon: XCircle,
        color: 'text-destructive',
        bg: 'bg-destructive/10',
        title: language === 'om' ? 'Gaaffiin Kufame' : 'Request Rejected',
        description: existingRequest.review_notes || (language === 'om'
          ? 'Gaaffiin kee hin fudhatamne.'
          : 'Your request was not approved.'),
      },
    };

    const status = statusConfig[existingRequest.status as keyof typeof statusConfig];
    const StatusIcon = status.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={status.bg}>
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center gap-4">
              <StatusIcon className={`w-12 h-12 ${status.color}`} />
              <div>
                <h3 className="font-semibold text-lg">{status.title}</h3>
                <p className="text-muted-foreground mt-1">{status.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {language === 'om' ? 'Gaazexeessaa Ta\'i' : 'Become a Journalist'}
          </CardTitle>
          <CardDescription>
            {language === 'om'
              ? 'Barruulee barreessuuf gaaffii ergi. Admin\'n gamaaggama.'
              : 'Submit a request to become a journalist. An admin will review your application.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              {language === 'om' ? 'Maaliif gaazexeessaa ta\'uu barbaadda?' : 'Why do you want to become a journalist?'}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={language === 'om' 
                ? 'Muuxannoo fi kaka\'umsa kee ibsi...'
                : 'Describe your experience and motivation...'}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio">
              {language === 'om' ? 'Liinkii Poortifooliyoo (Dirqama miti)' : 'Portfolio URL (Optional)'}
            </Label>
            <Input
              id="portfolio"
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <Button 
            onClick={() => submitMutation.mutate()}
            disabled={!reason.trim() || submitMutation.isPending}
            className="w-full gap-2"
          >
            <Send className="w-4 h-4" />
            {submitMutation.isPending 
              ? (language === 'om' ? 'Ergaa jira...' : 'Submitting...')
              : (language === 'om' ? 'Gaaffii Ergi' : 'Submit Request')}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
