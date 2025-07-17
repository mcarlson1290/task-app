import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GrowingSystem } from '../data/systemsData';
import { AvailableSpot, findAvailableSpots } from '../utils/systemAvailability';
import { Building, Sparkles, AlertTriangle } from 'lucide-react';

interface SystemAssignmentProps {
  systems: GrowingSystem[];
  systemType: string;
  spotsNeeded: number;
  plantType?: string;
  onAssign: (systemId: string, spotIds: string[]) => void;
  autoSuggest?: boolean;
}

export const SystemAssignment: React.FC<SystemAssignmentProps> = ({
  systems,
  systemType,
  spotsNeeded,
  plantType,
  onAssign,
  autoSuggest = true
}) => {
  const [availableSpots, setAvailableSpots] = useState<AvailableSpot[]>([]);
  const [selectedOption, setSelectedOption] = useState<number>(0);
  
  useEffect(() => {
    const spots = findAvailableSpots(systems, systemType, spotsNeeded, plantType);
    setAvailableSpots(spots);
    
    if (autoSuggest && spots.length > 0) {
      setSelectedOption(0);
    }
  }, [systems, systemType, spotsNeeded, plantType, autoSuggest]);
  
  const handleAssign = () => {
    if (availableSpots[selectedOption]) {
      const selected = availableSpots[selectedOption];
      onAssign(selected.systemId, selected.spotIds);
    }
  };
  
  if (availableSpots.length === 0) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-orange-800">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <p className="font-medium">No Available Spots</p>
              <p className="text-sm text-orange-600">
                No available {systemType} spots for {spotsNeeded} plants
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Select System Assignment
        </CardTitle>
        
        {autoSuggest && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
            <Sparkles className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Recommended based on availability
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {availableSpots.map((spot, index) => {
            const system = systems.find(s => s.id === spot.systemId);
            const utilizationRate = system ? 
              (system.currentOccupancy / system.configuration.totalCapacity) * 100 : 0;
            
            return (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedOption === index 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedOption(index)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked={selectedOption === index}
                      onChange={() => setSelectedOption(index)}
                      className="text-green-600"
                    />
                    <div>
                      <span className="font-medium">{spot.systemName}</span>
                      {spot.section && (
                        <Badge variant="outline" className="ml-2">
                          {spot.section}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600 font-medium">
                      {spot.spotIds.length} spots available
                    </p>
                    <p className="text-xs text-gray-500">
                      {utilizationRate.toFixed(0)}% utilized
                    </p>
                  </div>
                </div>
                
                <Progress 
                  value={utilizationRate} 
                  className="h-2"
                />
              </div>
            );
          })}
        </div>
        
        <Button 
          onClick={handleAssign}
          disabled={selectedOption === null}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          Assign to {availableSpots[selectedOption]?.systemName}
        </Button>
      </CardContent>
    </Card>
  );
};