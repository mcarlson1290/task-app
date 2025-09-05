import { 
  users, tasks, inventoryItems, trainingModules, userProgress, taskLogs,
  recurringTasks, growingSystems, trays, trayMovements, inventoryTransactions, courseAssignments, notifications,
  type User, type InsertUser, type Task, type InsertTask, 
  type InventoryItem, type InsertInventoryItem, type TrainingModule,
  type InsertTrainingModule, type UserProgress, type InsertUserProgress,
  type TaskLog, type InsertTaskLog, type ChecklistItem, type RecurringTask,
  type InsertRecurringTask, type GrowingSystem, type InsertGrowingSystem,
  type Tray, type InsertTray, type TrayMovement, type InsertTrayMovement, type InventoryTransaction,
  type InsertInventoryTransaction, type CourseAssignment, type InsertCourseAssignment,
  type Notification, type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { PersistenceManager } from './persistence';

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
  addInventoryStock(data: { itemId: number; quantity: number; unitCost: number; supplier?: string; notes?: string }): Promise<InventoryItem>;

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
  resetRecurringTasks(): Promise<boolean>;
  regenerateAllTaskInstances(): Promise<{ totalTasksCreated: number; recurringTasksProcessed: number }>;
  regenerateTaskInstances(recurringTaskId: number): Promise<boolean>;

  // Growing systems
  getGrowingSystem(id: number): Promise<GrowingSystem | undefined>;
  getAllGrowingSystems(): Promise<GrowingSystem[]>;
  getGrowingSystemsByLocation(locationId: string): Promise<GrowingSystem[]>;
  createGrowingSystem(system: InsertGrowingSystem): Promise<GrowingSystem>;
  updateGrowingSystem(id: number, updates: Partial<GrowingSystem>): Promise<GrowingSystem | undefined>;
  deleteGrowingSystem(id: number): Promise<boolean>;

  // Trays
  getTray(id: string): Promise<Tray | undefined>;
  getAllTrays(): Promise<Tray[]>;
  getTraysByLocation(locationId: string): Promise<Tray[]>;
  createTray(tray: InsertTray): Promise<Tray>;
  updateTray(id: string, updates: Partial<Tray>): Promise<Tray | undefined>;
  deleteTray(id: string): Promise<boolean>;
  splitTray(originalTrayId: string, splitData: { splitCount: number; newTrayIds: string[] }): Promise<Tray[]>;

  // Tray movements
  createTrayMovement(movement: InsertTrayMovement): Promise<TrayMovement>;
  getTrayMovements(trayId: string): Promise<TrayMovement[]>;

  // Course assignments
  getCourseAssignment(id: number): Promise<CourseAssignment | undefined>;
  getAllCourseAssignments(): Promise<CourseAssignment[]>;
  getCourseAssignmentsByUser(userId: number): Promise<CourseAssignment[]>;
  createCourseAssignment(assignment: InsertCourseAssignment): Promise<CourseAssignment>;
  updateCourseAssignment(id: number, updates: Partial<CourseAssignment>): Promise<CourseAssignment | undefined>;
  deleteCourseAssignment(id: number): Promise<boolean>;

  // Notification methods
  getNotification(id: number): Promise<Notification | undefined>;
  getAllNotifications(): Promise<Notification[]>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: number, updates: Partial<Notification>): Promise<Notification | undefined>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<boolean>;
  
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
  // private crops: Map<number, Crop> = new Map(); // Disabled until Crop type is defined
  private courseAssignments: Map<number, CourseAssignment> = new Map();
  private notifications: Map<number, Notification> = new Map();
  
  private currentUserId = 1;
  private currentTaskId = 1;
  private currentInventoryId = 1;
  private currentModuleId = 1;
  private currentProgressId = 1;
  private currentLogId = 1;
  private currentRecurringTaskId = 1;
  private currentGrowingSystemId = 1;
  private currentTrayMovementId = 1;
  // private currentCropId = 1; // Disabled until Crop type is defined
  private currentAssignmentId = 1;
  private currentNotificationId = 1;

  private persistence = PersistenceManager.getInstance();

  constructor() {
    // Load persisted data asynchronously - this will either load from files or fall back to seed data
    this.loadPersistedData().catch(console.error);
  }

  private async loadPersistedData() {
    console.log('Loading persisted data...');
    const persistedData = await this.persistence.loadData();
    
    if (persistedData) {
      // Restore tasks
      persistedData.tasks.forEach(task => {
        this.tasks.set(task.id, task);
      });
      
      // Restore recurring tasks
      persistedData.recurringTasks.forEach(recurringTask => {
        this.recurringTasks.set(recurringTask.id, recurringTask);
      });
      
      // Restore inventory items
      persistedData.inventoryItems.forEach(item => {
        this.inventoryItems.set(item.id, item);
      });
      
      // Restore counters
      this.currentTaskId = persistedData.counters.currentTaskId;
      this.currentRecurringTaskId = persistedData.counters.currentRecurringTaskId; 
      this.currentInventoryId = persistedData.counters.currentInventoryId;
      
      console.log('Persistence restored:', {
        tasks: persistedData.tasks.length,
        recurringTasks: persistedData.recurringTasks.length,
        inventoryItems: persistedData.inventoryItems.length
      });
      
      // Migrate any "weekly" frequency to "daily" for UI compatibility
      await this.migrateWeeklyFrequencies();
      
      // CRITICAL: Ensure all recurring tasks have their instances generated
      await this.ensureRecurringTaskInstances();
      
      // Initialize inventory if empty (even with persisted data)
      if (this.inventoryItems.size === 0) {
        console.log('Inventory is empty, initializing with seed inventory...');
        this.initializeInventoryData();
      }
    } else {
      console.log('No persisted data found, initializing with seed data');
      this.seedInitialData();
    }
    
    // Always ensure growing systems are initialized (they're not persisted yet)
    if (this.growingSystems.size === 0) {
      console.log('Initializing growing systems...');
      this.initializeGrowingSystems();
    }
  }

  // Migration function to convert "weekly" frequency to "daily" for UI compatibility
  private async migrateWeeklyFrequencies() {
    console.log('=== MIGRATING WEEKLY FREQUENCIES ===');
    let migratedCount = 0;
    
    // Migrate recurring tasks
    for (const [id, recurringTask] of this.recurringTasks) {
      if (recurringTask.frequency === 'weekly') {
        recurringTask.frequency = 'daily';
        migratedCount++;
        console.log(`Migrated recurring task ${id} (${recurringTask.title}) from weekly to daily`);
      }
    }
    
    // Migrate regular task instances
    for (const [id, task] of this.tasks) {
      if (task.frequency === 'weekly') {
        task.frequency = 'daily';
        console.log(`Migrated task ${id} (${task.title}) from weekly to daily`);
      }
    }
    
    if (migratedCount > 0) {
      console.log(`Migration complete: ${migratedCount} recurring tasks migrated`);
      // Save the migrated data
      await this.persistence.saveData({
        tasks: Array.from(this.tasks.values()),
        recurringTasks: Array.from(this.recurringTasks.values()),
        inventoryItems: Array.from(this.inventoryItems.values()),
        counters: {
          currentTaskId: this.currentTaskId,
          currentRecurringTaskId: this.currentRecurringTaskId,
          currentInventoryId: this.currentInventoryId
        }
      });
    } else {
      console.log('No weekly frequencies found to migrate');
    }
  }

  // Ensure all active recurring tasks have proper task instances for current periods
  private async ensureRecurringTaskInstances() {
    console.log('=== ENSURING RECURRING TASK INSTANCES ===');
    const recurringTasks = Array.from(this.recurringTasks.values()).filter(rt => rt.isActive);
    console.log(`Found ${recurringTasks.length} active recurring tasks`);
    
    for (const recurringTask of recurringTasks) {
      console.log(`Checking instances for: ${recurringTask.title} (${recurringTask.frequency})`);
      
      // Count existing instances for this recurring task
      const existingInstances = Array.from(this.tasks.values()).filter(t => t.recurringTaskId === recurringTask.id);
      console.log(`  - Found ${existingInstances.length} existing instances`);
      
      // Check if we need to generate instances for current time period
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let needsGeneration = false;
      
      if (recurringTask.frequency === 'monthly' || recurringTask.frequency === 'bi-weekly') {
        // For monthly/bi-weekly tasks, check if we have tasks for current month
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        
        const currentMonthInstances = existingInstances.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate.getFullYear() === currentYear && dueDate.getMonth() === currentMonth && task.status === 'pending';
        });
        
        console.log(`  - Found ${currentMonthInstances.length} instances for current month (${currentYear}-${currentMonth+1})`);
        
        if (recurringTask.frequency === 'monthly' && currentMonthInstances.length === 0) {
          needsGeneration = true;
        } else if (recurringTask.frequency === 'bi-weekly' && currentMonthInstances.length < 2) {
          needsGeneration = true;
        }
      } else if (recurringTask.frequency === 'daily' && recurringTask.daysOfWeek && recurringTask.daysOfWeek.length > 0) {
        // For daily tasks with specific days, check if we have enough future tasks (30 days ahead)
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 30);
        
        let expectedTasks = 0;
        let currentCheck = new Date(today);
        
        // Count how many tasks we should have in the next 30 days
        while (currentCheck <= endDate) {
          const dayOfWeek = currentCheck.getDay();
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const currentDayName = dayNames[dayOfWeek];
          
          if (recurringTask.daysOfWeek.includes(currentDayName)) {
            expectedTasks++;
          }
          currentCheck.setDate(currentCheck.getDate() + 1);
        }
        
        // Count existing future tasks
        const futureInstances = existingInstances.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate >= today && dueDate <= endDate && task.status === 'pending';
        });
        
        console.log(`  - Expected ${expectedTasks} tasks for next 30 days, found ${futureInstances.length} existing`);
        
        if (futureInstances.length < expectedTasks) {
          needsGeneration = true;
        }
      }
      
      if (needsGeneration) {
        console.log(`  - Generating missing instances for: ${recurringTask.title}`);
        await this.generateTaskInstances(recurringTask);
      } else {
        console.log(`  - All instances up to date for: ${recurringTask.title}`);
      }
    }
    
    console.log('=== RECURRING TASK INSTANCES CHECK COMPLETE ===');
  }

  private async persistData() {
    await this.persistence.saveData({
      tasks: Array.from(this.tasks.values()),
      recurringTasks: Array.from(this.recurringTasks.values()),
      inventoryItems: Array.from(this.inventoryItems.values()),
      counters: {
        currentTaskId: this.currentTaskId,
        currentRecurringTaskId: this.currentRecurringTaskId,
        currentInventoryId: this.currentInventoryId
      }
    });
  }

  private seedInitialData() {
    // Create test users for course assignment testing
    const testUsers = [
      {
        username: "alex_martinez",
        name: "Alex Martinez", 
        role: "technician" as const,
        isApproved: true,
        location: "K"
      },
      {
        username: "dan_wilson",
        name: "Dan Wilson",
        role: "manager" as const, 
        isApproved: true,
        location: "R"
      },
      {
        username: "matt_carlson", 
        name: "Matt Carlson",
        role: "corporate" as const,
        isApproved: true,
        location: "MKE"
      }
    ];

    testUsers.forEach(userData => {
      const user: User = {
        id: this.currentUserId++,
        ...userData,
        password: "test123", // Default password for testing
        approved: userData.isApproved,
        createdAt: new Date(),
        location: userData.location || null
      };
      delete (user as any).isApproved; // Remove the temporary property
      this.users.set(user.id, user);
    });

    // Create some sample notifications for testing
    this.createNotification({
      userId: 1, // Alex Martinez
      type: 'course_assigned',
      title: 'New Training Course Assigned',
      message: 'Dan Wilson assigned you "Basic Safety & Orientation" training',
      relatedId: 1,
      relatedType: 'course',
      isRead: false
    });

    this.createNotification({
      userId: 1, // Alex Martinez 
      type: 'task_overdue',
      title: 'Task Overdue',
      message: 'Seeding Task for Microgreens is now overdue',
      relatedId: 1,
      relatedType: 'task',
      isRead: false
    });

    this.createNotification({
      userId: 2, // Dan Wilson (Manager)
      type: 'inventory_low',
      title: 'Low Stock Alert',
      message: 'Broccoli Seeds is running low (Current: 45 units)',
      relatedId: 1,
      relatedType: 'inventory',
      isRead: false
    });
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
        supplier: item.supplier || null,
        totalValue: null,
        avgCostPerUnit: null
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
        createdAt: new Date(),
        duration: module.duration || null,
        description: module.description || null,
        createdBy: module.createdBy || null,
        requiredForRole: module.requiredForRole || null
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
        createdAt: new Date(),
        checklistTemplate: null,
        dayOfMonth: null,
        automation: null
      };
      this.recurringTasks.set(newRecurringTask.id, newRecurringTask);
    });

    // Note: Crops functionality removed - using existing data sources only
    
    // Initialize growing systems (separated for clarity)
    this.initializeGrowingSystems();
  }
  
  private initializeInventoryData() {
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
        supplier: item.supplier || null,
        totalValue: null,
        avgCostPerUnit: null
      };
      this.inventoryItems.set(newItem.id, newItem);
    });
    
    console.log(`Initialized ${allInventory.length} inventory items`);
  }
  
  private initializeGrowingSystems() {
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
    
    console.log(`Initialized ${allGrowingSystems.length} growing systems`)
  }

  // Get user by ID
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
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
    // Return tasks assigned to the user OR unassigned tasks (assignedTo is null)
    return Array.from(this.tasks.values()).filter(task => 
      task.assignedTo === userId || task.assignedTo === null
    );
  }

  async getTask(id: number): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const newTask: Task = {
      ...taskData,
      id: this.currentTaskId++,
      createdAt: new Date(),
      data: taskData.data || {},
      visibleFromDate: null,
      pausedAt: null,
      resumedAt: null,
      skippedAt: null,
      skipReason: null,
      completedBy: null,
      approvedBy: null
    };
    this.tasks.set(newTask.id, newTask);
    await this.persistence.saveTasks(Array.from(this.tasks.values()));
    await this.persistence.saveCounters({
      currentTaskId: this.currentTaskId,
      currentRecurringTaskId: this.currentRecurringTaskId,
      currentInventoryId: this.currentInventoryId
    });
    return newTask;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | null> {
    const task = this.tasks.get(id);
    if (!task) return null;

    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    await this.persistence.saveTasks(Array.from(this.tasks.values()));
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async resetTasks(): Promise<boolean> {
    this.tasks.clear();
    this.currentTaskId = 1;
    return true;
  }

  // Inventory methods
  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

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
      createdAt: new Date(),
      totalValue: null,
      avgCostPerUnit: null
    };
    this.inventoryItems.set(newItem.id, newItem);
    return newItem;
  }

  async updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
    const item = this.inventoryItems.get(id);
    if (!item) return null;

    const updatedItem = { ...item, ...updates };
    this.inventoryItems.set(id, updatedItem);
    await this.persistence.saveInventoryItems(Array.from(this.inventoryItems.values()));
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }

  async addInventoryStock(data: { itemId: number; quantity: number; unitCost: number; supplier?: string; notes?: string }): Promise<InventoryItem> {
    const item = this.inventoryItems.get(data.itemId);
    if (!item) {
      throw new Error("Inventory item not found");
    }

    // Calculate weighted average cost
    const currentStock = item.currentStock || 0;
    const currentAvgCost = item.avgCostPerUnit || 0;
    const currentTotalValue = currentStock * currentAvgCost;
    
    const addedTotalValue = data.quantity * data.unitCost;
    const newTotalStock = currentStock + data.quantity;
    const newAvgCost = newTotalStock > 0 ? (currentTotalValue + addedTotalValue) / newTotalStock : 0;
    const newTotalValue = newTotalStock * newAvgCost;

    // Create transaction record
    const transaction = {
      itemId: data.itemId,
      type: "purchase" as const,
      quantity: data.quantity,
      totalCost: addedTotalValue,
      costPerUnit: data.unitCost,
      runningStock: newTotalStock,
      addedBy: 1, // Default user for now
      notes: data.notes || `Added ${data.quantity} ${item.unit} at $${data.unitCost}/${item.unit}${data.supplier ? ` from ${data.supplier}` : ''}`,
      createdAt: new Date()
    };

    // Update the inventory item
    const updatedItem: InventoryItem = {
      ...item,
      currentStock: newTotalStock,
      avgCostPerUnit: newAvgCost,
      totalValue: newTotalValue,
      supplier: data.supplier || item.supplier,
      lastRestocked: new Date()
    };

    this.inventoryItems.set(data.itemId, updatedItem);
    
    console.log(`Inventory updated: ${item.name}`, {
      oldStock: currentStock,
      addedQuantity: data.quantity,
      newStock: newTotalStock,
      oldAvgCost: currentAvgCost,
      newAvgCost: newAvgCost,
      unitCost: data.unitCost,
      transaction: transaction
    });

    // Persist inventory changes
    await this.persistence.saveInventoryItems(Array.from(this.inventoryItems.values()));

    return updatedItem;
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

  async updateUserProgress(progressData: InsertUserProgress): Promise<UserProgress> {
    // Find existing progress for this user/module combination
    const existingKey = `${progressData.userId}-${progressData.moduleId}`;
    const existingProgress = Array.from(this.userProgress.values()).find(p => 
      p.userId === progressData.userId && p.moduleId === progressData.moduleId
    );

    if (existingProgress) {
      // Update existing progress
      const updatedProgress = { ...existingProgress, ...progressData };
      this.userProgress.set(existingProgress.id, updatedProgress);
      return updatedProgress;
    } else {
      // Create new progress
      const newProgress: UserProgress = {
        ...progressData,
        id: this.currentProgressId++
      };
      this.userProgress.set(newProgress.id, newProgress);
      return newProgress;
    }
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
    
    // Generate task instances for the next 30 days
    await this.generateTaskInstances(newTask);
    
    // Persist data after generating task instances
    await this.persistData();
    
    return newTask;
  }

  async updateRecurringTask(id: number, updates: any): Promise<RecurringTask | null> {
    const task = this.recurringTasks.get(id);
    if (!task) return null;

    const updatedTask = { ...task, ...updates };
    this.recurringTasks.set(id, updatedTask);
    
    // If frequency or daysOfWeek changed, regenerate all task instances
    if (updates.frequency || updates.daysOfWeek) {
      console.log('Frequency or days changed, regenerating task instances...');
      
      // Delete ONLY future pending task instances (preserve completed/in-progress tasks)
      const taskIds = Array.from(this.tasks.keys()).filter(taskId => {
        const task = this.tasks.get(taskId);
        return task?.recurringTaskId === id && 
               task?.status === 'pending' && 
               task?.dueDate && new Date(task.dueDate) >= new Date();
      });
      
      taskIds.forEach(taskId => this.tasks.delete(taskId));
      console.log(`Deleted ${taskIds.length} future pending task instances`);
      
      // Generate new task instances with updated schedule (with duplicate prevention)
      await this.generateTaskInstances(updatedTask);
    } else {
      // Update existing pending and in-progress instances (not completed ones)
      const taskInstances = Array.from(this.tasks.values()).filter(t => 
        t.recurringTaskId === id && 
        (t.status === 'pending' || t.status === 'in_progress') && 
        t.dueDate && new Date(t.dueDate) >= new Date()
      );
      
      taskInstances.forEach(instance => {
        // Update checklist while preserving completed steps
        let updatedChecklist = instance.checklist;
        if (updatedTask.checklistTemplate?.steps) {
          updatedChecklist = updatedTask.checklistTemplate.steps.map((step: any, index: number) => {
            const existingStep = instance.checklist?.[index];
            return {
              id: step.id || `${index + 1}`,
              text: step.label || '',
              completed: existingStep?.completed || false, // Preserve completion status
              required: step.required || false,
              type: step.type,
              config: step.config, // Always use latest config
              dataCollection: step.type === 'data-capture' ? { 
                type: step.config?.dataType || 'text', 
                label: step.label || '' 
              } : undefined
            };
          });
        }

        const updatedInstance = {
          ...instance,
          title: updatedTask.title || instance.title,
          description: updatedTask.description || instance.description,
          type: updatedTask.type || instance.type,
          frequency: updatedTask.frequency || instance.frequency,
          checklist: updatedChecklist
        };
        this.tasks.set(instance.id, updatedInstance);
      });
      
      console.log(`Updated ${taskInstances.length} pending task instances for recurring task: ${updatedTask.title}`);
    }
    
    // Persist all changes
    await this.persistData();
    
    return updatedTask;
  }

  async deleteRecurringTask(id: number): Promise<boolean> {
    console.log('Deleting recurring task with ghost task preservation:', id);
    
    const recurringTask = this.recurringTasks.get(id);
    if (!recurringTask) {
      console.log('Recurring task not found:', id);
      return false;
    }
    
    // Delete only future pending tasks (preserve completed and in-progress tasks)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const taskIds = Array.from(this.tasks.keys()).filter(taskId => {
      const task = this.tasks.get(taskId);
      if (!task || task.recurringTaskId !== id) return false;
      
      // Keep completed tasks
      if (task.status === 'completed') return false;
      
      // Keep in-progress tasks
      if (task.status === 'in_progress' || task.startedAt) return false;
      
      // Delete future pending tasks
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= now; // Delete if due today or in the future
      }
      
      return false;
    });
    
    // Delete the future tasks
    const deletedCount = taskIds.length;
    taskIds.forEach(taskId => this.tasks.delete(taskId));
    console.log(`Deleted ${deletedCount} future tasks for recurring task: ${recurringTask.title}`);
    
    // Update remaining tasks to mark them as orphaned (for historical reference)
    const remainingTaskIds = Array.from(this.tasks.keys()).filter(taskId => {
      const task = this.tasks.get(taskId);
      return task?.recurringTaskId === id;
    });
    
    remainingTaskIds.forEach(taskId => {
      const task = this.tasks.get(taskId);
      if (task) {
        task.recurringTaskId = null; // Orphan the task but keep it for history
        task.isFromDeletedRecurring = true;
        task.deletedRecurringTaskTitle = recurringTask.title;
        this.tasks.set(taskId, task);
      }
    });
    
    console.log(`Orphaned ${remainingTaskIds.length} historical tasks from recurring task: ${recurringTask.title}`);
    
    // Delete the recurring task
    const deleted = this.recurringTasks.delete(id);
    
    // Persist the changes
    await this.persistData();
    
    return deleted;
  }

  async resetRecurringTasks(): Promise<boolean> {
    this.recurringTasks.clear();
    this.currentRecurringTaskId = 1;
    
    // Also clear all task instances that were generated from recurring tasks
    const recurringTaskIds = Array.from(this.tasks.keys()).filter(taskId => {
      const task = this.tasks.get(taskId);
      return task?.isRecurring;
    });
    
    recurringTaskIds.forEach(taskId => this.tasks.delete(taskId));
    
    // Persist the changes
    await this.persistData();
    
    return true;
  }

  // Method to regenerate task instances (useful for fixing scheduling bugs)
  async regenerateTaskInstances(id: number): Promise<boolean> {
    const recurringTask = this.recurringTasks.get(id);
    if (!recurringTask) return false;

    console.log(`Regenerating task instances for recurring task: ${recurringTask.title}`);
    
    // Delete all future task instances for this recurring task
    const taskIds = Array.from(this.tasks.keys()).filter(taskId => {
      const task = this.tasks.get(taskId);
      return task?.recurringTaskId === id && 
             task?.status === 'pending' && 
             task?.dueDate && new Date(task.dueDate) >= new Date();
    });
    
    taskIds.forEach(taskId => this.tasks.delete(taskId));
    console.log(`Deleted ${taskIds.length} future task instances`);
    
    // Generate new task instances with correct schedule
    await this.generateTaskInstances(recurringTask);
    
    // Persist changes
    await this.persistData();
    
    return true;
  }

  // Method to regenerate ALL task instances (complete fix)
  async regenerateAllTaskInstances(): Promise<{ totalRecurringTasks: number, totalGenerated: number, totalDeleted: number }> {
    console.log(`🔄 REGENERATING ALL TASK INSTANCES WITH CORRECTED LOGIC`);
    
    const today = new Date();
    let totalDeleted = 0;
    let totalGenerated = 0;
    
    // Delete ALL future pending task instances from recurring tasks
    const taskIdsToDelete = Array.from(this.tasks.keys()).filter(taskId => {
      const task = this.tasks.get(taskId);
      return task?.isRecurring === true && 
             task?.status === 'pending' && 
             task?.dueDate && new Date(task.dueDate) >= today;
    });
    
    taskIdsToDelete.forEach(taskId => this.tasks.delete(taskId));
    totalDeleted = taskIdsToDelete.length;
    console.log(`🗑️ Deleted ${totalDeleted} future pending recurring task instances`);
    
    // Regenerate instances for ALL recurring tasks with the corrected logic
    const recurringTasks = Array.from(this.recurringTasks.values());
    console.log(`📋 Found ${recurringTasks.length} recurring tasks to regenerate`);
    
    for (const recurringTask of recurringTasks) {
      if (recurringTask.isActive) {
        const beforeCount = this.tasks.size;
        await this.generateTaskInstances(recurringTask);
        const afterCount = this.tasks.size;
        const generatedForThisTask = afterCount - beforeCount;
        totalGenerated += generatedForThisTask;
        console.log(`✅ Generated ${generatedForThisTask} instances for: ${recurringTask.title}`);
      } else {
        console.log(`⏸️ Skipped inactive task: ${recurringTask.title}`);
      }
    }
    
    // Persist all changes
    await this.persistData();
    
    console.log(`🎉 REGENERATION COMPLETE: ${totalDeleted} deleted, ${totalGenerated} generated from ${recurringTasks.length} recurring tasks`);
    
    return {
      totalRecurringTasks: recurringTasks.length,
      totalGenerated,
      totalDeleted
    };
  }

  // Utility method to check if a task already exists for a specific date (UTC-aware)
  private taskExistsForDate(recurringTaskId: number, targetDate: Date): boolean {
    const existingTasks = Array.from(this.tasks.values()).filter(t => t.recurringTaskId === recurringTaskId);
    
    return existingTasks.some(task => {
      if (!task.dueDate) return false;
      
      const taskDate = new Date(task.dueDate);
      const checkDate = new Date(targetDate);
      
      // Use UTC comparison to avoid timezone issues
      return taskDate.getUTCFullYear() === checkDate.getUTCFullYear() &&
             taskDate.getUTCMonth() === checkDate.getUTCMonth() &&
             taskDate.getUTCDate() === checkDate.getUTCDate();
    });
  }

  // Generate task instances from recurring task pattern with proper UTC-aware date handling
  private async generateTaskInstances(recurringTask: RecurringTask): Promise<void> {
    console.log(`=== GENERATING TASK INSTANCES FOR: ${recurringTask.title} ===`);
    
    // Use UTC-aware date creation to avoid timezone issues
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const instances: Task[] = [];
    
    if (recurringTask.frequency === 'monthly') {
      // Monthly tasks: generate for current and next 2 months
      for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
        const targetYear = today.getFullYear();
        const targetMonth = today.getMonth() + monthOffset;
        
        // Handle year rollover
        const actualYear = targetYear + Math.floor(targetMonth / 12);
        const actualMonth = targetMonth % 12;
        
        // Monthly task due on last day of month
        const lastDay = new Date(actualYear, actualMonth + 1, 0).getDate();
        const dueDate = new Date(Date.UTC(actualYear, actualMonth, lastDay, 12, 0, 0));
        const visibleDate = new Date(Date.UTC(actualYear, actualMonth, 1, 12, 0, 0));
        
        console.log(`Checking monthly task for ${actualYear}-${actualMonth + 1}: due ${dueDate.toISOString()}`);
        
        if (dueDate >= todayUTC && !this.taskExistsForDate(recurringTask.id, dueDate)) {
          console.log(`✅ CREATING - Monthly task for ${dueDate.toISOString()}`);
          const instance = await this.createTaskInstanceWithDates(recurringTask, visibleDate, dueDate);
          instances.push(instance);
          this.tasks.set(instance.id, instance);
        } else {
          console.log(`❌ SKIPPING - Task exists or past due`);
        }
      }
    } else if (recurringTask.frequency === 'quarterly') {
      // Quarterly tasks: generate for current and next 3 quarters
      for (let quarterOffset = 0; quarterOffset < 4; quarterOffset++) {
        const targetYear = today.getFullYear();
        const currentQuarter = Math.floor(today.getMonth() / 3);
        const targetQuarter = currentQuarter + quarterOffset;
        
        // Handle year rollover
        const actualYear = targetYear + Math.floor(targetQuarter / 4);
        const actualQuarter = targetQuarter % 4;
        
        // Quarter start months: Q1=0 (Jan), Q2=3 (Apr), Q3=6 (Jul), Q4=9 (Oct)
        const quarterStartMonth = actualQuarter * 3;
        const quarterEndMonth = quarterStartMonth + 2;
        
        // Quarterly task visible from first day of quarter, due on last day of quarter
        const visibleDate = new Date(Date.UTC(actualYear, quarterStartMonth, 1, 12, 0, 0));
        const lastDayOfQuarter = new Date(actualYear, quarterEndMonth + 1, 0).getDate();
        const dueDate = new Date(Date.UTC(actualYear, quarterEndMonth, lastDayOfQuarter, 12, 0, 0));
        
        console.log(`Checking quarterly task for Q${actualQuarter + 1} ${actualYear}: due ${dueDate.toISOString()}`);
        
        if (dueDate >= todayUTC && !this.taskExistsForDate(recurringTask.id, dueDate)) {
          console.log(`✅ CREATING - Quarterly task for Q${actualQuarter + 1} ${actualYear}`);
          const instance = await this.createTaskInstanceWithDates(recurringTask, visibleDate, dueDate);
          instances.push(instance);
          this.tasks.set(instance.id, instance);
        } else {
          console.log(`❌ SKIPPING - Task exists or past due`);
        }
      }
    } else if (recurringTask.frequency === 'bi-weekly') {
      // Bi-weekly tasks: generate for current and next 2 months
      for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
        const targetYear = today.getFullYear();
        const targetMonth = today.getMonth() + monthOffset;
        
        // Handle year rollover
        const actualYear = targetYear + Math.floor(targetMonth / 12);
        const actualMonth = targetMonth % 12;
        
        // First bi-weekly task (due 14th of month)
        const firstDueDate = new Date(Date.UTC(actualYear, actualMonth, 14, 12, 0, 0));
        const firstVisibleDate = new Date(Date.UTC(actualYear, actualMonth, 1, 12, 0, 0));
        
        if (firstDueDate >= todayUTC && !this.taskExistsForDate(recurringTask.id, firstDueDate)) {
          console.log(`✅ CREATING - Bi-weekly first half for ${firstDueDate.toISOString()}`);
          const instance1 = await this.createTaskInstanceWithDates(recurringTask, firstVisibleDate, firstDueDate);
          instances.push(instance1);
          this.tasks.set(instance1.id, instance1);
        }
        
        // Second bi-weekly task (due last day of month)
        const lastDay = new Date(actualYear, actualMonth + 1, 0).getDate();
        const secondDueDate = new Date(Date.UTC(actualYear, actualMonth, lastDay, 12, 0, 0));
        const secondVisibleDate = new Date(Date.UTC(actualYear, actualMonth, 15, 12, 0, 0));
        
        if (secondDueDate >= todayUTC && !this.taskExistsForDate(recurringTask.id, secondDueDate)) {
          console.log(`✅ CREATING - Bi-weekly second half for ${secondDueDate.toISOString()}`);
          const instance2 = await this.createTaskInstanceWithDates(recurringTask, secondVisibleDate, secondDueDate);
          instances.push(instance2);
          this.tasks.set(instance2.id, instance2);
        }
      }
    } else {
      // Daily/weekly tasks - generate for next 30 days
      const endDate = new Date(todayUTC);
      endDate.setDate(endDate.getDate() + 30);
      
      let currentDate = new Date(todayUTC);
      
      while (currentDate <= endDate) {
        let shouldCreate = false;
        
        if (recurringTask.frequency === 'daily') {
          // For daily tasks, check if specific days are selected
          if (recurringTask.daysOfWeek && recurringTask.daysOfWeek.length > 0) {
            const dayOfWeek = currentDate.getUTCDay();
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const currentDayName = dayNames[dayOfWeek];
            shouldCreate = recurringTask.daysOfWeek.includes(currentDayName);
          } else {
            shouldCreate = true; // No specific days selected, create every day
          }
        } else if (recurringTask.frequency === 'weekly') {
          // Check if current day matches selected days
          const dayOfWeek = currentDate.getUTCDay();
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const currentDayName = dayNames[dayOfWeek];
          const selectedDays = recurringTask.daysOfWeek || [];
          shouldCreate = selectedDays.includes(currentDayName);
        }
        
        if (shouldCreate && currentDate >= todayUTC && !this.taskExistsForDate(recurringTask.id, currentDate)) {
          console.log(`✅ CREATING - Task for ${currentDate.toISOString()}`);
          const taskDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate(), 12, 0, 0));
          const instance = await this.createTaskInstanceWithDates(recurringTask, taskDate, taskDate);
          instances.push(instance);
          this.tasks.set(instance.id, instance);
        }
        
        // Move to next day using UTC
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }
    }
    
    console.log(`Generated ${instances.length} task instances for recurring task: ${recurringTask.title}`);
  }

  // Helper method to get last day of month - FIXED
  private getLastDayOfMonth(date: Date): number {
    // Create date for last day of the current month
    // Month + 1 gives us next month, day 0 gives us last day of current month
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return lastDay.getDate();
  }

  // Create individual task instance with specific visible and due dates
  private async createTaskInstanceWithDates(recurringTask: RecurringTask, visibleDate: Date, dueDate: Date): Promise<Task> {
    const newTask: Task = {
      id: this.currentTaskId++,
      title: recurringTask.title,
      description: recurringTask.description,
      type: recurringTask.type,
      status: 'pending',
      priority: 'medium',
      assignedTo: (recurringTask.assignTo && recurringTask.assignTo !== 'no-assignment') ? recurringTask.assignTo : null,
      createdBy: recurringTask.createdBy,
      location: recurringTask.location,
      estimatedTime: null,
      actualTime: null,
      progress: 0,
      checklist: recurringTask.checklistTemplate?.steps?.map((step, index) => ({
        id: step.id || `${index + 1}`,
        text: step.label || '',
        completed: false,
        required: step.required || false,
        type: step.type,
        config: step.config,
        dataCollection: step.type === 'data-capture' ? { 
          type: step.config?.dataType || 'text', 
          label: step.label || '' 
        } : undefined
      })) || [],
      data: {},
      dueDate: dueDate,
      visibleFromDate: visibleDate,
      startedAt: null,
      completedAt: null,
      pausedAt: null,
      resumedAt: null,
      skippedAt: null,
      skipReason: null,
      isRecurring: true,
      frequency: recurringTask.frequency,
      recurringTaskId: recurringTask.id,
      createdAt: new Date()
    };
    
    this.tasks.set(newTask.id, newTask);
    // Note: Task instances are persisted in bulk after generateTaskInstances completes
    return newTask;
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

  // Course assignment methods
  async getAllCourseAssignments(): Promise<CourseAssignment[]> {
    return Array.from(this.courseAssignments.values());
  }

  async getCourseAssignment(id: number): Promise<CourseAssignment | undefined> {
    return this.courseAssignments.get(id);
  }

  async getCourseAssignmentsByUser(userId: number): Promise<CourseAssignment[]> {
    return Array.from(this.courseAssignments.values()).filter(assignment => assignment.assignedToUserId === userId);
  }

  async createCourseAssignment(assignmentData: InsertCourseAssignment): Promise<CourseAssignment> {
    const newAssignment: CourseAssignment = {
      ...assignmentData,
      id: this.currentAssignmentId++,
      assignedDate: new Date(),
      completed: false
    };
    this.courseAssignments.set(newAssignment.id, newAssignment);
    return newAssignment;
  }

  async updateCourseAssignment(id: number, updates: Partial<CourseAssignment>): Promise<CourseAssignment | undefined> {
    const assignment = this.courseAssignments.get(id);
    if (!assignment) return undefined;

    const updatedAssignment = { ...assignment, ...updates };
    this.courseAssignments.set(id, updatedAssignment);
    return updatedAssignment;
  }

  async deleteCourseAssignment(id: number): Promise<boolean> {
    return this.courseAssignments.delete(id);
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

  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getAllNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const newNotification: Notification = {
      id: this.currentNotificationId++,
      ...notification,
      createdAt: new Date(),
      readAt: null
    };
    this.notifications.set(newNotification.id, newNotification);
    return newNotification;
  }

  async updateNotification(id: number, updates: Partial<Notification>): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, ...updates };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { 
      ...notification, 
      isRead: true, 
      readAt: new Date() 
    };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.userId === userId && !notification.isRead) {
        this.notifications.set(id, {
          ...notification,
          isRead: true,
          readAt: new Date()
        });
      }
    }
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }

  // Clear all data method
  async clearAllData(): Promise<boolean> {
    try {
      console.log('Clearing all data maps...');
      this.users.clear();
      this.tasks.clear();
      this.inventoryItems.clear();
      this.trainingModules.clear();
      this.userProgress.clear();
      this.taskLogs.clear();
      this.recurringTasks.clear();
      this.growingSystems.clear();
      this.trayMovements.clear();
      // this.crops.clear(); // Disabled until Crop type is defined
      this.courseAssignments.clear();
      this.notifications.clear();
      
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
      // this.currentCropId = 1; // Disabled until Crop type is defined
      this.currentAssignmentId = 1;
      this.currentNotificationId = 1;
      
      // Clear persistent storage files
      await this.persistence.clearAllFiles();
      
      console.log('All data cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  // Add missing methods for recurring task instance management
  async regenerateAllTaskInstances(): Promise<{ totalTasksCreated: number; recurringTasksProcessed: number }> {
    return this.regenerateTaskInstances();
  }

  async regenerateTaskInstances(recurringTaskId?: number): Promise<boolean | { totalTasksCreated: number; recurringTasksProcessed: number }> {
    if (recurringTaskId) {
      // Single recurring task regeneration
      const recurringTask = this.recurringTasks.get(recurringTaskId);
      if (!recurringTask) return false;
      
      await this.generateTaskInstances(recurringTask);
      return true;
    } else {
      // All recurring tasks regeneration
      const result = await this.regenerateTaskInstances();
      return result;
    }
  }
}

// Database Storage Implementation (switching from MemStorage to use database)
class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async getTasksByUser(userId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async getAllTasks(): Promise<Task[]> {
    return db.select().from(tasks);
  }

  async getTasksByLocation(locationId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.location, locationId));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return task || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount > 0;
  }

  async resetTasks(): Promise<boolean> {
    await db.delete(tasks);
    return true;
  }

  // Inventory methods (stub implementation - keeping interface)
  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item || undefined;
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems);
  }

  async getInventoryItemsByLocation(locationId: string): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems).where(eq(inventoryItems.location, locationId));
  }

  async createInventoryItem(itemData: InsertInventoryItem): Promise<InventoryItem> {
    const [item] = await db.insert(inventoryItems).values(itemData).returning();
    return item;
  }

  async updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const [item] = await db.update(inventoryItems).set(updates).where(eq(inventoryItems.id, id)).returning();
    return item || undefined;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    const result = await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
    return result.rowCount > 0;
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems).where(sql`${inventoryItems.currentStock} <= ${inventoryItems.minimumStock}`);
  }

  async getLowStockItemsByLocation(locationId: string): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems).where(and(
      eq(inventoryItems.location, locationId),
      sql`${inventoryItems.currentStock} <= ${inventoryItems.minimumStock}`
    ));
  }

  async addInventoryStock(data: { itemId: number; quantity: number; unitCost: number; supplier?: string; notes?: string }): Promise<InventoryItem> {
    // Get current item
    const [currentItem] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, data.itemId));
    if (!currentItem) throw new Error('Item not found');

    // Calculate weighted average cost
    const currentValue = (currentItem.currentStock || 0) * (currentItem.avgCostPerUnit || 0);
    const newValue = data.quantity * data.unitCost;
    const totalQuantity = (currentItem.currentStock || 0) + data.quantity;
    const newAverageCost = totalQuantity > 0 ? (currentValue + newValue) / totalQuantity : 0;

    // Update item
    const [updatedItem] = await db.update(inventoryItems)
      .set({
        currentStock: totalQuantity,
        avgCostPerUnit: newAverageCost,
        totalValue: totalQuantity * newAverageCost,
        lastRestocked: new Date()
      })
      .where(eq(inventoryItems.id, data.itemId))
      .returning();

    return updatedItem;
  }

  // Training methods (stub implementation)
  async getTrainingModule(id: number): Promise<TrainingModule | undefined> {
    const [module] = await db.select().from(trainingModules).where(eq(trainingModules.id, id));
    return module || undefined;
  }

  async getAllTrainingModules(): Promise<TrainingModule[]> {
    return db.select().from(trainingModules);
  }

  async createTrainingModule(moduleData: InsertTrainingModule): Promise<TrainingModule> {
    const [module] = await db.insert(trainingModules).values(moduleData).returning();
    return module;
  }

  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async updateUserProgress(progressData: InsertUserProgress): Promise<UserProgress> {
    const [progress] = await db.insert(userProgress).values(progressData)
      .onConflictDoUpdate({
        target: [userProgress.userId, userProgress.moduleId],
        set: {
          completed: progressData.completed,
          completedAt: progressData.completedAt,
          progress: progressData.progress
        }
      }).returning();
    return progress;
  }

  // Task logs
  async createTaskLog(logData: InsertTaskLog): Promise<TaskLog> {
    const [log] = await db.insert(taskLogs).values(logData).returning();
    return log;
  }

  async getTaskLogs(taskId: number): Promise<TaskLog[]> {
    return db.select().from(taskLogs).where(eq(taskLogs.taskId, taskId));
  }

  // Recurring tasks - KEY METHODS FOR THE FIX
  async getAllRecurringTasks(): Promise<RecurringTask[]> {
    return db.select().from(recurringTasks);
  }

  async getRecurringTask(id: number): Promise<RecurringTask | undefined> {
    const [task] = await db.select().from(recurringTasks).where(eq(recurringTasks.id, id));
    return task || undefined;
  }

  async getRecurringTasksByLocation(locationId: string): Promise<RecurringTask[]> {
    return db.select().from(recurringTasks).where(eq(recurringTasks.location, locationId));
  }

  async createRecurringTask(taskData: InsertRecurringTask): Promise<RecurringTask> {
    const [task] = await db.insert(recurringTasks).values(taskData).returning();
    return task;
  }

  async updateRecurringTask(id: number, updates: Partial<RecurringTask>): Promise<RecurringTask | undefined> {
    const [task] = await db.update(recurringTasks).set(updates).where(eq(recurringTasks.id, id)).returning();
    return task || undefined;
  }

  async deleteRecurringTask(id: number): Promise<boolean> {
    const result = await db.delete(recurringTasks).where(eq(recurringTasks.id, id));
    return result.rowCount > 0;
  }

  async resetRecurringTasks(): Promise<boolean> {
    await db.delete(recurringTasks);
    return true;
  }

  // Other stub implementations to satisfy interface
  async getGrowingSystem(id: number): Promise<GrowingSystem | undefined> { return undefined; }
  async getAllGrowingSystems(): Promise<GrowingSystem[]> { return []; }
  async getGrowingSystemsByLocation(locationId: string): Promise<GrowingSystem[]> { return []; }
  async createGrowingSystem(systemData: InsertGrowingSystem): Promise<GrowingSystem> { throw new Error('Not implemented'); }
  async updateGrowingSystem(id: number, updates: Partial<GrowingSystem>): Promise<GrowingSystem | undefined> { return undefined; }
  async deleteGrowingSystem(id: number): Promise<boolean> { return false; }
  
  async getTray(id: string): Promise<Tray | undefined> { return undefined; }
  async getAllTrays(): Promise<Tray[]> { return []; }
  async getTraysByLocation(locationId: string): Promise<Tray[]> { return []; }
  async createTray(trayData: InsertTray): Promise<Tray> { throw new Error('Not implemented'); }
  async updateTray(id: string, updates: Partial<Tray>): Promise<Tray | undefined> { return undefined; }
  async deleteTray(id: string): Promise<boolean> { return false; }
  
  async createTrayMovement(movementData: InsertTrayMovement): Promise<TrayMovement> { throw new Error('Not implemented'); }
  async getTrayMovements(trayId: string): Promise<TrayMovement[]> { return []; }
  
  async addInventoryTransaction(transactionData: InsertInventoryTransaction): Promise<InventoryTransaction> { throw new Error('Not implemented'); }
  async getInventoryTransactions(itemId?: number): Promise<InventoryTransaction[]> { return []; }
  
  async createCourseAssignment(assignmentData: InsertCourseAssignment): Promise<CourseAssignment> { throw new Error('Not implemented'); }
  async getCourseAssignments(userId?: number): Promise<CourseAssignment[]> { return []; }
  async updateCourseAssignment(id: number, updates: Partial<CourseAssignment>): Promise<CourseAssignment | undefined> { return undefined; }
  
  async createNotification(notificationData: InsertNotification): Promise<Notification> { throw new Error('Not implemented'); }
  async getUserNotifications(userId: number): Promise<Notification[]> { return []; }
  async markNotificationAsRead(id: number): Promise<boolean> { return false; }
  
  async regenerateTaskInstances(recurringTaskId: number): Promise<boolean> { return false; }
  async clearAllData(): Promise<boolean> { return false; }
}

