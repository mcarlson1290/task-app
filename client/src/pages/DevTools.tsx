import React, { useState, useEffect } from 'react';
import { useLocation as useWouterLocation } from 'wouter';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Task } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, SkipForward, Trash2, ArrowLeft, Settings, Bug, Monitor } from 'lucide-react';
import { detectIOSEnvironment, testStorageAvailability } from '@/config/authConfig';

const DevTools = () => {
  const [, setLocation] = useWouterLocation();
  const [overdueProtection, setOverdueProtection] = useState(
    localStorage.getItem('devOverdueProtection') === 'true'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<any>({});
  const { toast } = useToast();
  const { currentUser } = useUser();

  // Check access for Corporate users only
  
  // Only allow access for Corporate users (Robert and Matt)
  const hasAccess = currentUser && 
    currentUser.role === 'Corporate' && 
    (currentUser.email === 'robert@growspace.farm' || currentUser.email === 'matt@growspace.farm');

  // Load debug information
  useEffect(() => {
    if (!hasAccess) return;
    
    // Get device info
    const { isIOS, isTeamsApp, isWebView, isSafari } = detectIOSEnvironment();
    const storageInfo = testStorageAvailability();
    
    setDeviceInfo({
      isIOS,
      isTeamsApp, 
      isWebView,
      isSafari,
      userAgent: navigator.userAgent,
      screen: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      cookies: navigator.cookieEnabled,
      online: navigator.onLine,
      storage: storageInfo,
      language: navigator.language,
      platform: navigator.platform
    });
    
    // Load existing debug logs
    const storedLogs = sessionStorage.getItem('authDebugLogs');
    if (storedLogs) {
      try {
        setDebugLogs(JSON.parse(storedLogs));
      } catch (e) {
        console.warn('Failed to parse debug logs:', e);
      }
    }
    
    // Update logs every 5 seconds (less frequent than the corner debug panel)
    const interval = setInterval(() => {
      const storedLogs = sessionStorage.getItem('authDebugLogs');
      if (storedLogs) {
        try {
          const logs = JSON.parse(storedLogs);
          setDebugLogs(logs);
        } catch (e) {
          console.warn('Failed to parse debug logs:', e);
        }
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [hasAccess]);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              Developer tools are restricted to corporate managers only.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Toggle overdue protection
  const toggleOverdueProtection = () => {
    const newValue = !overdueProtection;
    setOverdueProtection(newValue);
    localStorage.setItem('devOverdueProtection', newValue.toString());
    
    toast({
      title: `Overdue Protection ${newValue ? 'ENABLED' : 'DISABLED'}`,
      description: newValue 
        ? 'Tasks will not show as overdue during testing' 
        : 'Normal overdue behavior restored',
      variant: newValue ? 'default' : 'destructive',
    });
  };

  // Skip all overdue tasks
  const skipAllOverdueTasks = async () => {
    if (!window.confirm('This will skip ALL overdue tasks. Are you sure?')) {
      return;
    }

    setIsProcessing(true);
    try {
      // Get all tasks from the API
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const tasks = await response.json();
      
      // Find overdue tasks
      const now = new Date();
      const overdueTasks = tasks.filter((task: Task) => 
        task.status !== 'completed' && 
        task.status !== 'skipped' && 
        task.dueDate && new Date(task.dueDate) < now
      );

      // Skip each overdue task
      let skippedCount = 0;
      for (const task of overdueTasks) {
        try {
          await apiRequest('PATCH', `/api/tasks/${task.id}`, {
            status: 'skipped',
            skipReason: 'Bulk skip via dev tools',
            skippedAt: now.toISOString()
          });
          skippedCount++;
        } catch (error) {
          console.error(`Failed to skip task ${task.id}:`, error);
        }
      }

      toast({
        title: `Skipped ${skippedCount} overdue tasks`,
        description: `Successfully processed ${skippedCount} out of ${overdueTasks.length} overdue tasks`,
      });
    } catch (error) {
      console.error('Error skipping tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to skip overdue tasks. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear debug logs
  const clearDebugLogs = () => {
    sessionStorage.removeItem('authDebugLogs');
    setDebugLogs([]);
    
    toast({
      title: 'Debug Logs Cleared',
      description: 'All authentication debug logs have been removed.',
    });
  };

  // Clear all test data (this would need API endpoints to clear data safely)
  const clearTestData = async () => {
    if (!window.confirm('This will clear ALL test tasks and data. Are you sure? This action cannot be undone.')) {
      return;
    }

    setIsProcessing(true);
    try {
      // Note: In a real implementation, you'd want specific API endpoints for this
      // For now, we'll just clear localStorage dev settings
      localStorage.removeItem('devOverdueProtection');
      setOverdueProtection(false);
      
      toast({
        title: 'Test Data Cleared',
        description: 'Development settings have been reset. Database clearing would need API endpoints.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error clearing test data:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear test data. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#203B17] flex items-center gap-2">
              <Settings className="w-8 h-8" />
              Developer Tools
            </h1>
            <p className="text-gray-600 mt-1">Testing utilities for development</p>
          </div>
          <Button onClick={() => setLocation('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App
          </Button>
        </div>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current User</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Name:</strong> {currentUser?.name}</p>
            <p><strong>Email:</strong> {currentUser?.email}</p>
            <p><strong>Role:</strong> {currentUser?.role}</p>
          </CardContent>
        </Card>

        {/* Developer Tools */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Overdue Protection Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Overdue Protection
              </CardTitle>
              <CardDescription>
                When enabled, tasks will never show as overdue (for testing)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={toggleOverdueProtection}
                className={`w-full ${overdueProtection 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-[#2D8028] hover:bg-green-700'
                }`}
                data-testid="button-toggle-overdue-protection"
              >
                {overdueProtection ? (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Protection ON
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Protection OFF
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Skip All Overdue Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SkipForward className="w-5 h-5" />
                Skip Overdue Tasks
              </CardTitle>
              <CardDescription>
                Mark all currently overdue tasks as skipped
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={skipAllOverdueTasks}
                disabled={isProcessing}
                className="w-full bg-orange-600 hover:bg-orange-700"
                data-testid="button-skip-overdue-tasks"
              >
                {isProcessing ? (
                  'Processing...'
                ) : (
                  <>
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip All Overdue
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Clear Test Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Clear Test Data
              </CardTitle>
              <CardDescription>
                Remove development settings and reset testing state
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={clearTestData}
                disabled={isProcessing}
                variant="destructive"
                className="w-full"
                data-testid="button-clear-test-data"
              >
                {isProcessing ? (
                  'Processing...'
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Test Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Device Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Device Information
              </CardTitle>
              <CardDescription>
                Device and browser environment details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Platform:</span>
                  <span className="font-mono text-xs">{deviceInfo.platform || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Screen:</span>
                  <span className="font-mono text-xs">{deviceInfo.screen || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Viewport:</span>
                  <span className="font-mono text-xs">{deviceInfo.viewport || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>iOS:</span>
                  <span>{deviceInfo.isIOS ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Teams App:</span>
                  <span>{deviceInfo.isTeamsApp ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span>WebView:</span>
                  <span>{deviceInfo.isWebView ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Safari:</span>
                  <span>{deviceInfo.isSafari ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cookies:</span>
                  <span>{deviceInfo.cookies ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Online:</span>
                  <span>{deviceInfo.online ? '✅' : '❌'}</span>
                </div>
                {deviceInfo.storage && (
                  <>
                    <div className="flex justify-between">
                      <span>Local Storage:</span>
                      <span>{deviceInfo.storage.localStorage ? '✅' : '❌'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Session Storage:</span>
                      <span>{deviceInfo.storage.sessionStorage ? '✅' : '❌'}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Debug Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="w-5 h-5" />
                Auth Debug Logs ({debugLogs.length})
              </CardTitle>
              <CardDescription>
                Recent authentication debug information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {debugLogs.length === 0 ? (
                  <div className="text-sm text-gray-500 italic">No debug logs yet...</div>
                ) : (
                  debugLogs.slice(-10).reverse().map((log: any, i: number) => (
                    <div key={i} className="text-xs p-2 bg-gray-100 rounded border-l-2 border-blue-400">
                      <div className="text-gray-500 mb-1">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="font-medium mb-1">{log.message}</div>
                      {log.data && (
                        <div className="text-gray-600 font-mono">
                          {typeof log.data === 'object' ? JSON.stringify(log.data, null, 1) : log.data}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              {debugLogs.length > 0 && (
                <Button
                  onClick={clearDebugLogs}
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full"
                >
                  Clear Debug Logs
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Information */}
        <Card>
          <CardHeader>
            <CardTitle>Current Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Overdue Protection:</span>
                <span className={`font-medium ${overdueProtection ? 'text-red-600' : 'text-green-600'}`}>
                  {overdueProtection ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Environment:</span>
                <span className="font-medium">Development</span>
              </div>
              <div className="flex justify-between">
                <span>Access Level:</span>
                <span className="font-medium text-blue-600">Corporate Manager</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevTools;