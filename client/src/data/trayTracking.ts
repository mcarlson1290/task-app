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

// Production launch - sample tray data removed for clean start
export const sampleTrays: Tray[] = [];