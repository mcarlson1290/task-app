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

const RecurringTasks: React.FC = () => {
  const auth = getStoredAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null);

  const { data: recurringTasks = [], isLoading } = useQuery<RecurringTask[]>({
    queryKey: ['/api/recurring-tasks'],
    queryFn: async () => {
      const response = await fetch('/api/recurring-tasks');
      if (!response.ok) throw new Error('Failed to fetch recurring tasks');
      return response.json();
    },
    enabled: !!auth.user,
  });

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
      toast({
        title: 'Task Deleted',
        description: 'Recurring task has been deleted successfully.',
      });
    },
  });

  const saveTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      if (taskData.id) {
        return await apiRequest('PATCH', `/api/recurring-tasks/${taskData.id}`, taskData);
      } else {
        return await apiRequest('POST', '/api/recurring-tasks', taskData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-tasks'] });
      toast({
        title: 'Task Saved',
        description: 'Recurring task has been saved successfully.',
      });
      setShowAddModal(false);
      setEditingTask(null);
    },
  });

  const getFrequencyDisplay = (task: RecurringTask) => {
    if (task.frequency === 'daily') return 'Daily';
    if (task.frequency === 'weekly') {
      const days = task.daysOfWeek?.map(day => 
        day.charAt(0).toUpperCase() + day.slice(1)
      ).join(', ');
      return `Weekly on ${days}`;
    }
    if (task.frequency === 'monthly') {
      return `Monthly on day ${task.dayOfMonth}`;
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

  if (isLoading) return <div className="p-6">Loading recurring tasks...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔄 Recurring Tasks</h1>
          <p className="text-gray-600">Manage automated task generation and scheduling</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#2D8028] hover:bg-[#203B17]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Recurring Task
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recurringTasks.map((task) => (
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
                    onClick={() => deleteTaskMutation.mutate(task.id)}
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

      {recurringTasks.length === 0 && (
        <div className="text-center py-12">
          <RotateCcw className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recurring Tasks</h3>
          <p className="text-gray-600 mb-4">
            Create your first recurring task to automate routine operations.
          </p>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#2D8028] hover:bg-[#203B17]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Recurring Task
          </Button>
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
        onSave={saveTaskMutation.mutate}
      />
    </div>
  );
};

export default RecurringTasks;