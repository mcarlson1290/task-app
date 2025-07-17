import { Task, User, InventoryItem } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export interface Tray {
  id: string;
  cropType: string;
  cropId: number | null;
  productCode: string;
  seedInventoryId: number | null;
  seedLot?: string;
  datePlanted: string;
  estimatedHarvestDate: string;
  assignedSystem?: string;
  status: 'growing' | 'ready-to-harvest' | 'harvested';
  actualYield?: number;
  expectedYield: number;
  seedsUsedOz: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  taskId: number;
}

export interface Crop {
  id: number;
  name: string;
  category: string;
  expectedYieldPerTray: number;
  averageGrowthTime: number;
  lightRequirements: string;
  status: string;
}

class TrayServiceClass {
  private trays: Map<string, Tray> = new Map();

  async createTrayFromTask(task: Task, user: User | null): Promise<Tray | null> {
    if (!task.type.includes('seeding') && !task.type.includes('Seeding')) {
      return null;
    }

    // Get inventory items
    let inventoryItems: InventoryItem[] = [];
    try {
      const response = await fetch('/api/inventory');
      inventoryItems = await response.json();
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      return null;
    }

    // Find matching seed inventory item
    const seedItem = this.findMatchingSeedItem(task.title, inventoryItems);
    if (!seedItem) {
      console.warn('No matching seed inventory item found for task:', task.title);
      return null;
    }

    // Generate unique tray ID using product code
    const trayId = this.generateTrayId(seedItem);
    
    // Calculate harvest date (typically 7-14 days for microgreens)
    const harvestDate = new Date();
    harvestDate.setDate(harvestDate.getDate() + 10); // 10 days from now
    
    const newTray: Tray = {
      id: trayId,
      cropType: seedItem.name.replace(' Seeds', ''),
      cropId: seedItem.cropId,
      productCode: seedItem.productCode || 'UNKNOWN',
      seedInventoryId: seedItem.id,
      seedLot: 'Unknown', // Could be enhanced with lot tracking
      datePlanted: new Date().toISOString().split('T')[0],
      estimatedHarvestDate: harvestDate.toISOString().split('T')[0],
      assignedSystem: 'Tower 1 - Level A', // Default assignment
      status: 'growing',
      expectedYield: 0.5, // Default expected yield in lbs
      seedsUsedOz: seedItem.ozPerTray || 0.5,
      notes: `Created from task: ${task.title}`,
      createdBy: user?.name || 'Unknown',
      createdAt: new Date().toISOString(),
      taskId: task.id
    };

    // Deduct inventory
    await this.deductInventory(seedItem, newTray.seedsUsedOz);

    this.trays.set(trayId, newTray);
    return newTray;
  }

  private findMatchingSeedItem(taskTitle: string, inventoryItems: InventoryItem[]): InventoryItem | null {
    // Look for seed items only
    const seedItems = inventoryItems.filter(item => item.category === 'seeds');
    
    // Try to match by name
    const cropPatterns = [
      { pattern: /arugula/i, seedName: 'Arugula Seeds' },
      { pattern: /lettuce/i, seedName: 'Lettuce Seeds' },
      { pattern: /spinach/i, seedName: 'Spinach Seeds' },
      { pattern: /kale/i, seedName: 'Kale Seeds' },
      { pattern: /basil/i, seedName: 'Basil Seeds' },
      { pattern: /cilantro/i, seedName: 'Cilantro Seeds' },
      { pattern: /broccoli/i, seedName: 'Broccoli Microgreen Seeds' },
      { pattern: /radish/i, seedName: 'Radish Seeds' },
      { pattern: /pea/i, seedName: 'Pea Seeds' },
      { pattern: /sunflower/i, seedName: 'Sunflower Seeds' },
      { pattern: /romaine/i, seedName: 'Romaine Seeds' }
    ];

    for (const { pattern, seedName } of cropPatterns) {
      if (pattern.test(taskTitle)) {
        const item = seedItems.find(item => item.name === seedName);
        if (item) return item;
      }
    }

    // Default to first available seed item
    return seedItems[0] || null;
  }

  private async deductInventory(seedItem: InventoryItem, ozUsed: number): Promise<void> {
    try {
      // Convert oz to grams
      const gramsUsed = ozUsed * 28.35;
      const newStock = Math.max(0, (seedItem.currentStock || 0) - gramsUsed);
      
      await apiRequest('PATCH', `/api/inventory/${seedItem.id}`, {
        currentStock: Math.round(newStock)
      });

      console.log(`Deducted ${gramsUsed.toFixed(1)}g from ${seedItem.name}. New stock: ${newStock.toFixed(1)}g`);
    } catch (error) {
      console.error('Failed to deduct inventory:', error);
    }
  }

