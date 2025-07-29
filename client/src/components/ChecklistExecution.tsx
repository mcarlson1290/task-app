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

interface ChecklistStep {
  id: string;
  type: string;
  label: string;
  required: boolean;
  config: any;
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
  const isLastStep = currentStep === steps.length - 1;
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

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
    
    // Validate required fields
    if (step.required && !stepData[step.id]) {
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

      // Save progress
      onProgress({
        stepIndex: currentStep,
        stepData: stepData
      });

      if (isLastStep) {
        onComplete(stepData);
      } else {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
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
        // Auto-advance instruction steps - they're just informational
        React.useEffect(() => {
          const timer = setTimeout(() => {
            setStepData({ ...stepData, [step.id]: true });
            handleStepComplete();
          }, 1000); // Brief pause to read the instruction
          
          return () => clearTimeout(timer);
        }, []);
        
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-center text-blue-900">
                <FileText className="w-5 h-5 mr-2" />
                <span className="font-medium">{step.config.text || step.label}</span>
              </div>
              <p className="text-sm text-blue-700 mt-2">📖 Reading instruction...</p>
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
        const categoryItems = inventoryItems.filter(item => 
          item.category === step.config.category || !step.config.category
        );
        const selectedItem = categoryItems.find(item => item.id.toString() === stepData[`${step.id}_item`]);
        const quantity = stepData[`${step.id}_quantity`] || '';
        const hasQuantityError = selectedItem && quantity > (selectedItem.currentStock || 0);
        
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">Record Inventory Usage</Label>
              <p className="text-sm text-gray-600">{step.label}</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor={`${step.id}_item`}>What did you use?</Label>
                <Select
                  value={stepData[`${step.id}_item`] || ''}
                  onValueChange={(value) => setStepData({
                    ...stepData,
                    [`${step.id}_item`]: value,
                    [`${step.id}_quantity`]: '' // Reset quantity when item changes
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryItems.map(item => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{item.name}</span>
                          <Badge variant="outline">
                            Available: {item.currentStock || 0} {item.unit}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedItem && (
                <div>
                  <Label htmlFor={`${step.id}_quantity`}>How much did you use?</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id={`${step.id}_quantity`}
                      type="number"
                      value={quantity}
                      onChange={(e) => setStepData({
                        ...stepData,
                        [`${step.id}_quantity`]: parseFloat(e.target.value) || 0
                      })}
                      placeholder="Enter amount"
                      min="0"
                      max={selectedItem.currentStock || 999999}
                      className="w-32"
                    />
                    <Badge variant="outline">{selectedItem.unit}</Badge>
                  </div>
                  {hasQuantityError && (
                    <p className="text-sm text-red-600 mt-1">
                      ⚠️ This exceeds available inventory ({selectedItem.currentStock} {selectedItem.unit})!
                    </p>
                  )}
                </div>
              )}
            </div>

            {selectedItem && quantity && !hasQuantityError ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Using: {quantity} {selectedItem.unit} of {selectedItem.name}
                </div>
                <Button 
                  onClick={() => {
                    // Save inventory usage data
                    setStepData({
                      ...stepData,
                      [step.id]: {
                        itemId: selectedItem.id,
                        itemName: selectedItem.name,
                        quantity: parseFloat(quantity),
                        unit: selectedItem.unit,
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
              <p className="text-sm text-gray-500">
                {!selectedItem ? 'Select an item to continue' : 'Enter quantity to continue'}
              </p>
            )}
          </div>
        );

      case 'system-assignment':
        // Smart system filtering based on crop type and capacity
        const availableSystems = systems.filter(system => {
          const hasCapacity = (system.currentOccupancy || 0) < (system.capacity || 0);
          const matchesType = !step.config.systemType || system.category === step.config.systemType;
          return hasCapacity && matchesType;
        }).sort((a, b) => {
          // Sort by utilization (lower utilization first)
          const aUtil = (a.currentOccupancy || 0) / (a.capacity || 1);
          const bUtil = (b.currentOccupancy || 0) / (b.capacity || 1);
          return aUtil - bUtil;
        });
        
        const selectedSystemId = stepData[step.id];
        const selectedSystem = systems.find(s => s.id.toString() === selectedSystemId);
        
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">System Assignment</Label>
              <p className="text-sm text-gray-600">{step.label}</p>
            </div>
            
            {availableSystems.length === 0 ? (
              <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <div className="flex items-center text-yellow-800">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <span className="font-medium">No available systems found</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  All systems are at capacity or don't match the requirements
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Found {availableSystems.length} available system{availableSystems.length !== 1 ? 's' : ''}
                </div>
                
                <div className="space-y-2">
                  {availableSystems.map(system => {
                    const isSelected = selectedSystemId === system.id.toString();
                    const utilization = ((system.currentOccupancy || 0) / (system.capacity || 1)) * 100;
                    
                    return (
                      <div 
                        key={system.id}
                        className={`
                          p-3 rounded-lg border-2 cursor-pointer transition-all
                          ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'}
                        `}
                        onClick={() => setStepData({
                          ...stepData,
                          [step.id]: system.id.toString()
                        })}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium">{system.name}</h5>
                            <p className="text-sm text-gray-600">
                              Type: {system.category} | Available spots: {(system.capacity || 0) - (system.currentOccupancy || 0)}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={utilization < 70 ? 'outline' : utilization < 90 ? 'secondary' : 'destructive'}>
                              {Math.round(utilization)}% full
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedSystem ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Selected: {selectedSystem.name}
                </div>
                <Button 
                  onClick={() => {
                    // Save system assignment data
                    setStepData({
                      ...stepData,
                      [step.id]: {
                        systemId: selectedSystem.id,
                        systemName: selectedSystem.name,
                        systemType: selectedSystem.category,
                        assignedAt: new Date().toISOString()
                      }
                    });
                    handleStepComplete();
                  }}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isProcessing}
                >
                  Assign to System
                </Button>
              </div>
            ) : availableSystems.length > 0 ? (
              <p className="text-sm text-gray-500">Select a system to continue</p>
            ) : null}
          </div>
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
      'movement-trigger': ArrowRight
    };
    return icons[type as keyof typeof icons] || Circle;
  };

  // Calculate progress excluding instruction steps
  const calculateProgress = (steps: any[]) => {
    // Filter out instruction steps from progress calculation
    const actionableSteps = steps.filter(s => s.type !== 'instruction');
    
    if (actionableSteps.length === 0) return 100;
    
    const completedOrSkipped = actionableSteps.filter(s => s.completed || (s as any).skipped);
    return Math.round((completedOrSkipped.length / actionableSteps.length) * 100);
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
      
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        skipped: true,
        completed: false,
        skippedAt: new Date().toISOString()
      };
      
      setSteps(updatedSteps);
      
      // Move to next step if available
      const nextIndex = stepIndex + 1;
      if (nextIndex < steps.length) {
        setCurrentStep(nextIndex);
      } else {
        // All steps processed
        onComplete(stepData);
      }
    } catch (error) {
      console.error('Error skipping step:', error);
      setErrors({ ...errors, [steps[stepIndex]?.id]: 'Unable to skip step. Please try again.' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Task Checklist</h3>
          <Badge variant="outline">
            {steps.filter(s => s.completed || (s as any).skipped).length} of {steps.length} Steps
          </Badge>
        </div>
        <Progress value={calculateProgress(steps)} className="w-full" />
      </div>

      {/* Steps with Inline Inputs */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const StepIcon = getStepIcon(step.type);
          const isCompleted = step.completed;
          const isSkipped = (step as any).skipped;
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
                  
                  {/* Skip Button */}
                  <div className="flex justify-end mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStepSkip(index)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Skip Step
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

      {/* Complete Task when all steps done */}
      {currentStep >= steps.length && (
        <div className="text-center space-y-4 mt-6 pt-4 border-t">
          <div className="flex items-center justify-center text-green-600">
            <CheckCircle className="w-6 h-6 mr-2" />
            <span className="font-medium">All steps completed!</span>
          </div>
          <Button 
            onClick={onComplete} 
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isProcessing}
          >
            Complete Task
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChecklistExecution;