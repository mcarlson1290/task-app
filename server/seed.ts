import { db } from "./db";
import { users, tasks, inventoryItems, trainingModules, userProgress, taskLogs } from "@shared/schema";

async function seedDatabase() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(taskLogs);
  await db.delete(userProgress);
  await db.delete(tasks);
  await db.delete(inventoryItems);
  await db.delete(trainingModules);
  await db.delete(users);

  // Create test users
  const testUsers = [
    { username: "alex", password: "password", name: "Alex Martinez", role: "technician", approved: true },
    { username: "dan", password: "password", name: "Dan Wilson", role: "manager", approved: true },
    { username: "matt", password: "password", name: "Matt Carlson", role: "corporate", approved: true }
  ];

  const createdUsers = await db.insert(users).values(testUsers).returning();
  console.log(`Created ${createdUsers.length} users`);

  // Create sample tasks
  const sampleTasks = [
    {
      title: "Seed Lettuce Trays",
      description: "Plant lettuce seeds in designated trays",
      type: "seeding",
      status: "in_progress",
      priority: "medium",
      assignedTo: createdUsers[0].id,
      createdBy: createdUsers[1].id,
      location: "Section A - Towers 1-5",
      estimatedTime: 180,
      actualTime: null,
      progress: 60,
      checklist: [
        { id: "1", text: "Prepare seed trays", completed: true },
        { id: "2", text: "Fill with growing medium", completed: true },
        { id: "3", text: "Plant lettuce seeds", completed: true },
        { id: "4", text: "Label trays with date", completed: false },
        { id: "5", text: "Place in germination area", completed: false }
      ],
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completedAt: null,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      data: {}
    },
    {
      title: "Harvest Spinach",
      description: "Harvest mature spinach plants",
      type: "harvesting",
      status: "pending",
      priority: "high",
      assignedTo: createdUsers[0].id,
      createdBy: createdUsers[1].id,
      location: "Section B - Towers 6-10",
      estimatedTime: 150,
      actualTime: null,
      progress: 0,
      checklist: [
        { id: "1", text: "Check plant maturity", completed: false },
        { id: "2", text: "Harvest plants", completed: false, dataCollection: { type: "number", label: "Weight (lbs)" } },
        { id: "3", text: "Clean harvested area", completed: false }
      ],
      startedAt: null,
      completedAt: null,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      data: {}
    },
    {
      title: "Clean Tower Systems",
      description: "Full sanitization of tower systems",
      type: "cleaning",
      status: "completed",
      priority: "medium",
      assignedTo: createdUsers[0].id,
      createdBy: createdUsers[1].id,
      location: "Section C - Full sanitization",
      estimatedTime: 120,
      actualTime: 105,
      progress: 100,
      checklist: [
        { id: "1", text: "Sanitize towers", completed: true },
        { id: "2", text: "Clean water systems", completed: true },
        { id: "3", text: "Replace filters", completed: true }
      ],
      startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      data: {}
    },
    {
      title: "Inventory Check - Nutrients",
      description: "Check stock levels and quality of nutrient solutions",
      type: "inventory",
      status: "pending",
      priority: "low",
      assignedTo: createdUsers[0].id,
      createdBy: createdUsers[1].id,
      location: "Storage Room A",
      estimatedTime: 90,
      actualTime: null,
      progress: 0,
      checklist: [
        { id: "1", text: "Check nutrient levels", completed: false, dataCollection: { type: "number", label: "Containers remaining" } },
        { id: "2", text: "Inspect for damage", completed: false },
        { id: "3", text: "Update inventory records", completed: false }
      ],
      startedAt: null,
      completedAt: null,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      data: {}
    }
  ];

  const createdTasks = await db.insert(tasks).values(sampleTasks).returning();
  console.log(`Created ${createdTasks.length} tasks`);

  // Create sample inventory items
  const sampleInventory = [
    { 
      name: "Lettuce Seeds", 
      category: "seeds", 
      currentStock: 150, 
      minimumStock: 50, 
      unit: "packets", 
      supplier: "Green Thumb Seeds",
      lastRestocked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    { 
      name: "Spinach Seeds", 
      category: "seeds", 
      currentStock: 25, 
      minimumStock: 30, 
      unit: "packets", 
      supplier: "Green Thumb Seeds",
      lastRestocked: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    },
    { 
      name: "Nutrient Solution A", 
      category: "nutrients", 
      currentStock: 45, 
      minimumStock: 20, 
      unit: "liters", 
      supplier: "Hydro Nutrients Co",
      lastRestocked: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    { 
      name: "Growing Medium", 
      category: "supplies", 
      currentStock: 80, 
      minimumStock: 40, 
      unit: "kg", 
      supplier: "Farm Supply Plus",
      lastRestocked: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];

  const createdInventory = await db.insert(inventoryItems).values(sampleInventory).returning();
  console.log(`Created ${createdInventory.length} inventory items`);

  // Create sample training modules
  const sampleModules = [
    {
      title: "Basic Seeding Techniques",
      description: "Learn proper seeding procedures for various crops",
      category: "operations",
      content: "Comprehensive guide to seeding techniques...",
      duration: 45,
      createdBy: createdUsers[2].id,
      requiredForRole: "technician"
    },
    {
      title: "Safety Protocols",
      description: "Essential safety procedures for farm operations",
      category: "safety",
      content: "Safety guidelines and protocols...",
      duration: 30,
      createdBy: createdUsers[2].id,
      requiredForRole: "technician"
    },
    {
      title: "Quality Control Standards",
      description: "Maintaining high quality standards in production",
      category: "quality",
      content: "Quality control procedures...",
      duration: 60,
      createdBy: createdUsers[2].id,
      requiredForRole: "manager"
    }
  ];

  const createdModules = await db.insert(trainingModules).values(sampleModules).returning();
  console.log(`Created ${createdModules.length} training modules`);

  console.log("Database seeding completed successfully!");
}

// Run the seed function
seedDatabase().catch(console.error);