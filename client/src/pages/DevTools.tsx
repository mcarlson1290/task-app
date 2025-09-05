import React, { useState, useEffect } from 'react';
import { useLocation as useWouterLocation } from 'wouter';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Task } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, SkipForward, Trash2, ArrowLeft, Settings, Bug, Monitor, RotateCcw } from 'lucide-react';
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

  // Auto-generate missing tasks on load
  useEffect(() => {
    if (!hasAccess) return;

    const checkAndGenerateMissingTasks = async () => {
      try {
        console.log('🔄 Checking for missing tasks...');
        
        // Get existing tasks and templates
        const [tasksResponse, templatesResponse] = await Promise.all([
          apiRequest('GET', '/api/tasks'),
          apiRequest('GET', '/api/recurring-tasks')
        ]);
        
        const existingTasks = await tasksResponse.json();
        const templates = await templatesResponse.json();
        
        if (templates.length === 0) {
          console.log('⚠️ No recurring task templates found');
          return;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let created = 0;
        
        // Check each day for the next 31 days
        for (let day = 0; day < 31; day++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() + day);
          
          for (const template of templates) {
            // Determine if this template should generate a task on this date
            const shouldGenerate = shouldGenerateOnDate(template, checkDate);
            
            if (shouldGenerate) {
              // Check if task already exists for this template and date
              const dateStr = checkDate.toISOString().split('T')[0];
              const existingTask = existingTasks.find((task: any) => 
                task.recurringTaskId === template.id && 
                task.dueDate?.startsWith(dateStr)
              );
              
              if (!existingTask) {
                const taskData = buildTaskFromTemplate(template, checkDate);
                
                try {
                  await apiRequest('POST', '/api/tasks', taskData);
                  created++;
                  console.log(`🆕 Auto-created: ${taskData.title} - ${dateStr}`);
                } catch (error) {
                  console.error(`❌ Failed to auto-create task for template ${template.id}:`, error);
                }
              }
            }
          }
        }
        
        if (created > 0) {
          console.log(`✅ Auto-generated ${created} missing tasks`);
          toast({
            title: 'Auto-Generation Complete',
            description: `Generated ${created} missing tasks from templates.`,
          });
        } else {
          console.log('✅ All tasks up to date - no generation needed');
        }
        
      } catch (error) {
        console.error('❌ Failed to auto-generate missing tasks:', error);
      }
    };
    
    // Run auto-generation after a short delay to let the page load
    const timeoutId = setTimeout(checkAndGenerateMissingTasks, 2000);
    
    return () => clearTimeout(timeoutId);
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

  // Delete all tasks (but keep recurring templates)
  const deleteAllTasks = async () => {
    if (!window.confirm('⚠️ This will DELETE ALL TASKS. Recurring templates will remain. Continue?')) {
      return;
    }
    
    setIsProcessing(true);
    try {
      // Get all tasks
      const response = await apiRequest('GET', '/api/tasks');
      const allTasks = await response.json();
      
      console.log(`Deleting ${allTasks.length} tasks...`);
      
      let deleted = 0;
      for (const task of allTasks) {
        try {
          await apiRequest('DELETE', `/api/tasks/${task.id}`);
          deleted++;
        } catch (error) {
          console.error(`Failed to delete task ${task.id}:`, error);
        }
      }
      
      console.log(`Deleted ${deleted} tasks. Ready for fresh generation.`);
      toast({
        title: 'Tasks Deleted',
        description: `Successfully deleted ${deleted} tasks. Recurring templates preserved.`,
      });
      
      // Small delay before reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to delete tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete all tasks. See console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate tasks from recurring templates
  const generateTasksFromTemplates = async () => {
    setIsProcessing(true);
    try {
      console.log('Starting fresh task generation...');
      
      // Get all recurring task templates
      const response = await apiRequest('GET', '/api/recurring-tasks');
      const templates = await response.json();
      console.log(`Found ${templates.length} recurring task templates`);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let created = 0;
      
      // Look at each day for the next 31 days
      for (let day = 0; day < 31; day++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + day);
        
        for (const template of templates) {
          // Determine if this template should generate a task on this date
          const shouldGenerate = shouldGenerateOnDate(template, checkDate);
          
          if (shouldGenerate) {
            const taskData = buildTaskFromTemplate(template, checkDate);
            
            try {
              // Create the task
              await apiRequest('POST', '/api/tasks', taskData);
              created++;
              console.log(`Created: ${taskData.title} - ${taskData.dueDate}`);
            } catch (error) {
              console.error(`Failed to create task for template ${template.id}:`, error);
            }
          }
        }
      }
      
      console.log(`Generation complete. Created ${created} new tasks.`);
      toast({
        title: 'Tasks Generated',
        description: `Successfully generated ${created} tasks for the next 31 days.`,
      });
      
      // Small delay before reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to generate tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate tasks. See console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to determine if a template should generate a task on a given date
  const shouldGenerateOnDate = (template: any, checkDate: Date): boolean => {
    const frequency = template.frequency?.toLowerCase() || 'daily';
    
    switch (frequency) {
      case 'daily':
        // Generate every day
        return true;
        
      case 'weekly':
        // Generate based on selected days of week
        const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const activeDays = template.activeDays || [0, 1, 2, 3, 4, 5, 6]; // Default to all days
        return activeDays.includes(dayOfWeek);
        
      case 'biweekly':
        // Generate on 1st and 15th of each month
        const dayOfMonth = checkDate.getDate();
        return dayOfMonth === 1 || dayOfMonth === 15;
        
      case 'monthly':
        // Generate on 1st of each month
        return checkDate.getDate() === 1;
        
      case 'quarterly':
        // Generate on 1st of quarter months (Jan, Apr, Jul, Oct)
        const month = checkDate.getMonth(); // 0 = January
        const isQuarterStart = [0, 3, 6, 9].includes(month);
        return checkDate.getDate() === 1 && isQuarterStart;
        
      default:
        return false;
    }
  };

  // Helper function to build a task from a template
  const buildTaskFromTemplate = (template: any, dueDate: Date): any => {
    const dateStr = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    return {
      title: template.title,
      description: template.description || '',
      type: template.type || 'general',
      priority: template.priority || 'medium',
      status: 'pending',
      dueDate: dueDate.toISOString(),
      location: template.location || 'Unknown',
      assignTo: template.assignTo || null,
      estimatedDuration: template.estimatedDuration || 30,
      requiresApproval: template.requiresApproval || false,
      checklist: template.checklist || [],
      recurringTaskId: template.id,
      completedBy: null,
      completedAt: null,
      approvedBy: null,
      approvedAt: null,
      notes: '',
      timeTracking: {
        startTime: null,
        endTime: null,
        totalMinutes: 0,
        isPaused: false,
        pausedTime: 0
      }
    };
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

          {/* Delete All Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Delete All Tasks
              </CardTitle>
              <CardDescription>
                Remove ALL task instances while preserving recurring templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={deleteAllTasks}
                disabled={isProcessing}
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700"
                data-testid="button-delete-all-tasks"
              >
                {isProcessing ? (
                  'Deleting...'
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    🗑️ DELETE ALL TASKS (Start Fresh)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generate Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Generate Tasks from Templates
              </CardTitle>
              <CardDescription>
                Create task instances for the next 31 days from recurring templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={generateTasksFromTemplates}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700"
                data-testid="button-generate-tasks"
              >
                {isProcessing ? (
                  'Generating...'
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    🔄 Generate Tasks for Next 31 Days
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