// Hybrid Storage: Database for users/staff, Memory for other features
class HybridStorage implements IStorage {
  private dbStorage = new DatabaseStorage();
  private memStorage = new MemStorage();

  // User methods - use DATABASE for persistence
  async getUser(id: number): Promise<User | undefined> {
    return this.dbStorage.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.dbStorage.getUserByUsername(username);
  }

  async createUser(userData: InsertUser): Promise<User> {
    return this.dbStorage.createUser(userData);
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    return this.dbStorage.updateUser(id, updates);
  }

  async getAllUsers(): Promise<User[]> {
    return this.dbStorage.getAllUsers();
  }

  // Task methods - use DATABASE storage for persistence and assignment tracking
  async getTask(id: number): Promise<Task | undefined> {
    return this.dbStorage.getTask(id);
  }

  async getTasksByUser(userId: number): Promise<Task[]> {
    return this.dbStorage.getTasksByUser(userId);
  }

  async getAllTasks(): Promise<Task[]> {
    return this.dbStorage.getAllTasks();
  }

  async getTasksByLocation(locationId: string): Promise<Task[]> {
    return this.dbStorage.getTasksByLocation(locationId);
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    return this.dbStorage.createTask(taskData);
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    return this.dbStorage.updateTask(id, updates);
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.dbStorage.deleteTask(id);
  }

