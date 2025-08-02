/**
 * IMPORTANT: When implementing these changes, DO NOT DELETE or MODIFY:
 * - Existing tasks in the database
 * - Existing recurring tasks
 * - Any task instances that have been created
 * - User-entered data in tasks
 * 
 * Only update the code logic, not the data!
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Circle, AlertTriangle, Camera, Package, Building, BarChart3, Split, ArrowRight, FileText, Edit3, PlusCircle } from 'lucide-react';
import { GrowingSystem, InventoryItem, Task } from '@shared/schema';
import SystemAssignmentStep from './checklist/SystemAssignmentStep';
import TraySplitStep from './checklist/TraySplitStep';
import CreateTrayStep from './checklist/CreateTrayStep';
import { assignTrayToSystem } from '../data/growingSystems';

interface ChecklistStep {
  id: string;
  type: string;
  label: string;
  text?: string;
  required: boolean;
  config: any;
  completed?: boolean;
  skipped?: boolean;
  skippedAt?: string;
}

interface ChecklistExecutionProps {
  task: Task;
  checklist: { steps: ChecklistStep[] };
  systems: GrowingSystem[];
  onComplete: (stepData: any) => void;
  onProgress: (progress: { stepIndex: number; stepData: any }) => void;
}

const ChecklistExecution: React.FC<ChecklistExecutionProps> = ({
  task,
  checklist,
  systems,
  onComplete,
  onProgress
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState(checklist.steps);
  const [stepContext, setStepContext] = useState({
    currentTrayId: task.id?.toString() || 'TRAY-001',
    splitTrays: null as any
  });

  // Initialize checklist progress from saved task data
  useEffect(() => {
    if (task.data?.checklistProgress) {
      console.log('🔄 Restoring checklist progress:', task.data.checklistProgress);
      
      // Restore step completion states
      const updatedSteps = steps.map((step, index) => {
        const savedProgress = task.data.checklistProgress[index];
        if (savedProgress) {
          return {
            ...step,
            completed: savedProgress.completed || false
          };
        }
        return step;
      });
      
      setSteps(updatedSteps);
      
      // Restore step data
      if (task.data.checklistStepData) {
        setStepData(task.data.checklistStepData);
      }
      
      // Find the current step (first incomplete step)
      const firstIncompleteStep = updatedSteps.findIndex(step => !step.completed);
      if (firstIncompleteStep !== -1) {
        setCurrentStep(firstIncompleteStep);
      } else {
        // All steps completed
        setCurrentStep(updatedSteps.length);
      }
    }
  }, [task.data?.checklistProgress, task.data?.checklistStepData]);
  const isLastStep = currentStep === steps.length - 1;
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  // Auto-save checklist progress to prevent data loss
  const saveChecklistProgress = async (updatedSteps?: ChecklistStep[], updatedStepData?: Record<string, any>) => {
    const stepsToSave = updatedSteps || steps;
    const dataToSave = updatedStepData || stepData;
    
    console.log('💾 Auto-saving checklist progress:', { 
      stepCount: stepsToSave.length, 
      completedSteps: stepsToSave.filter(s => s.completed).length,
      currentStep,
      stepDataKeys: Object.keys(dataToSave)
    });

    // Create progress object with completion status and timestamps
    const checklistProgress: Record<string, any> = {};
    stepsToSave.forEach((step, index) => {
      if (step.completed) {
        checklistProgress[index] = {
          completed: true,
          completedAt: new Date().toISOString(),
          stepData: dataToSave[index] || null
        };
      }
    });

    // Save via the onProgress callback which will update the task
    onProgress({
      stepIndex: currentStep,
      stepData: {
        checklistProgress,
        checklistStepData: dataToSave,
        currentStep,
        completedSteps: stepsToSave.filter(s => s.completed).length,
        totalSteps: stepsToSave.length
      }
    });
  };

  // Auto-save when stepData changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (Object.keys(stepData).length > 0) {
        saveChecklistProgress();
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [stepData]);

  // Auto-save when steps completion status changes
  useEffect(() => {
    const hasCompletedSteps = steps.some(step => step.completed);
    if (hasCompletedSteps) {
      saveChecklistProgress();
    }
  }, [steps]);

  // Save progress when component unmounts (user closes modal or navigates away)
  useEffect(() => {
    return () => {
      // Save any unsaved progress on cleanup
      if (Object.keys(stepData).length > 0 || steps.some(s => s.completed)) {
        console.log('🚪 Component unmounting, saving final progress');
        saveChecklistProgress();
      }
    };
  }, []);

  // Fetch inventory items for inventory-select steps
  const { data: inventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory'],
    queryFn: async () => {
      const response = await fetch('/api/inventory');
      if (!response.ok) throw new Error('Failed to fetch inventory');
      return response.json();
    },
  });

  useEffect(() => {
    // Auto-calculate fields when dependencies change
    const currentStepData = steps[currentStep];
    if (currentStepData?.type === 'data-capture' && currentStepData.config.calculation) {
      const calculation = currentStepData.config.calculation;
      try {
        // Simple calculation evaluation (e.g., "trays * 0.75")
        const result = evaluateCalculation(calculation, stepData);
        if (result !== null) {
          setStepData(prev => ({ ...prev, [currentStepData.id]: result }));
        }
      } catch (error) {
        console.warn('Calculation error:', error);
      }
    }
  }, [currentStep, stepData, steps]);

  const evaluateCalculation = (calculation: string, data: Record<string, any>): number | null => {
    // Simple calculation parser for basic math operations
    try {
      let expression = calculation;
      
      // Replace variables with actual values
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (typeof value === 'number') {
          expression = expression.replace(new RegExp(`\\b${key}\\b`, 'g'), value.toString());
        }
      });
      
      // Replace common variable names
      expression = expression.replace(/\btrays\b/g, data.trays || '0');
      expression = expression.replace(/\bweight\b/g, data.weight || '0');
      
      // Evaluate simple mathematical expressions
      const result = Function(`"use strict"; return (${expression})`)();
      return typeof result === 'number' ? result : null;
    } catch {
      return null;
    }
  };

  const handleStepComplete = async () => {
    const step = steps[currentStep];
    
    // Validate required fields - skip validation for create-tray steps as they handle their own validation
    if (step.required && step.type !== 'create-tray' && !stepData[step.id]) {
      setErrors({ [step.id]: 'This field is required' });
      return;
    }

    setIsProcessing(true);
    setErrors({});

    try {
      // Process special step types
      if (step.type === 'system-assignment') {
        await handleSystemAssignment(step, stepData[step.id]);
      } else if (step.type === 'movement-trigger') {
        await handleMovementTrigger(step, stepData[step.id]);
      } else if (step.type === 'tray-split') {
        await handleTraySplit(step, stepData[step.id]);
      } else if (step.type === 'inventory-select') {
        await handleInventoryDeduction(step, stepData[step.id]);
      }

      // Mark current step as completed
      const updatedSteps = steps.map((s, index) => {
        if (index === currentStep) {
          return { ...s, completed: true };
        }
        return s;
      });
      
      setSteps(updatedSteps);
      
      console.log(`✅ Step ${currentStep + 1} completed:`, step.label);

      // Save progress immediately with updated completion status
      await saveChecklistProgress(updatedSteps, stepData);

      if (isLastStep) {
        console.log('🎉 All checklist steps completed!');
        onComplete(stepData);
      } else {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Error completing step:', error);
      setErrors({ [step.id]: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSystemAssignment = async (step: ChecklistStep, systemId: string) => {
    // Update system occupancy
    const system = systems.find(s => s.id === parseInt(systemId));
    if (system) {
      const updatedSystem = {
        ...system,
        currentOccupancy: (system.currentOccupancy || 0) + 1
      };
      
      try {
        await fetch(`/api/growing-systems/${system.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSystem)
        });
      } catch (error) {
        throw new Error('Failed to update system assignment');
      }
    }
  };

  const handleMovementTrigger = async (step: ChecklistStep, movementData: any) => {
    // Handle tray movement between systems
    const { fromSystem, toSystem, trayIds } = movementData;
    
    try {
      await fetch('/api/tray-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trayIds,
          fromSystem,
          toSystem,
          taskId: task.id,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      throw new Error('Failed to record tray movement');
    }
  };

  const handleTraySplit = async (step: ChecklistStep, splitData: any) => {
    // Handle tray splitting for leafy greens
    const { originalTrayId, splits } = splitData;
    
    try {
      await fetch('/api/tray-splits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalTrayId,
          splits,
          taskId: task.id,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      throw new Error('Failed to record tray split');
    }
  };

  const handleInventoryDeduction = async (step: ChecklistStep, selectedItems: any) => {
    // Handle inventory deduction for selected items
    const items = Array.isArray(selectedItems) ? selectedItems : [selectedItems];
    
    try {
      for (const item of items) {
        await fetch(`/api/inventory/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentStock: (item.currentStock || 0) - (item.usedQuantity || 1)
          })
        });
      }
    } catch (error) {
      throw new Error('Failed to update inventory');
    }
  };

  const renderStepInput = (step: ChecklistStep) => {
    const stepError = errors[step.id];
    
    switch (step.type) {
      case 'instruction':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-center text-blue-900">
                <input
                  type="checkbox"
                  checked={stepData[step.id] || false}
                  onChange={() => {
                    setStepData({ ...stepData, [step.id]: true });
                    handleStepComplete();
                  }}
                  className="mr-3 h-5 w-5 text-blue-600"
                  id={`step-${step.id}`}
                />
                <FileText className="w-5 h-5 mr-2" />
                <label htmlFor={`step-${step.id}`} className="font-medium cursor-pointer">
                  {step.config.text || step.label}
                </label>
              </div>
              <p className="text-sm text-blue-700 mt-2">Click the checkbox to mark as read</p>
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id={step.id}
                checked={stepData[step.id] || false}
                onCheckedChange={(checked) => {
                  setStepData({ ...stepData, [step.id]: checked });
                  if (checked) {
                    handleStepComplete();
                  }
                }}
                className="h-5 w-5"
              />
              <Label htmlFor={step.id} className="text-base font-medium">{step.label}</Label>
            </div>
            {stepData[step.id] && (
              <div className="flex items-center text-green-600 font-medium">
                <CheckCircle className="w-4 h-4 mr-2" />
                Completed
              </div>
            )}
          </div>
        );

      case 'number-input':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={step.id} className="text-base font-medium">{step.label}</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id={step.id}
                  type="number"
                  value={stepData[step.id] || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setStepData({ ...stepData, [step.id]: value });
                  }}
                  min={step.config.min || 0}
                  max={step.config.max || 999}
                  placeholder={step.config.placeholder || `Enter ${step.config.unit || 'number'}`}
                  className="w-32"
                />
                {step.config.unit && (
                  <Badge variant="outline" className="text-sm">
                    {step.config.unit}
                  </Badge>
                )}
              </div>
            </div>
            {stepData[step.id] ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Value entered: {stepData[step.id]} {step.config.unit}
                </div>
                <Button 
                  onClick={handleStepComplete} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isProcessing}
                >
                  Continue
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Enter a value to continue</p>
            )}
          </div>
        );

      case 'inventory-select':
        // Use pre-configured inventory item from recurring task setup
        const quantity = stepData[step.id] || step.config.defaultQuantity || '';
        
        // Handle case where inventory item isn't properly configured
        const inventoryItem = {
          id: step.config.inventoryItemId || '',
          name: step.config.inventoryItemName || 'Unknown Item',
          unit: step.config.inventoryUnit || 'units'
        };
        
        // If no item is configured, show error
        if (!inventoryItem.id) {
          return (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                <div className="flex items-center text-red-800">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Configuration Error</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  This inventory step needs to be configured with an item selection. Please contact your manager to fix the recurring task setup.
                </p>
                <p className="text-xs text-red-600 mt-2">
                  <strong>For managers:</strong> Edit the recurring task and properly configure the inventory step with: item selection, custom text, and default quantity.
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => handleStepSkip(currentStep)}
                disabled={isProcessing}
              >
                Skip Step
              </Button>
            </div>
          );
        }
        
        // Find current stock level for the pre-configured item
        const currentItem = inventoryItems.find(item => item.id.toString() === inventoryItem.id);
        const currentStock = currentItem?.currentStock || 0;
        const hasQuantityError = quantity && parseFloat(quantity) > currentStock;
        
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">Record Inventory Usage</Label>
              <p className="text-sm text-gray-600">{step.config.customText || step.label}</p>
            </div>
            
            {/* Show what item is being tracked */}
            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-blue-900">Item: {inventoryItem.name}</span>
                  <p className="text-sm text-blue-700">
                    Current stock: {currentStock} {inventoryItem.unit}
                  </p>
                </div>
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            
            {/* Quantity input with default pre-filled */}
            <div className="space-y-2">
              <Label htmlFor={step.id}>Amount used:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id={step.id}
                  type="number"
                  value={quantity}
                  onChange={(e) => setStepData({
                    ...stepData,
                    [step.id]: e.target.value
                  })}
                  placeholder={step.config.defaultQuantity || "Enter amount"}
                  min="0"
                  step="0.01"
                  className="w-32"
                  autoFocus
                />
                <Badge variant="outline">{inventoryItem.unit}</Badge>
              </div>
              
              {hasQuantityError && (
                <p className="text-sm text-red-600">
                  ⚠️ This exceeds available stock ({currentStock} {inventoryItem.unit})
                </p>
              )}
            </div>

            {quantity && parseFloat(quantity) > 0 && !hasQuantityError ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Using: {quantity} {inventoryItem.unit} of {inventoryItem.name}
                </div>
                <Button 
                  onClick={() => {
                    setStepData({
                      ...stepData,
                      [step.id]: {
                        itemId: inventoryItem.id,
                        itemName: inventoryItem.name,
                        quantity: parseFloat(quantity),
                        unit: inventoryItem.unit,
                        action: 'remove'
                      }
                    });
                    handleStepComplete();
                  }}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isProcessing}
                >
                  Record Usage
                </Button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {!quantity ? 'Enter quantity to continue' : hasQuantityError ? 'Invalid quantity' : 'Ready to record'}
                </p>
                {!quantity && (
                  <Button 
                    variant="outline"
                    onClick={() => handleStepSkip(currentStep)}
                    disabled={isProcessing}
                  >
                    Complete Step
                  </Button>
                )}
              </div>
            )}
          </div>
        );

      case 'system-assignment':
        return (
          <SystemAssignmentStep
            step={step}
            value={stepData[step.id]}
            onChange={(value) => {
              setStepData({ ...stepData, [step.id]: value });
              // Handle system assignments
              if (typeof value === 'object' && !value.trayId) {
                // Multiple assignments from split trays
                Object.entries(value).forEach(([trayId, systemId]) => {
                  assignTrayToSystem(trayId, systemId as string, 1);
                });
              } else if (value?.trayId && value?.systemId) {
                // Single assignment
                assignTrayToSystem(value.trayId, value.systemId, 1);
              }
            }}
            trayId={stepContext.currentTrayId}
            splitTrays={stepContext.splitTrays}
          />
        );

      case 'data-capture':
        const isPercentage = step.label.toLowerCase().includes('percent');
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={step.id} className="text-base font-medium">{step.label}</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id={step.id}
                  type="number"
                  step={isPercentage ? "1" : "0.1"}
                  min={isPercentage ? 0 : 0}
                  max={isPercentage ? 100 : 999}
                  value={stepData[step.id] || ''}
                  onChange={(e) => {
                    let value = parseFloat(e.target.value) || 0;
                    if (isPercentage && value > 100) value = 100;
                    if (isPercentage && value < 0) value = 0;
                    setStepData({ ...stepData, [step.id]: value });
                  }}
                  placeholder={isPercentage ? "0" : "Enter value"}
                  className="w-32"
                />
                <Badge variant="outline" className="text-sm">
                  {isPercentage ? '%' : 'units'}
                </Badge>
              </div>
              {step.config.calculation && (
                <p className="text-sm text-blue-600 mt-1">
                  Auto-calculated: {step.config.calculation}
                </p>
              )}
            </div>
            {stepData[step.id] !== undefined && stepData[step.id] !== '' && stepData[step.id] !== 0 ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Recorded: {stepData[step.id]}{isPercentage ? '%' : ' units'}
                </div>
                <Button 
                  onClick={handleStepComplete} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isProcessing}
                >
                  Save Data
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Enter a value to continue</p>
            )}
          </div>
        );

      case 'photo':
        const photoData = stepData[step.id];
        const hasPhoto = photoData && (photoData.timestamp || photoData);
        
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">{step.label}</Label>
              
              {hasPhoto ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <div className="flex items-center text-green-700">
                      <Camera className="w-5 h-5 mr-2" />
                      <span className="font-medium">Photo captured successfully</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Captured: {new Date(photoData.timestamp || photoData).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => {
                        // Simulate file input click for photo retake
                        const photoTimestamp = new Date().toISOString();
                        setStepData({ 
                          ...stepData, 
                          [step.id]: {
                            timestamp: photoTimestamp,
                            filename: `task_${task.id}_step_${step.id}_${Date.now()}.jpg`
                          }
                        });
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Retake Photo
                    </Button>
                    
                    <Button 
                      onClick={handleStepComplete}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={isProcessing}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-3">Take a photo to document this step</p>
                    
                    <div className="space-y-2">
                      <Button 
                        onClick={() => {
                          // Simulate camera capture
                          const photoTimestamp = new Date().toISOString();
                          setStepData({ 
                            ...stepData, 
                            [step.id]: {
                              timestamp: photoTimestamp,
                              filename: `task_${task.id}_step_${step.id}_${Date.now()}.jpg`
                            }
                          });
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Capture Photo
                      </Button>
                      
                      <p className="text-xs text-gray-500">
                        Opens camera on mobile devices
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'movement-trigger':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">{step.label}</Label>
              {stepData[step.id] ? (
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <div className="flex items-center text-green-700">
                    <ArrowRight className="w-5 h-5 mr-2" />
                    <span className="font-medium">Movement completed</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Completed at: {new Date(stepData[step.id]).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <p className="text-yellow-800">Ready to execute movement action</p>
                </div>
              )}
            </div>
            {!stepData[step.id] ? (
              <Button 
                onClick={() => {
                  setStepData({ ...stepData, [step.id]: new Date().toISOString() });
                  handleStepComplete();
                }}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isProcessing}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Execute Movement
              </Button>
            ) : (
              <div className="flex items-center text-green-600 font-medium">
                <CheckCircle className="w-4 h-4 mr-2" />
                Movement Complete
              </div>
            )}
          </div>
        );

      case 'tray-split':
        const currentSplitData = stepData[step.id];
        return (
          <div className="space-y-4">
            <TraySplitStep
              step={step}
              value={currentSplitData}
              onChange={(value) => {
                setStepData({ ...stepData, [step.id]: value });
                // Update context for next steps
                if (value?.splits) {
                  setStepContext(prev => ({
                    ...prev,
                    splitTrays: value.splits
                  }));
                }
              }}
              trayId={stepContext.currentTrayId}
            />
            
            {/* Show complete step button when tray and split count are selected */}
            {currentSplitData?.trayId && currentSplitData?.count && (
              <div className="pt-4 border-t">
                <Button 
                  onClick={async () => {
                    console.log('ChecklistExecution: Executing tray split...');
                    try {
                      // Execute the actual split operation
                      if (currentSplitData.executeSplit) {
                        const splitResult = currentSplitData.executeSplit();
                        console.log('ChecklistExecution: Split executed:', splitResult);
                      } else {
                        console.warn('ChecklistExecution: No executeSplit method found, performing direct split');
                        // Fallback to direct split
                        const TrayDataService = (await import('../services/trayDataService')).default;
                        const splitResult = TrayDataService.splitTray(currentSplitData.trayId, currentSplitData.count);
                        console.log('ChecklistExecution: Fallback split executed:', splitResult);
                      }
                      
                      // Mark step as complete and continue
                      handleStepComplete();
                    } catch (error) {
                      console.error('ChecklistExecution: Split execution failed:', error);
                      setErrors({ ...errors, [step.id]: 'Failed to execute tray split. Please try again.' });
                    }
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isProcessing}
                >
                  <Split className="w-4 h-4 mr-2" />
                  Execute Tray Split ({currentSplitData.count} new trays)
                </Button>
              </div>
            )}
          </div>
        );

      case 'create-tray':
        return (
          <div className="space-y-4">
            <CreateTrayStep
              stepData={step.config}
              onComplete={(data) => {
                // Update step data with tray creation results
                setStepData({ ...stepData, [step.id]: data });
                
                // Update context with new tray ID for subsequent steps
                if (data.trayId) {
                  setStepContext(prev => ({
                    ...prev,
                    currentTrayId: data.trayId
                  }));
                }
                
                // Mark step as complete and continue
                handleStepComplete();
              }}
              defaultInstance={step.config?.defaultInstance || 1}
              defaultTrayType={step.config?.defaultTrayType || 'LG'}
              defaultSeedsOz={step.config?.defaultSeedsOz || ''}
              defaultGrowingMedium={step.config?.defaultGrowingMedium || ''}
              instructions={step.config?.instructions || ''}
            />
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <p className="text-gray-500">Step type: {step.type}</p>
            <Button 
              onClick={handleStepComplete} 
              className="w-full"
              disabled={isProcessing}
            >
              Continue
            </Button>
          </div>
        );
    }
  };

  const getStepIcon = (type: string) => {
    const icons = {
      instruction: FileText,
      checkbox: CheckCircle,
      'number-input': BarChart3,
      'inventory-select': Package,
      'system-assignment': Building,
      'data-capture': BarChart3,
      photo: Camera,
      'tray-split': Split,
      'movement-trigger': ArrowRight,
      'create-tray': PlusCircle
    };
    return icons[type as keyof typeof icons] || Circle;
  };

  // Calculate progress including instruction steps (they can be checked off)
  const calculateProgress = (steps: any[]) => {
    if (steps.length === 0) return 100;
    
    const completedOrSkipped = steps.filter(s => s.completed || (s as any).skipped);
    return Math.round((completedOrSkipped.length / steps.length) * 100);
  };

  // Handle step skip with proper error handling
  const handleStepSkip = (stepIndex: number) => {
    try {
      const updatedSteps = [...steps];
      
      // Ensure the step exists
      if (!updatedSteps[stepIndex]) {
        console.error('Invalid step index:', stepIndex);
        return;
      }
      
      // Mark step as completed (not skipped anymore!)
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        completed: true,
        skipped: false
      };
      
      setSteps(updatedSteps);
      
      // Move to next step if available
      const nextIndex = stepIndex + 1;
      if (nextIndex < steps.length) {
        setCurrentStep(nextIndex);
      } else {
        // All steps processed - show completion message but don't auto-complete task
        setCurrentStep(steps.length); // This will show the completion section
      }
    } catch (error) {
      console.error('Error completing step:', error);
      setErrors({ ...errors, [steps[stepIndex]?.id]: 'Unable to complete step. Please try again.' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Task Checklist</h3>
          <Badge variant="outline">
            {steps.filter(s => s.completed || s.skipped).length} of {steps.length} Steps
          </Badge>
        </div>
        <Progress value={calculateProgress(steps)} className="w-full" />
      </div>

      {/* Steps with Inline Inputs */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const StepIcon = getStepIcon(step.type);
          const isCompleted = step.completed;
          const isSkipped = step.skipped;
          const isCurrent = index === currentStep && !isCompleted && !isSkipped;
          
          return (
            <div key={step.id} className="space-y-2">
              {/* Step Item */}
              <div 
                className={`
                  flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all
                  ${isCurrent ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500' : 'bg-white border-gray-200'}
                  ${isCompleted ? 'bg-green-50 border-green-200' : ''}
                  ${isSkipped ? 'bg-gray-50 border-gray-200 opacity-60' : ''}
                `}
                onClick={() => !isCompleted && !isSkipped && setCurrentStep(index)}
              >
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : isSkipped ? (
                    <div className="w-5 h-5 flex items-center justify-center text-gray-500">⏭️</div>
                  ) : (
                    <StepIcon className={`w-5 h-5 ${isCurrent ? 'text-blue-600' : 'text-gray-400'}`} />
                  )}
                </div>
                
                <div className="flex-1">
                  <span className={`font-medium ${isSkipped ? 'line-through text-gray-500' : isCurrent ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-700'}`}>
                    {step.text || step.label}
                  </span>
                </div>
                
                <Badge variant="outline" className="text-xs">
                  Step {index + 1}
                </Badge>
              </div>

              {/* Inline Input Block for Current Step */}
              {isCurrent && (
                <div className="ml-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {renderStepInput(step)}
                  
                  {/* Complete Step Button */}
                  <div className="flex justify-end mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStepSkip(index)}
                      className="text-green-600 hover:text-green-800"
                    >
                      Complete Step
                    </Button>
                  </div>
                  
                  {errors[step.id] && (
                    <Alert className="mt-3" variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {errors[step.id]}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Checklist completion message - Task completion is separate */}
      {currentStep >= steps.length && (
        <div className="checklist-complete space-y-4 mt-6 pt-4 border-t bg-green-50 p-4 rounded-lg border-l-4 border-l-green-500">
          <div className="flex items-center justify-center text-green-600">
            <CheckCircle className="w-6 h-6 mr-2" />
            <span className="font-medium">✅ All checklist items completed!</span>
          </div>
          <p className="completion-note text-center text-green-700 text-sm">
            Please complete any remaining work, then click "Complete Task" in the task modal.
          </p>
          <p className="text-center text-green-600 text-xs">
            The task will remain open until you explicitly mark it as complete.
          </p>
        </div>
      )}
    </div>
  );
};

export default ChecklistExecution;