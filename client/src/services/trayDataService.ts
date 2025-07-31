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
  
  // Split tray implementation with multi-variety support
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
    
    // Create split trays with variety distribution
    const splitTrays: Tray[] = [];
    
    // Calculate variety distribution if original tray has varieties
    let varietyDistribution: any[] = [];
    if (originalTray.varieties && originalTray.varieties.length > 0) {
      varietyDistribution = originalTray.varieties.map(variety => {
        const baseQuantityPerTray = Math.floor(variety.quantity / splitCount);
        const remainder = variety.quantity % splitCount;
        
        const splits = [];
        for (let i = 0; i < splitCount; i++) {
          const quantity = baseQuantityPerTray + (i < remainder ? 1 : 0);
          splits.push({ trayIndex: i, quantity });
        }
        
        return {
          varietyId: variety.seedId,
          varietyName: variety.seedName,
          sku: variety.sku,
          originalQuantity: variety.quantity,
          splits
        };
      });
    }
    
    for (let i = 1; i <= splitCount; i++) {
      // Calculate varieties for this specific tray
      let trayVarieties: any[] = [];
      let totalPlantsForTray = Math.floor(originalTray.plantCount / splitCount);
      
      if (varietyDistribution.length > 0) {
        trayVarieties = varietyDistribution.map(vd => ({
          seedId: vd.varietyId,
          seedName: vd.varietyName,
          sku: vd.sku,
          quantity: vd.splits[i - 1].quantity,
          seedsOz: 0 // Will be calculated if needed
        })).filter(v => v.quantity > 0);
        
        totalPlantsForTray = trayVarieties.reduce((sum, v) => sum + v.quantity, 0);
      }
      
      const splitTray: Tray = {
        ...originalTray,
        id: `${originalTrayId}-${i}`,
        parentTrayId: originalTrayId,
        status: 'growing',
        plantCount: totalPlantsForTray,
        varieties: trayVarieties.length > 0 ? trayVarieties : undefined,
        cropType: trayVarieties.length > 1 ? 'Mixed Varieties' : (trayVarieties[0]?.seedName || originalTray.cropType),
        notes: `Split ${i} of ${splitCount} from ${originalTrayId}${trayVarieties.length > 0 ? ` - Varieties: ${trayVarieties.map(v => `${v.quantity} ${v.seedName}`).join(', ')}` : ''}`,
        createdDate: new Date(),
        createdBy: 'System (Split Operation)'
      };
      
      splitTrays.push(splitTray);
      console.log('Created split tray with varieties:', splitTray);
    }
    
    // Update original tray - mark as split
    const updatedOriginal: Tray = {
      ...originalTray,
      status: 'split', // Original has been split into multiple trays
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