  private generateTrayId(seedItem: InventoryItem): string {
    // Generate ID format: K071725-MG-CROP-1C
    const date = new Date();
    const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getFullYear().toString().slice(-2)}`;
    
    // Determine category code based on seed type
    let categoryCode = 'MG'; // Default to microgreens
    if (seedItem.name.includes('Microgreen')) {
      categoryCode = 'MG';
    } else if (seedItem.category === 'seeds') {
      categoryCode = 'LG'; // Leafy greens
    }
    
    // Use product code from inventory
    const productCode = seedItem.productCode || 'UNKN';
    
    // Generate tray identifier
    const trayNum = Math.floor(Math.random() * 9) + 1;
    const section = String.fromCharCode(65 + Math.floor(Math.random() * 4)); // A-D
    
    return `K${dateStr}-${categoryCode}-${productCode}-${trayNum}${section}`;
  }

  getAllTrays(): Tray[] {
    return Array.from(this.trays.values());
  }

  getTrayById(id: string): Tray | undefined {
    return this.trays.get(id);
  }

  updateTrayStatus(id: string, status: Tray['status'], actualYield?: number): boolean {
    const tray = this.trays.get(id);
    if (!tray) return false;

    tray.status = status;
    if (actualYield !== undefined) {
      tray.actualYield = actualYield;
    }

    this.trays.set(id, tray);
    return true;
  }

  addTray(tray: Tray): void {
    this.trays.set(tray.id, tray);
  }

  deleteTray(id: string): boolean {
    return this.trays.delete(id);
  }

  // Get trays by status
  getTraysByStatus(status: Tray['status']): Tray[] {
    return Array.from(this.trays.values()).filter(tray => tray.status === status);
  }

  // Get trays by crop type
  getTraysByCrop(cropType: string): Tray[] {
    return Array.from(this.trays.values()).filter(tray => tray.cropType === cropType);
  }

  // Get performance metrics
  getPerformanceMetrics() {
    const trays = this.getAllTrays();
    const harvestedTrays = trays.filter(t => t.status === 'harvested' && t.actualYield);
    
    const totalExpected = harvestedTrays.reduce((sum, t) => sum + t.expectedYield, 0);
    const totalActual = harvestedTrays.reduce((sum, t) => sum + (t.actualYield || 0), 0);
    
    return {
      totalTrays: trays.length,
      harvestedTrays: harvestedTrays.length,
      averageYield: harvestedTrays.length > 0 ? totalActual / harvestedTrays.length : 0,
      yieldVariance: totalExpected > 0 ? ((totalActual - totalExpected) / totalExpected) * 100 : 0,
      readyToHarvest: trays.filter(t => t.status === 'ready-to-harvest').length,
      growing: trays.filter(t => t.status === 'growing').length
    };
  }
}

export const TrayService = new TrayServiceClass();

// Generate unique tray ID
export const generateTrayId = (cropType: string, location: string = 'K'): string => {
  const date = new Date();
  const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getFullYear().toString().slice(-2)}`;
  
  // Determine category code
  let categoryCode = 'XX';
  if (cropType.includes('Microgreen') || cropType.includes('microgreen')) {
    categoryCode = 'MG';
  } else if (cropType.includes('Leafy Green') || cropType.includes('Lettuce') || cropType.includes('Arugula')) {
    categoryCode = 'LG';
  } else if (cropType.includes('Herb') || cropType.includes('Basil')) {
    categoryCode = 'HB';
  }
  
  // Get crop abbreviation
  const cropAbbrev = cropType.split(' ')[0].substring(0, 3).toUpperCase();
  
  // Generate random tray number and section
  const trayNum = Math.floor(Math.random() * 9) + 1;
  const section = String.fromCharCode(65 + Math.floor(Math.random() * 4)); // A-D
  
  return `${location}${dateStr}-${categoryCode}-${cropAbbrev}-${trayNum}${section}`;
};

// Calculate harvest date based on crop growth time
export const calculateHarvestDate = (cropId: number): string => {
  const cropGrowthTimes: { [key: number]: number } = {
    1: 35, // Romaine Lettuce
    2: 7,  // Broccoli Microgreens
    3: 28, // Arugula
    4: 42  // Basil
  };
  
  const growthDays = cropGrowthTimes[cropId] || 30;
  const harvestDate = new Date();
  harvestDate.setDate(harvestDate.getDate() + growthDays);
  
  return harvestDate.toISOString().split('T')[0];
};

// Detect crop type from task title or description
export const detectCropFromTask = (task: any): { cropType: string; cropId: number } | null => {
  const title = task.title.toLowerCase();
  const description = task.description?.toLowerCase() || '';
  const combined = `${title} ${description}`;
  
  if (combined.includes('romaine') || combined.includes('lettuce')) {
    return { cropType: 'Romaine Lettuce', cropId: 1 };
  }
  if (combined.includes('broccoli') || combined.includes('microgreen')) {
    return { cropType: 'Broccoli Microgreens', cropId: 2 };
  }
  if (combined.includes('arugula')) {
    return { cropType: 'Arugula', cropId: 3 };
  }
  if (combined.includes('basil')) {
    return { cropType: 'Basil', cropId: 4 };
  }
  
  return null;
};