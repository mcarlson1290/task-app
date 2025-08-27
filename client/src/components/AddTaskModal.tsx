import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import { getAssignmentOptions, getAssignedStaffIds } from '@/services/assignmentService';
import { AssignmentOptions } from '@/data/roleTaskMapping';

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (taskData: any) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ open, onClose, onSave }) => {
  const { toast } = useToast();
  const { currentUser } = useUser();
  
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    type: '',
    priority: 'medium',
    assignedTo: '',
    dueDate: new Date().toISOString().split('T')[0],
    estimatedTime: ''
  });

  const [assignmentOptions, setAssignmentOptions] = useState<AssignmentOptions>({
    roles: [],
    users: [],
    special: []
  });

  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  // Fetch assignment options when task type changes
  useEffect(() => {
    const loadAssignmentOptions = async () => {
      if (taskData.type && currentUser) {
        setIsLoadingAssignments(true);
        try {
          const options = await getAssignmentOptions(currentUser, taskData.type);
          setAssignmentOptions(options);
        } catch (error) {
          console.error('Error loading assignment options:', error);
          toast({
            title: "Error Loading Assignments",
            description: "Could not load assignment options. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsLoadingAssignments(false);
        }
      }
    };

    loadAssignmentOptions();
  }, [taskData.type, currentUser, toast]);

  const taskTypes = [
    { value: 'seeding-microgreens', label: 'Seeding - Microgreens' },
    { value: 'seeding-leafy-greens', label: 'Seeding - Leafy Greens' },
    { value: 'harvest-microgreens', label: 'Harvest - Microgreens' },
    { value: 'harvest-leafy-greens', label: 'Harvest - Leafy Greens' },
    { value: 'blackout-tasks', label: 'Blackout Tasks' },
    { value: 'moving', label: 'Moving' },
    { value: 'packing', label: 'Packing' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'equipment-maintenance', label: 'Equipment Maintenance' },
    { value: 'other', label: 'Other' }
  ];

  // Get all assignment options in order
  const getAllAssignmentOptions = () => {
    const allOptions = [
      ...assignmentOptions.special,
      ...(assignmentOptions.roles.length > 0 ? [{ value: '---roles---', label: '──────── Roles ────────', type: 'separator' as const }] : []),
      ...assignmentOptions.roles,
      ...(assignmentOptions.users.length > 0 ? [{ value: '---users---', label: '──────── People ────────', type: 'separator' as const }] : []),
      ...assignmentOptions.users
    ];
    return allOptions;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', taskData);
    
    // Validate required fields
    if (!taskData.title || !taskData.type || !taskData.assignedTo || !taskData.dueDate || !taskData.estimatedTime) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields marked with *",
        variant: "destructive"
      });
      return;
    }

    // Convert estimated time to minutes
    const estimatedMinutes = parseEstimatedTime(taskData.estimatedTime);
    
    if (estimatedMinutes <= 0) {
      toast({
        title: "Invalid Time Format",
        description: "Please enter a valid duration (e.g., '2h 30m' or '90m')",
        variant: "destructive"
      });
      return;
    }

    const newTask = {
      ...taskData,
      assignedTo: parseInt(taskData.assignedTo) || 1,
      estimatedTime: estimatedMinutes,
      status: 'pending' as const,
      progress: 0,
      checklist: [],
      startedAt: null,
      completedAt: null,
      createdBy: 1, // Current user
      data: {}
    };

    console.log('Calling onSave with:', newTask);
    onSave(newTask);
    resetForm();
  };

  const parseEstimatedTime = (timeStr: string): number => {
    const str = timeStr.toLowerCase().trim();
    let totalMinutes = 0;
    
    // Match patterns like "2h 30m", "2h", "30m", "90m"
    const hourMatch = str.match(/(\d+)\s*h/);
    const minuteMatch = str.match(/(\d+)\s*m/);
    
    if (hourMatch) {
      totalMinutes += parseInt(hourMatch[1]) * 60;
    }
    
    if (minuteMatch) {
      totalMinutes += parseInt(minuteMatch[1]);
    }
    
    // If no h or m, assume it's minutes
    if (!hourMatch && !minuteMatch) {
      const numMatch = str.match(/(\d+)/);
      if (numMatch) {
        totalMinutes = parseInt(numMatch[1]);
      }
    }
    
    return totalMinutes;
  };

  const resetForm = () => {
    setTaskData({
      title: '',
      description: '',
      type: '',
      priority: 'medium',
      assignedTo: '',
      dueDate: new Date().toISOString().split('T')[0],
      estimatedTime: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#203B17]">Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task for your team to complete
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={taskData.title}
              onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
              placeholder="e.g., Seed Lettuce Trays"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={taskData.description}
              onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
              placeholder="Detailed task instructions..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Task Type *</Label>
            <Select value={taskData.type} onValueChange={(value) => setTaskData({ ...taskData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {taskTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={taskData.priority} onValueChange={(value) => setTaskData({ ...taskData, priority: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign To *</Label>
            <Select 
              value={taskData.assignedTo} 
              onValueChange={(value) => {
                if (value && !value.startsWith('---')) {
                  setTaskData({ ...taskData, assignedTo: value })
                }
              }}
              disabled={!taskData.type || isLoadingAssignments}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !taskData.type 
                    ? "Select task type first"
                    : isLoadingAssignments 
                      ? "Loading assignments..." 
                      : "Select Assignee"
                } />
              </SelectTrigger>
              <SelectContent>
                {getAllAssignmentOptions().map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    disabled={option.type === 'separator'}
                    className={option.isSuggested ? 'font-semibold bg-yellow-50' : ''}
                  >
                    {option.label}
                    {option.isSuggested && ' ⭐'}
                  </SelectItem>
                ))}
                {getAllAssignmentOptions().length === 0 && taskData.type && !isLoadingAssignments && (
                  <SelectItem value="" disabled>
                    No assignment options available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {/* Show assignment preview for roles */}
            {taskData.assignedTo && taskData.assignedTo.startsWith('role_') && (
              <div className="text-sm text-gray-600 mt-1">
                <div className="p-2 bg-gray-50 rounded text-xs">
                  <strong>Will assign to:</strong> {
                    assignmentOptions.roles
                      .find(r => r.value === taskData.assignedTo)
                      ?.staffIds
                      ?.map(id => assignmentOptions.users.find(u => u.userId === id)?.label?.replace(' (You)', ''))
                      .filter(Boolean)
                      .join(', ') || 'No staff found'
                  }
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={taskData.dueDate}
              onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedTime">Estimated Duration *</Label>
            <Input
              id="estimatedTime"
              value={taskData.estimatedTime}
              onChange={(e) => setTaskData({ ...taskData, estimatedTime: e.target.value })}
              placeholder="e.g., 2h 30m, 90m"
              required
            />
            <p className="text-sm text-gray-500">
              Enter time in format: 2h 30m, 1h, 90m, or just numbers for minutes
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1 bg-[#2D8028] hover:bg-[#203B17]">
              Save Task
            </Button>
            <Button type="button" onClick={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};