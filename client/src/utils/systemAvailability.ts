import { GrowingSystem, SystemSpot } from '../data/systemsData';

export interface AvailableSpot {
  systemId: string;
  systemName: string;
  spotIds: string[];
  systemType: string;
  section?: string;
}

export const findAvailableSpots = (
  systems: GrowingSystem[],
  systemType: string,
  spotsNeeded: number,
  plantType?: string
): AvailableSpot[] => {
  const availableSpots: AvailableSpot[] = [];
  
  const matchingSystems = systems.filter(s => s.type === systemType);
  
  for (const system of matchingSystems) {
    if (system.type === 'nft' && system.configuration.restrictions?.samePerChannel) {
      // Special handling for NFT channels
      for (const section of system.configuration.sections || []) {
        const channelSpots = system.spots.filter(spot => 
          spot.id.includes(section.id) && !spot.occupied
        );
        
        // Check if channel is empty or has same plant type
        const occupiedInChannel = system.spots.filter(spot =>
          spot.id.includes(section.id) && spot.occupied
        );
        
        if (channelSpots.length >= spotsNeeded && 
            (occupiedInChannel.length === 0 || 
             occupiedInChannel.every(s => s.plantType === plantType))) {
          availableSpots.push({
            systemId: system.id,
            systemName: system.name,
            spotIds: channelSpots.slice(0, spotsNeeded).map(s => s.id),
            systemType: system.type,
            section: section.id
          });
        }
      }
    } else {
      // Regular system handling
      const freeSpots = system.spots.filter(spot => !spot.occupied);
      
      if (freeSpots.length >= spotsNeeded) {
        availableSpots.push({
          systemId: system.id,
          systemName: system.name,
          spotIds: freeSpots.slice(0, spotsNeeded).map(s => s.id),
          systemType: system.type
        });
      }
    }
  }
  
  // Sort by most available space first
  return availableSpots.sort((a, b) => b.spotIds.length - a.spotIds.length);
};

export const assignToSystem = (
  system: GrowingSystem,
  spotIds: string[],
  trayId: string,
  plantType: string
): GrowingSystem => {
  const updatedSpots = system.spots.map(spot => {
    if (spotIds.includes(spot.id)) {
      return {
        ...spot,
        occupied: true,
        trayId,
        plantType,
        plantedDate: new Date()
      };
    }
    return spot;
  });
  
  return {
    ...system,
    spots: updatedSpots,
    currentOccupancy: updatedSpots.filter(s => s.occupied).length
  };
};