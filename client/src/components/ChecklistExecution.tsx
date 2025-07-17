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
import { CheckCircle, Circle, AlertTriangle, Camera, Package, Building, BarChart3, Split, ArrowRight, FileText } from 'lucide-react';
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

  const steps = checklist.steps;
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
        currentOccupancy: system.currentOccupancy + 1
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
            quantity: item.currentQuantity - (item.usedQuantity || 1)
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
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-900">{step.config.text || step.label}</p>
            </div>
            <Button 
              onClick={handleStepComplete} 
              className="w-full"
              disabled={isProcessing}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Complete
            </Button>
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={step.id}
                checked={stepData[step.id] || false}
                onCheckedChange={(checked) => setStepData({
                  ...stepData,
                  [step.id]: checked
                })}
              />
              <Label htmlFor={step.id} className="text-base">{step.label}</Label>
            </div>
            <Button 
              onClick={handleStepComplete} 
              className="w-full"
              disabled={!stepData[step.id] || isProcessing}
            >
              Continue
            </Button>
          </div>
        );

      case 'number-input':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={step.id}>{step.label}</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id={step.id}
                  type="number"
                  value={stepData[step.id] || ''}
                  onChange={(e) => setStepData({
                    ...stepData,
                    [step.id]: parseInt(e.target.value) || 0
                  })}
                  min={step.config.min}
                  max={step.config.max}
                  placeholder={`Enter ${step.config.unit || 'value'}`}
                />
                {step.config.unit && (
                  <span className="text-sm text-gray-500">{step.config.unit}</span>
                )}
              </div>
            </div>
            <Button 
              onClick={handleStepComplete} 
              className="w-full"
              disabled={isProcessing}
            >
              Continue
            </Button>
          </div>
        );

      case 'inventory-select':
        const categoryItems = inventoryItems.filter(item => 
          item.category === step.config.category
        );
        
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={step.id}>{step.label}</Label>
              <Select
                value={stepData[step.id] || ''}
                onValueChange={(value) => setStepData({
                  ...stepData,
                  [step.id]: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${step.config.category}`} />
                </SelectTrigger>
                <SelectContent>
                  {categoryItems.map(item => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{item.name}</span>
                        <Badge variant="outline">{item.currentQuantity} {item.unit}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleStepComplete} 
              className="w-full"
              disabled={isProcessing}
            >
              Continue
            </Button>
          </div>
        );

      case 'system-assignment':
        const filteredSystems = step.config.systemType 
          ? systems.filter(s => s.category === step.config.systemType)
          : systems;
        
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={step.id}>{step.label}</Label>
              <Select
                value={stepData[step.id] || ''}
                onValueChange={(value) => setStepData({
                  ...stepData,
                  [step.id]: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select system" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSystems.map(system => (
                    <SelectItem key={system.id} value={system.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{system.name}</span>
                        <Badge variant="outline">
                          {system.currentOccupancy}/{system.capacity}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleStepComplete} 
              className="w-full"
              disabled={isProcessing}
            >
              Assign System
            </Button>
          </div>
        );

      case 'data-capture':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={step.id}>{step.label}</Label>
              {step.config.dataType === 'number' ? (
                <Input
                  id={step.id}
                  type="number"
                  value={stepData[step.id] || ''}
                  onChange={(e) => setStepData({
                    ...stepData,
                    [step.id]: parseFloat(e.target.value) || 0
                  })}
                  placeholder="Enter value"
                />
              ) : (
                <Input
                  id={step.id}
                  type="text"
                  value={stepData[step.id] || ''}
                  onChange={(e) => setStepData({
                    ...stepData,
                    [step.id]: e.target.value
                  })}
                  placeholder="Enter information"
                />
              )}
              {step.config.calculation && (
                <p className="text-sm text-gray-500 mt-1">
                  Auto-calculated: {step.config.calculation}
                </p>
              )}
            </div>
            <Button 
              onClick={handleStepComplete} 
              className="w-full"
              disabled={isProcessing}
            >
              Save Data
            </Button>
          </div>
        );

      case 'photo':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={step.id}>{step.label}</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Photo upload functionality</p>
                <p className="text-sm text-gray-400 mt-2">
                  This feature will be available in a future update
                </p>
              </div>
            </div>
            <Button 
              onClick={handleStepComplete} 
              className="w-full"
              disabled={isProcessing}
            >
              Skip Photo
            </Button>
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

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Task Checklist</h3>
          <Badge variant="outline">
            Step {currentStep + 1} of {steps.length}
          </Badge>
        </div>
        <Progress value={progressPercentage} className="w-full" />
      </div>

      {/* Step List */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const StepIcon = getStepIcon(step.type);
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div 
              key={step.id}
              className={`flex items-center space-x-3 p-2 rounded-lg ${
                isCurrent ? 'bg-blue-50 border border-blue-200' : 
                isCompleted ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              <StepIcon 
                className={`w-5 h-5 ${
                  isCompleted ? 'text-green-600' : 
                  isCurrent ? 'text-blue-600' : 'text-gray-400'
                }`}
              />
              <span className={`flex-1 ${
                isCompleted ? 'text-green-900 line-through' : 
                isCurrent ? 'text-blue-900 font-medium' : 'text-gray-600'
              }`}>
                {step.label}
              </span>
              {isCompleted && <CheckCircle className="w-4 h-4 text-green-600" />}
            </div>
          );
        })}
      </div>

      {/* Current Step */}
      {currentStep < steps.length && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {React.createElement(getStepIcon(steps[currentStep].type), { className: 'w-5 h-5' })}
              <span>{steps[currentStep].label}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderStepInput(steps[currentStep])}
            {errors[steps[currentStep].id] && (
              <Alert className="mt-4" variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {errors[steps[currentStep].id]}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0 || isProcessing}
        >
          Previous
        </Button>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
            disabled={currentStep === steps.length - 1 || isProcessing}
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistExecution;