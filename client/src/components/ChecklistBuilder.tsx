import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ChevronUp, ChevronDown, Settings, FileText, CheckSquare, Hash, Package, Building, BarChart3, Camera, Split, ArrowRight } from 'lucide-react';
import { GrowingSystem } from '@shared/schema';

interface ChecklistStep {
  id: string;
  type: string;
  label: string;
  required: boolean;
  config: any;
}

interface ChecklistTemplate {
  steps: ChecklistStep[];
}

interface ChecklistBuilderProps {
  template: ChecklistTemplate | null;
  systems: GrowingSystem[];
  onChange: (steps: ChecklistStep[]) => void;
}

const ChecklistBuilder: React.FC<ChecklistBuilderProps> = ({ template, systems, onChange }) => {
  const [steps, setSteps] = useState<ChecklistStep[]>(template?.steps || []);
  const [showAddStep, setShowAddStep] = useState(false);

  const stepTypes = [
    { value: 'instruction', label: 'Text Instruction', icon: FileText },
    { value: 'checkbox', label: 'Simple Checkbox', icon: CheckSquare },
    { value: 'number-input', label: 'Number Input', icon: Hash },
    { value: 'inventory-select', label: 'Inventory Selection', icon: Package },
    { value: 'system-assignment', label: 'System Assignment', icon: Building },
    { value: 'data-capture', label: 'Data Collection', icon: BarChart3 },
    { value: 'photo', label: 'Photo Upload', icon: Camera },
    { value: 'tray-split', label: 'Tray Split (Leafy Greens)', icon: Split },
    { value: 'movement-trigger', label: 'Movement Trigger', icon: ArrowRight }
  ];

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case 'number-input':
        return { min: 0, max: 100, unit: '', default: 0 };
      case 'inventory-select':
        return { category: 'seeds', allowMultiple: false };
      case 'system-assignment':
        return { systemType: '', autoSuggest: true };
      case 'data-capture':
        return { dataType: 'number', calculation: '' };
      case 'tray-split':
        return { allowCustomSplit: true, defaultSplits: 2 };
      case 'movement-trigger':
        return { fromSystem: '', toSystem: '', automatic: false };
      default:
        return {};
    }
  };

  const addStep = (type: string) => {
    const newStep: ChecklistStep = {
      id: Date.now().toString(),
      type,
      label: '',
      required: true,
      config: getDefaultConfig(type)
    };

    const newSteps = [...steps, newStep];
    setSteps(newSteps);
    onChange(newSteps);
    setShowAddStep(false);
  };

  const updateStep = (index: number, updatedStep: ChecklistStep) => {
    const newSteps = [...steps];
    newSteps[index] = updatedStep;
    setSteps(newSteps);
    onChange(newSteps);
  };

  const deleteStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    onChange(newSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < steps.length) {
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      setSteps(newSteps);
      onChange(newSteps);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Checklist Steps</h3>
        <span className="text-sm text-gray-500">{steps.length} steps</span>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <ChecklistStepEditor
            key={step.id}
            step={step}
            index={index}
            systems={systems}
            onUpdate={(updatedStep) => updateStep(index, updatedStep)}
            onDelete={() => deleteStep(index)}
            onMoveUp={index > 0 ? () => moveStep(index, 'up') : undefined}
            onMoveDown={index < steps.length - 1 ? () => moveStep(index, 'down') : undefined}
          />
        ))}
      </div>

      {showAddStep ? (
        <Card>
          <CardHeader>
            <CardTitle>Select Step Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stepTypes.map(type => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-gray-50"
                    onClick={() => addStep(type.value)}
                  >
                    <Icon className="w-6 h-6 text-gray-600" />
                    <span className="text-sm text-center">{type.label}</span>
                  </Button>
                );
              })}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowAddStep(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setShowAddStep(true)}
          className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Step
        </Button>
      )}
    </div>
  );
};

