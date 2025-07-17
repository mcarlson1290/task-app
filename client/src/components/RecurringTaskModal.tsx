import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Calendar, Clock, Settings, CheckSquare, Building2, Repeat } from 'lucide-react';

interface RecurringTaskModalProps {
  task: RecurringTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => void;
}

const RecurringTaskModal: React.FC<RecurringTaskModalProps> = ({ task, isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    type: task?.type || 'seeding-microgreens',
    frequency: task?.frequency || 'daily',
    daysOfWeek: task?.daysOfWeek || [],
    isActive: task?.isActive ?? true,
    automation: task?.automation || {
      enabled: false,
      generateTrays: false,
      trayCount: 1,
      cropType: 'microgreen',
      flow: {
        type: 'microgreen',
        stages: []
      }
    },
    checklistTemplate: task?.checklistTemplate || { steps: [] }
  });

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
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'custom', label: 'Custom' }
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

  const handleDayToggle = (day: string) => {
    const newDays = formData.daysOfWeek.includes(day)
      ? formData.daysOfWeek.filter(d => d !== day)
      : [...formData.daysOfWeek, day];
    
    setFormData({ ...formData, daysOfWeek: newDays });
  };

  const handleChecklistChange = (steps: any[]) => {
    setFormData({
      ...formData,
      checklistTemplate: { steps }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: task?.id
    });
  };

  const addFlowStage = () => {
    const newStage = {
      name: '',
      system: '',
      duration: 1,
      autoMove: false
    };
    
    setFormData({
      ...formData,
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
    
    setFormData({
      ...formData,
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
    setFormData({
      ...formData,
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
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter task title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Task Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
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
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                />
                <Label htmlFor="isActive">Active task (will generate instances)</Label>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
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
            </TabsContent>

            <TabsContent value="automation" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="automationEnabled"
                  checked={formData.automation.enabled}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
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
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
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
                          onChange={(e) => setFormData({
                            ...formData,
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
                          onValueChange={(value) => setFormData({
                            ...formData,
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
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#2D8028] hover:bg-[#203B17]">
              {task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecurringTaskModal;