import React, { useState, useEffect } from 'react';

interface TraySplitStepProps {
  step: {
    id: string;
    label: string;
    type: 'tray-split';
    config?: {
      maxSplits?: number;
      minSplits?: number;
    };
  };
  value?: {
    count: number;
    splits: Array<{
      id: string;
      parentId: string;
      splitNumber: number;
      label: string;
    }>;
  };
  onChange: (value: any) => void;
  trayId?: string;
}

const TraySplitStep: React.FC<TraySplitStepProps> = ({ 
  step, 
  value, 
  onChange, 
  trayId = 'TRAY-001' 
}) => {
  const [splitCount, setSplitCount] = useState(value?.count || 2);
  const [splitLabels, setSplitLabels] = useState<string[]>(
    value?.splits?.map(s => s.label) || []
  );
  
  const minSplits = step.config?.minSplits || 2;
  const maxSplits = step.config?.maxSplits || 10;
  
  useEffect(() => {
    // Initialize if we have existing value
    if (value) {
      setSplitCount(value.count);
      setSplitLabels(value.splits.map(s => s.label));
    }
  }, [value]);
  
  const handleSplitCountChange = (count: number) => {
    const newCount = Math.max(minSplits, Math.min(maxSplits, count));
    setSplitCount(newCount);
    
    // Generate split tray IDs
    const splits = [];
    for (let i = 1; i <= newCount; i++) {
      splits.push({
        id: `${trayId}-${i}`,
        parentId: trayId,
        splitNumber: i,
        label: splitLabels[i-1] || `Split ${i}`
      });
    }
    
    onChange({
      count: newCount,
      splits: splits
    });
  };
  
  const handleLabelChange = (index: number, label: string) => {
    const newLabels = [...splitLabels];
    newLabels[index] = label;
    setSplitLabels(newLabels);
    
    // Update the onChange with new labels
    if (value) {
      const updatedSplits = value.splits.map((split, i) => ({
        ...split,
        label: newLabels[i] || `Split ${i + 1}`
      }));
      
      onChange({
        ...value,
        splits: updatedSplits
      });
    }
  };
  
  return (
    <div className="tray-split-step">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {step.label || 'Split tray into multiple portions'}
      </label>
      
      <div className="split-controls mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Number of splits:</label>
          <input
            type="number"
            min={minSplits}
            max={maxSplits}
            value={splitCount}
            onChange={(e) => handleSplitCountChange(parseInt(e.target.value) || minSplits)}
            className="split-count-input w-20 p-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-500">
            ({minSplits}-{maxSplits} splits allowed)
          </span>
        </div>
      </div>
      
      <div className="split-preview bg-gray-50 p-4 rounded-md">
        <p className="text-sm font-medium text-gray-700 mb-3">
          This will create {splitCount} new trays from {trayId}:
        </p>
        <div className="split-list space-y-2">
          {Array.from({ length: splitCount }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="font-mono text-sm bg-white px-2 py-1 rounded border min-w-24">
                {trayId}-{i + 1}
              </span>
              <input
                type="text"
                placeholder={`Split ${i + 1}`}
                value={splitLabels[i] || ''}
                onChange={(e) => handleLabelChange(i, e.target.value)}
                className="flex-1 p-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
        
        {/* Summary */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            Original tray <code className="bg-white px-1 rounded">{trayId}</code> will be divided into {splitCount} separate trays
          </p>
        </div>
      </div>
    </div>
  );
};

export default TraySplitStep;