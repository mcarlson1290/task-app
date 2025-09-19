import { getPrimaryRole } from '../data/roleTaskMapping';
import { StaffMember } from './staffService';

export interface AssignmentOption {
  value: string;
  label: string;
  type: 'role' | 'user' | 'special';
  staffCount?: number;
  staffIds?: string[];
  userId?: string;
  roles?: string[];
  isPrimary?: boolean;
  isCurrentUser?: boolean;
  hasPrimaryRole?: boolean;
}

export interface AssignmentOptions {
  roles: AssignmentOption[];
  users: AssignmentOption[];
  special: AssignmentOption[];
}

// Get dynamic assignment options based on task type and current staff
export const getAssignmentOptions = async (currentUser: any, taskType: string): Promise<AssignmentOptions> => {
  try {
    // Fetch all staff
    const response = await fetch('/api/staff');
    const staff: StaffMember[] = await response.json();
    
    // Filter active staff only (case insensitive check)
    const activeStaff = staff.filter(s => s.activeStatus?.toLowerCase() === 'active');
    
    // Get the primary role for this task type
    const primaryRole = getPrimaryRole(taskType);
    
    // Build roles list with staff counts
    const rolesWithStaff: Record<string, StaffMember[]> = {};
    activeStaff.forEach(member => {
      member.rolesAssigned.forEach(role => {
        if (!rolesWithStaff[role]) {
          rolesWithStaff[role] = [];
        }
        rolesWithStaff[role].push(member);
      });
    });
    
    // Build final assignment options
    const assignmentOptions: AssignmentOptions = {
      roles: [],
      users: [],
      special: []
    };
    
    // For "Other" tasks, add "All Staff" as the primary option
    if (taskType === 'Other') {
      assignmentOptions.special.push({
        value: 'all_staff',
        label: '👥 All Staff (Recommended)',
        type: 'special',
        staffCount: activeStaff.length,
        isPrimary: true
      });
    }
    
    // Add the primary role first if it has staff
    if (primaryRole && primaryRole !== 'All Staff' && rolesWithStaff[primaryRole]) {
      assignmentOptions.roles.push({
        value: `role_${primaryRole}`,
        label: `👤 ${primaryRole} (Recommended)`,
        type: 'role',
        staffCount: rolesWithStaff[primaryRole].length,
        staffIds: rolesWithStaff[primaryRole].map(s => s.id),
        isPrimary: true
      });
    }
    
    // Add Manager role if there are managers (they can do any task)
    if (rolesWithStaff['Manager']) {
      assignmentOptions.roles.push({
        value: 'role_Manager',
        label: '👤 Manager',
        type: 'role',
        staffCount: rolesWithStaff['Manager'].length,
        staffIds: rolesWithStaff['Manager'].map(s => s.id),
        isPrimary: false
      });
    }
    
    // Add all other roles (sorted alphabetically)
    const otherRoles = Object.keys(rolesWithStaff)
      .filter(role => 
        role !== primaryRole && 
        role !== 'Manager' &&
        rolesWithStaff[role].length > 0
      )
      .sort();
    
    otherRoles.forEach(role => {
      assignmentOptions.roles.push({
        value: `role_${role}`,
        label: `👤 ${role}`,
        type: 'role',
        staffCount: rolesWithStaff[role].length,
        staffIds: rolesWithStaff[role].map(s => s.id),
        isPrimary: false
      });
    });
    
    // Add individual users (sorted by name)
    const sortedStaff = [...activeStaff].sort((a, b) => 
      a.fullName.localeCompare(b.fullName)
    );
    
    sortedStaff.forEach(member => {
      // Check if this user has the primary role
      const hasPrimaryRole = member.rolesAssigned.includes(primaryRole);
      
      assignmentOptions.users.push({
        value: `user_${member.id}`,
        label: member.fullName,
        type: 'user',
        userId: member.id,
        roles: member.rolesAssigned,
        isCurrentUser: member.id === currentUser?.id?.toString(),
        hasPrimaryRole: hasPrimaryRole
      });
    });
    
    return assignmentOptions;
    
  } catch (error) {
    console.error('Error fetching assignment options:', error);
    return { roles: [], users: [], special: [] };
  }
};

