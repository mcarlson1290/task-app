import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTaskSchema, insertInventoryItemSchema, insertTrainingModuleSchema, insertUserProgressSchema, insertTaskLogSchema, insertCourseAssignmentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.approved) {
        return res.status(403).json({ message: "Account pending approval" });
      }

      // In a real app, you'd set up proper session management
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ message: "Registration failed" });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Task routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const { userId, location } = req.query;
      let tasks;
      
      if (location) {
        tasks = await storage.getTasksByLocation(location as string);
      } else if (userId) {
        tasks = await storage.getTasksByUser(parseInt(userId as string));
      } else {
        tasks = await storage.getAllTasks();
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      console.log("Creating task with data:", req.body);
      
      // Convert date string to Date object before validation
      const processedBody = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        startedAt: req.body.startedAt ? new Date(req.body.startedAt) : undefined,
        completedAt: req.body.completedAt ? new Date(req.body.completedAt) : undefined,
        pausedAt: req.body.pausedAt ? new Date(req.body.pausedAt) : undefined,
        resumedAt: req.body.resumedAt ? new Date(req.body.resumedAt) : undefined,
        skippedAt: req.body.skippedAt ? new Date(req.body.skippedAt) : undefined,
      };
      
      const taskData = insertTaskSchema.parse(processedBody);
      console.log("Parsed task data:", taskData);
      const task = await storage.createTask(taskData);
      console.log("Created task:", task);
      res.json(task);
    } catch (error) {
      console.error("Create task error:", error);
      console.error("Request body:", req.body);
      res.status(400).json({ message: "Failed to create task", error: error.message });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      console.log("Updating task:", id, "with updates:", updates);
      const task = await storage.updateTask(id, updates);
      
      if (!task) {
        console.log("Task not found:", id);
        return res.status(404).json({ message: "Task not found" });
      }

      console.log("Task updated successfully:", task);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task", error: error.message });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTask(id);
      
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  app.post("/api/tasks/reset", async (req, res) => {
    try {
      const success = await storage.resetTasks();
      
      if (!success) {
        return res.status(500).json({ message: "Failed to reset tasks" });
      }

      res.json({ message: "Tasks reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset tasks" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", async (req, res) => {
    try {
      const { location } = req.query;
      let items;
      
      if (location) {
        items = await storage.getInventoryItemsByLocation(location as string);
      } else {
        items = await storage.getAllInventoryItems();
      }
      
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/low-stock", async (req, res) => {
    try {
      const { location } = req.query;
      let items;
      
      if (location) {
        items = await storage.getLowStockItemsByLocation(location as string);
      } else {
        items = await storage.getLowStockItems();
      }
      
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const itemData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(itemData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Failed to create inventory item" });
    }
  });

  app.patch("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const item = await storage.updateInventoryItem(id, updates);
      
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }

      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInventoryItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Inventory item not found" });
      }

      res.json({ message: "Inventory item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  app.post("/api/inventory/add-stock", async (req, res) => {
    try {
      console.log("Add inventory request:", req.body);
      const { itemId, quantity, unitCost, costPerUnit, supplier, notes } = req.body;
      const finalUnitCost = unitCost || costPerUnit;
      
      if (!itemId || !quantity || !finalUnitCost) {
        return res.status(400).json({ message: "Missing required fields: itemId, quantity, unitCost" });
      }

      const result = await storage.addInventoryStock({
        itemId: parseInt(itemId),
        quantity: parseFloat(quantity),
        unitCost: parseFloat(finalUnitCost),
        supplier,
        notes
      });

      res.json(result);
    } catch (error) {
      console.error("Add inventory error:", error);
      res.status(500).json({ message: "Failed to add inventory", error: error.message });
    }
  });

  // Training routes
  app.get("/api/training/modules", async (req, res) => {
    try {
      const modules = await storage.getAllTrainingModules();
      res.json(modules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch training modules" });
    }
  });

  app.get("/api/training/modules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const module = await storage.getTrainingModule(id);
      
      if (!module) {
        return res.status(404).json({ message: "Training module not found" });
      }
      
      res.json(module);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch training module" });
    }
  });

  app.post("/api/training/modules", async (req, res) => {
    try {
      const moduleData = insertTrainingModuleSchema.parse(req.body);
      const module = await storage.createTrainingModule(moduleData);
      res.json(module);
    } catch (error) {
      res.status(400).json({ message: "Failed to create training module" });
    }
  });

  app.get("/api/training/progress/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  app.post("/api/training/progress", async (req, res) => {
    try {
      const progressData = insertUserProgressSchema.parse(req.body);
      const progress = await storage.updateUserProgress(progressData);
      res.json(progress);
    } catch (error) {
      res.status(400).json({ message: "Failed to update progress" });
    }
  });

  // Task logs
  app.post("/api/tasks/:id/logs", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const logData = insertTaskLogSchema.parse({ ...req.body, taskId });
      const log = await storage.createTaskLog(logData);
      res.json(log);
    } catch (error) {
      res.status(400).json({ message: "Failed to create task log" });
    }
  });

  app.get("/api/tasks/:id/logs", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const logs = await storage.getTaskLogs(taskId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task logs" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      const users = await storage.getAllUsers();
      const inventory = await storage.getAllInventoryItems();
      const lowStockItems = await storage.getLowStockItems();

      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
      const pendingTasks = tasks.filter(t => t.status === 'pending').length;

      const totalTime = tasks
        .filter(t => t.actualTime)
        .reduce((sum, t) => sum + (t.actualTime || 0), 0);

      const analytics = {
        totalTasks: tasks.length,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        totalUsers: users.length,
        totalInventoryItems: inventory.length,
        lowStockAlerts: lowStockItems.length,
        totalTimeLogged: totalTime,
        tasksByType: tasks.reduce((acc, task) => {
          acc[task.type] = (acc[task.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        tasksByStatus: {
          completed: completedTasks,
          in_progress: inProgressTasks,
          pending: pendingTasks
        }
      };

      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Recurring tasks routes
  app.get("/api/recurring-tasks", async (req, res) => {
    try {
      const { location } = req.query;
      let tasks;
      
      if (location) {
        tasks = await storage.getRecurringTasksByLocation(location as string);
      } else {
        tasks = await storage.getAllRecurringTasks();
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recurring tasks" });
    }
  });

  app.post("/api/recurring-tasks", async (req, res) => {
    try {
      const task = await storage.createRecurringTask(req.body);
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to create recurring task" });
    }
  });

  app.patch("/api/recurring-tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.updateRecurringTask(id, req.body);
      
      if (!task) {
        return res.status(404).json({ message: "Recurring task not found" });
      }

      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to update recurring task" });
    }
  });

  app.delete("/api/recurring-tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRecurringTask(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Recurring task not found" });
      }

      res.json({ message: "Recurring task deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete recurring task" });
    }
  });

  // Course assignment routes
  app.get("/api/course-assignments", async (req, res) => {
    try {
      const { userId } = req.query;
      let assignments;
      
      if (userId) {
        assignments = await storage.getCourseAssignmentsByUser(parseInt(userId as string));
      } else {
        assignments = await storage.getAllCourseAssignments();
      }
      
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course assignments" });
    }
  });

  app.post("/api/course-assignments", async (req, res) => {
    try {
      console.log("Received assignment data:", req.body);
      
      // Convert date string to Date object if provided
      const processedData = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null
      };
      
      const assignmentData = insertCourseAssignmentSchema.parse(processedData);
      console.log("Parsed assignment data:", assignmentData);
      const assignment = await storage.createCourseAssignment(assignmentData);
      res.json(assignment);
    } catch (error) {
      console.error("Course assignment error:", error);
      res.status(400).json({ message: "Failed to create course assignment", error: error.message });
    }
  });

  app.patch("/api/course-assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assignment = await storage.updateCourseAssignment(id, req.body);
      
      if (!assignment) {
        return res.status(404).json({ message: "Course assignment not found" });
      }

      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update course assignment" });
    }
  });

  // Growing systems routes
  app.get("/api/growing-systems", async (req, res) => {
    try {
      const { location } = req.query;
      let systems;
      
      if (location) {
        systems = await storage.getGrowingSystemsByLocation(location as string);
      } else {
        systems = await storage.getAllGrowingSystems();
      }
      
      res.json(systems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch growing systems" });
    }
  });

  app.post("/api/growing-systems", async (req, res) => {
    try {
      const system = await storage.createGrowingSystem(req.body);
      res.json(system);
    } catch (error) {
      res.status(500).json({ message: "Failed to create growing system" });
    }
  });

  app.patch("/api/growing-systems/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const system = await storage.updateGrowingSystem(id, req.body);
      
      if (!system) {
        return res.status(404).json({ message: "Growing system not found" });
      }

      res.json(system);
    } catch (error) {
      res.status(500).json({ message: "Failed to update growing system" });
    }
  });

  app.delete("/api/growing-systems/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGrowingSystem(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Growing system not found" });
      }

      res.json({ message: "Growing system deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete growing system" });
    }
  });

  // Clear all data endpoint
  app.post("/api/clear-data", async (req, res) => {
    try {
      const success = await storage.clearAllData();
      
      if (!success) {
        return res.status(500).json({ message: "Failed to clear data" });
      }

      res.json({ message: "All data cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
