import { 
  users, tasks, inventoryItems, trainingModules, userProgress, taskLogs,
  type User, type InsertUser, type Task, type InsertTask, 
  type InventoryItem, type InsertInventoryItem, type TrainingModule,
  type InsertTrainingModule, type UserProgress, type InsertUserProgress,
  type TaskLog, type InsertTaskLog, type ChecklistItem
} from "@shared/schema";

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

  // Inventory methods
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  getAllInventoryItems(): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined>;
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private tasks: Map<number, Task> = new Map();
  private inventoryItems: Map<number, InventoryItem> = new Map();
  private trainingModules: Map<number, TrainingModule> = new Map();
  private userProgress: Map<string, UserProgress> = new Map(); // key: userId-moduleId
  private taskLogs: Map<number, TaskLog> = new Map();
  
  private currentUserId = 1;
  private currentTaskId = 1;
  private currentInventoryId = 1;
  private currentModuleId = 1;
  private currentProgressId = 1;
  private currentLogId = 1;

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
        createdAt: new Date()
      };
      this.users.set(newUser.id, newUser);
    });

    // Create sample tasks
    const sampleTasks = [
      {
        title: "Seed Lettuce Trays",
        description: "Plant lettuce seeds in designated trays",
        type: "seeding",
        status: "in_progress",
        priority: "medium",
        assignedTo: 1,
        createdBy: 2,
        location: "Section A - Towers 1-5",
        estimatedTime: 180,
        actualTime: 135,
        progress: 60,
        checklist: [
          { id: "1", text: "Prepare seed trays", completed: true },
          { id: "2", text: "Fill with growing medium", completed: true },
          { id: "3", text: "Plant lettuce seeds", completed: true },
          { id: "4", text: "Label trays with date", completed: false },
          { id: "5", text: "Place in germination area", completed: false }
        ] as ChecklistItem[],
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        completedAt: null
      },
      {
        title: "Harvest Spinach",
        description: "Harvest mature spinach plants",
        type: "harvesting",
        status: "pending",
        priority: "high",
        assignedTo: 1,
        createdBy: 2,
        location: "Section B - Towers 6-10",
        estimatedTime: 150,
        progress: 0,
        checklist: [
          { id: "1", text: "Check plant maturity", completed: false },
          { id: "2", text: "Harvest plants", completed: false, dataCollection: { type: "number", label: "Weight (lbs)" } },
          { id: "3", text: "Clean harvested area", completed: false }
        ] as ChecklistItem[],
        completedAt: null
      },
      {
        title: "Clean Tower Systems",
        description: "Full sanitization of tower systems",
        type: "cleaning",
        status: "completed",
        priority: "medium",
        assignedTo: 1,
        createdBy: 2,
        location: "Section C - Full sanitization",
        estimatedTime: 120,
        actualTime: 105,
        progress: 100,
        checklist: [
          { id: "1", text: "Sanitize towers", completed: true },
          { id: "2", text: "Clean water systems", completed: true },
          { id: "3", text: "Replace filters", completed: true }
        ] as ChecklistItem[],
        completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        title: "Inventory Check - Nutrients",
        description: "Check stock levels and quality of nutrient solutions",
        type: "inventory",
        status: "pending",
        priority: "low",
        assignedTo: 1,
        createdBy: 2,
        location: "Storage Room A",
        estimatedTime: 90,
        progress: 0,
        checklist: [
          { id: "1", text: "Check nutrient levels", completed: false, dataCollection: { type: "number", label: "Containers remaining" } },
          { id: "2", text: "Inspect for damage", completed: false },
          { id: "3", text: "Update inventory records", completed: false }
        ] as ChecklistItem[],
        completedAt: null
      }
    ];

    sampleTasks.forEach(task => {
      const newTask: Task = {
        ...task,
        id: this.currentTaskId++,
        data: {},
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due tomorrow
        createdAt: new Date()
      };
      this.tasks.set(newTask.id, newTask);
    });

    // Create sample inventory items
    const sampleInventory = [
      { name: "Lettuce Seeds", category: "seeds", currentStock: 150, minimumStock: 50, unit: "packets", supplier: "Green Thumb Seeds" },
      { name: "Spinach Seeds", category: "seeds", currentStock: 25, minimumStock: 30, unit: "packets", supplier: "Green Thumb Seeds" },
      { name: "Nutrient Solution A", category: "nutrients", currentStock: 45, minimumStock: 20, unit: "liters", supplier: "Hydro Nutrients Co" },
      { name: "Growing Medium", category: "supplies", currentStock: 80, minimumStock: 40, unit: "kg", supplier: "Farm Supply Plus" }
    ];

    sampleInventory.forEach(item => {
      const newItem: InventoryItem = {
        ...item,
        id: this.currentInventoryId++,
        lastRestocked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        createdAt: new Date()
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
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
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
}

export const storage = new MemStorage();