interface ChecklistStepEditorProps {
  step: ChecklistStep;
  index: number;
  systems: GrowingSystem[];
  onUpdate: (step: ChecklistStep) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const ChecklistStepEditor: React.FC<ChecklistStepEditorProps> = ({
  step,
  index,
  systems,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown
}) => {
  const [expanded, setExpanded] = useState(false);

  const getStepIcon = (type: string) => {
    const icons = {
      instruction: FileText,
      checkbox: CheckSquare,
      'number-input': Hash,
      'inventory-select': Package,
      'system-assignment': Building,
      'data-capture': BarChart3,
      photo: Camera,
      'tray-split': Split,
      'movement-trigger': ArrowRight
    };
    return icons[type as keyof typeof icons] || FileText;
  };

  const StepIcon = getStepIcon(step.type);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
              {index + 1}
            </div>
            <StepIcon className="w-5 h-5 text-gray-600" />
            <div className="flex-1">
              <Input
                value={step.label}
                onChange={(e) => onUpdate({ ...step, label: e.target.value })}
                placeholder={`Enter ${step.type.replace('-', ' ')} label...`}
                className="font-medium"
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onMoveUp && (
              <Button variant="ghost" size="sm" onClick={onMoveUp}>
                <ChevronUp className="w-4 h-4" />
              </Button>
            )}
            {onMoveDown && (
              <Button variant="ghost" size="sm" onClick={onMoveDown}>
                <ChevronDown className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`required-${step.id}`}
                checked={step.required}
                onCheckedChange={(checked) => onUpdate({ ...step, required: !!checked })}
              />
              <Label htmlFor={`required-${step.id}`}>Required step</Label>
            </div>

            {/* Type-specific configuration */}
            {step.type === 'number-input' && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Min Value</Label>
                  <Input
                    type="number"
                    value={step.config.min || ''}
                    onChange={(e) => onUpdate({
                      ...step,
                      config: { ...step.config, min: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div>
                  <Label>Max Value</Label>
                  <Input
                    type="number"
                    value={step.config.max || ''}
                    onChange={(e) => onUpdate({
                      ...step,
                      config: { ...step.config, max: parseInt(e.target.value) || 100 }
                    })}
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Input
                    type="text"
                    value={step.config.unit || ''}
                    onChange={(e) => onUpdate({
                      ...step,
                      config: { ...step.config, unit: e.target.value }
                    })}
                    placeholder="e.g., trays, oz, plants"
                  />
                </div>
              </div>
            )}

            {step.type === 'system-assignment' && (
              <div className="space-y-3">
                <div>
                  <Label>System Type</Label>
                  <Select
                    value={step.config.systemType || ''}
                    onValueChange={(value) => onUpdate({
                      ...step,
                      config: { ...step.config, systemType: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any System" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any System</SelectItem>
                      <SelectItem value="nursery">Nursery</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                      <SelectItem value="blackout">Blackout Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`auto-suggest-${step.id}`}
                    checked={step.config.autoSuggest}
                    onCheckedChange={(checked) => onUpdate({
                      ...step,
                      config: { ...step.config, autoSuggest: !!checked }
                    })}
                  />
                  <Label htmlFor={`auto-suggest-${step.id}`}>Auto-suggest available spots</Label>
                </div>
              </div>
            )}

            {step.type === 'data-capture' && (
              <div className="space-y-3">
                <div>
                  <Label>Data Type</Label>
                  <Select
                    value={step.config.dataType || 'number'}
                    onValueChange={(value) => onUpdate({
                      ...step,
                      config: { ...step.config, dataType: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="select">Selection</SelectItem>
                      <SelectItem value="weight">Weight</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Auto-calculation (optional)</Label>
                  <Input
                    type="text"
                    value={step.config.calculation || ''}
                    onChange={(e) => onUpdate({
                      ...step,
                      config: { ...step.config, calculation: e.target.value }
                    })}
                    placeholder="e.g., trays * 0.75"
                  />
                </div>
              </div>
            )}

            {step.type === 'tray-split' && (
              <div className="space-y-3">
                <div>
                  <Label>Default number of splits</Label>
                  <Input
                    type="number"
                    value={step.config.defaultSplits || 2}
                    onChange={(e) => onUpdate({
                      ...step,
                      config: { ...step.config, defaultSplits: parseInt(e.target.value) || 2 }
                    })}
                    min="2"
                    max="10"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`custom-split-${step.id}`}
                    checked={step.config.allowCustomSplit}
                    onCheckedChange={(checked) => onUpdate({
                      ...step,
                      config: { ...step.config, allowCustomSplit: !!checked }
                    })}
                  />
                  <Label htmlFor={`custom-split-${step.id}`}>Allow custom split configuration</Label>
                </div>
              </div>
            )}

            {step.type === 'inventory-select' && (
              <div className="space-y-3">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={step.config.category || 'seeds'}
                    onValueChange={(value) => onUpdate({
                      ...step,
                      config: { ...step.config, category: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seeds">Seeds</SelectItem>
                      <SelectItem value="nutrients">Nutrients</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`multiple-${step.id}`}
                    checked={step.config.allowMultiple}
                    onCheckedChange={(checked) => onUpdate({
                      ...step,
                      config: { ...step.config, allowMultiple: !!checked }
                    })}
                  />
                  <Label htmlFor={`multiple-${step.id}`}>Allow multiple selections</Label>
                </div>
              </div>
            )}

            {step.type === 'instruction' && (
              <div>
                <Label>Instruction Text</Label>
                <Textarea
                  value={step.config.text || ''}
                  onChange={(e) => onUpdate({
                    ...step,
                    config: { ...step.config, text: e.target.value }
                  })}
                  placeholder="Enter detailed instructions..."
                  rows={3}
                />
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ChecklistBuilder;