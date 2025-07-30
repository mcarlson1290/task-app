// Growing Systems Configuration and Management
export interface GrowingSystem {
  id: string;
  name: string;
  type: 'tower' | 'nft' | 'ebb-flow' | 'staging';
  capacity: number;
  currentLoad: number;
  location?: string;
}

export interface TrayAssignment {
  systemId: string;
  assignedAt: string;
  assignedBy: number;
}

export const defaultGrowingSystems: GrowingSystem[] = [
  // Towers
  { id: 'tower-1', name: 'Tower 1', type: 'tower', capacity: 50, currentLoad: 0 },
  { id: 'tower-2', name: 'Tower 2', type: 'tower', capacity: 50, currentLoad: 0 },
  { id: 'tower-3', name: 'Tower 3', type: 'tower', capacity: 50, currentLoad: 0 },
  
  // NFT Channels
  { id: 'nft-1', name: 'NFT Channel 1', type: 'nft', capacity: 20, currentLoad: 0 },
  { id: 'nft-2', name: 'NFT Channel 2', type: 'nft', capacity: 20, currentLoad: 0 },
  { id: 'nft-3', name: 'NFT Channel 3', type: 'nft', capacity: 20, currentLoad: 0 },
  { id: 'nft-4', name: 'NFT Channel 4', type: 'nft', capacity: 20, currentLoad: 0 },
  { id: 'nft-5', name: 'NFT Channel 5', type: 'nft', capacity: 20, currentLoad: 0 },
  
  // Ebb & Flow
  { id: 'ebb-flow-1', name: 'Ebb & Flow Section 1', type: 'ebb-flow', capacity: 100, currentLoad: 0 },
  { id: 'ebb-flow-2', name: 'Ebb & Flow Section 2', type: 'ebb-flow', capacity: 100, currentLoad: 0 },
  
  // Staging Areas
  { id: 'nursery', name: 'Nursery', type: 'staging', capacity: 200, currentLoad: 0 },
  { id: 'blackout', name: 'Blackout Room', type: 'staging', capacity: 150, currentLoad: 0 }
];

// Helper functions
export const getAvailableSystems = (type?: string): GrowingSystem[] => {
  const systems = JSON.parse(localStorage.getItem('growingSystems') || '[]');
  const allSystems = systems.length > 0 ? systems : defaultGrowingSystems;
  
  if (type) {
    return allSystems.filter((s: GrowingSystem) => s.type === type && s.currentLoad < s.capacity);
  }
  
  return allSystems.filter((s: GrowingSystem) => s.currentLoad < s.capacity);
};

export const getAllSystems = (): GrowingSystem[] => {
  const systems = JSON.parse(localStorage.getItem('growingSystems') || '[]');
  return systems.length > 0 ? systems : defaultGrowingSystems;
};

export const assignTrayToSystem = (trayId: string, systemId: string, userId: number = 1): boolean => {
  const systems = getAllSystems();
  const system = systems.find((s: GrowingSystem) => s.id === systemId);
  
  if (system && system.currentLoad < system.capacity) {
    system.currentLoad += 1;
    localStorage.setItem('growingSystems', JSON.stringify(systems));
    
    // Record the assignment
    const assignments = JSON.parse(localStorage.getItem('trayAssignments') || '{}');
    assignments[trayId] = {
      systemId,
      assignedAt: new Date().toISOString(),
      assignedBy: userId
    };
    localStorage.setItem('trayAssignments', JSON.stringify(assignments));
    
    return true;
  }
  
  return false;
};

export const getTrayAssignments = (): Record<string, TrayAssignment> => {
  return JSON.parse(localStorage.getItem('trayAssignments') || '{}');
};

export const removeTrayFromSystem = (trayId: string): boolean => {
  const assignments = getTrayAssignments();
  const assignment = assignments[trayId];
  
  if (assignment) {
    const systems = getAllSystems();
    const system = systems.find((s: GrowingSystem) => s.id === assignment.systemId);
    
    if (system && system.currentLoad > 0) {
      system.currentLoad -= 1;
      localStorage.setItem('growingSystems', JSON.stringify(systems));
    }
    
    delete assignments[trayId];
    localStorage.setItem('trayAssignments', JSON.stringify(assignments));
    
    return true;
  }
  
  return false;
};