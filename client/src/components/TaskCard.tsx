import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Weight, Info, CheckCircle, User, Calendar, AlertTriangle } from "lucide-react";
import { format, isAfter, isToday, isTomorrow, differenceInDays } from "date-fns";
import { Task } from "@shared/schema";
import { TaskType, TaskStatus } from "@/types";

interface TaskCardProps {
  task: Task;
  onTaskAction: (taskId: number, action: 'start' | 'collaborate' | 'complete' | 'pause' | 'skip' | 'view' | 'resume') => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onTaskAction }) => {
  const getTaskEmoji = (type: TaskType): string => {
    const emojis = {
      "seeding-microgreens": "🌱",
      "seeding-leafy-greens": "🌿",
      "harvest-microgreens": "🌾",
      "harvest-leafy-greens": "🥬",
      "blackout-tasks": "🌑",
      "moving": "📦",
      "packing": "📦",
      "cleaning": "🧹",
      "inventory": "📊",
      "equipment-maintenance": "🔧",
      "other": "📝"
    };
    return emojis[type] || "📋";
  };

  const getStatusColor = (status: TaskStatus): string => {
    const colors = {
      pending: "bg-gray-500 text-white",
      in_progress: "bg-blue-500 text-white",
      completed: "bg-green-500 text-white",
      approved: "bg-green-600 text-white",
      paused: "bg-yellow-500 text-white",
      skipped: "bg-gray-500 text-white"
    };
    return colors[status] || "bg-gray-500 text-white";
  };

  const getStatusLabel = (status: TaskStatus): string => {
    const labels = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      approved: "Approved",
      paused: "Paused",
      skipped: "Skipped"
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: string | null): string => {
    if (!priority) return "bg-gray-500";
    const colors: Record<string, string> = {
      high: "bg-red-500",
      medium: "bg-yellow-500",
      low: "bg-green-500"
    };
    return colors[priority] || "bg-gray-500";
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getDueDateDisplay = () => {
    if (!task.dueDate) return null;
    
    // Calculate days until due with timezone-safe date comparison
    const calculateDaysUntilDue = (dueDateInput: string | Date) => {
      // Extract date string without timezone conversion
      let dateString: string;
      if (dueDateInput instanceof Date) {
        const year = dueDateInput.getFullYear();
        const month = String(dueDateInput.getMonth() + 1).padStart(2, '0');
        const day = String(dueDateInput.getDate()).padStart(2, '0');
        dateString = `${year}-${month}-${day}`;
      } else {
        dateString = dueDateInput.split('T')[0];
      }
      
      // Parse dates without timezone issues
      const [year, month, day] = dateString.split('-');
      const dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const msPerDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / msPerDay);
      
      return diffDays;
    };
    
    const diffDays = calculateDaysUntilDue(task.dueDate);
    
    // Format the actual date - ALWAYS include it (timezone-safe)
    const formatDate = (dateInput: string | Date) => {
      let dateString: string;
      
      // Handle both Date objects and strings
      if (dateInput instanceof Date) {
        // Convert Date to YYYY-MM-DD format without timezone issues
        const year = dateInput.getFullYear();
        const month = String(dateInput.getMonth() + 1).padStart(2, '0');
        const day = String(dateInput.getDate()).padStart(2, '0');
        dateString = `${year}-${month}-${day}`;
      } else {
        // Handle ISO string format by extracting date part
        dateString = dateInput.split('T')[0];
      }
      
      // Parse the date string without timezone conversion
      const [year, month, day] = dateString.split('-');
      
      // Create month names array
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Return formatted date (e.g., "Jul 31")
      return `${months[parseInt(month) - 1]} ${parseInt(day)}`;
    };
    const dateStr = formatDate(task.dueDate);
    
    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return {
        text: `Overdue by ${absDays} day${absDays !== 1 ? 's' : ''} (${dateStr})`,
        className: 'text-red-600 font-semibold'
      };
    } else if (diffDays === 0) {
      return {
        text: `Due today (${dateStr})`,
        className: 'text-orange-600 font-semibold'
      };
    } else if (diffDays === 1) {
      return {
        text: `Due in 1 day (${dateStr})`, // ALWAYS include the actual date
        className: 'text-yellow-600 font-medium'
      };
    } else {
      return {
        text: `Due in ${diffDays} days (${dateStr})`,
        className: 'text-gray-600'
      };
    }
  };

  // Late task detection functions
  const isTaskLate = (task: Task): boolean => {
    if (task.status !== 'completed' || !task.completedAt || !task.dueDate) {
      return false;
    }
    
    const dueTime = new Date(task.dueDate).getTime();
    const completedTime = new Date(task.completedAt).getTime();
    
    return completedTime > dueTime;
  };

  const getLateDuration = (task: Task): string | null => {
    if (!isTaskLate(task) || !task.completedAt) return null;
    
    const dueTime = new Date(task.dueDate!);
    const completedTime = new Date(task.completedAt!);
    const diffMinutes = Math.floor((completedTime.getTime() - dueTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min late`;
    } else if (diffMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(diffMinutes / 60);
      return `${hours} hr${hours > 1 ? 's' : ''} late`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} late`;
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    return "Just now";
  };

  const checkIfOverdue = (dueDateInput: string | Date): boolean => {
    if (!dueDateInput) return false;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let dateString: string;
    
    // Handle both Date objects and strings
    if (dueDateInput instanceof Date) {
      // Convert Date to YYYY-MM-DD format
      const year = dueDateInput.getFullYear();
      const month = String(dueDateInput.getMonth() + 1).padStart(2, '0');
      const day = String(dueDateInput.getDate()).padStart(2, '0');
      dateString = `${year}-${month}-${day}`;
    } else {
      // Handle ISO string format by extracting date part
      dateString = dueDateInput.split('T')[0];
    }
    
    // Parse the task date (YYYY-MM-DD format)
    const [year, month, day] = dateString.split('-');
    const dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // If due date is before today, it's overdue
    if (dueDate < today) {
      return true;
    }
    
    // If due date is today, check if it's after 8:30 PM
    if (dueDate.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Check if it's after 8:30 PM (20:30 in 24-hour format)
      if (currentHour > 20 || (currentHour === 20 && currentMinute >= 30)) {
        return true;
      }
    }
    
    // Otherwise, not overdue
    return false;
  };

  const formatDueDate = (dateInput: string | Date): string => {
    if (!dateInput) return '';
    
    let dateString: string;
    
    // Handle both Date objects and strings
    if (dateInput instanceof Date) {
      // Convert Date to YYYY-MM-DD format without timezone issues
      const year = dateInput.getFullYear();
      const month = String(dateInput.getMonth() + 1).padStart(2, '0');
      const day = String(dateInput.getDate()).padStart(2, '0');
      dateString = `${year}-${month}-${day}`;
    } else {
      // Handle ISO string format by extracting date part
      dateString = dateInput.split('T')[0];
    }
    
    // Parse the date string without timezone conversion
    const [year, month, day] = dateString.split('-');
    
    // Create month names array
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Return formatted date (e.g., "Jan 18, 2025")
    return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
  };

  const getOverdueMessage = (task: any): string => {
    if (!task.isOverdue) return '';
    
    const today = new Date().toISOString().split('T')[0];
    const taskDateString = task.dueDate instanceof Date ? 
      task.dueDate.toISOString().split('T')[0] : 
      task.dueDate.split('T')[0];
    
    if (taskDateString === today) {
      return 'OVERDUE (8:30 PM deadline passed)';
    }
    
    const daysDiff = Math.abs(differenceInDays(new Date(), new Date(task.dueDate)));
    return `OVERDUE by ${daysDiff} day${daysDiff > 1 ? 's' : ''}`;
  };

  const isCompleted = task.status === 'completed' || task.status === 'approved';
  const isInProgress = task.status === 'in_progress';
  const isPending = task.status === 'pending';
  const isPaused = task.status === 'paused';
  const isSkipped = task.status === 'skipped';
  const isOverdue = task.dueDate && task.status !== 'completed' && task.status !== 'approved' ? checkIfOverdue(task.dueDate) : false;

  const getCardClassName = () => {
    let baseClass = "hover:shadow-lg transition-all duration-200 cursor-pointer";
    if (isInProgress) {
      baseClass += " bg-blue-50 border-blue-200";
    } else if (isCompleted) {
      baseClass += " bg-green-50 border-green-200";
    }
    return baseClass;
  };

  return (
    <Card className={`relative shadow-sm hover:shadow-md transition-shadow ${
      isInProgress ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
    } ${isCompleted ? 'opacity-75' : ''} ${
      isPaused ? 'bg-yellow-50 border-l-4 border-l-yellow-500' : ''
    } ${
      isSkipped ? 'bg-gray-50 border-l-4 border-l-gray-500' : ''
    } ${
      isOverdue ? 'bg-red-50 border-l-4 border-l-red-500' : ''
    } ${
      isCompleted && isTaskLate(task) ? 'border-l-4 border-l-amber-400' : ''
    }`}>
      <CardContent className="p-6">
        {/* Status, Priority, and Status Icons - Repositioned */}
        <div className="absolute top-3 right-3 flex flex-col items-center gap-1">
          {/* Status Badge */}
          <div className={`px-2 py-1 rounded text-xs font-semibold ${
            isCompleted && isTaskLate(task) 
              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
              : getStatusColor(task.status as TaskStatus)
          }`}>
            {isCompleted && isTaskLate(task) ? '✓ Completed Late' : getStatusLabel(task.status as TaskStatus)}
          </div>
          
          {/* Priority Badge */}
          <div className={`px-2 py-1 rounded text-xs font-semibold text-white ${getPriorityColor(task.priority)}`}>
            {task.priority?.toUpperCase() || 'N/A'}
          </div>
          
          {/* Status Icons Row - Positioned under priority */}
          <div className="flex items-center gap-1 min-h-[20px]">
            {task.isRecurring && task.recurringTaskId && (
              <span className="text-sm text-blue-600" title="Recurring Task">
                🔄
              </span>
            )}
            {isCompleted && isTaskLate(task) && (
              <span 
                className="text-sm text-amber-600"
                title={`Completed ${getLateDuration(task)}`}
              >
                ⚠️
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start mb-4 pr-20">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getTaskEmoji(task.type as TaskType)}</span>
            <div>
              <div>
                <h3 className="font-semibold text-[#203B17]">{task.title}</h3>
              </div>
              {task.assignedTo && (
                <p className="text-sm text-gray-600">Assigned to: User {task.assignedTo}</p>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar (for in-progress tasks) */}
        {isInProgress && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium text-[#203B17]">
                {task.progress}%
              </span>
            </div>
            <Progress value={task.progress} className="h-2" />
          </div>
        )}

        {/* Task Details */}
        <div className="mb-4">
          {task.description && (
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Info className="h-4 w-4 mr-1" />
              <span>{task.description}</span>
            </div>
          )}
          

          
          {task.checklist && task.checklist.length > 0 && (
            <div className="text-sm text-gray-600 mb-2">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>
                  {task.checklist.filter(item => item.completed).length}/
                  {task.checklist.length} checklist items
                </span>
              </div>
            </div>
          )}

          {task.dueDate && (
            <div className="space-y-1">
              {(() => {
                const dueDateDisplay = getDueDateDisplay();
                return dueDateDisplay ? (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className={dueDateDisplay.className}>
                      📅 {dueDateDisplay.text}
                    </span>
                  </div>
                ) : (
                  <div className={`flex items-center text-sm ${
                    isOverdue ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className={isOverdue ? 'font-semibold' : ''}>
                      Due: {formatDueDate(task.dueDate)}
                    </span>
                  </div>
                );
              })()}
              {isOverdue && (
                <div className="flex items-center text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span className="font-semibold">
                    {getOverdueMessage(task)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Late task completion indicator */}
          {isCompleted && isTaskLate(task) && (
            <div className="flex items-center text-sm text-amber-600 mb-2">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span className="font-semibold">
                Completed Late ({getLateDuration(task)})
              </span>
            </div>
          )}

          {isCompleted && (
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <User className="h-4 w-4 mr-1" />
              <span>Completed and approved</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-1" />
            <span>
              {isInProgress && task.startedAt
                ? `Started ${getTimeAgo(new Date(task.startedAt))}`
                : isCompleted && task.completedAt
                ? `Completed ${getTimeAgo(new Date(task.completedAt))}`
                : task.estimatedTime
                ? `Est. ${formatTime(task.estimatedTime)}`
                : "No time estimate"
              }
            </span>
          </div>
          
          <div className="flex gap-2">
            {/* Single button based on task status */}
            {task.status === 'pending' && (
              <Button
                onClick={() => onTaskAction(task.id, 'start')}
                className="bg-[#2D8028] hover:bg-[#203B17] text-white"
              >
                Start Task
              </Button>
            )}
            
            {task.status === 'in_progress' && (
              <Button
                onClick={() => onTaskAction(task.id, 'collaborate')}
                className="bg-[#2D8028] hover:bg-[#203B17] text-white"
              >
                🤝 Collaborate
              </Button>
            )}
            
            {task.status === 'completed' && (
              <Button
                variant="outline"
                onClick={() => onTaskAction(task.id, 'view')}
                className="text-gray-600"
              >
                View Details
              </Button>
            )}
            
            {task.status === 'paused' && (
              <Button
                onClick={() => onTaskAction(task.id, 'resume')}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                ▶️ Resume
              </Button>
            )}
            
            {task.status === 'skipped' && (
              <Button
                variant="outline"
                onClick={() => onTaskAction(task.id, 'view')}
                className="text-gray-600"
              >
                View Details
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
