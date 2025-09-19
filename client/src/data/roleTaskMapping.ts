// Direct mapping of task types to their corresponding roles
export const taskTypeToRoleMapping: Record<string, string> = {
  'Seeding - Microgreens': 'Microgreens Seeder',
  'Seeding - Leafy Greens': 'Leafy Greens Seeder',
  'Harvest - Microgreens': 'Microgreens Harvester',
  'Harvest - Leafy Greens': 'Leafy Greens Harvester',
  'Blackout Tasks': 'Blackout Specialist',
  'Moving': 'Moving Tech',
  'Packing': 'Packing Tech',
  'Cleaning': 'Cleaning Crew',
  'Inventory': 'Inventory Tech',
  'Equipment Maintenance': 'Equipment Tech',
  'Other': 'All Staff' // Special case - assigns to everyone
};

// Get the primary role for a task type
export const getPrimaryRole = (taskType: string): string => {
  return taskTypeToRoleMapping[taskType] || 'General Staff';
};

// Get all available roles from the mapping
export const getAllRoles = (): string[] => {
  const roles = Array.from(new Set(Object.values(taskTypeToRoleMapping)));
  // Add Manager role which can do everything
  roles.push('Manager');
  // Remove 'All Staff' as it's not a real role
  return roles.filter(role => role !== 'All Staff').sort();
};

// Check if a role can handle a task type
export const canRoleHandleTaskType = (role: string, taskType: string): boolean => {
  // Managers can handle all task types
  if (role === 'Manager') return true;
  
  // Direct role match
  const primaryRole = getPrimaryRole(taskType);
  if (role === primaryRole) return true;
  
  // 'Other' tasks can be done by anyone
  if (taskType === 'Other') return true;
  
  return false;
};

// Map legacy task types to new role-based types
export const taskTypeMapping: Record<string, string> = {
  'seeding-microgreens': 'Seeding - Microgreens',
  'seeding-leafy-greens': 'Seeding - Leafy Greens',
  'harvest-microgreens': 'Harvest - Microgreens',
  'harvest-leafy-greens': 'Harvest - Leafy Greens',
  'blackout-tasks': 'Blackout Tasks',
  'moving': 'Moving',
  'packing': 'Packing',
  'cleaning': 'Cleaning',
  'inventory': 'Inventory',
  'equipment-maintenance': 'Equipment Maintenance',
  'other': 'Other'
};

// Convert legacy task type to new format
export const convertTaskType = (legacyType: string): string => {
  return taskTypeMapping[legacyType] || legacyType;
};

// Get task type options for forms
export const getTaskTypeOptions = () => {
  return Object.keys(taskTypeToRoleMapping).map(taskType => ({
    value: taskType,
    label: taskType,
    primaryRole: getPrimaryRole(taskType)
  }));
};