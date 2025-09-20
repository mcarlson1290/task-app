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
  const [verificationReport, setVerificationReport] = useState<any>(null);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
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

  // Load verification report
  const fetchVerificationReport = async () => {
    try {
      const response = await apiRequest('GET', '/api/dev/verification-report');
      setVerificationReport(response);
    } catch (error) {
      console.error('Failed to fetch verification report:', error);
    }
  };

  // Auto-fetch verification report on load and then periodically
  useEffect(() => {
    if (!hasAccess) return;
    
    fetchVerificationReport();
    
    // Update verification report every 30 seconds
    const interval = setInterval(fetchVerificationReport, 30000);
    return () => clearInterval(interval);
  }, [hasAccess]);

  // Manual verification trigger
  const runManualVerification = async () => {
    setIsVerificationLoading(true);
    try {
      const response = await apiRequest('POST', '/api/dev/run-verification', {});
      
      toast({
        title: 'Verification Complete',
        description: `Created ${response.result.missingTasksCreated} missing tasks, removed ${response.result.duplicatesRemoved} duplicates`,
      });
      
      // Refresh the verification report
      await fetchVerificationReport();
    } catch (error) {
      console.error('Manual verification failed:', error);
      toast({
        title: 'Verification Failed',
        description: 'Failed to run verification. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsVerificationLoading(false);
    }
  };

  // Auto-generate missing tasks on load (improved 31-day system)
  useEffect(() => {
    if (!hasAccess) return;

    const autoPopulateIfNeeded = async () => {
      try {
        console.log('🔄 Checking if task auto-generation is needed...');
        
        // Get existing tasks
        const tasksResponse = await apiRequest('GET', '/api/tasks');
        const existingTasks = await tasksResponse.json();
        
        if (existingTasks.length === 0) {
          console.log('📋 No existing tasks found - running full 31-day population');
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          let totalCreated = 0;
          
          // Generate for each of the next 31 days
          for (let day = 0; day <= 31; day++) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + day);
            
            const created = await generateTasksForFutureDate(targetDate);
            totalCreated += created;
          }
          
          if (totalCreated > 0) {
            console.log(`✅ Auto-populated ${totalCreated} tasks for next 31 days`);
            toast({
              title: 'Auto-Population Complete',
              description: `Generated ${totalCreated} tasks for the next 31 days.`,
            });
          }
        } else {
          console.log('📋 Existing tasks found - running daily generation check');
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Just generate for today's future date (31 days from now)
          const futureDate = new Date(today);
          futureDate.setDate(today.getDate() + 31);
          
          const created = await generateTasksForFutureDate(futureDate);
          
          if (created > 0) {
            console.log(`✅ Auto-generated ${created} tasks for ${futureDate.toDateString()}`);
            toast({
              title: 'Auto-Generation Complete',
              description: `Generated ${created} missing tasks for future date.`,
            });
          } else {
            console.log('✅ All tasks up to date - no generation needed');
          }
        }
        
      } catch (error) {
        console.error('❌ Failed to auto-generate tasks:', error);
      }
    };
    
    // Run auto-generation after a short delay to let the page load
    const timeoutId = setTimeout(autoPopulateIfNeeded, 2000);
    
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

  // Debug function to test what we're actually getting
  const debugRecurringTasks = async () => {
    console.log('=== GENERATION DEBUG ===');
    
    try {
      console.log('Testing recurring tasks API...');
      const response = await apiRequest('GET', '/api/recurring-tasks');
      const templates = await response.json();
      
      console.log('📋 Recurring templates loaded:', templates.length);
      console.log('📋 First few templates:', templates.slice(0, 3));
      console.log('📋 Template IDs found:', templates.map((t: any) => t.id));
      
      toast({
        title: 'Debug Complete',
        description: `Found ${templates.length} templates. Check console for details.`,
      });
      
    } catch (error) {
      console.error('❌ Failed to load recurring tasks:', error);
      toast({
        title: 'Debug Failed', 
        description: 'Could not load recurring tasks. Check console.',
        variant: 'destructive',
      });
    }
  };

  // Test creating a single task
  const testCreateSingleTask = async () => {
    console.log('=== SINGLE TASK TEST ===');
    
    try {
      // Get the first recurring task template
      const response = await apiRequest('GET', '/api/recurring-tasks');
      const templates = await response.json();
      
      if (templates.length === 0) {
        console.error('❌ No recurring templates found!');
        toast({
          title: 'No Templates',
          description: 'No recurring task templates found in database.',
          variant: 'destructive',
        });
        return;
      }
      
      const firstTemplate = templates[0];
      console.log('🎯 Using template:', firstTemplate);
      
      const testTask = {
        title: `🧪 TEST: ${firstTemplate.title}`,
        description: firstTemplate.description || 'Test task generated',
        type: firstTemplate.type || 'general',
        priority: firstTemplate.priority || 'medium',
        status: 'pending',
        dueDate: new Date().toISOString(),
        location: firstTemplate.location || 'Kenosha',
        assignTo: firstTemplate.assignTo || null,
        estimatedDuration: firstTemplate.estimatedDuration || 30,
        requiresApproval: firstTemplate.requiresApproval || false,
        checklist: firstTemplate.checklist || [],
        recurringTaskId: firstTemplate.id,
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
      
      console.log('🎯 Creating test task:', testTask);
      
      const createResponse = await apiRequest('POST', '/api/tasks', testTask);
      
      if (createResponse.ok) {
        console.log('✅ Test task created successfully!');
        toast({
          title: 'Test Success',
          description: 'Single test task created successfully!',
        });
        
        // Reload after success
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const errorData = await createResponse.json();
        console.error('❌ Test task creation failed:', errorData);
        toast({
          title: 'Test Failed',
          description: 'Single task creation failed. Check console.',
          variant: 'destructive',
        });
      }
      
    } catch (error) {
      console.error('❌ Test failed with error:', error);
      toast({
        title: 'Test Error',
        description: 'Test failed with error. Check console.',
        variant: 'destructive',
      });
    }
  };

  // Generate tasks for a specific future date (improved 31-day system)
  const generateTasksForFutureDate = async (futureDate: Date) => {
    const response = await apiRequest('GET', '/api/recurring-tasks');
    const recurringTemplates = await response.json();
    
    console.log(`🔍 DEBUG: Found ${recurringTemplates.length} templates`);
    console.log(`🔍 DEBUG: Template IDs:`, recurringTemplates.map((t: any) => t.id));
    
    const dayOfMonth = futureDate.getDate();
    // FIXED: Use UTC-aware day calculation to avoid timezone issues
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][futureDate.getUTCDay()];
    const month = futureDate.getMonth();
    const year = futureDate.getFullYear();
    
    let created = 0;
    
    for (const template of recurringTemplates) {
      let shouldCreate = false;
      let taskConfig: any = null;
      
      switch (template.frequency) {
        case 'daily': // This is actually weekly tasks
          // Check if template has selectedDays or activeDays
          const activeDays = template.activeDays || template.selectedDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          if (activeDays.includes(dayOfWeek)) {
            shouldCreate = true;
            taskConfig = {
              id: `${template.id}-${futureDate.toISOString().split('T')[0]}`,
              dueDate: futureDate.toISOString(),
            };
          }
          break;
          
        case 'weekly': // Same as daily for now
          const weeklyDays = template.activeDays || template.selectedDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          if (weeklyDays.includes(dayOfWeek)) {
            shouldCreate = true;
            taskConfig = {
              id: `${template.id}-${futureDate.toISOString().split('T')[0]}`,
              dueDate: futureDate.toISOString(),
            };
          }
          break;
          
        case 'biweekly':
        case 'bi-weekly':
          // First half: generate on 1st for days 1-14
          if (dayOfMonth === 1) {
            shouldCreate = true;
            const midMonth = new Date(year, month, 14);
            taskConfig = {
              id: `${template.id}-${year}-${String(month + 1).padStart(2, '0')}-01`,
              dueDate: midMonth.toISOString(),
              periodLabel: '1st-14th'
            };
          }
          // Second half: generate on 15th for days 15-end
          else if (dayOfMonth === 15) {
            const lastDay = new Date(year, month + 1, 0);
            shouldCreate = true;
            taskConfig = {
              id: `${template.id}-${year}-${String(month + 1).padStart(2, '0')}-15`,
              dueDate: lastDay.toISOString(),
              periodLabel: `15th-${lastDay.getDate()}th`
            };
          }
          break;
          
        case 'monthly':
          if (dayOfMonth === 1) {
            const lastDay = new Date(year, month + 1, 0);
            shouldCreate = true;
            taskConfig = {
              id: `${template.id}-${year}-${String(month + 1).padStart(2, '0')}`,
              dueDate: lastDay.toISOString(),
            };
          }
          break;
          
        case 'quarterly':
          const quarterStartMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
          if (quarterStartMonths.includes(month) && dayOfMonth === 1) {
            const quarter = Math.floor(month / 3) + 1;
            const quarterEndDate = new Date(year, month + 3, 0); // Last day of quarter
            shouldCreate = true;
            taskConfig = {
              id: `${template.id}-${year}-Q${quarter}`,
              dueDate: quarterEndDate.toISOString(),
              periodLabel: `Q${quarter}`
            };
          }
          break;
      }
      
      if (shouldCreate && taskConfig) {
        // Check if task already exists by checking for similar tasks
        const existingTasksResponse = await apiRequest('GET', '/api/tasks');
        const existingTasks = await existingTasksResponse.json();
        
        const dateStr = futureDate.toISOString().split('T')[0];
        const exists = existingTasks.find((task: any) => 
          task.recurringTaskId === template.id && 
          task.dueDate?.startsWith(dateStr)
        );
        
        if (!exists) {
          const newTask = {
            title: template.title,
            description: template.description || '',
            type: template.type || 'general',
            priority: template.priority || 'medium',
            status: 'pending',
            dueDate: taskConfig.dueDate,
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
          
          try {
            await apiRequest('POST', '/api/tasks', newTask);
            created++;
            console.log(`✅ Created: ${newTask.title} for ${dateStr}`);
          } catch (error) {
            console.error(`❌ Failed to create task for template ${template.id}:`, error);
          }
        }
      }
    }
    
    return created;
  };

  // Populate next 31 days (initial setup)
  const populateNext31Days = async () => {
    setIsProcessing(true);
    try {
      console.log('🔄 Populating tasks for next 31 days...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let totalCreated = 0;
      
      // Generate for each of the next 31 days
      for (let day = 0; day <= 31; day++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + day);
        
        const created = await generateTasksForFutureDate(targetDate);
        totalCreated += created;
      }
      
      console.log(`✅ Population complete - created ${totalCreated} tasks`);
      toast({
        title: 'Tasks Generated',
        description: `Successfully generated ${totalCreated} tasks for the next 31 days.`,
      });
      
      // Small delay before reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to populate tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate tasks. See console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Daily generation process (maintains 31-day buffer)
  const runDailyGeneration = async () => {
    setIsProcessing(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calculate the date 31 days from now
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 31);
      
      console.log(`🎯 Generating tasks for ${futureDate.toDateString()}`);
      const created = await generateTasksForFutureDate(futureDate);
      
      if (created > 0) {
        console.log(`✅ Daily generation complete - created ${created} tasks`);
        toast({
          title: 'Daily Generation Complete',
          description: `Generated ${created} tasks for ${futureDate.toDateString()}.`,
        });
      } else {
        console.log('✅ Daily generation complete - no new tasks needed');
        toast({
          title: 'Daily Generation Complete',
          description: 'No new tasks needed for the future date.',
        });
      }
      
    } catch (error) {
      console.error('❌ Daily generation failed:', error);
      toast({
        title: 'Error',
        description: 'Daily generation failed. See console for details.',
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

          {/* Debug Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Debug Generation Issues
              </CardTitle>
              <CardDescription>
                Test what's causing the foreign key constraint errors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={debugRecurringTasks}
                disabled={isProcessing}
                className="w-full bg-purple-600 hover:bg-purple-700"
                data-testid="button-debug-recurring"
              >
                <Settings className="w-4 h-4 mr-2" />
                🔍 Debug Recurring Tasks API
              </Button>
              
              <Button
                onClick={testCreateSingleTask}
                disabled={isProcessing}
                className="w-full bg-red-600 hover:bg-red-700"
                data-testid="button-test-single"
              >
                <Settings className="w-4 h-4 mr-2" />
                🧪 Create ONE Test Task
              </Button>
            </CardContent>
          </Card>

          {/* Populate 31 Days */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Populate Next 31 Days
              </CardTitle>
              <CardDescription>
                Generate task instances for the entire next 31 days (initial setup)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={populateNext31Days}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700"
                data-testid="button-populate-31-days"
              >
                {isProcessing ? (
                  'Generating...'
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    🔄 Generate All (Next 31 Days)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Daily Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Daily Generation
              </CardTitle>
              <CardDescription>
                Generate tasks for date 31 days from now (maintains rolling buffer)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runDailyGeneration}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700"
                data-testid="button-daily-generation"
              >
                {isProcessing ? (
                  'Generating...'
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    🎯 Generate Today's Future Tasks
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Task Verification System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Task Verification System
              </CardTitle>
              <CardDescription>
                Automated verification that checks for missing tasks and removes duplicates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* System Status */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">System Status</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="text-green-600 font-medium">
                        {verificationReport?.systemStatus?.verificationEnabled ? '✅ Active' : '❌ Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Run:</span>
                      <span className="font-mono">
                        {verificationReport?.systemStatus?.lastRunTime 
                          ? new Date(verificationReport.systemStatus.lastRunTime).toLocaleString()
                          : 'Never'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Triggered By:</span>
                      <span className="font-mono">
                        {verificationReport?.systemStatus?.triggeredBy || 'none'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Last Verification Results */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Last Verification</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Missing Tasks Created:</span>
                      <span className="font-mono text-blue-600">
                        {verificationReport?.lastVerificationResult?.missingTasksCreated || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duplicates Removed:</span>
                      <span className="font-mono text-red-600">
                        {verificationReport?.lastVerificationResult?.duplicatesRemoved || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Errors:</span>
                      <span className="font-mono text-red-600">
                        {verificationReport?.lastVerificationResult?.errors?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Details */}
              {verificationReport?.lastVerificationResult?.verificationReport && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Verification Report</h4>
                  <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                    {verificationReport.lastVerificationResult.verificationReport.map((line: string, idx: number) => (
                      <div key={idx} className="font-mono text-gray-700">{line}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Trigger */}
              <Button
                onClick={runManualVerification}
                disabled={isVerificationLoading}
                className="w-full bg-green-600 hover:bg-green-700"
                data-testid="button-run-verification"
              >
                {isVerificationLoading ? (
                  'Running Verification...'
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    🔍 Run Manual Verification
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