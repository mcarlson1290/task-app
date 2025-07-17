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
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  resetTasks(): Promise<boolean>;

  // Inventory methods
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  getAllInventoryItems(): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  getLowStockItems(): Promise<InventoryItem[]>;

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
  createRecurringTask(task: InsertRecurringTask): Promise<RecurringTask>;
  updateRecurringTask(id: number, updates: Partial<RecurringTask>): Promise<RecurringTask | undefined>;
  deleteRecurringTask(id: number): Promise<boolean>;

  // Growing systems
  getGrowingSystem(id: number): Promise<GrowingSystem | undefined>;
  getAllGrowingSystems(): Promise<GrowingSystem[]>;
  createGrowingSystem(system: InsertGrowingSystem): Promise<GrowingSystem>;
  updateGrowingSystem(id: number, updates: Partial<GrowingSystem>): Promise<GrowingSystem | undefined>;
  deleteGrowingSystem(id: number): Promise<boolean>;

  // Tray movements
  createTrayMovement(movement: InsertTrayMovement): Promise<TrayMovement>;
  getTrayMovements(trayId: string): Promise<TrayMovement[]>;
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
  
  private currentUserId = 1;
  private currentTaskId = 1;
  private currentInventoryId = 1;
  private currentModuleId = 1;
  private currentProgressId = 1;
  private currentLogId = 1;
  private currentRecurringTaskId = 1;
  private currentGrowingSystemId = 1;
  private currentTrayMovementId = 1;

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Create test users
    const testUsers = [
      { username: "alex", password: "password", name: "Alex Martinez", role: "technician", approved: true },
      { username: "sarah", password: "password", name: "Sarah Johnson", role: "manager", approved: true },
      { username: "mike", password: "password", name: "Mike Chen", role: "corporate", approved: true }
    ];

    testUsers.forEach(user => {
      const newUser: User = {
        ...user,
        id: this.currentUserId++,
        createdAt: new Date(),
        approved: user.approved || null
      };
      this.users.set(newUser.id, newUser);
    });

    // Create sample tasks with different dates
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    const sampleTasks = [
      {
        title: "Seed Arugula Trays",
        description: "Plant arugula seeds in designated trays for microgreens production",
        type: "seeding-microgreens",
        status: "in_progress",
        priority: "high",
        assignedTo: 1,
        createdBy: 2,
        location: null,
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
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        completedAt: null,
        dueDate: today // Due today
      },
      {
        title: "Remove Covers - Microgreens",
        description: "Day 2 blackout removal for proper stem height",
        type: "blackout-tasks",
        status: "pending",
        priority: "high",
        assignedTo: 1,
        createdBy: 2,
        location: null,
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
        dueDate: yesterday // Overdue
      },
      {
        title: "Harvest Spinach",
        description: "Harvest mature spinach plants in leafy greens section",
        type: "harvest-leafy-greens",
        status: "pending",
        priority: "medium",
        assignedTo: 1,
        createdBy: 2,
        location: null,
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
        dueDate: tomorrow // Due tomorrow
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
        title: "Weekly Equipment Check",
        description: "Inspect and maintain growing equipment",
        type: "equipment-maintenance",
        status: "pending",
        priority: "low",
        assignedTo: 1,
        createdBy: 2,
        location: null,
        estimatedTime: 120,
        actualTime: null,
        progress: 0,
        checklist: [
          { id: "1", text: "Check LED panels", completed: false },
          { id: "2", text: "Inspect water pumps", completed: false },
          { id: "3", text: "Clean air filters", completed: false },
          { id: "4", text: "Test temperature sensors", completed: false }
        ] as ChecklistItem[],
        startedAt: null,
        completedAt: null,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago (OVERDUE)
      }
    ];

    sampleTasks.forEach(task => {
      const newTask: Task = {
        ...task,
        id: this.currentTaskId++,
        data: {},
        dueDate: task.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        description: task.description || null,
        location: null, // Always null - no location references
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

    // Create sample inventory items with product codes and seed usage
    const sampleInventory = [
      { 
        name: "Arugula Seeds", 
        category: "seeds", 
        currentStock: 450, 
        minimumStock: 100, 
        unit: "grams", 
        supplier: "Green Thumb Seeds",
        productCode: "ARU",
        ozPerTray: 0.5,
        cropId: 1
      },
      { 
        name: "Romaine Seeds", 
        category: "seeds", 
        currentStock: 1200, 
        minimumStock: 200, 
        unit: "grams", 
        supplier: "Green Thumb Seeds",
        productCode: "ROM",
        ozPerTray: 0.75,
        cropId: 2
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
        cropId: 3
      },
      { 
        name: "Basil Seeds", 
        category: "seeds", 
        currentStock: 300, 
        minimumStock: 50, 
        unit: "grams", 
        supplier: "Green Thumb Seeds",
        productCode: "BAS",
        ozPerTray: 0.25,
        cropId: 4
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
        cropId: 5
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
        cropId: null
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
        cropId: null
      }
    ];

    sampleInventory.forEach(item => {
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

    // Create sample growing systems
    const sampleSystems = [
      {
        name: 'Microgreen Nursery A',
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
        isActive: true
      },
      {
        name: 'Tower System B',
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
        isActive: true
      },
      {
        name: 'Ebb & Flow System C',
        type: 'leafy-green',
        category: 'staging',
        capacity: 100,
        currentOccupancy: 45,
        systemData: {
          channels: [
            { id: 1, capacity: 20, crop: 'Romaine', occupied: ['ROM-001', 'ROM-002'] },
            { id: 2, capacity: 20, crop: 'Arugula', occupied: ['ARU-001'] },
            { id: 3, capacity: 20, crop: null, occupied: [] },
            { id: 4, capacity: 20, crop: 'Basil', occupied: ['BAS-001', 'BAS-002'] },
            { id: 5, capacity: 20, crop: null, occupied: [] }
          ]
        },
        isActive: true
      }
    ];

    sampleSystems.forEach(system => {
      const newSystem: GrowingSystem = {
        ...system,
        id: this.currentGrowingSystemId++,
        createdAt: new Date()
      };
      this.growingSystems.set(newSystem.id, newSystem);
    });

    // Create sample recurring tasks
    const sampleRecurringTasks = [
      {
        title: 'Daily Seeding - Microgreens',
        description: 'Plant daily batch of microgreen seeds',
        type: 'seeding-microgreens',
        frequency: 'daily',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        isActive: true,
        createdBy: 3,
        automation: {
          enabled: true,
          generateTrays: true,
          trayCount: 12,
          cropType: 'microgreen',
          flow: {
            type: 'microgreen' as const,
            stages: [
              { name: 'Nursery', system: 'Microgreen Nursery A', duration: 2, autoMove: true },
              { name: 'Blackout', system: 'Blackout Racks', duration: 2, autoMove: true },
              { name: 'Growing', system: 'Microgreen Racks', duration: 3, autoMove: false }
            ]
          }
        },
        checklistTemplate: {
          steps: [
            { type: 'inventory-select', label: 'Select seed type', inventoryCategory: 'seeds' },
            { type: 'number-input', label: 'Number of trays', min: 1, max: 24, default: 12 },
            { type: 'system-assignment', label: 'Assign to system', systemType: 'nursery' },
            { type: 'instruction', text: 'Prepare trays with growing medium' },
            { type: 'instruction', text: 'Plant seeds evenly across surface' },
            { type: 'instruction', text: 'Label trays with date and crop type' },
            { type: 'data-capture', label: 'Weight of seeds used', dataType: 'weight' }
          ]
        }
      },
      {
        title: 'Weekly Leafy Green Planting',
        description: 'Plant weekly batch of leafy greens',
        type: 'seeding-leafy-greens',
        frequency: 'weekly',
        daysOfWeek: ['monday'],
        isActive: true,
        createdBy: 3,
        automation: {
          enabled: true,
          generateTrays: true,
          trayCount: 8,
          cropType: 'leafy-green',
          flow: {
            type: 'leafy-green' as const,
            stages: [
              { name: 'Nursery', system: 'Leafy Green Nursery', duration: 14, autoMove: true },
              { name: 'Staging', system: 'Ebb & Flow System C', duration: 14, autoMove: true },
              { name: 'Final', system: 'Tower System B', duration: 14, autoMove: false }
            ]
          }
        },
        checklistTemplate: {
          steps: [
            { type: 'inventory-select', label: 'Select leafy green variety', inventoryCategory: 'seeds' },
            { type: 'number-input', label: 'Number of trays', min: 1, max: 20, default: 8 },
            { type: 'system-assignment', label: 'Assign to nursery system', systemType: 'nursery' },
            { type: 'instruction', text: 'Prepare seed trays with rockwool cubes' },
            { type: 'instruction', text: 'Plant 2-3 seeds per cube' },
            { type: 'instruction', text: 'Set up irrigation schedule' },
            { type: 'data-capture', label: 'Germination rate target', dataType: 'percentage' }
          ]
        }
      }
    ];

    sampleRecurringTasks.forEach(task => {
      const newTask: RecurringTask = {
        ...task,
        id: this.currentRecurringTaskId++,
        createdAt: new Date()
      };
      this.recurringTasks.set(newTask.id, newTask);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      createdAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByUser(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.assignedTo === userId);
  }

  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const task: Task = {
      ...insertTask,
      id: this.currentTaskId++,
      createdAt: new Date()
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    console.log("MemStorage updateTask called with id:", id, "updates:", updates);
    const task = this.tasks.get(id);
    if (!task) {
      console.log("Task not found for id:", id);
      return undefined;
    }
    
    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    console.log("MemStorage updateTask result:", updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async resetTasks(): Promise<boolean> {
    // Clear existing tasks
    this.tasks.clear();
    
    // Reset task ID counter
    this.currentTaskId = 1;
    
    // Recreate the original mock tasks
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    const sampleTasks = [
      {
        title: "Seed Arugula Trays",
        description: "Plant arugula seeds in designated trays for microgreens production",
        type: "seeding-microgreens",
        status: "pending",
        priority: "high",
        assignedTo: 1,
        createdBy: 2,
        location: null,
        estimatedTime: 180,
        actualTime: null,
        progress: 0,
        checklist: [
          { id: "1", text: "Prepare seed trays", completed: false },
          { id: "2", text: "Fill with growing medium", completed: false },
          { id: "3", text: "Plant arugula seeds", completed: false },
          { id: "4", text: "Label trays with date", completed: false },
          { id: "5", text: "Place in germination area", completed: false }
        ] as ChecklistItem[],
        startedAt: null,
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
        location: null,
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
      },
      {
        title: "Harvest Lettuce - Section A",
        description: "Harvest mature lettuce from designated growing area",
        type: "harvesting-leafy-greens",
        status: "pending",
        priority: "medium",
        assignedTo: 1,
        createdBy: 2,
        location: null,
        estimatedTime: 90,
        actualTime: null,
        progress: 0,
        checklist: [
          { id: "1", text: "Prepare harvest containers", completed: false },
          { id: "2", text: "Cut lettuce at base", completed: false },
          { id: "3", text: "Weigh and record harvest", completed: false },
          { id: "4", text: "Transport to cold storage", completed: false }
        ] as ChecklistItem[],
        startedAt: null,
        completedAt: null,
        dueDate: tomorrow
      },
      {
        title: "System Maintenance Check",
        description: "Weekly maintenance of growing systems and equipment",
        type: "equipment-monitoring",
        status: "pending",
        priority: "medium",
        assignedTo: 1,
        createdBy: 2,
        location: null,
        estimatedTime: 120,
        actualTime: null,
        progress: 0,
        checklist: [
          { id: "1", text: "Check water pH levels", completed: false },
          { id: "2", text: "Inspect grow lights", completed: false },
          { id: "3", text: "Clean air filters", completed: false },
          { id: "4", text: "Update maintenance log", completed: false }
        ] as ChecklistItem[],
        startedAt: null,
        completedAt: null,
        dueDate: today
      }
    ];

    // Add tasks to storage
    sampleTasks.forEach(taskData => {
      const task: Task = {
        ...taskData,
        id: this.currentTaskId++,
        data: {},
        createdAt: new Date()
      };
      this.tasks.set(task.id, task);
    });

    return true;
  }

  // Inventory methods
  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values());
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const item: InventoryItem = {
      ...insertItem,
      id: this.currentInventoryId++,
      createdAt: new Date()
    };
    this.inventoryItems.set(item.id, item);
    return item;
  }

  async updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const item = this.inventoryItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values()).filter(
      item => item.currentStock <= item.minimumStock
    );
  }

  // Training methods
  async getTrainingModule(id: number): Promise<TrainingModule | undefined> {
    return this.trainingModules.get(id);
  }

  async getAllTrainingModules(): Promise<TrainingModule[]> {
    return Array.from(this.trainingModules.values());
  }

  async createTrainingModule(insertModule: InsertTrainingModule): Promise<TrainingModule> {
    const module: TrainingModule = {
      ...insertModule,
      id: this.currentModuleId++,
      createdAt: new Date()
    };
    this.trainingModules.set(module.id, module);
    return module;
  }

  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values()).filter(
      progress => progress.userId === userId
    );
  }

  async updateUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const key = `${insertProgress.userId}-${insertProgress.moduleId}`;
    const existing = this.userProgress.get(key);
    
    const progress: UserProgress = {
      id: existing?.id || this.currentProgressId++,
      ...insertProgress,
    };
    
    this.userProgress.set(key, progress);
    return progress;
  }

  // Task logs
  async createTaskLog(insertLog: InsertTaskLog): Promise<TaskLog> {
    const log: TaskLog = {
      ...insertLog,
      id: this.currentLogId++,
      timestamp: new Date()
    };
    this.taskLogs.set(log.id, log);
    return log;
  }

  async getTaskLogs(taskId: number): Promise<TaskLog[]> {
    return Array.from(this.taskLogs.values()).filter(log => log.taskId === taskId);
  }

  // Recurring tasks
  async getRecurringTask(id: number): Promise<RecurringTask | undefined> {
    return this.recurringTasks.get(id);
  }

  async getAllRecurringTasks(): Promise<RecurringTask[]> {
    return Array.from(this.recurringTasks.values());
  }

  async createRecurringTask(insertTask: InsertRecurringTask): Promise<RecurringTask> {
    const task: RecurringTask = {
      ...insertTask,
      id: this.currentRecurringTaskId++,
      createdAt: new Date()
    };
    this.recurringTasks.set(task.id, task);
    return task;
  }

  async updateRecurringTask(id: number, updates: Partial<RecurringTask>): Promise<RecurringTask | undefined> {
    const task = this.recurringTasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...updates };
    this.recurringTasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteRecurringTask(id: number): Promise<boolean> {
    return this.recurringTasks.delete(id);
  }

  // Growing systems
  async getGrowingSystem(id: number): Promise<GrowingSystem | undefined> {
    return this.growingSystems.get(id);
  }

  async getAllGrowingSystems(): Promise<GrowingSystem[]> {
    return Array.from(this.growingSystems.values());
  }

  async createGrowingSystem(insertSystem: InsertGrowingSystem): Promise<GrowingSystem> {
    const system: GrowingSystem = {
      ...insertSystem,
      id: this.currentGrowingSystemId++,
      createdAt: new Date()
    };
    this.growingSystems.set(system.id, system);
    return system;
  }

  async updateGrowingSystem(id: number, updates: Partial<GrowingSystem>): Promise<GrowingSystem | undefined> {
    const system = this.growingSystems.get(id);
    if (!system) return undefined;
    
    const updatedSystem = { ...system, ...updates };
    this.growingSystems.set(id, updatedSystem);
    return updatedSystem;
  }

  async deleteGrowingSystem(id: number): Promise<boolean> {
    return this.growingSystems.delete(id);
  }

  // Tray movements
  async createTrayMovement(insertMovement: InsertTrayMovement): Promise<TrayMovement> {
    const movement: TrayMovement = {
      ...insertMovement,
      id: this.currentTrayMovementId++,
      movedAt: new Date()
    };
    this.trayMovements.set(movement.id, movement);
    return movement;
  }

  async getTrayMovements(trayId: string): Promise<TrayMovement[]> {
    return Array.from(this.trayMovements.values()).filter(movement => movement.trayId === trayId);
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async getTasksByUser(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.assignedTo, userId));
  }

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return task || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async resetTasks(): Promise<boolean> {
    try {
      // Clear existing tasks
      await db.delete(tasks);
      
      // Recreate the original mock tasks
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      
      const sampleTasks = [
        {
          title: "Seed Arugula Trays",
          description: "Plant arugula seeds in designated trays for microgreens production",
          type: "seeding-microgreens",
          status: "pending",
          priority: "high",
          assignedTo: 1,
          createdBy: 2,
          location: null,
          estimatedTime: 180,
          actualTime: null,
          progress: 0,
          checklist: [
            { id: "1", text: "Prepare seed trays", completed: false },
            { id: "2", text: "Fill with growing medium", completed: false },
            { id: "3", text: "Plant arugula seeds", completed: false },
            { id: "4", text: "Label trays with date", completed: false },
            { id: "5", text: "Place in germination area", completed: false }
          ] as ChecklistItem[],
          startedAt: null,
          completedAt: null,
          dueDate: today,
          data: {},
          createdAt: new Date()
        },
        {
          title: "Remove Covers - Microgreens",
          description: "Day 2 blackout removal for proper stem height",
          type: "blackout-tasks",
          status: "pending",
          priority: "high",
          assignedTo: 1,
          createdBy: 2,
          location: null,
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
          dueDate: yesterday,
          data: {},
          createdAt: new Date()
        },
        {
          title: "Harvest Lettuce - Section A",
          description: "Harvest mature lettuce from designated growing area",
          type: "harvesting-leafy-greens",
          status: "pending",
          priority: "medium",
          assignedTo: 1,
          createdBy: 2,
          location: null,
          estimatedTime: 90,
          actualTime: null,
          progress: 0,
          checklist: [
            { id: "1", text: "Prepare harvest containers", completed: false },
            { id: "2", text: "Cut lettuce at base", completed: false },
            { id: "3", text: "Weigh and record harvest", completed: false },
            { id: "4", text: "Transport to cold storage", completed: false }
          ] as ChecklistItem[],
          startedAt: null,
          completedAt: null,
          dueDate: tomorrow,
          data: {},
          createdAt: new Date()
        },
        {
          title: "System Maintenance Check",
          description: "Weekly maintenance of growing systems and equipment",
          type: "equipment-monitoring",
          status: "pending",
          priority: "medium",
          assignedTo: 1,
          createdBy: 2,
          location: null,
          estimatedTime: 120,
          actualTime: null,
          progress: 0,
          checklist: [
            { id: "1", text: "Check water pH levels", completed: false },
            { id: "2", text: "Inspect grow lights", completed: false },
            { id: "3", text: "Clean air filters", completed: false },
            { id: "4", text: "Update maintenance log", completed: false }
          ] as ChecklistItem[],
          startedAt: null,
          completedAt: null,
          dueDate: today,
          data: {},
          createdAt: new Date()
        }
      ];

      // Insert tasks
      await db.insert(tasks).values(sampleTasks);
      return true;
    } catch (error) {
      console.error("Error resetting tasks:", error);
      return false;
    }
  }

  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item || undefined;
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems);
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const [item] = await db.insert(inventoryItems).values(insertItem).returning();
    return item;
  }

  async updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const [item] = await db.update(inventoryItems).set(updates).where(eq(inventoryItems.id, id)).returning();
    return item || undefined;
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems).where(
      sql`${inventoryItems.currentStock} <= ${inventoryItems.minimumStock}`
    );
  }

  async getTrainingModule(id: number): Promise<TrainingModule | undefined> {
    const [module] = await db.select().from(trainingModules).where(eq(trainingModules.id, id));
    return module || undefined;
  }

  async getAllTrainingModules(): Promise<TrainingModule[]> {
    return await db.select().from(trainingModules);
  }

  async createTrainingModule(insertModule: InsertTrainingModule): Promise<TrainingModule> {
    const [module] = await db.insert(trainingModules).values(insertModule).returning();
    return module;
  }

  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async updateUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const existing = await db.select().from(userProgress).where(
      and(
        eq(userProgress.userId, insertProgress.userId!),
        eq(userProgress.moduleId, insertProgress.moduleId!)
      )
    );

    if (existing.length > 0) {
      const [updated] = await db.update(userProgress)
        .set(insertProgress)
        .where(eq(userProgress.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userProgress).values(insertProgress).returning();
      return created;
    }
  }

  async createTaskLog(insertLog: InsertTaskLog): Promise<TaskLog> {
    const [log] = await db.insert(taskLogs).values(insertLog).returning();
    return log;
  }

  async getTaskLogs(taskId: number): Promise<TaskLog[]> {
    return await db.select().from(taskLogs).where(eq(taskLogs.taskId, taskId));
  }
}

export const storage = new MemStorage();
