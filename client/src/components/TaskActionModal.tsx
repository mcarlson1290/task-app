import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Clock, Pause, CheckCircle, SkipForward } from "lucide-react";
import { Task } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

interface TaskActionModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

const TaskActionModal: React.FC<TaskActionModalProps> = ({ task, open, onClose }) => {
  const [notes, setNotes] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate elapsed time
  useEffect(() => {
    if (!task?.startedAt) return;
    
    const updateElapsedTime = () => {
      const now = new Date();
      const started = new Date(task.startedAt!);
      const diff = now.getTime() - started.getTime();
      setElapsedTime(Math.floor(diff / 1000 / 60)); // in minutes
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [task?.startedAt]);

  const updateTaskMutation = useMutation({
    mutationFn: async (updates: Partial<Task>) => {
      return await apiRequest(`/api/tasks/${task?.id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      onClose();
    },
  });

  const handlePauseTask = () => {
    updateTaskMutation.mutate({
      status: "pending",
      actualTime: elapsedTime,
    });
    toast({
      title: "Task paused",
      description: "The task has been paused and can be resumed later.",
    });
  };

  const handleCompleteTask = () => {
    updateTaskMutation.mutate({
      status: "completed",
      progress: 100,
      completedAt: new Date().toISOString(),
      actualTime: elapsedTime,
    });
    toast({
      title: "🎉 Task completed!",
      description: "Great job! The task has been marked as completed.",
    });
    // Celebrate with confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleSkipTask = () => {
    if (!notes.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for skipping this task.",
        variant: "destructive",
      });
      return;
    }
    
    updateTaskMutation.mutate({
      status: "pending",
      data: { 
        ...task?.data, 
        skipped: true, 
        skipReason: notes 
      },
    });
    toast({
      title: "Task skipped",
      description: "The task has been skipped with your reason noted.",
    });
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p><strong>Location:</strong> {task.location}</p>
            <p><strong>Description:</strong> {task.description}</p>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>
              Time elapsed: <strong>{formatTime(elapsedTime)}</strong>
              {task.estimatedTime && (
                <span className="text-gray-500"> / {formatTime(task.estimatedTime)}</span>
              )}
            </span>
          </div>

          {task.progress !== null && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm">Progress</Label>
                <span className="text-sm font-medium">{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-2" />
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any comments or observations..."
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handlePauseTask}
              disabled={updateTaskMutation.isPending}
              className="flex items-center space-x-1"
            >
              <Pause className="h-4 w-4" />
              <span>Pause</span>
            </Button>
            
            <Button
              onClick={handleCompleteTask}
              disabled={updateTaskMutation.isPending}
              className="flex items-center space-x-1 bg-[#2D8028] hover:bg-[#203B17]"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Complete</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSkipTask}
              disabled={updateTaskMutation.isPending}
              className="flex items-center space-x-1 text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <SkipForward className="h-4 w-4" />
              <span>Skip</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskActionModal;