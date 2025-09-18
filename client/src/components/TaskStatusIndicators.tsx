import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sync, LinkOff, AlertCircle, Clock, CheckCircle2, Sparkles } from "lucide-react";

interface TaskStatusIndicatorsProps {
  task: {
    id: number;
    title: string;
    status: string;
    isRecurring?: boolean;
    recurringTaskId?: number | null;
    templateVersion?: number;
    isModifiedAfterCreation?: boolean;
    modifiedFromTemplateAt?: string | null;
    isFromDeletedRecurring?: boolean;
    deletedRecurringTaskTitle?: string;
  };
  recurringTasks?: Array<{
    id: number;
    title: string;
    versionNumber?: number;
  }>;
}

const TaskStatusIndicators: React.FC<TaskStatusIndicatorsProps> = ({ task, recurringTasks = [] }) => {
  const getTemplateInfo = () => {
    if (!task.recurringTaskId) return null;
    return recurringTasks.find(rt => rt.id === task.recurringTaskId);
  };

  const templateInfo = getTemplateInfo();
  const isOutdated = templateInfo && task.templateVersion && 
    templateInfo.versionNumber && task.templateVersion < templateInfo.versionNumber;

  return (
    <div className="flex items-center gap-1">
      {/* Recurring Task Link Indicator */}
      {task.isRecurring && task.recurringTaskId && !task.isFromDeletedRecurring && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-xs px-1 py-0 h-5 bg-blue-50 border-blue-200">
                <Sync className="h-3 w-3 text-blue-600" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                Linked to recurring template
                {templateInfo && (
                  <>
                    <br />
                    <span className="font-medium">"{templateInfo.title}"</span>
                    {task.templateVersion && (
                      <>
                        <br />
                        Template v{templateInfo.versionNumber || 1} (Task v{task.templateVersion})
                      </>
                    )}
                  </>
                )}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Broken Link Indicator (Template Deleted) */}
      {task.isFromDeletedRecurring && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-xs px-1 py-0 h-5 bg-gray-50 border-gray-300">
                <LinkOff className="h-3 w-3 text-gray-500" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                Template was deleted
                <br />
                <span className="font-medium">"{task.deletedRecurringTaskTitle}"</span>
                <br />
                This task will continue as standalone
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Outdated Template Version */}
      {isOutdated && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-xs px-1 py-0 h-5 bg-yellow-50 border-yellow-300">
                <AlertCircle className="h-3 w-3 text-yellow-600" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                Template has been updated
                <br />
                Task version: {task.templateVersion}
                <br />
                Latest version: {templateInfo?.versionNumber}
                <br />
                <span className="text-yellow-700">Consider updating this task</span>
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Modified After Creation */}
      {task.isModifiedAfterCreation && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-xs px-1 py-0 h-5 bg-purple-50 border-purple-200">
                <Sparkles className="h-3 w-3 text-purple-600" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                Task was manually modified
                <br />
                {task.modifiedFromTemplateAt && (
                  <>
                    Last updated: {new Date(task.modifiedFromTemplateAt).toLocaleDateString()}
                    <br />
                  </>
                )}
                <span className="text-purple-700">May differ from template</span>
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Recently Updated Badge */}
      {task.modifiedFromTemplateAt && (
        (() => {
          const modifiedDate = new Date(task.modifiedFromTemplateAt);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - modifiedDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 3) {
            return (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge className="text-xs px-2 py-0 h-5 bg-green-600 hover:bg-green-700">
                      Updated
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      Recently updated from template
                      <br />
                      {daysDiff === 0 ? 'Today' : `${daysDiff} day${daysDiff > 1 ? 's' : ''} ago`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }
          return null;
        })()
      )}

      {/* Task Status Indicators */}
      {task.status === 'in_progress' && (
        <Badge variant="outline" className="text-xs px-1 py-0 h-5 bg-blue-50 border-blue-200">
          <Clock className="h-3 w-3 text-blue-600 mr-1" />
          In Progress
        </Badge>
      )}

      {task.status === 'completed' && (
        <Badge variant="outline" className="text-xs px-1 py-0 h-5 bg-green-50 border-green-200">
          <CheckCircle2 className="h-3 w-3 text-green-600 mr-1" />
          Complete
        </Badge>
      )}
    </div>
  );
};

export default TaskStatusIndicators;