import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Split, AlertTriangle } from 'lucide-react';
import { Tray } from '../data/trayTracking';
import { GrowingSystem } from '../data/systemsData';
import { findAvailableSpots } from '../utils/systemAvailability';

interface TraySplitInterfaceProps {
  tray: Tray;
  systems: GrowingSystem[];
  onSplit: (splits: Array<{
    systemId: string;
    systemType: string;
    spotIds: string[];
    plantCount: number;
  }>) => void;
  onCancel: () => void;
}

export const TraySplitInterface: React.FC<TraySplitInterfaceProps> = ({
  tray,
  systems,
  onSplit,
  onCancel
}) => {
  const [splits, setSplits] = useState<Array<{
    id: string;
    systemId: string;
    systemType: string;
    plantCount: number;
    availableSpots: any[];
  }>>([
    { id: '1', systemId: '', systemType: 'towers', plantCount: 0, availableSpots: [] },
    { id: '2', systemId: '', systemType: 'towers', plantCount: 0, availableSpots: [] }
  ]);
  
  const totalPlants = tray.plantCount;
  const allocatedPlants = splits.reduce((sum, split) => sum + split.plantCount, 0);
  const remainingPlants = totalPlants - allocatedPlants;
  
  useEffect(() => {
    // Update available spots for each split
    const updatedSplits = splits.map(split => {
      const spots = findAvailableSpots(
        systems,
        split.systemType,
        split.plantCount || 1,
        tray.cropType
      );
      return { ...split, availableSpots: spots };
    });
    setSplits(updatedSplits);
  }, [splits.map(s => `${s.systemType}-${s.plantCount}`).join(','), systems, tray.cropType]);
  
  const handleAddSplit = () => {
    setSplits([
      ...splits,
      {
        id: Date.now().toString(),
        systemId: '',
        systemType: 'towers',
        plantCount: 0,
        availableSpots: []
      }
    ]);
  };
  
  const handleRemoveSplit = (id: string) => {
    setSplits(splits.filter(s => s.id !== id));
  };
  
  const handleUpdateSplit = (id: string, field: string, value: any) => {
    setSplits(splits.map(split =>
      split.id === id ? { ...split, [field]: value } : split
    ));
  };
  
  const handleConfirmSplit = () => {
    const validSplits = splits
      .filter(s => s.systemId && s.plantCount > 0)
      .map(split => {
        const spot = split.availableSpots.find(a => a.systemId === split.systemId);
        return {
          systemId: split.systemId,
          systemType: split.systemType,
          spotIds: spot?.spotIds || [],
          plantCount: split.plantCount
        };
      });
    
    onSplit(validSplits);
  };
  
  const isValid = allocatedPlants === totalPlants && 
    splits.every(s => s.systemId && s.plantCount > 0);
  
  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Split className="w-5 h-5" />
          Split Tray: {tray.id}
        </CardTitle>
        <div className="flex items-center justify-between text-sm">
          <span>Total plants to distribute: <strong>{totalPlants}</strong></span>
          <span className={`px-2 py-1 rounded ${
            remainingPlants === 0 ? 'bg-green-100 text-green-800' : 
            remainingPlants > 0 ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {remainingPlants > 0 ? `${remainingPlants} remaining` : 
             remainingPlants < 0 ? `${Math.abs(remainingPlants)} over-allocated` : 
             'Fully allocated'}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {splits.map((split, index) => (
          <Card key={split.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Destination {index + 1}</h4>
              {splits.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSplit(split.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Minus className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>System Type</Label>
                <Select
                  value={split.systemType}
                  onValueChange={(value) => handleUpdateSplit(split.id, 'systemType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select system type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="towers">Towers</SelectItem>
                    <SelectItem value="nft">NFT</SelectItem>
                    <SelectItem value="ebbFlow">Ebb & Flow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Plant Count</Label>
                <Input
                  type="number"
                  value={split.plantCount || ''}
                  onChange={(e) => handleUpdateSplit(split.id, 'plantCount', parseInt(e.target.value) || 0)}
                  placeholder="Enter plant count"
                  min="1"
                  max={totalPlants}
                />
              </div>
              
              <div>
                <Label>Available Systems</Label>
                <Select
                  value={split.systemId}
                  onValueChange={(value) => handleUpdateSplit(split.id, 'systemId', value)}
                  disabled={split.availableSpots.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select system" />
                  </SelectTrigger>
                  <SelectContent>
                    {split.availableSpots.map((spot) => (
                      <SelectItem key={spot.systemId} value={spot.systemId}>
                        {spot.systemName} ({spot.availableSpots} spots)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {split.availableSpots.length === 0 && split.systemType && (
              <div className="flex items-center gap-2 mt-2 text-amber-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                No available spots for {split.systemType} systems
              </div>
            )}
          </Card>
        ))}
        
        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            onClick={handleAddSplit}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Destination
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSplit}
              disabled={!isValid}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm Split
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};