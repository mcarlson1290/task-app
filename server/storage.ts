import { 
  users, tasks, inventoryItems, trainingModules, userProgress, taskLogs,
  recurringTasks, growingSystems, trayMovements,
  type User, type InsertUser, type Task, type InsertTask, 
  type InventoryItem, type InsertInventoryItem, type TrainingModule,
  type InsertTrainingModule, type UserProgress, type InsertUserProgress,
  type TaskLog, type InsertTaskLog, type ChecklistItem, type RecurringTask,
  type InsertRecurringTask, type GrowingSystem, type InsertGrowingSystem,
  type TrayMovement, type InsertTrayMovement
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Task methods
  getTask(id: number): Promise<Task | undefined>;
  getTasksByUser(userId: number): Promise<Task[]>;
  getAllTasks(): Promise<Task[]>;
  getTasksByLocation(locationId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  resetTasks(): Promise<boolean>;

  // Inventory methods
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  getAllInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItemsByLocation(locationId: string): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  getLowStockItems(): Promise<InventoryItem[]>;
  getLowStockItemsByLocation(locationId: string): Promise<InventoryItem[]>;

  // Training methods
  getTrainingModule(id: number): Promise<TrainingModule | undefined>;
  getAllTrainingModules(): Promise<TrainingModule[]>;
  createTrainingModule(module: InsertTrainingModule): Promise<TrainingModule>;
  getUserProgress(userId: number): Promise<UserProgress[]>;
  updateUserProgress(progress: InsertUserProgress): Promise<UserProgress>;

  // Task logs
  createTaskLog(log: InsertTaskLog): Promise<TaskLog>;
  getTaskLogs(taskId: number): Promise<TaskLog[]>;

  // Recurring tasks
  getRecurringTask(id: number): Promise<RecurringTask | undefined>;
  getAllRecurringTasks(): Promise<RecurringTask[]>;
  getRecurringTasksByLocation(locationId: string): Promise<RecurringTask[]>;
  createRecurringTask(task: InsertRecurringTask): Promise<RecurringTask>;
  updateRecurringTask(id: number, updates: Partial<RecurringTask>): Promise<RecurringTask | undefined>;
  deleteRecurringTask(id: number): Promise<boolean>;

  // Growing systems
  getGrowingSystem(id: number): Promise<GrowingSystem | undefined>;
  getAllGrowingSystems(): Promise<GrowingSystem[]>;
  getGrowingSystemsByLocation(locationId: string): Promise<GrowingSystem[]>;
  createGrowingSystem(system: InsertGrowingSystem): Promise<GrowingSystem>;
  updateGrowingSystem(id: number, updates: Partial<GrowingSystem>): Promise<GrowingSystem | undefined>;
  deleteGrowingSystem(id: number): Promise<boolean>;

  // Tray movements
  createTrayMovement(movement: InsertTrayMovement): Promise<TrayMovement>;
  getTrayMovements(trayId: string): Promise<TrayMovement[]>;
  
  // Clear all data
  clearAllData(): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private tasks: Map<number, Task> = new Map();
  private inventoryItems: Map<number, InventoryItem> = new Map();
  private trainingModules: Map<number, TrainingModule> = new Map();
  private userProgress: Map<string, UserProgress> = new Map(); // key: userId-moduleId
  private taskLogs: Map<number, TaskLog> = new Map();
  private recurringTasks: Map<number, RecurringTask> = new Map();
  private growingSystems: Map<number, GrowingSystem> = new Map();
  private trayMovements: Map<number, TrayMovement> = new Map();
  private crops: Map<number, Crop> = new Map();
  
  private currentUserId = 1;
  private currentTaskId = 1;
  private currentInventoryId = 1;
  private currentModuleId = 1;
  private currentProgressId = 1;
  private currentLogId = 1;
  private currentRecurringTaskId = 1;
  private currentGrowingSystemId = 1;
  private currentTrayMovementId = 1;
  private currentCropId = 1;

  constructor() {
    // Start with empty data - no seeding
  }

  private seedInitialData() {
    // No initial data - start with empty system
  }

  private seedLocationData() {
    // Create location-specific tasks
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    // Kenosha tasks
    const kenoshaTasks = [
      {
        title: "Seed Arugula Trays",
        description: "Plant arugula seeds in designated trays for microgreens production",
        type: "seeding-microgreens",
        status: "in_progress",
        priority: "high",
        assignedTo: 1,
        createdBy: 2,
        location: "K",
        estimatedTime: 180,
        actualTime: 135,
        progress: 60,
        checklist: [
          { id: "1", text: "Prepare seed trays", completed: true },
          { id: "2", text: "Fill with growing medium", completed: true },
          { id: "3", text: "Plant arugula seeds", completed: true },
          { id: "4", text: "Label trays with date", completed: false },
          { id: "5", text: "Place in germination area", completed: false }
        ] as ChecklistItem[],
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        completedAt: null,
        dueDate: today
      },
      {
        title: "Remove Covers - Microgreens",
        description: "Day 2 blackout removal for proper stem height",
        type: "blackout-tasks",
        status: "pending",
        priority: "high",
        assignedTo: 1,
        createdBy: 2,
        location: "K",
        estimatedTime: 45,
        actualTime: null,
        progress: 0,
        checklist: [
          { id: "1", text: "Check seedling height", completed: false },
          { id: "2", text: "Remove blackout covers", completed: false },
          { id: "3", text: "Adjust lighting schedule", completed: false }
        ] as ChecklistItem[],
        startedAt: null,
        completedAt: null,
        dueDate: yesterday
      }
    ];

    // Racine tasks
    const racineTasks = [
      {
        title: "Harvest Spinach",
        description: "Harvest mature spinach plants in leafy greens section",
        type: "harvest-leafy-greens",
        status: "pending",
        priority: "medium",
        assignedTo: 1,
        createdBy: 2,
        location: "R",
        estimatedTime: 150,
        actualTime: null,
        progress: 0,
        checklist: [
          { id: "1", text: "Check plant maturity", completed: false },
          { id: "2", text: "Harvest plants", completed: false, dataCollection: { type: "number", label: "Weight (lbs)" } },
          { id: "3", text: "Clean harvested area", completed: false }
        ] as ChecklistItem[],
        startedAt: null,
        completedAt: null,
        dueDate: tomorrow
      },
      {
        title: "Clean Tower Systems",
        description: "Full sanitization of tower systems",
        type: "cleaning",
        status: "completed",
        priority: "medium",
        assignedTo: 1,
        createdBy: 2,
        location: null,
        estimatedTime: 120,
        actualTime: 105,
        progress: 100,
        checklist: [
          { id: "1", text: "Sanitize towers", completed: true },
          { id: "2", text: "Clean water systems", completed: true },
          { id: "3", text: "Replace filters", completed: true }
        ] as ChecklistItem[],
        completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        dueDate: yesterday // Was due yesterday but completed
      },
      {
        title: "Check Nutrient Levels",
        description: "Monitor and adjust nutrient solution pH and EC levels",
        type: "nutrient-monitoring",
        status: "pending",
        priority: "high",
        assignedTo: 1,
        createdBy: 2,
        location: null,
        estimatedTime: 60,
        actualTime: null,
        progress: 0,
        checklist: [
          { id: "1", text: "Test pH levels", completed: false },
          { id: "2", text: "Test EC levels", completed: false },
          { id: "3", text: "Adjust if needed", completed: false },
          { id: "4", text: "Record readings", completed: false }
        ] as ChecklistItem[],
        startedAt: null,
        completedAt: null,
        dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago (OVERDUE)
      },
      {
        title: "Inventory Count - Seeds",
        description: "Count and update seed inventory levels",
        type: "inventory-count",
        status: "pending",
        priority: "medium",
        assignedTo: 1,
        createdBy: 2,
        location: null,
        estimatedTime: 90,
        actualTime: null,
        progress: 0,
        checklist: [
          { id: "1", text: "Count arugula seeds", completed: false },
          { id: "2", text: "Count pea seeds", completed: false },
          { id: "3", text: "Count radish seeds", completed: false },
          { id: "4", text: "Update inventory system", completed: false }
        ] as ChecklistItem[],
        startedAt: null,
        completedAt: null,
        dueDate: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago (OVERDUE)
      },
      {
        title: "Clean Tower Systems",
        description: "Full sanitization of tower systems",
        type: "cleaning",
        status: "completed",
        priority: "medium",
        assignedTo: 1,
        createdBy: 2,
        location: "R",
        estimatedTime: 120,
        actualTime: 105,
        progress: 100,
        checklist: [
          { id: "1", text: "Sanitize towers", completed: true },
          { id: "2", text: "Clean water systems", completed: true },
          { id: "3", text: "Replace filters", completed: true }
        ] as ChecklistItem[],
        completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        dueDate: yesterday
      }
    ];

    // Create tasks for both locations
    const allTasks = [...kenoshaTasks, ...racineTasks];
    
    allTasks.forEach(task => {
      const newTask: Task = {
        ...task,
        id: this.currentTaskId++,
        data: {},
        dueDate: task.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        description: task.description || null,
        estimatedTime: task.estimatedTime || null,
        actualTime: task.actualTime || null,
        progress: task.progress || 0,
        checklist: task.checklist || null,
        startedAt: task.startedAt || null,
        completedAt: task.completedAt || null,
        assignedTo: task.assignedTo || null,
        createdBy: task.createdBy || null,
        priority: task.priority || null
      };
      this.tasks.set(newTask.id, newTask);
    });

    // Create location-based inventory items
    const kenoshaInventory = [
      { 
        name: "Arugula Seeds", 
        category: "seeds", 
        currentStock: 450, 
        minimumStock: 100, 
        unit: "grams", 
        supplier: "Green Thumb Seeds",
        productCode: "ARU",
        ozPerTray: 0.5,
        cropId: 1,
        location: "K"
      },
      { 
        name: "Broccoli Microgreen Seeds", 
        category: "seeds", 
        currentStock: 800, 
        minimumStock: 150, 
        unit: "grams", 
        supplier: "Green Thumb Seeds",
        productCode: "BROC",
        ozPerTray: 1.0,
        cropId: 3,
        location: "K"
      },
      { 
        name: "Growing Medium", 
        category: "supplies", 
        currentStock: 80, 
        minimumStock: 40, 
        unit: "kg", 
        supplier: "Farm Supply Plus",
        productCode: "GROW-MED",
        ozPerTray: null,
        cropId: null,
        location: "K"
      }
    ];

    const racineInventory = [
      { 
        name: "Romaine Seeds", 
        category: "seeds", 
        currentStock: 1200, 
        minimumStock: 200, 
        unit: "grams", 
        supplier: "Green Thumb Seeds",
        productCode: "ROM",
        ozPerTray: 0.75,
        cropId: 2,
        location: "R"
      },
      { 
        name: "Spinach Seeds", 
        category: "seeds", 
        currentStock: 25, 
        minimumStock: 30, 
        unit: "grams", 
        supplier: "Green Thumb Seeds",
        productCode: "SPI",
        ozPerTray: 0.6,
        cropId: 5,
        location: "R"
      },
      { 
        name: "Nutrient Solution A", 
        category: "nutrients", 
        currentStock: 45, 
        minimumStock: 20, 
        unit: "liters", 
        supplier: "Hydro Nutrients Co",
        productCode: "NUT-A",
        ozPerTray: null,
        cropId: null,
        location: "R"
      }
    ];

    const allInventory = [...kenoshaInventory, ...racineInventory];

    allInventory.forEach(item => {
      const newItem: InventoryItem = {
        ...item,
        id: this.currentInventoryId++,
        lastRestocked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        createdAt: new Date(),
        currentStock: item.currentStock || null,
        minimumStock: item.minimumStock || null,
        supplier: item.supplier || null
      };
      this.inventoryItems.set(newItem.id, newItem);
    });

    // Create location-based growing systems
    const kenoshaGrowingSystems = [
      {
        name: 'Kenosha Microgreen Nursery A',
        type: 'microgreen',
        category: 'nursery',
        capacity: 120,
        currentOccupancy: 75,
        systemData: {
          sections: {
            'A1': { capacity: 60, occupied: ['MG-001', 'MG-002', 'MG-003'] },
            'A2': { capacity: 60, occupied: ['MG-004', 'MG-005'] }
          }
        },
        isActive: true,
        location: "K"
      },
      {
        name: 'Kenosha Blackout System',
        type: 'microgreen',
        category: 'blackout',
        capacity: 100,
        currentOccupancy: 45,
        systemData: {
          sections: {
            'B1': { capacity: 50, occupied: ['BL-001', 'BL-002'] },
            'B2': { capacity: 50, occupied: ['BL-003'] }
          }
        },
        isActive: true,
        location: "K"
      }
    ];

    const racineGrowingSystems = [
      {
        name: 'Racine Tower System B',
        type: 'leafy-green',
        category: 'final',
        capacity: 176,
        currentOccupancy: 88,
        systemData: {
          units: [
            { id: 'B1', type: 'regular', totalPorts: 44, occupiedPorts: ['LG-001', 'LG-002'] },
            { id: 'B2', type: 'regular', totalPorts: 44, occupiedPorts: ['LG-003', 'LG-004'] },
            { id: 'B3', type: 'HD', totalPorts: 176, occupiedPorts: ['LG-005', 'LG-006'] }
          ]
        },
        isActive: true,
        location: "R"
      },
      {
        name: 'Racine Ebb & Flow System C',
        type: 'leafy-green',
        category: 'staging',
        capacity: 100,
        currentOccupancy: 45,
        systemData: {
          channels: [
            { id: 1, capacity: 20, crop: 'Romaine', occupied: ['ROM-001', 'ROM-002'] },
            { id: 2, capacity: 20, crop: 'Spinach', occupied: ['SPI-001'] },
            { id: 3, capacity: 20, crop: null, occupied: [] },
            { id: 4, capacity: 20, crop: 'Basil', occupied: ['BAS-001', 'BAS-002'] },
            { id: 5, capacity: 20, crop: null, occupied: [] }
          ]
        },
        isActive: true,
        location: "R"
      }
    ];

    const allGrowingSystems = [...kenoshaGrowingSystems, ...racineGrowingSystems];

    allGrowingSystems.forEach(system => {
      const newSystem: GrowingSystem = {
        ...system,
        id: this.currentGrowingSystemId++,
        createdAt: new Date()
      };
      this.growingSystems.set(newSystem.id, newSystem);
    });

    // Create sample training modules
    const sampleModules = [
      {
        title: "Basic Seeding Techniques",
        description: "Learn proper seeding procedures for various crops",
        category: "operations",
        content: "Comprehensive guide to seeding best practices...",
        duration: 30,
        requiredForRole: "technician",
        createdBy: 3
      },
      {
        title: "Harvest Quality Control",
        description: "Quality standards and harvest timing",
        category: "quality",
        content: "Quality control procedures for harvesting...",
        duration: 45,
        requiredForRole: "technician",
        createdBy: 3
      }
    ];

    sampleModules.forEach(module => {
      const newModule: TrainingModule = {
        ...module,
        id: this.currentModuleId++,
        createdAt: new Date()
      };
      this.trainingModules.set(newModule.id, newModule);
    });

    // Create recurring tasks for each location
    const kenoshaRecurringTasks = [
      {
        title: "Daily Seed Propagation",
        description: "Daily microgreen seeding tasks",
        type: "seeding-microgreens",
        frequency: "daily",
        daysOfWeek: [1, 2, 3, 4, 5],
        assignedTo: 1,
        createdBy: 2,
        location: "K",
        isActive: true,
        estimatedTime: 120,
        nextOccurrence: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    ];

    const racineRecurringTasks = [
      {
        title: "Weekly Harvest Check",
        description: "Check all leafy greens for harvest readiness",
        type: "harvest-leafy-greens",
        frequency: "weekly",
        daysOfWeek: [1, 3, 5],
        assignedTo: 1,
        createdBy: 2,
        location: "R",
        isActive: true,
        estimatedTime: 90,
        nextOccurrence: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    ];

    const allRecurringTasks = [...kenoshaRecurringTasks, ...racineRecurringTasks];

    allRecurringTasks.forEach(task => {
      const newRecurringTask: RecurringTask = {
        ...task,
        id: this.currentRecurringTaskId++,
        createdAt: new Date()
      };
      this.recurringTasks.set(newRecurringTask.id, newRecurringTask);
    });

    // Create sample crops with location-specific assignments
    const sampleCrops = [
      {
        name: "Arugula",
        category: "microgreens",
        description: "Peppery microgreens",
        growthTime: 7,
        daysToHarvest: 7,
        systemType: "microgreen",
        location: "K"
      },
      {
        name: "Broccoli",
        category: "microgreens",
        description: "Nutrient-rich microgreens",
        growthTime: 5,
        daysToHarvest: 5,
        systemType: "microgreen",
        location: "K"
      },
      {
        name: "Romaine",
        category: "leafy-greens",
        description: "Crisp lettuce variety",
        growthTime: 35,
        daysToHarvest: 35,
        systemType: "leafy-green",
        location: "R"
      },
      {
        name: "Spinach",
        category: "leafy-greens",
        description: "Nutrient-dense leafy green",
        growthTime: 30,
        daysToHarvest: 30,
        systemType: "leafy-green",
        location: "R"
      }
    ];

    sampleCrops.forEach(crop => {
      const newCrop: Crop = {
        ...crop,
        id: this.currentCropId++,
        createdAt: new Date(),
        isActive: true
      };
      this.crops.set(newCrop.id, newCrop);
    });
  }

  // Create user with username
  async createUser(userData: InsertUser): Promise<User> {
    const newUser: User = {
      ...userData,
      id: this.currentUserId++,
      createdAt: new Date(),
      approved: userData.approved || null
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<User | null> {
    return Array.from(this.users.values()).find(user => user.username === username) || null;
  }

  // Get all users
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Update user
  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Tasks methods
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByLocation(location: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.location === location);
  }

  async getTasksByUser(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.assignedTo === userId);
  }

  async getTask(id: number): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const newTask: Task = {
      ...taskData,
      id: this.currentTaskId++,
      createdAt: new Date(),
      data: taskData.data || {}
    };
    this.tasks.set(newTask.id, newTask);
    return newTask;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | null> {
    const task = this.tasks.get(id);
    if (!task) return null;

    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Inventory methods
  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values());
  }

  async getInventoryItemsByLocation(location: string): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values()).filter(item => item.location === location);
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values()).filter(item => 
      item.currentStock !== null && item.minimumStock !== null && item.currentStock <= item.minimumStock
    );
  }

  async getLowStockItemsByLocation(location: string): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values()).filter(item => 
      item.location === location &&
      item.currentStock !== null && item.minimumStock !== null && item.currentStock <= item.minimumStock
    );
  }

  async createInventoryItem(itemData: InsertInventoryItem): Promise<InventoryItem> {
    const newItem: InventoryItem = {
      ...itemData,
      id: this.currentInventoryId++,
      createdAt: new Date()
    };
    this.inventoryItems.set(newItem.id, newItem);
    return newItem;
  }

  async updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
    const item = this.inventoryItems.get(id);
    if (!item) return null;

    const updatedItem = { ...item, ...updates };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }

  // Training methods
  async getAllTrainingModules(): Promise<TrainingModule[]> {
    return Array.from(this.trainingModules.values());
  }

  async getTrainingModule(id: number): Promise<TrainingModule | null> {
    return this.trainingModules.get(id) || null;
  }

  async createTrainingModule(moduleData: InsertTrainingModule): Promise<TrainingModule> {
    const newModule: TrainingModule = {
      ...moduleData,
      id: this.currentModuleId++,
      createdAt: new Date()
    };
    this.trainingModules.set(newModule.id, newModule);
    return newModule;
  }

  // User progress methods
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values()).filter(progress => progress.userId === userId);
  }

  async createUserProgress(progressData: InsertUserProgress): Promise<UserProgress> {
    const newProgress: UserProgress = {
      ...progressData,
      id: this.currentProgressId++,
      createdAt: new Date()
    };
    this.userProgress.set(newProgress.id, newProgress);
    return newProgress;
  }

  async updateUserProgress(id: number, updates: Partial<UserProgress>): Promise<UserProgress | null> {
    const progress = this.userProgress.get(id);
    if (!progress) return null;

    const updatedProgress = { ...progress, ...updates };
    this.userProgress.set(id, updatedProgress);
    return updatedProgress;
  }

  // Task logs methods
  async getTaskLogs(taskId: number): Promise<TaskLog[]> {
    return Array.from(this.taskLogs.values()).filter(log => log.taskId === taskId);
  }

  async createTaskLog(logData: InsertTaskLog): Promise<TaskLog> {
    const newLog: TaskLog = {
      ...logData,
      id: this.currentLogId++,
      createdAt: new Date()
    };
    this.taskLogs.set(newLog.id, newLog);
    return newLog;
  }

  // Recurring tasks methods
  async getAllRecurringTasks(): Promise<RecurringTask[]> {
    return Array.from(this.recurringTasks.values());
  }

  async getRecurringTasksByLocation(location: string): Promise<RecurringTask[]> {
    return Array.from(this.recurringTasks.values()).filter(task => task.location === location);
  }

  async createRecurringTask(taskData: any): Promise<RecurringTask> {
    const newTask: RecurringTask = {
      ...taskData,
      id: this.currentRecurringTaskId++,
      createdAt: new Date()
    };
    this.recurringTasks.set(newTask.id, newTask);
    return newTask;
  }

  async updateRecurringTask(id: number, updates: any): Promise<RecurringTask | null> {
    const task = this.recurringTasks.get(id);
    if (!task) return null;

    const updatedTask = { ...task, ...updates };
    this.recurringTasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteRecurringTask(id: number): Promise<boolean> {
    return this.recurringTasks.delete(id);
  }

  // Growing systems methods
  async getAllGrowingSystems(): Promise<GrowingSystem[]> {
    return Array.from(this.growingSystems.values());
  }

  async getGrowingSystemsByLocation(location: string): Promise<GrowingSystem[]> {
    return Array.from(this.growingSystems.values()).filter(system => system.location === location);
  }

  async createGrowingSystem(systemData: any): Promise<GrowingSystem> {
    const newSystem: GrowingSystem = {
      ...systemData,
      id: this.currentGrowingSystemId++,
      createdAt: new Date()
    };
    this.growingSystems.set(newSystem.id, newSystem);
    return newSystem;
  }

  async updateGrowingSystem(id: number, updates: any): Promise<GrowingSystem | null> {
    const system = this.growingSystems.get(id);
    if (!system) return null;

    const updatedSystem = { ...system, ...updates };
    this.growingSystems.set(id, updatedSystem);
    return updatedSystem;
  }

  async deleteGrowingSystem(id: number): Promise<boolean> {
    return this.growingSystems.delete(id);
  }

  // Crop methods
  async getAllCrops(): Promise<Crop[]> {
    return Array.from(this.crops.values());
  }

  async getCropsByLocation(location: string): Promise<Crop[]> {
    return Array.from(this.crops.values()).filter(crop => crop.location === location);
  }

  async createCrop(cropData: any): Promise<Crop> {
    const newCrop: Crop = {
      ...cropData,
      id: this.currentCropId++,
      createdAt: new Date()
    };
    this.crops.set(newCrop.id, newCrop);
    return newCrop;
  }

  async updateCrop(id: number, updates: any): Promise<Crop | null> {
    const crop = this.crops.get(id);
    if (!crop) return null;

    const updatedCrop = { ...crop, ...updates };
    this.crops.set(id, updatedCrop);
    return updatedCrop;
  }

  async deleteCrop(id: number): Promise<boolean> {
    return this.crops.delete(id);
  }

  // Clear all data method
  async clearAllData(): Promise<boolean> {
    try {
      this.users.clear();
      this.tasks.clear();
      this.inventoryItems.clear();
      this.trainingModules.clear();
      this.userProgress.clear();
      this.taskLogs.clear();
      this.recurringTasks.clear();
      this.growingSystems.clear();
      this.trayMovements.clear();
      this.crops.clear();
      
      // Reset all counters
      this.currentUserId = 1;
      this.currentTaskId = 1;
      this.currentInventoryId = 1;
      this.currentModuleId = 1;
      this.currentProgressId = 1;
      this.currentLogId = 1;
      this.currentRecurringTaskId = 1;
      this.currentGrowingSystemId = 1;
      this.currentTrayMovementId = 1;
      this.currentCropId = 1;
      
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }
}

export const storage = new MemStorage();
