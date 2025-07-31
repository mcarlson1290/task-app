import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from '../../contexts/LocationContext';
import type { GrowingSystem } from '@shared/schema';

interface SystemAssignmentStepProps {
  step: {
    id: string;
    label: string;
    type: 'system-assignment';
    config?: {
      systemType?: string;
    };
  };
  value?: any;
  onChange: (value: any) => void;
  trayId?: string;
  splitTrays?: Array<{
    id: string;
    parentId: string;
    splitNumber: number;
    label: string;
  }>;
}

const SystemAssignmentStep: React.FC<SystemAssignmentStepProps> = ({ 
  step, 
  value, 
  onChange, 
  trayId, 
  splitTrays 
}) => {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const { currentLocation } = useLocation();
  
  // Fetch systems data from API
  const { data: systemsData = [] } = useQuery<GrowingSystem[]>({
    queryKey: ['/api/growing-systems', currentLocation.code],
    queryFn: async () => {
      const response = await fetch(`/api/growing-systems?location=${currentLocation.code}`);
      if (!response.ok) throw new Error('Failed to fetch systems');
      return response.json();
    },
  });

  // Filter available systems based on step config and availability
  const availableSystems = systemsData.filter(system => {
    if (!system.isActive) return false;
    if (step.config?.systemType && system.type !== step.config.systemType) return false;
    // Only show systems with available capacity
    const occupancyRate = system.capacity ? (system.currentOccupancy || 0) / system.capacity : 0;
    return occupancyRate < 1; // Less than 100% occupied
  });
  
  useEffect(() => {
    // If we have split trays, initialize assignments for each
    if (splitTrays && splitTrays.length > 0) {
      const initialAssignments: Record<string, string> = {};
      splitTrays.forEach(tray => {
        initialAssignments[tray.id] = '';
      });
      setAssignments(initialAssignments);
    }
  }, [splitTrays]);
  
  const handleSingleAssignment = (systemId: number) => {
    onChange({ trayId, systemId });
  };
  
  const handleSplitAssignment = (trayId: string, systemId: number) => {
    const newAssignments = { ...assignments, [trayId]: systemId.toString() };
    setAssignments(newAssignments);
    
    // Check if all splits are assigned
    const allAssigned = Object.values(newAssignments).every(id => id !== '');
    if (allAssigned) {
      onChange(newAssignments);
    }
  };

  const getUtilizationRate = (system: GrowingSystem) => {
    if (!system.capacity) return 0;
    return ((system.currentOccupancy || 0) / system.capacity) * 100;
  };

  const getSystemStatusColor = (utilization: number) => {
    if (utilization < 50) return 'text-green-600';
    if (utilization < 80) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // If we have split trays from a previous step
  if (splitTrays && splitTrays.length > 0) {
    return (
      <div className="system-assignment-step split-assignment">
        <h4 className="text-lg font-semibold mb-3">
          {step.label || 'Assign split trays to growing systems'}
        </h4>
        <div className="split-assignments space-y-3">
          {splitTrays.map((tray) => (
            <div key={tray.id} className="split-assignment-row flex items-center gap-3">
              <span className="tray-label font-mono text-sm font-medium min-w-36">
                {tray.id}:
              </span>
              <select
                value={assignments[tray.id] || ''}
                onChange={(e) => handleSplitAssignment(tray.id, parseInt(e.target.value))}
                className="system-select flex-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select system...</option>
                {availableSystems.map(system => {
                  const utilization = getUtilizationRate(system);
                  const available = (system.capacity || 0) - (system.currentOccupancy || 0);
                  return (
                    <option key={system.id} value={system.id}>
                      {system.name} ({available} spots available - {utilization.toFixed(0)}% used)
                    </option>
                  );
                })}
              </select>
            </div>
          ))}
        </div>
        
        {/* Assignment Summary */}
        {Object.keys(assignments).length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              Assignments: {Object.values(assignments).filter(v => v).length} of {splitTrays.length} complete
            </p>
          </div>
        )}
      </div>
    );
  }
  
  // Single tray assignment
  return (
    <div className="system-assignment-step">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {step.label || 'Select growing system'}
      </label>
      <select
        value={value?.systemId || ''}
        onChange={(e) => handleSingleAssignment(parseInt(e.target.value))}
        className="system-select w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select system...</option>
        {availableSystems.map(system => {
          const utilization = getUtilizationRate(system);
          const available = (system.capacity || 0) - (system.currentOccupancy || 0);
          const statusColor = getSystemStatusColor(utilization);
          return (
            <option key={system.id} value={system.id}>
              {system.name} - {available} spots available ({utilization.toFixed(0)}% used)
            </option>
          );
        })}
      </select>
      
      {/* System Type Filter Info */}
      {step.config?.systemType && (
        <p className="text-xs text-gray-500 mt-1">
          Showing only {step.config.systemType} systems
        </p>
      )}
      
      {/* Selection Summary */}
      {value?.systemId && (
        <div className="mt-2 p-2 bg-green-50 rounded-md">
          <p className="text-sm text-green-800">
            Selected: {availableSystems.find(s => s.id === value.systemId)?.name}
          </p>
        </div>
      )}
    </div>
  );
};

export default SystemAssignmentStep;