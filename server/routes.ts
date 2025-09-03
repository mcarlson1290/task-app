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
      // Transform ALL users to staff format for frontend compatibility
      const staff = users.map(user => ({
        id: user.id.toString(),
        fullName: user.name || 'Unknown User',
        email: user.username,
        phone: user.businessPhone || user.mobilePhone || user.homePhone || '',
        location: user.location || 'Kenosha',
        rolesAssigned: user.role ? user.role.split(',').map(r => r.trim()) : ['General Staff'],
        dateHired: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        payType: user.payType || 'hourly',
        payRate: user.payRate || 16.00,
        businessEmail: user.businessEmail || user.username,
        personalEmail: user.personalEmail,
        homePhone: user.homePhone,
        businessPhone: user.businessPhone,
        mobilePhone: user.mobilePhone,
        emergencyContactName: user.emergencyContactName,
        emergencyRelationship: user.emergencyRelationship,
        emergencyPhone: user.emergencyPhone,
        trainingCompleted: [],
        trainingInProgress: [],
        preferredHours: 'Flexible',
        activeStatus: user.approved ? 'Active' : 'Pending',
        lastTaskCompleted: '',
        managerNotes: user.role?.includes('Corporate') ? 'Corporate Manager' : 'Staff Member',
        tasksCompleted: 0,
        avgTaskDuration: '0m',
        onTimeRate: 100,
        microsoftId: user.id.toString(),
        lastActive: user.lastActive ? new Date(user.lastActive).toISOString() : null,
        password: undefined
      }));
      
      console.log(`Returning ${staff.length} staff members from ${users.length} users`);
      res.json(staff);
    } catch (error) {
      console.error('Staff fetch error:', error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post("/api/staff", async (req, res) => {
    try {
      const staffData = req.body;
      
      // Check if user already exists by email to prevent duplicates
      const existingUser = await storage.getUserByUsername(staffData.email);
      if (existingUser) {
        // Return existing user as staff format
        const existingStaff = {
          id: existingUser.id.toString(),
          fullName: existingUser.name,
          email: existingUser.username,
          phone: existingUser.businessPhone || existingUser.mobilePhone || existingUser.homePhone || '',
          location: existingUser.location || 'Kenosha',
          rolesAssigned: existingUser.role ? existingUser.role.split(',').map(r => r.trim()) : ['General Staff'],
          dateHired: existingUser.createdAt ? new Date(existingUser.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          payType: existingUser.payType || 'hourly',
          payRate: existingUser.payRate || 16.00,
          businessEmail: existingUser.businessEmail || existingUser.username,
          personalEmail: existingUser.personalEmail,
          homePhone: existingUser.homePhone,
          businessPhone: existingUser.businessPhone,
          mobilePhone: existingUser.mobilePhone,
          emergencyContactName: existingUser.emergencyContactName,
          emergencyRelationship: existingUser.emergencyRelationship,
          emergencyPhone: existingUser.emergencyPhone,
          trainingCompleted: [],
          trainingInProgress: [],
          preferredHours: 'Flexible',
          activeStatus: existingUser.approved ? 'Active' : 'Pending',
          lastTaskCompleted: '',
          managerNotes: 'Updated from Microsoft login',
          tasksCompleted: 0,
          avgTaskDuration: '0m',
          onTimeRate: 100,
          microsoftId: existingUser.id.toString(),
          lastActive: existingUser.lastActive ? new Date(existingUser.lastActive).toISOString() : null
        };
        return res.json(existingStaff);
      }
      
      // Convert staff format to user format
      const userData = {
        username: staffData.email,
        password: 'temp-password', // Will be set via Microsoft auth
        name: staffData.fullName,
        role: Array.isArray(staffData.rolesAssigned) ? staffData.rolesAssigned.join(', ') : 'technician',
        approved: staffData.activeStatus === 'Active',
        location: staffData.location || 'Kenosha',
        payType: staffData.payType || 'hourly',
        payRate: staffData.payRate || 16.00,
        businessEmail: staffData.businessEmail || staffData.email,
        personalEmail: staffData.personalEmail,
        homePhone: staffData.homePhone,
        businessPhone: staffData.businessPhone || staffData.phone,
        mobilePhone: staffData.mobilePhone || staffData.phone,
        emergencyContactName: staffData.emergencyContactName,
        emergencyRelationship: staffData.emergencyRelationship,
        emergencyPhone: staffData.emergencyPhone,
        lastActive: new Date() // Set last active on first creation
      };
      const user = await storage.createUser(userData);
      res.json({ ...staffData, id: user.id.toString() });
    } catch (error) {
      console.error('Staff creation error:', error);
      res.status(500).json({ message: "Failed to create staff member" });
    }
  });

  app.put("/api/staff/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const staffData = req.body;
      
      // Check if user exists first by string ID (Microsoft ID format)
      const existingUser = await storage.getUserByUsername(staffData.email);
      
      if (!existingUser) {
        // If user doesn't exist, create them instead
        const userData = {
          username: staffData.email,
          password: 'temp-password', // Will be set via Microsoft auth
          name: staffData.fullName,
          role: Array.isArray(staffData.rolesAssigned) ? staffData.rolesAssigned.join(', ') : 'technician',
          approved: staffData.activeStatus === 'Active',
          location: staffData.location || 'Kenosha',
          payType: staffData.payType || 'hourly',
          payRate: staffData.payRate || 16.00,
          businessEmail: staffData.businessEmail || staffData.email,
          personalEmail: staffData.personalEmail,
          homePhone: staffData.homePhone,
          businessPhone: staffData.businessPhone || staffData.phone,
          mobilePhone: staffData.mobilePhone || staffData.phone,
          emergencyContactName: staffData.emergencyContactName,
          emergencyRelationship: staffData.emergencyRelationship,
          emergencyPhone: staffData.emergencyPhone
        };
        const newUser = await storage.createUser(userData);
        return res.json({ ...staffData, id: newUser.id.toString() });
      }
      
      // Update existing user with complete staff data
      const updates = {
        name: staffData.fullName,
        role: Array.isArray(staffData.rolesAssigned) ? staffData.rolesAssigned.join(', ') : staffData.rolesAssigned,
        approved: staffData.activeStatus === 'Active',
        location: staffData.location || 'Kenosha',
        payType: staffData.payType || 'hourly',
        payRate: staffData.payRate || 16.00,
        businessEmail: staffData.businessEmail || staffData.email,
        personalEmail: staffData.personalEmail,
        homePhone: staffData.homePhone,
        businessPhone: staffData.businessPhone || staffData.phone,
        mobilePhone: staffData.mobilePhone || staffData.phone,
        emergencyContactName: staffData.emergencyContactName,
        emergencyRelationship: staffData.emergencyRelationship,
        emergencyPhone: staffData.emergencyPhone
      };
      const user = await storage.updateUser(existingUser.id, updates);
      if (!user) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.json(staffData);
    } catch (error) {
      console.error('Staff update error:', error);
      res.status(500).json({ message: "Failed to update staff member" });
    }
  });

  app.delete("/api/staff/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      // Check for active tasks assigned to this staff member
      const tasks = await storage.getAllTasks();
      const activeTasks = tasks.filter(task => 
        task.assignedTo === id && 
        task.status !== 'completed' && 
        task.status !== 'cancelled'
      );
      
      if (activeTasks.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete staff member with active tasks",
          activeTasks: true,
          activeTaskCount: activeTasks.length
        });
      }
      
      // Check for recurring tasks that might be assigned to this user's roles
      const recurringTasks = await storage.getAllRecurringTasks();
      const userRoles = user.role ? user.role.split(',').map((r: string) => r.trim()) : [];
      // Note: recurring tasks don't have assignedRoles field in current schema
      const recurringTasksAssigned = recurringTasks.filter(rt => 
        // For now, assume all recurring tasks could be affected
        rt.isActive
      );
      
      // Log deletion for audit purposes
      console.log(`Attempting to delete staff member: ${user.name} (ID: ${id})`);
      console.log(`User roles: ${userRoles.join(', ')}`);
      console.log(`Active tasks: ${activeTasks.length}`);
      console.log(`Recurring tasks potentially affected: ${recurringTasksAssigned.length}`);
      
      // Perform soft delete by marking as inactive and removing roles
      const updatedUser = await storage.updateUser(id, { 
        approved: false,
        role: 'inactive',
        name: `[DELETED] ${user.name}`
      });
      
      console.log(`Staff member soft deleted: ${user.name} (ID: ${id})`);
      
      res.json({ 
        success: true, 
        deleted: {
          id: user.id,
          name: user.name,
          username: user.username
        },
        softDelete: true,
        message: "Staff member has been deactivated and removed from assignments"
      });
    } catch (error) {
      console.error('Staff deletion error:', error);
      res.status(500).json({ message: "Failed to delete staff member" });
    }
  });

  // Activity tracking endpoint
  app.post("/api/users/:id/activity", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.updateUser(userId, { lastActive: new Date() });
      if (user) {
        res.json({ message: "Activity updated", lastActive: user.lastActive });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error('Activity update error:', error);
      res.status(500).json({ message: "Failed to update activity" });
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

  app.post("/api/users", async (req, res) => {
    try {
      const userData = req.body;
      const user = await storage.createUser(userData);
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error('User creation error:', error);
      res.status(500).json({ message: "Failed to create user" });
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
      res.status(400).json({ message: "Failed to create task", error: error instanceof Error ? error.message : String(error) });
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
      res.status(500).json({ message: "Failed to update task", error: error instanceof Error ? error.message : String(error) });
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
      res.status(500).json({ message: "Failed to add inventory", error: error instanceof Error ? error.message : String(error) });
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

  // Bulk update recurring tasks location (migration fix)
  app.patch("/api/recurring-tasks/bulk-location", async (req, res) => {
    try {
      const { location = 'K' } = req.body;
      const recurringTasks = await storage.getAllRecurringTasks();
      
      let updated = 0;
      for (const task of recurringTasks) {
        if (!task.location || task.location === null) {
          await storage.updateRecurringTask(task.id, { location });
          updated++;
        }
      }
      
      console.log(`Updated ${updated} recurring tasks with location: ${location}`);
      res.json({ message: `Updated ${updated} recurring tasks with location`, updated, location });
    } catch (error) {
      console.error('Error bulk updating recurring task locations:', error);
      res.status(500).json({ message: 'Failed to update recurring task locations' });
    }
  });

  // Bulk update ALL recurring tasks location (for SharePoint migration fix)
  app.post("/api/recurring-tasks/bulk-update-location", async (req, res) => {
    try {
      const { fromLocation, toLocation } = req.body;
      const recurringTasks = await storage.getAllRecurringTasks();
      
      let updated = 0;
      for (const task of recurringTasks) {
        // Update all tasks with the specified fromLocation, or update all if no fromLocation specified
        if (!fromLocation || task.location === fromLocation) {
          await storage.updateRecurringTask(task.id, { location: toLocation });
          updated++;
          console.log(`Updated task "${task.title}" location from "${task.location}" to "${toLocation}"`);
        }
      }
      
      console.log(`Bulk updated ${updated} recurring tasks to location: ${toLocation}`);
      res.json({ message: `Updated ${updated} recurring tasks to location: ${toLocation}`, updated, toLocation });
    } catch (error) {
      console.error('Error bulk updating recurring task locations:', error);
      res.status(500).json({ message: 'Failed to bulk update recurring task locations' });
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

  // Regenerate ALL task instances with corrected logic
  app.post("/api/recurring-tasks/regenerate-all", async (req, res) => {
    try {
      console.log("🔄 Starting bulk regeneration of all task instances...");
      const result = await storage.regenerateAllTaskInstances();
      
      res.json({ 
        message: "Successfully regenerated all task instances with corrected date logic",
        ...result
      });
    } catch (error) {
      console.error('Error regenerating all task instances:', error);
      res.status(500).json({ message: "Failed to regenerate task instances" });
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
      res.status(400).json({ message: "Failed to create course assignment", error: error instanceof Error ? error.message : String(error) });
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
      res.status(400).json({ message: "Failed to create notification", error: error instanceof Error ? error.message : String(error) });
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
      const recurringTasks = await storage.getAllRecurringTasks();
      const tasks = await storage.getAllTasks();
      
      // Remove all task instances that were generated from recurring tasks
      const recurringTaskIds = new Set(recurringTasks.map((rt: any) => rt.id));
      const tasksToDelete = tasks.filter((task: any) => task.isRecurring && task.recurringTaskId && recurringTaskIds.has(task.recurringTaskId));
      
      console.log(`Deleting ${tasksToDelete.length} existing recurring task instances`);
      for (const task of tasksToDelete) {
        await storage.deleteTask(task.id);
      }
      
      // Regenerate all task instances with fixed date logic
      console.log(`Regenerating task instances for ${recurringTasks.length} recurring tasks`);
      for (const recurringTask of recurringTasks) {
        await (storage as any).generateTaskInstances(recurringTask);
      }
      
      const newTasks = await storage.getAllTasks();
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

  // Tray API endpoints (temporary localStorage bridge until database migration)
  app.get("/api/trays", async (req, res) => {
    try {
      // For now, return empty array - will be replaced with database implementation
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trays" });
    }
  });

  app.post("/api/trays", async (req, res) => {
    try {
      // For now, just return the created tray data
      const trayData = req.body;
      res.json(trayData);
    } catch (error) {
      res.status(500).json({ message: "Failed to create tray" });
    }
  });

  app.put("/api/trays/:id", async (req, res) => {
    try {
      const trayId = req.params.id;
      const updates = req.body;
      // For now, just return the updated data
      res.json({ id: trayId, ...updates });
    } catch (error) {
      res.status(500).json({ message: "Failed to update tray" });
    }
  });

  app.delete("/api/trays/:id", async (req, res) => {
    try {
      const trayId = req.params.id;
      res.json({ message: "Tray deleted successfully", id: trayId });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tray" });
    }
  });

  app.post("/api/trays/:id/split", async (req, res) => {
    try {
      const trayId = req.params.id;
      const { splitCount } = req.body;
      // For now, return mock split data
      const splitTrays = Array.from({ length: splitCount }, (_, i) => ({
        id: `${trayId}-${i + 1}`,
        splitFrom: trayId,
        splitNumber: i + 1,
        splitTotal: splitCount
      }));
      res.json(splitTrays);
    } catch (error) {
      res.status(500).json({ message: "Failed to split tray" });
    }
  });

  // Complete SharePoint CSV import endpoint - Import all 50+ transformed tasks
  app.post("/api/admin/import-complete-csv", async (req, res) => {
    try {
      // Clear existing recurring tasks to avoid duplicates
      await storage.resetRecurringTasks();
      
      // Get default user (Robert Carlson)
      let defaultUserId = 4; // Robert Carlson's ID
      const users = await storage.getAllUsers();
      if (users.length > 0) {
        defaultUserId = users[0].id;
      }

      // Helper to map category to type
      const mapCategoryToType = (category: string) => {
        const categoryLower = category.toLowerCase();
        if (categoryLower.includes('seeding')) return 'seeding-microgreens';
        if (categoryLower.includes('harvest')) return 'harvest-microgreens'; 
        if (categoryLower.includes('blackout')) return 'blackout-tasks';
        if (categoryLower.includes('moving')) return 'moving';
        if (categoryLower.includes('cleaning')) return 'cleaning';
        if (categoryLower.includes('inventory')) return 'inventory';
        if (categoryLower.includes('farm')) return 'general-maintenance';
        return 'other';
      };

      // Helper to parse days of week from CSV format
      const parseDaysOfWeek = (daysStr: string) => {
        if (!daysStr || daysStr === '[]') return null;
        if (daysStr.includes(',')) {
          return daysStr.split(',').map((d: string) => d.trim().toLowerCase());
        }
        return [daysStr.toLowerCase()];
      };

      // Complete transformed CSV data (all 50+ tasks)
      const transformedTasks = [
        { title: "Remove BO and Move Arugula Microgreens to Watering Rack", description: "Move to watering rack", category: "Blackout Tasks", priority: "high", frequency: "weekly", daysOfWeek: "wednesday", assignedRole: "General Staff" },
        { title: "Seed Broccoli Microgreens", description: "Seed Broccoli Microgreens", category: "Seeding - Microgreens", priority: "high", frequency: "weekly", daysOfWeek: "sunday", assignedRole: "Microgreen Seeder" },
        { title: "Soak Pea Microgreens", description: "Soak the Seeds for 12 hours; Drain and rinse occasionaly until tomorrow afternoon.", category: "Other", priority: "high", frequency: "weekly", daysOfWeek: "sunday", assignedRole: "Microgreen Seeder" },
        { title: "Remove Weight/BO and Move Radish Microgreens to Watering Rack", description: "Remove Weight/BO and Move Radish Microgreens", category: "Moving", priority: "high", frequency: "weekly", daysOfWeek: "tuesday", assignedRole: "General Staff" },
        { title: "Adjust Nutrients in Microgreen Reservoirs", description: "Check the nutrient and pH level and adjust", category: "Other", priority: "medium", frequency: "weekly", daysOfWeek: "wednesday", assignedRole: "General Staff" },
        { title: "Clean Bathroom", description: "Clean the Bathroom", category: "Cleaning", priority: "medium", frequency: "weekly", daysOfWeek: "monday", assignedRole: "Manager" },
        { title: "Deep Floor Scrub", description: "This task is designed to deep clean stained and heavily soiled areas of the facility floor using a baking soda solution and manual scrubbing.", category: "Other", priority: "medium", frequency: "bi-weekly", daysOfWeek: null, assignedRole: "Manager" },
        { title: "Opening", description: "Open the farm.", category: "Other", priority: "high", frequency: "daily", daysOfWeek: null, assignedRole: "General Staff" },
        { title: "Clean Tower Clips", description: "Clean tower clips.", category: "Cleaning", priority: "medium", frequency: "weekly", daysOfWeek: "tuesday", assignedRole: "General Staff" },
        { title: "Check the Inventory of Leafy Green Stock", description: "Check the Rockwool, Oasis Cubes, Seeds, and Leafy Green Bags.", category: "Inventory", priority: "medium", frequency: "monthly", daysOfWeek: null, dayOfMonth: 1, assignedRole: "General Staff" },
        { title: "Check General Inventory Stock", description: "Check the stock of Order Bags, Order Boxes, Labels, and More", category: "Inventory", priority: "medium", frequency: "monthly", daysOfWeek: null, dayOfMonth: 1, assignedRole: "General Staff" },
        { title: "Check Nutrient Inventory", description: "Ensure we have enough nutrients to last roughly three months.", category: "Inventory", priority: "medium", frequency: "monthly", daysOfWeek: null, dayOfMonth: 1, assignedRole: "General Staff" },
        { title: "Uncover the Leafy Green and Herb trays", description: "There should be many trays to uncover including Romaine, Swiss Chard, Butter Crunch, Red Oak, Kale, Summer Crisp, Basil, and Collard Greens", category: "Other", priority: "medium", frequency: "weekly", daysOfWeek: "friday", assignedRole: "General Staff" },
        { title: "Seed Pea Microgreens", description: "Use soaked seeds. Place trays directly into Watering Rack. Use 1 shim under tray in watering rack.", category: "Seeding - Microgreens", priority: "high", frequency: "weekly", daysOfWeek: "monday", assignedRole: "Microgreen Seeder" },
        { title: "Seed Radish Microgreens", description: "Seed the Radish Microgreens", category: "Seeding - Microgreens", priority: "high", frequency: "weekly", daysOfWeek: "saturday", assignedRole: "Microgreen Seeder" },
        { title: "Seed Mustard Microgreens", description: "Do not stack while germinating.", category: "Seeding - Microgreens", priority: "high", frequency: "weekly", daysOfWeek: "sunday", assignedRole: "Microgreen Seeder" },
        { title: "Remove Weight/BO and Move Broccoli Microgreens to Watering Rack", description: "Put in D watering rack on shelf with fan; After move, run water in rack until tray is wet.", category: "Moving", priority: "high", frequency: "weekly", daysOfWeek: "wednesday", assignedRole: "General Staff" },
        { title: "Remove Weight and BO for Pea Microgreens", description: "Remove Weight and dome for Pea Microgreens", category: "Blackout Tasks", priority: "high", frequency: "weekly", daysOfWeek: "friday", assignedRole: "General Staff" },
        { title: "Remove BO and Move Mustard Microgreens to Watering Rack", description: "Remove Dome and Move Mustard Microgreens to Watering Rack", category: "Blackout Tasks", priority: "high", frequency: "weekly", daysOfWeek: "wednesday", assignedRole: "General Staff" },
        { title: "Harvest Pea Microgreens", description: "Apis: 3 oz in 24 oz container; Others: 1 oz in 8 oz container", category: "Harvest - Microgreens", priority: "medium", frequency: "weekly", daysOfWeek: "wednesday", assignedRole: "Harvester" },
        { title: "Harvest Broccoli Microgreens", description: "1 oz per 8 oz container", category: "Harvest - Microgreens", priority: "medium", frequency: "weekly", daysOfWeek: "wednesday", assignedRole: "Harvester" },
        { title: "Harvest Radish Microgreens", description: "1 oz in 8 oz container", category: "Harvest - Microgreens", priority: "medium", frequency: "weekly", daysOfWeek: "wednesday", assignedRole: "Harvester" },
        { title: "Harvest Mustard Microgreens", description: "0.7 oz in 8 oz container", category: "Harvest - Microgreens", priority: "medium", frequency: "weekly", daysOfWeek: "wednesday", assignedRole: "Harvester" },
        { title: "Seed Arugula Microgreens", description: "Mucilagenous seeds; do not stack", category: "Seeding - Microgreens", priority: "high", frequency: "weekly", daysOfWeek: "monday", assignedRole: "Microgreen Seeder" },
        { title: "Harvest Arugula Microgreens", description: "0.5 oz in 8 oz container", category: "Harvest - Microgreens", priority: "medium", frequency: "weekly", daysOfWeek: "wednesday", assignedRole: "Harvester" },
        { title: "Water Microgreen Germination Trays", description: "Water microgreens daily", category: "General Farm", priority: "high", frequency: "weekly", daysOfWeek: "sunday,monday,tuesday,saturday", assignedRole: "General Staff" },
        { title: "Change Microgreen Reservoir Water and Clean Shelves", description: "This process ensures that the water in the microgreen reservoir is fresh and properly prepared with nutrients and pH adjustments.", category: "Cleaning", priority: "medium", frequency: "monthly", daysOfWeek: null, dayOfMonth: 1, assignedRole: "General Staff" },
        { title: "Check Paper Towel Levels", description: "Ensure adequate paper towel supplies are maintained.", category: "Other", priority: "medium", frequency: "weekly", daysOfWeek: "thursday", assignedRole: "General Staff" },
        { title: "Remove Garbage from Non-Farm areas", description: "Collect and dispose of trash from lobby and office areas.", category: "Moving", priority: "medium", frequency: "weekly", daysOfWeek: "thursday", assignedRole: "General Staff" },
        { title: "Vacuum the Office and Lobby", description: "Maintain cleanliness in office and lobby areas.", category: "Other", priority: "medium", frequency: "weekly", daysOfWeek: "thursday", assignedRole: "General Staff" },
        { title: "Clean Outside Facing Lobby Window", description: "Keep lobby windows clean and professional.", category: "Cleaning", priority: "medium", frequency: "monthly", daysOfWeek: null, dayOfMonth: 1, assignedRole: "General Staff" },
        { title: "Washing Farm Towels and Filter Socks", description: "Ensure farm towels and filter socks are cleaned properly.", category: "Other", priority: "medium", frequency: "weekly", daysOfWeek: "tuesday", assignedRole: "General Staff" },
        { title: "Clean Farm Floor", description: "Deep clean and sanitize farm floors.", category: "Cleaning", priority: "medium", frequency: "weekly", daysOfWeek: "monday", assignedRole: "General Staff" },
        { title: "Interior Window Cleaning", description: "Clean interior windows throughout the facility.", category: "Cleaning", priority: "medium", frequency: "monthly", daysOfWeek: null, dayOfMonth: 1, assignedRole: "General Staff" },
        { title: "Check pH and Water Levels in Towers", description: "Ensure optimal water pH and levels in all towers.", category: "General Farm", priority: "medium", frequency: "weekly", daysOfWeek: "thursday", assignedRole: "General Staff" },
        { title: "Seed Leafy Greens", description: "Seed leafy greens based on planning spreadsheet.", category: "Seeding - Leafy Greens", priority: "high", frequency: "weekly", daysOfWeek: "tuesday", assignedRole: "Microgreen Seeder" },
        { title: "Harvest Turnip Microgreens", description: "1 oz per 8 oz container", category: "Harvest - Microgreens", priority: "medium", frequency: "weekly", daysOfWeek: "wednesday", assignedRole: "Harvester" },
        { title: "Harvest Spicy Mix Microgreens", description: "0.7 oz per 8 oz container", category: "Harvest - Microgreens", priority: "medium", frequency: "weekly", daysOfWeek: "wednesday", assignedRole: "Harvester" },
        { title: "Remove Weight/BO and Move Turnip Microgreens to Watering Rack", description: "Move turnip microgreens to watering rack", category: "Moving", priority: "high", frequency: "weekly", daysOfWeek: "thursday", assignedRole: "General Staff" },
        { title: "Remove BO and Move Spicy Mix Microgreens to Watering Rack", description: "Move spicy mix microgreens to watering rack", category: "Blackout Tasks", priority: "high", frequency: "weekly", daysOfWeek: "wednesday", assignedRole: "General Staff" },
        { title: "Seed Turnip Microgreens", description: "Seed Turnip Microgreens", category: "Seeding - Microgreens", priority: "high", frequency: "weekly", daysOfWeek: "monday", assignedRole: "Microgreen Seeder" },
        { title: "Seed Spicy Mix Microgreens", description: "Seed Spicy Mix Microgreens", category: "Seeding - Microgreens", priority: "high", frequency: "weekly", daysOfWeek: "sunday", assignedRole: "Microgreen Seeder" },
        { title: "Clean Tower Basins", description: "Proper disassembly, cleanup, and preparation of Tower Garden basins", category: "Cleaning", priority: "medium", frequency: "weekly", daysOfWeek: "wednesday", assignedRole: "General Staff" },
        { title: "Set Clean Towers", description: "Install clean, fully assembled towers in fresh basins", category: "Cleaning", priority: "medium", frequency: "weekly", daysOfWeek: "wednesday", assignedRole: "General Staff" },
        { title: "Clean Tower Garden Pots", description: "Clean Tower Garden pots and structural rods thoroughly", category: "Cleaning", priority: "medium", frequency: "weekly", daysOfWeek: "thursday", assignedRole: "General Staff" },
        { title: "Assemble Tower Gardens", description: "Full assembly of Tower Garden units with proper alignment", category: "Other", priority: "medium", frequency: "weekly", daysOfWeek: "saturday", assignedRole: "General Staff" },
        { title: "Disassemble Towers", description: "Disassemble tower units after removal from growing position", category: "Other", priority: "medium", frequency: "weekly", daysOfWeek: "wednesday", assignedRole: "General Staff" },
        { title: "Replace Fan and Furnace Filter", description: "Replace filters to prevent mildew", category: "Other", priority: "medium", frequency: "bi-weekly", daysOfWeek: null, assignedRole: "General Staff" },
        { title: "Plant Towers", description: "Plant needed towers for the week based on checklist", category: "Other", priority: "medium", frequency: "weekly", daysOfWeek: "thursday", assignedRole: "General Staff" },
        { title: "Harvest Towers", description: "Harvest towers according to checklist", category: "Other", priority: "high", frequency: "weekly", daysOfWeek: "tuesday", assignedRole: "Harvester" }
      ];

      let imported = 0;
      
      for (const csvTask of transformedTasks) {
        try {
          const task = {
            title: csvTask.title,
            description: csvTask.description,
            type: mapCategoryToType(csvTask.category),
            frequency: csvTask.frequency,
            daysOfWeek: csvTask.daysOfWeek ? parseDaysOfWeek(csvTask.daysOfWeek) : null,
            dayOfMonth: csvTask.dayOfMonth || null,
            location: "Kenosha",
            isActive: true,
            createdBy: defaultUserId
          };

          await storage.createRecurringTask(task);
          imported++;
        } catch (error) {
          console.error(`Failed to import task: ${csvTask.title}`, error);
        }
      }
      
      console.log(`✅ Complete CSV Migration: Imported ${imported} recurring tasks`);
      res.json({ 
        success: true,
        message: `Successfully imported ${imported} SharePoint recurring tasks from complete CSV dataset`,
        imported 
      });
    } catch (error) {
      console.error('❌ Complete CSV migration failed:', error);
      res.status(500).json({ message: 'Failed to import complete CSV tasks' });
    }
  });

  // Admin endpoint to fix frequency field in existing task instances
  app.post("/api/admin/fix-task-frequencies", async (req, res) => {
    try {
      console.log('🔧 FIXING FREQUENCY FIELDS IN EXISTING TASKS');
      
      const allTasks = await storage.getAllTasks();
      const allRecurringTasks = await storage.getAllRecurringTasks();
      
      // Create lookup map for recurring tasks
      const recurringTaskMap = new Map();
      allRecurringTasks.forEach(rt => {
        recurringTaskMap.set(rt.id, rt);
      });
      
      let updatedCount = 0;
      
      for (const task of allTasks) {
        if (task.recurringTaskId && (task.frequency === null || task.frequency === undefined)) {
          const recurringTask = recurringTaskMap.get(task.recurringTaskId);
          if (recurringTask?.frequency) {
            console.log(`🔧 Updating task ${task.id}: "${task.title}" with frequency: ${recurringTask.frequency}`);
            
            // Update the task with frequency and visibleFromDate if missing
            const updates: any = {
              frequency: recurringTask.frequency
            };
            
            // If no visibleFromDate, set it to the due date for daily tasks or start of period for others
            if (!task.visibleFromDate && task.dueDate) {
              if (recurringTask.frequency === 'monthly') {
                // Monthly tasks visible from 1st of month
                const dueDate = new Date(task.dueDate);
                const firstOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
                updates.visibleFromDate = firstOfMonth.toISOString().split('T')[0];
              } else if (recurringTask.frequency === 'biweekly') {
                // Bi-weekly tasks - check if it's first or second half
                const dueDate = new Date(task.dueDate);
                const dayOfMonth = dueDate.getDate();
                if (dayOfMonth <= 14) {
                  // First half
                  const firstOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
                  updates.visibleFromDate = firstOfMonth.toISOString().split('T')[0];
                } else {
                  // Second half
                  const fifteenth = new Date(dueDate.getFullYear(), dueDate.getMonth(), 15);
                  updates.visibleFromDate = fifteenth.toISOString().split('T')[0];
                }
              } else if (recurringTask.frequency === 'quarterly') {
                // Quarterly tasks visible from start of quarter
                const dueDate = new Date(task.dueDate);
                const month = dueDate.getMonth();
                const quarterStart = Math.floor(month / 3) * 3;
                const quarterStartDate = new Date(dueDate.getFullYear(), quarterStart, 1);
                updates.visibleFromDate = quarterStartDate.toISOString().split('T')[0];
              } else {
                // Daily/weekly tasks visible on their due date
                updates.visibleFromDate = task.dueDate;
              }
            }
            
            await storage.updateTask(task.id, updates);
            updatedCount++;
            console.log(`✅ Updated task ${task.id}: ${task.title} with frequency: ${recurringTask.frequency}`);
          }
        }
      }
      
      console.log(`🎉 FREQUENCY FIX COMPLETE: Updated ${updatedCount} tasks`);
      
      res.json({ 
        success: true,
        message: `Updated ${updatedCount} tasks with frequency data`,
        updatedCount,
        totalTasks: allTasks.length,
        recurringTasks: allRecurringTasks.length
      });
    } catch (error) {
      console.error('❌ Frequency fix failed:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fix task frequencies', 
        error: error.message 
      });
    }
  });

  // Fix monthly task date ranges to show all month
  app.post("/api/admin/fix-monthly-date-ranges", async (req, res) => {
    try {
      console.log('🔧 FIXING MONTHLY TASK DATE RANGES');
      
      const allTasks = await storage.getAllTasks();
      let updateCount = 0;
      
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // First day of current month
      const monthStart = new Date(currentYear, currentMonth, 1);
      // Last day of current month
      const monthEnd = new Date(currentYear, currentMonth + 1, 0);
      
      for (const task of allTasks) {
        // Fix monthly tasks that have same visibleFromDate and dueDate
        if (task.frequency === 'monthly' && task.recurringTaskId) {
          const visibleDate = new Date(task.visibleFromDate);
          const dueDate = new Date(task.dueDate);
          
          // Check if both dates are the same (indicating they need fixing)
          if (visibleDate.getTime() === dueDate.getTime()) {
            console.log(`✅ Fixing monthly date range for: ${task.title}`);
            console.log(`   Before: ${task.visibleFromDate} to ${task.dueDate}`);
            
            await storage.updateTask(task.id, {
              ...task,
              visibleFromDate: monthStart,
              dueDate: monthEnd,
              frequency: 'monthly',
              isRecurring: true
            });
            
            console.log(`   After: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);
            updateCount++;
          }
        }
      }
      
      console.log(`🎉 MONTHLY DATE RANGE FIX COMPLETE: Updated ${updateCount} tasks`);
      
      res.json({
        success: true,
        message: `Fixed date ranges for ${updateCount} monthly tasks`,
        updateCount
      });
      
    } catch (error) {
      console.error('❌ Monthly date range fix failed:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fix monthly date ranges', 
        error: error.message 
      });
    }
  });

  // MANUAL BI-WEEKLY TASK CREATOR - Create missing tasks without foreign key issues
  app.post("/api/admin/create-missing-biweekly", async (req, res) => {
    try {
      console.log('🚀 MANUALLY CREATING MISSING BI-WEEKLY TASKS');
      
      const tasksToCreate = [
        {
          title: "Change Microgreen Reservoir Water and Clean Shelves",
          description: "Change the water in the microgreen reservoir and clean all shelves",
          type: "cleaning"
        },
        {
          title: "Vacuum the Office and Lobby", 
          description: "Vacuum all office areas and lobby spaces",
          type: "cleaning"
        },
        {
          title: "Clean Outside Facing Lobby Window",
          description: "Clean the exterior windows facing the lobby",
          type: "cleaning"
        },
        {
          title: "Interior Window Cleaning",
          description: "Clean all interior windows throughout the facility", 
          type: "cleaning"
        }
      ];
      
      let totalCreated = 0;
      const currentYear = 2025;
      const currentMonth = 8; // September (0-indexed)
      
      for (const taskTemplate of tasksToCreate) {
        console.log(`Creating instances for: ${taskTemplate.title}`);
        
        // Create first half (Sept 1-15)
        const firstHalfTask = {
          title: taskTemplate.title,
          description: taskTemplate.description,
          type: taskTemplate.type,
          status: 'pending' as const,
          priority: 'medium' as const,
          assignedTo: null,
          createdBy: null,
          location: 'K',
          dueDate: new Date(currentYear, currentMonth, 15),
          visibleFromDate: new Date(currentYear, currentMonth, 1),
          frequency: 'bi-weekly',
          recurringTaskId: null, // Skip foreign key to avoid constraint issues
          isRecurring: true,
          createdAt: new Date()
        };
        
        // Create second half (Sept 16-30)
        const secondHalfTask = {
          title: taskTemplate.title,
          description: taskTemplate.description,
          type: taskTemplate.type,
          status: 'pending' as const,
          priority: 'medium' as const,
          assignedTo: null,
          createdBy: null,
          location: 'K',
          dueDate: new Date(currentYear, currentMonth, 30),
          visibleFromDate: new Date(currentYear, currentMonth, 16),
          frequency: 'bi-weekly',
          recurringTaskId: null, // Skip foreign key to avoid constraint issues
          isRecurring: true,
          createdAt: new Date()
        };
        
        try {
          await storage.createTask(firstHalfTask);
          await storage.createTask(secondHalfTask);
          totalCreated += 2;
          console.log(`✅ Created both halves for: ${taskTemplate.title}`);
        } catch (error) {
          console.log(`⚠️ Failed ${taskTemplate.title}: ${error.message}`);
        }
      }
      
      console.log(`🎉 MANUAL BI-WEEKLY CREATION COMPLETE: Created ${totalCreated} tasks`);
      
      res.json({
        success: true,
        message: `Manually created ${totalCreated} bi-weekly task instances`,
        totalCreated
      });
      
    } catch (error) {
      console.error('❌ Manual bi-weekly creation failed:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to create bi-weekly tasks manually', 
        error: error.message 
      });
    }
  });

  // SIMPLE BI-WEEKLY TASK GENERATOR - Create all missing bi-weekly tasks
  app.post("/api/admin/create-all-biweekly-tasks", async (req, res) => {
    try {
      console.log('🚀 CREATING ALL BI-WEEKLY TASKS FOR SEPTEMBER');
      
      const recurringTasks = await storage.getAllRecurringTasks();
      const biweeklyTasks = recurringTasks.filter(rt => rt.frequency === 'bi-weekly');
      const existingTasks = await storage.getAllTasks();
      
      let totalCreated = 0;
      const currentYear = 2025;
      const currentMonth = 8; // September (0-indexed)
      
      for (const recurringTask of biweeklyTasks) {
        console.log(`Creating instances for: ${recurringTask.title}`);
        
        // Check if tasks already exist for this recurring pattern
        const existingForPattern = existingTasks.filter(t => 
          t.recurringTaskId === recurringTask.id && 
          t.frequency === 'bi-weekly'
        );
        
        if (existingForPattern.length >= 2) {
          console.log(`   ⏭️  Already has ${existingForPattern.length} instances`);
          continue;
        }
        
        // Create first half (Sept 1-15) - only if doesn't exist
        const hasFirstHalf = existingForPattern.some(t => 
          new Date(t.visibleFromDate).getDate() === 1
        );
        
        if (!hasFirstHalf) {
          const firstHalfTask = {
            title: recurringTask.title,
            description: recurringTask.description,
            type: recurringTask.type,
            status: 'pending' as const,
            priority: 'medium' as const,
            assignedTo: null,
            createdBy: recurringTask.createdBy,
            location: recurringTask.location,
            dueDate: new Date(currentYear, currentMonth, 15),
            visibleFromDate: new Date(currentYear, currentMonth, 1),
            frequency: 'bi-weekly',
            recurringTaskId: recurringTask.id,
            isRecurring: true,
            createdAt: new Date()
          };
          
          try {
            await storage.createTask(firstHalfTask);
            totalCreated++;
            console.log(`✅ Created first half for: ${recurringTask.title}`);
          } catch (error) {
            console.log(`⚠️ Failed first half ${recurringTask.title}: ${error.message}`);
          }
        }
        
        // Create second half (Sept 16-30) - only if doesn't exist
        const hasSecondHalf = existingForPattern.some(t => 
          new Date(t.visibleFromDate).getDate() === 16
        );
        
        if (!hasSecondHalf) {
          const secondHalfTask = {
            title: recurringTask.title,
            description: recurringTask.description,
            type: recurringTask.type,
            status: 'pending' as const,
            priority: 'medium' as const,
            assignedTo: null,
            createdBy: recurringTask.createdBy,
            location: recurringTask.location,
            dueDate: new Date(currentYear, currentMonth, 30), // Sept 30
            visibleFromDate: new Date(currentYear, currentMonth, 16),
            frequency: 'bi-weekly',
            recurringTaskId: recurringTask.id,
            isRecurring: true,
            createdAt: new Date()
          };
          
          try {
            await storage.createTask(secondHalfTask);
            totalCreated++;
            console.log(`✅ Created second half for: ${recurringTask.title}`);
          } catch (error) {
            console.log(`⚠️ Failed second half ${recurringTask.title}: ${error.message}`);
          }
        }
      }
      
      console.log(`🎉 BI-WEEKLY TASK CREATION COMPLETE: Created ${totalCreated} tasks`);
      
      res.json({
        success: true,
        message: `Created ${totalCreated} bi-weekly task instances`,
        totalCreated
      });
      
    } catch (error) {
      console.error('❌ Bi-weekly task creation failed:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to create bi-weekly tasks', 
        error: error.message 
      });
    }
  });

  // PRODUCTION RECURRING TASK SYSTEM - Works for ANY frequency pattern in database
  app.post("/api/admin/generate-dynamic-recurring", async (req, res) => {
    try {
      console.log('🚀 PRODUCTION RECURRING TASK GENERATION - FIX FOREIGN KEY ISSUE');
      
      // Get recurring tasks from database storage (not memory)
      const recurringTasks = await storage.getAllRecurringTasks();
      const allTasks = await storage.getAllTasks();
      
      console.log(`📋 Found ${recurringTasks.length} recurring tasks in database`);
      
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth(); // 0-indexed
      let totalCreated = 0;
      
      // Process EVERY recurring task pattern in the database
      for (const recurringTask of recurringTasks) {
        const { frequency, id: recurringId, title } = recurringTask;
        
        if (!frequency || frequency === 'daily' || frequency === 'weekly') {
          continue; // Skip daily/weekly - handled by existing system
        }
        
        console.log(`Processing: ${title} (${frequency}) - ID: ${recurringId}`);
        
        // VALIDATE: This recurring task already came from getAllRecurringTasks, so it exists
        console.log(`   ✅ Processing verified recurring task: ${title}`);
        
        // Check existing instances for this recurring pattern
        const existingInstances = allTasks.filter(t => 
          t.recurringTaskId === recurringId &&
          t.frequency === frequency
        );
        
        console.log(`   Found ${existingInstances.length} existing instances`);
        
        // Determine what instances should exist for this frequency
        let requiredInstances = [];
        
        if (frequency === 'monthly') {
          // Monthly: One instance per month with full month visibility
          requiredInstances = [{
            visibleFrom: new Date(currentYear, currentMonth, 1),
            dueDate: new Date(currentYear, currentMonth + 1, 0), // Last day of month
            label: `${currentYear}-${currentMonth + 1}` // Sept = month 9
          }];
        } else if (frequency === 'bi-weekly' || frequency === 'biweekly') {
          // BI-WEEKLY: Two separate tasks per month exactly as specified
          const today = new Date();
          const dayOfMonth = today.getDate();
          
          console.log(`   📅 Bi-weekly logic: Today is ${dayOfMonth}th of month`);
          
          // First Half: Days 1-14 (visible Sept 1-14, due Sept 14)
          const firstHalf = {
            visibleFrom: new Date(currentYear, currentMonth, 1),
            dueDate: new Date(currentYear, currentMonth, 14), // Due on 14th as specified
            label: `${currentYear}-${currentMonth + 1}-1st-14th`,
            periodLabel: "1st-14th"
          };
          
          // Second Half: Days 15-end (visible Sept 15-30, due last day)
          const secondHalf = {
            visibleFrom: new Date(currentYear, currentMonth, 15),
            dueDate: new Date(currentYear, currentMonth + 1, 0), // Last day of month
            label: `${currentYear}-${currentMonth + 1}-15th-end`,
            periodLabel: "15th-31st"
          };
          
          requiredInstances = [firstHalf, secondHalf];
          
          console.log(`   📅 First half: ${firstHalf.visibleFrom.toDateString()} - ${firstHalf.dueDate.toDateString()}`);
          console.log(`   📅 Second half: ${secondHalf.visibleFrom.toDateString()} - ${secondHalf.dueDate.toDateString()}`);
        } else if (frequency === 'quarterly') {
          // Quarterly: One instance per quarter with full quarter visibility
          const quarterStart = Math.floor(currentMonth / 3) * 3;
          requiredInstances = [{
            visibleFrom: new Date(currentYear, quarterStart, 1),
            dueDate: new Date(currentYear, quarterStart + 3, 0),
            label: `${currentYear}-Q${Math.floor(currentMonth / 3) + 1}`
          }];
        }
        
        // Create missing instances
        for (const required of requiredInstances) {
          // Check if this specific instance already exists
          const exists = existingInstances.some(existing => {
            const existingVisible = new Date(existing.visibleFromDate);
            const existingDue = new Date(existing.dueDate);
            return existingVisible.getTime() === required.visibleFrom.getTime() &&
                   existingDue.getTime() === required.dueDate.getTime();
          });
          
          if (!exists) {
            console.log(`   Creating instance: ${required.label}`);
            
            // CLEAN TITLE FORMAT: No period labels in title, use clean names
            const taskTitle = recurringTask.title; // Keep original title clean
            
            const newInstance = {
              title: taskTitle,
              description: recurringTask.description,
              type: recurringTask.type,
              status: 'pending' as const,
              priority: 'medium' as const,
              assignedTo: null, // Will be handled by assignment logic
              createdBy: recurringTask.createdBy,
              location: recurringTask.location,
              dueDate: required.dueDate,
              visibleFromDate: required.visibleFrom,
              frequency: frequency,
              recurringTaskId: recurringId, // Proper foreign key reference
              isRecurring: true,
              createdAt: new Date()
            };
            
            try {
              await storage.createTask(newInstance);
              totalCreated++;
              console.log(`   ✅ Created: ${title} for ${required.label}`);
            } catch (error) {
              console.log(`   ❌ Failed to create ${title}: ${error.message}`);
              // Continue processing other tasks even if one fails
            }
          } else {
            console.log(`   ⏭️  Instance already exists for ${required.label}`);
          }
        }
      }
      
      console.log(`🎉 PRODUCTION RECURRING GENERATION COMPLETE: Created ${totalCreated} tasks`);
      
      res.json({
        success: true,
        message: `Generated ${totalCreated} recurring task instances`,
        totalCreated
      });
      
    } catch (error) {
      console.error('❌ Production recurring generation failed:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to generate dynamic recurring tasks', 
        error: error.message 
      });
    }
  });

  // OLD SYSTEM - DEPRECATED
  app.post("/api/admin/old-generate-dynamic-recurring", async (req, res) => {
    try {
      console.log('🚀 OLD DYNAMIC RECURRING TASK GENERATION');
      
      const recurringTasks = await storage.getAllRecurringTasks();
      const allTasks = await storage.getAllTasks();
      
      const today = new Date();
      let totalCreated = 0;
      
      for (const recurringTask of recurringTasks) {
        const { frequency } = recurringTask;
        
        if (!frequency || frequency === 'daily' || frequency === 'weekly') {
          continue; // Skip daily/weekly - they're handled by existing system
        }
        
        console.log(`Processing: ${recurringTask.title} (${frequency})`);
        
        // Check if task instance already exists for this period
        const existingTask = allTasks.find(t => 
          t.recurringTaskId === recurringTask.id &&
          t.frequency === frequency &&
          new Date(t.visibleFromDate).getMonth() === today.getMonth() &&
          new Date(t.visibleFromDate).getFullYear() === today.getFullYear()
        );
        
        if (existingTask) {
          console.log(`   ⏭️  Task already exists for this period`);
          continue;
        }
        
        let visibleFromDate, dueDate;
        
        // DYNAMIC FREQUENCY HANDLING
        if (frequency === 'monthly') {
          // Monthly: visible all month
          visibleFromDate = new Date(today.getFullYear(), today.getMonth(), 1);
          dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          
        } else if (frequency === 'biweekly' || frequency === 'bi-weekly') {
          // Bi-weekly: create BOTH halves of the month for each pattern
          // This ensures all bi-weekly tasks get proper instances
          
          // Create first half instance (1st-15th)
          const firstHalfVisible = new Date(today.getFullYear(), today.getMonth(), 1);
          const firstHalfDue = new Date(today.getFullYear(), today.getMonth(), 15);
          
          // Check if first half already exists
          const existingFirstHalf = allTasks.find(t => 
            t.recurringTaskId === recurringTask.id &&
            t.frequency === frequency &&
            new Date(t.visibleFromDate).getDate() === 1 &&
            new Date(t.visibleFromDate).getMonth() === today.getMonth()
          );
          
          if (!existingFirstHalf) {
            visibleFromDate = firstHalfVisible;
            dueDate = firstHalfDue;
            console.log(`   📅 Creating first half (1st-15th)`);
          } else {
            // Create second half instance (16th-end)
            const secondHalfVisible = new Date(today.getFullYear(), today.getMonth(), 16);
            const secondHalfDue = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            
            // Check if second half already exists
            const existingSecondHalf = allTasks.find(t => 
              t.recurringTaskId === recurringTask.id &&
              t.frequency === frequency &&
              new Date(t.visibleFromDate).getDate() >= 16 &&
              new Date(t.visibleFromDate).getMonth() === today.getMonth()
            );
            
            if (!existingSecondHalf) {
              visibleFromDate = secondHalfVisible;
              dueDate = secondHalfDue;
              console.log(`   📅 Creating second half (16th-end)`);
            } else {
              console.log(`   ⏭️  Both halves already exist for this month`);
              continue;
            }
          }
          
        } else if (frequency === 'quarterly') {
          // Quarterly: visible all quarter
          const currentQuarter = Math.floor(today.getMonth() / 3);
          const quarterStartMonth = currentQuarter * 3;
          
          visibleFromDate = new Date(today.getFullYear(), quarterStartMonth, 1);
          dueDate = new Date(today.getFullYear(), quarterStartMonth + 3, 0);
          
        } else {
          console.log(`   ⚠️  Unknown frequency: ${frequency}`);
          continue;
        }
        
        // Create the task instance - handle role assignments by leaving them unassigned
        let assignedTo = null;
        if (recurringTask.assignTo) {
          // For now, skip role assignments to avoid database errors
          // Only handle direct user ID assignments
          if (typeof recurringTask.assignTo === 'string' && !recurringTask.assignTo.startsWith('role_')) {
            if (!isNaN(parseInt(recurringTask.assignTo))) {
              assignedTo = parseInt(recurringTask.assignTo);
            }
          }
          // Role assignments will be handled after task creation
        }

        const newTask = {
          title: recurringTask.title,
          description: recurringTask.description,
          type: recurringTask.type,
          status: 'pending' as const,
          priority: 'medium' as const,
          assignedTo: assignedTo,
          createdBy: recurringTask.createdBy,
          location: recurringTask.location,
          dueDate,
          visibleFromDate,
          frequency,
          recurringTaskId: recurringTask.id,
          isRecurring: true,
          createdAt: new Date()
        };
        
        await storage.createTask(newTask);
        totalCreated++;
        
        console.log(`   ✅ Created ${frequency} task: ${recurringTask.title}`);
        console.log(`      Visible: ${visibleFromDate.toISOString().split('T')[0]} to ${dueDate.toISOString().split('T')[0]}`);
      }
      
      console.log(`🎉 DYNAMIC GENERATION COMPLETE: Created ${totalCreated} tasks`);
      
      res.json({
        success: true,
        message: `Generated ${totalCreated} recurring tasks`,
        totalCreated,
        processedPatterns: recurringTasks.length
      });
      
    } catch (error) {
      console.error('❌ Dynamic generation failed:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to generate dynamic recurring tasks', 
        error: error.message 
      });
    }
  });

  // Force generate monthly/bi-weekly/quarterly tasks for current period
  app.post("/api/admin/force-generate-period-tasks", async (req, res) => {
    try {
      console.log('🚀 FORCE GENERATING MONTHLY/BI-WEEKLY/QUARTERLY TASKS');
      
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      
      const recurringTasks = await storage.getAllRecurringTasks();
      const periodicTasks = recurringTasks.filter(rt => 
        ['monthly', 'biweekly', 'quarterly'].includes(rt.frequency)
      );
      
      console.log(`Found ${periodicTasks.length} periodic recurring tasks`);
      
      let createdCount = 0;
      
      for (const recurringTask of periodicTasks) {
        console.log(`Processing: ${recurringTask.title} (${recurringTask.frequency})`);
        
        if (recurringTask.frequency === 'monthly') {
          // Monthly task: visible Sept 1 - Sept 30, due Sept 30
          const visibleFrom = new Date(year, month, 1);
          const lastDay = new Date(year, month + 1, 0);
          
          const taskId = `${recurringTask.id}-${year}-${String(month + 1).padStart(2, '0')}`;
          
          const existingTask = await storage.getTask(parseInt(taskId)) || 
                              (await storage.getAllTasks()).find(t => 
                                t.title === recurringTask.title && 
                                t.dueDate && new Date(t.dueDate).getMonth() === month
                              );
          
          if (!existingTask) {
            const newTask = {
              title: recurringTask.title,
              description: recurringTask.description,
              type: recurringTask.type,
              status: 'pending' as const,
              priority: 'medium' as const,
              assignedTo: recurringTask.assignTo || null,
              createdBy: recurringTask.createdBy,
              location: recurringTask.location,
              dueDate: lastDay,
              visibleFromDate: visibleFrom,
              frequency: 'monthly',
              recurringTaskId: recurringTask.id,
              isRecurring: true,
              createdAt: new Date()
            };
            
            await storage.createTask(newTask);
            createdCount++;
            console.log(`✅ Created monthly task: ${recurringTask.title}`);
          }
        }
        
        if (recurringTask.frequency === 'biweekly') {
          // Bi-weekly tasks: 1st-14th and 15th-end
          const today = new Date();
          const dayOfMonth = today.getDate();
          
          // First half (1st-14th)
          const firstHalfVisible = new Date(year, month, 1);
          const firstHalfDue = new Date(year, month, 14);
          
          const firstTaskId = `${recurringTask.id}-${year}-${String(month + 1).padStart(2, '0')}-01`;
          const existingFirst = (await storage.getAllTasks()).find(t => 
            t.title === recurringTask.title && 
            t.dueDate && new Date(t.dueDate).getDate() <= 14 &&
            new Date(t.dueDate).getMonth() === month
          );
          
          if (!existingFirst) {
            const firstTask = {
              title: recurringTask.title + " (1st Half)",
              description: recurringTask.description,
              type: recurringTask.type,
              status: 'pending' as const,
              priority: 'medium' as const,
              assignedTo: recurringTask.assignTo || null,
              createdBy: recurringTask.createdBy,
              location: recurringTask.location,
              dueDate: firstHalfDue,
              visibleFromDate: firstHalfVisible,
              frequency: 'biweekly',
              recurringTaskId: recurringTask.id,
              isRecurring: true,
              createdAt: new Date()
            };
            
            await storage.createTask(firstTask);
            createdCount++;
            console.log(`✅ Created bi-weekly task (1st half): ${recurringTask.title}`);
          }
          
          // Second half (15th-end)
          const secondHalfVisible = new Date(year, month, 15);
          const lastDay = new Date(year, month + 1, 0);
          
          const existingSecond = (await storage.getAllTasks()).find(t => 
            t.title.includes(recurringTask.title) && 
            t.dueDate && new Date(t.dueDate).getDate() > 14 &&
            new Date(t.dueDate).getMonth() === month
          );
          
          if (!existingSecond) {
            const secondTask = {
              title: recurringTask.title + " (2nd Half)",
              description: recurringTask.description,
              type: recurringTask.type,
              status: 'pending' as const,
              priority: 'medium' as const,
              assignedTo: recurringTask.assignTo || null,
              createdBy: recurringTask.createdBy,
              location: recurringTask.location,
              dueDate: lastDay,
              visibleFromDate: secondHalfVisible,
              frequency: 'biweekly',
              recurringTaskId: recurringTask.id,
              isRecurring: true,
              createdAt: new Date()
            };
            
            await storage.createTask(secondTask);
            createdCount++;
            console.log(`✅ Created bi-weekly task (2nd half): ${recurringTask.title}`);
          }
        }
      }
      
      console.log(`🎉 PERIODIC TASK GENERATION COMPLETE: Created ${createdCount} tasks`);
      
      res.json({
        success: true,
        message: `Generated ${createdCount} periodic tasks`,
        createdCount,
        periodicPatterns: periodicTasks.length
      });
      
    } catch (error) {
      console.error('❌ Periodic task generation failed:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to generate periodic tasks', 
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
