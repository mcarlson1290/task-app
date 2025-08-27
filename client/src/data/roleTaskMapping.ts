// Maps roles to their typical task types
export const roleTaskTypeMapping = {
  'Seeding Tech': [
    'Seeding - Microgreens',
    'Seeding - Leafy Greens'
  ],
  'Harvest Team': [
    'Harvest - Microgreens', 
    'Harvest - Leafy Greens'
  ],
  'Cleaning Crew': [
    'Cleaning'
  ],
  'Equipment Tech': [
    'Equipment Maintenance'
  ],
  'Packing': [
    'Packing'
  ],
  'Manager': [
    // Managers can handle all task types
    'All'
  ],
  'General Staff': [
    'Moving',
    'Inventory',
    'Blackout Tasks',
    'Other'
  ]
};

// Get suggested roles for a task type
export const getSuggestedRoles = (taskType: string): string[] => {
  const suggestedRoles: string[] = [];
  
  for (const [role, types] of Object.entries(roleTaskTypeMapping)) {
    if (types.includes(taskType) || types.includes('All')) {
      suggestedRoles.push(role);
    }
  }
  
  return suggestedRoles;
};

// Assignment option interface
export interface AssignmentOption {
  value: string;
  label: string;
  type: 'special' | 'role' | 'user';
  staffCount?: number;
  staffIds?: string[];
  userId?: string;
  roles?: string[];
  isSuggested?: boolean;
  isCurrentUser?: boolean;
}

export interface AssignmentOptions {
  roles: AssignmentOption[];
  users: AssignmentOption[];
  special: AssignmentOption[];
}