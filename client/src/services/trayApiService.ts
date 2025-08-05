import { apiRequest } from "@/lib/queryClient";

export interface ProductionTray {
  id: string;
  cropType: string;
  cropName?: string;
  status: 'active' | 'growing' | 'split' | 'harvested';
  location?: string;
  systemId?: string;
  datePlanted?: string;
  harvestedAt?: string;
  lastMoved?: string;
  splitFrom?: string;
  splitNumber?: number;
  splitTotal?: number;
  splitInto?: string[];
  splitAt?: string;
  createdAt: string;
}

export interface TrayVariety {
  seedId: string;
  seedName: string;
  sku: string;
  quantity: number;
  seedsOz: number;
}

export interface Tray {
  id: string;
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
  parentTrayId?: string;
  childTrayIds?: string[];
  plantCount: number;
  varieties?: TrayVariety[];
  notes: string;
  createdBy: string;
  createdDate: Date;
}

// API-based tray service
export const trayApiService = {
  // Get all trays
  async getAllTrays(): Promise<ProductionTray[]> {
    try {
      const trays = await apiRequest("GET", "/api/trays");
      return Array.isArray(trays) ? trays : [];
    } catch (error) {
      console.error('Error loading trays:', error);
      return [];
    }
  },

  // Create new tray
  async createTray(trayData: Partial<ProductionTray>): Promise<ProductionTray> {
    const newTray: ProductionTray = {
      id: trayData.id || this.generateTrayId(trayData.cropType || 'UNKN'),
      cropType: trayData.cropType || 'unknown',
      cropName: trayData.cropName,
      datePlanted: trayData.datePlanted || new Date().toISOString().split('T')[0],
      status: trayData.status || 'active',
      location: trayData.location || 'Nursery',
      createdAt: new Date().toISOString(),
      ...trayData
    };
    
    const createdTray = await apiRequest("POST", "/api/trays", newTray) as ProductionTray;
    return createdTray;
  },

  // Update tray
  async updateTray(trayId: string, updates: Partial<ProductionTray>): Promise<ProductionTray | null> {
    try {
      const updatedTray = await apiRequest("PUT", `/api/trays/${trayId}`, updates) as ProductionTray;
      return updatedTray;
    } catch (error) {
      console.error('Error updating tray:', error);
      return null;
    }
  },

  // Delete tray
  async deleteTray(trayId: string): Promise<boolean> {
    try {
      await apiRequest("DELETE", `/api/trays/${trayId}`);
      return true;
    } catch (error) {
      console.error('Error deleting tray:', error);
      return false;
    }
  },

  // Split tray
  async splitTray(originalTrayId: string, splitCount: number): Promise<ProductionTray[] | null> {
    try {
      const splitTrays = await apiRequest("POST", `/api/trays/${originalTrayId}/split`, { splitCount }) as ProductionTray[];
      return splitTrays;
    } catch (error) {
      console.error('Error splitting tray:', error);
      return null;
    }
  },

  // Generate tray ID
  generateTrayId(cropType: string): string {
    const date = new Date();
    const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getFullYear().toString().slice(-2)}`;
    const cropCode = cropType.substring(0, 4).toUpperCase();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `K${dateStr}-${cropCode}-${random}`;
  },

  // Update tray location
  async updateTrayLocation(trayId: string, newLocation: string, systemId?: string): Promise<ProductionTray | null> {
    const updates = {
      location: newLocation,
      systemId,
      lastMoved: new Date().toISOString()
    };
    
    return this.updateTray(trayId, updates);
  },

  // Create tray from seeding task
  async createTrayFromSeeding(taskData: any): Promise<ProductionTray> {
    const trayId = this.generateTrayId(taskData.cropType || 'SEED');
    
    const tray: ProductionTray = {
      id: trayId,
      cropType: taskData.cropType || 'Unknown',
      cropName: taskData.cropName,
      status: 'active',
      location: taskData.location || 'Nursery',
      systemId: taskData.systemId,
      datePlanted: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    
    return this.createTray(tray);
  }
};

// Advanced tray data service using API
export class TrayDataApiService {
  // Load trays from API
  static async loadTrays(): Promise<Tray[]> {
    try {
      const trays = await apiRequest("GET", "/api/trays") as any[];
      // Convert to proper Tray format with Date objects
      return trays.map((tray: any) => ({
        ...tray,
        datePlanted: new Date(tray.datePlanted),
        expectedHarvest: new Date(tray.expectedHarvest),
        createdDate: new Date(tray.createdDate),
        currentLocation: {
          ...tray.currentLocation,
          movedDate: new Date(tray.currentLocation?.movedDate || new Date())
        },
        locationHistory: (tray.locationHistory || []).map((history: any) => ({
          ...history,
          movedDate: new Date(history.movedDate)
        }))
      }));
    } catch (error) {
      console.error('Error loading tray data from API:', error);
      return [];
    }
  }

  // Save trays to API
  static async saveTrays(trays: Tray[]): Promise<void> {
    try {
      // Save each tray individually via API
      await Promise.all(trays.map(tray => 
        apiRequest("POST", "/api/trays", tray)
      ));
      console.log('Saved', trays.length, 'trays to API');
    } catch (error) {
      console.error('Error saving tray data to API:', error);
    }
  }

  // Add new tray
  static async addTray(tray: Tray): Promise<void> {
    try {
      await apiRequest("POST", "/api/trays", tray);
    } catch (error) {
      console.error('Error adding tray:', error);
    }
  }

  // Update existing tray
  static async updateTray(updatedTray: Tray): Promise<void> {
    try {
      await apiRequest("PUT", `/api/trays/${updatedTray.id}`, updatedTray);
    } catch (error) {
      console.error('Error updating tray:', error);
    }
  }

  // Delete tray
  static async deleteTray(trayId: string): Promise<void> {
    try {
      await apiRequest("DELETE", `/api/trays/${trayId}`);
    } catch (error) {
      console.error('Error deleting tray:', error);
    }
  }

  // Clear all trays
  static async clearAllTrays(): Promise<void> {
    try {
      const trays = await this.loadTrays();
      await Promise.all(trays.map(tray => this.deleteTray(tray.id)));
      console.log('All tray data cleared from API');
    } catch (error) {
      console.error('Error clearing tray data:', error);
    }
  }
}