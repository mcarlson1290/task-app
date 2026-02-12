import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckSquare, Square } from "lucide-react";
import { Task, ChecklistItem } from "@shared/schema";
import { TaskType, TaskStatus } from "@/types";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import ChecklistExecution from "./ChecklistExecution";

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskAction: (taskId: number, action: 'start' | 'collaborate' | 'complete' | 'pause' | 'skip' | 'view', reason?: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, isOpen, onClose, onTaskAction }) => {
  const [checklist, setChecklist] = React.useState<ChecklistItem[]>([]);
  const [timeStarted, setTimeStarted] = React.useState<Date | null>(null);
  const [notes, setNotes] = React.useState<string>('');
  const [showSkipReason, setShowSkipReason] = React.useState(false);
  const [skipReason, setSkipReason] = React.useState('');
  const [showIncompleteConfirm, setShowIncompleteConfirm] = React.useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  React.useEffect(() => {
    if (task) {
      setChecklist(task.checklist || []);
      setTimeStarted(task.startedAt ? new Date(task.startedAt) : null);
      setNotes('');
    }
  }, [task]);

  const updateTaskMutation = useMutation({
    mutationFn: async (updates: Partial<Task>) => {
      if (!task) {
        console.error("No task found for update!");
        return null;
      }
      const response = await apiRequest("PATCH", `/api/tasks/${task.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error) => {
      console.error("Error updating task:", error);
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

  // Fetch growing systems for ChecklistExecution
  const { data: growingSystems = [] } = useQuery({
    queryKey: ['/api/growing-systems'],
    queryFn: async () => {
      const response = await fetch('/api/growing-systems');
      if (!response.ok) throw new Error('Failed to fetch growing systems');
      return response.json();
    },
  });

  const handleChecklistChange = (itemId: string, completed: boolean, dataValue?: any) => {
    const currentChecklist = checklist.length > 0 ? checklist : task?.checklist || [];
    const updatedChecklist = currentChecklist.map(item => {
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

  const handleCompleteTask = (forceComplete = false) => {
    if (!task) {
      console.error('No task available for completion');
      return;
    }

    // Check for incomplete checklist items
    const checklistItems = task.checklist || [];
    const incompleteCount = checklistItems.filter(item => !item.completed).length;
    
    if (incompleteCount > 0 && !forceComplete) {
      // Show confirmation dialog instead of completing
      setShowIncompleteConfirm(true);
      return;
    }

    const now = new Date();
    const actualTime = timeStarted 
      ? Math.round((now.getTime() - timeStarted.getTime()) / (1000 * 60))
      : task.estimatedTime || 0;

    console.log('Completing task with status change to completed');
    console.log('Task ID:', task.id);
    console.log('Completion data:', {
      status: 'completed',
      completedAt: now,
      actualTime,
      progress: 100,
      data: { ...task.data, notes }
    });

    // Store task ID before closing modal
    const taskId = task.id;
    
    updateTaskMutation.mutate({
      status: 'completed',
      completedAt: now.toISOString(),
      actualTime,
      progress: 100,
      data: { ...task.data, notes }, // Store notes in task data
    });

    createTaskLogMutation.mutate({
      action: 'completed',
      data: { actualTime, notes },
    });

    // Show confetti celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Don't close modal immediately - let the mutation complete first
    // onClose will be called in the mutation success handler
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
      pending: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      approved: "bg-green-100 text-green-800",
      paused: "bg-yellow-100 text-yellow-800",
      skipped: "bg-gray-100 text-gray-800"
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6" onCloseAutoFocus={(e) => e.preventDefault()}>
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

          {/* Skip Reason */}
          {task.status === 'skipped' && task.skipReason && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-[#203B17] mb-2">Skip Reason</h4>
              <p className="text-sm text-gray-600">{task.skipReason}</p>
            </div>
          )}

          {/* Advanced Checklist Execution - Keyed by task ID to force remount */}
          {/* Show for in_progress OR pending tasks so users can preview checklist */}
          {(checklist.length > 0 || (task.checklist && task.checklist.length > 0)) && (task.status === 'in_progress' || task.status === 'pending') && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-[#203B17] mb-4">Task Checklist</h4>
              <ChecklistExecution
                key={task.id}
                task={task}
                checklist={{ steps: (checklist.length > 0 ? checklist : task.checklist || []).map(item => ({
                  id: item.id,
                  label: item.text,
                  type: item.type || 'checkbox',
                  config: item.config || {},
                  required: item.required || false,
                  completed: item.completed || false
                })) }}
                systems={growingSystems}
                onComplete={(stepData) => {
                  // Show completion message instead of auto-completing task
                  toast({
                    title: "All checklist items completed!",
                    description: "Please complete any remaining work, then click 'Complete Task' in the task modal.",
                  });
                }}
                onProgress={(progress) => {
                  console.log('📊 Checklist progress update received:', progress);
                  
                  // Handle enhanced progress data structure
                  const progressData = progress.stepData;
                  
                  // Update task with comprehensive checklist progress
                  const completedSteps = progressData.completedSteps || 0;
                  const totalSteps = progressData.totalSteps || checklist.length;
                  const progressPercent = Math.round((completedSteps / totalSteps) * 100);
                  
                  console.log('💾 Saving enhanced checklist progress:', {
                    completedSteps,
                    totalSteps,
                    progressPercent,
                    hasProgressData: !!progressData.checklistProgress
                  });
                  
                  updateTaskMutation.mutate({
                    progress: progressPercent,
                    data: { 
                      ...task.data, 
                      checklistProgress: progressData.checklistProgress,
                      checklistStepData: progressData.checklistStepData,
                      currentStep: progressData.currentStep,
                      lastUpdated: new Date().toISOString()
                    },
                  });
                }}
              />
            </div>
          )}

          {/* Enhanced Checklist View for Completed/Skipped Tasks (not pending or in_progress) */}
          {(checklist.length > 0 || (task.checklist && task.checklist.length > 0)) && task.status !== 'in_progress' && task.status !== 'pending' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-[#203B17] mb-4">
                Checklist Details
                {task.data?.checklistProgress && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    ({Object.keys(task.data.checklistProgress).length} completed)
                  </span>
                )}
              </h4>
              <div className="space-y-4">
                {(checklist.length > 0 ? checklist : task.checklist || []).map((item, index) => {
                  const savedProgress = task.data?.checklistProgress?.[index];
                  const isCompleted = savedProgress?.completed || item.completed;
                  
                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          checked={isCompleted}
                          disabled={true}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <span className={`text-sm ${
                            isCompleted ? 'line-through text-gray-500' : 'text-[#203B17]'
                          }`}>
                            {item.text}
                          </span>
                          
                          {/* Show completion details if available */}
                          {savedProgress?.completed && (
                            <div className="mt-1 text-xs text-green-600">
                              ✓ Completed on {new Date(savedProgress.completedAt).toLocaleString()}
                            </div>
                          )}
                          
                          {/* Show step data if available */}
                          {savedProgress?.stepData && (
                            <div className="mt-1 p-2 bg-gray-100 rounded text-xs">
                              <strong>Data collected:</strong>
                              <pre className="mt-1 text-gray-700">
                                {JSON.stringify(savedProgress.stepData, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Show last updated timestamp if available */}
              {task.data?.lastUpdated && (
                <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                  Last updated: {new Date(task.data.lastUpdated).toLocaleString()}
                </div>
              )}
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

          {/* Notes Section */}
          {task.status === 'in_progress' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-[#203B17] mb-2">Task Notes</h4>
              <Textarea
                placeholder="Add any notes about your progress, issues encountered, or observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {!showSkipReason && (
              <>
                {/* Show action buttons only if in-progress */}
                {task.status === 'in_progress' && (
                  <>
                    <Button
                      onClick={() => onTaskAction(task.id, 'complete')}
                      className="bg-green-600 hover:bg-green-700 text-white ml-auto"
                    >
                      ✅ Complete Task
                    </Button>
                    
                    <Button
                      onClick={() => onTaskAction(task.id, 'pause')}
                      variant="outline"
                      className="border-amber-500 text-amber-600 hover:bg-amber-50"
                    >
                      ⏸️ Pause Task
                    </Button>
                    
                    <Button
                      onClick={() => setShowSkipReason(true)}
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50"
                    >
                      ⏭️ Skip Task
                    </Button>
                  </>
                )}
                
                {/* Show completion info if completed */}
                {task.status === 'completed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full">
                    <p className="text-green-800 font-medium">✅ Task Completed</p>
                    {task.completedAt && (
                      <p className="text-sm text-green-600 mt-1">
                        Completed at: {new Date(task.completedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Show pause info if paused */}
                {task.status === 'paused' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 w-full">
                    <p className="text-yellow-800 font-medium">⏸️ Task Paused</p>
                    {task.pausedAt && (
                      <p className="text-sm text-yellow-600 mt-1">
                        Paused at: {new Date(task.pausedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Show skip info if skipped */}
                {task.status === 'skipped' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 w-full">
                    <p className="text-gray-800 font-medium">⏭️ Task Skipped</p>
                    {task.skippedAt && (
                      <p className="text-sm text-gray-600 mt-1">
                        Skipped at: {new Date(task.skippedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
                
                <Button variant="outline" onClick={onClose}>
                  {task.status === 'completed' ? 'Close' : 'Cancel'}
                </Button>
              </>
            )}
            
            {showSkipReason && (
              <div className="w-full space-y-3">
                <Label className="text-sm font-medium text-[#203B17]">
                  Reason for skipping:
                </Label>
                <Textarea
                  placeholder="Please provide a reason for skipping this task..."
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (skipReason.trim()) {
                        onTaskAction(task.id, 'skip', skipReason);
                        setShowSkipReason(false);
                        setSkipReason('');
                      }
                    }}
                    disabled={!skipReason.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirm Skip
                  </Button>
                  <Button
                    onClick={() => {
                      setShowSkipReason(false);
                      setSkipReason('');
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Incomplete Checklist Confirmation Dialog */}
      <Dialog open={showIncompleteConfirm} onOpenChange={setShowIncompleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              ⚠️ Incomplete Checklist Items
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              There are <strong>{(task?.checklist || []).filter(item => !item.completed).length}</strong> uncompleted checklist steps.
            </p>
            <p className="text-gray-600 mt-2">
              Are you sure you want to mark this task as complete anyway?
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowIncompleteConfirm(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#2D8028] hover:bg-[#203B17]"
              onClick={() => {
                setShowIncompleteConfirm(false);
                handleCompleteTask(true);
              }}
            >
              Yes, Complete Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default TaskModal;
