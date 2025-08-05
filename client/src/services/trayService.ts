// Tray service for managing production trays - NOW USING API
import { trayApiService, type ProductionTray } from './trayApiService';

export { type ProductionTray } from './trayApiService';

export const TrayService = {
  // Get all trays from API
  async getAllTrays(): Promise<ProductionTray[]> {
    return await trayApiService.getAllTrays();
  },

  // Get all active trays (not split, not harvested)
  async getActiveTrays(): Promise<ProductionTray[]> {
    const trays = await this.getAllTrays();
    
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
  async searchTrays(searchTerm: string): Promise<ProductionTray[]> {
    const activeTrays = await this.getActiveTrays();
    const term = searchTerm.toLowerCase();
    
    return activeTrays.filter(tray => 
      tray.id.toLowerCase().includes(term) ||
      tray.cropType?.toLowerCase().includes(term) ||
      tray.cropName?.toLowerCase().includes(term)
    );
  },

  // Split tray
  async splitTray(originalTrayId: string, splitCount: number): Promise<ProductionTray[] | null> {
    return await trayApiService.splitTray(originalTrayId, splitCount);
  },

  // Create new tray
  async createTray(trayData: Partial<ProductionTray>): Promise<ProductionTray> {
    return await trayApiService.createTray(trayData);
  },

  // Update tray data
  async updateTray(trayId: string, updates: Partial<ProductionTray>): Promise<ProductionTray | null> {
    return await trayApiService.updateTray(trayId, updates);
  },

  // Delete tray
  async deleteTray(trayId: string): Promise<boolean> {
    return await trayApiService.deleteTray(trayId);
  },

  // Update tray location (for movement operations)
  async updateTrayLocation(trayId: string, newLocation: string, systemId?: string): Promise<ProductionTray | null> {
    return await trayApiService.updateTrayLocation(trayId, newLocation, systemId);
  },

  // Create tray from seeding task
  async createTrayFromSeeding(taskData: any): Promise<ProductionTray> {
    return await trayApiService.createTrayFromSeeding(taskData);
  },

  // Generate unique tray ID
  generateTrayId(cropType: string): string {
    return trayApiService.generateTrayId(cropType);
  }
};

// Legacy support - alias for compatibility
export const trayService = TrayService;