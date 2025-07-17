import React from 'react';
import { GrowingSystem } from '@shared/schema';

export const SystemVisualizer: React.FC<{ system: GrowingSystem }> = ({ system }) => {
  const occupancyPercent = Math.round((system.currentOccupancy / system.capacity) * 100);
  
  if (system.type === 'nursery' || system.type === 'blackout') {
    // Simple staging area visualization
    return (
      <div className="system-viz staging bg-gray-50 p-3 rounded-lg">
        <div className="flex flex-wrap gap-1">
          {Array(Math.min(system.currentOccupancy, 16)).fill(0).map((_, i) => (
            <div 
              key={i} 
              className="w-4 h-4 bg-green-500 rounded-sm"
              title="Occupied spot"
            />
          ))}
          {Array(Math.min(system.capacity - system.currentOccupancy, 16 - Math.min(system.currentOccupancy, 16))).fill(0).map((_, i) => (
            <div 
              key={`empty-${i}`} 
              className="w-4 h-4 bg-gray-200 rounded-sm border border-gray-300"
              title="Empty spot"
            />
          ))}
          {system.currentOccupancy > 16 && (
            <div className="text-xs text-gray-500 mt-1">
              +{system.currentOccupancy - 16} more
            </div>
          )}
        </div>
      </div>
    );
  }

  if (system.type === 'ebbFlow') {
    // Ebb & Flow visualization
    return (
      <div className="system-viz ebb-flow bg-blue-50 p-3 rounded-lg">
        <div className="grid grid-cols-6 gap-1">
          {Array(Math.min(system.capacity, 24)).fill(0).map((_, i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-sm ${
                i < system.currentOccupancy 
                  ? 'bg-blue-500' 
                  : 'bg-gray-200 border border-gray-300'
              }`}
              title={i < system.currentOccupancy ? 'Occupied' : 'Empty'}
            />
          ))}
        </div>
        {system.capacity > 24 && (
          <div className="text-xs text-gray-500 mt-1 text-center">
            Showing 24 of {system.capacity} spots
          </div>
        )}
      </div>
    );
  }

  if (system.type === 'towers') {
    // Tower visualization
    const levels = Math.min(Math.ceil(system.capacity / 8), 6);
    return (
      <div className="system-viz tower bg-green-50 p-3 rounded-lg">
        <div className="flex flex-col-reverse space-y-1">
          {Array(levels).fill(0).map((_, levelIndex) => (
            <div key={levelIndex} className="flex space-x-1">
              {Array(8).fill(0).map((_, spotIndex) => {
                const spotNumber = levelIndex * 8 + spotIndex;
                return (
                  <div
                    key={spotIndex}
                    className={`w-3 h-3 rounded-sm ${
                      spotNumber < system.currentOccupancy 
                        ? 'bg-green-500' 
                        : spotNumber < system.capacity 
                        ? 'bg-gray-200 border border-gray-300' 
                        : 'bg-transparent'
                    }`}
                    title={`Level ${levels - levelIndex}, Spot ${spotIndex + 1}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-1 text-center">
          {levels} levels, {system.capacity} spots
        </div>
      </div>
    );
  }

  if (system.type === 'nft') {
    // NFT Channel visualization
    const channels = Math.min(Math.ceil(system.capacity / 12), 4);
    return (
      <div className="system-viz nft bg-purple-50 p-3 rounded-lg">
        <div className="space-y-2">
          {Array(channels).fill(0).map((_, channelIndex) => (
            <div key={channelIndex} className="flex space-x-1">
              {Array(12).fill(0).map((_, spotIndex) => {
                const spotNumber = channelIndex * 12 + spotIndex;
                return (
                  <div
                    key={spotIndex}
                    className={`w-2 h-4 rounded-sm ${
                      spotNumber < system.currentOccupancy 
                        ? 'bg-purple-500' 
                        : spotNumber < system.capacity 
                        ? 'bg-gray-200 border border-gray-300' 
                        : 'bg-transparent'
                    }`}
                    title={`Channel ${channelIndex + 1}, Spot ${spotIndex + 1}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-1 text-center">
          {channels} channels
        </div>
      </div>
    );
  }

  if (system.type === 'microgreens') {
    // Microgreen rack visualization
    return (
      <div className="system-viz microgreens bg-yellow-50 p-3 rounded-lg">
        <div className="grid grid-cols-8 gap-1">
          {Array(Math.min(system.capacity, 32)).fill(0).map((_, i) => (
            <div 
              key={i} 
              className={`w-3 h-3 rounded-sm ${
                i < system.currentOccupancy 
                  ? 'bg-yellow-500' 
                  : 'bg-gray-200 border border-gray-300'
              }`}
              title={i < system.currentOccupancy ? 'Occupied tray' : 'Empty slot'}
            />
          ))}
        </div>
        {system.capacity > 32 && (
          <div className="text-xs text-gray-500 mt-1 text-center">
            Showing 32 of {system.capacity} spots
          </div>
        )}
      </div>
    );
  }

  // Default visualization
  return (
    <div className="system-viz default bg-gray-50 p-3 rounded-lg">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-6 h-6 bg-gray-300 rounded-full" />
        <div className="text-sm text-gray-600">
          {system.currentOccupancy} / {system.capacity}
        </div>
      </div>
    </div>
  );
};