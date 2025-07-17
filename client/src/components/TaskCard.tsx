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
  onStart: (task: Task) => void;
  onCollaborate: (task: Task) => void;
  onViewDetails: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStart, onCollaborate, onViewDetails }) => {
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
      pending: "bg-blue-500 text-white",
      in_progress: "bg-amber-500 text-white",
      completed: "bg-green-500 text-white",
      approved: "bg-green-600 text-white"
    };
    return colors[status] || "bg-gray-500 text-white";
  };

  const getStatusLabel = (status: TaskStatus): string => {
    const labels = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      approved: "Approved"
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: string): string => {
    const colors = {
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

  const checkIfOverdue = (dueDate: Date): boolean => {
    const now = new Date();
    const due = new Date(dueDate);
    due.setHours(20, 27, 0, 0); // 8:27 PM
    return now > due;
  };

  const formatDueDate = (dueDate: Date): string => {
    return format(dueDate, 'MMM d, yyyy');
  };

  const isCompleted = task.status === 'completed' || task.status === 'approved';
  const isInProgress = task.status === 'in_progress';
  const isPending = task.status === 'pending';
  const isOverdue = task.dueDate ? checkIfOverdue(new Date(task.dueDate)) : false;

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
      isInProgress ? 'border-l-4 border-l-[#2D8028]' : ''
    } ${isCompleted ? 'opacity-75' : ''} ${
      isOverdue ? 'bg-red-50 border-l-4 border-l-red-500' : ''
    }`}>
      <CardContent className="p-6">
        {/* Status and Priority Badges - Properly positioned */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          {/* Status Badge */}
          <div className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(task.status as TaskStatus)}`}>
            {getStatusLabel(task.status as TaskStatus)}
          </div>
          {/* Priority Badge */}
          <div className={`px-2 py-1 rounded text-xs font-semibold text-white ${getPriorityColor(task.priority)}`}>
            {task.priority.toUpperCase()}
          </div>
        </div>

        <div className="flex items-start mb-4 pr-20">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getTaskEmoji(task.type as TaskType)}</span>
            <div>
              <h3 className="font-semibold text-[#203B17]">{task.title}</h3>
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
              <div className={`flex items-center text-sm ${
                isOverdue ? 'text-red-600' : 'text-gray-600'
              }`}>
                <Calendar className="h-4 w-4 mr-1" />
                <span className={isOverdue ? 'font-semibold' : ''}>
                  Due: {formatDueDate(new Date(task.dueDate))}
                </span>
              </div>
              {isOverdue && (
                <div className="flex items-center text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span className="font-semibold">
                    OVERDUE by {Math.abs(differenceInDays(new Date(), new Date(task.dueDate)))} days
                  </span>
                </div>
              )}
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
            {isInProgress ? (
              <Button
                onClick={() => onCollaborate(task)}
                className="bg-[#2D8028] hover:bg-[#203B17] text-white"
              >
                🤝 Collaborate
              </Button>
            ) : task.status === 'pending' ? (
              <Button
                onClick={() => onStart(task)}
                className="bg-[#2D8028] hover:bg-[#203B17] text-white"
              >
                Start Task
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => onViewDetails(task)}
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
