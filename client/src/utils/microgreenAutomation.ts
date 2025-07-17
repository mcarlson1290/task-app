import { GrowingSystem } from '../data/systemsData';
import { findAvailableSpots, assignToSystem } from './systemAvailability';

export interface MicrogreenFlow {
  trayId: string;
  currentStage: 'nursery' | 'blackout' | 'racks' | 'harvested';
  plantedDate: Date;
  movedToBlackout?: Date;
  movedToRacks?: Date;
  expectedHarvest: Date;
}

export const MICROGREEN_TIMINGS = {
  nurseryDuration: 0, // Same day
  blackoutDuration: 2, // 2 days
  racksDuration: 5, // 5 days on racks
  totalGrowthTime: 7 // Total days
};

export const checkMicrogreenMovements = (
  flows: MicrogreenFlow[],
  systems: GrowingSystem[]
): Array<{ trayId: string; action: string; fromSystem: string; toSystem: string }> => {
  const movements = [];
  const now = new Date();
  
  for (const flow of flows) {
    const daysSincePlanted = Math.floor(
      (now.getTime() - flow.plantedDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (flow.currentStage === 'nursery' && daysSincePlanted >= 0) {
      // Move to blackout immediately
      movements.push({
        trayId: flow.trayId,
        action: 'move',
        fromSystem: 'nursery',
        toSystem: 'blackout'
      });
    } else if (flow.currentStage === 'blackout' && daysSincePlanted >= 2) {
      // Move to racks after 2 days
      movements.push({
        trayId: flow.trayId,
        action: 'move',
        fromSystem: 'blackout',
        toSystem: 'racks'
      });
    }
  }
  
  return movements;
};

export const executeMicrogreenMovement = (
  movement: { trayId: string; fromSystem: string; toSystem: string },
  systems: GrowingSystem[]
): { success: boolean; updatedSystems?: GrowingSystem[]; error?: string } => {
  try {
    const fromSystem = systems.find(s => s.type === movement.fromSystem);
    const toSystemType = movement.toSystem;
    
    if (!fromSystem) {
      return { success: false, error: 'Source system not found' };
    }
    
    // Find the tray in source system
    const traySpot = fromSystem.spots.find(s => s.trayId === movement.trayId);
    if (!traySpot) {
      return { success: false, error: 'Tray not found in source system' };
    }
    
    // Find available spot in destination
    const availableSpots = findAvailableSpots(
      systems,
      toSystemType,
      1,
      traySpot.plantType
    );
    
    if (availableSpots.length === 0) {
      return { 
        success: false, 
        error: `No available spots in ${toSystemType}` 
      };
    }
    
    // Execute movement
    const updatedSystems = systems.map(system => {
      if (system.id === fromSystem.id) {
        // Remove from source
        return {
          ...system,
          spots: system.spots.map(spot => 
            spot.id === traySpot.id 
              ? { ...spot, occupied: false, trayId: undefined, plantType: undefined }
              : spot
          ),
          currentOccupancy: system.currentOccupancy - 1
        };
      } else if (system.id === availableSpots[0].systemId) {
        // Add to destination
        return assignToSystem(
          system,
          [availableSpots[0].spotIds[0]],
          movement.trayId,
          traySpot.plantType || ''
        );
      }
      return system;
    });
    
    return { success: true, updatedSystems };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};