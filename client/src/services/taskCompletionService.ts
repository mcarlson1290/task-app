// Service for handling task completion and tray creation integration
import { TrayService } from './trayService';
import { calculateHarvestDate } from '../data/initialData';

interface TaskCompletionData {
  taskId: number;
  title: string;
  type: string;
  checklistData?: any[];
  completedBy?: number;
}

export const TaskCompletionService = {
  // Handle task completion and create trays for seeding tasks
  handleTaskCompletion(task: TaskCompletionData): void {
    console.log('Processing task completion:', task.title, task.type);
    
    // Check if this is a seeding task
    if (this.isSeedingTask(task.type, task.title)) {
      this.createTraysFromSeedingTask(task);
    }
    
    // Handle other task types that might affect trays
    if (this.isHarvestTask(task.type, task.title)) {
      this.handleHarvestCompletion(task);
    }
    
    if (this.isMovementTask(task.type, task.title)) {
      this.handleMovementCompletion(task);
    }
  },

  // Check if task is a seeding task
  isSeedingTask(taskType: string, taskTitle: string): boolean {
    const seedingTypes = ['seeding', 'seeding - microgreens', 'seeding - leafy greens'];
    const seedingKeywords = ['seed', 'plant', 'sow'];
    
    return (
      seedingTypes.some(type => taskType.toLowerCase().includes(type.toLowerCase())) ||
      seedingKeywords.some(keyword => taskTitle.toLowerCase().includes(keyword))
    );
  },

  // Check if task is a harvest task
  isHarvestTask(taskType: string, taskTitle: string): boolean {
    const harvestTypes = ['harvest', 'harvesting'];
    const harvestKeywords = ['harvest', 'pick', 'collect'];
    
    return (
      harvestTypes.some(type => taskType.toLowerCase().includes(type.toLowerCase())) ||
      harvestKeywords.some(keyword => taskTitle.toLowerCase().includes(keyword))
    );
  },

  // Check if task is a movement task
  isMovementTask(taskType: string, taskTitle: string): boolean {
    const movementTypes = ['moving', 'movement', 'transfer'];
    const movementKeywords = ['move', 'transfer', 'relocate'];
    
    return (
      movementTypes.some(type => taskType.toLowerCase().includes(type.toLowerCase())) ||
      movementKeywords.some(keyword => taskTitle.toLowerCase().includes(keyword))
    );
  },

  // Create trays from seeding task completion
  createTraysFromSeedingTask(task: TaskCompletionData): void {
    try {
      // Extract crop information from task
      const cropType = this.extractCropType(task.title, task.type);
      const cropName = this.extractCropName(task.title);
      const trayCount = this.extractTrayCount(task.checklistData) || 1;
      
      console.log(`Creating ${trayCount} trays for ${cropName} (${cropType})`);
      
      // Create trays
      const createdTrays = [];
      for (let i = 0; i < trayCount; i++) {
        const tray = TrayService.createTrayFromSeedingTask({
          taskId: task.taskId,
          cropType: cropType,
          cropName: cropName,
          location: 'Nursery', // Default starting location
          checklistData: task.checklistData
        });
        createdTrays.push(tray);
      }
      
      console.log(`Successfully created ${createdTrays.length} trays from seeding task`);
    } catch (error) {
      console.error('Error creating trays from seeding task:', error);
    }
  },

  // Extract crop type from task information
  extractCropType(title: string, type: string): string {
    const title_lower = title.toLowerCase();
    const type_lower = type.toLowerCase();
    
    // Check for microgreens
    if (type_lower.includes('microgreen') || title_lower.includes('microgreen')) {
      return 'microgreen';
    }
    
    // Check for leafy greens
    if (type_lower.includes('leafy') || 
        title_lower.includes('lettuce') || 
        title_lower.includes('spinach') || 
        title_lower.includes('arugula') || 
        title_lower.includes('kale')) {
      return 'leafy-green';
    }
    
    // Check for herbs
    if (title_lower.includes('basil') || 
        title_lower.includes('cilantro') || 
        title_lower.includes('parsley')) {
      return 'leafy-green'; // Herbs are treated as leafy greens in our system
    }
    
    // Default to leafy-green
    return 'leafy-green';
  },

  // Extract crop name from task title
  extractCropName(title: string): string {
    // Remove common task prefixes
    let cropName = title
      .replace(/^(seed|plant|sow)\s+/i, '')
      .replace(/\s+(seeds?|seedlings?|plants?)$/i, '')
      .trim();
    
    // Capitalize first letter
    return cropName.charAt(0).toUpperCase() + cropName.slice(1);
  },

  // Extract tray count from checklist data
  extractTrayCount(checklistData?: any[]): number {
    if (!checklistData) return 1;
    
    // Look for number inputs that might indicate tray count
    const trayCountItem = checklistData.find(item => 
      item.label?.toLowerCase().includes('tray') ||
      item.label?.toLowerCase().includes('number') ||
      item.type === 'number-input'
    );
    
    return trayCountItem?.value || 1;
  },

  // Handle harvest task completion
  handleHarvestCompletion(task: TaskCompletionData): void {
    // Implementation for harvest tasks - mark trays as harvested
    console.log('Processing harvest task completion:', task.title);
    // This would be implemented based on checklist data indicating which trays were harvested
  },

  // Handle movement task completion
  handleMovementCompletion(task: TaskCompletionData): void {
    // Implementation for movement tasks - update tray locations
    console.log('Processing movement task completion:', task.title);
    // This would be implemented based on checklist data indicating tray movements
  }
};