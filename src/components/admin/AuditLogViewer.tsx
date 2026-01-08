import { useState } from 'react';
import { useAuditLogs } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, FileText, Filter } from 'lucide-react';
import { format } from 'date-fns';

const actionTypes = [
  'ADMIN_BOOTSTRAP',
  'ADMIN_INVITE_CREATED',
  'ADMIN_INVITE_ACCEPTED',
  'ADMIN_ACCESS_REVOKED',
  'USER_ROLE_CHANGED',
  'AI_SETTINGS_UPDATED',
  'JOURNALIST_APPROVED',
  'JOURNALIST_REJECTED',
];

const actionColors: Record<string, string> = {
  ADMIN_BOOTSTRAP: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ADMIN_INVITE_CREATED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ADMIN_INVITE_ACCEPTED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  ADMIN_ACCESS_REVOKED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  USER_ROLE_CHANGED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  AI_SETTINGS_UPDATED: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  JOURNALIST_APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  JOURNALIST_REJECTED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export function AuditLogViewer() {
  const [page, setPage] = useState(1);
  const [actionType, setActionType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { data, isLoading } = useAuditLogs(
    page,
    actionType || undefined,
    startDate || undefined,
    endDate || undefined
  );

  const clearFilters = () => {
    setActionType('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Immutable record of all admin actions</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-muted/50">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={actionType} onValueChange={(val) => { setActionType(val); setPage(1); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              placeholder="Start date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-40"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              placeholder="End date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-40"
            />
          </div>
          {(actionType || startDate || endDate) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.logs && data.logs.length > 0 ? (
                data.logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.admin_email}
                    </TableCell>
                    <TableCell>
                      <Badge className={actionColors[log.action_type] || 'bg-gray-100 text-gray-800'}>
                        {log.action_type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <code className="text-xs bg-muted p-1 rounded break-all">
                        {JSON.stringify(log.metadata).slice(0, 100)}
                        {JSON.stringify(log.metadata).length > 100 && '...'}
                      </code>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {log.ip_address || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data?.total ? `Total: ${data.total} logs` : 'No logs'}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-3 text-sm">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!data?.logs?.length || data.logs.length < 50}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
