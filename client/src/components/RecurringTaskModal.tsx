import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { RecurringTask, GrowingSystem } from '@shared/schema';
import ChecklistBuilder from './ChecklistBuilder';
import SearchableAssignmentSelect from './SearchableAssignmentSelect';
import { Calendar, Clock, Settings, CheckSquare, Building2, Repeat } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import UpdatePropagationWarningDialog from './UpdatePropagationWarningDialog';

interface RecurringTaskModalProps {
  task: RecurringTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => void;
}

const RecurringTaskModal: React.FC<RecurringTaskModalProps> = ({ task, isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const { currentLocation } = useLocation();
  const [originalData, setOriginalData] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [affectedInstanceCount, setAffectedInstanceCount] = useState(0);
  const [changedFields, setChangedFields] = useState<Array<{ field: string; oldValue: any; newValue: any; requiresNotification: boolean }>>([]);
  const [isProcessingUpdate, setIsProcessingUpdate] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number; stage: string } | undefined>();
  const [assignmentOptions, setAssignmentOptions] = useState<{
    roles: { value: string; label: string; staffCount: number }[];
    users: { value: string; label: string; roles: string[] }[];
    special: { value: string; label: string; staffCount: number }[];
  }>({
    roles: [],
    users: [],
    special: []
  });
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: string;
    frequency: string;
    daysOfWeek: string[];
    startDate: string | null;
    isActive: boolean;
    assignTo: string;
    automation: {
      enabled: boolean;
      generateTrays: boolean;
      trayCount: number;
      cropType: string;
      flow: {
        type: string;
        stages: any[];
      };
    };
    checklistTemplate: { steps: any[] };
  }>({
    title: '',
    description: '',
    type: 'seeding-microgreens',
    frequency: 'weekly',
    daysOfWeek: [] as string[],
    startDate: null,
    isActive: true,
    assignTo: '',
    automation: {
      enabled: false,
      generateTrays: false,
      trayCount: 1,
      cropType: 'microgreen',
      flow: {
        type: 'microgreen',
        stages: []
      }
    },
    checklistTemplate: { steps: [] }
  });

  // HARD RESET: Clear all state when task changes or modal opens
  React.useEffect(() => {
    console.log('🔄 HARD RESET - RecurringTaskModal task changed:', task?.id || 'new task');
    
    // Reset all state to clean slate
    setActiveTab('basic');
    setShowWarningDialog(false);
    setAffectedInstanceCount(0);
    setChangedFields([]);
    setIsProcessingUpdate(false);
    setProcessingProgress(undefined);
    
    if (task) {
      const taskData = {
        title: task.title || '',
        description: task.description || '',
        type: task.type || 'seeding-microgreens',
        frequency: task.frequency || 'weekly',
        daysOfWeek: task.daysOfWeek || [],
        startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : null,
        isActive: task.isActive ?? true,
        assignTo: task.assignTo || 'no-assignment',
        automation: task.automation || {
          enabled: false,
          generateTrays: false,
          trayCount: 1,
          cropType: 'microgreen',
          flow: {
            type: 'microgreen',
            stages: []
          }
        },
        checklistTemplate: task.checklistTemplate || { steps: [] }
      };
      setFormData(taskData);
      setOriginalData(taskData);
      setHasChanges(false);
    } else {
      // Reset form for new task - ensure completely clean state
      const newTaskData = {
        title: '',
        description: '',
        type: 'seeding-microgreens',
        frequency: 'weekly',
        daysOfWeek: [],
        startDate: null,
        isActive: true,
        assignTo: 'no-assignment',
        automation: {
          enabled: false,
          generateTrays: false,
          trayCount: 1,
          cropType: 'microgreen',
          flow: {
            type: 'microgreen',
            stages: []
          }
        },
        checklistTemplate: { steps: [] }
      };
      setFormData(newTaskData);
      setOriginalData(newTaskData);
      setHasChanges(false);
    }
    setIsSaving(false);
    console.log('✅ HARD RESET complete - Clean state initialized');
  }, [task?.id]);

  // Load assignment options when modal opens
  React.useEffect(() => {
    if (isOpen) {
      loadAssignmentOptions();
    }
  }, [isOpen]);

  // Function to load staff and build assignment options
  const loadAssignmentOptions = async () => {
    setLoadingAssignments(true);
    
    try {
      // Fetch staff data
      const response = await fetch('/api/staff');
      const staff = await response.json();
      
      // Filter active staff only
      const activeStaff = staff.filter((s: any) => s.activeStatus === 'Active');
      
      // Build roles with staff counts
      const rolesMap: Record<string, any[]> = {};
      activeStaff.forEach((member: any) => {
        (member.rolesAssigned || []).forEach((role: string) => {
          if (!rolesMap[role]) {
            rolesMap[role] = [];
          }
          rolesMap[role].push(member);
        });
      });
      
      // Format options
      const options = {
        special: [{
          value: 'all_staff',
          label: '👥 All Staff',
          staffCount: activeStaff.length
        }],
        roles: Object.entries(rolesMap).map(([role, members]) => ({
          value: `role_${role}`,
          label: `👤 ${role}`,
          staffCount: members.length
        })),
        users: activeStaff.map((member: any) => ({
          value: `user_${member.id}`,
          label: member.fullName,
          roles: member.rolesAssigned
        }))
      };
      
      setAssignmentOptions(options);
    } catch (error) {
      console.error('Error loading assignment options:', error);
    }
    
    setLoadingAssignments(false);
  };

  // Warn if user tries to leave with unsaved changes
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges && isOpen) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, isOpen]);

  const { data: systems = [] } = useQuery<GrowingSystem[]>({
    queryKey: ['/api/growing-systems'],
    queryFn: async () => {
      const response = await fetch('/api/growing-systems');
      if (!response.ok) throw new Error('Failed to fetch growing systems');
      return response.json();
    },
  });

  const taskTypes = [
    { value: 'seeding-microgreens', label: '🌱 Seeding - Microgreens' },
    { value: 'seeding-leafy-greens', label: '🥬 Seeding - Leafy Greens' },
    { value: 'harvest-microgreens', label: '✂️ Harvest - Microgreens' },
    { value: 'harvest-leafy-greens', label: '🥗 Harvest - Leafy Greens' },
    { value: 'blackout-tasks', label: '🌑 Blackout Tasks' },
    { value: 'moving', label: '📦 Moving' },
    { value: 'cleaning', label: '🧹 Cleaning' },
    { value: 'equipment-maintenance', label: '🔧 Equipment Maintenance' },
    { value: 'inventory', label: '📊 Inventory' },
    { value: 'other', label: '📋 Other' }
  ];

  const frequencies = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-Weekly (Every 2 Weeks)' },
    { value: 'monthly', label: 'Monthly (Last Day)' },
    { value: 'quarterly', label: 'Quarterly' }
  ];

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  // Helper function to update form data and track changes
  const updateFormData = (updates: any) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleDayToggle = (day: string) => {
    const newDays = formData.daysOfWeek.includes(day)
      ? formData.daysOfWeek.filter(d => d !== day)
      : [...formData.daysOfWeek, day];
    
    updateFormData({ daysOfWeek: newDays });
  };

  const handleChecklistChange = (steps: any[]) => {
    updateFormData({
      checklistTemplate: { steps }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges && task) {
      onClose();
      return;
    }
    
    // For existing tasks, check for impact and show warning dialog
    if (task && hasChanges) {
      try {
        // Calculate changed fields
        const changes = identifyChangedFields(originalData, formData);
        setChangedFields(changes);
        
        // Fetch affected instance count
        const response = await fetch(`/api/tasks?recurringTaskId=${task.id}`);
        const allTasks = await response.json();
        const futureInstances = allTasks.filter((t: any) => 
          t.recurringTaskId === task.id && 
          (t.status === 'pending' || t.status === 'in_progress') &&
          new Date(t.dueDate) >= new Date()
        );
        
        setAffectedInstanceCount(futureInstances.length);
        
        // Show warning dialog if there are changes and affected instances
        if (changes.length > 0 && futureInstances.length > 0) {
          setShowWarningDialog(true);
          return;
        }
      } catch (error) {
        console.error('Error checking task impact:', error);
      }
    }
    
    // Proceed with save for new tasks or tasks with no instances
    await performSave('update_all');
  };
  
  const performSave = async (strategy: 'update_all' | 'new_only') => {
    setIsSaving(true);
    setIsProcessingUpdate(true);
    
    try {
      // Simulate progress tracking for large updates
      if (affectedInstanceCount > 50) {
        const intervals = Math.min(10, Math.floor(affectedInstanceCount / 10));
        for (let i = 1; i <= intervals; i++) {
          setProcessingProgress({
            current: Math.floor((i / intervals) * affectedInstanceCount),
            total: affectedInstanceCount,
            stage: i === intervals ? 'Finalizing changes...' : 'Updating task instances...'
          });
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      await onSave({
        ...formData,
        id: task?.id,
        location: currentLocation.code,
        strategy: strategy
      });
      
      // Show completion state briefly
      setProcessingProgress(undefined);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // onClose will be called by the parent component on successful save
    } catch (error) {
      console.error('Failed to save recurring task:', error);
      setIsSaving(false);
      setIsProcessingUpdate(false);
      setProcessingProgress(undefined);
    }
  };
  
  // Helper function to identify changed fields
  const identifyChangedFields = (original: any, current: any): Array<{ field: string; oldValue: any; newValue: any; requiresNotification: boolean }> => {
    const changes: Array<{ field: string; oldValue: any; newValue: any; requiresNotification: boolean }> = [];
    const notificationRequiredFields = ['title', 'description', 'checklistTemplate', 'estimatedTime', 'priority', 'assignTo'];
    
    Object.keys(current).forEach(field => {
      if (JSON.stringify(original[field]) !== JSON.stringify(current[field])) {
        changes.push({
          field,
          oldValue: original[field],
          newValue: current[field],
          requiresNotification: notificationRequiredFields.includes(field)
        });
      }
    });
    
    return changes;
  };
  
  const handleWarningConfirm = (strategy: 'update_all' | 'new_only') => {
    setShowWarningDialog(false);
    performSave(strategy);
  };
  
  const handleWarningCancel = () => {
    setShowWarningDialog(false);
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        setHasChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  const addFlowStage = () => {
    const newStage = {
      name: '',
      system: '',
      duration: 1,
      autoMove: false
    };
    
    updateFormData({
      automation: {
        ...formData.automation,
        flow: {
          ...formData.automation.flow,
          stages: [...formData.automation.flow.stages, newStage]
        }
      }
    });
  };

  const updateFlowStage = (index: number, field: string, value: any) => {
    const stages = [...formData.automation.flow.stages];
    stages[index] = { ...stages[index], [field]: value };
    
    updateFormData({
      automation: {
        ...formData.automation,
        flow: {
          ...formData.automation.flow,
          stages
        }
      }
    });
  };

  const removeFlowStage = (index: number) => {
    const stages = formData.automation.flow.stages.filter((_, i) => i !== index);
    updateFormData({
      automation: {
        ...formData.automation,
        flow: {
          ...formData.automation.flow,
          stages
        }
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Edit Recurring Task' : 'Create Recurring Task'}
          </DialogTitle>
          <DialogDescription>
            {task ? 'Modify the recurring task settings and checklist.' : 'Create a new recurring task with custom scheduling and automation.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="automation" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Automation
              </TabsTrigger>
              <TabsTrigger value="checklist" className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Checklist
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="Enter task title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Task Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => updateFormData({ type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taskTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignTo">Default Assignment</Label>
                <SearchableAssignmentSelect
                  value={formData.assignTo || ''}
                  onChange={(value) => updateFormData({ assignTo: value })}
                  assignmentOptions={assignmentOptions}
                  disabled={loadingAssignments}
                  placeholder={loadingAssignments ? "Loading assignments..." : "Search or select assignment..."}
                />
                <p className="text-sm text-gray-600">
                  When this recurring task generates daily tasks, they will be automatically assigned to this selection
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => updateFormData({ isActive: !!checked })}
                />
                <Label htmlFor="isActive">Active task (will generate instances)</Label>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => updateFormData({ frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map(freq => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Show day selection only for weekly frequency */}
              {formData.frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {daysOfWeek.map(day => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.value}
                          checked={formData.daysOfWeek.includes(day.value)}
                          onCheckedChange={() => handleDayToggle(day.value)}
                        />
                        <Label htmlFor={day.value} className="text-sm">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show start date picker for bi-weekly tasks */}
              {formData.frequency === 'bi-weekly' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date (Cycle Anchor)</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate || ''}
                      onChange={(e) => updateFormData({ startDate: e.target.value || null })}
                      className="w-full"
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-blue-900">📅 Bi-Weekly Schedule</h4>
                    <p className="text-sm text-blue-800">
                      Task will appear <strong>every 14 days</strong> starting from the selected date.
                    </p>
                    {formData.startDate && (
                      <p className="text-xs text-blue-600 mt-2">
                        Next occurrences: {formData.startDate}, then every 2 weeks after.
                      </p>
                    )}
                    {!formData.startDate && (
                      <p className="text-xs text-orange-600 mt-2">
                        Please select a start date to anchor the 2-week cycle.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Show explanation for monthly tasks */}
              {formData.frequency === 'monthly' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-green-900">📅 Monthly Schedule</h4>
                  <p className="text-sm text-green-800">
                    Task appears on the <strong>1st of each month</strong> and is due on the <strong>last day of the month</strong>.
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    Full month to complete the task with early visibility.
                  </p>
                </div>
              )}

              {/* Show explanation for quarterly tasks */}
              {formData.frequency === 'quarterly' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-purple-900">📅 Quarterly Schedule</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• <strong>Q1:</strong> Appears Jan 1st → Due Mar 31st</li>
                    <li>• <strong>Q2:</strong> Appears Apr 1st → Due Jun 30th</li>
                    <li>• <strong>Q3:</strong> Appears Jul 1st → Due Sep 30th</li>
                    <li>• <strong>Q4:</strong> Appears Oct 1st → Due Dec 31st</li>
                  </ul>
                  <p className="text-xs text-purple-600 mt-2">
                    Full quarter (3 months) to complete each task with maximum planning time.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="automation" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="automationEnabled"
                  checked={formData.automation.enabled}
                  onCheckedChange={(checked) => updateFormData({
                    automation: { ...formData.automation, enabled: !!checked }
                  })}
                />
                <Label htmlFor="automationEnabled">Enable automation features</Label>
              </div>

              {formData.automation.enabled && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="generateTrays"
                      checked={formData.automation.generateTrays}
                      onCheckedChange={(checked) => updateFormData({
                        automation: { ...formData.automation, generateTrays: !!checked }
                      })}
                    />
                    <Label htmlFor="generateTrays">Auto-generate trays</Label>
                  </div>

                  {formData.automation.generateTrays && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="trayCount">Tray Count</Label>
                        <Input
                          id="trayCount"
                          type="number"
                          value={formData.automation.trayCount}
                          onChange={(e) => updateFormData({
                            automation: { 
                              ...formData.automation, 
                              trayCount: parseInt(e.target.value) || 1 
                            }
                          })}
                          min="1"
                          max="50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cropType">Crop Type</Label>
                        <Select
                          value={formData.automation.cropType}
                          onValueChange={(value) => updateFormData({
                            automation: { ...formData.automation, cropType: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="microgreen">Microgreen</SelectItem>
                            <SelectItem value="leafy-green">Leafy Green</SelectItem>
                            <SelectItem value="herb">Herb</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Repeat className="w-5 h-5" />
                        Production Flow
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {formData.automation.flow.stages.map((stage, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            <Input
                              placeholder="Stage name"
                              value={stage.name}
                              onChange={(e) => updateFlowStage(index, 'name', e.target.value)}
                            />
                            <Select
                              value={stage.system}
                              onValueChange={(value) => updateFlowStage(index, 'system', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select system" />
                              </SelectTrigger>
                              <SelectContent>
                                {systems.map(system => (
                                  <SelectItem key={system.id} value={system.name}>
                                    {system.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              placeholder="Duration (days)"
                              value={stage.duration}
                              onChange={(e) => updateFlowStage(index, 'duration', parseInt(e.target.value) || 1)}
                              min="1"
                              max="365"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={stage.autoMove}
                              onCheckedChange={(checked) => updateFlowStage(index, 'autoMove', !!checked)}
                            />
                            <Label className="text-sm">Auto-move</Label>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFlowStage(index)}
                            className="text-red-600"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addFlowStage}
                        className="w-full"
                      >
                        + Add Stage
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="checklist" className="space-y-4">
              <ChecklistBuilder
                template={formData.checklistTemplate}
                systems={systems}
                onChange={handleChecklistChange}
              />
              {formData.checklistTemplate.steps.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded border">
                  <p className="text-sm text-gray-600">
                    <strong>Checklist Preview:</strong> {formData.checklistTemplate.steps.length} step(s) configured
                  </p>
                  {formData.checklistTemplate.steps.map((step, index) => (
                    <div key={step.id} className="text-xs text-gray-500 mt-1">
                      {index + 1}. {step.type} - {step.config?.inventoryItemName || step.config?.text || step.label || 'Untitled step'}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#2D8028] hover:bg-[#203B17]"
              disabled={isSaving || (!hasChanges && task)}
            >
              {isSaving ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
            </Button>
            {hasChanges && (
              <span className="ml-2 text-orange-600 text-sm">
                • Unsaved changes
              </span>
            )}
          </div>
        </form>
      </DialogContent>
      
      {/* Update Propagation Warning Dialog */}
      <UpdatePropagationWarningDialog
        isOpen={showWarningDialog}
        onClose={handleWarningCancel}
        onConfirm={handleWarningConfirm}
        changedFields={changedFields}
        affectedInstanceCount={affectedInstanceCount}
        conflictCount={0} // TODO: Calculate conflicts from backend
        taskTitle={formData.title || 'Untitled Task'}
        isProcessing={isProcessingUpdate}
        processingProgress={processingProgress}
      />
    </Dialog>
  );
};

export default RecurringTaskModal;