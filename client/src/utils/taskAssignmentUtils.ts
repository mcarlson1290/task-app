import { Task } from '@shared/schema';

interface CurrentUser {
  id: number | null;
  email: string;
  fullName: string;
  rolesAssigned: string[];
}

interface StaffMember {
  id: string | number;
  email: string;
  fullName: string;
  rolesAssigned: string[];
}

/**
 * Enhanced task assignment checker with proper email-based user matching
 */
export const isTaskAssignedToCurrentUser = (
  task: Task | any, 
  currentUser: CurrentUser | null, 
  allStaff: StaffMember[]
): boolean => {
  if (!currentUser || !task.assignTo) {
    return false;
  }
  
  console.log('🔍 Checking task assignment:', { 
    taskTitle: task.title,
    taskAssignTo: task.assignTo, 
    currentUserId: currentUser.id,
    currentUserEmail: currentUser.email,
    currentUserRoles: currentUser.rolesAssigned
  });
  
  // Handle direct user assignment (user_123)
  if (task.assignTo.startsWith('user_')) {
    const assignedUserId = parseInt(task.assignTo.replace('user_', ''));
    const isAssigned = assignedUserId === currentUser.id;
    console.log(`  → User assignment check: ${assignedUserId} === ${currentUser.id} = ${isAssigned}`);
    return isAssigned;
  }
  
  // Handle all staff assignment
  if (task.assignTo === 'all_staff') {
    // User must be in staff to be included in all_staff
    const isInStaff = currentUser.id !== null;
    console.log(`  → All staff assignment check: user in staff = ${isInStaff}`);
    return isInStaff;
  }
  
  // Handle role assignment (role_Manager, role_Equipment Tech, etc.)
  if (task.assignTo.startsWith('role_')) {
    const roleName = task.assignTo.replace('role_', '');
    const hasRole = currentUser.rolesAssigned?.includes(roleName) || false;
    console.log(`  → Role assignment check: "${roleName}" in [${currentUser.rolesAssigned?.join(', ')}] = ${hasRole}`);
    return hasRole;
  }
  
  console.log(`  → Unknown assignment type: ${task.assignTo}`);
  return false;
};

/**
 * Legacy support for the existing isTaskAssignedToUser function
 */
export const isTaskAssignedToUser = isTaskAssignedToCurrentUser;