// Check if a task is assigned to a specific user
export const isTaskAssignedToUser = (task: any, currentUser: any, staff: StaffMember[]): boolean => {
  if (!currentUser) return false;
  
  const userId = currentUser.id?.toString();
  
  // Check new assignTo field first
  if (task.assignTo) {
    // Direct user assignment
    if (task.assignTo === `user_${userId}`) return true;
    
    // All staff assignment
    if (task.assignTo === 'all_staff') return true;
    
    // Role assignment - check if user has the role
    if (task.assignTo.startsWith('role_')) {
      const roleName = task.assignTo.replace('role_', '');
      const currentStaff = staff.find(s => s.id === userId);
      return currentStaff?.rolesAssigned.includes(roleName) || false;
    }
  }
  
  // Fallback to legacy assignedTo field
  if (task.assignedTo && task.assignedTo.toString() === userId) {
    return true;
  }
  
  return false;
};

// Get assignment display text for a task
export const getAssignmentText = (task: any, staff: StaffMember[]): string => {
  // Debug logging - can be removed later
  if (task.assignTo || task.assignedTo) {
    console.log('getAssignmentText - Task:', task.id, 'assignTo:', task.assignTo, 'assignedTo:', task.assignedTo);
  }
  
  // Check new assignTo field first
  if (task.assignTo) {
    if (task.assignTo.startsWith('user_')) {
      const userId = task.assignTo.replace('user_', '');
      console.log('Looking for user ID:', userId, 'Staff IDs:', staff.map(s => ({ id: s.id, name: s.fullName })));
      
      // Try both string and number comparison since ID types might vary
      const assignedUser = staff.find(s => s.id === userId || s.id === parseInt(userId, 10).toString());
      console.log('Found user:', assignedUser?.fullName || 'NOT FOUND');
      return assignedUser?.fullName || `Unknown User (ID: ${userId})`;
    }
    
    if (task.assignTo.startsWith('role_')) {
      const roleName = task.assignTo.replace('role_', '');
      return roleName; // Remove emoji since it's already in the dropdown
    }
    
    if (task.assignTo === 'all_staff') {
      return 'All Staff'; // Remove emoji since it's already in the dropdown
    }
    
    // Handle malformed assignTo values
    console.log('Malformed assignTo value:', task.assignTo);
    return `Unknown Assignment: ${task.assignTo}`;
  }
  
  // Fallback to legacy assignedTo field
  if (task.assignedTo) {
    console.log('Using legacy assignedTo:', task.assignedTo, typeof task.assignedTo);
    
    // Handle legacy role assignments (e.g., "role_Blackout Specialist")
    if (typeof task.assignedTo === 'string' && task.assignedTo.startsWith('role_')) {
      const roleName = task.assignedTo.replace('role_', '');
      console.log('Legacy role assignment:', roleName);
      return roleName; // Remove emoji since it's already in the dropdown
    }
    
    // Handle legacy "all_staff" assignment
    if (task.assignedTo === 'all_staff') {
      console.log('Legacy all_staff assignment');
      return 'All Staff'; // Remove emoji since it's already in the dropdown
    }
    
    // Handle direct user ID assignment
    const assignedUser = staff.find(s => 
      s.id === task.assignedTo.toString() || 
      s.id === parseInt(task.assignedTo.toString(), 10).toString()
    );
    
    if (assignedUser) {
      const result = assignedUser.fullName;
      console.log('Legacy user assignment result:', result);
      return result;
    }
    
    // If it's a string that doesn't match a user, it might be a malformed assignment
    console.log('Unknown legacy assignment:', task.assignedTo);
    return `Unknown Assignment: ${task.assignedTo}`;
  }
  
  return 'Unassigned';
};

// Get staff members who should see a task based on assignment
export const getAssignedStaffIds = (task: any, staff: StaffMember[]): string[] => {
  const activeStaff = staff.filter(s => s.activeStatus?.toLowerCase() === 'active');
  
  // Check new assignTo field first
  if (task.assignTo) {
    if (task.assignTo.startsWith('user_')) {
      const userId = task.assignTo.replace('user_', '');
      return [userId];
    }
    
    if (task.assignTo.startsWith('role_')) {
      const roleName = task.assignTo.replace('role_', '');
      return activeStaff
        .filter(member => member.rolesAssigned.includes(roleName))
        .map(member => member.id);
    }
    
    if (task.assignTo === 'all_staff') {
      return activeStaff.map(member => member.id);
    }
  }
  
  // Fallback to legacy assignedTo field
  if (task.assignedTo) {
    return [task.assignedTo.toString()];
  }
  
  return [];
};