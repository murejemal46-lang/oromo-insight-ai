import { useAdminStats } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, FileText, UserPlus, Bot, Shield, Edit3, Newspaper, BookOpen } from 'lucide-react';

export function AdminOverview() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      description: 'Registered users',
    },
    {
      title: 'Total Articles',
      value: stats?.totalArticles || 0,
      icon: FileText,
      description: 'All articles',
    },
    {
      title: 'Pending Requests',
      value: stats?.pendingJournalistRequests || 0,
      icon: UserPlus,
      description: 'Journalist applications',
    },
    {
      title: 'AI Usage Logs',
      value: stats?.totalAiLogs || 0,
      icon: Bot,
      description: 'QALACA interactions',
    },
  ];

  const roleCards = [
    { role: 'Admins', count: stats?.roleCounts?.admin || 0, icon: Shield },
    { role: 'Editors', count: stats?.roleCounts?.editor || 0, icon: Edit3 },
    { role: 'Journalists', count: stats?.roleCounts?.journalist || 0, icon: Newspaper },
    { role: 'Readers', count: stats?.roleCounts?.reader || 0, icon: BookOpen },
  ];

  const aiEnabled = stats?.aiSettings?.ai_enabled as { enabled?: boolean } | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">
          System status and key metrics for Oromo Times
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Roles Distribution</CardTitle>
            <CardDescription>Breakdown by role type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {roleCards.map((role) => (
                <div key={role.role} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <role.icon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{role.role}</p>
                    <p className="text-2xl font-bold">{role.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI System Status</CardTitle>
            <CardDescription>QALACA AI configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-primary" />
                <span className="font-medium">AI Features</span>
              </div>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                aiEnabled?.enabled 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {aiEnabled?.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="font-medium">Verification Threshold</span>
              <span className="text-lg font-bold">
                {((stats?.aiSettings?.ai_verification_threshold as { threshold?: number })?.threshold || 0.7) * 100}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
