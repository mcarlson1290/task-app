import { Tray, sampleTrays } from '../data/trayTracking';
import { TrayDataApiService } from './trayApiService';

// Shared service for managing tray data with API persistence
class TrayDataService {
  
  // Load trays from API
  static async loadTrays(): Promise<Tray[]> {
    return await TrayDataApiService.loadTrays();
  }

  // Save trays to API
  static async saveTrays(trays: Tray[]): Promise<void> {
    await TrayDataApiService.saveTrays(trays);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('trayDataUpdated', { 
      detail: { trays } 
    }));
  }

  // Get filtered trays by query (location, system, etc.)
  static async getTraysFiltered(filterFn: (tray: Tray) => boolean): Promise<Tray[]> {
    const allTrays = await this.loadTrays();
    return allTrays.filter(filterFn);
  }

  // Get trays by status
  static async getTraysByStatus(status: Tray['status']): Promise<Tray[]> {
    return this.getTraysFiltered(tray => tray.status === status);
  }

  // Get trays by location
  static async getTraysByLocation(systemId: string): Promise<Tray[]> {
    return this.getTraysFiltered(tray => tray.currentLocation.systemId === systemId);
  }

  // Get trays by crop type
  static async getTraysByCropType(cropType: string): Promise<Tray[]> {
    return this.getTraysFiltered(tray => tray.cropType.toLowerCase() === cropType.toLowerCase());
  }

  // Get trays ready for harvest (based on expected harvest date)
  static async getTraysReadyForHarvest(): Promise<Tray[]> {
    const today = new Date();
    return this.getTraysFiltered(tray => {
      return tray.status === 'growing' && tray.expectedHarvest <= today;
    });
  }

  // Get trays by date range
  static async getTraysByDateRange(startDate: Date, endDate: Date): Promise<Tray[]> {
    return this.getTraysFiltered(tray => {
      return tray.datePlanted >= startDate && tray.datePlanted <= endDate;
    });
  }

  // Search trays by ID or crop type
  static async searchTrays(searchTerm: string): Promise<Tray[]> {
    const term = searchTerm.toLowerCase();
    return this.getTraysFiltered(tray => 
      tray.id.toLowerCase().includes(term) ||
      tray.cropType.toLowerCase().includes(term) ||
      tray.notes.toLowerCase().includes(term) ||
      tray.createdBy.toLowerCase().includes(term)
    );
  }

  // Get all active growing trays (not harvested, discarded, or split)
  static async getActiveTrays(): Promise<Tray[]> {
    return this.getTraysFiltered(tray => 
      tray.status === 'seeded' || 
      tray.status === 'germinating' || 
      tray.status === 'growing' || 
      tray.status === 'ready'
    );
  }

  // Get tray summary statistics
  static async getTrayStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCropType: Record<string, number>;
    readyForHarvest: number;
  }> {
    const allTrays = await this.loadTrays();
    const readyTrays = await this.getTraysReadyForHarvest();
    
    const byStatus: Record<string, number> = {};
    const byCropType: Record<string, number> = {};
    
    allTrays.forEach(tray => {
      byStatus[tray.status] = (byStatus[tray.status] || 0) + 1;
      byCropType[tray.cropType] = (byCropType[tray.cropType] || 0) + 1;
    });
    
    return {
      total: allTrays.length,
      byStatus,
      byCropType,
      readyForHarvest: readyTrays.length
    };
  }
  
  // Add new tray
  static async addTray(tray: Tray): Promise<void> {
    await TrayDataApiService.addTray(tray);
    
    // Dispatch update event
    window.dispatchEvent(new CustomEvent('trayDataUpdated', { 
      detail: { trays: await this.loadTrays() } 
    }));
  }
  
  // Update existing tray
  static async updateTray(updatedTray: Tray): Promise<void> {
    await TrayDataApiService.updateTray(updatedTray);
    
    // Dispatch update event
    window.dispatchEvent(new CustomEvent('trayDataUpdated', { 
      detail: { trays: await this.loadTrays() } 
    }));
  }
  
  // Delete tray
  static async deleteTray(trayId: string): Promise<void> {
    await TrayDataApiService.deleteTray(trayId);
    
    // Dispatch update event
    window.dispatchEvent(new CustomEvent('trayDataUpdated', { 
      detail: { trays: await this.loadTrays() } 
    }));
  }

  // Clear all trays
  static async clearAllTrays(): Promise<void> {
    await TrayDataApiService.clearAllTrays();
    
    // Dispatch update event
    window.dispatchEvent(new CustomEvent('trayDataUpdated', { 
      detail: { trays: [] } 
    }));
  }
}

export default TrayDataService;