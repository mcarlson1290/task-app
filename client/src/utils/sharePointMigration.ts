import { apiRequest } from '@/lib/queryClient';

// Available Categories from the task system
const TASK_CATEGORIES = [
  'Seeding - Microgreens',
  'Seeding - Leafy Greens', 
  'Harvest - Microgreens',
  'Harvest - Leafy Greens',
  'Blackout Tasks',
  'Moving',
  'Cleaning',
  'Equipment Maintenance',
  'Inventory',
  'Other'
];

// Parse frequency from the Week Day field
const parseFrequencyFromWeekDay = (weekDayField: string) => {
  if (!weekDayField) return { frequency: 'daily' };
  
  const lower = weekDayField.toLowerCase();
  
  // Check for bi-weekly (combine a and b per your instruction)
  if (lower.includes('bi-weekly') || lower.includes('biweekly') || 
      lower === 'a' || lower === 'b') {
    return { 
      frequency: 'biweekly',
      weekPeriod: 'first'
    };
  }
  
  // Check for monthly
  if (lower.includes('month') || /\d+/.test(weekDayField)) {
    const dayMatch = weekDayField.match(/\d+/);
    return {
      frequency: 'monthly',
      dayOfMonth: dayMatch ? parseInt(dayMatch[0]) : 1
    };
  }
  
  // Check for daily
  if (lower.includes('daily') || lower.includes('every day')) {
    return { frequency: 'daily' };
  }
  
  // Parse weekly with specific days
  const days: string[] = [];
  const dayMap: {[key: string]: string[]} = {
    'monday': ['mon', 'monday'],
    'tuesday': ['tue', 'tues', 'tuesday'],
    'wednesday': ['wed', 'wednesday'],
    'thursday': ['thu', 'thur', 'thursday'],
    'friday': ['fri', 'friday'],
    'saturday': ['sat', 'saturday'],
    'sunday': ['sun', 'sunday']
  };
  
  Object.entries(dayMap).forEach(([fullDay, patterns]) => {
    patterns.forEach(pattern => {
      if (lower.includes(pattern)) {
        days.push(fullDay);
      }
    });
  });
  
  if (days.length > 0) {
    return {
      frequency: 'weekly',
      daysOfWeek: days
    };
  }
  
  // Default to daily if can't parse
  return { frequency: 'daily' };
};

// Map old priority values
const mapPriority = (oldPriority: string) => {
  if (!oldPriority) return 'medium';
  
  const priorityMap: {[key: string]: string} = {
    'high priority': 'high',
    'medium priority': 'medium',
    'low priority': 'low',
    'high': 'high',
    'medium': 'medium',
    'low': 'low',
    'normal': 'medium',
    '1': 'high',
    '2': 'medium',
    '3': 'low'
  };
  
  return priorityMap[oldPriority.toLowerCase()] || 'medium';
};

// Determine category based on title/description
const determineCategory = (title: string, description: string) => {
  const text = `${title} ${description}`.toLowerCase();
  
  // Check each category in order of specificity
  if (text.includes('seed') && text.includes('microgreen')) {
    return 'Seeding - Microgreens';
  } else if (text.includes('seed') && (text.includes('leafy') || text.includes('lettuce'))) {
    return 'Seeding - Leafy Greens';
  } else if (text.includes('harvest') && text.includes('microgreen')) {
    return 'Harvest - Microgreens';
  } else if (text.includes('harvest') && (text.includes('leafy') || text.includes('lettuce'))) {
    return 'Harvest - Leafy Greens';
  } else if (text.includes('blackout') || text.includes('black out')) {
    return 'Blackout Tasks';
  } else if (text.includes('mov') || text.includes('transfer') || text.includes('rotate')) {
    return 'Moving';
  } else if (text.includes('clean') || text.includes('sanitize') || text.includes('wash')) {
    return 'Cleaning';
  } else if (text.includes('equipment') || text.includes('maintenance') || text.includes('repair')) {
    return 'Equipment Maintenance';
  } else if (text.includes('inventory') || text.includes('count') || text.includes('stock')) {
    return 'Inventory';
  } else {
    return 'Other';
  }
};