  async resetTasks(): Promise<boolean> {
    return this.dbStorage.resetTasks();
  }

  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    return this.dbStorage.getInventoryItem(id);
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return this.dbStorage.getAllInventoryItems();
  }

  async getInventoryItemsByLocation(locationId: string): Promise<InventoryItem[]> {
    return this.dbStorage.getInventoryItemsByLocation(locationId);
  }

  async createInventoryItem(itemData: InsertInventoryItem): Promise<InventoryItem> {
    return this.dbStorage.createInventoryItem(itemData);
  }

  async updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    return this.dbStorage.updateInventoryItem(id, updates);
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    return this.dbStorage.deleteInventoryItem(id);
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return this.dbStorage.getLowStockItems();
  }

  async getLowStockItemsByLocation(locationId: string): Promise<InventoryItem[]> {
    return this.dbStorage.getLowStockItemsByLocation(locationId);
  }

  async addInventoryStock(data: { itemId: number; quantity: number; unitCost: number; supplier?: string; notes?: string }): Promise<InventoryItem> {
    return this.dbStorage.addInventoryStock(data);
  }

  async getTrainingModule(id: number): Promise<TrainingModule | undefined> {
    return this.memStorage.getTrainingModule(id);
  }

  async getAllTrainingModules(): Promise<TrainingModule[]> {
    return this.memStorage.getAllTrainingModules();
  }

  async createTrainingModule(moduleData: InsertTrainingModule): Promise<TrainingModule> {
    return this.memStorage.createTrainingModule(moduleData);
  }

  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return this.memStorage.getUserProgress(userId);
  }

  async updateUserProgress(progressData: InsertUserProgress): Promise<UserProgress> {
    return this.memStorage.updateUserProgress(progressData);
  }

  async createTaskLog(logData: InsertTaskLog): Promise<TaskLog> {
    return this.memStorage.createTaskLog(logData);
  }

  async getTaskLogs(taskId: number): Promise<TaskLog[]> {
    return this.memStorage.getTaskLogs(taskId);
  }

  // FIXED: Use database storage for recurring tasks instead of memory storage
  async getRecurringTask(id: number): Promise<RecurringTask | undefined> {
    return this.dbStorage.getRecurringTask(id);
  }

  async getAllRecurringTasks(): Promise<RecurringTask[]> {
    return this.dbStorage.getAllRecurringTasks();
  }

  async getRecurringTasksByLocation(locationId: string): Promise<RecurringTask[]> {
    return this.dbStorage.getRecurringTasksByLocation(locationId);
  }

  async createRecurringTask(taskData: InsertRecurringTask): Promise<RecurringTask> {
    return this.dbStorage.createRecurringTask(taskData);
  }

  async updateRecurringTask(id: number, updates: Partial<RecurringTask>): Promise<RecurringTask | undefined> {
    return this.dbStorage.updateRecurringTask(id, updates);
  }

  async deleteRecurringTask(id: number): Promise<boolean> {
    return this.dbStorage.deleteRecurringTask(id);
  }

  async resetRecurringTasks(): Promise<boolean> {
    return this.dbStorage.resetRecurringTasks();
  }

  async getGrowingSystem(id: number): Promise<GrowingSystem | undefined> {
    return this.memStorage.getGrowingSystem(id);
  }

  async getAllGrowingSystems(): Promise<GrowingSystem[]> {
    return this.memStorage.getAllGrowingSystems();
  }

  async getGrowingSystemsByLocation(locationId: string): Promise<GrowingSystem[]> {
    return this.memStorage.getGrowingSystemsByLocation(locationId);
  }

  async createGrowingSystem(systemData: InsertGrowingSystem): Promise<GrowingSystem> {
    return this.memStorage.createGrowingSystem(systemData);
  }

  async updateGrowingSystem(id: number, updates: Partial<GrowingSystem>): Promise<GrowingSystem | undefined> {
    return this.memStorage.updateGrowingSystem(id, updates);
  }

  async deleteGrowingSystem(id: number): Promise<boolean> {
    return this.memStorage.deleteGrowingSystem(id);
  }

  async getTray(id: string): Promise<Tray | undefined> {
    return this.memStorage.getTray(id);
  }

  async getAllTrays(): Promise<Tray[]> {
    return this.memStorage.getAllTrays();
  }

  async getTraysByLocation(locationId: string): Promise<Tray[]> {
    return this.memStorage.getTraysByLocation(locationId);
  }

  async createTray(trayData: InsertTray): Promise<Tray> {
    return this.memStorage.createTray(trayData);
  }

  async updateTray(id: string, updates: Partial<Tray>): Promise<Tray | undefined> {
    return this.memStorage.updateTray(id, updates);
  }

  async deleteTray(id: string): Promise<boolean> {
    return this.memStorage.deleteTray(id);
  }

  async splitTray(originalTrayId: string, splitData: { splitCount: number; newTrayIds: string[] }): Promise<Tray[]> {
    return this.memStorage.splitTray(originalTrayId, splitData);
  }

  async createTrayMovement(movementData: InsertTrayMovement): Promise<TrayMovement> {
    return this.memStorage.createTrayMovement(movementData);
  }

  async getTrayMovements(trayId: string): Promise<TrayMovement[]> {
    return this.memStorage.getTrayMovements(trayId);
  }

  async addInventoryTransaction(transactionData: InsertInventoryTransaction): Promise<InventoryTransaction> {
    return this.memStorage.addInventoryTransaction(transactionData);
  }

  async getInventoryTransactions(itemId?: number): Promise<InventoryTransaction[]> {
    return this.memStorage.getInventoryTransactions(itemId);
  }

  async getCourseAssignment(id: number): Promise<CourseAssignment | undefined> {
    return this.memStorage.getCourseAssignment(id);
  }

  async getAllCourseAssignments(): Promise<CourseAssignment[]> {
    return this.memStorage.getAllCourseAssignments();
  }

  async getCourseAssignmentsByUser(userId: number): Promise<CourseAssignment[]> {
    return this.memStorage.getCourseAssignmentsByUser(userId);
  }

  async createCourseAssignment(assignmentData: InsertCourseAssignment): Promise<CourseAssignment> {
    return this.memStorage.createCourseAssignment(assignmentData);
  }

  async updateCourseAssignment(id: number, updates: Partial<CourseAssignment>): Promise<CourseAssignment | undefined> {
    return this.memStorage.updateCourseAssignment(id, updates);
  }

  async deleteCourseAssignment(id: number): Promise<boolean> {
    return this.memStorage.deleteCourseAssignment(id);
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    return this.memStorage.getNotification(id);
  }

  async getAllNotifications(): Promise<Notification[]> {
    return this.memStorage.getAllNotifications();
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return this.memStorage.getNotificationsByUser(userId);
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    return this.memStorage.createNotification(notificationData);
  }

  async updateNotification(id: number, updates: Partial<Notification>): Promise<Notification | undefined> {
    return this.memStorage.updateNotification(id, updates);
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    return this.memStorage.markNotificationAsRead(id);
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    return this.memStorage.markAllNotificationsAsRead(userId);
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.memStorage.deleteNotification(id);
  }

  async clearAllData(): Promise<boolean> {
    return this.memStorage.clearAllData();
  }

  async regenerateAllTaskInstances(): Promise<{ totalTasksCreated: number; recurringTasksProcessed: number }> {
    return this.memStorage.regenerateAllTaskInstances();
  }

  async regenerateTaskInstances(recurringTaskId: number): Promise<boolean> {
    const result = await this.memStorage.regenerateTaskInstances(recurringTaskId);
    return typeof result === 'boolean' ? result : false;
  }
}

export const storage = new HybridStorage();
