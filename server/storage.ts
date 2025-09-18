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
    for (const [id, recurringTask] of this.recurringTasks) {
      if (recurringTask.frequency === 'daily' && recurringTask.daysOfWeek && recurringTask.daysOfWeek.length > 0) {
        recurringTask.frequency = 'weekly';
        migratedCount++;
        console.log(`Restored recurring task ${id} (${recurringTask.title}) from daily to weekly with days: ${recurringTask.daysOfWeek.join(', ')}`);
      }
    }
    
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
        // Create first half task on day 1 (due on 14th)
        if (dayOfMonth === 1) {
          const visibleDate = new Date(Date.UTC(year, month, 1));
          const dueDate = new Date(Date.UTC(year, month, 14));
          return this.buildTaskFromTemplate(template, {
            id: `${template.id}-${year}-${String(month + 1).padStart(2, '0')}-first`,
            visibleFromDate: visibleDate,
            dueDate: dueDate
          });
        }
        // Create second half task on day 15 (due on last day of month)
        if (dayOfMonth === 15) {
          const visibleDate = new Date(Date.UTC(year, month, 15));
          const dueDate = new Date(Date.UTC(year, month + 1, 0));
          return this.buildTaskFromTemplate(template, {
            id: `${template.id}-${year}-${String(month + 1).padStart(2, '0')}-second`,
            visibleFromDate: visibleDate,
            dueDate: dueDate
          });
        }
        break;
        
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
        text: step.label || step.text || '',
        completed: false,
        required: step.required || false,
        type: step.type,
        config: {
          inventoryCategory: step.inventoryCategory,
          min: step.min,
          max: step.max,
          default: step.default,
          systemType: step.systemType,
          autoSuggest: step.autoSuggest,
          dataType: step.dataType,
          calculation: step.calculation
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
              this.isSameDate(new Date(t.dueDate), new Date(expected.dueDate))
            );
            
            // Check LIVE task state, not snapshot, to avoid repeated creations
            const existingTaskLive = Array.from(this.tasks.values()).find(t => 
              t.recurringTaskId === expected.recurringTaskId && 
              t.dueDate && 
              this.isSameDate(new Date(t.dueDate), new Date(expected.dueDate))
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
        text: step.label || step.text || '',
        completed: false,
        required: step.required || false,
        type: step.type
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
        return this.buildTaskFromTemplate(template, {
          id: `${template.id}-${year}-${String(month + 1).padStart(2, '0')}`,
          visibleFromDate: new Date(Date.UTC(year, month, 1)),
          dueDate: lastDay
        });
        
      case 'biweekly':
        if (dayOfMonth <= 14) {
          // First period
          return this.buildTaskFromTemplate(template, {
            id: `${template.id}-${year}-${String(month + 1).padStart(2, '0')}-01`,
            visibleFromDate: new Date(Date.UTC(year, month, 1)),
            dueDate: new Date(Date.UTC(year, month, 14))
          });
        } else {
          // Second period
          const lastDay = new Date(Date.UTC(year, month + 1, 0));
          return this.buildTaskFromTemplate(template, {
            id: `${template.id}-${year}-${String(month + 1).padStart(2, '0')}-15`,
            visibleFromDate: new Date(Date.UTC(year, month, 15)),
            dueDate: lastDay
          });
        }
        
      case 'daily':
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (template.daysOfWeek?.includes(dayName)) {
          return this.buildTaskFromTemplate(template, {
            id: `${template.id}-${this.formatDate(today)}`,
            visibleFromDate: today,
            dueDate: today
          });
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
    const systemLock: SystemLock = {
      id: lockId,
      lockedBy: userId,
      lockType: lockType,
      acquiredAt: new Date(),
      expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000),
    };
    return systemLock;
  }

  async releaseLock(lockId: string): Promise<boolean> {
    return true;
  }

  async checkLock(lockId: string): Promise<SystemLock | null> {
    return null;
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

  async createTask(taskData: InsertTask): Promise<Task> {
    // Ensure taskDate is set if missing - use visibleFromDate as fallback
    const safeTaskData = {
      ...taskData,
      taskDate: taskData.taskDate || taskData.visibleFromDate || null
    };
    
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
  
  private async generateTaskInstancesForRecurringTask(recurringTask: any, baseDate: Date): Promise<number> {
    let tasksCreated = 0;
    const tasksToCreate: any[] = [];
    
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
          
          // CRITICAL: Only create task if this day matches selectedDays
          if (!normalizedSelectedDays.includes(dayName)) {
            continue; // Skip this day - not in selectedDays
          }
          
          const dueDate = new Date(taskDate);
          dueDate.setDate(dueDate.getDate() + 6); // Due at end of week
          
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
            console.log(`✅ Creating weekly task "${recurringTask.title}" for ${dayName} (${taskDate.toDateString()})`);
          }
        }
        break;
      }
      
      case 'bi-weekly': {
        // Generate for the next 8 weeks (4 bi-weekly instances)
        for (let period = 0; period < 4; period++) {
          const taskDate = new Date(baseDate);
          taskDate.setDate(taskDate.getDate() + (period * 14));
          
          const dueDate = new Date(taskDate);
          dueDate.setDate(dueDate.getDate() + 13); // Due at end of 2-week period
          
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
    } catch {
      // Lock acquisition failed (someone else got it)
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
}

// Export the appropriate storage implementation based on environment
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
