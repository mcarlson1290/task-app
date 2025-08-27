// @ts-nocheck
export function isMyTask(task, currentUser) {
  if (!task) return false;
  if (!currentUser) return false;
  if (!task.assignTo && !task.assignedTo) return false;
  
  // Check both assignTo (new) and assignedTo (legacy) fields
  const assignment = task.assignTo || task.assignedTo;
  
  // Check if task is assigned to me directly
  if (assignment === `user_${currentUser.id}`) {
    return true;
  }
  
  // Check if task is assigned to all staff
  if (assignment === 'all_staff') {
    return true;
  }
  
  // Check if task is assigned to my role
  if (assignment && assignment.startsWith('role_')) {
    const taskRole = assignment.replace('role_', '');
    if (currentUser.rolesAssigned && currentUser.rolesAssigned.includes(taskRole)) {
      return true;
    }
  }
  
  return false;
}