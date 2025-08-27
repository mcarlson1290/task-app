import { Task } from '@shared/schema';

interface CurrentUser {
  id: number | string;
  email: string;
  fullName: string;
  rolesAssigned: string[];
}

/**
 * Centralized function to check if a task is assigned to the current user
 */
export const isTaskAssignedToUser = (task: Task | any, currentUser: CurrentUser | null): boolean => {
  if (!currentUser) {
    return false;
  }
  
  // Check both assignTo (new) and assignedTo (legacy) fields
  const assignment = task.assignTo || task.assignedTo;
  if (!assignment) {
    return false;
  }
  
  // Convert user ID to string for comparison
  const userIdStr = String(currentUser.id);
  
  // Direct user assignment
  if (assignment === `user_${userIdStr}`) {
    return true;
  }
  
  // All staff assignment
  if (assignment === 'all_staff') {
    return true;
  }
  
  // Role-based assignment
  if (typeof assignment === 'string' && assignment.startsWith('role_')) {
    const roleName = assignment.replace('role_', '');
    return currentUser.rolesAssigned?.includes(roleName) || false;
  }
  
  return false;
};

/**
 * Get human-readable assignment text for display
 */
export const getAssignmentDisplay = (assignTo: string | number | null | undefined): string => {
  if (!assignTo) return 'Unassigned';
  
  const assignment = String(assignTo);
  
  if (assignment === 'all_staff') return 'All Staff';
  if (assignment.startsWith('role_')) {
    return assignment.replace('role_', '').replace(/([A-Z])/g, ' $1').trim();
  }
  if (assignment.startsWith('user_')) {
    return 'Specific User';
  }
  
  return assignment;
};