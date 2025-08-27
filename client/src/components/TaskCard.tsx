import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, Info, Users } from "lucide-react";
import { Task } from "@shared/schema";
import { TaskType, TaskStatus } from "@/types";
import { isTaskAssignedToUser, getAssignmentDisplay } from "../utils/taskAssignment";
import { useCurrentUser } from "../contexts/CurrentUserContext";
import { StaffMember } from "../services/staffService";

interface TaskCardProps {
  task: Task;
  onTaskAction: (taskId: number, action: 'start' | 'collaborate' | 'complete' | 'pause' | 'skip' | 'view' | 'resume') => void;
  staff?: StaffMember[];
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onTaskAction, staff = [] }) => {
  const { currentUser } = useCurrentUser();
  // Safety check for task object
  if (!task) {
    return (
      <Card className="task-card relative shadow-sm border-red-200">
        <CardContent className="p-6">
          <div className="text-red-600">Error: Task data is missing</div>
        </CardContent>
      </Card>
    );
  }
  const getTaskEmoji = (type: string): string => {
    const emojis: Record<string, string> = {
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

  const formatTime = (minutes: number | null | undefined): string => {
    if (!minutes || minutes <= 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getTaskDayDisplay = (task: Task) => {
    // Safety check for task object
    if (!task) {
      return { text: 'NO DATA', color: '#6b7280' }; // Gray
    }
    
    // Check for monthly or bi-weekly patterns
    if (task.description?.toLowerCase().includes('monthly') || task.title?.toLowerCase().includes('monthly')) {
      return { text: 'MONTHLY', color: '#7c3aed' }; // Purple
    }
    if (task.description?.toLowerCase().includes('bi-weekly') || task.description?.toLowerCase().includes('biweekly') || task.title?.toLowerCase().includes('bi-weekly')) {
      return { text: 'BI-WEEKLY', color: '#0891b2' }; // Cyan
    }
    
    // For regular tasks, show the day
    if (!task.dueDate) {
      return { text: 'NO DATE', color: '#6b7280' }; // Gray
    }
    
    try {
      const dueDate = new Date(task.dueDate);
      const dayName = dueDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      return { text: dayName, color: '#059669' }; // Green
    } catch (error) {
      return { text: 'INVALID DATE', color: '#ef4444' }; // Red
    }
  };

  const formatDueDate = (dateInput: string | Date | null): string => {
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

  const checkIfOverdue = (dueDateInput: string | Date | null): boolean => {
    // Check if dev overdue protection is enabled
    const overdueProtection = localStorage.getItem('devOverdueProtection') === 'true';
    if (overdueProtection) {
      return false; // Never show as overdue in dev mode
    }
    
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
    
    // Set time to 8:30 PM Chicago time for due date
    const chicagoTime = new Date(dueDate);
    chicagoTime.setHours(20, 30, 0, 0); // 8:30 PM cutoff
    
    // Task is overdue if current time is past 8:30 PM on due date
    return now > chicagoTime;
  };

  const isCompleted = task.status === 'completed' || task.status === 'approved';
  const isInProgress = task.status === 'in_progress';
  const isPending = task.status === 'pending' || !task.status; // Include tasks with no status
  const isPaused = task.status === 'paused';
  const isSkipped = task.status === 'skipped';
  
  // Debug logging (removed after fixing issue)
  
  const isCurrentlyOverdue = checkIfOverdue(task.dueDate);
  const dayDisplay = getTaskDayDisplay(task);

  // Check if task is assigned to current user using centralized function
  const isAssignedToCurrentUser = isTaskAssignedToUser(task, currentUser);
  
  // Debug logging for assignment - show assigned tasks
  if (isAssignedToCurrentUser) {
    console.log('🎯 ASSIGNED TASK FOUND - SHOULD HAVE GREEN BORDER:', {
      taskId: task.id,
      taskTitle: task.title,
      assignTo: task.assignTo,
      assignedTo: task.assignedTo,
      isAssigned: isAssignedToCurrentUser,
      cssClass: 'assigned-to-me'
    });
  }

  return (
    <Card className={`task-card relative shadow-sm hover:shadow-md transition-shadow ${
      isAssignedToCurrentUser ? 'assigned-to-me' : ''
    } ${
      isInProgress ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
    } ${isCompleted ? 'opacity-75' : ''} ${
      isPaused ? 'bg-yellow-50 border-l-4 border-l-yellow-500' : ''
    } ${
      isSkipped ? 'bg-gray-50 border-l-4 border-l-gray-500' : ''
    } ${
      isCurrentlyOverdue ? 'bg-red-50 border-l-4 border-l-red-500' : ''
    }`} data-status={task.status}>
      <CardContent className="p-6">
        {/* Top badges row - better organized */}
        <div className="task-badges-row flex justify-between items-start mb-4">
          {/* Left badges: Day and Priority */}
          <div className="left-badges flex gap-2">
            <span 
              className="day-badge px-2 py-1 rounded text-xs font-bold text-white"
              style={{ backgroundColor: dayDisplay.color }}
            >
              {dayDisplay.text}
            </span>
            <span className={`priority-badge px-2 py-1 rounded text-xs font-bold ${
              task.priority === 'high' ? 'bg-red-500 text-white' :
              task.priority === 'medium' ? 'bg-yellow-500 text-white' :
              'bg-green-500 text-white'
            }`}>
              {task.priority?.toUpperCase() || 'LOW'}
            </span>
          </div>
          
          {/* Right badge: Your Task (only when assigned) */}
          {isAssignedToCurrentUser && (
            <div className="your-task-badge bg-[#2D8028] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg border-2 border-[#1a5a15]">
              📌 Your Task
            </div>
          )}
        </div>
        
        {/* Title Section */}
        <div className="task-header mb-4">
          <h3 className="task-title text-lg font-semibold text-gray-800 mb-2">
            {getTaskEmoji(task.type || 'other')} {task.title || 'Untitled Task'}
          </h3>
          
          {/* Task type */}
          <p className="text-sm text-gray-600 mb-2">
            {task.type ? task.type.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown Type'}
          </p>
        </div>
        
        {/* Task Details - clean single display */}
        <div className="task-details mb-4">
          {/* Overdue warning if applicable */}
          {isCurrentlyOverdue && !isCompleted && (
            <p className="overdue-warning text-red-600 font-medium mb-2">
              ⚠️ OVERDUE - Task is past due
            </p>
          )}
          
          {/* Single task info row - due date and assignment */}
          <div className="task-info-row flex gap-4 text-sm text-gray-600 mb-2">
            {/* Due date */}
            {task.dueDate && (
              <span className="due-date">
                📅 {isCurrentlyOverdue ? 'Was due' : 'Due'} {formatDueDate(task.dueDate)}
              </span>
            )}
            
            {/* Time estimate */}
            {task.estimatedTime && (
              <span className="time-estimate">
                ⏱️ {formatTime(task.estimatedTime)}
              </span>
            )}
          </div>
          
          {/* Assignment information - simplified */}
          <div className="assignment-info text-sm text-gray-600 mb-1 flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{getAssignmentDisplay(task.assignTo || task.assignedTo)}</span>
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

        {/* Checklist info if available */}
        {task.checklist && task.checklist.length > 0 && (
          <div className="text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>
                {(() => {
                  // Use the actual progress data from ChecklistExecution if available
                  if (task.data?.checklistProgress) {
                    const completedSteps = Object.values(task.data.checklistProgress).filter(
                      (step: any) => step.completed === true
                    ).length;
                    return `✓ ${completedSteps}/${task.checklist.length} checklist items`;
                  }
                  
                  // Fallback to checking individual item completion status
                  const completedFromItems = task.checklist.filter(item => 
                    item.completed === true
                  ).length;
                  return `✓ ${completedFromItems}/${task.checklist.length} checklist items`;
                })()}
              </span>
            </div>
          </div>
        )}

        {/* Description if available */}
        {task.description && (
          <div className="text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <Info className="h-4 w-4 mr-1" />
              <span>{task.description}</span>
            </div>
          </div>
        )}

        {/* Task Status Info - Shows only completion/skip status, not duplicate due dates */}
        {(task.status === 'completed' || task.status === 'skipped') && (
          <div className="task-status-info text-xs text-gray-500 mb-3 text-center bg-gray-50 rounded p-2">
            {(() => {
              if (task.status === 'completed' && task.completedAt) {
                const completedDate = new Date(task.completedAt);
                return `✅ Completed ${completedDate.toLocaleDateString()}`;
              }
              
              if (task.status === 'skipped' && task.skippedAt) {
                const skippedDate = new Date(task.skippedAt);
                return `⏭️ Skipped ${skippedDate.toLocaleDateString()}`;
              }
              
              return '';
            })()}
          </div>
        )}

        {/* Action button - centered */}
        <div className="task-actions flex justify-center mt-4">
          {isPending && (
            <Button 
              onClick={() => onTaskAction(task.id, 'start')}
              className="btn-action bg-[#2D8028] hover:bg-[#236020] text-white px-6 py-2 rounded-md font-medium"
              data-testid="button-start-task"
            >
              Start Task
            </Button>
          )}
          {isInProgress && (
            <Button 
              onClick={() => onTaskAction(task.id, 'collaborate')}
              className="btn-action bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium"
              data-testid="button-continue-task"
            >
              👥 Collaborate/Continue
            </Button>
          )}
          {isPaused && (
            <Button 
              onClick={() => onTaskAction(task.id, 'resume')}
              className="btn-action bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-md font-medium"
              data-testid="button-resume-task"
            >
              Resume Task
            </Button>
          )}
          {(isCompleted || isSkipped) && (
            <Button 
              onClick={() => onTaskAction(task.id, 'view')}
              variant="outline"
              className="btn-action px-6 py-2 rounded-md font-medium"
              data-testid="button-view-details"
            >
              View Details
            </Button>
          )}
          {/* Fallback for tasks that don't match any status */}
          {!isPending && !isInProgress && !isPaused && !isCompleted && !isSkipped && (
            <Button 
              onClick={() => onTaskAction(task.id, 'start')}
              className="btn-action bg-[#2D8028] hover:bg-[#236020] text-white px-6 py-2 rounded-md font-medium"
              data-testid="button-start-task-fallback"
            >
              Start Task
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;