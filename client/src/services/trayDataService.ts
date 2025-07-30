import { Tray, sampleTrays } from '../data/trayTracking';

// Shared service for managing tray data with persistence
class TrayDataService {
  private static STORAGE_KEY = 'trayTrackingData';
  
  // Load trays from localStorage or use sample data as fallback
  static loadTrays(): Tray[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((tray: any) => ({
          ...tray,
          datePlanted: new Date(tray.datePlanted),
          expectedHarvest: new Date(tray.expectedHarvest),
          createdDate: new Date(tray.createdDate),
          currentLocation: {
            ...tray.currentLocation,
            movedDate: new Date(tray.currentLocation.movedDate)
          },
          locationHistory: tray.locationHistory.map((history: any) => ({
            ...history,
            movedDate: new Date(history.movedDate)
          }))
        }));
      }
    } catch (error) {
      console.error('Error loading tray data from storage:', error);
    }
    
    // Initialize with sample data if no stored data or error
    console.log('Initializing with sample tray data');
    this.saveTrays(sampleTrays);
    return [...sampleTrays];
  }
  
  // Save trays to localStorage
  static saveTrays(trays: Tray[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trays));
      console.log('Saved', trays.length, 'trays to storage');
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('trayDataUpdated', { 
        detail: { trays } 
      }));
    } catch (error) {
      console.error('Error saving tray data to storage:', error);
    }
  }
  
  // Get active trays (for split operations)
  static getActiveTrays(): Tray[] {
    const allTrays = this.loadTrays();
    return allTrays.filter(tray => 
      tray.status === 'growing' || 
      tray.status === 'germinating' ||
      tray.status === 'ready'
    );
  }
  
  // Split tray implementation with proper persistence
  static splitTray(originalTrayId: string, splitCount: number): { 
    originalTray: Tray | null, 
    splitTrays: Tray[] 
  } {
    console.log('=== TRAY SPLIT DEBUG ===');
    console.log('Splitting tray:', originalTrayId, 'into', splitCount, 'parts');
    
    // Load current data
    const allTrays = this.loadTrays();
    console.log('Current tray data before split:', allTrays.length, 'trays');
    
    // Find original tray
    const originalIndex = allTrays.findIndex(t => t.id === originalTrayId);
    if (originalIndex === -1) {
      console.error('Original tray not found:', originalTrayId);
      return { originalTray: null, splitTrays: [] };
    }
    
    const originalTray = allTrays[originalIndex];
    console.log('Found original tray:', originalTray);
    
    // Create split trays
    const splitTrays: Tray[] = [];
    for (let i = 1; i <= splitCount; i++) {
      const splitTray: Tray = {
        ...originalTray,
        id: `${originalTrayId}-${i}`,
        parentTrayId: originalTrayId,
        status: 'growing', // Split trays are active
        plantCount: Math.floor(originalTray.plantCount / splitCount),
        notes: `Split ${i} of ${splitCount} from ${originalTrayId}`,
        createdDate: new Date(),
        createdBy: 'System (Split Operation)'
      };
      splitTrays.push(splitTray);
      console.log('Created split tray:', splitTray);
    }
    
    // Update original tray - mark as split
    const updatedOriginal: Tray = {
      ...originalTray,
      status: 'discarded', // Original is no longer active after split
      childTrayIds: splitTrays.map(t => t.id),
      notes: `${originalTray.notes} - Split into ${splitCount} trays: ${splitTrays.map(t => t.id).join(', ')}`
    };
    
    // Update the array
    allTrays[originalIndex] = updatedOriginal;
    allTrays.push(...splitTrays);
    
    console.log('Updated original tray:', updatedOriginal);
    console.log('Total trays after split:', allTrays.length);
    
    // Save to storage
    this.saveTrays(allTrays);
    console.log('Split operation completed and saved');
    console.log('=== END TRAY SPLIT DEBUG ===');
    
    return { originalTray: updatedOriginal, splitTrays };
  }
  
  // Add new tray
  static addTray(tray: Tray): void {
    const allTrays = this.loadTrays();
    allTrays.push(tray);
    this.saveTrays(allTrays);
  }
  
  // Update existing tray
  static updateTray(updatedTray: Tray): void {
    const allTrays = this.loadTrays();
    const index = allTrays.findIndex(t => t.id === updatedTray.id);
    if (index !== -1) {
      allTrays[index] = updatedTray;
      this.saveTrays(allTrays);
    }
  }
  
  // Delete tray
  static deleteTray(trayId: string): void {
    const allTrays = this.loadTrays();
    const filteredTrays = allTrays.filter(t => t.id !== trayId);
    this.saveTrays(filteredTrays);
  }
}

export default TrayDataService;