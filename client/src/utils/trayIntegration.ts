import { TrayMovementService } from '../services/trayMovement';
import { Task, InventoryItem } from '@shared/schema';

export interface TrayCreationData {
  taskId: number;
  cropType: string;
  plantCount: number;
  systemId: string;
  spotIds: string[];
  createdBy: string;
}

export class TrayIntegration {
  // Create tray when seeding task is completed
  static async createTrayFromTask(task: Task, stepData: any): Promise<void> {
    // Only create trays for seeding tasks
    if (!task.type?.includes('seeding')) return;

    const cropType = this.extractCropType(task.title);
    const category = task.type.includes('microgreen') ? 'microgreens' : 'leafyGreens';
    
    // Extract plant count from step data or estimate
    const plantCount = stepData.plantCount || this.estimatePlantCount(task.type, stepData);
    
    // Get system assignment from step data
    const systemAssignment = stepData.systemAssignment || this.getDefaultSystem(category);
    
    try {
      // Create tray record
      const tray = TrayMovementService.createTray(
        cropType,
        category,
        plantCount,
        systemAssignment.systemId,
        systemAssignment.spotIds,
        'K', // Location code - could be extracted from task
        'Current User' // Would come from auth context
      );

      // Send to backend for persistence
      await fetch('/api/trays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tray,
          taskId: task.id,
          timestamp: new Date().toISOString()
        })
      });

      console.log(`Created tray ${tray.id} for task ${task.title}`);
    } catch (error) {
      console.error('Failed to create tray:', error);
    }
  }

  // Extract crop type from task title
  private static extractCropType(title: string): string {
    // Common crop mappings
    const cropMappings: { [key: string]: string } = {
      'arugula': 'Arugula',
      'broccoli': 'Broccoli Microgreens',
      'romaine': 'Romaine Lettuce',
      'lettuce': 'Lettuce',
      'basil': 'Basil',
      'kale': 'Kale',
      'spinach': 'Spinach'
    };

    const lowercaseTitle = title.toLowerCase();
    
    for (const [key, value] of Object.entries(cropMappings)) {
      if (lowercaseTitle.includes(key)) {
        return value;
      }
    }

    // Default fallback
    return 'Mixed Greens';
  }

  // Estimate plant count based on task type and step data
  private static estimatePlantCount(taskType: string, stepData: any): number {
    // Check if plant count was captured in steps
    if (stepData.plantCount) return stepData.plantCount;
    if (stepData.trayCount) return stepData.trayCount * 50; // Assume 50 plants per tray
    
    // Default estimates by crop type
    if (taskType.includes('microgreen')) {
      return 100; // Standard microgreen tray
    } else if (taskType.includes('leafy')) {
      return 24; // Standard leafy green tray
    }
    
    return 50; // Default
  }

  // Get default system for crop category
  private static getDefaultSystem(category: 'microgreens' | 'leafyGreens'): { systemId: string; spotIds: string[] } {
    if (category === 'microgreens') {
      return {
        systemId: 'nursery-a',
        spotIds: ['N1']
      };
    } else {
      return {
        systemId: 'ebb-flow-a',
        spotIds: ['E1']
      };
    }
  }

  // Deduct inventory items used in seeding
  static async deductSeedInventory(task: Task, stepData: any): Promise<void> {
    const cropType = this.extractCropType(task.title);
    
    // Find matching inventory item (using product codes)
    const productCodes: { [key: string]: string } = {
      'Arugula': 'ARU',
      'Broccoli Microgreens': 'BRO',
      'Romaine Lettuce': 'ROM',
      'Basil': 'BAS',
      'Kale': 'KAL',
      'Spinach': 'SPI'
    };

    const productCode = productCodes[cropType];
    if (!productCode) return;

    try {
      // Find inventory item by product code
      const inventoryResponse = await fetch('/api/inventory');
      const inventoryItems: InventoryItem[] = await inventoryResponse.json();
      
      const seedItem = inventoryItems.find(item => 
        item.name.includes(cropType) && item.category === 'seeds'
      );

      if (seedItem) {
        // Deduct seeds used (estimate based on plant count)
        const seedsUsed = stepData.plantCount ? Math.ceil(stepData.plantCount / 10) : 1;
        
        await fetch(`/api/inventory/${seedItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quantity: Math.max(0, seedItem.quantity - seedsUsed)
          })
        });

        console.log(`Deducted ${seedsUsed} units of ${seedItem.name}`);
      }
    } catch (error) {
      console.error('Failed to deduct inventory:', error);
    }
  }
}