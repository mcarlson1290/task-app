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
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'seeding-microgreens', 'seeding-leafy-greens', 'harvest-microgreens', 'harvest-leafy-greens', 'blackout-tasks', 'moving', 'packing', 'cleaning', 'inventory', 'equipment-maintenance', 'other'
  status: text("status").notNull().default('pending'), // 'pending', 'in_progress', 'completed', 'approved'
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'seeds', 'nutrients', 'supplies', 'equipment'
  currentStock: integer("current_stock").default(0),
  minimumStock: integer("minimum_stock").default(0),
  unit: text("unit").notNull(), // 'kg', 'lbs', 'pieces', 'liters'
  supplier: text("supplier"),
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
