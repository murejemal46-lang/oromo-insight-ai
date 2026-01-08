import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, User, ExternalLink, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { toast } from '@/hooks/use-toast';

interface JournalistRequest {
  id: string;
  user_id: string;
  reason: string;
  portfolio_url: string | null;
  status: string;
  created_at: string;
  profile?: {
    full_name: string | null;
  };
  email?: string;
}

export default function AdminRequestsPage() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<JournalistRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-journalist-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journalist_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;

      // Fetch profiles for each request
      const requestsWithProfiles = await Promise.all(
        data.map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', request.user_id)
            .single();
          
          const { data: authUser } = await supabase.auth.admin.getUserById(request.user_id).catch(() => ({ data: null }));
          
          return {
            ...request,
            profile,
            email: authUser?.user?.email,
          };
        })
      );

      return requestsWithProfiles as JournalistRequest[];
    },
    enabled: !!user,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ requestId, userId, action }: { requestId: string; userId: string; action: 'approve' | 'reject' }) => {
      // Update request status
      const { error: requestError } = await supabase
        .from('journalist_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // If approved, add journalist role
      if (action === 'approve') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'journalist',
          });

        if (roleError && !roleError.message.includes('duplicate')) {
          throw roleError;
        }
      }
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-journalist-requests'] });
      toast({
        title: action === 'approve' 
          ? (language === 'om' ? 'Fudhatame!' : 'Approved!')
          : (language === 'om' ? 'Kufame' : 'Rejected'),
        description: action === 'approve'
          ? (language === 'om' ? 'Fayyadamaan amma gaazexeessaa ta\'e.' : 'User is now a journalist.')
          : (language === 'om' ? 'Gaaffiin kufame.' : 'Request has been rejected.'),
      });
      setSelectedRequest(null);
      setReviewNotes('');
      setActionType(null);
    },
    onError: (error: any) => {
      toast({
        title: language === 'om' ? 'Dogoggora' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAction = (request: JournalistRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
  };

  const confirmAction = () => {
    if (!selectedRequest || !actionType) return;
    reviewMutation.mutate({
      requestId: selectedRequest.id,
      userId: selectedRequest.user_id,
      action: actionType,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'om' ? 'en-US' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">
            {language === 'om' ? 'Gaaffilee Gaazexeessummaa' : 'Journalist Requests'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'om' 
              ? 'Gaaffilee fayyadamtoota gamaaggami fi murtoo kenni.'
              : 'Review and approve journalist access requests.'}
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="py-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : requests && requests.length > 0 ? (
          <div className="grid gap-4">
            {requests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="py-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {request.profile?.full_name || request.email || 'Unknown User'}
                          </span>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(request.created_at)}
                          </Badge>
                        </div>
                        
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground mb-1">
                            {language === 'om' ? 'Sababii:' : 'Reason:'}
                          </p>
                          <p className="text-sm">{request.reason}</p>
                        </div>

                        {request.portfolio_url && (
                          <a
                            href={request.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {language === 'om' ? 'Poortifooliyoo Ilaali' : 'View Portfolio'}
                          </a>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-destructive hover:text-destructive"
                          onClick={() => handleAction(request, 'reject')}
                        >
                          <XCircle className="w-4 h-4" />
                          {language === 'om' ? 'Kufi' : 'Reject'}
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => handleAction(request, 'approve')}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {language === 'om' ? 'Fudhu' : 'Approve'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {language === 'om' 
                  ? 'Gaaffiin eeggataa hin jiru.'
                  : 'No pending requests.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' 
                  ? (language === 'om' ? 'Gaaffii Fudhu' : 'Approve Request')
                  : (language === 'om' ? 'Gaaffii Kufi' : 'Reject Request')}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'approve'
                  ? (language === 'om' 
                      ? 'Fayyadamaan kun gaazexeessaa ta\'a barruulee barreessuu ni danda\'a.'
                      : 'This user will become a journalist and can write articles.')
                  : (language === 'om'
                      ? 'Gaaffii kana kufuuf murtaa\'uu barbaaddaa?'
                      : 'Are you sure you want to reject this request?')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'om' ? 'Yaada (Dirqama miti)' : 'Notes (Optional)'}
              </label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={language === 'om' ? 'Yaada dabalataa...' : 'Additional notes...'}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                {language === 'om' ? 'Haqi' : 'Cancel'}
              </Button>
              <Button
                variant={actionType === 'approve' ? 'default' : 'destructive'}
                onClick={confirmAction}
                disabled={reviewMutation.isPending}
              >
                {reviewMutation.isPending 
                  ? (language === 'om' ? 'Hojjechaa...' : 'Processing...')
                  : actionType === 'approve' 
                    ? (language === 'om' ? 'Fudhu' : 'Approve')
                    : (language === 'om' ? 'Kufi' : 'Reject')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
