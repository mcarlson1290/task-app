import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckSquare, Square } from "lucide-react";
import { Task, ChecklistItem } from "@shared/schema";
import { TaskType, TaskStatus } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: (task: Task) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, isOpen, onClose, onTaskUpdate }) => {
  const [checklist, setChecklist] = React.useState<ChecklistItem[]>([]);
  const [timeStarted, setTimeStarted] = React.useState<Date | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  React.useEffect(() => {
    if (task) {
      setChecklist(task.checklist || []);
      setTimeStarted(task.startedAt ? new Date(task.startedAt) : null);
    }
  }, [task]);

  const updateTaskMutation = useMutation({
    mutationFn: async (updates: Partial<Task>) => {
      if (!task) return;
      const response = await apiRequest("PATCH", `/api/tasks/${task.id}`, updates);
      return response.json();
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      onTaskUpdate(updatedTask);
      toast({
        title: "Task updated successfully",
        description: "Your changes have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createTaskLogMutation = useMutation({
    mutationFn: async (logData: { action: string; data?: any }) => {
      if (!task) return;
      const response = await apiRequest("POST", `/api/tasks/${task.id}/logs`, {
        userId: 1, // In a real app, get from auth context
        ...logData,
      });
      return response.json();
    },
  });

  const handleChecklistChange = (itemId: string, completed: boolean, dataValue?: any) => {
    const updatedChecklist = checklist.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, completed };
        if (dataValue !== undefined && item.dataCollection) {
          updated.dataCollection = { ...item.dataCollection, value: dataValue };
        }
        return updated;
      }
      return item;
    });
    
    setChecklist(updatedChecklist);
    
    // Update progress based on completed items
    const completedCount = updatedChecklist.filter(item => item.completed).length;
    const progress = Math.round((completedCount / updatedChecklist.length) * 100);
    
    updateTaskMutation.mutate({
      checklist: updatedChecklist,
      progress,
      data: { ...task?.data, checklistData: updatedChecklist },
    });

    // Log the action
    createTaskLogMutation.mutate({
      action: 'data_collected',
      data: { itemId, completed, dataValue },
    });
  };

  const handleStartTask = () => {
    const now = new Date();
    setTimeStarted(now);
    
    updateTaskMutation.mutate({
      status: 'in_progress',
      startedAt: now,
    });

    createTaskLogMutation.mutate({
      action: 'started',
    });
  };

  const handleCompleteTask = () => {
    const now = new Date();
    const actualTime = timeStarted 
      ? Math.round((now.getTime() - timeStarted.getTime()) / (1000 * 60))
      : task?.estimatedTime || 0;

    updateTaskMutation.mutate({
      status: 'completed',
      completedAt: now,
      actualTime,
      progress: 100,
    });

    createTaskLogMutation.mutate({
      action: 'completed',
      data: { actualTime },
    });

    // Show confetti celebration
    if (window.confetti) {
      window.confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    toast({
      title: "🎉 Task Completed!",
      description: "Great job! The task has been marked as completed.",
    });
  };

  if (!task) return null;

  const getTaskEmoji = (type: TaskType): string => {
    const emojis = {
      seeding: "🌱",
      moving: "🌿",
      harvesting: "🥬",
      packing: "📦",
      cleaning: "🧹",
      inventory: "📋"
    };
    return emojis[type] || "📋";
  };

  const getStatusColor = (status: TaskStatus): string => {
    const colors = {
      pending: "bg-blue-100 text-blue-800",
      in_progress: "bg-amber-100 text-amber-800",
      completed: "bg-green-100 text-green-800",
      approved: "bg-green-100 text-green-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getElapsedTime = (): string => {
    if (!timeStarted) return "Not started";
    const now = new Date();
    const elapsed = Math.round((now.getTime() - timeStarted.getTime()) / (1000 * 60));
    return formatTime(elapsed);
  };

  const allChecklistCompleted = checklist.every(item => item.completed);
  const canComplete = task.status === 'in_progress' && allChecklistCompleted;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl">{getTaskEmoji(task.type as TaskType)}</span>
            <div>
              <h2 className="text-lg font-semibold text-[#203B17]">{task.title}</h2>
              <p className="text-sm text-gray-600 font-normal">{task.location}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Progress */}
          <div className="flex items-center justify-between">
            <Badge className={`${getStatusColor(task.status as TaskStatus)} border-none`}>
              {task.status.replace('_', ' ')}
            </Badge>
            <div className="text-sm text-gray-600">
              Progress: {task.progress}%
            </div>
          </div>

          {task.status === 'in_progress' && (
            <Progress value={task.progress} className="h-2" />
          )}

          {/* Description */}
          {task.description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-[#203B17] mb-2">Description</h4>
              <p className="text-sm text-gray-600">{task.description}</p>
            </div>
          )}

          {/* Checklist */}
          {checklist.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-[#203B17] mb-4">Checklist</h4>
              <div className="space-y-4">
                {checklist.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={(checked) => 
                          handleChecklistChange(item.id, checked as boolean)
                        }
                        disabled={task.status === 'completed'}
                      />
                      <span className={`text-sm ${
                        item.completed ? 'line-through text-gray-500' : 'text-[#203B17]'
                      }`}>
                        {item.text}
                      </span>
                    </div>
                    
                    {/* Data Collection */}
                    {item.dataCollection && item.completed && (
                      <div className="ml-6 space-y-2">
                        <Label className="text-xs text-gray-600">
                          {item.dataCollection.label}
                        </Label>
                        {item.dataCollection.type === 'number' && (
                          <Input
                            type="number"
                            placeholder="Enter value"
                            value={item.dataCollection.value || ''}
                            onChange={(e) => 
                              handleChecklistChange(item.id, item.completed, e.target.value)
                            }
                            className="w-32"
                          />
                        )}
                        {item.dataCollection.type === 'text' && (
                          <Input
                            type="text"
                            placeholder="Enter text"
                            value={item.dataCollection.value || ''}
                            onChange={(e) => 
                              handleChecklistChange(item.id, item.completed, e.target.value)
                            }
                            className="w-48"
                          />
                        )}
                        {item.dataCollection.type === 'select' && (
                          <Select
                            value={item.dataCollection.value || ''}
                            onValueChange={(value) => 
                              handleChecklistChange(item.id, item.completed, value)
                            }
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              {item.dataCollection.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-[#203B17] mb-2">Time Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Estimated: </span>
                <span className="font-medium">
                  {task.estimatedTime ? formatTime(task.estimatedTime) : 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Elapsed: </span>
                <span className="font-medium">{getElapsedTime()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {task.status === 'pending' && (
              <Button
                onClick={handleStartTask}
                className="bg-[#2D8028] hover:bg-[#203B17] text-white"
                disabled={updateTaskMutation.isPending}
              >
                Start Task
              </Button>
            )}
            
            {canComplete && (
              <Button
                onClick={handleCompleteTask}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={updateTaskMutation.isPending}
              >
                Complete Task
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
