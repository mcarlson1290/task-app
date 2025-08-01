import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ChevronUp, ChevronDown, FileText, CheckSquare, Hash, Package, Building, BarChart3, Camera, Split, ArrowRight, Edit3, PlusCircle } from 'lucide-react';
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
  const [availableSeeds, setAvailableSeeds] = useState<any[]>([]);

  const stepTypes = [
    { value: 'instruction', label: 'Text Instruction', icon: FileText, description: 'Display read-only information or instructions' },
    { value: 'checkbox', label: 'Simple Checkbox', icon: CheckSquare, description: 'Simple yes/no or completion checkbox' },
    { value: 'number-input', label: 'Number Input', icon: Hash, description: 'Numeric input with validation and units' },
    { value: 'inventory-select', label: 'Inventory Selection', icon: Package, description: 'Select and track inventory usage' },
    { value: 'system-assignment', label: 'System Assignment', icon: Building, description: 'Assign tasks to growing systems' },
    { value: 'data-capture', label: 'Data Collection', icon: BarChart3, description: 'Collect measurements like pH, EC, temperature' },
    { value: 'photo', label: 'Photo Upload', icon: Camera, description: 'Capture photos for documentation' },
    { value: 'tray-split', label: 'Tray Split', icon: Split, description: 'Split trays into multiple new trays' },
    { value: 'movement-trigger', label: 'Movement Trigger', icon: ArrowRight, description: 'Move trays between locations/systems' },
    { value: 'edit-tray', label: 'Edit Tray', icon: Edit3, description: 'Update existing tray information' },
    { value: 'create-tray', label: 'Create Tray', icon: PlusCircle, description: 'Create new trays with specifications' }
  ];

  // Load available seeds from inventory
  React.useEffect(() => {
    const loadSeeds = async () => {
      try {
        const response = await fetch('/api/inventory');
        const inventory = await response.json();
        
        // Filter to only seed items
        const seeds = inventory.filter((item: any) => 
          item.category === 'Seeds' || 
          item.category === 'seeds' || 
          (item.name && item.name.toLowerCase().includes('seed'))
        );
        
        console.log('Available seeds loaded:', seeds);
        setAvailableSeeds(seeds);
      } catch (error) {
        console.error('Failed to load seeds from inventory:', error);
        // Fallback to localStorage if API fails
        const localInventory = JSON.parse(localStorage.getItem('inventory') || '[]');
        const seeds = localInventory.filter((item: any) => 
          item.category === 'Seeds' || 
          item.category === 'seeds' || 
          (item.name && item.name.toLowerCase().includes('seed'))
        );
        setAvailableSeeds(seeds);
      }
    };

    loadSeeds();

    // Listen for inventory updates
    const handleInventoryUpdate = () => loadSeeds();
    window.addEventListener('inventoryUpdated', handleInventoryUpdate);
    
    return () => {
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
    };
  }, []);

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case 'instruction':
        return { text: '' };
      case 'number-input':
        return { min: 0, max: 100, unit: '', default: 0 };
      case 'inventory-select':
        return { 
          inventoryItemId: '', 
          inventoryItemName: '', 
          inventoryUnit: '', 
          customText: '', 
          defaultQuantity: '' 
        };
      case 'system-assignment':
        return { systemType: '', autoSuggest: true };
      case 'data-capture':
        return { dataType: 'number', calculation: '' };
      case 'tray-split':
        return { allowCustomSplit: true, defaultSplits: 2 };
      case 'movement-trigger':
        return { fromSystem: '', toSystem: '', automatic: false };
      case 'edit-tray':
        return { trayId: '', location: '', crop: '', seedDate: '', expectedHarvest: '', notes: '' };
      case 'create-tray':
        return { 
          numberOfTrays: 1, 
          defaultTrayType: 'LG',
          defaultInstance: 1,
          defaultGrowingMedium: '',
          defaultTotalSlots: 0,
          defaultVarieties: [],
          instructions: ''
        };
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
            availableSeeds={availableSeeds}
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
                    <div className="text-center">
                      <span className="text-sm font-medium">{type.label}</span>
                      <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                    </div>
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
  availableSeeds: any[];
  onUpdate: (step: ChecklistStep) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const ChecklistStepEditor: React.FC<ChecklistStepEditorProps> = ({
  step,
  index,
  systems,
  availableSeeds,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown
}) => {
  const [expanded, setExpanded] = useState(true);

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
      'movement-trigger': ArrowRight,
      'edit-tray': Edit3,
      'create-tray': PlusCircle
    };
    return icons[type as keyof typeof icons] || FileText;
  };

  const getStepTypeInfo = (type: string) => {
    const stepTypes = [
      { value: 'instruction', label: 'Text Instruction', description: 'Display read-only information or instructions' },
      { value: 'checkbox', label: 'Simple Checkbox', description: 'Simple yes/no or completion checkbox' },
      { value: 'number-input', label: 'Number Input', description: 'Numeric input with validation and units' },
      { value: 'inventory-select', label: 'Inventory Selection', description: 'Select and track inventory usage' },
      { value: 'system-assignment', label: 'System Assignment', description: 'Assign tasks to growing systems' },
      { value: 'data-capture', label: 'Data Collection', description: 'Collect measurements like pH, EC, temperature' },
      { value: 'photo', label: 'Photo Upload', description: 'Capture photos for documentation' },
      { value: 'tray-split', label: 'Tray Split', description: 'Split trays into multiple new trays' },
      { value: 'movement-trigger', label: 'Movement Trigger', description: 'Move trays between locations/systems' },
      { value: 'edit-tray', label: 'Edit Tray', description: 'Update existing tray information' },
      { value: 'create-tray', label: 'Create Tray', description: 'Create new trays with specifications' }
    ];
    return stepTypes.find(t => t.value === type);
  };

  const StepIcon = getStepIcon(step.type);
  const stepTypeInfo = getStepTypeInfo(step.type);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              {index + 1}
            </div>
            <StepIcon className="w-5 h-5 text-gray-600" />
            <div className="flex-1">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {stepTypeInfo?.label || step.type}
                </span>
                <span className="text-xs text-gray-500">{stepTypeInfo?.description}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500"
            >
              {expanded ? '▼' : '▶'}
            </Button>
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
            {/* Step Label Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Step Label</Label>
              <Input
                value={step.label}
                onChange={(e) => onUpdate({ ...step, label: e.target.value })}
                placeholder={`Enter ${step.type.replace('-', ' ')} label...`}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`required-${step.id}`}
                checked={step.required}
                onCheckedChange={(checked) => onUpdate({ ...step, required: !!checked })}
              />
              <Label htmlFor={`required-${step.id}`}>Required step</Label>
            </div>

            {/* Type-specific configuration */}
            {step.type === 'instruction' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Instruction Text</Label>
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

            {step.type === 'number-input' && (
              <div className="space-y-3">
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
              </div>
            )}

            {step.type === 'inventory-select' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3">Inventory Usage Step Configuration</h4>
                  
                  {/* Input 1: What inventory item */}
                  <div className="space-y-2 mb-4">
                    <Label className="text-sm font-medium">1. What inventory item will be used?</Label>
                    <Select
                      value={step.config.inventoryItemId || ''}
                      onValueChange={(value) => {
                        const inventoryItems = [
                          { id: '1', name: 'RO Water', unit: 'gallons' },
                          { id: '2', name: 'pH Down', unit: 'ml' },
                          { id: '3', name: 'pH Up', unit: 'ml' },
                          { id: '4', name: 'Nutrients Part A', unit: 'ml' },
                          { id: '5', name: 'Nutrients Part B', unit: 'ml' },
                          { id: '6', name: 'Rockwool Cubes', unit: 'cubes' },
                          { id: '7', name: 'Romaine Seeds', unit: 'seeds' },
                          { id: '8', name: 'Buttercrunch Seeds', unit: 'seeds' },
                          { id: '9', name: 'Arugula Seeds', unit: 'seeds' },
                          { id: '10', name: 'Basil Seeds', unit: 'seeds' }
                        ];
                        const item = inventoryItems.find(i => i.id === value);
                        const updatedStep = {
                          ...step,
                          config: { 
                            ...step.config, 
                            inventoryItemId: value,
                            inventoryItemName: item?.name || '',
                            inventoryUnit: item?.unit || ''
                          }
                        };
                        console.log('Updating inventory item:', item?.name, 'with config:', updatedStep.config);
                        onUpdate(updatedStep);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select inventory item..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">RO Water (gallons)</SelectItem>
                        <SelectItem value="2">pH Down (ml)</SelectItem>
                        <SelectItem value="3">pH Up (ml)</SelectItem>
                        <SelectItem value="4">Nutrients Part A (ml)</SelectItem>
                        <SelectItem value="5">Nutrients Part B (ml)</SelectItem>
                        <SelectItem value="6">Rockwool Cubes (cubes)</SelectItem>
                        <SelectItem value="7">Romaine Seeds (seeds)</SelectItem>
                        <SelectItem value="8">Buttercrunch Seeds (seeds)</SelectItem>
                        <SelectItem value="9">Arugula Seeds (seeds)</SelectItem>
                        <SelectItem value="10">Basil Seeds (seeds)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Input 2: Custom text/question */}
                  <div className="space-y-2 mb-4">
                    <Label className="text-sm font-medium">2. What text should appear for this step?</Label>
                    <Input
                      type="text"
                      value={step.config.customText || ''}
                      onChange={(e) => {
                        const updatedStep = {
                          ...step,
                          config: { ...step.config, customText: e.target.value }
                        };
                        console.log('Updating custom text:', e.target.value);
                        onUpdate(updatedStep);
                      }}
                      placeholder="e.g., How much RO water did you use?"
                    />
                    <p className="text-xs text-gray-600">This is what the user will see when completing the task</p>
                  </div>

                  {/* Input 3: Default quantity (optional) */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">3. Default quantity (optional)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={step.config.defaultQuantity || ''}
                        onChange={(e) => {
                          const updatedStep = {
                            ...step,
                            config: { ...step.config, defaultQuantity: e.target.value }
                          };
                          console.log('Updating default quantity:', e.target.value);
                          onUpdate(updatedStep);
                        }}
                        placeholder="e.g., 2.5"
                        step="0.1"
                        min="0"
                        className="w-32"
                      />
                      {step.config.inventoryUnit && (
                        <span className="text-sm text-gray-600">{step.config.inventoryUnit}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">Pre-fills this amount to save time during task completion</p>
                  </div>

                  {step.config.inventoryItemName && (
                    <div className="mt-3 p-2 bg-white rounded border">
                      <p className="text-sm text-gray-700">
                        <strong>Preview:</strong> {step.config.customText || step.label} 
                        <span className="text-gray-500"> (tracking {step.config.inventoryItemName}
                        {step.config.defaultQuantity && ` - default: ${step.config.defaultQuantity} ${step.config.inventoryUnit}`})</span>
                      </p>
                    </div>
                  )}
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
                      <SelectItem value="ph">pH Level</SelectItem>
                      <SelectItem value="ec">EC Level</SelectItem>
                      <SelectItem value="temperature">Temperature</SelectItem>
                      <SelectItem value="humidity">Humidity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step.type === 'photo' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Photo Requirements</Label>
                <p className="text-sm text-gray-600">Users will be able to capture photos using their device camera or upload from files.</p>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`multiple-photos-${step.id}`}
                    checked={step.config.allowMultiple || false}
                    onCheckedChange={(checked) => onUpdate({
                      ...step,
                      config: { ...step.config, allowMultiple: !!checked }
                    })}
                  />
                  <Label htmlFor={`multiple-photos-${step.id}`}>Allow multiple photos</Label>
                </div>
              </div>
            )}

            {step.type === 'edit-tray' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Edit Tray Configuration</Label>
                <p className="text-sm text-gray-600">Users will be able to update existing tray information including location, crop stage, and notes.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`allow-location-${step.id}`}
                      checked={step.config.allowLocation !== false}
                      onCheckedChange={(checked) => onUpdate({
                        ...step,
                        config: { ...step.config, allowLocation: !!checked }
                      })}
                    />
                    <Label htmlFor={`allow-location-${step.id}`}>Allow location change</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`allow-notes-${step.id}`}
                      checked={step.config.allowNotes !== false}
                      onCheckedChange={(checked) => onUpdate({
                        ...step,
                        config: { ...step.config, allowNotes: !!checked }
                      })}
                    />
                    <Label htmlFor={`allow-notes-${step.id}`}>Allow notes update</Label>
                  </div>
                </div>
              </div>
            )}

            {step.type === 'create-tray' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Create Tray Configuration</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Default Tray Type</Label>
                    <Select
                      value={step.config.defaultTrayType || 'LG'}
                      onValueChange={(value) => onUpdate({
                        ...step,
                        config: { ...step.config, defaultTrayType: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tray type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LG">LG - Leafy Greens</SelectItem>
                        <SelectItem value="MG">MG - Microgreens</SelectItem>
                        <SelectItem value="HB">HB - Herbs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Default Instance #</Label>
                    <Input
                      type="number"
                      value={step.config.defaultInstance || 1}
                      onChange={(e) => onUpdate({
                        ...step,
                        config: { ...step.config, defaultInstance: parseInt(e.target.value) || 1 }
                      })}
                      min="1"
                      max="99"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Default Growing Medium</Label>
                    <Select
                      value={step.config.defaultGrowingMedium || ''}
                      onValueChange={(value) => onUpdate({
                        ...step,
                        config: { ...step.config, defaultGrowingMedium: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="User selects..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user-selects">User selects...</SelectItem>
                        <SelectItem value="Oasis Cubes">Oasis Cubes</SelectItem>
                        <SelectItem value="Rockwool">Rockwool</SelectItem>
                        <SelectItem value="Hemp Mat">Hemp Mat</SelectItem>
                        <SelectItem value="Coco Mat">Coco Mat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Default Total Slots</Label>
                    <Input
                      type="number"
                      value={step.config.defaultTotalSlots || ''}
                      onChange={(e) => onUpdate({
                        ...step,
                        config: { ...step.config, defaultTotalSlots: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="e.g., 200"
                      min="1"
                    />
                  </div>
                </div>

                {/* Default Crop Varieties Section */}
                <div className="default-varieties-section p-4 bg-gray-50 rounded-lg border">
                  <Label className="text-sm font-medium mb-2 block">Default Crop Varieties</Label>
                  <p className="text-xs text-gray-600 mb-3">Set default quantities for each crop type</p>
                  
                  {availableSeeds.length === 0 ? (
                    <div className="no-seeds-message p-3 text-center text-gray-500 italic border rounded">
                      <p>No seeds found in inventory.</p>
                      <p className="text-xs mt-1">Please add seeds to inventory before creating tray defaults.</p>
                    </div>
                  ) : (!step.config.defaultVarieties || step.config.defaultVarieties.length === 0) ? (
                    <div className="no-varieties-message p-3 text-center text-gray-500 italic">
                      No default varieties set. Click below to add.
                    </div>
                  ) : (
                    <div className="varieties-list space-y-2">
                      {step.config.defaultVarieties.map((variety: any, index: number) => (
                        <div key={index} className="default-variety-row grid grid-cols-6 gap-2 items-center p-2 bg-white rounded border">
                          <Select
                            value={variety.seedId || ''}
                            onValueChange={(value) => {
                              const newVarieties = [...(step.config.defaultVarieties || [])];
                              const seed = availableSeeds.find(s => s.id.toString() === value);
                              newVarieties[index] = { 
                                ...variety, 
                                seedId: value,
                                seedName: seed?.name || '',
                                sku: seed?.sku || seed?.SKU || seed?.productCode || ''
                              };
                              onUpdate({
                                ...step,
                                config: { ...step.config, defaultVarieties: newVarieties }
                              });
                            }}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Select seed..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSeeds.length === 0 ? (
                                <SelectItem value="no-seeds" disabled>No seeds in inventory</SelectItem>
                              ) : (
                                availableSeeds.map(seed => {
                                  const sku = seed.sku || seed.SKU || seed.productCode || '';
                                  const displaySKU = sku ? `[${sku}]` : '[NO-SKU]';
                                  return (
                                    <SelectItem key={seed.id} value={seed.id.toString()}>
                                      {displaySKU} {seed.name}
                                    </SelectItem>
                                  );
                                })
                              )}
                            </SelectContent>
                          </Select>
                          
                          <Input
                            type="number"
                            value={variety.quantity || ''}
                            onChange={(e) => {
                              const newVarieties = [...(step.config.defaultVarieties || [])];
                              newVarieties[index] = { ...variety, quantity: parseInt(e.target.value) || 0 };
                              onUpdate({
                                ...step,
                                config: { ...step.config, defaultVarieties: newVarieties }
                              });
                            }}
                            placeholder="Qty"
                            step="1"
                            min="0"
                            className="text-xs"
                          />
                          
                          <Input
                            type="number"
                            value={variety.seedsOz || ''}
                            onChange={(e) => {
                              const newVarieties = [...(step.config.defaultVarieties || [])];
                              newVarieties[index] = { ...variety, seedsOz: parseFloat(e.target.value) || 0 };
                              onUpdate({
                                ...step,
                                config: { ...step.config, defaultVarieties: newVarieties }
                              });
                            }}
                            placeholder="Seeds (oz)"
                            step="0.1"
                            min="0"
                            className="text-xs"
                          />
                          
                          <Button 
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newVarieties = (step.config.defaultVarieties || []).filter((_: any, i: number) => i !== index);
                              onUpdate({
                                ...step,
                                config: { ...step.config, defaultVarieties: newVarieties }
                              });
                            }}
                            className="h-8 w-8 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      
                      {/* Show total plants count */}
                      <div className="variety-total text-right p-2 bg-green-50 rounded font-medium text-sm">
                        Total Plants: {(step.config.defaultVarieties || []).reduce((sum: number, v: any) => {
                          const quantity = parseInt(v.quantity) || 0;
                          console.log('Adding quantity:', v.quantity, '-> parsed:', quantity, 'sum:', sum);
                          return sum + quantity;
                        }, 0)}
                        {step.config.defaultTotalSlots && (
                          <span> / {step.config.defaultTotalSlots} slots</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newVarieties = [...(step.config.defaultVarieties || []), {
                        seedId: '',
                        seedName: '',
                        sku: '',
                        quantity: 0,
                        seedsOz: 0
                      }];
                      onUpdate({
                        ...step,
                        config: { ...step.config, defaultVarieties: newVarieties }
                      });
                    }}
                    className="mt-3"
                    disabled={availableSeeds.length === 0}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Default Variety
                  </Button>
                  
                  {availableSeeds.length === 0 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Add seeds to inventory first to enable variety configuration
                    </p>
                  )}
                </div>

                <div>
                  <Label>Step Instructions</Label>
                  <textarea
                    value={step.config.instructions || ''}
                    onChange={(e) => onUpdate({
                      ...step,
                      config: { ...step.config, instructions: e.target.value }
                    })}
                    placeholder="Additional instructions for this create tray step..."
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-md resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ChecklistBuilder;