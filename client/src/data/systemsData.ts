export interface SystemSpot {
  id: string;
  occupied: boolean;
  trayId?: string;
  plantType?: string;
  plantedDate?: Date;
  expectedMove?: Date;
}

export interface GrowingSystem {
  id: string;
  name: string;
  type: 'nursery' | 'blackout' | 'ebbFlow' | 'towers' | 'nft' | 'microgreens';
  category: 'microgreens' | 'leafyGreens';
  location: string;
  configuration: {
    sections?: Array<{
      id: string;
      spots: number;
      spotType?: 'ports' | 'slots' | 'spaces';
    }>;
    totalCapacity: number;
    restrictions?: {
      samePerChannel?: boolean; // For NFT
      maxPerTray?: number;
    };
  };
  currentOccupancy: number;
  spots: SystemSpot[];
}

// Initial systems data
export const defaultSystems: { [location: string]: GrowingSystem[] } = {
  'Grow Space': [
    // Microgreen Systems
    {
      id: 'mg-nursery',
      name: 'Microgreen Nursery',
      type: 'nursery',
      category: 'microgreens',
      location: 'Grow Space',
      configuration: {
        totalCapacity: 100
      },
      currentOccupancy: 0,
      spots: Array(100).fill(null).map((_, i) => ({
        id: `nursery-${i + 1}`,
        occupied: false
      }))
    },
    {
      id: 'mg-blackout',
      name: 'Blackout Area',
      type: 'blackout',
      category: 'microgreens',
      location: 'Grow Space',
      configuration: {
        totalCapacity: 200
      },
      currentOccupancy: 0,
      spots: Array(200).fill(null).map((_, i) => ({
        id: `blackout-${i + 1}`,
        occupied: false
      }))
    },
    // Ebb & Flow Systems
    {
      id: 'ebb-flow-a',
      name: 'Ebb & Flow A',
      type: 'ebbFlow',
      category: 'leafyGreens',
      location: 'Grow Space',
      configuration: {
        sections: [{ id: 'A', spots: 16, spotType: 'spaces' }],
        totalCapacity: 16
      },
      currentOccupancy: 0,
      spots: Array(16).fill(null).map((_, i) => ({
        id: `ebb-a-${i + 1}`,
        occupied: false
      }))
    },
    // Tower Systems
    ...Array(7).fill(null).map((_, i) => ({
      id: `tower-a${i + 1}`,
      name: `Tower A${i + 1}`,
      type: 'towers',
      category: 'leafyGreens',
      location: 'Grow Space',
      configuration: {
        totalCapacity: 44,
        sections: [{ id: `A${i + 1}`, spots: 44, spotType: 'ports' }]
      },
      currentOccupancy: 0,
      spots: Array(44).fill(null).map((_, j) => ({
        id: `tower-a${i + 1}-${j + 1}`,
        occupied: false
      }))
    })),
    // NFT Systems
    {
      id: 'nft-1',
      name: 'NFT Shelf 1',
      type: 'nft',
      category: 'leafyGreens',
      location: 'Grow Space',
      configuration: {
        sections: [
          { id: 'CH1', spots: 18, spotType: 'slots' },
          { id: 'CH2', spots: 18, spotType: 'slots' },
          { id: 'CH3', spots: 18, spotType: 'slots' },
          { id: 'CH4', spots: 18, spotType: 'slots' }
        ],
        totalCapacity: 72,
        restrictions: {
          samePerChannel: true
        }
      },
      currentOccupancy: 0,
      spots: Array(72).fill(null).map((_, i) => ({
        id: `nft-1-${Math.floor(i / 18) + 1}-${(i % 18) + 1}`,
        occupied: false
      }))
    }
  ]
};