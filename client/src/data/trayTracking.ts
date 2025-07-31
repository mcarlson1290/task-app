export interface TrayVariety {
  seedId: string;
  seedName: string;
  sku: string;
  quantity: number;
  seedsOz: number;
}

export interface Tray {
  id: string; // e.g., "K071725-MG-BROC-1A"
  barcode?: string;
  cropType: string;
  cropCategory: 'microgreens' | 'leafyGreens';
  datePlanted: Date;
  expectedHarvest: Date;
  status: 'seeded' | 'germinating' | 'growing' | 'ready' | 'harvested' | 'split' | 'discarded';
  currentLocation: {
    systemId: string;
    systemType: string;
    spotIds: string[];
    movedDate: Date;
  };
  locationHistory: Array<{
    systemId: string;
    systemType: string;
    spotIds: string[];
    movedDate: Date;
    movedBy: string;
    reason?: string;
  }>;
  parentTrayId?: string; // For split trays
  childTrayIds?: string[]; // For parent trays that were split
  plantCount: number;
  varieties?: TrayVariety[]; // Multiple crop varieties in one tray
  notes: string;
  createdBy: string;
  createdDate: Date;
}

export interface TrayMovement {
  id: string;
  trayId: string;
  fromSystem: string;
  toSystem: string;
  movementType: 'automatic' | 'manual' | 'split';
  scheduledDate?: Date;
  completedDate?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  reason?: string;
  splitDetails?: {
    parentTrayId: string;
    newTrayIds: string[];
    distribution: Array<{
      trayId: string;
      systemId: string;
      plantCount: number;
    }>;
  };
}

// Tray ID generator
export const generateTrayId = (
  location: string,
  cropType: string,
  category: 'microgreens' | 'leafyGreens'
): string => {
  const locationCode = location.charAt(0).toUpperCase();
  const date = new Date();
  const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getFullYear().toString().slice(-2)}`;
  const categoryCode = category === 'microgreens' ? 'MG' : 'LG';
  const cropCode = cropType.substring(0, 4).toUpperCase();
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const section = String.fromCharCode(65 + Math.floor(Math.random() * 4)); // A-D
  
  return `${locationCode}${dateStr}-${categoryCode}-${cropCode}-${random}${section}`;
};

// Sample tray data
export const sampleTrays: Tray[] = [
  {
    id: "K071725-MG-BROC-01A",
    cropType: "Broccoli Microgreens",
    cropCategory: "microgreens",
    datePlanted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    expectedHarvest: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    status: "growing",
    currentLocation: {
      systemId: "microgreen-rack-a",
      systemType: "microgreens",
      spotIds: ["A1", "A2"],
      movedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    locationHistory: [
      {
        systemId: "nursery-a",
        systemType: "nursery",
        spotIds: ["N1"],
        movedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        movedBy: "John Tech",
        reason: "Initial seeding"
      },
      {
        systemId: "blackout-a",
        systemType: "blackout",
        spotIds: ["B1"],
        movedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        movedBy: "System",
        reason: "Automatic movement: Nursery to Blackout"
      },
      {
        systemId: "microgreen-rack-a",
        systemType: "microgreens",
        spotIds: ["A1", "A2"],
        movedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        movedBy: "System",
        reason: "Automatic movement: Blackout to Racks"
      }
    ],
    plantCount: 200,
    notes: "Healthy growth, ready for harvest soon",
    createdBy: "John Tech",
    createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: "K071825-MV-MIX-03A",
    cropType: "Mixed Varieties",
    cropCategory: "microgreens",
    datePlanted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    expectedHarvest: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    status: "growing",
    currentLocation: {
      systemId: "microgreen-rack-b",
      systemType: "microgreens",
      spotIds: ["B3", "B4"],
      movedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    locationHistory: [
      {
        systemId: "nursery-b",
        systemType: "nursery",
        spotIds: ["N3"],
        movedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        movedBy: "Jane Smith",
        reason: "Initial multi-variety seeding"
      },
      {
        systemId: "blackout-b",
        systemType: "blackout",
        spotIds: ["B3"],
        movedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        movedBy: "System",
        reason: "Automatic movement: Nursery to Blackout"
      },
      {
        systemId: "microgreen-rack-b",
        systemType: "microgreens",
        spotIds: ["B3", "B4"],
        movedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        movedBy: "System",
        reason: "Automatic movement: Blackout to Racks"
      }
    ],
    plantCount: 450,
    varieties: [
      {
        seedId: "1",
        seedName: "Broccoli Microgreens",
        sku: "BROC-MG-001",
        quantity: 150,
        seedsOz: 0.75
      },
      {
        seedId: "2", 
        seedName: "Radish Microgreens",
        sku: "RAD-MG-002",
        quantity: 200,
        seedsOz: 1.0
      },
      {
        seedId: "3",
        seedName: "Kale Microgreens", 
        sku: "KALE-MG-003",
        quantity: 100,
        seedsOz: 0.5
      }
    ],
    notes: "Multi-variety tray: 150 Broccoli (0.75oz), 200 Radish (1.0oz), 100 Kale (0.5oz) - Excellent variety mix",
    createdBy: "Jane Smith",
    createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: "K071725-LG-ROML-02B",
    cropType: "Romaine Lettuce",
    cropCategory: "leafyGreens",
    datePlanted: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    expectedHarvest: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    status: "growing",
    currentLocation: {
      systemId: "tower-system-a",
      systemType: "towers",
      spotIds: ["T1-L1", "T1-L2", "T1-L3"],
      movedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    locationHistory: [
      {
        systemId: "ebb-flow-a",
        systemType: "ebbFlow",
        spotIds: ["E1"],
        movedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        movedBy: "Sarah Manager",
        reason: "Initial seeding"
      },
      {
        systemId: "tower-system-a",
        systemType: "towers",
        spotIds: ["T1-L1", "T1-L2", "T1-L3"],
        movedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        movedBy: "Mike Tech",
        reason: "Transplanted to towers for final growth"
      }
    ],
    plantCount: 24,
    notes: "Transplanted successfully, good root development",
    createdBy: "Sarah Manager",
    createdDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  },
  {
    id: "K071725-MG-ARLL-03C",
    cropType: "Arugula",
    cropCategory: "microgreens",
    datePlanted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    expectedHarvest: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    status: "germinating",
    currentLocation: {
      systemId: "blackout-a",
      systemType: "blackout",
      spotIds: ["B2"],
      movedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    locationHistory: [
      {
        systemId: "nursery-a",
        systemType: "nursery",
        spotIds: ["N2"],
        movedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        movedBy: "John Tech",
        reason: "Initial seeding"
      },
      {
        systemId: "blackout-a",
        systemType: "blackout",
        spotIds: ["B2"],
        movedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        movedBy: "System",
        reason: "Automatic movement: Nursery to Blackout"
      }
    ],
    plantCount: 150,
    notes: "Seeds showing good germination",
    createdBy: "John Tech",
    createdDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  }
];