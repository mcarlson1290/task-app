import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, X, Clock, FileText, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface TaskWithConflict {
  id: number;
  title: string;
  description?: string;
  status: string;
  recurringTaskId: number;
  modifiedFromTemplateAt: string;
  isModifiedAfterCreation: boolean;
  checklist?: any[];
  assignTo?: string;
  progress?: number;
  startedAt?: string;
}

interface ConflictResolutionProps {
  task: TaskWithConflict;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateChanges?: {
    changedFields: string[];
    oldValues: Record<string, any>;
    newValues: Record<string, any>;
  };
}

type ResolutionAction = 'keep_current' | 'apply_template' | 'manual_merge' | 'defer';

export function ConflictResolutionDialog({ 
  task, 
  open, 
  onOpenChange,
  templateChanges 
}: ConflictResolutionProps) {
  const [selectedAction, setSelectedAction] = useState<ResolutionAction>('keep_current');
  const [userNotes, setUserNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Early return if no task provided
  if (!task) {
    return null;
  }

  const resolutionMutation = useMutation({
    mutationFn: async (data: { action: ResolutionAction; notes?: string }) => {
      return apiRequest(`/api/tasks/${task.id}/resolve-conflict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: data.action,
          notes: data.notes,
          templateChanges
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Conflict Resolved",
        description: "Template update conflict has been resolved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/with-template-updates'] });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve conflict. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleResolve = () => {
    resolutionMutation.mutate({
      action: selectedAction,
      notes: userNotes
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span>Template Update Conflict</span>
          </DialogTitle>
          <DialogDescription>
            This task has been modified and conflicts with recent template changes. 
            Choose how to resolve this conflict.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Information */}
          <Card className="p-4 border-l-4 border-l-amber-500">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium">{task.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Task #{task.id} • Status: {task.status}
                </p>
              </div>
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                In Progress
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Started: {task.startedAt ? new Date(task.startedAt).toLocaleString() : 'Recently'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Progress: {task.progress || 0}%</span>
              </div>
            </div>
          </Card>

          {/* Template Changes Summary */}
          {templateChanges && (
            <Card className="p-4">
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Template Changes</span>
              </h4>
              <div className="space-y-3">
                {templateChanges.changedFields.map(field => (
                  <div key={field} className="border rounded-lg p-3">
                    <div className="font-medium text-sm mb-2">
                      Field: <code className="bg-muted px-1 rounded">{field}</code>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-red-600 font-medium">Current Value:</span>
                        <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs">
                          {JSON.stringify(templateChanges.oldValues[field], null, 2)}
                        </div>
                      </div>
                      <div>
                        <span className="text-green-600 font-medium">Template Value:</span>
                        <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-xs">
                          {JSON.stringify(templateChanges.newValues[field], null, 2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Separator />

          {/* Resolution Options */}
          <div>
            <h4 className="font-medium mb-4">Choose Resolution Action</h4>
            <RadioGroup value={selectedAction} onValueChange={(value) => setSelectedAction(value as ResolutionAction)}>
              <div className="space-y-4">
                
                {/* Keep Current */}
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="keep_current" id="keep_current" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="keep_current" className="font-medium cursor-pointer">
                      Keep Current Task Version
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Preserve all current task modifications and ignore template changes. 
                      The task will continue with its current configuration.
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-600">Preserves user work</span>
                    </div>
                  </div>
                </div>

                {/* Apply Template */}
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="apply_template" id="apply_template" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="apply_template" className="font-medium cursor-pointer">
                      Apply Template Changes
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Update the task to match the new template. Your current progress will be preserved, 
                      but task configuration will be updated.
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-xs text-amber-600">May affect task configuration</span>
                    </div>
                  </div>
                </div>

                {/* Manual Merge */}
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="manual_merge" id="manual_merge" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="manual_merge" className="font-medium cursor-pointer">
                      Manual Review Required
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Flag this task for manual review by a manager. The conflict will be 
                      escalated for manual resolution.
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-blue-600">Requires manager attention</span>
                    </div>
                  </div>
                </div>

                {/* Defer */}
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="defer" id="defer" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="defer" className="font-medium cursor-pointer">
                      Defer Decision
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Continue with current task and postpone the template update decision 
                      until task completion.
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-xs text-gray-600">Resolve later</span>
                    </div>
                  </div>
                </div>

              </div>
            </RadioGroup>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes" className="font-medium">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about your decision..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              className="mt-2"
              data-testid="textarea-resolution-notes"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
            Cancel
          </Button>
          <Button 
            onClick={handleResolve} 
            disabled={resolutionMutation.isPending}
            data-testid="button-resolve-conflict"
          >
            {resolutionMutation.isPending ? 'Resolving...' : 'Resolve Conflict'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export removed - using named export above