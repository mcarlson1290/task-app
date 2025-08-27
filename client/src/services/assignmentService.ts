import { AssignmentOptions, getSuggestedRoles } from '@/data/roleTaskMapping';
import { apiRequest } from '@/lib/queryClient';

// Get dynamic assignment options
export const getAssignmentOptions = async (currentUser: any, taskType: string): Promise<AssignmentOptions> => {
  try {
    // Fetch all staff
    const staff = await apiRequest('GET', '/api/staff');
    
    // Filter active staff only
    const activeStaff = staff.filter((s: any) => s.activeStatus === 'active');
    
    // Get suggested roles for this task type
    const suggestedRoles = getSuggestedRoles(taskType);
    
    // Build roles list with staff counts
    const rolesWithStaff: { [key: string]: any[] } = {};
    activeStaff.forEach((member: any) => {
      member.rolesAssigned.forEach((role: string) => {
        if (!rolesWithStaff[role]) {
          rolesWithStaff[role] = [];
        }
        rolesWithStaff[role].push(member);
      });
    });
    
    // Sort roles: suggested first, then alphabetical
    const sortedRoles = Object.keys(rolesWithStaff).sort((a, b) => {
      const aIsSuggested = suggestedRoles.includes(a);
      const bIsSuggested = suggestedRoles.includes(b);
      
      if (aIsSuggested && !bIsSuggested) return -1;
      if (!aIsSuggested && bIsSuggested) return 1;
      return a.localeCompare(b);
    });
    
    // Build final assignment options
    const assignmentOptions: AssignmentOptions = {
      roles: [],
      users: [],
      special: []
    };
    
    // Add "All Staff" option
    assignmentOptions.special.push({
      value: 'all_staff',
      label: `👥 All Staff (${activeStaff.length} people)`,
      type: 'special',
      staffCount: activeStaff.length
    });
    
    // Add roles with staff counts
    sortedRoles.forEach(role => {
      const staffInRole = rolesWithStaff[role];
      assignmentOptions.roles.push({
        value: `role_${role}`,
        label: `👤 ${role} (${staffInRole.length} ${staffInRole.length === 1 ? 'person' : 'people'})`,
        type: 'role',
        staffCount: staffInRole.length,
        staffIds: staffInRole.map(s => s.id),
        isSuggested: suggestedRoles.includes(role)
      });
    });
    
    // Add individual users (sorted by name)
    const sortedStaff = [...activeStaff].sort((a, b) => 
      a.fullName.localeCompare(b.fullName)
    );
    
    sortedStaff.forEach((member: any) => {
      const isCurrentUser = member.id === currentUser?.id;
      assignmentOptions.users.push({
        value: `user_${member.id}`,
        label: `${member.fullName}${isCurrentUser ? ' (You)' : ''}${member.rolesAssigned.length > 0 ? ` - ${member.rolesAssigned.join(', ')}` : ''}`,
        type: 'user',
        userId: member.id,
        roles: member.rolesAssigned,
        isCurrentUser
      });
    });
    
    return assignmentOptions;
    
  } catch (error) {
    console.error('Error fetching assignment options:', error);
    return { roles: [], users: [], special: [] };
  }
};

// Check if a task is assigned to a specific user
export const isTaskAssignedToUser = (task: any, user: any, allStaff: any[]): boolean => {
  if (!user) return false;
  
  // Direct user assignment
  if (task.assignTo === `user_${user.id}`) return true;
  
  // All staff assignment
  if (task.assignTo === 'all_staff') return true;
  
  // Role assignment - check if user has the role
  if (task.assignTo?.startsWith('role_')) {
    const roleName = task.assignTo.replace('role_', '');
    const userStaff = allStaff.find(s => s.id === user.id);
    return userStaff?.rolesAssigned?.includes(roleName) || false;
  }
  
  return false;
};

// Get display text for task assignment
export const getAssignmentDisplayText = (task: any, allStaff: any[]): string => {
  if (!task.assignTo) return 'Unassigned';
  
  if (task.assignTo.startsWith('user_')) {
    const userId = task.assignTo.replace('user_', '');
    const assignedUser = allStaff.find(s => s.id === userId);
    return assignedUser?.fullName || 'Unknown User';
  }
  
  if (task.assignTo.startsWith('role_')) {
    const roleName = task.assignTo.replace('role_', '');
    return `👤 ${roleName}`;
  }
  
  if (task.assignTo === 'all_staff') {
    return '👥 All Staff';
  }
  
  return 'Unassigned';
};

// Get staff IDs for a task assignment
export const getAssignedStaffIds = (task: any, allStaff: any[]): string[] => {
  if (!task.assignTo) return [];
  
  if (task.assignTo.startsWith('user_')) {
    return [task.assignTo.replace('user_', '')];
  }
  
  if (task.assignTo === 'all_staff') {
    return allStaff.filter(s => s.activeStatus === 'active').map(s => s.id);
  }
  
  if (task.assignTo.startsWith('role_')) {
    const roleName = task.assignTo.replace('role_', '');
    return allStaff
      .filter(s => s.activeStatus === 'active' && s.rolesAssigned?.includes(roleName))
      .map(s => s.id);
  }
  
  return [];
};