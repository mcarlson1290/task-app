import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTaskSchema, insertInventoryItemSchema, insertTrainingModuleSchema, insertUserProgressSchema, insertTaskLogSchema, insertCourseAssignmentSchema, insertNotificationSchema } from "@shared/schema";

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

  // Staff routes (dedicated endpoints for staff management)
  app.get("/api/staff", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Transform users to staff format for frontend compatibility
      const staff = users.map(user => ({
        id: user.id.toString(),
        fullName: user.name,
        email: user.username,
        phone: '',
        location: 'Kenosha', // Default location
        rolesAssigned: user.role ? user.role.split(',').map(r => r.trim()) : ['General Staff'],
        dateHired: new Date().toISOString().split('T')[0],
        payRate: 0,
        trainingCompleted: [],
        trainingInProgress: [],
        preferredHours: '',
        activeStatus: user.approved ? 'Active' : 'Pending',
        lastTaskCompleted: '',
        managerNotes: '',
        tasksCompleted: 0,
        avgTaskDuration: '0m',
        onTimeRate: 100,
        microsoftId: user.id.toString(),
        lastActive: new Date().toISOString(),
        password: undefined
      }));
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post("/api/staff", async (req, res) => {
    try {
      const staffData = req.body;
      // Convert staff format to user format
      const userData = {
        username: staffData.email,
        password: 'temp-password', // Will be set via Microsoft auth
        name: staffData.fullName,
        role: Array.isArray(staffData.rolesAssigned) ? staffData.rolesAssigned.join(', ') : 'technician',
        approved: staffData.activeStatus === 'Active'
      };
      const user = await storage.createUser(userData);
      res.json({ ...staffData, id: user.id.toString() });
    } catch (error) {
      res.status(500).json({ message: "Failed to create staff member" });
    }
  });

  app.put("/api/staff/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const staffData = req.body;
      // Convert staff format to user format for updates
      const updates = {
        name: staffData.fullName,
        role: Array.isArray(staffData.rolesAssigned) ? staffData.rolesAssigned.join(', ') : staffData.rolesAssigned,
        approved: staffData.activeStatus === 'Active'
      };
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.json(staffData);
    } catch (error) {
      res.status(500).json({ message: "Failed to update staff member" });
    }
  });

  app.delete("/api/staff/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // In a real system, you might want to soft delete instead
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      // For now, just mark as inactive
      await storage.updateUser(id, { approved: false });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete staff member" });
    }
  });

  // User routes (keeping existing functionality)
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

  // Course completion and role assignment
  app.post("/api/courses/:courseId/complete", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const { userId, roleAwarded } = req.body;
      
      if (!userId || !roleAwarded) {
        return res.status(400).json({ message: "Missing userId or roleAwarded" });
      }

      // Get the user first
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Parse existing roles (assuming it's stored as a comma-separated string)
      const currentRoles = user.role ? user.role.split(',').map(r => r.trim()) : ['technician'];
      
      // Add the new role if not already present
      if (!currentRoles.includes(roleAwarded)) {
        currentRoles.push(roleAwarded);
        
        // Update user with new role
        const updatedUser = await storage.updateUser(userId, {
          role: currentRoles.join(', ')
        });
        
        console.log(`Role "${roleAwarded}" assigned to user ${user.name} upon course completion`);
        
        res.json({
          message: `Course completed! Role "${roleAwarded}" assigned to ${user.name}`,
          user: updatedUser,
          newRole: roleAwarded
        });
      } else {
        res.json({
          message: `Course completed! User already has the "${roleAwarded}" role`,
          user: user,
          newRole: roleAwarded
        });
      }
    } catch (error) {
      console.error("Course completion error:", error);
      res.status(500).json({ message: "Failed to complete course and assign role" });
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

  app.post("/api/recurring-tasks/:id/regenerate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.regenerateTaskInstances(id);
      
      if (!success) {
        return res.status(404).json({ message: "Recurring task not found" });
      }

      res.json({ message: "Task instances regenerated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to regenerate task instances" });
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
      
      // Create notification for course assignment
      const assignedByUser = await storage.getUser(assignmentData.assignedByUserId!);
      const assignedToUser = await storage.getUser(assignmentData.assignedToUserId!);
      
      if (assignedByUser && assignedToUser) {
        await storage.createNotification({
          userId: assignmentData.assignedToUserId!,
          type: 'course_assigned',
          title: 'New Course Assigned',
          message: `${assignedByUser.name} assigned you training course #${assignmentData.courseId}`,
          relatedId: assignmentData.courseId,
          relatedType: 'course',
          isRead: false
        });
      }
      
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

  // Notification routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      res.status(400).json({ message: "Failed to create notification", error: error.message });
    }
  });

  app.patch("/api/notifications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isRead } = req.body;
      
      if (isRead) {
        const notification = await storage.markNotificationAsRead(id);
        if (!notification) {
          return res.status(404).json({ message: "Notification not found" });
        }
        res.json(notification);
      } else {
        const notification = await storage.updateNotification(id, req.body);
        if (!notification) {
          return res.status(404).json({ message: "Notification not found" });
        }
        res.json(notification);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  app.patch("/api/notifications/mark-all-read", async (req, res) => {
    try {
      const { userId } = req.body;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteNotification(id);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
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

  // Regenerate tasks with fixed dates endpoint
  app.post("/api/regenerate-tasks", async (req, res) => {
    try {
      // Delete all recurring task instances (not the recurring tasks themselves)
      const recurringTasks = await storage.getRecurringTasks();
      const tasks = await storage.getTasks();
      
      // Remove all task instances that were generated from recurring tasks
      const recurringTaskIds = new Set(recurringTasks.map(rt => rt.id));
      const tasksToDelete = tasks.filter(task => task.isRecurring && task.recurringTaskId && recurringTaskIds.has(task.recurringTaskId));
      
      console.log(`Deleting ${tasksToDelete.length} existing recurring task instances`);
      for (const task of tasksToDelete) {
        await storage.deleteTask(task.id);
      }
      
      // Regenerate all task instances with fixed date logic
      console.log(`Regenerating task instances for ${recurringTasks.length} recurring tasks`);
      for (const recurringTask of recurringTasks) {
        await (storage as any).generateTaskInstances(recurringTask);
      }
      
      const newTasks = await storage.getTasks();
      const newRecurringInstances = newTasks.filter(task => task.isRecurring);
      
      res.json({ 
        message: "Tasks regenerated successfully with fixed dates",
        deletedTasks: tasksToDelete.length,
        regeneratedTasks: newRecurringInstances.length,
        recurringTasks: recurringTasks.length
      });
    } catch (error) {
      console.error("Failed to regenerate tasks:", error);
      res.status(500).json({ message: "Failed to regenerate tasks" });
    }
  });



  // Clear all data endpoint - Complete reset
  app.post("/api/clear-data", async (req, res) => {
    try {
      console.log('=== CLEARING ALL DATA ===');
      
      const success = await storage.clearAllData();
      
      if (!success) {
        return res.status(500).json({ message: "Failed to clear data" });
      }

      console.log('All data cleared successfully');
      
      res.json({ 
        message: "All data cleared successfully",
        tasks: 0,
        recurringTasks: 0,
        inventoryItems: 0
      });
    } catch (error) {
      console.error('Error clearing data:', error);
      res.status(500).json({ error: "Failed to clear data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
