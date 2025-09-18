import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Info, Clock, CheckCircle, X, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface RecurringTaskChange {
  id: number;
  recurringTaskId: number;
  changedBy: number;
  changeType: string;
  changedFields: string[];
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
  affectedTaskCount: number;
  conflictCount: number;
  propagationStatus: string;
  changedAt: string;
}

interface TaskWithUpdate {
  id: number;
  title: string;
  status: string;
  recurringTaskId: number;
  modifiedFromTemplateAt: string;
  isModifiedAfterCreation: boolean;
}

interface UpdateStats {
  hasRecentChanges: boolean;
  totalChanges: number;
  affectedTasks: number;
  conflictCount: number;
  propagationStatus: string;
  lastUpdateDate?: string;
  templatedTasks: number;
}

export function RecurringTaskUpdateNotifications() {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedChange, setSelectedChange] = useState<RecurringTaskChange | null>(null);

  // Fetch recent changes
  const { data: recentChanges = [] } = useQuery<RecurringTaskChange[]>({
    queryKey: ['/api/recurring-tasks/changes'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch tasks with template updates available
  const { data: tasksWithUpdates = [] } = useQuery<TaskWithUpdate[]>({
    queryKey: ['/api/tasks/with-template-updates'],
    refetchInterval: 30000,
  });

  const hasUpdates = recentChanges.length > 0 || tasksWithUpdates.length > 0;
  const hasConflicts = tasksWithUpdates.some(task => task.status === 'in_progress');

  if (!hasUpdates) return null;

  return (
    <>
      <Card className="mb-4 p-4 border-l-4 border-l-blue-500" data-testid="update-notification-card">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {hasConflicts ? (
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            ) : (
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="font-medium text-sm">
                {hasConflicts ? 'Template Updates with Conflicts' : 'Template Updates Available'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {recentChanges.length > 0 && (
                  <span>{recentChanges.length} recent template changes. </span>
                )}
                {tasksWithUpdates.length > 0 && (
                  <span>{tasksWithUpdates.length} tasks have updates available.</span>
                )}
                {hasConflicts && (
                  <span className="text-amber-600"> Some updates require attention.</span>
                )}
              </p>
              
              {/* Recent Changes Summary */}
              {recentChanges.slice(0, 3).map((change) => (
                <div key={change.id} className="mt-2 p-2 bg-muted rounded-md text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Template #{change.recurringTaskId} updated</span>
                    <Badge variant={change.propagationStatus === 'completed' ? 'default' : 'secondary'}>
                      {change.propagationStatus}
                    </Badge>
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    {change.changedFields.join(', ')} • {change.affectedTaskCount} tasks affected
                    {change.conflictCount > 0 && (
                      <span className="text-amber-600"> • {change.conflictCount} conflicts</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(true)}
              data-testid="button-view-details"
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {/* TODO: Mark as seen */}}
              data-testid="button-dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Update Details</DialogTitle>
            <DialogDescription>
              Review recent template changes and tasks requiring attention
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Recent Changes Section */}
            {recentChanges.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Recent Template Changes</h4>
                <div className="space-y-3">
                  {recentChanges.map((change) => (
                    <ChangeDetails key={change.id} change={change} />
                  ))}
                </div>
              </div>
            )}

            {/* Tasks with Updates Section */}
            {tasksWithUpdates.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Tasks with Updates Available</h4>
                <div className="space-y-2">
                  {tasksWithUpdates.map((task) => (
                    <TaskUpdateDetails key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ChangeDetails({ change }: { change: RecurringTaskChange }) {
  const statusColor = {
    'completed': 'bg-green-100 text-green-800 border-green-200',
    'completed_with_conflicts': 'bg-amber-100 text-amber-800 border-amber-200',
    'pending': 'bg-blue-100 text-blue-800 border-blue-200',
    'error': 'bg-red-100 text-red-800 border-red-200'
  }[change.propagationStatus] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <Card className="p-4" data-testid={`change-${change.id}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-medium">Template #{change.recurringTaskId}</span>
          <span className="text-sm text-muted-foreground ml-2">
            {new Date(change.changedAt).toLocaleString()}
          </span>
        </div>
        <Badge className={statusColor}>
          {change.propagationStatus.replace('_', ' ')}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Changed fields:</span> {change.changedFields.join(', ')}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium text-muted-foreground">Tasks affected:</span>
            <span className="ml-1">{change.affectedTaskCount}</span>
          </div>
          {change.conflictCount > 0 && (
            <div>
              <span className="font-medium text-amber-600">Conflicts:</span>
              <span className="ml-1 text-amber-600">{change.conflictCount}</span>
            </div>
          )}
        </div>

        {/* Field Changes Details */}
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            View field changes
          </summary>
          <div className="mt-2 space-y-2 pl-4">
            {change.changedFields.map(field => (
              <div key={field} className="text-xs">
                <span className="font-mono bg-muted px-1 rounded">{field}</span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-red-600">Old:</span>
                    <span className="ml-1 font-mono text-xs">
                      {JSON.stringify(change.oldValues[field])}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-600">New:</span>
                    <span className="ml-1 font-mono text-xs">
                      {JSON.stringify(change.newValues[field])}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
    </Card>
  );
}

function TaskUpdateDetails({ task }: { task: TaskWithUpdate }) {
  const isConflict = task.status === 'in_progress' && task.isModifiedAfterCreation;

  return (
    <Card className={`p-3 ${isConflict ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`} 
          data-testid={`task-update-${task.id}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">{task.title}</span>
            <Badge variant={task.status === 'in_progress' ? 'default' : 'secondary'}>
              {task.status}
            </Badge>
            {isConflict && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Needs Review
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Template updated: {new Date(task.modifiedFromTemplateAt).toLocaleString()}
            {task.isModifiedAfterCreation && (
              <span className="text-amber-600"> • Modified after creation</span>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {isConflict ? (
            <Button size="sm" variant="outline" className="text-amber-600 border-amber-300"
                    data-testid={`button-review-${task.id}`}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              Review
            </Button>
          ) : (
            <Button size="sm" variant="outline" data-testid={`button-apply-update-${task.id}`}>
              <CheckCircle className="h-3 w-3 mr-1" />
              Apply Update
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default RecurringTaskUpdateNotifications;