// Map to appropriate role based on assigned to and task title
const mapToRole = (assignedTo: string, taskTitle: string) => {
  if (!assignedTo) return 'General Staff';
  
  const assigned = assignedTo.toLowerCase();
  const title = taskTitle.toLowerCase();
  
  // Try to infer role from assignment and task
  if (title.includes('seed') || assigned.includes('seed')) {
    return 'Microgreen Seeder';
  } else if (title.includes('harvest') || assigned.includes('harvest')) {
    return 'Harvester';
  } else if (title.includes('deliver') || assigned.includes('deliver')) {
    return 'Delivery Driver';
  } else if (assigned.includes('manager') || assigned.includes('lead')) {
    return 'Manager';
  } else if (assigned.includes('all') || assigned.includes('everyone')) {
    return 'General Staff';
  } else {
    // Default to general staff
    return 'General Staff';
  }
};

// Parse CSV data using JavaScript built-in parsing
const parseCSV = (csvText: string) => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    
    const values = lines[i].split(',');
    const row: {[key: string]: string} = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].replace(/"/g, '').trim() : '';
    });
    
    data.push(row);
  }
  
  return data;
};

export const migrateSharePointTasks = async (csvText: string) => {
  const oldTasks = parseCSV(csvText);
  const newTasks: any[] = [];
  const migrationReport = {
    successful: 0,
    failed: 0,
    warnings: [] as string[],
    errors: [] as {task: string, error: string}[],
    rolesMapped: new Set<string>(),
    categoriesUsed: new Set<string>()
  };
  
  // Transform each task
  oldTasks.forEach((oldTask, index) => {
    try {
      // Skip disabled tasks
      if (oldTask['Week Day'] && oldTask['Week Day'].toLowerCase().includes('disabled')) {
        return;
      }
      
      // Parse frequency from Week Day field
      const frequencyData = parseFrequencyFromWeekDay(oldTask['Week Day']);
      
      const newTask = {
        title: oldTask.Title || 'Untitled Task',
        description: oldTask.Description || oldTask.QuickInfo || '',
        priority: mapPriority(oldTask.Priority),
        
        // Frequency from Week Day field
        frequency: frequencyData.frequency,
        
        // Category - determine from title/description
        category: determineCategory(oldTask.Title, oldTask.Description),
        
        // Map to ROLE not user
        assignedRole: mapToRole(oldTask['Assigned To'], oldTask.Title),
        
        // Leave blank per instructions
        estimatedTime: null,
        requiresPhotoProof: false,
        
        // Process link becomes part of description
        processLink: oldTask.ProcessLink,
        
        // Microgreen specific data
        microgreensData: oldTask['Microgreen Weight'] ? {
          weight: oldTask['Microgreen Weight'],
          seedAmount: oldTask.QuickInfo
        } : null,
        
        // Status
        isActive: true,
        
        // Metadata for tracking
        oldTaskId: oldTask['Task ID'],
        oldUniqueId: oldTask.UniqueID,
        migratedFrom: 'SharePoint',
        migrationDate: new Date().toISOString(),
        instances: oldTask.Instances
      };
      
      // Add frequency-specific fields
      if (frequencyData.frequency === 'weekly' && (frequencyData as any).daysOfWeek) {
        (newTask as any).daysOfWeek = (frequencyData as any).daysOfWeek;
      } else if (frequencyData.frequency === 'monthly' && (frequencyData as any).dayOfMonth) {
        (newTask as any).dayOfMonth = (frequencyData as any).dayOfMonth;
      } else if (frequencyData.frequency === 'biweekly' && (frequencyData as any).weekPeriod) {
        (newTask as any).weekPeriod = (frequencyData as any).weekPeriod;
      }
      
      // Track what we're mapping
      if (newTask.assignedRole) {
        migrationReport.rolesMapped.add(newTask.assignedRole);
      }
      migrationReport.categoriesUsed.add(newTask.category);
      
      // Add checklist warning if needed
      if (oldTask['Has A SP Checklist Been Created'] === 'True') {
        (newTask as any).hasSharePointChecklist = true;
        migrationReport.warnings.push(
          `"${oldTask.Title}" has SharePoint checklist - needs manual checklist creation`
        );
      }
      
      newTasks.push(newTask);
      migrationReport.successful++;
      
    } catch (error: any) {
      migrationReport.errors.push({
        task: oldTask.Title || `Row ${index + 1}`,
        error: error.message
      });
      migrationReport.failed++;
    }
  });
  
  return { newTasks, migrationReport };
};

export const importRecurringTasks = async (tasks: any[]) => {
  const results = [];
  for (const task of tasks) {
    try {
      const result = await apiRequest('POST', '/api/recurring-tasks', task);
      results.push(result);
    } catch (error: any) {
      console.error('Failed to import task:', task.title, error);
      throw error;
    }
  }
  return results;
};