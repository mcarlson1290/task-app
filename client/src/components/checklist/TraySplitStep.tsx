import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Split, ArrowRight, Plus, Minus } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import { Tray, TrayVariety } from '../../data/trayTracking';
import TrayDataService from '../../services/trayDataService';

interface TraySplitStepProps {
  step: {
    id: string;
    label: string;
    type: 'tray-split';
    config?: {
      maxSplits?: number;
      minSplits?: number;
      allowCustomSplit?: boolean;
      defaultSplits?: number;
    };
  };
  value?: {
    trayId?: string;
    count: number;
    splits: Array<{
      id: string;
      parentId: string;
      splitNumber?: number;
      label: string;
      cropType?: string;
      cropName?: string;
    }>;
    originalTray?: Tray;
  };
  onChange: (value: any) => void;
  trayId?: string;
}

interface VarietySplit {
  varietyId: string;
  varietyName: string;
  originalQuantity: number;
  splits: Array<{
    trayIndex: number;
    quantity: number;
  }>;
}

const TraySplitStep: React.FC<TraySplitStepProps> = ({ 
  step, 
  value, 
  onChange, 
  trayId 
}) => {
  const [activeTrays, setActiveTrays] = useState<Tray[]>([]);
  const [selectedTray, setSelectedTray] = useState(value?.trayId || trayId || '');
  const [splitCount, setSplitCount] = useState(value?.count || step.config?.defaultSplits || 3);
  const [varietySplits, setVarietySplits] = useState<VarietySplit[]>([]);
  const [splitMode, setSplitMode] = useState<'auto' | 'manual'>('auto');

  useEffect(() => {
    console.log('=== TRAY SPLIT DATA CHECK ===');
    console.log('Using shared TrayDataService - SAME as TrayTracking page');
    
    // Load active trays from the shared service
    const loadActiveTrays = () => {
      const activeTrayData = TrayDataService.getActiveTrays();
      console.log('TraySplitStep: Loaded', activeTrayData.length, 'active trays');
      setActiveTrays(activeTrayData);
    };
    
    loadActiveTrays();
    
    // Listen for tray data updates
    const handleTrayUpdate = () => {
      console.log('TraySplitStep: Received tray data update, reloading...');
      loadActiveTrays();
    };
    
    window.addEventListener('trayDataUpdated', handleTrayUpdate);
    
    console.log('✅ SUCCESS: Using shared TrayDataService!');
    console.log('=== END TRAY SPLIT DATA CHECK ===');
    
    return () => {
      window.removeEventListener('trayDataUpdated', handleTrayUpdate);
    };
  }, []);

  const handleTraySelect = (trayId: string) => {
    setSelectedTray(trayId);
    updateValue(trayId, splitCount);
  };

  const handleSplitCountChange = (count: number) => {
    const minSplits = step.config?.minSplits || 2;
    const maxSplits = step.config?.maxSplits || 10;
    const newCount = Math.max(minSplits, Math.min(maxSplits, parseInt(count.toString()) || minSplits));
    setSplitCount(newCount);
    updateValue(selectedTray, newCount);
  };

  // Calculate smart variety distribution across child trays
  const calculateVarietyDistribution = (tray: Tray, splitCount: number) => {
    if (!tray.varieties || tray.varieties.length === 0) {
      return [];
    }

    const splits: VarietySplit[] = tray.varieties.map(variety => {
      const baseQuantityPerTray = Math.floor(variety.quantity / splitCount);
      const remainder = variety.quantity % splitCount;
      
      const varietySplit: VarietySplit = {
        varietyId: variety.seedId,
        varietyName: variety.seedName,
        originalQuantity: variety.quantity,
        splits: []
      };

      // Distribute plants across trays
      for (let i = 0; i < splitCount; i++) {
        const quantity = baseQuantityPerTray + (i < remainder ? 1 : 0);
        varietySplit.splits.push({
          trayIndex: i,
          quantity: quantity
        });
      }

      return varietySplit;
    });

    return splits;
  };

  const updateValue = (trayId: string, count: number) => {
    if (!trayId) return;

    const tray = activeTrays.find(t => t.id === trayId);
    if (!tray) return;

    // Calculate variety distribution
    const varietyDistribution = calculateVarietyDistribution(tray, count);
    setVarietySplits(varietyDistribution);

    // Generate split preview with variety information
    const splits = [];
    for (let i = 1; i <= count; i++) {
      const trayVarieties = varietyDistribution.map(vs => ({
        varietyName: vs.varietyName,
        quantity: vs.splits[i - 1]?.quantity || 0
      })).filter(v => v.quantity > 0);

      splits.push({
        id: `${trayId}-${i}`,
        label: `Split ${i}`,
        parentId: trayId,
        splitNumber: i,
        cropType: tray.cropType,
        cropName: tray.cropType,
        varieties: trayVarieties,
        totalPlants: trayVarieties.reduce((sum, v) => sum + v.quantity, 0)
      });
    }

    // When the step is completed, perform the actual split
    const value = {
      trayId: trayId,
      count: count,
      splits: splits,
      originalTray: tray,
      varietyDistribution: varietyDistribution,
      // Add a method to execute the actual split
      executeSplit: () => {
        console.log('TraySplitStep: Executing multi-variety split operation');
        const result = TrayDataService.splitTray(trayId, count);
        console.log('TraySplitStep: Multi-variety split executed, result:', result);
        return result;
      }
    };

    onChange(value);
  };

  // Custom render for tray options - using TrayTracking format
  const renderTrayOption = (tray: Tray) => (
    <div className="tray-option">
      <span className="tray-id font-mono font-medium">{tray.id}</span>
      <span className="tray-details text-sm text-gray-600 block">
        {tray.cropType}
        {tray.datePlanted && ` - Planted: ${tray.datePlanted.toLocaleDateString()}`}
      </span>
    </div>
  );

  const minSplits = step.config?.minSplits || 2;
  const maxSplits = step.config?.maxSplits || 10;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base font-medium flex items-center">
          <Split className="w-4 h-4 mr-2" />
          {step.label || 'Select a tray to split into multiple portions'}
        </Label>
      </div>

      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border">
        <div className="space-y-2">
          <Label>Select Tray:</Label>
          <SearchableDropdown
            options={activeTrays}
            value={selectedTray}
            onChange={handleTraySelect}
            placeholder="Search by tray ID or crop..."
            displayField="id"
            valueField="id"
            renderOption={renderTrayOption}
          />
        </div>

        {selectedTray && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="split-count">Number of splits ({minSplits}-{maxSplits}):</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="split-count"
                  type="number"
                  min={minSplits}
                  max={maxSplits}
                  value={splitCount}
                  onChange={(e) => handleSplitCountChange(parseInt(e.target.value) || minSplits)}
                  className="w-24"
                />
                <span className="text-sm text-gray-500">({minSplits}-{maxSplits} splits allowed)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedTray && value?.splits && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-medium text-gray-900">
            This will create {splitCount} new trays from {selectedTray}:
          </h4>
          
          {/* Show variety distribution if available */}
          {varietySplits.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h5 className="font-medium text-blue-800 mb-2">🌱 Variety Distribution</h5>
              {varietySplits.map((variety, vIdx) => (
                <div key={variety.varietyId} className="mb-2">
                  <div className="text-sm font-medium text-blue-700">{variety.varietyName}:</div>
                  <div className="flex gap-1 mt-1">
                    {variety.splits.map((split, sIdx) => (
                      <div key={sIdx} className="bg-white px-2 py-1 rounded text-xs border">
                        T{sIdx + 1}: {split.quantity}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {value.splits.map((split: any, index: number) => (
              <div key={split.id} className="p-3 bg-white border rounded">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {index + 1}
                  </Badge>
                  <code className="text-sm font-mono text-blue-600">{split.id}</code>
                </div>
                {split.varieties && split.varieties.length > 0 && (
                  <div className="text-xs text-gray-600">
                    {split.varieties.map((v: any, i: number) => (
                      <span key={i}>
                        {v.quantity} {v.varietyName}
                        {i < split.varieties.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                    <div className="mt-1 font-medium">Total: {split.totalPlants} plants</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 italic mt-3">
            Original tray {selectedTray} will be marked as split and archived.
          </p>
        </div>
      )}
    </div>
  );
};

export default TraySplitStep;