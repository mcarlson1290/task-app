// Initial production data for the farm management system
import { ProductionTray } from '../services/trayService';

export const initializeProductionData = (): void => {
  const existingTrays = localStorage.getItem('productionTrays');
  
  // Only initialize if no data exists
  if (!existingTrays || JSON.parse(existingTrays).length === 0) {
    const initialTrays: ProductionTray[] = [
      {
        id: 'K072924-ROM-A1',
        cropType: 'leafy-green',
        cropName: 'Romaine Lettuce',
        datePlanted: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days ago
        status: 'growing',
        location: 'Tower 1',
        systemId: 'tower-1-section-a',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'K073024-BAS-B2',
        cropType: 'leafy-green',
        cropName: 'Sweet Basil',
        datePlanted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
        status: 'growing',
        location: 'NFT Channel 3',
        systemId: 'nft-channel-3',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'K073124-MIC-C3',
        cropType: 'microgreen',
        cropName: 'Broccoli Microgreens',
        datePlanted: new Date().toISOString().split('T')[0], // Today
        status: 'active',
        location: 'Blackout Room',
        systemId: 'blackout-room-shelf-1',
        createdAt: new Date().toISOString()
      },
      {
        id: 'K072824-SPI-D4',
        cropType: 'leafy-green',
        cropName: 'Baby Spinach',
        datePlanted: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 21 days ago
        status: 'growing',
        location: 'Ebb & Flow Section 1',
        systemId: 'ebb-flow-1-tray-4',
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'K072924-ARU-E5',
        cropType: 'leafy-green',
        cropName: 'Arugula',
        datePlanted: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 18 days ago
        status: 'growing',
        location: 'Tower 2',
        systemId: 'tower-2-section-b',
        createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
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