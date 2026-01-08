import { useState } from 'react';
import { useAdminStats, useUpdateAISettings } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Bot, Save, AlertTriangle } from 'lucide-react';

export function AISettingsPanel() {
  const { data: stats, isLoading } = useAdminStats();
  const updateSettings = useUpdateAISettings();

  const aiEnabled = (stats?.aiSettings?.ai_enabled as { enabled?: boolean })?.enabled ?? true;
  const verificationThreshold = (stats?.aiSettings?.ai_verification_threshold as { threshold?: number })?.threshold ?? 0.7;

  const [localEnabled, setLocalEnabled] = useState<boolean | null>(null);
  const [localThreshold, setLocalThreshold] = useState<number | null>(null);

  const currentEnabled = localEnabled ?? aiEnabled;
  const currentThreshold = localThreshold ?? verificationThreshold;

  const hasChanges = localEnabled !== null || localThreshold !== null;

  const handleSave = async () => {
    try {
      if (localEnabled !== null) {
        await updateSettings.mutateAsync({
          key: 'ai_enabled',
          value: { enabled: localEnabled }
        });
      }
      if (localThreshold !== null) {
        await updateSettings.mutateAsync({
          key: 'ai_verification_threshold',
          value: { threshold: localThreshold }
        });
      }
      setLocalEnabled(null);
      setLocalThreshold(null);
      toast({
        title: 'Settings Saved',
        description: 'AI settings have been updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>AI Control Panel (QALACA)</CardTitle>
              <CardDescription>Configure AI features and verification settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-1">
              <Label htmlFor="ai-enabled" className="text-base font-medium">
                Enable AI Features
              </Label>
              <p className="text-sm text-muted-foreground">
                Turn on/off all QALACA AI features across the platform
              </p>
            </div>
            <Switch
              id="ai-enabled"
              checked={currentEnabled}
              onCheckedChange={(checked) => setLocalEnabled(checked)}
            />
          </div>

          <div className="p-4 rounded-lg border space-y-4">
            <div className="space-y-1">
              <Label className="text-base font-medium">
                Verification Threshold
              </Label>
              <p className="text-sm text-muted-foreground">
                Minimum confidence score required for AI verification results
              </p>
            </div>
            <div className="space-y-2">
              <Slider
                value={[currentThreshold * 100]}
                onValueChange={(value) => setLocalThreshold(value[0] / 100)}
                min={50}
                max={100}
                step={5}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>50%</span>
                <span className="font-medium text-foreground">{Math.round(currentThreshold * 100)}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {!currentEnabled && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">AI Features Disabled</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  When disabled, users will not be able to use AI verification, summarization, or explanation features.
                </p>
              </div>
            </div>
          )}

          {hasChanges && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setLocalEnabled(null);
                  setLocalThreshold(null);
                }}
              >
                Cancel
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm AI Settings Change</AlertDialogTitle>
                    <AlertDialogDescription>
                      {localEnabled === false && (
                        <span className="block text-yellow-600 dark:text-yellow-400 font-medium mb-2">
                          Warning: Disabling AI will affect all users immediately.
                        </span>
                      )}
                      Are you sure you want to save these AI configuration changes?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSave} disabled={updateSettings.isPending}>
                      {updateSettings.isPending ? 'Saving...' : 'Confirm'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Usage Statistics</CardTitle>
          <CardDescription>Overview of AI feature usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-3xl font-bold">{stats?.totalAiLogs || 0}</p>
              <p className="text-sm text-muted-foreground">Total AI Interactions</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-3xl font-bold">{stats?.roleCounts?.journalist || 0}</p>
              <p className="text-sm text-muted-foreground">Active Journalists</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-3xl font-bold">{Math.round(currentThreshold * 100)}%</p>
              <p className="text-sm text-muted-foreground">Verification Threshold</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
