import { pgTable, text, serial, integer, boolean, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // 'technician', 'manager', 'corporate'
  approved: boolean("approved").default(false),
  location: text("location").default('Kenosha'), // User's assigned location
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'seeding-microgreens', 'seeding-leafy-greens', 'harvest-microgreens', 'harvest-leafy-greens', 'blackout-tasks', 'moving', 'packing', 'cleaning', 'inventory', 'equipment-maintenance', 'other'
  status: text("status").notNull().default('pending'), // 'pending', 'in_progress', 'completed', 'approved', 'paused', 'skipped'
  priority: text("priority").default('medium'), // 'low', 'medium', 'high'
  assignedTo: integer("assigned_to").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
  location: text("location"), // e.g., "Section A - Towers 1-5"
  estimatedTime: integer("estimated_time"), // in minutes
  actualTime: integer("actual_time"), // in minutes
  progress: integer("progress").default(0), // 0-100
  checklist: json("checklist").$type<ChecklistItem[]>(),
  data: json("data").$type<Record<string, any>>(), // for collected data
  dueDate: timestamp("due_date"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  pausedAt: timestamp("paused_at"),
  resumedAt: timestamp("resumed_at"),
  skippedAt: timestamp("skipped_at"),
  skipReason: text("skip_reason"),
  isRecurring: boolean("is_recurring").default(false),
  recurringTaskId: integer("recurring_task_id").references(() => recurringTasks.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recurringTasks = pgTable("recurring_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  frequency: text("frequency").notNull(), // 'daily', 'weekly', 'monthly'
  daysOfWeek: json("days_of_week").$type<string[]>(), // ['monday', 'tuesday', etc.]
  dayOfMonth: integer("day_of_month"), // For monthly tasks
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  
  // Automation settings
  automation: json("automation").$type<{
    enabled: boolean;
    generateTrays: boolean;
    trayCount: number;
    cropType: string;
    seedInventoryId?: number;
    flow: {
      type: 'microgreen' | 'leafy-green';
      stages: {
        name: string;
        system: string;
        duration: number;
        autoMove: boolean;
        splitRatio?: Record<string, number>;
      }[];
    };
  }>(),
  
  // Dynamic checklist template
  checklistTemplate: json("checklist_template").$type<{
    steps: {
      type: 'instruction' | 'inventory-select' | 'number-input' | 'system-assignment' | 'data-capture' | 'photo';
      text?: string;
      label?: string;
      inventoryCategory?: string;
      min?: number;
      max?: number;
      default?: number;
      systemType?: string;
      autoSuggest?: boolean;
      dataType?: string;
      calculation?: string;
      required?: boolean;
    }[];
  }>(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const growingSystems = pgTable("growing_systems", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'microgreen', 'leafy-green'
  category: text("category").notNull(), // 'nursery', 'staging', 'final'
  capacity: integer("capacity"), // null for unlimited
  currentOccupancy: integer("current_occupancy").default(0),
  systemData: json("system_data").$type<{
    sections?: Record<string, { capacity: number; occupied: string[] }>;
    units?: {
      id: string;
      type: string;
      totalPorts: number;
      occupiedPorts: string[];
    }[];
    channels?: {
      id: number;
      capacity: number;
      crop: string | null;
      occupied: string[];
    }[];
  }>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trayMovements = pgTable("tray_movements", {
  id: serial("id").primaryKey(),
  trayId: text("tray_id").notNull(),
  fromSystem: text("from_system"),
  toSystem: text("to_system").notNull(),
  fromLocation: text("from_location"),
  toLocation: text("to_location").notNull(),
  taskId: integer("task_id").references(() => tasks.id),
  movedBy: integer("moved_by").references(() => users.id),
  movedAt: timestamp("moved_at").defaultNow(),
  notes: text("notes"),
});

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'seeds', 'nutrients', 'supplies', 'equipment'
  currentStock: integer("current_stock").default(0),
  minimumStock: integer("minimum_stock").default(0),
  unit: text("unit").notNull(), // 'kg', 'lbs', 'pieces', 'liters', 'grams'
  supplier: text("supplier"),
  productCode: text("product_code"), // Used for tray ID generation
  ozPerTray: real("oz_per_tray"), // Amount needed per tray for seeds
  cropId: integer("crop_id"), // Links to crop configuration
  lastRestocked: timestamp("last_restocked"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trainingModules = pgTable("training_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  content: text("content").notNull(),
  duration: integer("duration"), // in minutes
  requiredForRole: text("required_for_role"), // role this unlocks
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  moduleId: integer("module_id").references(() => trainingModules.id),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  score: integer("score"), // 0-100
});

// Type exports
export type Task = typeof tasks.$inferSelect;
export type RecurringTask = typeof recurringTasks.$inferSelect;
export type GrowingSystem = typeof growingSystems.$inferSelect;
export type TrayMovement = typeof trayMovements.$inferSelect;

// Legacy exports for backwards compatibility
export type { Task };

// ChecklistItem type for task checklists
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  data?: Record<string, any>;
}

export const insertRecurringTaskSchema = createInsertSchema(recurringTasks);
export const insertGrowingSystemSchema = createInsertSchema(growingSystems);
export const insertTrayMovementSchema = createInsertSchema(trayMovements);

export type InsertRecurringTask = z.infer<typeof insertRecurringTaskSchema>;
export type InsertGrowingSystem = z.infer<typeof insertGrowingSystemSchema>;
export type InsertTrayMovement = z.infer<typeof insertTrayMovementSchema>;

export const taskLogs = pgTable("task_logs", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // 'started', 'paused', 'resumed', 'completed', 'data_collected'
  timestamp: timestamp("timestamp").defaultNow(),
  data: json("data").$type<Record<string, any>>(),
});

// Types for checklist items
export type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
  dataCollection?: {
    type: 'number' | 'text' | 'select';
    label: string;
    options?: string[];
    value?: any;
  };
};

// Task status type
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'approved' | 'paused' | 'skipped';

// Task type
export type TaskType = 'seeding-microgreens' | 'seeding-leafy-greens' | 'harvest-microgreens' | 'harvest-leafy-greens' | 'blackout-tasks' | 'moving' | 'packing' | 'cleaning' | 'inventory' | 'equipment-maintenance' | 'other';

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
});

export const insertTrainingModuleSchema = createInsertSchema(trainingModules).omit({
  id: true,
  createdAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
});

export const insertTaskLogSchema = createInsertSchema(taskLogs).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type TrainingModule = typeof trainingModules.$inferSelect;
export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type TaskLog = typeof taskLogs.$inferSelect;
export type InsertTaskLog = z.infer<typeof insertTaskLogSchema>;
