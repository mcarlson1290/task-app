import { Tray, TrayMovement, generateTrayId } from '../data/trayTracking';
import { GrowingSystem } from '../data/systemsData';
import { findAvailableSpots, assignToSystem } from '../utils/systemAvailability';

export class TrayMovementService {
  // Create new tray from seeding task
  static createTray(
    cropType: string,
    category: 'microgreens' | 'leafyGreens',
    plantCount: number,
    systemId: string,
    spotIds: string[],
    location: string,
    createdBy: string
  ): Tray {
    const cropData = this.getCropData(cropType);
    const trayId = generateTrayId(location, cropType, category);
    
    const newTray: Tray = {
      id: trayId,
      cropType,
      cropCategory: category,
      datePlanted: new Date(),
      expectedHarvest: new Date(Date.now() + cropData.growthTime * 24 * 60 * 60 * 1000),
      status: 'seeded',
      currentLocation: {
        systemId,
        systemType: category === 'microgreens' ? 'nursery' : 'ebbFlow',
        spotIds,
        movedDate: new Date()
      },
      locationHistory: [{
        systemId,
        systemType: category === 'microgreens' ? 'nursery' : 'ebbFlow',
        spotIds,
        movedDate: new Date(),
        movedBy: createdBy,
        reason: 'Initial seeding'
      }],
      plantCount,
      notes: '',
      createdBy,
      createdDate: new Date()
    };
    
    return newTray;
  }
  
  // Move tray to new location
  static moveTray(
    tray: Tray,
    toSystemId: string,
    toSystemType: string,
    toSpotIds: string[],
    movedBy: string,
    reason?: string
  ): Tray {
    const updatedTray: Tray = {
      ...tray,
      currentLocation: {
        systemId: toSystemId,
        systemType: toSystemType,
        spotIds: toSpotIds,
        movedDate: new Date()
      },
      locationHistory: [
        ...tray.locationHistory,
        {
          systemId: toSystemId,
          systemType: toSystemType,
          spotIds: toSpotIds,
          movedDate: new Date(),
          movedBy,
          reason: reason || 'Manual movement'
        }
      ],
      status: this.getStatusForLocation(toSystemType, tray.cropCategory)
    };
    
    return updatedTray;
  }
  
  // Split tray into multiple trays
  static splitTray(
    parentTray: Tray,
    splits: Array<{
      systemId: string;
      systemType: string;
      spotIds: string[];
      plantCount: number;
    }>,
    location: string,
    splitBy: string
  ): { parentTray: Tray; childTrays: Tray[] } {
    const childTrays: Tray[] = [];
    const childTrayIds: string[] = [];
    
    // Create child trays
    splits.forEach((split, index) => {
      const childId = `${parentTray.id}-S${index + 1}`;
      childTrayIds.push(childId);
      
      const childTray: Tray = {
        ...parentTray,
        id: childId,
        parentTrayId: parentTray.id,
        plantCount: split.plantCount,
        currentLocation: {
          systemId: split.systemId,
          systemType: split.systemType,
          spotIds: split.spotIds,
          movedDate: new Date()
        },
        locationHistory: [
          ...parentTray.locationHistory,
          {
            systemId: split.systemId,
            systemType: split.systemType,
            spotIds: split.spotIds,
            movedDate: new Date(),
            movedBy: splitBy,
            reason: `Split from parent tray ${parentTray.id}`
          }
        ],
        status: this.getStatusForLocation(split.systemType, parentTray.cropCategory)
      };
      
      childTrays.push(childTray);
    });
    
    // Update parent tray
    const updatedParentTray: Tray = {
      ...parentTray,
      childTrayIds,
      status: 'harvested', // Parent tray is considered harvested after split
      notes: `${parentTray.notes}\nSplit into ${childTrays.length} trays on ${new Date().toLocaleDateString()}`
    };
    
    return { parentTray: updatedParentTray, childTrays };
  }
  
  // Check for automatic movements (microgreens)
  static checkAutomaticMovements(
    trays: Tray[],
    systems: GrowingSystem[]
  ): TrayMovement[] {
    const movements: TrayMovement[] = [];
    const now = new Date();
    
    trays
      .filter(tray => tray.cropCategory === 'microgreens' && tray.status !== 'harvested')
      .forEach(tray => {
        const daysSincePlanted = Math.floor(
          (now.getTime() - tray.datePlanted.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (tray.currentLocation.systemType === 'nursery' && daysSincePlanted >= 0) {
          // Move to blackout immediately
          movements.push({
            id: `move-${tray.id}-${Date.now()}`,
            trayId: tray.id,
            fromSystem: tray.currentLocation.systemId,
            toSystem: 'blackout',
            movementType: 'automatic',
            scheduledDate: now,
            status: 'pending',
            reason: 'Automatic movement: Nursery to Blackout'
          });
        } else if (tray.currentLocation.systemType === 'blackout' && daysSincePlanted >= 2) {
          // Move to racks after 2 days
          const availableRacks = findAvailableSpots(
            systems.filter(s => s.type === 'microgreens'),
            'microgreens',
            1
          );
          
          if (availableRacks.length > 0) {
            movements.push({
              id: `move-${tray.id}-${Date.now()}`,
              trayId: tray.id,
              fromSystem: tray.currentLocation.systemId,
              toSystem: availableRacks[0].systemId,
              movementType: 'automatic',
              scheduledDate: now,
              status: 'pending',
              reason: 'Automatic movement: Blackout to Racks'
            });
          }
        }
      });
    
    return movements;
  }
  
  private static getStatusForLocation(
    systemType: string,
    category: 'microgreens' | 'leafyGreens'
  ): Tray['status'] {
    if (category === 'microgreens') {
      switch (systemType) {
        case 'nursery': return 'seeded';
        case 'blackout': return 'germinating';
        case 'microgreens': return 'growing';
        default: return 'growing';
      }
    } else {
      switch (systemType) {
        case 'ebbFlow': return 'seeded';
        case 'towers':
        case 'nft': return 'growing';
        default: return 'growing';
      }
    }
  }
  
  private static getCropData(cropType: string) {
    // This would come from your crop configuration
    const cropDatabase: { [key: string]: { growthTime: number } } = {
      'Broccoli Microgreens': { growthTime: 7 },
      'Arugula': { growthTime: 21 },
      'Romaine Lettuce': { growthTime: 28 },
      'Basil': { growthTime: 25 }
    };
    
    return cropDatabase[cropType] || { growthTime: 21 };
  }
}