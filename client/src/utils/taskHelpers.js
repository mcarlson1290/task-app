// @ts-nocheck
export function isMyTask(task, currentUser) {
  if (!task) {
    console.log('❌ No task provided');
    return false;
  }
  if (!currentUser) {
    console.log('❌ No current user provided');
    return false;
  }
  
  // Check assignTo (current) and assignedTo (legacy) fields
  const assignment = task.assignTo || task.assignedTo;
  
  if (!assignment) {
    console.log('❌ No assignment for task:', task.title);
    return false;
  }
  
  console.log('🔍 Assignment Debug:', {
    taskId: task.id,
    taskTitle: task.title,
    assignment: assignment,
    userIdStr: currentUser.id?.toString(),
    userRoles: currentUser.rolesAssigned,
    assignmentType: typeof assignment
  });
  
  // Check if task is assigned to me directly
  if (assignment === `user_${currentUser.id}`) {
    console.log('✅ Direct user match:', assignment);
    return true;
  }
  
  // Check if task is assigned to all staff
  if (assignment === 'all_staff') {
    console.log('✅ All staff assignment');
    return true;
  }
  
  // Check if task is assigned to my role
  if (assignment && assignment.startsWith('role_')) {
    const taskRole = assignment.replace('role_', '');
    if (currentUser.rolesAssigned && currentUser.rolesAssigned.includes(taskRole)) {
      console.log('✅ Role match:', `"${taskRole}" for task:`, task.title);
      console.log('🎯 ASSIGNED TASK FOUND - SHOULD HAVE GREEN BORDER:', {
        taskId: task.id,
        taskTitle: task.title,
        assignedTo: assignment,
        isAssigned: true,
        cssClass: 'assigned-to-me'
      });
      return true;
    } else {
      console.log('❌ Role mismatch:', `"${taskRole}" not in roles:`, currentUser.rolesAssigned);
    }
  }
  
  console.log('❌ No match found for task:', task.title);
  return false;
}