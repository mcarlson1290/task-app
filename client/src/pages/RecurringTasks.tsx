import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Settings, Calendar, Clock, RotateCcw, Building2, CheckSquare } from 'lucide-react';
import { getStoredAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { RecurringTask } from '@shared/schema';
import RecurringTaskModal from '@/components/RecurringTaskModal';
import DeleteRecurringTaskModal from '@/components/DeleteRecurringTaskModal';
import { useLocation } from '@/contexts/LocationContext';
import { migrateSharePointTasks, importRecurringTasks } from '@/utils/sharePointMigration';

const RecurringTasks: React.FC = () => {
  const auth = getStoredAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentLocation, isViewingAllLocations } = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTask, setDeletingTask] = useState<RecurringTask | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importReport, setImportReport] = useState<any>(null);
  const [showImportSection, setShowImportSection] = useState(false);

  const { data: recurringTasks = [], isLoading } = useQuery<RecurringTask[]>({
    queryKey: ['/api/recurring-tasks', currentLocation.code, isViewingAllLocations],
    queryFn: async () => {
      console.log('🔍 currentLocation object:', currentLocation);
      console.log('🔍 Fetching recurring tasks for location:', currentLocation.code, 'viewing all:', isViewingAllLocations);
      const url = isViewingAllLocations 
        ? '/api/recurring-tasks' 
        : `/api/recurring-tasks?location=${encodeURIComponent(currentLocation.code)}`;
      
      console.log('🔍 Making API call to:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch recurring tasks');
      const data = await response.json();
      console.log(`🔍 Fetched ${data.length} recurring tasks from API`);
      console.log('🔍 First task location field:', data.length > 0 ? data[0].location : 'no tasks');
      return data;
    },
    enabled: !!auth.user,
  });

  // Since we're using server-side location filtering, we don't need additional client filtering
  const filteredRecurringTasks = recurringTasks;
  
  // Debug logging
  React.useEffect(() => {
    console.log('🔍 DEBUG: filteredRecurringTasks updated:', filteredRecurringTasks.length, 'tasks');
    if (filteredRecurringTasks.length > 0) {
      console.log('First 3 tasks:', filteredRecurringTasks.slice(0, 3).map(t => ({ id: t.id, title: t.title, location: t.location })));
    }
  }, [filteredRecurringTasks]);

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await apiRequest('PATCH', `/api/recurring-tasks/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-tasks'] });
      toast({
        title: 'Task Updated',
        description: 'Recurring task has been updated successfully.',
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/recurring-tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] }); // Also refresh tasks
      setShowDeleteModal(false);
      setDeletingTask(null);
      toast({
        title: 'Task Deleted',
        description: 'Recurring task deleted. Future tasks removed, historical data preserved.',
      });
    },
  });

  const saveTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      console.log('Creating/updating recurring task with data:', taskData);
      if (taskData.id) {
        return await apiRequest('PATCH', `/api/recurring-tasks/${taskData.id}`, taskData);
      } else {
        return await apiRequest('POST', '/api/recurring-tasks', taskData);
      }
    },
    onSuccess: (result) => {
      console.log('Task save successful, result:', result);
      // Invalidate and refetch both recurring tasks and regular tasks
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.refetchQueries({ queryKey: ['/api/recurring-tasks'] });
      queryClient.refetchQueries({ queryKey: ['/api/tasks'] });
      setShowAddModal(false);
      setEditingTask(null);
      toast({
        title: editingTask ? 'Task Updated' : 'Task Created',
        description: editingTask ? 'Recurring task and all future instances have been updated successfully.' : 'Recurring task has been created successfully.',
      });
    },
    onError: (error) => {
      console.error('Failed to save recurring task:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save recurring task. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const getFrequencyDisplay = (task: RecurringTask) => {
    // Display "Weekly" for both 'daily' and 'weekly' frequencies (migration compatibility)
    if (task.frequency === 'daily' || task.frequency === 'weekly') {
      const days = task.daysOfWeek?.map(day => 
        typeof day === 'string' ? day.charAt(0).toUpperCase() + day.slice(1) : String(day)
      ).join(', ');
      return `Weekly on ${days}`;
    }
    if (task.frequency === 'bi-weekly') {
      return 'Bi-Weekly (1st & 15th)';
    }
    if (task.frequency === 'monthly') {
      return 'Monthly (Last Day)';
    }
    return task.frequency;
  };

  const getTaskTypeEmoji = (type: string) => {
    const emojis = {
      'seeding-microgreens': '🌱',
      'seeding-leafy-greens': '🌿',
      'harvest-microgreens': '🌾',
      'harvest-leafy-greens': '🥬',
      'blackout-tasks': '🌑',
      'moving': '📦',
      'packing': '📦',
      'cleaning': '🧹',
      'inventory': '📊',
      'equipment-maintenance': '🔧',
      'other': '📝'
    };
    return emojis[type] || '📋';
  };

  const handleDeleteClick = (task: RecurringTask) => {
    setDeletingTask(task);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingTask) {
      deleteTaskMutation.mutate(deletingTask.id);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
      const csvText = await file.text();
      const { newTasks, migrationReport } = await migrateSharePointTasks(csvText);
      
      // Import the tasks
      await importRecurringTasks(newTasks);
      
      setImportReport(migrationReport);
      
      // Refresh the tasks list with new query keys
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      // Force refetch with current location
      queryClient.refetchQueries({ queryKey: ['/api/recurring-tasks', currentLocation.code, isViewingAllLocations] });
      
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${migrationReport.successful} recurring tasks.`,
      });
      
      // Log detailed report to console
      console.log('=== SHAREPOINT MIGRATION REPORT ===');
      console.log(`✅ Successful: ${migrationReport.successful} tasks`);
      console.log(`❌ Failed: ${migrationReport.failed} tasks`);
      
      if (migrationReport.warnings.length > 0) {
        console.log('⚠️ WARNINGS:', migrationReport.warnings);
      }
      
      if (migrationReport.errors.length > 0) {
        console.log('❌ ERRORS:', migrationReport.errors);
      }
      
    } catch (error: any) {
      console.error('Import failed:', error);
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import SharePoint tasks',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) return <div className="p-6">Loading recurring tasks...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowImportSection(!showImportSection)}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            📤 SharePoint Import
          </Button>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#2D8028] hover:bg-[#203B17]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Recurring Task
        </Button>
      </div>

      {/* SharePoint Import Section */}
      {showImportSection && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Import SharePoint Recurring Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-2">Upload your SharePoint "Reoccurring Tasks.csv" file to import existing recurring tasks into the system.</p>
              <p className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                ⚠️ Note: Tasks marked as "DISABLED" in SharePoint will be skipped. Tasks with SharePoint checklists will need manual recreation.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isImporting}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {isImporting && (
                <div className="flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Importing...
                </div>
              )}
            </div>
            
            {importReport && (
              <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded">
                <h4 className="font-semibold text-green-800">Import Complete!</h4>
                <div className="text-sm text-green-700 mt-1">
                  <p>✅ Successfully imported: {importReport.successful} tasks</p>
                  {importReport.failed > 0 && <p>❌ Failed: {importReport.failed} tasks</p>}
                  {importReport.warnings.length > 0 && (
                    <p>⚠️ Tasks with SharePoint checklists: {importReport.warnings.length}</p>
                  )}
                  <p className="text-xs mt-1">Check browser console for detailed report</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {filteredRecurringTasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No recurring tasks found for location: {currentLocation.code}</p>
          <p className="text-sm mt-2">Try switching locations or importing SharePoint tasks above.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecurringTasks.map((task) => (
          <Card key={task.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTaskTypeEmoji(task.type)}</span>
                  <div>
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={task.isActive}
                    onCheckedChange={(checked) => 
                      toggleTaskMutation.mutate({ id: task.id, isActive: checked })
                    }
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{getFrequencyDisplay(task)}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  <span>Type: {task.type.replace('-', ' ')}</span>
                </div>
                
                {task.automation?.enabled && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      🤖 Automated
                    </Badge>
                    {task.automation.generateTrays && (
                      <Badge variant="outline" className="text-xs">
                        📋 {task.automation.trayCount} trays
                      </Badge>
                    )}
                  </div>
                )}
                
                {task.checklistTemplate?.steps?.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-600">
                      {task.checklistTemplate.steps.length} checklist steps
                    </span>
                  </div>
                )}

                {task.automation?.flow?.stages?.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">
                      {task.automation.flow.stages.length} stage flow
                    </span>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTask(task)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(task)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <RecurringTaskModal
        task={editingTask}
        isOpen={showAddModal || !!editingTask}
        onClose={() => {
          setShowAddModal(false);
          setEditingTask(null);
        }}
        onSave={(taskData) => saveTaskMutation.mutateAsync(taskData)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteRecurringTaskModal
        recurringTask={deletingTask}
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingTask(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default RecurringTasks;