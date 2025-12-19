import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Settings, Calendar, Clock, RotateCcw, Building2, CheckSquare, Search, X } from 'lucide-react';
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
  const [modalKey, setModalKey] = useState(0); // Used to force modal remount

  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');

  const { data: recurringTasks = [], isLoading, refetch } = useQuery<RecurringTask[]>({
    queryKey: ['/api/recurring-tasks', currentLocation.id, isViewingAllLocations],
    queryFn: async () => {
      console.log('🔍 currentLocation object:', currentLocation);
      console.log('🔍 Fetching recurring tasks for location:', currentLocation.name, 'viewing all:', isViewingAllLocations);
      const url = isViewingAllLocations 
        ? '/api/recurring-tasks' 
        : `/api/recurring-tasks?location=${encodeURIComponent(currentLocation.id)}`;
      
      console.log('🔍 Making API call to:', url);
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) throw new Error('Failed to fetch recurring tasks');
      const data = await response.json();
      console.log(`🔍 Fetched ${data.length} recurring tasks from API for location: ${currentLocation.name}`);
      console.log('🔍 First few tasks:');
      if (data.length > 0) {
        data.slice(0, 3).forEach((task: any, index: number) => {
          console.log(`  ${index + 1}. ${task.title} (location: ${task.location})`);
        });
      }
      return data;
    },
    enabled: !!auth.user,
    staleTime: 0,
    gcTime: 0
  });

  // Filter recurring tasks based on search term, type, and frequency
  const filteredRecurringTasks = useMemo(() => {
    let filtered = [...recurringTasks];
    
    // Search filter - searches across title and description
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(search) ||
        (task.description && task.description.toLowerCase().includes(search))
      );
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(task => 
        task.type && task.type.toLowerCase() === typeFilter.toLowerCase()
      );
    }
    
    // Frequency filter
    if (frequencyFilter !== 'all') {
      filtered = filtered.filter(task => {
        const taskFreq = task.frequency.toLowerCase();
        
        if (frequencyFilter === 'weekly') {
          // Weekly means it happens on specific days of the week
          return taskFreq.includes('monday') || 
                 taskFreq.includes('tuesday') || 
                 taskFreq.includes('wednesday') || 
                 taskFreq.includes('thursday') || 
                 taskFreq.includes('friday') || 
                 taskFreq.includes('saturday') || 
                 taskFreq.includes('sunday');
        }
        
        if (frequencyFilter === 'bi-weekly') {
          return taskFreq.includes('bi-weekly') || taskFreq.includes('biweekly');
        }
        
        if (frequencyFilter === 'monthly') {
          return taskFreq.includes('monthly');
        }
        
        return false;
      });
    }
    
    // Day filter
    if (dayFilter !== 'all') {
      filtered = filtered.filter(task => {
        const selectedDay = dayFilter.toLowerCase();
        
        console.log(`🗓️ Checking task "${task.title}" for day "${selectedDay}"`);
        console.log(`   - Frequency: "${task.frequency}"`);
        console.log(`   - DaysOfWeek: ${task.daysOfWeek ? JSON.stringify(task.daysOfWeek) : 'undefined'}`);
        
        // First check if task has daysOfWeek array (most accurate)
        if (task.daysOfWeek && Array.isArray(task.daysOfWeek)) {
          const matchesDay = task.daysOfWeek.some(day => 
            day.toLowerCase() === selectedDay || 
            day.toLowerCase().startsWith(selectedDay.substring(0, 3)) // mon, tue, etc.
          );
          if (matchesDay) {
            console.log(`✅ Day match in daysOfWeek for ${task.title}`);
            return true;
          }
        }
        
        // Fallback: check frequency string for day names (for older data)
        if (task.frequency) {
          const taskFreq = task.frequency.toLowerCase();
          
          // Check for exact day match in frequency string
          if (taskFreq.includes(selectedDay)) {
            console.log(`✅ Day match in frequency for ${task.title}`);
            return true;
          }
          
          // Check for day abbreviations
          const dayAbbreviations = {
            'monday': ['mon'],
            'tuesday': ['tue', 'tues'],
            'wednesday': ['wed'],
            'thursday': ['thu', 'thur', 'thurs'],
            'friday': ['fri'],
            'saturday': ['sat'],
            'sunday': ['sun']
          };
          
          if (dayAbbreviations[selectedDay]) {
            const hasAbbrev = dayAbbreviations[selectedDay].some(abbr => taskFreq.includes(abbr));
            if (hasAbbrev) {
              console.log(`✅ Day abbreviation match in frequency for ${task.title}`);
              return true;
            }
          }
        }
        
        console.log(`❌ No day match for ${task.title}`);
        return false;
      });
    }
    
    return filtered;
  }, [recurringTasks, searchTerm, typeFilter, frequencyFilter, dayFilter]);

  // Clear all filters function
  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setFrequencyFilter('all');
    setDayFilter('all');
  };
  
  // Debug logging
  React.useEffect(() => {
    console.log('🔍 DEBUG: filteredRecurringTasks updated:', filteredRecurringTasks.length, 'tasks');
    if (filteredRecurringTasks.length > 0) {
      console.log('First 3 tasks:', filteredRecurringTasks.slice(0, 3).map(t => ({ id: t.id, title: t.title, location: t.location })));
    }
  }, [filteredRecurringTasks]);

  // Debug day filter
  React.useEffect(() => {
    if (dayFilter !== 'all' && recurringTasks.length > 0) {
      console.log('🗓️ Day filter active:', dayFilter);
      const uniqueFreqs = new Set(recurringTasks.map(t => t.frequency));
      const sampleFrequencies = Array.from(uniqueFreqs).slice(0, 5);
      console.log('🗓️ Sample frequencies:', sampleFrequencies);
      
      // Show filtering summary
      const totalTasks = recurringTasks.length;
      const filteredCount = filteredRecurringTasks.length;
      console.log(`📊 Day filter summary: ${filteredCount}/${totalTasks} tasks shown for ${dayFilter}`);
    }
  }, [dayFilter, recurringTasks, filteredRecurringTasks]);



  // Force refetch when location changes
  React.useEffect(() => {
    console.log('🔍 Location changed, forcing refetch...');
    refetch();
  }, [currentLocation.id, isViewingAllLocations, refetch]);

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
    if (task.frequency === 'weekly') {
      const days = task.daysOfWeek?.map(day => 
        typeof day === 'string' ? day.charAt(0).toUpperCase() + day.slice(1) : String(day)
      ).join(', ');
      return `Weekly on ${days}`;
    }
    if (task.frequency === 'bi-weekly' || task.frequency === 'biweekly') {
      const dayName = task.startDate 
        ? new Date(task.startDate).toLocaleDateString('en-US', { weekday: 'long' }) + 's'
        : '';
      return dayName ? `Bi-Weekly (${dayName})` : 'Bi-Weekly';
    }
    if (task.frequency === 'monthly') {
      return 'Monthly (Last Day)';
    }
    if (task.frequency === 'quarterly') {
      return 'Quarterly';
    }
    return task.frequency;
  };

  const getNextOccurrence = (task: RecurringTask): string | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (task.frequency === 'weekly' && task.daysOfWeek && task.daysOfWeek.length > 0) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const normalizedDays = task.daysOfWeek.map(d => d.toLowerCase());
      
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        const dayName = dayNames[checkDate.getDay()];
        if (normalizedDays.includes(dayName)) {
          return checkDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        }
      }
    }
    
    if ((task.frequency === 'bi-weekly' || task.frequency === 'biweekly') && task.startDate) {
      const startDate = new Date(task.startDate);
      startDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilNext = daysDiff >= 0 ? (14 - (daysDiff % 14)) % 14 : Math.abs(daysDiff) % 14;
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + (daysUntilNext === 0 ? 0 : daysUntilNext));
      return nextDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    if (task.frequency === 'monthly') {
      const nextDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      if (nextDate <= today) {
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextDate.setDate(new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate());
      }
      return nextDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    if (task.frequency === 'quarterly') {
      const quarter = Math.floor(today.getMonth() / 3);
      const nextQuarterMonth = (quarter + 1) * 3;
      const nextDate = new Date(today.getFullYear(), nextQuarterMonth, 1);
      if (nextDate <= today) {
        nextDate.setMonth(nextDate.getMonth() + 3);
      }
      return nextDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    return null;
  };

  const getTaskTypeEmoji = (type: string) => {
    const emojis: { [key: string]: string } = {
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



  if (isLoading) return <div className="p-6">Loading recurring tasks...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">📋 Recurring Tasks</h1>
          <Button 
            onClick={() => {
              // Increment modalKey to force fresh state when opening modal for new task
              setModalKey(prev => prev + 1);
              setShowAddModal(true);
            }}
            className="bg-[#2D8028] hover:bg-[#203B17]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Recurring Task
          </Button>
        </div>

        {/* Filters Section */}
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg border">
          {/* Search Bar */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="🔍 Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Type Filter */}
          <div className="min-w-[160px]">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="seeding-microgreens">Seeding - Microgreens</SelectItem>
                <SelectItem value="harvest-microgreens">Harvest - Microgreens</SelectItem>
                <SelectItem value="blackout-tasks">Blackout Tasks</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="equipment-maintenance">Equipment Maintenance</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Frequency Filter */}
          <div className="min-w-[160px]">
            <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Frequencies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frequencies</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Day Filter */}
          <div className="min-w-[140px]">
            <Select value={dayFilter} onValueChange={setDayFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="tuesday">Tuesday</SelectItem>
                <SelectItem value="wednesday">Wednesday</SelectItem>
                <SelectItem value="thursday">Thursday</SelectItem>
                <SelectItem value="friday">Friday</SelectItem>
                <SelectItem value="saturday">Saturday</SelectItem>
                <SelectItem value="sunday">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Clear Filters Button */}
          {(searchTerm || typeFilter !== 'all' || frequencyFilter !== 'all' || dayFilter !== 'all') && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {filteredRecurringTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">📋</div>
          {searchTerm || typeFilter !== 'all' || frequencyFilter !== 'all' || dayFilter !== 'all' ? (
            <div>
              <p className="text-lg font-medium mb-2">No recurring tasks match your filters</p>
              <p className="text-sm">Try adjusting your search terms or clearing the filters to see more tasks.</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">No recurring tasks found</p>
              <p className="text-sm">Create your first recurring task to get started with automated scheduling.</p>
            </div>
          )}
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
                    checked={task.isActive ?? false}
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
                
                {getNextOccurrence(task) && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>📅 Next: {getNextOccurrence(task)}</span>
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-600">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  <span>Type: {task.type?.replace('-', ' ') || 'Unknown'}</span>
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
                
                {task.checklistTemplate?.steps && task.checklistTemplate.steps.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-600">
                      {task.checklistTemplate.steps.length} checklist steps
                    </span>
                  </div>
                )}

                {task.automation?.flow?.stages && task.automation.flow.stages.length > 0 && (
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

      {/* Add/Edit Modal - Keyed to force remount when task changes or creating new task */}
      <RecurringTaskModal
        key={`recurring-modal-${editingTask?.id || `new-${modalKey}`}`}
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