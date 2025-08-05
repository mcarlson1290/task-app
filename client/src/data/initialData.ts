// Initial production data for the farm management system
import { ProductionTray } from '../services/trayService';

export const initializeProductionData = (): void => {
  const existingTrays = localStorage.getItem('productionTrays');
  
  // Check if we have fake test data and replace it with authentic data
  let shouldInitialize = false;
  
  if (!existingTrays) {
    shouldInitialize = true;
    console.log('No production data found, initializing clean state for production');
  } else {
    try {
      const trays = JSON.parse(existingTrays);
      // Check for fake test data (IDs like TRAY-001, TRAY-002)
      const hasFakeData = trays.some((tray: any) => tray.id && tray.id.startsWith('TRAY-'));
      if (hasFakeData) {
        shouldInitialize = true;
        console.log('Found test data, clearing for clean production start');
      }
    } catch (error) {
      shouldInitialize = true;
      console.warn('Error parsing existing tray data, initializing clean production state');
    }
  }
  
  if (shouldInitialize) {
    // Production launch - clean start with no initial tray data
    const initialTrays: ProductionTray[] = [];
    
    localStorage.setItem('productionTrays', JSON.stringify(initialTrays));
    console.log('Initialized production data with realistic starting trays:', initialTrays.length);
  }
};

// Calculate expected harvest date based on crop type
export const calculateHarvestDate = (cropType: string, plantedDate: string = new Date().toISOString()): string => {
  const planted = new Date(plantedDate);
  let daysToHarvest = 35; // Default
  
  switch (cropType.toLowerCase()) {
    case 'microgreen':
      daysToHarvest = 7;
      break;
    case 'leafy-green':
      daysToHarvest = 28;
      break;
    case 'herbs':
      daysToHarvest = 42;
      break;
    default:
      daysToHarvest = 35;
  }
  
  const harvestDate = new Date(planted.getTime() + (daysToHarvest * 24 * 60 * 60 * 1000));
  return harvestDate.toISOString().split('T')[0];
};