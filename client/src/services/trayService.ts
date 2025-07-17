// Tray Management Service
export interface Tray {
  id: string;
  cropType: string;
  cropId: number;
  datePlanted: string;
  assignedSystem: string;
  estimatedHarvestDate: string;
  status: string;
  actualYield: number | null;
  harvestDate?: string;
  notes: string;
  createdByTask?: number;
  createdBy?: string;
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
  } else if (combined.includes('broccoli') && combined.includes('microgreen')) {
    return { cropType: 'Broccoli Microgreens', cropId: 2 };
  } else if (combined.includes('arugula')) {
    return { cropType: 'Arugula', cropId: 3 };
  } else if (combined.includes('basil')) {
    return { cropType: 'Basil', cropId: 4 };
  }
  
  return null;
};

// TrayService class for managing trays
export class TrayService {
  private static STORAGE_KEY = 'productionTrays';
  
  // Get all trays from localStorage
  static getTrays(): Tray[] {
    try {
      const trays = localStorage.getItem(this.STORAGE_KEY);
      return trays ? JSON.parse(trays) : [];
    } catch (error) {
      console.error('Error loading trays:', error);
      return [];
    }
  }
  
  // Add new tray
  static addTray(tray: Tray): void {
    try {
      const trays = this.getTrays();
      trays.push(tray);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trays));
      
      // Trigger update event
      window.dispatchEvent(new CustomEvent('trayAdded', { detail: tray }));
    } catch (error) {
      console.error('Error adding tray:', error);
    }
  }
  
  // Update existing tray
  static updateTray(trayId: string, updates: Partial<Tray>): void {
    try {
      const trays = this.getTrays();
      const index = trays.findIndex(t => t.id === trayId);
      if (index !== -1) {
        trays[index] = { ...trays[index], ...updates };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trays));
        
        // Trigger update event
        window.dispatchEvent(new CustomEvent('trayUpdated', { detail: trays[index] }));
      }
    } catch (error) {
      console.error('Error updating tray:', error);
    }
  }
  
  // Generate multiple trays
  static generateMultipleTrays(cropType: string, cropId: number, quantity: number, system: string, taskId?: number, createdBy?: string): Tray[] {
    const trays: Tray[] = [];
    
    for (let i = 0; i < quantity; i++) {
      trays.push({
        id: generateTrayId(cropType),
        cropType,
        cropId,
        datePlanted: new Date().toISOString().split('T')[0],
        assignedSystem: system,
        estimatedHarvestDate: calculateHarvestDate(cropId),
        status: 'growing',
        actualYield: null,
        notes: taskId ? `Created from task ID: ${taskId}` : '',
        createdByTask: taskId,
        createdBy: createdBy
      });
    }
    
    // Add all trays
    try {
      const existingTrays = this.getTrays();
      const updatedTrays = [...existingTrays, ...trays];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedTrays));
      
      // Trigger events for each tray
      trays.forEach(tray => {
        window.dispatchEvent(new CustomEvent('trayAdded', { detail: tray }));
      });
    } catch (error) {
      console.error('Error generating multiple trays:', error);
    }
    
    return trays;
  }
  
  // Create tray from completed seeding task
  static createTrayFromTask(task: any, currentUser: any): Tray | null {
    // Only create trays for seeding tasks
    if (!task.type.includes('seeding') && !task.type.includes('Seeding')) {
      return null;
    }
    
    const cropInfo = detectCropFromTask(task);
    if (!cropInfo) {
      console.warn('Could not detect crop type from task:', task.title);
      return null;
    }
    
    const newTray: Tray = {
      id: generateTrayId(cropInfo.cropType),
      cropType: cropInfo.cropType,
      cropId: cropInfo.cropId,
      datePlanted: new Date().toISOString().split('T')[0],
      assignedSystem: task.location || 'Unassigned',
      estimatedHarvestDate: calculateHarvestDate(cropInfo.cropId),
      status: 'growing',
      actualYield: null,
      notes: `Created from task: ${task.title}`,
      createdByTask: task.id,
      createdBy: currentUser.name
    };
    
    this.addTray(newTray);
    return newTray;
  }
  
  // Initialize trays with some sample data if empty
  static initializeSampleTrays(): void {
    const existingTrays = this.getTrays();
    if (existingTrays.length === 0) {
      const sampleTrays: Tray[] = [
        {
          id: 'K071725-MG-BROC-1C',
          cropType: 'Broccoli Microgreens',
          cropId: 2,
          datePlanted: '2024-03-10',
          assignedSystem: 'Tower 3 - Level A',
          estimatedHarvestDate: '2024-03-17',
          status: 'growing',
          actualYield: null,
          notes: ''
        },
        {
          id: 'K071725-LG-ROM-2A',
          cropType: 'Romaine Lettuce',
          cropId: 1,
          datePlanted: '2024-02-15',
          assignedSystem: 'NFT System 1',
          estimatedHarvestDate: '2024-03-22',
          status: 'growing',
          actualYield: null,
          notes: 'Looking healthy'
        },
        {
          id: 'K071725-LG-ARU-3B',
          cropType: 'Arugula',
          cropId: 3,
          datePlanted: '2024-03-01',
          assignedSystem: 'Tower 2 - Level B',
          estimatedHarvestDate: '2024-03-29',
          status: 'growing',
          actualYield: null,
          notes: ''
        },
        {
          id: 'K071725-MG-BROC-2C',
          cropType: 'Broccoli Microgreens',
          cropId: 2,
          datePlanted: '2024-03-08',
          assignedSystem: 'Tower 3 - Level B',
          estimatedHarvestDate: '2024-03-15',
          status: 'ready-to-harvest',
          actualYield: null,
          notes: 'Ready for harvest'
        },
        {
          id: 'K071725-LG-ROM-1A',
          cropType: 'Romaine Lettuce',
          cropId: 1,
          datePlanted: '2024-02-10',
          assignedSystem: 'NFT System 2',
          estimatedHarvestDate: '2024-03-17',
          status: 'harvested',
          actualYield: 2.3,
          harvestDate: '2024-03-16',
          notes: 'Good yield'
        }
      ];
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sampleTrays));
    }
  }
}