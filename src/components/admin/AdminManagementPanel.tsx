import { useState } from 'react';
import { useAdminList, useInviteAdmin, useRevokeAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Shield, UserPlus, Copy, X } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/useAuthStore';

export function AdminManagementPanel() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { data, isLoading } = useAdminList();
  const inviteAdmin = useInviteAdmin();
  const revokeAdmin = useRevokeAdmin();

  const handleInvite = async () => {
    if (!inviteEmail) return;

    try {
      const result = await inviteAdmin.mutateAsync(inviteEmail);
      setInviteToken(result.token);
      toast({
        title: 'Invitation Created',
        description: 'Share the invitation link with the new admin',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create invitation',
        variant: 'destructive',
      });
    }
  };

  const handleRevoke = async (targetUserId: string, email: string) => {
    try {
      await revokeAdmin.mutateAsync(targetUserId);
      toast({
        title: 'Access Revoked',
        description: `Admin access removed for ${email}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to revoke access',
        variant: 'destructive',
      });
    }
  };

  const copyInviteLink = () => {
    if (inviteToken) {
      const link = `${window.location.origin}/admin/accept-invite?token=${inviteToken}&email=${encodeURIComponent(inviteEmail)}`;
      navigator.clipboard.writeText(link);
      toast({ title: 'Copied', description: 'Invitation link copied to clipboard' });
    }
  };

  const resetInviteDialog = () => {
    setInviteDialogOpen(false);
    setInviteEmail('');
    setInviteToken(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Admin Management</CardTitle>
              <CardDescription>Invite new admins or revoke access</CardDescription>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={(open) => !open && resetInviteDialog()}>
              <DialogTrigger asChild>
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New Admin</DialogTitle>
                  <DialogDescription>
                    Enter the email address of the person you want to invite as an admin.
                    They will receive a unique invitation link.
                  </DialogDescription>
                </DialogHeader>
                {!inviteToken ? (
                  <>
                    <div className="py-4">
                      <Input
                        type="email"
                        placeholder="admin@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={resetInviteDialog}>Cancel</Button>
                      <Button onClick={handleInvite} disabled={!inviteEmail || inviteAdmin.isPending}>
                        {inviteAdmin.isPending ? 'Creating...' : 'Create Invitation'}
                      </Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <div className="py-4 space-y-4">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                          Invitation created successfully! Share this link with <strong>{inviteEmail}</strong>:
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 bg-background rounded text-xs break-all">
                            {`${window.location.origin}/admin/accept-invite?token=${inviteToken.slice(0, 8)}...`}
                          </code>
                          <Button size="sm" variant="outline" onClick={copyInviteLink}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This invitation expires in 24 hours and can only be used once.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button onClick={resetInviteDialog}>Done</Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.email}</TableCell>
                  <TableCell>{admin.fullName || '-'}</TableCell>
                  <TableCell>
                    {admin.isSystemOwner ? (
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        <Shield className="h-3 w-3 mr-1" />
                        System Owner
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Admin
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {admin.createdAt ? format(new Date(admin.createdAt), 'MMM d, yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    {admin.lastSignIn ? format(new Date(admin.lastSignIn), 'MMM d, yyyy') : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    {!admin.isSystemOwner && admin.id !== user?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <X className="h-4 w-4 mr-1" />
                            Revoke
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Admin Access?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove admin access for <strong>{admin.email}</strong>.
                              They will be downgraded to a reader role.
                              This action can be undone by inviting them again.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleRevoke(admin.id, admin.email || '')}
                              disabled={revokeAdmin.isPending}
                            >
                              {revokeAdmin.isPending ? 'Revoking...' : 'Revoke Access'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {admin.id === user?.id && (
                      <span className="text-sm text-muted-foreground">You</span>
                    )}
                    {admin.isSystemOwner && admin.id !== user?.id && (
                      <span className="text-sm text-muted-foreground">Protected</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
