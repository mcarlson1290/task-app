import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Clock, Users, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface UpdatePropagationWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (strategy: 'update_all' | 'new_only') => void;
  changedFields: Array<{ field: string; oldValue: any; newValue: any; requiresNotification: boolean }>;
  affectedInstanceCount: number;
  conflictCount: number;
  taskTitle: string;
  isProcessing: boolean;
  processingProgress?: {
    current: number;
    total: number;
    stage: string;
  };
}

const UpdatePropagationWarningDialog: React.FC<UpdatePropagationWarningDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  changedFields,
  affectedInstanceCount,
  conflictCount,
  taskTitle,
  isProcessing,
  processingProgress
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<'update_all' | 'new_only'>('update_all');

  // Calculate progress percentage
  const progressPercentage = processingProgress
    ? Math.round((processingProgress.current / processingProgress.total) * 100)
    : 0;

  // Categorize changes for better display
  const criticalChanges = changedFields.filter(f => ['title', 'checklistTemplate', 'priority'].includes(f.field));
  const minorChanges = changedFields.filter(f => !['title', 'checklistTemplate', 'priority'].includes(f.field));

  if (!isOpen) return null;

  // Processing/Progress View
  if (isProcessing && processingProgress) {
    return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 animate-spin text-blue-600" />
              Updating Task Instances
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">
                  {processingProgress.stage}
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <div className="text-xs text-gray-500 mt-1">
                  {processingProgress.current} of {processingProgress.total} tasks ({progressPercentage}%)
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  📋 Updating instances of "{taskTitle}"
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Please wait while we apply changes to all affected tasks...
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Completion View
  if (isProcessing && !processingProgress) {
    return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Update Complete
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-sm text-green-800">
                  ✅ Successfully updated {affectedInstanceCount} task instances
                </p>
                {conflictCount > 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ {conflictCount} instances had conflicts (notifications sent to assignees)
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={onClose} data-testid="button-close-completion">
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Warning/Confirmation View
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Update Recurring Task Template
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-md">
              <p className="text-sm text-orange-800 font-medium">
                This change will affect {affectedInstanceCount} future instances of "{taskTitle}"
              </p>
              {conflictCount > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ {conflictCount} instances are in-progress and may have conflicts
                </p>
              )}
            </div>

            {/* Changes Summary */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Changes being made:</h4>
              
              {criticalChanges.length > 0 && (
                <div className="bg-red-50 p-3 rounded-md">
                  <p className="text-xs font-medium text-red-700 mb-2">Critical Changes:</p>
                  {criticalChanges.map((change, index) => (
                    <div key={index} className="text-xs text-red-600">
                      • <span className="font-medium">{change.field}:</span> "{String(change.oldValue)}" → "{String(change.newValue)}"
                    </div>
                  ))}
                </div>
              )}

              {minorChanges.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-xs font-medium text-blue-700 mb-2">Other Changes:</p>
                  {minorChanges.map((change, index) => (
                    <div key={index} className="text-xs text-blue-600">
                      • <span className="font-medium">{change.field}:</span> "{String(change.oldValue)}" → "{String(change.newValue)}"
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Strategy Selection */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">What should we do?</h4>
              
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="strategy"
                    value="update_all"
                    checked={selectedStrategy === 'update_all'}
                    onChange={(e) => setSelectedStrategy(e.target.value as 'update_all')}
                    className="mt-1"
                    data-testid="radio-update-all"
                  />
                  <div>
                    <div className="font-medium text-sm text-green-700">
                      Update all future instances (Recommended)
                    </div>
                    <div className="text-xs text-gray-600">
                      Apply changes to all {affectedInstanceCount} future tasks. Completed tasks won't be affected.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="strategy"
                    value="new_only"
                    checked={selectedStrategy === 'new_only'}
                    onChange={(e) => setSelectedStrategy(e.target.value as 'new_only')}
                    className="mt-1"
                    data-testid="radio-new-only"
                  />
                  <div>
                    <div className="font-medium text-sm text-blue-700">
                      Only apply to newly created tasks
                    </div>
                    <div className="text-xs text-gray-600">
                      Keep existing instances unchanged. Only future instances will use the new template.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md text-xs text-gray-600">
              <p><strong>Note:</strong> Completed tasks will never be affected. In-progress tasks will preserve user data and show update notifications.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} data-testid="button-cancel-update">
            Cancel Changes
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(selectedStrategy)}
            className="bg-orange-600 hover:bg-orange-700"
            data-testid="button-confirm-update"
          >
            <Users className="h-4 w-4 mr-2" />
            Update {selectedStrategy === 'update_all' ? affectedInstanceCount : 'New'} Tasks
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UpdatePropagationWarningDialog;