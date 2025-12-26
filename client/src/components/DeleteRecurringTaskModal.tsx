import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Calendar, CheckCircle, Clock } from 'lucide-react';
import { RecurringTask, Task } from '@shared/schema';

interface DeleteRecurringTaskModalProps {
  recurringTask: RecurringTask | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

interface TaskCounts {
  future: number;
  completed: number;
  inProgress: number;
}

const DeleteRecurringTaskModal: React.FC<DeleteRecurringTaskModalProps> = ({
  recurringTask,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [taskCounts, setTaskCounts] = useState<TaskCounts>({ future: 0, completed: 0, inProgress: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && recurringTask) {
      setIsLoading(true);
      // Fetch associated tasks to count them
      fetch('/api/tasks')
        .then(response => response.json())
        .then((tasks: Task[]) => {
          const associatedTasks = tasks.filter(t => t.recurringTaskId === recurringTask.id);
          
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          
          const counts = {
            future: 0,
            completed: 0,
            inProgress: 0
          };
          
          associatedTasks.forEach(task => {
            if (task.status === 'completed') {
              counts.completed++;
            } else if (task.status === 'in_progress' || task.startedAt) {
              counts.inProgress++;
            } else {
              const dueDate = new Date(task.dueDate || '');
              dueDate.setHours(0, 0, 0, 0);
              if (dueDate >= now) {
                counts.future++;
              }
            }
          });
          
          setTaskCounts(counts);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching task counts:', error);
          setIsLoading(false);
        });
    }
  }, [isOpen, recurringTask]);

  const handleDelete = () => {
    console.log('🗑️ handleDelete called, confirmText:', confirmText, 'length:', confirmText.length);
    console.log('🗑️ Comparison result:', confirmText === 'DELETE', 'trimmed:', confirmText.trim() === 'DELETE');
    
    if (confirmText.trim() === 'DELETE') {
      console.log('✅ Confirmation matched, calling onConfirm');
      onConfirm();
      setConfirmText('');
    } else {
      console.log('❌ Confirmation did not match "DELETE"');
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  if (!isOpen || !recurringTask) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Recurring Task
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">
              Are you sure you want to delete "{recurringTask.title}"?
            </h3>
            
            {isLoading ? (
              <div className="text-center py-2">Loading task counts...</div>
            ) : (
              <div className="space-y-3">
                <p className="text-yellow-700 font-medium">This action will:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-red-500" />
                    <span>Delete {taskCounts.future} future scheduled tasks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Preserve {taskCounts.completed} completed tasks for historical data</span>
                  </li>
                  {taskCounts.inProgress > 0 && (
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>Keep {taskCounts.inProgress} in-progress tasks active</span>
                    </li>
                  )}
                </ul>
                
                <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
                  <p className="text-red-700 text-sm">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    This action cannot be undone. The recurring task will be permanently deleted, 
                    but historical data will be preserved for reporting.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Type <span className="font-bold text-red-600">DELETE</span> to confirm:</p>
            <Input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="text-center border-red-300 focus:border-red-500"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete} 
            disabled={confirmText.trim() !== 'DELETE' || isLoading}
          >
            Delete Recurring Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteRecurringTaskModal;