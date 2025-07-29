import { promises as fs } from 'fs';
import path from 'path';
import { Task, RecurringTask, InventoryItem } from '@shared/schema';

const DATA_DIR = path.join(process.cwd(), 'data');

export interface PersistenceData {
  tasks: Task[];
  recurringTasks: RecurringTask[];
  inventoryItems: InventoryItem[];
  counters: {
    currentTaskId: number;
    currentRecurringTaskId: number;
    currentInventoryId: number;
  };
}

export class PersistenceManager {
  private static instance: PersistenceManager;
  
  static getInstance(): PersistenceManager {
    if (!PersistenceManager.instance) {
      PersistenceManager.instance = new PersistenceManager();
    }
    return PersistenceManager.instance;
  }

  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.access(DATA_DIR);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
  }

  private getFilePath(filename: string): string {
    return path.join(DATA_DIR, filename);
  }

  async loadData(): Promise<PersistenceData | null> {
    try {
      await this.ensureDataDirectory();
      
      const tasksPath = this.getFilePath('tasks.json');
      const recurringTasksPath = this.getFilePath('recurring_tasks.json');
      const inventoryPath = this.getFilePath('inventory_levels.json');
      const countersPath = this.getFilePath('counters.json');

      let tasks: Task[] = [];
      let recurringTasks: RecurringTask[] = [];
      let inventoryItems: InventoryItem[] = [];
      let counters = {
        currentTaskId: 1,
        currentRecurringTaskId: 1,
        currentInventoryId: 1
      };

      // Load tasks
      try {
        const tasksData = await fs.readFile(tasksPath, 'utf-8');
        tasks = JSON.parse(tasksData);
        console.log(`Loaded ${tasks.length} tasks from persistence`);
      } catch (error) {
        console.log('No existing tasks file found, starting fresh');
      }

      // Load recurring tasks
      try {
        const recurringTasksData = await fs.readFile(recurringTasksPath, 'utf-8');
        recurringTasks = JSON.parse(recurringTasksData);
        console.log(`Loaded ${recurringTasks.length} recurring tasks from persistence`);
      } catch (error) {
        console.log('No existing recurring tasks file found, starting fresh');
      }

      // Load inventory
      try {
        const inventoryData = await fs.readFile(inventoryPath, 'utf-8');
        inventoryItems = JSON.parse(inventoryData);
        console.log(`Loaded ${inventoryItems.length} inventory items from persistence`);
      } catch (error) {
        console.log('No existing inventory file found, starting fresh');
      }

      // Load counters
      try {
        const countersData = await fs.readFile(countersPath, 'utf-8');
        counters = JSON.parse(countersData);
        console.log('Loaded ID counters from persistence');
      } catch (error) {
        console.log('No existing counters file found, using defaults');
      }

      return {
        tasks,
        recurringTasks,
        inventoryItems,
        counters
      };
    } catch (error) {
      console.error('Error loading persistence data:', error);
      return null;
    }
  }

  async saveData(data: PersistenceData): Promise<void> {
    try {
      await this.ensureDataDirectory();

      const promises = [
        fs.writeFile(
          this.getFilePath('tasks.json'),
          JSON.stringify(data.tasks, null, 2),
          'utf-8'
        ),
        fs.writeFile(
          this.getFilePath('recurring_tasks.json'),
          JSON.stringify(data.recurringTasks, null, 2),
          'utf-8'
        ),
        fs.writeFile(
          this.getFilePath('inventory_levels.json'),
          JSON.stringify(data.inventoryItems, null, 2),
          'utf-8'
        ),
        fs.writeFile(
          this.getFilePath('counters.json'),
          JSON.stringify(data.counters, null, 2),
          'utf-8'
        )
      ];

      await Promise.all(promises);
      console.log('Data persisted to disk successfully');
    } catch (error) {
      console.error('Error saving persistence data:', error);
    }
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await this.ensureDataDirectory();
      await fs.writeFile(
        this.getFilePath('tasks.json'),
        JSON.stringify(tasks, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  async saveRecurringTasks(recurringTasks: RecurringTask[]): Promise<void> {
    try {
      await this.ensureDataDirectory();
      await fs.writeFile(
        this.getFilePath('recurring_tasks.json'),
        JSON.stringify(recurringTasks, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error saving recurring tasks:', error);
    }
  }

  async saveInventoryItems(inventoryItems: InventoryItem[]): Promise<void> {
    try {
      await this.ensureDataDirectory();
      await fs.writeFile(
        this.getFilePath('inventory_levels.json'),
        JSON.stringify(inventoryItems, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error saving inventory items:', error);
    }
  }

  async saveCounters(counters: { currentTaskId: number; currentRecurringTaskId: number; currentInventoryId: number }): Promise<void> {
    try {
      await this.ensureDataDirectory();
      await fs.writeFile(
        this.getFilePath('counters.json'),
        JSON.stringify(counters, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error saving counters:', error);
    }
  }
}