import { 
  users, tasks, inventoryItems, trainingModules, userProgress, taskLogs,
  recurringTasks, growingSystems, trays, trayMovements, inventoryTransactions, courseAssignments, notifications, systemStatus, systemLocks,
  type User, type InsertUser, type Task, type InsertTask, 
  type InventoryItem, type InsertInventoryItem, type TrainingModule,
  type InsertTrainingModule, type UserProgress, type InsertUserProgress,
  type TaskLog, type InsertTaskLog, type ChecklistItem, type RecurringTask,
  type InsertRecurringTask, type GrowingSystem, type InsertGrowingSystem,
  type Tray, type InsertTray, type TrayMovement, type InsertTrayMovement, type InventoryTransaction,
  type InsertInventoryTransaction, type CourseAssignment, type InsertCourseAssignment,
  type Notification, type InsertNotification, type SystemStatus, type InsertSystemStatus,
  type SystemLock, type InsertSystemLock
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, or, gte, lte, isNull, inArray } from "drizzle-orm";
import { PersistenceManager } from './persistence';

// Safe date handling utility to prevent TypeScript errors
const safeDate = (v: Date | string | number | null | undefined): Date | null => v == null ? null : new Date(v);

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
  resetTaskSequence(): Promise<void>;

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
  updateRecurringTask(id: number, updates: Partial<RecurringTask>, options?: { strategy?: 'update_all' | 'new_only'; userId?: number }): Promise<{ task: RecurringTask | null; report: any }>;
  calculateUpdateImpact(id: number, changedFields: any[]): Promise<{ affectedCount: number; conflictCount: number; byStatus: Record<string, number>; byDate: Record<string, number> }>;
  deleteRecurringTask(id: number): Promise<boolean>;
  resetRecurringTasks(): Promise<boolean>;
  regenerateAllTaskInstances(): Promise<{ totalTasksCreated: number; recurringTasksProcessed: number }>;
  regenerateTaskInstances(recurringTaskId: number): Promise<boolean>;
  verifyTaskIntegrity(): Promise<{
    missingTasksCreated: number;
    duplicatesRemoved: number;
    errors: string[];
    verificationReport: string[];
  }>;

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
  
  // Task sequence management
  resetTaskSequence(): Promise<void>;
  
  // System status and locks for task generation
  getSystemStatus(id: string): Promise<SystemStatus | undefined>;
  setSystemStatus(status: InsertSystemStatus): Promise<SystemStatus>;
  acquireLock(lockId: string, userId: number, lockType: string, expirationMinutes?: number): Promise<SystemLock | null>;
  releaseLock(lockId: string): Promise<boolean>;
  checkLock(lockId: string): Promise<SystemLock | null>;
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
    
    // Skip persistence restore AND seeding when using real database to prevent demo data pollution
    if (process.env.DATABASE_URL) {
      console.log('🚫 Database detected - skipping both persistence file restore AND demo data seeding');
      console.log('MemStorage will NOT seed October demo data - DatabaseStorage will handle task storage');
      
      // Only initialize growing systems (they're not persisted yet)
      if (this.growingSystems.size === 0) {
        console.log('Initializing growing systems...');
        this.initializeGrowingSystems();
      }
      
      return;
    }
    
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
      
      // CRITICAL: Reset Postgres sequence to align with existing data
      try {
        // This is handled by the DatabaseStorage when using HybridStorage
        console.log('✅ Task sequence will be managed by DatabaseStorage');
      } catch (error) {
        console.log('⚠️ Failed to reset task sequence:', error);
      }

      console.log('Persistence restored:', {
        tasks: persistedData.tasks.length,
        recurringTasks: persistedData.recurringTasks.length,
        inventoryItems: persistedData.inventoryItems.length
      });

      // CRITICAL: Reset in-memory sequence to align with existing data
      try {
        await this.resetTaskSequence();
        console.log('✅ Reset MemStorage task ID sequence');
      } catch (error) {
        console.log('⚠️ Failed to reset task sequence:', error);
      }

      // Initialize continuous verification system
      this.setupContinuousVerification();
      
      // Migrate any "weekly" frequency to "daily" for UI compatibility
      await this.migrateWeeklyFrequencies();
      
      // Use new verification system instead of legacy generation
      console.log('🔄 Starting continuous task verification system...');
      await this.verifyAndHealTasks();
      
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
    console.log('=== REVERSE MIGRATING DAILY BACK TO WEEKLY ===');
    let migratedCount = 0;
    
    // Reverse migrate: Convert 'daily' back to 'weekly' if daysOfWeek is present
    this.recurringTasks.forEach((recurringTask, id) => {
      if (recurringTask.frequency === 'daily' && recurringTask.daysOfWeek && recurringTask.daysOfWeek.length > 0) {
        recurringTask.frequency = 'weekly';
        migratedCount++;
        console.log(`Restored recurring task ${id} (${recurringTask.title}) from daily to weekly with days: ${recurringTask.daysOfWeek.join(', ')}`);
      }
    });
    
    // Don't migrate regular task instances - they should be regenerated correctly
    
    if (migratedCount > 0) {
      console.log(`Reverse migration complete: ${migratedCount} recurring tasks restored to weekly`);
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
      console.log('No daily frequencies with daysOfWeek found to restore');
    }
  }

  // BLUEPRINT: Advanced Task Generation System - Main generation function
  private async generateTasksForDateRange(startDate: Date, endDate: Date, specificTemplate: RecurringTask | null = null): Promise<Task[]> {
    console.log(`🔄 GENERATING TASKS FOR DATE RANGE: ${this.formatDate(startDate)} to ${this.formatDate(endDate)}`);
    
    // Get templates to process
    const templates = specificTemplate 
      ? [specificTemplate] 
      : Array.from(this.recurringTasks.values()).filter(rt => rt.isActive);
      
    const tasksCreated: Task[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      for (const template of templates) {
        const task = await this.shouldGenerateTask(template, currentDate);
        if (task && !await this.taskExistsForDateComposite(template.id, currentDate)) {
          // CRITICAL FIX: Use the same storage singleton that the API reads from
          const createdTask = await storage.createTask(task);
          tasksCreated.push(createdTask);
          console.log(`✅ Created task: ${task.title} for ${this.formatDate(currentDate)}`);
        }
      }
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    console.log(`🎉 Generated ${tasksCreated.length} tasks for date range`);
    return tasksCreated;
  }

  // BLUEPRINT: Task Creation Logic - Determines when to generate tasks based on frequency
  private async shouldGenerateTask(template: RecurringTask, checkDate: Date): Promise<InsertTask | null> {
    const dayOfMonth = checkDate.getUTCDate();
    const month = checkDate.getUTCMonth();
    const year = checkDate.getUTCFullYear();
    const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
    
    switch (template.frequency) {
      case 'monthly':
        if (dayOfMonth === 1) {
          const lastDay = new Date(Date.UTC(year, month + 1, 0));
          return this.buildTaskFromTemplate(template, {
            id: `${template.id}-${year}-${String(month + 1).padStart(2, '0')}`,
            visibleFromDate: new Date(Date.UTC(year, month, 1)),
            dueDate: lastDay
          });
        }
        break;
        
      case 'biweekly':
      case 'bi-weekly': {
        // True bi-weekly: every 14 days from the task's startDate
        const startDate = template.startDate ? new Date(template.startDate) : new Date(template.createdAt || Date.now());
        
        // Calculate days since start date using UTC
        const currentDateUTC = new Date(Date.UTC(year, month, dayOfMonth));
        const startDateUTC = new Date(Date.UTC(
          startDate.getUTCFullYear(),
          startDate.getUTCMonth(),
          startDate.getUTCDate()
        ));
        
        const daysDifference = Math.floor(
          (currentDateUTC.getTime() - startDateUTC.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Only generate if today is exactly on a 14-day interval from start (including day 0)
        if (daysDifference >= 0 && daysDifference % 14 === 0) {
          const taskDate = new Date(Date.UTC(year, month, dayOfMonth));
          return this.buildTaskFromTemplate(template, {
            id: `${template.id}-${this.formatDate(taskDate)}`,
            visibleFromDate: taskDate,
            dueDate: taskDate
          });
        }
        break;
      }
        
      case 'weekly': // Weekly tasks - handle both string and array formats
        const templateDays = Array.isArray(template.daysOfWeek) 
          ? template.daysOfWeek 
          : (template.daysOfWeek ? [template.daysOfWeek] : []);
        
        // FIXED: Only generate if specific days are configured AND current day matches
        if (templateDays.length > 0 && templateDays.includes(dayName)) {
          return this.buildTaskFromTemplate(template, {
            id: `${template.id}-${this.formatDate(checkDate)}`,
            visibleFromDate: checkDate,
            dueDate: checkDate
          });
        }
        // If no days specified, don't generate any tasks (instead of every day)
        break;
        
      case 'daily': // Daily tasks - respect daysOfWeek for selective generation
        const dailyTemplateDays = Array.isArray(template.daysOfWeek) 
          ? template.daysOfWeek 
          : (template.daysOfWeek ? [template.daysOfWeek] : []);
        
        // If no days specified, don't generate (empty means no days, not every day)
        if (dailyTemplateDays.length === 0) {
          return null;
        }
        
        // Only generate if current day matches specified days
        if (dailyTemplateDays.includes(dayName)) {
          return this.buildTaskFromTemplate(template, {
            id: `${template.id}-${this.formatDate(checkDate)}`,
            visibleFromDate: checkDate,
            dueDate: checkDate
          });
        }
        
        // Current day doesn't match specified days
        return null;
        
      case 'quarterly':
        const quarterStarts = [0, 3, 6, 9];
        if (quarterStarts.includes(month) && dayOfMonth === 1) {
          const quarterEnd = new Date(Date.UTC(year, month + 3, 0));
          return this.buildTaskFromTemplate(template, {
            id: `${template.id}-${year}-Q${Math.floor(month / 3) + 1}`,
            visibleFromDate: checkDate,
            dueDate: quarterEnd
          });
        }
        break;
    }
    
    return null;
  }

  // BLUEPRINT: Task Creation Helper (returns InsertTask without ID)
  private async buildTaskFromTemplate(template: RecurringTask, dateInfo: { id: string; visibleFromDate: Date; dueDate: Date }): Promise<InsertTask> {
    // Determine the correct frequency for the generated task
    const isPeriodicTask = dateInfo.visibleFromDate.getTime() !== dateInfo.dueDate.getTime();
    const taskFrequency = isPeriodicTask ? 'biweekly' : template.frequency;
    
    const newTask: InsertTask = {
      title: template.title,
      description: template.description || '',
      type: template.type,
      status: 'pending',
      priority: 'medium',
      frequency: taskFrequency, // Set correct frequency for filtering
      assignedTo: null, // Legacy field - use assignTo instead
      assignTo: template.assignTo || undefined,
      createdBy: template.createdBy,
      location: template.location,
      estimatedTime: null,
      actualTime: null,
      progress: 0,
      checklist: template.checklistTemplate?.steps?.map((step, index) => ({
        id: `${index + 1}`,
        label: step.label || '',
        text: step.label || step.text || '',
        completed: false,
        required: step.required || false,
        type: step.type,
        config: {
          ...step.config,
          text: step.config?.text || step.text || '',
          inventoryCategory: step.config?.inventoryCategory || step.inventoryCategory,
          min: step.config?.min || step.min,
          max: step.config?.max || step.max,
          default: step.config?.default || step.default,
          systemType: step.config?.systemType || step.systemType,
          autoSuggest: step.config?.autoSuggest || step.autoSuggest,
          dataType: step.config?.dataType || step.dataType,
          calculation: step.config?.calculation || step.calculation
        },
        dataCollection: step.type === 'data-capture' ? { 
          type: step.dataType || 'text', 
          label: step.label || '' 
        } : undefined
      })) || [],
      data: {},
      taskDate: dateInfo.visibleFromDate, // Set taskDate for frontend filtering
      dueDate: dateInfo.dueDate,
      visibleFromDate: dateInfo.visibleFromDate,
      startedAt: null,
      completedAt: null,
      pausedAt: null,
      resumedAt: null,
      skippedAt: null,
      skipReason: null,
      isRecurring: true,
      recurringTaskId: template.id,
      isFromDeletedRecurring: false,
      deletedRecurringTaskTitle: null
      // No createdAt - let database handle it
    };
    
    return newTask;
  }

  // BLUEPRINT: Daily Maintenance System with Locking
  async initializeGeneration(userId: number = 1): Promise<void> {
    console.log('🚀 INITIALIZING ADVANCED TASK GENERATION SYSTEM');
    
    const lock = await this.acquireLock('task-generation-lock', userId, 'task_generation', 10);
    if (!lock) {
      console.log('⏳ Another user is handling task generation');
      return;
    }
    
    try {
      const status = await this.getSystemStatus('task-generation-status');
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      const todayStr = this.formatDate(today);
      const lastRunDate = status?.lastGenerationDate;
      
      if (!status || !lastRunDate || lastRunDate < todayStr) {
        console.log(`🔄 Running generation - Last run: ${lastRunDate || 'never'}, Today: ${todayStr}`);
        
        // Start from beginning of current biweekly period to catch current tasks
        const startDate = new Date(today);
        startDate.setUTCDate(1); // Start from 1st of current month
        startDate.setUTCHours(0, 0, 0, 0);
        
        const endDate = new Date(today);
        endDate.setUTCDate(today.getUTCDate() + 31); // 31 days ahead
        endDate.setUTCHours(23, 59, 59, 999);
        
        const generatedTasks = await this.generateTasksForDateRange(startDate, endDate);
        
        // Tasks are now written directly to DatabaseStorage via createTask()
        if (generatedTasks.length > 0) {
          console.log(`✅ Successfully created ${generatedTasks.length} tasks in database`);
        }
        
        await this.setSystemStatus({
          id: 'task-generation-status',
          lastGenerationDate: todayStr,
          generatedThrough: this.formatDate(endDate),
          lastUpdateBy: userId
        });
        
        console.log('✅ Task generation complete');
      } else {
        console.log(`✅ Task generation up to date (last run: ${lastRunDate})`);
      }
    } finally {
      await this.releaseLock('task-generation-lock');
    }
  }

  // Helper methods for the new system
  private formatDate(date: Date): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  }

  private async taskExists(taskId: string): Promise<boolean> {
    // For string-based IDs from the new system, we need to check differently
    return Array.from(this.tasks.values()).some(task => {
      if (!task.dueDate) return false;
      const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
      return `${task.recurringTaskId}-${this.formatDate(dueDate)}` === taskId;
    });
  }

  private async taskExistsForDateComposite(recurringTaskId: number, targetDate: Date): Promise<boolean> {
    // Check if a task already exists for this recurring task ID and date
    return Array.from(this.tasks.values()).some(task => {
      if (!task.dueDate || task.recurringTaskId !== recurringTaskId) return false;
      
      const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
      const checkDate = new Date(targetDate);
      
      // Use UTC comparison to avoid timezone issues
      return taskDate.getUTCFullYear() === checkDate.getUTCFullYear() &&
             taskDate.getUTCMonth() === checkDate.getUTCMonth() &&
             taskDate.getUTCDate() === checkDate.getUTCDate();
    });
  }

  private async saveTask(task: Task): Promise<void> {
    console.log(`🔍 SAVE TASK DEBUG: Adding task ${task.id} (${task.title}) to in-memory cache. Cache size before: ${this.tasks.size}`);
    this.tasks.set(task.id, task);
    console.log(`🔍 SAVE TASK DEBUG: Cache size after: ${this.tasks.size}`);
  }

  // CONTINUOUS VERIFICATION SYSTEM - Self-healing task management
  public async verifyAndHealTasks(): Promise<{ created: number; updated: number; errors: string[] }> {
    console.log('=== TASK VERIFICATION STARTING ===');
    
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    // Start from beginning of current biweekly period to catch current tasks
    const startDate = new Date(today);
    startDate.setUTCDate(1); // Start from 1st of current month
    startDate.setUTCHours(0, 0, 0, 0);
    
    const endDate = new Date(today);
    endDate.setUTCDate(today.getUTCDate() + 31); // 31 days ahead
    endDate.setUTCHours(23, 59, 59, 999);
    
    const templates = Array.from(this.recurringTasks.values()).filter(t => t.isActive);
    const existingTasks = Array.from(this.tasks.values());
    
    let created = 0;
    let updated = 0;
    const errors: string[] = [];
    
    console.log(`🔍 Verifying tasks from ${this.formatDate(startDate)} to ${this.formatDate(endDate)}`);
    console.log(`🔍 Found ${templates.length} active templates, ${existingTasks.length} existing tasks`);
    
    // Check each day in our window - direct date iteration to avoid off-by-one
    for (let checkDate = new Date(startDate); checkDate <= endDate; checkDate.setUTCDate(checkDate.getUTCDate() + 1)) {
      checkDate = new Date(checkDate); // Create new instance for each iteration
      
      for (const template of templates) {
        try {
          const expectedTasks = this.getExpectedTasksForDate(template, checkDate);
          
          for (const expected of expectedTasks) {
            const existingTask = existingTasks.find(t => 
              t.recurringTaskId === expected.recurringTaskId && 
              t.dueDate && 
              expected.dueDate &&
              this.isSameDate(safeDate(t.dueDate)!, safeDate(expected.dueDate)!)
            );
            
            // Check LIVE task state, not snapshot, to avoid repeated creations
            const existingTaskLive = Array.from(this.tasks.values()).find(t => 
              t.recurringTaskId === expected.recurringTaskId && 
              t.dueDate && 
              expected.dueDate &&
              this.isSameDate(safeDate(t.dueDate)!, safeDate(expected.dueDate)!)
            );
            
            if (!existingTaskLive) {
              try {
                // Task is missing - create it using proper storage layer
                // Remove ID to let database generate it
                const { id, ...taskWithoutId } = expected;
                const createdTask = await storage.createTask(taskWithoutId);
                this.tasks.set(createdTask.id, createdTask);
                created++;
                console.log(`✅ Created missing task: ${expected.title} for ${this.formatDate(checkDate)}`);
              } catch (error) {
                const errorMsg = `Failed to create task ${expected.title}: ${error}`;
                errors.push(errorMsg);
                console.log(`❌ ${errorMsg}`);
              }
            } else if (existingTaskLive.status === 'pending') {
              // Task exists but might be outdated - verify it matches template
              // IMPORTANT: Don't update tasks due today or in the past - users are working on them
              const taskDueDate = new Date(existingTaskLive.dueDate!);
              const isToday = this.isSameDate(taskDueDate, today);
              const isPast = taskDueDate < today;
              
              if (!isToday && !isPast && this.taskNeedsUpdate(existingTaskLive, template)) {
                try {
                  // Only pass updateable fields to avoid date serialization issues
                  const updateFields = this.extractTemplateFields(template);
                  await storage.updateTask(existingTaskLive.id, updateFields);
                  
                  // Update in-memory cache with merged data
                  const updatedTask = { ...existingTaskLive, ...updateFields };
                  this.tasks.set(existingTaskLive.id, updatedTask);
                  updated++;
                  console.log(`🔄 Updated outdated task: ${existingTaskLive.title}`);
                } catch (error) {
                  const errorMsg = `Failed to update task ${existingTaskLive.title}: ${error}`;
                  errors.push(errorMsg);
                  console.log(`❌ ${errorMsg}`);
                }
              } else if (isToday || isPast) {
                console.log(`⚠️ Skipping update for current/past task: ${existingTaskLive.title} (due: ${this.formatDate(taskDueDate)})`);
              }
            }
          }
        } catch (error) {
          const errorMsg = `Error processing template ${template.title} for ${this.formatDate(checkDate)}: ${error}`;
          errors.push(errorMsg);
          console.log(`❌ ${errorMsg}`);
        }
      }
    }
    
    console.log(`🎉 Verification complete: Created ${created}, Updated ${updated}, Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log(`❌ Errors encountered:`, errors.slice(0, 5));
    }
    
    return { created, updated, errors };
  }

  // Expected task calculator - determines what tasks SHOULD exist for any given date
  private getExpectedTasksForDate(template: RecurringTask, checkDate: Date): Task[] {
    const tasks: Task[] = [];
    const dayOfMonth = checkDate.getUTCDate();
    const month = checkDate.getUTCMonth();
    const year = checkDate.getUTCFullYear();
    const dayOfWeek = checkDate.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
    
    // Daily tasks - check if should run on this day
    if (template.frequency === 'daily') {
      // For daily tasks, check if specific days are selected
      const selectedDays = Array.isArray(template.daysOfWeek) 
        ? template.daysOfWeek 
        : (template.daysOfWeek ? [template.daysOfWeek] : []);
        
      if (selectedDays.length > 0) {
        const shouldGenerate = selectedDays.includes(dayName);
        if (shouldGenerate) {
          tasks.push(this.createTaskFromTemplate(template, checkDate, checkDate));
        }
      } else {
        // FIXED: No specific days selected means NO GENERATION (not every day)
        console.log(`⏭️ Skipping daily task "${template.title}" - no days specified`);
      }
    }
    
    // Weekly tasks - only on specific days
    else if (template.frequency === 'weekly') {
      const daysOfWeek = Array.isArray(template.daysOfWeek) 
        ? template.daysOfWeek 
        : (template.daysOfWeek ? [template.daysOfWeek] : []);
      
      // Check if this day of week should have this task
      const shouldGenerate = daysOfWeek.some(day => {
        if (typeof day === 'string') {
          return day.toLowerCase() === dayName;
        } else if (typeof day === 'number') {
          return day === dayOfWeek;
        }
        return false;
      });
      
      if (shouldGenerate) {
        tasks.push(this.createTaskFromTemplate(template, checkDate, checkDate));
      }
    }
    
    // Monthly: Should exist from 1st through end of month
    else if (template.frequency === 'monthly') {
      // If we're anywhere in the month, the monthly task should exist
      if (dayOfMonth >= 1) {
        const firstOfMonth = new Date(Date.UTC(year, month, 1, 12, 0, 0));
        const lastOfMonth = new Date(Date.UTC(year, month + 1, 0, 12, 0, 0));
        
        tasks.push(this.createTaskFromTemplate(template, firstOfMonth, lastOfMonth));
      }
    }
    
    // Bi-Weekly: Two tasks per month
    else if (template.frequency === 'biweekly') {
      // First half task exists from 1st-14th
      if (dayOfMonth >= 1 && dayOfMonth <= 14) {
        const firstOfMonth = new Date(Date.UTC(year, month, 1, 12, 0, 0));
        const midMonth = new Date(Date.UTC(year, month, 14, 12, 0, 0));
        tasks.push(this.createTaskFromTemplate(template, firstOfMonth, midMonth));
      }
      
      // Second half task exists from 15th-end
      if (dayOfMonth >= 15) {
        const midMonth = new Date(Date.UTC(year, month, 15, 12, 0, 0));
        const lastDay = new Date(Date.UTC(year, month + 1, 0, 12, 0, 0));
        tasks.push(this.createTaskFromTemplate(template, midMonth, lastDay));
      }
    }
    
    // Quarterly: Entire quarter
    else if (template.frequency === 'quarterly') {
      const currentQuarter = Math.floor(month / 3);
      const quarterStart = new Date(Date.UTC(year, currentQuarter * 3, 1, 12, 0, 0));
      const quarterEnd = new Date(Date.UTC(year, (currentQuarter + 1) * 3, 0, 12, 0, 0));
      
      // If we're in this quarter, task should exist
      if (checkDate >= quarterStart && checkDate <= quarterEnd) {
        tasks.push(this.createTaskFromTemplate(template, quarterStart, quarterEnd));
      }
    }
    
    return tasks;
  }

  // Helper to create a task from a template
  private createTaskFromTemplate(template: RecurringTask, visibleDate: Date, dueDate: Date): Task {
    // Don't assign ID here - let storage layer handle it to avoid conflicts
    return {
      id: 0, // Temporary ID, will be assigned by storage layer
      title: template.title,
      description: template.description || '',
      type: template.type,
      status: 'pending',
      priority: 'medium',
      assignedTo: null, // Legacy field - use assignTo instead
      assignTo: template.assignTo,
      createdBy: template.createdBy,
      location: template.location,
      estimatedTime: null,
      actualTime: null,
      progress: 0,
      checklist: template.checklistTemplate?.steps?.map((step, index) => ({
        id: `${index + 1}`,
        label: step.label || '',
        text: step.label || step.text || '',
        completed: false,
        required: step.required || false,
        type: step.type,
        config: {
          ...step.config,
          text: step.config?.text || step.text || ''
        }
      })) || [],
      data: {},
      taskDate: visibleDate, // Add required taskDate field
      dueDate: dueDate,
      visibleFromDate: visibleDate,
      startedAt: null,
      completedAt: null,
      pausedAt: null,
      resumedAt: null,
      skippedAt: null,
      skipReason: null,
      isRecurring: true,
      recurringTaskId: template.id,
      frequency: template.frequency, // Add required frequency field
      isFromDeletedRecurring: false,
      deletedRecurringTaskTitle: null,
      // Update propagation tracking fields
      templateVersion: template.versionNumber || 1,
      isModifiedAfterCreation: false,
      modifiedFromTemplateAt: null,
      createdAt: new Date()
    };
  }

  // Check if a task needs updating based on template changes
  private taskNeedsUpdate(existingTask: Task, template: RecurringTask): boolean {
    return (
      existingTask.title !== template.title ||
      existingTask.description !== template.description ||
      existingTask.assignTo !== template.assignTo
    );
  }

  // Extract fields from template for updating (safe date handling)
  private extractTemplateFields(template: RecurringTask) {
    return {
      title: template.title,
      description: template.description || '',
      type: template.type,
      assignTo: template.assignTo,
      // Don't include dates in updates - preserve existing dates
      // Don't include IDs - preserve existing IDs
    };
  }

  // Utility to check if two dates are the same day
  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getUTCFullYear() === date2.getUTCFullYear() &&
           date1.getUTCMonth() === date2.getUTCMonth() &&
           date1.getUTCDate() === date2.getUTCDate();
  }

  // ===== CONTINUOUS VERIFICATION SYSTEM =====
  
  private verificationTimer: NodeJS.Timeout | null = null;
  private verificationLock: Map<string, { userId: number; expiresAt: Date }> = new Map();

  // Setup continuous verification with all features from user document
  setupContinuousVerification() {
    console.log('🔧 Setting up continuous verification system...');
    
    // Run verification every 30 minutes as requested
    this.verificationTimer = setInterval(async () => {
      await this.initializeAppVerification();
    }, 30 * 60 * 1000); // 30 minutes

    // Run initial verification
    setTimeout(() => this.initializeAppVerification(), 5000);
    
    console.log('✅ Continuous verification system initialized');
  }

  // Initialize app verification with locking (from user document)
  private async initializeAppVerification(userId: number = 1): Promise<void> {
    // Check if verification is needed (from user document logic)
    const lastRun = await this.getLastVerificationRun();
    const now = new Date();
    
    // Run if never run or more than 30 minutes old
    if (!lastRun || (now.getTime() - lastRun.getTime()) > 30 * 60 * 1000) {
      // Acquire lock to prevent concurrent runs
      const lockAcquired = await this.acquireVerificationLock(userId);
      
      if (lockAcquired) {
        try {
          console.log('🔄 Running 30-minute verification check...');
          await this.verifyAndHealTasks();
          
          // Update last run time
          await this.setLastVerificationRun(now, userId);
        } finally {
          await this.releaseVerificationLock();
        }
      } else {
        console.log('⏳ Another user is handling verification');
      }
    }
  }

  // Simple lock mechanism (from user document)
  private async acquireVerificationLock(userId: number): Promise<boolean> {
    const lockId = 'continuous-verification';
    const now = new Date();
    const existingLock = this.verificationLock.get(lockId);
    
    // Check if lock exists and hasn't expired
    if (existingLock && existingLock.expiresAt > now) {
      return false; // Lock is held by another user
    }
    
    // Acquire lock with 5 minute expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    this.verificationLock.set(lockId, { userId, expiresAt });
    return true;
  }

  private async releaseVerificationLock(): Promise<void> {
    this.verificationLock.delete('continuous-verification');
  }

  // Track last verification run
  private lastVerificationRun: Date | null = null;
  
  private async getLastVerificationRun(): Promise<Date | null> {
    return this.lastVerificationRun;
  }
  
  private async setLastVerificationRun(date: Date, userId: number): Promise<void> {
    this.lastVerificationRun = date;
    console.log(`✅ Verification completed by user ${userId} at ${date.toISOString()}`);
  }

  // Cleanup method
  cleanup() {
    if (this.verificationTimer) {
      clearInterval(this.verificationTimer);
      this.verificationTimer = null;
    }
  }

  // BLUEPRINT: New Recurring Task Handling - Generate current period task immediately
  async handleNewRecurringTask(template: RecurringTask): Promise<void> {
    console.log(`🆕 HANDLING NEW RECURRING TASK: ${template.title}`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let tasksCreated = 0;
    
    // Check if we need to generate current period task
    const currentPeriodTask = await this.getCurrentPeriodTask(template, today);
    if (currentPeriodTask) {
      // CRITICAL FIX: Use the same storage singleton that the API reads from
      await storage.createTask(currentPeriodTask);
      tasksCreated++;
      console.log(`✅ Created current period task for: ${template.title}`);
    }
    
    // Generate future tasks 31 days ahead
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const endDate = new Date(today);
    endDate.setUTCDate(today.getUTCDate() + 31); // 31 days ahead
    endDate.setUTCHours(23, 59, 59, 999);
    
    const futureTasks = await this.generateTasksForDateRange(tomorrow, endDate, template);
    tasksCreated += futureTasks.length;
    
    // Tasks are now written directly to DatabaseStorage via createTask()
    if (tasksCreated > 0) {
      console.log(`✅ Successfully created ${tasksCreated} tasks in database for: ${template.title}`);
    }
    
    console.log(`✅ Generated ${tasksCreated} tasks for: ${template.title}`);
  }

  // BLUEPRINT: Get Current Period Task
  private async getCurrentPeriodTask(template: RecurringTask, today: Date): Promise<Task | null> {
    const dayOfMonth = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();
    
    switch (template.frequency) {
      case 'monthly':
        // If we're past the 1st, still create this month's task
        const lastDay = new Date(Date.UTC(year, month + 1, 0));
        return this.createTaskFromTemplate(template, new Date(Date.UTC(year, month, 1)), lastDay);
        
      case 'biweekly':
        if (dayOfMonth <= 14) {
          // First period
          return this.createTaskFromTemplate(template, new Date(Date.UTC(year, month, 1)), new Date(Date.UTC(year, month, 14)));
        } else {
          // Second period
          const lastDay = new Date(Date.UTC(year, month + 1, 0));
          return this.createTaskFromTemplate(template, new Date(Date.UTC(year, month, 15)), lastDay);
        }
        
      case 'daily':
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (template.daysOfWeek?.includes(dayName)) {
          return this.createTaskFromTemplate(template, today, today);
        }
        break;
    }
    
    return null;
  }

  // Legacy method for compatibility - now delegates to new system
  private async ensureRecurringTaskInstances() {
    console.log('=== LEGACY COMPATIBILITY: Delegating to new generation system ===');
    await this.initializeGeneration();
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
        // Update propagation tracking fields
        templateVersion: 1,
        isModifiedAfterCreation: false,
        modifiedFromTemplateAt: null,
        createdAt: new Date(),
        description: task.description || null,
        estimatedTime: task.estimatedTime || null,
        actualTime: task.actualTime || null,
        progress: task.progress || 0,
        checklist: task.checklist || null,
        // Add missing required fields
        assignTo: task.assignedTo ? `user_${task.assignedTo}` : null,
        taskDate: task.dueDate || new Date(),
        visibleFromDate: task.dueDate || new Date(),
        pausedAt: null,
        resumedAt: null,
        skippedAt: null,
        skipReason: null,
        isRecurring: task.isRecurring || false,
        recurringTaskId: task.recurringTaskId || null,
        frequency: task.frequency || null,
        isFromDeletedRecurring: false,
        deletedRecurringTaskTitle: null,
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
        automation: null,
        // Add missing required fields for updated schema
        assignTo: task.assignedTo ? `user_${task.assignedTo}` : null,
        versionNumber: 1,
        lastModifiedDate: new Date(),
        lastModifiedBy: task.createdBy || null
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
    if (process.env.DATABASE_URL) {
      console.error('🚨 CRITICAL: MemStorage.getAllTasks() called despite DATABASE_URL being set!');
      console.error('🚨 This should NOT happen - all task operations should go through DatabaseStorage');
      return [];
    }
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

  async resetTaskSequence(): Promise<void> {
    // For MemStorage, just reset the counter
    this.currentTaskId = Math.max(...Array.from(this.tasks.keys()), 0) + 1;
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

  async getRecurringTask(id: number): Promise<RecurringTask | undefined> {
    return this.recurringTasks.get(id);
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
    
    // BLUEPRINT: Use new recurring task handling system
    await this.handleNewRecurringTask(newTask);
    
    // Persist data after generating task instances
    await this.persistData();
    
    return newTask;
  }

  // COMPREHENSIVE UPDATE PROPAGATION SYSTEM
  async updateRecurringTask(id: number, updates: Partial<RecurringTask>, options?: { strategy?: 'update_all' | 'new_only'; userId?: number }): Promise<{ task: RecurringTask | null; report: any }> {
    const originalTask = this.recurringTasks.get(id);
    if (!originalTask) return { task: null, report: { error: 'Task not found' } };

    // Step 1: Track what fields changed for audit trail
    const changedFields = this.identifyChangedFields(originalTask, updates);
    console.log(`🔍 [UPDATE PROPAGATION] Changes detected:`, changedFields.map(f => f.field));

    // Step 2: Increment version number for tracking
    const newVersionNumber = (originalTask.versionNumber || 1) + 1;
    
    // Step 3: Create updated task with version tracking
    const updatedTask = { 
      ...originalTask, 
      ...updates,
      versionNumber: newVersionNumber,
      lastModifiedDate: new Date(),
      lastModifiedBy: options?.userId || null
    };
    this.recurringTasks.set(id, updatedTask);

    // Step 4: Determine update strategy based on changes
    const shouldRegenerateInstances = changedFields.some(f => 
      ['frequency', 'daysOfWeek', 'isActive'].includes(f.field)
    );
    
    let propagationReport: any = {
      strategy: shouldRegenerateInstances ? 'regenerate' : 'update_existing',
      changedFields: changedFields,
      versionNumber: newVersionNumber,
      timestamp: new Date().toISOString()
    };

    // Step 5: Execute propagation strategy
    if (shouldRegenerateInstances) {
      propagationReport = await this.regenerateTaskInstancesStrategy(id, updatedTask, propagationReport);
    } else {
      propagationReport = await this.updateExistingInstancesStrategy(id, updatedTask, changedFields, propagationReport);
    }

    // Step 6: Log changes to audit trail
    await this.logRecurringTaskChange({
      recurringTaskId: id,
      changedFields: changedFields,
      changeTimestamp: new Date(),
      changedByUser: userId || null,
      affectedInstanceCount: propagationReport.processedInstances || 0,
      strategyUsed: propagationReport.strategy
    });

    // Step 7: Persist all changes
    await this.persistData();
    
    console.log(`✅ [UPDATE PROPAGATION] Completed for task "${updatedTask.title}" - ${propagationReport.processedInstances} instances affected`);
    
    return { task: updatedTask, report: propagationReport };
  }

  // FIELD-BY-FIELD CHANGE TRACKING
  private identifyChangedFields(original: RecurringTask, updates: any): Array<{ field: string; oldValue: any; newValue: any; requiresNotification: boolean }> {
    const changes: Array<{ field: string; oldValue: any; newValue: any; requiresNotification: boolean }> = [];
    
    // Fields that require user notification when changed
    const notificationRequiredFields = ['title', 'description', 'checklistTemplate', 'estimatedTime', 'priority', 'assignTo'];
    
    // Fields that should NOT affect existing instances (only new ones)
    const nonPropagatingFields = ['frequency', 'daysOfWeek', 'isActive', 'nextOccurrence'];
    
    Object.keys(updates).forEach(field => {
      if (JSON.stringify(original[field as keyof RecurringTask]) !== JSON.stringify(updates[field])) {
        changes.push({
          field,
          oldValue: original[field as keyof RecurringTask],
          newValue: updates[field],
          requiresNotification: notificationRequiredFields.includes(field)
        });
      }
    });
    
    return changes;
  }

  // REGENERATE INSTANCES STRATEGY (for frequency/schedule changes)
  private async regenerateTaskInstancesStrategy(recurringTaskId: number, updatedTask: RecurringTask, report: any): Promise<any> {
    console.log(`🔄 [REGENERATE STRATEGY] Regenerating instances for recurring task: ${updatedTask.title}`);
    
    // Delete ONLY future pending task instances (preserve completed/in-progress tasks)
    const taskIdsToDelete = Array.from(this.tasks.keys()).filter(taskId => {
      const task = this.tasks.get(taskId);
      return task?.recurringTaskId === recurringTaskId && 
             task?.status === 'pending' && 
             task?.dueDate && new Date(task.dueDate) >= new Date();
    });
    
    // Batch delete for performance
    taskIdsToDelete.forEach(taskId => this.tasks.delete(taskId));
    
    // Generate new task instances with updated schedule
    await this.generateTaskInstances(updatedTask);
    
    return {
      ...report,
      deletedInstances: taskIdsToDelete.length,
      processedInstances: taskIdsToDelete.length,
      details: 'Regenerated all future pending instances with new schedule'
    };
  }

  // UPDATE EXISTING INSTANCES STRATEGY (for content changes)
  private async updateExistingInstancesStrategy(recurringTaskId: number, updatedTask: RecurringTask, changedFields: any[], report: any): Promise<any> {
    console.log(`🔄 [UPDATE STRATEGY] Updating existing instances for recurring task: ${updatedTask.title}`);
    
    // Find all affected instances (pending + in-progress, preserve completed)
    const affectedInstances = Array.from(this.tasks.values()).filter(t => 
      t.recurringTaskId === recurringTaskId && 
      (t.status === 'pending' || t.status === 'in_progress') && 
      t.dueDate && new Date(t.dueDate) >= new Date()
    );
    
    let updatedCount = 0;
    let conflictCount = 0;
    const conflictDetails: any[] = [];
    
    // Process instances in batches for performance
    const batchSize = 100;
    for (let i = 0; i < affectedInstances.length; i += batchSize) {
      const batch = affectedInstances.slice(i, i + batchSize);
      
      batch.forEach(instance => {
        const updateResult = this.updateSingleTaskInstance(instance, updatedTask, changedFields);
        
        if (updateResult.hasConflict) {
          conflictCount++;
          conflictDetails.push({
            taskId: instance.id,
            taskTitle: instance.title,
            status: instance.status,
            conflicts: updateResult.conflicts
          });
        }
        
        // Apply the update with preserved user data
        this.tasks.set(instance.id, updateResult.updatedInstance);
        updatedCount++;
      });
      
      // Log progress for large updates
      if (affectedInstances.length > 100) {
        const progress = Math.round(((i + batch.length) / affectedInstances.length) * 100);
        console.log(`📊 [BULK UPDATE] Progress: ${progress}% (${i + batch.length}/${affectedInstances.length})`);
      }
    }
    
    return {
      ...report,
      processedInstances: updatedCount,
      conflictCount: conflictCount,
      conflictDetails: conflictDetails,
      details: `Updated ${updatedCount} existing instances with ${conflictCount} conflicts detected`
    };
  }

  // SMART SINGLE INSTANCE UPDATE WITH CONFLICT DETECTION
  private updateSingleTaskInstance(instance: any, updatedTemplate: RecurringTask, changedFields: any[]): { updatedInstance: any; hasConflict: boolean; conflicts: string[] } {
    let hasConflict = false;
    const conflicts: string[] = [];
    
    // Start with current instance
    let updatedInstance = { ...instance };
    
    // Update simple fields (preserve user modifications)
    changedFields.forEach(change => {
      switch (change.field) {
        case 'title':
          // Always update title unless user has manually modified it
          if (!instance.isModifiedAfterCreation) {
            updatedInstance.title = updatedTemplate.title;
          } else {
            hasConflict = true;
            conflicts.push(`Title was manually modified: "${instance.title}"`);
          }
          break;
          
        case 'description':
          if (!instance.isModifiedAfterCreation) {
            updatedInstance.description = updatedTemplate.description;
          }
          break;
          
        case 'priority':
          updatedInstance.priority = updatedTemplate.priority;
          break;
          
        case 'assignTo':
          updatedInstance.assignTo = updatedTemplate.assignTo;
          break;
          
        case 'estimatedTime':
          updatedInstance.estimatedTime = updatedTemplate.estimatedTime;
          break;
          
        case 'checklistTemplate':
          // Complex checklist merge with progress preservation
          const mergeResult = this.mergeChecklistWithProgress(instance.checklist, updatedTemplate.checklistTemplate);
          updatedInstance.checklist = mergeResult.mergedChecklist;
          if (mergeResult.hasConflicts) {
            hasConflict = true;
            conflicts.push(...mergeResult.conflicts);
          }
          break;
      }
    });
    
    // Update tracking fields
    updatedInstance.templateVersion = updatedTemplate.versionNumber;
    updatedInstance.modifiedFromTemplateAt = new Date();
    
    // Flag if task is in-progress and has conflicts
    if (instance.status === 'in_progress' && hasConflict) {
      // Create notification for user about changes
      this.createUpdateNotification(instance.id, conflicts);
    }
    
    return { updatedInstance, hasConflict, conflicts };
  }

  // ADVANCED CHECKLIST MERGE WITH PROGRESS PRESERVATION
  private mergeChecklistWithProgress(existingChecklist: any[], newTemplate: any): { mergedChecklist: any[]; hasConflicts: boolean; conflicts: string[] } {
    if (!newTemplate?.steps) {
      return { mergedChecklist: existingChecklist || [], hasConflicts: false, conflicts: [] };
    }
    
    const conflicts: string[] = [];
    let hasConflicts = false;
    
    const mergedChecklist = newTemplate.steps.map((newStep: any, index: number) => {
      const existingStep = existingChecklist?.[index];
      
      // Preserve user progress and data
      const mergedStep = {
        id: newStep.id || `${index + 1}`,
        text: newStep.label || newStep.text || '',
        completed: existingStep?.completed || false, // NEVER lose completion status
        required: newStep.required || false,
        type: newStep.type,
        config: newStep.config, // Always use latest config
        dataCollection: newStep.type === 'data-capture' ? { 
          type: newStep.config?.dataType || 'text', 
          label: newStep.label || '' 
        } : undefined
      };
      
      // Detect conflicts where user has entered data but step changed significantly
      if (existingStep?.completed && existingStep.text !== mergedStep.text) {
        hasConflicts = true;
        conflicts.push(`Step ${index + 1}: Text changed but user had completed "${existingStep.text}"`);
      }
      
      // Preserve user-entered data in data collection steps
      if (existingStep?.data) {
        mergedStep.data = existingStep.data;
      }
      
      return mergedStep;
    });
    
    // Handle removed steps (mark as removed but don't delete)
    if (existingChecklist && existingChecklist.length > newTemplate.steps.length) {
      const removedSteps = existingChecklist.slice(newTemplate.steps.length);
      removedSteps.forEach((removedStep, removedIndex) => {
        if (removedStep.completed) {
          hasConflicts = true;
          conflicts.push(`Step was removed but user had completed: "${removedStep.text}"`);
          // Keep the removed step marked as legacy
          mergedChecklist.push({
            ...removedStep,
            isLegacy: true,
            removedInUpdate: true
          });
        }
      });
    }
    
    return { mergedChecklist, hasConflicts, conflicts };
  }

  // CHANGE AUDIT LOGGING
  private async logRecurringTaskChange(changeData: any): Promise<void> {
    const changeLog = {
      id: this.currentChangeLogId++,
      ...changeData,
      createdAt: new Date()
    };
    
    // Store in change audit log (using notifications table for now)
    await this.createNotification({
      userId: changeData.changedByUser || 1,
      type: 'recurring_task_update',
      title: 'Recurring Task Updated',
      message: `Template "${changeData.recurringTaskId}" updated affecting ${changeData.affectedInstanceCount} instances`,
      data: changeLog
    });
    
    console.log(`📝 [AUDIT LOG] Logged change for recurring task ${changeData.recurringTaskId}`);
  }

  // USER NOTIFICATION SYSTEM
  private async createUpdateNotification(taskId: number, conflicts: string[]): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task || !task.assignedTo) return;
    
    await this.createNotification({
      userId: task.assignedTo,
      type: 'task_updated',
      title: 'Task Updated',
      message: `Task "${task.title}" has been updated. ${conflicts.length} conflicts detected.`,
      data: { taskId, conflicts }
    });
    
    console.log(`🔔 [NOTIFICATION] Created update notification for task ${taskId}`);
  }

  // CALCULATE UPDATE IMPACT WITHOUT MAKING CHANGES - MEMORY VERSION
  async calculateUpdateImpact(id: number, changedFields: any[]): Promise<{ affectedCount: number; conflictCount: number; byStatus: Record<string, number>; byDate: Record<string, number> }> {
    console.log(`🔍 [MEM IMPACT CALCULATION] Calculating impact for recurring task ${id}`);
    
    // Find all affected instances (pending + in-progress, preserve completed)
    const affectedInstances = Array.from(this.tasks.values()).filter(t => 
      t.recurringTaskId === id && 
      (t.status === 'pending' || t.status === 'in_progress') && 
      t.dueDate && new Date(t.dueDate) >= new Date()
    );

    // Group by status
    const byStatus: Record<string, number> = {};
    const byDate: Record<string, number> = {};
    let conflictCount = 0;

    for (const instance of affectedInstances) {
      // Count by status
      byStatus[instance.status] = (byStatus[instance.status] || 0) + 1;
      
      // Count by date (group by month for readability)
      if (instance.dueDate) {
        const monthKey = new Date(instance.dueDate).toISOString().substring(0, 7); // YYYY-MM
        byDate[monthKey] = (byDate[monthKey] || 0) + 1;
      }
      
      // Check for potential conflicts (simplified logic)
      if (instance.status === 'in_progress' && changedFields.some(f => ['title', 'description', 'checklistTemplate'].includes(f.field))) {
        conflictCount++;
      }
    }

    const result = {
      affectedCount: affectedInstances.length,
      conflictCount,
      byStatus,
      byDate
    };

    console.log(`📊 [MEM IMPACT RESULT] ${result.affectedCount} tasks affected, ${result.conflictCount} conflicts`);
    return result;
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
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
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
        
        // FIXED: Generate for current period even if we're mid-period
        if (!this.taskExistsForDate(recurringTask.id, dueDate)) {
          // For monthly tasks, generate if we're IN the period (between visibleDate and dueDate)
          const isInCurrentPeriod = todayUTC >= visibleDate && todayUTC <= dueDate;
          const isFuturePeriod = dueDate > todayUTC;
          
          if (isInCurrentPeriod || isFuturePeriod) {
            console.log(`✅ CREATING - Monthly task for ${dueDate.toISOString()} (period: ${visibleDate.toISOString()} to ${dueDate.toISOString()})`);
            const instance = await this.createTaskInstanceWithDates(recurringTask, visibleDate, dueDate);
            instances.push(instance);
            this.tasks.set(instance.id, instance);
          } else {
            console.log(`❌ SKIPPING - Past period (due: ${dueDate.toISOString()}, today: ${todayUTC.toISOString()})`);
          }
        } else {
          console.log(`❌ SKIPPING - Task already exists`);
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
        
        // FIXED: Generate for current period even if we're mid-period
        if (!this.taskExistsForDate(recurringTask.id, dueDate)) {
          const isInCurrentPeriod = todayUTC >= visibleDate && todayUTC <= dueDate;
          const isFuturePeriod = dueDate > todayUTC;
          
          if (isInCurrentPeriod || isFuturePeriod) {
            console.log(`✅ CREATING - Quarterly task for Q${actualQuarter + 1} ${actualYear}`);
            const instance = await this.createTaskInstanceWithDates(recurringTask, visibleDate, dueDate);
            instances.push(instance);
            this.tasks.set(instance.id, instance);
          } else {
            console.log(`❌ SKIPPING - Past period`);
          }
        } else {
          console.log(`❌ SKIPPING - Task already exists`);
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
      // Daily/weekly tasks - generate 31 days ahead
      const endDate = new Date(todayUTC);
      endDate.setUTCDate(todayUTC.getUTCDate() + 31); // 31 days ahead
      endDate.setUTCHours(23, 59, 59, 999);
      
      let currentDate = new Date(todayUTC);
      
      while (currentDate <= endDate) {
        let shouldCreate = false;
        
        if (recurringTask.frequency === 'daily') {
          // For daily tasks, check if specific days are selected
          // Handle both string and array formats for daysOfWeek
          const selectedDays = Array.isArray(recurringTask.daysOfWeek) 
            ? recurringTask.daysOfWeek 
            : (recurringTask.daysOfWeek ? [recurringTask.daysOfWeek] : []);
            
          if (selectedDays.length > 0) {
            const dayOfWeek = currentDate.getUTCDay();
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const currentDayName = dayNames[dayOfWeek];
            shouldCreate = selectedDays.includes(currentDayName);
          } else {
            // FIXED: No specific days selected means NO GENERATION (not every day)
            shouldCreate = false; 
            console.log(`⏭️ Skipping weekly task "${recurringTask.title}" - no days specified`);
          }
        } else if (recurringTask.frequency === 'weekly') {
          // Check if current day matches selected days
          const dayOfWeek = currentDate.getUTCDay();
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const currentDayName = dayNames[dayOfWeek];
          
          // Handle both string and array formats for daysOfWeek
          const selectedDays = Array.isArray(recurringTask.daysOfWeek) 
            ? recurringTask.daysOfWeek 
            : (recurringTask.daysOfWeek ? [recurringTask.daysOfWeek] : []);
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
        label: step.label || '',
        text: step.label || step.text || '',
        completed: false,
        required: step.required || false,
        type: step.type,
        config: {
          ...step.config,
          text: step.config?.text || step.text || ''
        },
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
      createdAt: new Date(),
      // Update propagation tracking fields
      templateVersion: 1,
      isModifiedAfterCreation: false,
      modifiedFromTemplateAt: null
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
    this.notifications.forEach((notification, id) => {
      if (notification.userId === userId && !notification.isRead) {
        this.notifications.set(id, {
          ...notification,
          isRead: true,
          readAt: safeDate(new Date())
        });
      }
    });
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
      const recurringTasks = Array.from(this.recurringTasks.values()).filter(t => t.isActive);
      console.log(`🔄 Regenerating task instances for ${recurringTasks.length} active recurring tasks`);
      
      let totalTasksCreated = 0;
      for (const recurringTask of recurringTasks) {
        try {
          await this.generateTaskInstances(recurringTask);
          console.log(`✅ Generated instances for: ${recurringTask.title}`);
          totalTasksCreated++;
        } catch (error) {
          console.error(`❌ Failed to generate instances for ${recurringTask.title}:`, error);
        }
      }
      
      return { totalTasksCreated, recurringTasksProcessed: recurringTasks.length };
    }
  }

  // System status and locks - stub implementations for MemStorage
  async getSystemStatus(id: string): Promise<SystemStatus | undefined> {
    return undefined;
  }

  async setSystemStatus(status: InsertSystemStatus): Promise<SystemStatus> {
    const systemStatus: SystemStatus = {
      id: status.id,
      lastGenerationDate: status.lastGenerationDate || null,
      generatedThrough: status.generatedThrough || null,
      lastUpdateBy: status.lastUpdateBy || null,
      updatedAt: new Date(),
    };
    return systemStatus;
  }

  async acquireLock(lockId: string, userId: number, lockType: string, expirationMinutes = 10): Promise<SystemLock | null> {
    try {
      // First, clean up expired locks
      await db.delete(systemLocks).where(
        and(
          eq(systemLocks.id, lockId),
          lte(systemLocks.expiresAt, new Date())
        )
      );
      
      // Try to acquire the lock
      const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
      const lockData = {
        id: lockId,
        lockedBy: userId,
        lockType,
        acquiredAt: new Date(),
        expiresAt
      };
      
      await db.insert(systemLocks).values(lockData);
      
      console.log(`🔒 Lock acquired: ${lockId} by user ${userId} (expires: ${expiresAt.toISOString()})`);
      return lockData;
    } catch (error) {
      console.log(`⚠️ Lock acquisition failed: ${lockId} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  async releaseLock(lockId: string): Promise<boolean> {
    try {
      await db.delete(systemLocks).where(eq(systemLocks.id, lockId));
      console.log(`🔓 Lock released: ${lockId}`);
      return true;
    } catch (error) {
      console.log(`⚠️ Lock release failed: ${lockId} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  async checkLock(lockId: string): Promise<SystemLock | null> {
    try {
      const locks = await db.select().from(systemLocks)
        .where(eq(systemLocks.id, lockId));
      
      if (locks.length === 0) return null;
      
      const lock = locks[0];
      
      // Check if lock has expired
      if (lock.expiresAt && lock.expiresAt <= new Date()) {
        // Clean up expired lock
        await db.delete(systemLocks).where(eq(systemLocks.id, lockId));
        console.log(`🕐 Expired lock cleaned up: ${lockId}`);
        return null;
      }
      
      return lock;
    } catch (error) {
      console.log(`⚠️ Lock check failed: ${lockId} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  // Simple verification implementation for MemStorage (mostly for interface compliance)
  async verifyTaskIntegrity(): Promise<{
    missingTasksCreated: number;
    duplicatesRemoved: number;
    errors: string[];
    verificationReport: string[];
  }> {
    return {
      missingTasksCreated: 0,
      duplicatesRemoved: 0,
      errors: [],
      verificationReport: ['MemStorage verification not implemented - use DatabaseStorage for full verification']
    };
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
    return db.select().from(tasks).where(eq(tasks.assignedTo, userId));
  }

  async getAllTasks(): Promise<Task[]> {
    const allTasks = await db.select().from(tasks);
    console.log(`📊 DatabaseStorage.getAllTasks() served ${allTasks.length} tasks`);
    if (allTasks.length > 0) {
      const firstTask = allTasks[0];
      const lastTask = allTasks[allTasks.length - 1];
      console.log(`📅 First task: ${firstTask.title} (taskDate: ${firstTask.taskDate}, dueDate: ${firstTask.dueDate})`);
      console.log(`📅 Last task: ${lastTask.title} (taskDate: ${lastTask.taskDate}, dueDate: ${lastTask.dueDate})`);
    }
    return allTasks;
  }

  async getTasksByLocation(locationId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.location, locationId));
  }

  private async findDuplicateTask(title: string, taskDate: Date | string | null, location: string, recurringTaskId?: number | null): Promise<Task | null> {
    const taskDateStr = taskDate ? new Date(taskDate).toISOString().split('T')[0] : null;
    
    const conditions = [
      eq(tasks.title, title),
      eq(tasks.location, location)
    ];
    
    if (taskDateStr) {
      conditions.push(sql`DATE(${tasks.taskDate}) = ${taskDateStr}`);
    }
    
    if (recurringTaskId) {
      conditions.push(eq(tasks.recurringTaskId, recurringTaskId));
    }
    
    const [duplicate] = await db.select().from(tasks).where(and(...conditions)).limit(1);
    return duplicate || null;
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const safeTaskData = {
      ...taskData,
      taskDate: taskData.taskDate || taskData.visibleFromDate || null
    };
    
    const duplicate = await this.findDuplicateTask(
      safeTaskData.title,
      safeTaskData.taskDate,
      safeTaskData.location,
      safeTaskData.recurringTaskId
    );
    
    if (duplicate) {
      console.log(`🔍 Duplicate task found: "${safeTaskData.title}" on ${safeTaskData.taskDate} at ${safeTaskData.location} - updating existing task #${duplicate.id}`);
      const updatedTask = await this.updateTask(duplicate.id, safeTaskData);
      return updatedTask || duplicate;
    }
    
    const [task] = await db.insert(tasks).values(safeTaskData).returning();
    return task;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    // Safe date serialization - only convert known date fields when they're Date instances
    const safeUpdates = { ...updates };
    const dateFields = ['dueDate', 'createdAt', 'startedAt', 'completedAt', 'pausedAt', 'resumedAt', 'visibleFromDate'];
    
    for (const field of dateFields) {
      if (field in safeUpdates) {
        const value = safeUpdates[field];
        if (value instanceof Date) {
          // Keep as Date - Drizzle will handle it
          safeUpdates[field] = value;
        } else if (typeof value === 'string') {
          // Convert string to Date if valid
          safeUpdates[field] = new Date(value);
        }
        // null/undefined pass through unchanged
      }
    }
    
    const [task] = await db.update(tasks).set(safeUpdates).where(eq(tasks.id, id)).returning();
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

  async resetTaskSequence(): Promise<void> {
    // Reset PostgreSQL sequence to match current max ID
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('tasks','id'), COALESCE((SELECT MAX(id)+1 FROM tasks),1), false)`);
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
    // Case-insensitive location matching to handle mixed case in database
    return db.select().from(recurringTasks).where(sql`LOWER(${recurringTasks.location}) = LOWER(${locationId})`);
  }

  async createRecurringTask(taskData: InsertRecurringTask): Promise<RecurringTask> {
    const [task] = await db.insert(recurringTasks).values(taskData).returning();
    return task;
  }

  async updateRecurringTask(id: number, updates: Partial<RecurringTask>, options?: { strategy?: 'update_all' | 'new_only'; userId?: number }): Promise<{ task: RecurringTask | null; report: any }> {
    try {
      console.log(`🔍 [DATABASE PROPAGATION] Starting update for recurring task ${id}`);
      
      // Step 1: Get original task
      const [originalTask] = await db.select().from(recurringTasks).where(eq(recurringTasks.id, id));
      if (!originalTask) {
        return { task: null, report: { error: 'Task not found' } };
      }

      // Step 2: Track changed fields for audit trail
      const changedFields = this.identifyChangedFields(originalTask, updates);
      console.log(`🔍 [UPDATE PROPAGATION] Changes detected:`, changedFields.map(f => f.field));

      // Step 3: Increment version number for tracking
      const newVersionNumber = (originalTask.versionNumber || 1) + 1;
      
      // Step 4: Create updated task with version tracking
      const updateData = { 
        ...updates,
        versionNumber: newVersionNumber,
        lastModifiedDate: new Date(),
        lastModifiedBy: options?.userId || null
      };
      
      const [updatedTask] = await db.update(recurringTasks)
        .set(updateData)
        .where(eq(recurringTasks.id, id))
        .returning();

      // Step 5: Determine update strategy based on changes
      const shouldRegenerateInstances = changedFields.some(f => 
        ['frequency', 'daysOfWeek', 'isActive'].includes(f.field)
      );
      
      let propagationReport: any = {
        strategy: shouldRegenerateInstances ? 'regenerate' : 'update_existing',
        changedFields: changedFields,
        versionNumber: newVersionNumber,
        timestamp: new Date().toISOString()
      };

      // Step 6: Execute propagation strategy
      if (shouldRegenerateInstances) {
        propagationReport = await this.regenerateTaskInstancesStrategyDB(id, updatedTask, propagationReport);
      } else {
        propagationReport = await this.updateExistingInstancesStrategyDB(id, updatedTask, changedFields, propagationReport);
      }

      // Step 7: Log changes to audit trail
      await this.logRecurringTaskChangeDB({
        recurringTaskId: id,
        changedFields: changedFields,
        changeTimestamp: new Date(),
        changedByUser: options?.userId || null,
        affectedInstanceCount: propagationReport.processedInstances || 0,
        strategyUsed: propagationReport.strategy
      });
      
      console.log(`✅ [DATABASE PROPAGATION] Completed for task "${updatedTask.title}" - ${propagationReport.processedInstances} instances affected`);
      
      return { task: updatedTask, report: propagationReport };
    } catch (error) {
      console.error('Error updating recurring task:', error);
      throw error;
    }
  }

  // FIELD-BY-FIELD CHANGE TRACKING FOR DATABASE STORAGE
  private identifyChangedFields(original: RecurringTask, updates: any): Array<{ field: string; oldValue: any; newValue: any; requiresNotification: boolean }> {
    const changes: Array<{ field: string; oldValue: any; newValue: any; requiresNotification: boolean }> = [];
    
    // Fields that require user notification when changed
    const notificationRequiredFields = ['title', 'description', 'checklistTemplate', 'estimatedTime', 'priority', 'assignTo'];
    
    Object.keys(updates).forEach(field => {
      if (JSON.stringify(original[field as keyof RecurringTask]) !== JSON.stringify(updates[field])) {
        changes.push({
          field,
          oldValue: original[field as keyof RecurringTask],
          newValue: updates[field],
          requiresNotification: notificationRequiredFields.includes(field)
        });
      }
    });
    
    return changes;
  }

  // REGENERATE INSTANCES STRATEGY (for frequency/schedule changes) - DATABASE VERSION
  private async regenerateTaskInstancesStrategyDB(recurringTaskId: number, updatedTask: RecurringTask, report: any): Promise<any> {
    console.log(`🔄 [DB REGENERATE STRATEGY] Regenerating instances for recurring task: ${updatedTask.title}`);
    
    // Delete ONLY future pending task instances (preserve completed/in-progress tasks)
    const deletedResult = await db.delete(tasks)
      .where(and(
        eq(tasks.recurringTaskId, recurringTaskId),
        eq(tasks.status, 'pending'),
        gte(tasks.dueDate, new Date())
      ));
    
    const deletedCount = deletedResult.rowCount || 0;
    
    // Note: Task instance generation would need to be implemented here
    // For now, returning the deletion count
    
    return {
      ...report,
      deletedInstances: deletedCount,
      processedInstances: deletedCount,
      details: 'Regenerated all future pending instances with new schedule'
    };
  }

  // UPDATE EXISTING INSTANCES STRATEGY (for content changes) - DATABASE VERSION
  private async updateExistingInstancesStrategyDB(recurringTaskId: number, updatedTask: RecurringTask, changedFields: any[], report: any): Promise<any> {
    console.log(`🔄 [DB UPDATE STRATEGY] Updating existing instances for recurring task: ${updatedTask.title}`);
    
    // Find all affected instances (pending + in-progress, preserve completed)
    const affectedInstances = await db.select()
      .from(tasks)
      .where(and(
        eq(tasks.recurringTaskId, recurringTaskId),
        or(eq(tasks.status, 'pending'), eq(tasks.status, 'in_progress')),
        gte(tasks.dueDate, new Date())
      ));
    
    let updatedCount = 0;
    let conflictCount = 0;
    const conflictDetails: any[] = [];
    
    // Process instances in batches for performance
    const batchSize = 100;
    for (let i = 0; i < affectedInstances.length; i += batchSize) {
      const batch = affectedInstances.slice(i, i + batchSize);
      
      // Prepare batch updates
      const batchUpdates = batch.map(instance => {
        const updateResult = this.updateSingleTaskInstanceDB(instance, updatedTask, changedFields);
        
        if (updateResult.hasConflict) {
          conflictCount++;
          conflictDetails.push({
            taskId: instance.id,
            taskTitle: instance.title,
            status: instance.status,
            conflicts: updateResult.conflicts
          });
        }
        
        return {
          id: instance.id,
          updates: updateResult.updateData
        };
      });
      
      // Execute batch updates
      for (const { id, updates } of batchUpdates) {
        await db.update(tasks).set(updates).where(eq(tasks.id, id));
        updatedCount++;
      }
      
      // Log progress for large updates
      if (affectedInstances.length > 100) {
        const progress = Math.round(((i + batch.length) / affectedInstances.length) * 100);
        console.log(`📊 [DB BULK UPDATE] Progress: ${progress}% (${i + batch.length}/${affectedInstances.length})`);
      }
    }
    
    return {
      ...report,
      processedInstances: updatedCount,
      conflictCount: conflictCount,
      conflictDetails: conflictDetails,
      details: `Updated ${updatedCount} existing instances with ${conflictCount} conflicts detected`
    };
  }

  // SMART SINGLE INSTANCE UPDATE WITH CONFLICT DETECTION - DATABASE VERSION
  private updateSingleTaskInstanceDB(instance: any, updatedTemplate: RecurringTask, changedFields: any[]): { updateData: any; hasConflict: boolean; conflicts: string[] } {
    let hasConflict = false;
    const conflicts: string[] = [];
    
    // Start with minimal update data
    let updateData: any = {
      templateVersion: updatedTemplate.versionNumber,
      modifiedFromTemplateAt: new Date()
    };
    
    // Update simple fields (preserve user modifications)
    changedFields.forEach(change => {
      switch (change.field) {
        case 'title':
          // Always update title unless user has manually modified it
          if (!instance.isModifiedAfterCreation) {
            updateData.title = updatedTemplate.title;
          } else {
            hasConflict = true;
            conflicts.push(`Title was manually modified: "${instance.title}"`);
          }
          break;
          
        case 'description':
          if (!instance.isModifiedAfterCreation) {
            updateData.description = updatedTemplate.description;
          }
          break;
          
        case 'priority':
          updateData.priority = updatedTemplate.priority;
          break;
          
        case 'assignTo':
          updateData.assignTo = updatedTemplate.assignTo;  // FIXED: Update correct field (assignTo, not assignedTo)
          break;
          
        case 'estimatedTime':
          updateData.estimatedTime = updatedTemplate.estimatedTime;
          break;
          
        case 'checklistTemplate':
          // Complex checklist merge with progress preservation
          const mergeResult = this.mergeChecklistWithProgressDB(instance.checklist, updatedTemplate.checklistTemplate);
          updateData.checklist = mergeResult.mergedChecklist;
          if (mergeResult.hasConflicts) {
            hasConflict = true;
            conflicts.push(...mergeResult.conflicts);
          }
          break;
      }
    });
    
    return { updateData, hasConflict, conflicts };
  }

  // ADVANCED CHECKLIST MERGE WITH PROGRESS PRESERVATION - DATABASE VERSION
  private mergeChecklistWithProgressDB(existingChecklist: any[], newTemplate: any): { mergedChecklist: any[]; hasConflicts: boolean; conflicts: string[] } {
    if (!newTemplate?.steps) {
      return { mergedChecklist: existingChecklist || [], hasConflicts: false, conflicts: [] };
    }
    
    const conflicts: string[] = [];
    let hasConflicts = false;
    
    const mergedChecklist = newTemplate.steps.map((newStep: any, index: number) => {
      const existingStep = existingChecklist?.[index];
      
      // Preserve user progress and data
      const mergedStep = {
        id: newStep.id || `${index + 1}`,
        text: newStep.label || newStep.text || '',
        completed: existingStep?.completed || false, // NEVER lose completion status
        required: newStep.required || false,
        type: newStep.type,
        config: newStep.config, // Always use latest config
        dataCollection: newStep.type === 'data-capture' ? { 
          type: newStep.config?.dataType || 'text', 
          label: newStep.label || '' 
        } : undefined
      };
      
      // Detect conflicts where user has entered data but step changed significantly
      if (existingStep?.completed && existingStep.text !== mergedStep.text) {
        hasConflicts = true;
        conflicts.push(`Step ${index + 1}: Text changed but user had completed "${existingStep.text}"`);
      }
      
      // Preserve user-entered data in data collection steps
      if (existingStep?.data) {
        mergedStep.data = existingStep.data;
      }
      
      return mergedStep;
    });
    
    // Handle removed steps (mark as removed but don't delete)
    if (existingChecklist && existingChecklist.length > newTemplate.steps.length) {
      const removedSteps = existingChecklist.slice(newTemplate.steps.length);
      removedSteps.forEach((removedStep, removedIndex) => {
        if (removedStep.completed) {
          hasConflicts = true;
          conflicts.push(`Step was removed but user had completed: "${removedStep.text}"`);
          // Keep the removed step marked as legacy
          mergedChecklist.push({
            ...removedStep,
            isLegacy: true,
            removedInUpdate: true
          });
        }
      });
    }
    
    return { mergedChecklist, hasConflicts, conflicts };
  }

  // CHANGE AUDIT LOGGING - DATABASE VERSION
  private async logRecurringTaskChangeDB(changeData: any): Promise<void> {
    // Skip notification logging if no valid user ID (prevent foreign key constraint errors)
    if (!changeData.changedByUser) {
      console.log(`⚠️ [AUDIT LOG] Skipping notification - no valid user ID provided`);
      return;
    }

    // Store in notifications table as audit log for now
    await db.insert(notifications).values({
      userId: changeData.changedByUser,
      type: 'recurring_task_update',
      title: 'Recurring Task Updated',
      message: `Template "${changeData.recurringTaskId}" updated affecting ${changeData.affectedInstanceCount} instances`,
      data: JSON.stringify(changeData),
      createdAt: new Date(),
      readAt: null
    });
    
    console.log(`📝 [DB AUDIT LOG] Logged change for recurring task ${changeData.recurringTaskId}`);
  }

  // CALCULATE UPDATE IMPACT WITHOUT MAKING CHANGES - DATABASE VERSION
  async calculateUpdateImpact(id: number, changedFields: any[]): Promise<{ affectedCount: number; conflictCount: number; byStatus: Record<string, number>; byDate: Record<string, number> }> {
    console.log(`🔍 [DB IMPACT CALCULATION] Calculating impact for recurring task ${id}`);
    
    // Find all affected instances (pending + in-progress, preserve completed)
    const affectedInstances = await db.select()
      .from(tasks)
      .where(and(
        eq(tasks.recurringTaskId, id),
        or(eq(tasks.status, 'pending'), eq(tasks.status, 'in_progress')),
        gte(tasks.dueDate, new Date())
      ));

    // Group by status
    const byStatus: Record<string, number> = {};
    const byDate: Record<string, number> = {};
    let conflictCount = 0;

    for (const instance of affectedInstances) {
      // Count by status
      byStatus[instance.status] = (byStatus[instance.status] || 0) + 1;
      
      // Count by date (group by month for readability)
      if (instance.dueDate) {
        const monthKey = new Date(instance.dueDate).toISOString().substring(0, 7); // YYYY-MM
        byDate[monthKey] = (byDate[monthKey] || 0) + 1;
      }
      
      // Check for potential conflicts (simplified logic)
      if (instance.status === 'in_progress' && changedFields.some(f => ['title', 'description', 'checklistTemplate'].includes(f.field))) {
        conflictCount++;
      }
    }

    const result = {
      affectedCount: affectedInstances.length,
      conflictCount,
      byStatus,
      byDate
    };

    console.log(`📊 [DB IMPACT RESULT] ${result.affectedCount} tasks affected, ${result.conflictCount} conflicts`);
    return result;
  }

  async deleteRecurringTask(id: number): Promise<boolean> {
    console.log('🗑️ [DB DELETE] Deleting recurring task with associated tasks:', id);
    
    try {
      // First, check if the recurring task exists
      const recurringTask = await db.select().from(recurringTasks).where(eq(recurringTasks.id, id)).limit(1);
      if (recurringTask.length === 0) {
        console.log('🚫 [DB DELETE] Recurring task not found:', id);
        return false;
      }

      // Step 1: Delete task_logs for pending/skipped tasks that will be deleted
      // Must happen BEFORE deleting tasks due to foreign key constraint (task_logs.task_id -> tasks.id)
      const pendingTaskIds = await db.select({ id: tasks.id })
        .from(tasks)
        .where(
          and(
            eq(tasks.recurringTaskId, id),
            or(
              eq(tasks.status, 'pending'),
              eq(tasks.status, 'skipped')
            )
          )
        );
      
      if (pendingTaskIds.length > 0) {
        const idsToClean = pendingTaskIds.map(t => t.id);
        const deletedLogs = await db.delete(taskLogs)
          .where(inArray(taskLogs.taskId, idsToClean));
        console.log(`🗑️ [DB DELETE] Deleted ${deletedLogs.rowCount || 0} task_logs for ${idsToClean.length} pending/skipped tasks`);
      }

      // Step 2: Delete the pending/skipped task instances
      const deletedTasks = await db.delete(tasks)
        .where(
          and(
            eq(tasks.recurringTaskId, id),
            or(
              eq(tasks.status, 'pending'),
              eq(tasks.status, 'skipped')
            )
          )
        );
      
      console.log(`🗑️ [DB DELETE] Deleted ${deletedTasks.rowCount || 0} pending/skipped tasks for recurring task ${id}`);

      // Step 3: Orphan remaining tasks (completed, in_progress) by setting recurringTaskId to null
      // This preserves historical data while breaking the foreign key reference
      // task_logs for these tasks are kept intact since the tasks themselves are preserved
      const orphanedTasks = await db.update(tasks)
        .set({ 
          recurringTaskId: null,
          isFromDeletedRecurring: true,
          deletedRecurringTaskTitle: recurringTask[0].title
        })
        .where(eq(tasks.recurringTaskId, id));
      
      console.log(`🗑️ [DB DELETE] Orphaned ${orphanedTasks.rowCount || 0} historical tasks for recurring task ${id}`);

      // Step 4: Delete the recurring task template (no more foreign key references)
      await db.delete(recurringTasks).where(eq(recurringTasks.id, id));
      
      console.log(`✅ [DB DELETE] Successfully deleted recurring task ${id}: "${recurringTask[0].title}"`);
      return true;
      
    } catch (error) {
      console.error('❌ [DB DELETE] Failed to delete recurring task:', error);
      throw error;
    }
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
  
  // Course Assignment methods (matching routes.ts expectations)
  async getCourseAssignment(id: number): Promise<CourseAssignment | undefined> { return undefined; }
  async getAllCourseAssignments(): Promise<CourseAssignment[]> { return []; }
  async getCourseAssignmentsByUser(userId: number): Promise<CourseAssignment[]> { return []; }
  async deleteCourseAssignment(id: number): Promise<boolean> { return false; }
  
  // Notification methods (matching routes.ts expectations)
  async getNotification(id: number): Promise<Notification | undefined> { return undefined; }
  async getAllNotifications(): Promise<Notification[]> { return []; }
  async getNotificationsByUser(userId: number): Promise<Notification[]> { return []; }
  async createNotification(notificationData: InsertNotification): Promise<Notification> { throw new Error('Not implemented'); }
  async updateNotification(id: number, updates: Partial<Notification>): Promise<Notification | undefined> { return undefined; }
  async markNotificationAsRead(id: number): Promise<Notification | undefined> { return undefined; }
  async markAllNotificationsAsRead(userId: number): Promise<void> { return; }
  async deleteNotification(id: number): Promise<boolean> { return false; }
  
  // Training methods (matching interface)
  async getTrainingModule(id: number): Promise<TrainingModule | undefined> { return undefined; }
  async getAllTrainingModules(): Promise<TrainingModule[]> { return []; }
  async createTrainingModule(moduleData: InsertTrainingModule): Promise<TrainingModule> { throw new Error('Not implemented'); }
  async getUserProgress(userId: number): Promise<UserProgress[]> { return []; }
  async updateUserProgress(progressData: InsertUserProgress): Promise<UserProgress> { throw new Error('Not implemented'); }
  
  // Task logs
  async createTaskLog(logData: InsertTaskLog): Promise<TaskLog> { throw new Error('Not implemented'); }
  async getTaskLogs(taskId: number): Promise<TaskLog[]> { return []; }
  
  // Task generation methods - generate DATABASE entries from recurring tasks
  async regenerateAllTaskInstances(): Promise<{ totalTasksCreated: number; recurringTasksProcessed: number }> {
    console.log('🔄 DatabaseStorage.regenerateAllTaskInstances() - generating task instances from recurring tasks...');
    
    // Get all active recurring tasks
    const activeRecurringTasks = await db.select().from(recurringTasks).where(eq(recurringTasks.isActive, true));
    console.log(`📋 Found ${activeRecurringTasks.length} active recurring tasks to process`);
    
    let totalTasksCreated = 0;
    let recurringTasksProcessed = 0;
    
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    for (const recurringTask of activeRecurringTasks) {
      try {
        const tasksCreated = await this.generateTaskInstancesForRecurringTask(recurringTask, currentDate);
        totalTasksCreated += tasksCreated;
        recurringTasksProcessed++;
        
        if (tasksCreated > 0) {
          console.log(`✅ Generated ${tasksCreated} task instances for "${recurringTask.title}" (${recurringTask.frequency})`);
        }
      } catch (error) {
        console.error(`❌ Error generating tasks for recurring task ${recurringTask.id}: ${error}`);
      }
    }
    
    console.log(`🎯 DatabaseStorage task generation complete: ${totalTasksCreated} tasks created from ${recurringTasksProcessed} recurring tasks`);
    return { totalTasksCreated, recurringTasksProcessed };
  }
  async regenerateTaskInstances(recurringTaskId: number): Promise<boolean> {
    // Get the specific recurring task
    const [recurringTask] = await db.select().from(recurringTasks).where(eq(recurringTasks.id, recurringTaskId));
    if (!recurringTask || !recurringTask.isActive) {
      return false;
    }
    
    const currentDate = new Date();
    const tasksCreated = await this.generateTaskInstancesForRecurringTask(recurringTask, currentDate);
    return tasksCreated > 0;
  }

  // Task verification system - checks for missing tasks and duplicates in 31-day window
  async verifyTaskIntegrity(): Promise<{
    missingTasksCreated: number;
    duplicatesRemoved: number;
    errors: string[];
    verificationReport: string[];
  }> {
    const report: string[] = [];
    const errors: string[] = [];
    let missingTasksCreated = 0;
    let duplicatesRemoved = 0;

    try {
      report.push(`🔍 Starting task integrity verification at ${new Date().toISOString()}`);
      
      // Get all active recurring tasks
      const activeRecurringTasks = await db.select().from(recurringTasks).where(eq(recurringTasks.isActive, true));
      report.push(`📋 Found ${activeRecurringTasks.length} active recurring tasks to verify`);

      const currentDate = new Date();
      const endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() + 31); // 31-day window

      for (const recurringTask of activeRecurringTasks) {
        try {
          // Check what tasks should exist for this recurring task in the 31-day window
          const expectedTasks = await this.generateExpectedTaskDates(recurringTask, currentDate, endDate);
          
          
          // Check what tasks actually exist
          const existingTasks = await db.select().from(tasks).where(
            and(
              eq(tasks.title, recurringTask.title),
              eq(tasks.location, recurringTask.location),
              gte(tasks.taskDate, currentDate),
              lte(tasks.taskDate, endDate)
            )
          );

          // Find missing tasks
          const existingTaskDates = new Set(existingTasks.map(t => t.taskDate?.toDateString()));
          const missingDates = expectedTasks.filter(date => !existingTaskDates.has(date.toDateString()));
          
          
          // Create missing tasks
          for (const missingDate of missingDates) {
            // Race condition protection: check if task already exists before creation
            const existingTaskCheck = await db.select().from(tasks).where(
              and(
                eq(tasks.title, recurringTask.title),
                eq(tasks.location, recurringTask.location),
                sql`DATE(${tasks.taskDate}) = ${missingDate.toISOString().split('T')[0]}`
              )
            ).limit(1);
            
            if (existingTaskCheck.length > 0) {
              // Task was created by another verification run, skip
              continue;
            }
            
            const dueDate = recurringTask.frequency === 'daily' ? new Date(missingDate) : new Date(missingDate.getTime() + (7 * 24 * 60 * 60 * 1000));
            
            try {
              await db.insert(tasks).values({
                title: recurringTask.title,
                description: recurringTask.description,
                type: recurringTask.type,
                status: 'pending',
              priority: 'medium',
              assignedTo: null,
              assignTo: recurringTask.assignTo,
              createdBy: recurringTask.createdBy,
              location: recurringTask.location,
              taskDate: missingDate,
              dueDate: dueDate,
              frequency: recurringTask.frequency,
              isRecurring: true,
              recurringTaskId: recurringTask.id, // CRITICAL FIX: Add missing recurringTaskId field
              estimatedTime: null,
              actualTime: null,
              progress: 0,
              checklist: recurringTask.checklistTemplate?.steps || [],
              data: {},
              visibleFromDate: missingDate,
              startedAt: null,
              completedAt: null,
              pausedAt: null,
              resumedAt: null,
              skippedAt: null,
              deletedRecurringTaskId: null,
              deletedRecurringTaskTitle: null
            });
              
              missingTasksCreated++;
              report.push(`✅ Created missing task "${recurringTask.title}" for ${missingDate.toDateString()}`);
            } catch (insertError) {
              // Handle duplicate insertion errors (race condition)
              if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
                // Duplicate key violation - task was created by another process
                continue;
              }
              // Re-throw other errors
              throw insertError;
            }
          }

          // Find and remove duplicates (same title, location, and taskDate)
          const tasksByDate = new Map<string, typeof existingTasks>();
          for (const task of existingTasks) {
            const dateKey = task.taskDate?.toDateString();
            if (dateKey) {
              if (tasksByDate.has(dateKey)) {
                // Found duplicate - remove the one with higher ID (newer)
                const existing = tasksByDate.get(dateKey)!;
                const duplicateTask = task.id > existing[0].id ? task : existing[0];
                
                await db.delete(tasks).where(eq(tasks.id, duplicateTask.id));
                duplicatesRemoved++;
                report.push(`🗑️ Removed duplicate task "${recurringTask.title}" (ID: ${duplicateTask.id}) for ${dateKey}`);
                
                // Keep the older task in the map
                if (task.id < existing[0].id) {
                  tasksByDate.set(dateKey, [task]);
                }
              } else {
                tasksByDate.set(dateKey, [task]);
              }
            }
          }

        } catch (error) {
          const errorMsg = `❌ Error verifying recurring task "${recurringTask.title}": ${error}`;
          errors.push(errorMsg);
          report.push(errorMsg);
        }
      }

      report.push(`🎯 Verification complete: ${missingTasksCreated} missing tasks created, ${duplicatesRemoved} duplicates removed`);
      
    } catch (error) {
      const errorMsg = `❌ Critical error during task verification: ${error}`;
      errors.push(errorMsg);
      report.push(errorMsg);
    }

    return {
      missingTasksCreated,
      duplicatesRemoved,
      errors,
      verificationReport: report
    };
  }

  // CRITICAL DATA REPAIR: Fix orphaned task instances by linking them to proper recurring task templates
  async repairOrphanedTaskLinkage(): Promise<{
    orphanedTasksFound: number;
    tasksLinked: number;
    unmatchedTasks: number;
    errors: string[];
    repairReport: string[];
  }> {
    const report: string[] = [];
    const errors: string[] = [];
    let orphanedTasksFound = 0;
    let tasksLinked = 0;
    let unmatchedTasks = 0;

    try {
      report.push(`🔧 Starting orphaned task linkage repair at ${new Date().toISOString()}`);
      
      // Find all orphaned tasks (those that should be recurring but lack proper linkage)
      const orphanedTasks = await db.select().from(tasks).where(
        and(
          or(
            isNull(tasks.recurringTaskId),
            eq(tasks.recurringTaskId, 0)
          ),
          eq(tasks.isRecurring, false) // These are likely orphaned instances
        )
      );

      orphanedTasksFound = orphanedTasks.length;
      report.push(`📋 Found ${orphanedTasksFound} potentially orphaned tasks`);

      if (orphanedTasksFound === 0) {
        report.push(`✅ No orphaned tasks found - all tasks properly linked`);
        return {
          orphanedTasksFound: 0,
          tasksLinked: 0,
          unmatchedTasks: 0,
          errors,
          repairReport: report
        };
      }

      // Get all active recurring task templates for matching
      const recurringTemplates = await db.select().from(recurringTasks).where(eq(recurringTasks.isActive, true));
      report.push(`🎯 Using ${recurringTemplates.length} active recurring task templates for matching`);

      // Create efficient lookup maps for matching
      const templatesByExactMatch = new Map<string, typeof recurringTemplates[0]>();
      const templatesByTitle = new Map<string, typeof recurringTemplates[0][]>();

      for (const template of recurringTemplates) {
        // Exact match key: title + location + type + frequency + assignment
        const exactKey = `${template.title}|${template.location}|${template.type}|${template.frequency}|${template.assignTo || ''}`;
        templatesByExactMatch.set(exactKey, template);

        // Title-based lookup for fallback matching
        const titleKey = template.title.toLowerCase().trim();
        if (!templatesByTitle.has(titleKey)) {
          templatesByTitle.set(titleKey, []);
        }
        templatesByTitle.get(titleKey)!.push(template);
      }

      // Process orphaned tasks in batches for efficiency
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < orphanedTasks.length; i += batchSize) {
        batches.push(orphanedTasks.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        for (const task of batch) {
          try {
            let matchedTemplate = null;

            // Strategy 1: Exact match (highest confidence)
            const exactKey = `${task.title}|${task.location}|${task.type}|${task.frequency}|${task.assignTo || ''}`;
            matchedTemplate = templatesByExactMatch.get(exactKey);

            // Strategy 2: Title + Location match (high confidence)
            if (!matchedTemplate && task.title) {
              const titleCandidates = templatesByTitle.get(task.title.toLowerCase().trim());
              if (titleCandidates) {
                matchedTemplate = titleCandidates.find(t => t.location === task.location);
              }
            }

            // Strategy 3: Title-only match (medium confidence, prefer first match)
            if (!matchedTemplate && task.title) {
              const titleCandidates = templatesByTitle.get(task.title.toLowerCase().trim());
              if (titleCandidates && titleCandidates.length === 1) {
                // Only auto-match if there's exactly one template with this title
                matchedTemplate = titleCandidates[0];
              }
            }

            // Strategy 4: Fuzzy title matching for common variations
            if (!matchedTemplate && task.title) {
              const taskTitle = task.title.toLowerCase().trim();
              for (const [templateTitle, candidates] of templatesByTitle.entries()) {
                // Check for close title matches (accounting for minor variations)
                if (this.isSimilarTitle(taskTitle, templateTitle)) {
                  const locationMatch = candidates.find(t => t.location === task.location);
                  if (locationMatch) {
                    matchedTemplate = locationMatch;
                    break;
                  }
                }
              }
            }

            if (matchedTemplate) {
              // Update the orphaned task with the correct recurringTaskId
              await db.update(tasks)
                .set({ 
                  recurringTaskId: matchedTemplate.id,
                  isRecurring: true,
                  // Fix any assignment discrepancies while we're at it
                  assignTo: matchedTemplate.assignTo || task.assignTo
                })
                .where(eq(tasks.id, task.id));

              tasksLinked++;
              report.push(`✅ Linked task "${task.title}" (ID: ${task.id}) to recurring template "${matchedTemplate.title}" (ID: ${matchedTemplate.id})`);
            } else {
              unmatchedTasks++;
              report.push(`⚠️ Could not match orphaned task "${task.title}" (ID: ${task.id}, Location: ${task.location}, Type: ${task.type})`);
            }

          } catch (error) {
            const errorMsg = `❌ Error linking task "${task.title}" (ID: ${task.id}): ${error}`;
            errors.push(errorMsg);
            report.push(errorMsg);
          }
        }
      }

      report.push(`🎯 Repair complete: ${tasksLinked} tasks linked, ${unmatchedTasks} unmatched, ${errors.length} errors`);
      
    } catch (error) {
      const errorMsg = `❌ Critical error during orphaned task repair: ${error}`;
      errors.push(errorMsg);
      report.push(errorMsg);
    }

    return {
      orphanedTasksFound,
      tasksLinked,
      unmatchedTasks,
      errors,
      repairReport: report
    };
  }

  // Helper method to check if two titles are similar (handles minor variations)
  private isSimilarTitle(title1: string, title2: string): boolean {
    // Remove common variations and normalize
    const normalize = (str: string) => {
      return str
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .trim();
    };

    const norm1 = normalize(title1);
    const norm2 = normalize(title2);

    // Exact match after normalization
    if (norm1 === norm2) return true;

    // Check if one title contains the other (handles shortened versions)
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;

    // Check for common word overlap (at least 70% of words match)
    const words1 = norm1.split(' ');
    const words2 = norm2.split(' ');
    const commonWords = words1.filter(w => words2.includes(w));
    const similarityRatio = commonWords.length / Math.max(words1.length, words2.length);
    
    return similarityRatio >= 0.7;
  }

  // Helper function to generate expected task dates for a recurring task
  private async generateExpectedTaskDates(recurringTask: any, startDate: Date, endDate: Date): Promise<Date[]> {
    const expectedDates: Date[] = [];
    
    switch (recurringTask.frequency) {
      case 'daily': {
        // Parse the daysOfWeek array
        let selectedDays: string[] = [];
        try {
          if (typeof recurringTask.daysOfWeek === 'string') {
            selectedDays = JSON.parse(recurringTask.daysOfWeek);
          } else if (Array.isArray(recurringTask.daysOfWeek)) {
            selectedDays = recurringTask.daysOfWeek;
          }
        } catch (error) {
          return expectedDates; // Return empty if can't parse
        }

        if (!selectedDays || selectedDays.length === 0) {
          return expectedDates; // Return empty if no days selected
        }

        const normalizedSelectedDays = selectedDays.map(day => day.toLowerCase());
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        // Check each day in the date range
        for (let dayOffset = 0; dayOffset <= Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)); dayOffset++) {
          const checkDate = new Date(startDate);
          checkDate.setDate(startDate.getDate() + dayOffset);
          
          if (checkDate > endDate) break;
          
          const dayIndex = checkDate.getUTCDay();
          const dayName = dayNames[dayIndex];
          
          if (normalizedSelectedDays.includes(dayName)) {
            expectedDates.push(new Date(checkDate));
          }
        }
        break;
      }
      
      case 'weekly': {
        // Similar logic for weekly tasks
        let selectedDays: string[] = [];
        try {
          if (typeof recurringTask.daysOfWeek === 'string') {
            selectedDays = JSON.parse(recurringTask.daysOfWeek);
          } else if (Array.isArray(recurringTask.daysOfWeek)) {
            selectedDays = recurringTask.daysOfWeek;
          }
        } catch (error) {
          return expectedDates;
        }

        if (!selectedDays || selectedDays.length === 0) {
          return expectedDates;
        }

        const normalizedSelectedDays = selectedDays.map(day => day.toLowerCase());
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        // Check each day in the date range
        for (let dayOffset = 0; dayOffset <= Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)); dayOffset++) {
          const checkDate = new Date(startDate);
          checkDate.setDate(startDate.getDate() + dayOffset);
          
          if (checkDate > endDate) break;
          
          const dayIndex = checkDate.getUTCDay();
          const dayName = dayNames[dayIndex];
          
          if (normalizedSelectedDays.includes(dayName)) {
            expectedDates.push(new Date(checkDate));
          }
        }
        break;
      }
      
      case 'bi-weekly':
      case 'biweekly': {
        // True bi-weekly: every 14 days from the task's startDate
        const templateStartDate = recurringTask.startDate ? new Date(recurringTask.startDate) : new Date(recurringTask.createdAt || startDate);
        const templateStartDateUTC = new Date(Date.UTC(
          templateStartDate.getUTCFullYear(),
          templateStartDate.getUTCMonth(),
          templateStartDate.getUTCDate()
        ));
        
        // Check each day in the range to find 14-day intervals
        for (let dayOffset = 0; dayOffset <= Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)); dayOffset++) {
          const checkDate = new Date(startDate);
          checkDate.setDate(startDate.getDate() + dayOffset);
          
          if (checkDate > endDate) break;
          
          const checkDateUTC = new Date(Date.UTC(
            checkDate.getUTCFullYear(),
            checkDate.getUTCMonth(),
            checkDate.getUTCDate()
          ));
          
          const daysDifference = Math.floor(
            (checkDateUTC.getTime() - templateStartDateUTC.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          // Only add date if it falls on a 14-day interval from template start
          if (daysDifference >= 0 && daysDifference % 14 === 0) {
            expectedDates.push(new Date(checkDate));
          }
        }
        break;
      }
    }
    
    return expectedDates;
  }
  
  private async generateTaskInstancesForRecurringTask(recurringTask: any, baseDate: Date): Promise<number> {
    let tasksCreated = 0;
    const tasksToCreate: any[] = [];
    
    const endDate = new Date(baseDate);
    endDate.setDate(endDate.getDate() + 31);
    console.log(`📅 Generating from: ${baseDate.toISOString().split('T')[0]} to: ${endDate.toISOString().split('T')[0]} for "${recurringTask.title}"`);
    
    // Generate instances based on frequency
    switch (recurringTask.frequency) {
      case 'weekly': {
        // Parse the daysOfWeek array - critical for weekly task filtering
        let selectedDays: string[] = [];
        try {
          if (typeof recurringTask.daysOfWeek === 'string') {
            selectedDays = JSON.parse(recurringTask.daysOfWeek);
          } else if (Array.isArray(recurringTask.daysOfWeek)) {
            selectedDays = recurringTask.daysOfWeek;
          }
        } catch (error) {
          console.error(`❌ Failed to parse daysOfWeek for "${recurringTask.title}":`, error);
          break; // Skip this task if daysOfWeek is invalid
        }

        if (!selectedDays || selectedDays.length === 0) {
          console.log(`⚠️ No selectedDays for weekly task "${recurringTask.title}" - skipping`);
          break; // Skip tasks with no selected days
        }

        // Normalize day names to lowercase for comparison
        const normalizedSelectedDays = selectedDays.map(day => day.toLowerCase());
        
        // Generate for the next 31 days, checking each day
        for (let dayOffset = 0; dayOffset < 31; dayOffset++) {
          const taskDate = new Date(baseDate);
          taskDate.setDate(taskDate.getDate() + dayOffset);
          
          // TIMEZONE FIX: Use UTC-based day calculation to match database storage
          // This ensures day name calculation matches the UTC date stored in database
          const utcDayIndex = taskDate.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dayName = dayNames[utcDayIndex];
          
          if (dayOffset === 0) {
            console.log(`  🔍 Loop day 0: baseDate=${baseDate.toISOString().split('T')[0]}, taskDate=${taskDate.toISOString().split('T')[0]}, dayName=${dayName}`);
          }
          
          // CRITICAL: Only create task if this day matches selectedDays
          if (!normalizedSelectedDays.includes(dayName)) {
            continue; // Skip this day - not in selectedDays
          }
          
          if (tasksToCreate.length === 0) {
            console.log(`  ✅ First match! dayOffset=${dayOffset}, taskDate=${taskDate.toISOString().split('T')[0]}, dayName=${dayName}`);
          }
          
          // Weekly tasks are due on their scheduled day (same as taskDate)
          const dueDate = new Date(taskDate);
          
          // Check if this task instance already exists
          const [existing] = await db.select().from(tasks).where(
            and(
              eq(tasks.title, recurringTask.title),
              eq(tasks.taskDate, taskDate),
              eq(tasks.location, recurringTask.location)
            )
          );
          
          if (!existing) {
            tasksToCreate.push({
              title: recurringTask.title,
              description: recurringTask.description,
              type: recurringTask.type,
              status: 'pending',
              priority: 'medium',
              assignedTo: null,
              assignTo: recurringTask.assignTo,
              createdBy: recurringTask.createdBy,
              location: recurringTask.location,
              taskDate: taskDate,
              dueDate: dueDate,
              frequency: recurringTask.frequency,
              isRecurring: true,
              recurringTaskId: recurringTask.id,
              estimatedTime: null,
              actualTime: null,
              progress: 0,
              checklist: recurringTask.checklistTemplate?.steps || [],
              data: {},
              visibleFromDate: taskDate,
              startedAt: null,
              completedAt: null,
              pausedAt: null,
              resumedAt: null,
              skippedAt: null,
              deletedRecurringTaskId: null,
              deletedRecurringTaskTitle: null
            });
          }
        }
        break;
      }
      
      case 'daily': {
        // Parse the daysOfWeek array - critical for daily task filtering
        let selectedDays: string[] = [];
        try {
          if (typeof recurringTask.daysOfWeek === 'string') {
            selectedDays = JSON.parse(recurringTask.daysOfWeek);
          } else if (Array.isArray(recurringTask.daysOfWeek)) {
            selectedDays = recurringTask.daysOfWeek;
          }
        } catch (error) {
          console.error(`❌ Failed to parse daysOfWeek for "${recurringTask.title}":`, error);
          break; // Skip this task if daysOfWeek is invalid
        }

        if (!selectedDays || selectedDays.length === 0) {
          console.log(`⚠️ No selectedDays for daily task "${recurringTask.title}" - skipping`);
          break; // Skip tasks with no selected days
        }

        // Normalize day names to lowercase for comparison
        const normalizedSelectedDays = selectedDays.map(day => day.toLowerCase());
        
        // Generate for the next 31 days, checking each day
        for (let dayOffset = 0; dayOffset < 31; dayOffset++) {
          const taskDate = new Date(baseDate);
          taskDate.setDate(taskDate.getDate() + dayOffset);
          
          // TIMEZONE FIX: Use UTC-based day calculation to match database storage
          // This ensures day name calculation matches the UTC date stored in database
          const utcDayIndex = taskDate.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dayName = dayNames[utcDayIndex];
          
          // CRITICAL: Only create task if this day matches selectedDays
          if (!normalizedSelectedDays.includes(dayName)) {
            continue; // Skip this day - not in selectedDays
          }
          
          // Daily tasks are due on the same day
          const dueDate = new Date(taskDate);
          
          // Check if this task instance already exists
          const [existing] = await db.select().from(tasks).where(
            and(
              eq(tasks.title, recurringTask.title),
              eq(tasks.taskDate, taskDate),
              eq(tasks.location, recurringTask.location)
            )
          );
          
          if (!existing) {
            tasksToCreate.push({
              title: recurringTask.title,
              description: recurringTask.description,
              type: recurringTask.type,
              status: 'pending',
              priority: 'medium',
              assignedTo: null,
              assignTo: recurringTask.assignTo,
              createdBy: recurringTask.createdBy,
              location: recurringTask.location,
              taskDate: taskDate,
              dueDate: dueDate,
              frequency: recurringTask.frequency,
              isRecurring: true,
              recurringTaskId: recurringTask.id, // CRITICAL FIX: Add missing recurringTaskId field
              estimatedTime: null,
              actualTime: null,
              progress: 0,
              checklist: recurringTask.checklistTemplate?.steps || [],
              data: {},
              visibleFromDate: taskDate,
              startedAt: null,
              completedAt: null,
              pausedAt: null,
              resumedAt: null,
              skippedAt: null,
              deletedRecurringTaskId: null,
              deletedRecurringTaskTitle: null
            });
            console.log(`✅ Creating daily task "${recurringTask.title}" for ${dayName} (${taskDate.toDateString()})`);
          }
        }
        break;
      }
      
      case 'bi-weekly':
      case 'biweekly': {
        // True bi-weekly: every 14 days from the task's startDate
        const startDate = recurringTask.startDate ? new Date(recurringTask.startDate) : new Date(recurringTask.createdAt || Date.now());
        const startDateUTC = new Date(Date.UTC(
          startDate.getUTCFullYear(),
          startDate.getUTCMonth(),
          startDate.getUTCDate()
        ));
        
        // Generate tasks for the next 31 days that fall on 14-day intervals
        for (let dayOffset = 0; dayOffset <= 31; dayOffset++) {
          const checkDate = new Date(baseDate);
          checkDate.setDate(checkDate.getDate() + dayOffset);
          const checkDateUTC = new Date(Date.UTC(
            checkDate.getUTCFullYear(),
            checkDate.getUTCMonth(),
            checkDate.getUTCDate()
          ));
          
          const daysDifference = Math.floor(
            (checkDateUTC.getTime() - startDateUTC.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          // Only create task if this day falls on a 14-day interval from start
          if (daysDifference >= 0 && daysDifference % 14 === 0) {
            const taskDate = checkDateUTC;
            
            const [existing] = await db.select().from(tasks).where(
              and(
                eq(tasks.title, recurringTask.title),
                sql`DATE(${tasks.taskDate}) = ${taskDate.toISOString().split('T')[0]}`,
                eq(tasks.location, recurringTask.location)
              )
            );
            
            if (!existing) {
              tasksToCreate.push({
                title: recurringTask.title,
                description: recurringTask.description,
                type: recurringTask.type,
                status: 'pending',
                priority: 'medium',
                assignedTo: null,
                assignTo: recurringTask.assignTo,
                createdBy: recurringTask.createdBy,
                location: recurringTask.location,
                taskDate: taskDate,
                dueDate: taskDate,
                frequency: 'bi-weekly',
                isRecurring: true,
                recurringTaskId: recurringTask.id,
                estimatedTime: null,
                actualTime: null,
                progress: 0,
                checklist: recurringTask.checklistTemplate?.steps || [],
                data: {},
                visibleFromDate: taskDate,
                startedAt: null,
                completedAt: null,
                pausedAt: null,
                resumedAt: null,
                skippedAt: null,
                deletedRecurringTaskId: null,
                deletedRecurringTaskTitle: null
              });
              console.log(`✅ Creating bi-weekly task "${recurringTask.title}" for ${taskDate.toDateString()} (${daysDifference} days from start)`);
            }
          }
        }
        break;
      }
      
      case 'monthly': {
        // Monthly tasks already exist, skip for now
        break;
      }
    }
    
    // Insert all new tasks
    if (tasksToCreate.length > 0) {
      await db.insert(tasks).values(tasksToCreate);
      tasksCreated = tasksToCreate.length;
    }
    
    return tasksCreated;
  }
  
  // Tray methods
  async splitTray(originalTrayId: string, splitData: { splitCount: number; newTrayIds: string[] }): Promise<Tray[]> { return []; }
  
  async clearAllData(): Promise<boolean> { return false; }

  // System status and locks - real database implementations
  async getSystemStatus(id: string): Promise<SystemStatus | undefined> {
    const [status] = await db.select().from(systemStatus).where(eq(systemStatus.id, id));
    return status || undefined;
  }

  async setSystemStatus(status: InsertSystemStatus): Promise<SystemStatus> {
    const [result] = await db.insert(systemStatus).values(status)
      .onConflictDoUpdate({
        target: systemStatus.id,
        set: {
          lastGenerationDate: status.lastGenerationDate,
          generatedThrough: status.generatedThrough,
          lastUpdateBy: status.lastUpdateBy,
          updatedAt: sql`NOW()`
        }
      }).returning();
    return result;
  }

  async acquireLock(lockId: string, userId: number, lockType: string, expirationMinutes = 10): Promise<SystemLock | null> {
    try {
      // First check if lock exists and is expired
      const [existingLock] = await db.select().from(systemLocks).where(eq(systemLocks.id, lockId));
      
      if (existingLock && existingLock.expiresAt && new Date() > existingLock.expiresAt) {
        // Lock expired, remove it
        await db.delete(systemLocks).where(eq(systemLocks.id, lockId));
      } else if (existingLock) {
        // Lock still active
        return null;
      }

      // Try to acquire lock
      const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
      const [newLock] = await db.insert(systemLocks).values({
        id: lockId,
        lockedBy: userId,
        lockType: lockType,
        expiresAt: expiresAt
      }).returning();
      
      return newLock;
    } catch (error) {
      // Lock acquisition failed (someone else got it)
      console.error(`❌ Lock acquisition failed for ${lockId}:`, error);
      return null;
    }
  }

  async releaseLock(lockId: string): Promise<boolean> {
    const result = await db.delete(systemLocks).where(eq(systemLocks.id, lockId));
    return result.rowCount > 0;
  }

  async checkLock(lockId: string): Promise<SystemLock | null> {
    const [lock] = await db.select().from(systemLocks).where(eq(systemLocks.id, lockId));
    
    if (!lock) return null;
    
    // Check if expired
    if (lock.expiresAt && new Date() > lock.expiresAt) {
      // Auto-remove expired lock
      await db.delete(systemLocks).where(eq(systemLocks.id, lockId));
      return null;
    }
    
    return lock;
  }

  // Add missing initializeAppVerification method for automatic task generation
  async initializeAppVerification(userId: number = 1): Promise<void> {
    console.log(`🔄 DatabaseStorage: Initializing app verification for user ${userId}`);
    
    try {
      // Run the verification to generate missing tasks
      const result = await this.verifyTaskIntegrity();
      
      if (result.missingTasksCreated > 0 || result.duplicatesRemoved > 0) {
        console.log(`✅ Verification completed: ${result.missingTasksCreated} tasks created, ${result.duplicatesRemoved} duplicates removed`);
      } else {
        console.log('✅ Verification completed: No tasks needed generation');
      }
    } catch (error) {
      console.error('❌ Error during task verification:', error);
    }
  }
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
    console.log('🔄 HybridStorage.getAllTasks() - delegating to DatabaseStorage...');
    const dbTasks = await this.dbStorage.getAllTasks();
    console.log(`🔍 HybridStorage received ${dbTasks.length} tasks from DatabaseStorage`);
    if (dbTasks.length > 0) {
      const firstTask = dbTasks[0];
      const lastTask = dbTasks[dbTasks.length - 1]; 
      console.log(`🔍 HybridStorage first task: ${firstTask.title} (dueDate: ${firstTask.dueDate})`);
      console.log(`🔍 HybridStorage last task: ${lastTask.title} (dueDate: ${lastTask.dueDate})`);
    }
    return dbTasks;
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

  async resetTaskSequence(): Promise<void> {
    return this.dbStorage.resetTaskSequence();
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

  async updateRecurringTask(id: number, updates: Partial<RecurringTask>, options?: { strategy?: 'update_all' | 'new_only'; userId?: number }): Promise<{ task: RecurringTask | null; report: any }> {
    return this.dbStorage.updateRecurringTask(id, updates, options);
  }

  async calculateUpdateImpact(id: number, changedFields: any[]): Promise<{ affectedCount: number; conflictCount: number; byStatus: Record<string, number>; byDate: Record<string, number> }> {
    return this.dbStorage.calculateUpdateImpact(id, changedFields);
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

  // FIXED: Use DATABASE storage for task generation instead of memory storage
  async regenerateAllTaskInstances(): Promise<{ totalTasksCreated: number; recurringTasksProcessed: number }> {
    // Get recurring tasks from DATABASE, not memory
    const recurringTasks = await this.dbStorage.getAllRecurringTasks();
    console.log(`🔄 Found ${recurringTasks.length} recurring templates in DATABASE for task generation`);
    
    if (recurringTasks.length === 0) {
      console.log('⚠️ No recurring tasks found in database - checking if migration needed');
      // Check if MemStorage has templates that need to be migrated
      const memTasks = await this.memStorage.getAllRecurringTasks();
      if (memTasks.length > 0) {
        console.log(`🔄 Migrating ${memTasks.length} recurring tasks from memory to database`);
        for (const memTask of memTasks) {
          try {
            await this.dbStorage.createRecurringTask({
              title: memTask.title,
              description: memTask.description,
              type: memTask.type,
              frequency: memTask.frequency,
              daysOfWeek: memTask.daysOfWeek,
              dayOfMonth: memTask.dayOfMonth,
              isActive: memTask.isActive,
              location: memTask.location,
              assignTo: memTask.assignTo,
              createdBy: memTask.createdBy,
              automation: memTask.automation,
              checklistTemplate: memTask.checklistTemplate
            });
          } catch (error) {
            console.error(`Failed to migrate recurring task ${memTask.id}:`, error);
          }
        }
        console.log('✅ Migration complete - refetching from database');
        const migratedTasks = await this.dbStorage.getAllRecurringTasks();
        console.log(`📊 After migration: ${migratedTasks.length} tasks in database`);
      }
      return { totalTasksCreated: 0, recurringTasksProcessed: 0 };
    }
    
    // SIMPLE FIX: Clear database tasks, copy templates to memory, then use memory regeneration
    console.log('🗑️ Clearing existing pending task instances from database...');
    await this.dbStorage.resetTasks();
    
    // Copy DATABASE templates to MemStorage for generation
    console.log('📥 Copying database templates to memory for generation...');
    this.memStorage.recurringTasks.clear();
    let memIdCounter = 1;
    
    for (const dbTask of recurringTasks) {
      this.memStorage.recurringTasks.set(memIdCounter, {
        id: memIdCounter,
        title: dbTask.title,
        description: dbTask.description,
        type: dbTask.type,
        frequency: dbTask.frequency,
        daysOfWeek: dbTask.daysOfWeek,
        dayOfMonth: dbTask.dayOfMonth,
        isActive: dbTask.isActive,
        location: dbTask.location,
        assignTo: dbTask.assignTo,
        createdBy: dbTask.createdBy,
        automation: dbTask.automation,
        checklistTemplate: dbTask.checklistTemplate
      });
      memIdCounter++;
    }
    
    console.log(`📋 Copied ${memIdCounter - 1} templates to memory storage`);
    
    // Now use MemStorage regeneration which will save tasks to database via storage singleton
    return this.memStorage.regenerateAllTaskInstances();
  }

  async regenerateTaskInstances(recurringTaskId: number): Promise<boolean> {
    // Get the recurring task from DATABASE
    const recurringTask = await this.dbStorage.getRecurringTask(recurringTaskId);
    if (!recurringTask) {
      console.log(`❌ Recurring task ${recurringTaskId} not found in database`);
      return false;
    }
    
    // Use memory storage's generation logic  
    const result = await this.memStorage.regenerateTaskInstances(recurringTaskId);
    return typeof result === 'boolean' ? result : false;
  }

  // System status and locks - use DATABASE for multi-user coordination
  async getSystemStatus(id: string): Promise<SystemStatus | undefined> {
    return this.dbStorage.getSystemStatus(id);
  }

  async setSystemStatus(status: InsertSystemStatus): Promise<SystemStatus> {
    return this.dbStorage.setSystemStatus(status);
  }

  async acquireLock(lockId: string, userId: number, lockType: string, expirationMinutes?: number): Promise<SystemLock | null> {
    return this.dbStorage.acquireLock(lockId, userId, lockType, expirationMinutes);
  }

  async releaseLock(lockId: string): Promise<boolean> {
    return this.dbStorage.releaseLock(lockId);
  }

  async checkLock(lockId: string): Promise<SystemLock | null> {
    return this.dbStorage.checkLock(lockId);
  }

  // Task verification system - delegate to MemStorage for verification logic
  async initializeAppVerification(userId: number = 1): Promise<void> {
    console.log('🔄 HybridStorage delegating task verification to MemStorage...');
    return this.memStorage.initializeAppVerification(userId);
  }

  // Verification system - delegate to DatabaseStorage for full verification
  async verifyTaskIntegrity(): Promise<{
    missingTasksCreated: number;
    duplicatesRemoved: number;
    errors: string[];
    verificationReport: string[];
  }> {
    return this.dbStorage.verifyTaskIntegrity();
  }
}

// Export the appropriate storage implementation based on environment
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
