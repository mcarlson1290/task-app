// Script to fix missing assignments on daily tasks
import fs from 'fs';

// Load the data
const data = JSON.parse(fs.readFileSync('./data/storage.json', 'utf8'));

console.log('Fixing task assignments...');

let updatedCount = 0;

// Create a map of recurring task ID to assignTo value
const recurringAssignments = new Map();
data.recurringTasks?.forEach(rt => {
  if (rt.assignTo && rt.assignTo !== 'no-assignment') {
    recurringAssignments.set(rt.id, rt.assignTo);
  }
});

console.log(`Found ${recurringAssignments.size} recurring tasks with assignments`);

// Update daily tasks that have no assignTo but have a recurringTaskId
data.tasks?.forEach(task => {
  if (task.recurringTaskId && !task.assignTo && recurringAssignments.has(task.recurringTaskId)) {
    const assignment = recurringAssignments.get(task.recurringTaskId);
    task.assignTo = assignment;
    updatedCount++;
    console.log(`Updated task "${task.title}" with assignment: ${assignment}`);
  }
});

console.log(`Updated ${updatedCount} tasks with proper assignments`);

// Save the updated data
fs.writeFileSync('./data/storage.json', JSON.stringify(data, null, 2));
console.log('Assignments fixed and saved!');