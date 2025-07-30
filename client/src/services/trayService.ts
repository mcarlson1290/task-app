// Tray service for managing production trays
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

export const TrayService = {
  // Get all trays from storage
  getAllTrays(): ProductionTray[] {
    try {
      const trays = JSON.parse(localStorage.getItem('productionTrays') || '[]') as ProductionTray[];
      return Array.isArray(trays) ? trays : [];
    } catch (error) {
      console.error('Error loading trays:', error);
      return [];
    }
  },

  // Get all active trays (not split, not harvested)
  getActiveTrays(): ProductionTray[] {
    const trays = this.getAllTrays();
    
    // Filter for active trays only
    return trays.filter(tray => 
      (tray.status === 'active' || 
       tray.status === 'growing' ||
       !tray.status) && // Default to active if no status
      !tray.harvestedAt && 
      !tray.splitFrom // Don't show trays that are already splits
    );
  },
  
  // Search trays by ID or crop type
  searchTrays(searchTerm: string): ProductionTray[] {
    const activeTrays = this.getActiveTrays();
    const term = searchTerm.toLowerCase();
    
    return activeTrays.filter(tray => 
      tray.id.toLowerCase().includes(term) ||
      tray.cropType?.toLowerCase().includes(term) ||
      tray.cropName?.toLowerCase().includes(term)
    );
  },
  
  // Split a tray into multiple
  splitTray(originalTrayId: string, splitCount: number): ProductionTray[] | null {
    const trays = JSON.parse(localStorage.getItem('productionTrays') || '[]') as ProductionTray[];
    const originalTray = trays.find(t => t.id === originalTrayId);
    
    if (!originalTray) return null;
    
    // Create split trays
    const splitTrays: ProductionTray[] = [];
    for (let i = 1; i <= splitCount; i++) {
      splitTrays.push({
        ...originalTray,
        id: `${originalTrayId}-${i}`,
        splitFrom: originalTrayId,
        splitNumber: i,
        splitTotal: splitCount,
        createdAt: new Date().toISOString(),
        // Reset location as splits need to be assigned
        location: undefined,
        systemId: undefined
      });
    }
    
    // Mark original tray as split
    originalTray.status = 'split';
    originalTray.splitInto = splitTrays.map(t => t.id);
    originalTray.splitAt = new Date().toISOString();
    
    // Save all changes
    const updatedTrays = [...trays, ...splitTrays];
    localStorage.setItem('productionTrays', JSON.stringify(updatedTrays));
    
    return splitTrays;
  },

  // Get a specific tray by ID
  getTrayById(trayId: string): ProductionTray | undefined {
    const trays = this.getAllTrays();
    return trays.find(t => t.id === trayId);
  },

  // Create a new tray (from seeding tasks)
  createTray(trayData: Partial<ProductionTray>): ProductionTray {
    const trays = this.getAllTrays();
    
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
    
    trays.push(newTray);
    localStorage.setItem('productionTrays', JSON.stringify(trays));
    
    // Trigger update event for real-time updates
    window.dispatchEvent(new Event('trayUpdated'));
    
    return newTray;
  },

  // Generate tray ID format: K073025-LETT-1A
  generateTrayId(cropType: string): string {
    const date = new Date();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString().substr(2);
    const dateStr = `${month}${day}${year}`;
    const location = 'K'; // Kenosha default
    const type = cropType.substring(0, 4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    
    return `${location}${dateStr}-${type}-${random}`;
  },

  // Validate tray data
  validateTrayData(tray: Partial<ProductionTray>): boolean {
    const required = ['id', 'cropType', 'datePlanted', 'status'];
    const missing = required.filter(field => !tray[field as keyof ProductionTray]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    // Validate status
    const validStatuses = ['active', 'growing', 'harvested', 'split'];
    if (!validStatuses.includes(tray.status!)) {
      throw new Error(`Invalid status: ${tray.status}`);
    }
    
    return true;
  },

  // Create tray from seeding task completion
  createTrayFromSeedingTask(taskData: {
    taskId: number;
    cropType: string;
    cropName?: string;
    seedsUsed?: number;
    location?: string;
    checklistData?: any[];
  }): ProductionTray {
    const tray: ProductionTray = {
      id: this.generateTrayId(taskData.cropType),
      cropType: taskData.cropType,
      cropName: taskData.cropName || taskData.cropType,
      datePlanted: new Date().toISOString().split('T')[0],
      status: 'active',
      location: taskData.location || 'Nursery',
      createdAt: new Date().toISOString()
    };

    // Validate before creating
    this.validateTrayData(tray);
    
    const trays = this.getAllTrays();
    trays.push(tray);
    localStorage.setItem('productionTrays', JSON.stringify(trays));
    
    // Trigger update event
    window.dispatchEvent(new Event('trayUpdated'));
    
    console.log(`Created tray ${tray.id} from seeding task ${taskData.taskId}`);
    return tray;
  },

  // Update tray location (for movement operations)
  updateTrayLocation(trayId: string, newLocation: string, systemId?: string): ProductionTray | null {
    const trays = this.getAllTrays();
    const trayIndex = trays.findIndex(t => t.id === trayId);
    
    if (trayIndex === -1) {
      console.error('Tray not found:', trayId);
      return null;
    }
    
    const oldLocation = trays[trayIndex].location;
    trays[trayIndex] = {
      ...trays[trayIndex],
      location: newLocation,
      systemId: systemId,
      lastMoved: new Date().toISOString()
    };
    
    localStorage.setItem('productionTrays', JSON.stringify(trays));
    
    // Trigger update event
    window.dispatchEvent(new Event('trayUpdated'));
    
    console.log(`Moved tray ${trayId} from ${oldLocation} to ${newLocation}`);
    return trays[trayIndex];
  },

  // Mark tray as harvested
  harvestTray(trayId: string, actualYield?: number): ProductionTray | null {
    const trays = this.getAllTrays();
    const trayIndex = trays.findIndex(t => t.id === trayId);
    
    if (trayIndex === -1) {
      console.error('Tray not found:', trayId);
      return null;
    }
    
    trays[trayIndex] = {
      ...trays[trayIndex],
      status: 'harvested',
      harvestedAt: new Date().toISOString()
    };
    
    localStorage.setItem('productionTrays', JSON.stringify(trays));
    
    // Trigger update event
    window.dispatchEvent(new Event('trayUpdated'));
    
    console.log(`Harvested tray ${trayId}`);
    return trays[trayIndex];
  },

  // Update tray data
  updateTray(trayId: string, updates: Partial<ProductionTray>): ProductionTray | null {
    const trays = this.getAllTrays();
    const trayIndex = trays.findIndex(t => t.id === trayId);
    
    if (trayIndex === -1) {
      console.error('Tray not found:', trayId);
      return null;
    }
    
    trays[trayIndex] = { ...trays[trayIndex], ...updates };
    localStorage.setItem('productionTrays', JSON.stringify(trays));
    
    // Trigger update event
    window.dispatchEvent(new Event('trayUpdated'));
    
    return trays[trayIndex];
  }
};