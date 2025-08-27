import { Task } from '@shared/schema';

interface CurrentUser {
  id: number | null;
  email: string;
  fullName: string;
  rolesAssigned: string[];
}

/**
 * Centralized function to check if a task is assigned to the current user
 */
export const isTaskAssignedToUser = (task: Task | any, currentUser: CurrentUser | null): boolean => {
  if (!currentUser || !currentUser.id) {
    console.log('No current user or user ID:', currentUser);
    return false;
  }
  
  // Check both assignTo (new) and assignedTo (legacy) fields
  const assignment = task.assignTo || task.assignedTo;
  if (!assignment) {
    return false;
  }
  
  // Convert user ID to string for comparison
  const userIdStr = String(currentUser.id);
  
  // Debug logging for problematic tasks
  if (task.id === 1347) {
    console.log('🔍 Assignment Debug:', {
      taskId: task.id,
      assignment: assignment,
      userIdStr: userIdStr,
      userRoles: currentUser.rolesAssigned,
      assignmentType: typeof assignment
    });
  }
  
  // Direct user assignment
  if (assignment === `user_${userIdStr}`) {
    console.log('✅ Direct user assignment match');
    return true;
  }
  
  // All staff assignment
  if (assignment === 'all_staff') {
    console.log('✅ All staff assignment match');
    return true;
  }
  
  // Role-based assignment
  if (typeof assignment === 'string' && assignment.startsWith('role_')) {
    const roleName = assignment.replace('role_', '');
    const hasRole = currentUser.rolesAssigned?.includes(roleName) || false;
    if (task.id === 1347) {
      console.log(`🎯 Role check: "${roleName}" in [${currentUser.rolesAssigned?.join(', ')}] = ${hasRole}`);
    }
    return hasRole;
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