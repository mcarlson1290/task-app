import React, { useState } from 'react';
import { useLocation as useWouterLocation } from 'wouter';
import { getStoredAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Task } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, SkipForward, Trash2, ArrowLeft, Settings } from 'lucide-react';

const DevTools = () => {
  const [, setLocation] = useWouterLocation();
  const [overdueProtection, setOverdueProtection] = useState(
    localStorage.getItem('devOverdueProtection') === 'true'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const auth = getStoredAuth();

  // Debug the auth object
  console.log('DevTools - Auth object:', auth);
  console.log('DevTools - User object:', auth.user);
  console.log('DevTools - User role:', auth.user?.role);
  console.log('DevTools - User email:', auth.user?.email);
  console.log('DevTools - User username:', auth.user?.username);
  
  // Only allow access for Corporate users (Robert and Matt)
  const hasAccess = auth.user && 
    auth.user.role === 'Corporate' && 
    (auth.user.email === 'robert@growspace.farm' || auth.user.email === 'matt@growspace.farm');

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
            <p><strong>Name:</strong> {auth.user?.name}</p>
            <p><strong>Email:</strong> {auth.user?.username}</p>
            <p><strong>Role:</strong> {auth.user?.role}</p>
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