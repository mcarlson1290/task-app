// Staff Management Service - Dynamic staff generation from Microsoft logins
export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  rolesAssigned: string[];
  dateHired: string;
  payRate: number;
  trainingCompleted: string[];
  trainingInProgress: string[];
  preferredHours: string;
  activeStatus: 'active' | 'inactive' | 'on-leave';
  lastTaskCompleted: string | null;
  managerNotes: string;
  tasksCompleted: number;
  avgTaskDuration: string;
  onTimeRate: number;
  microsoftId: string;
  lastActive: string;
}

const STAFF_STORAGE_KEY = 'growspace_staff_data';

// Initialize staff data storage
const initializeStaffStorage = (): StaffMember[] => {
  const stored = localStorage.getItem(STAFF_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing staff data:', error);
    }
  }
  return [];
};

// Save staff data to storage
const saveStaffData = (staff: StaffMember[]): void => {
  localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staff));
};

// Get all staff members
export const getAllStaff = (): StaffMember[] => {
  return initializeStaffStorage();
};

// Get staff member by email
export const getStaffByEmail = (email: string): StaffMember | undefined => {
  const staff = getAllStaff();
  return staff.find(member => member.email === email);
};

// Get staff member by Microsoft ID
export const getStaffByMicrosoftId = (microsoftId: string): StaffMember | undefined => {
  const staff = getAllStaff();
  return staff.find(member => member.microsoftId === microsoftId);
};

// Create new staff member from Microsoft login
export const createStaffFromMicrosoftLogin = (
  microsoftId: string,
  name: string,
  email: string
): StaffMember => {
  const staff = getAllStaff();
  
  // Check if already exists
  const existing = getStaffByEmail(email) || getStaffByMicrosoftId(microsoftId);
  if (existing) {
    // Update last active and return existing
    existing.lastActive = new Date().toISOString();
    updateStaffMember(existing);
    return existing;
  }

  // Determine role based on email
  let defaultRoles = ['General Staff'];
  let defaultLocation = 'K'; // Default to Kenosha
  
  // Corporate managers
  if (email === 'robert@growspace.farm' || email === 'matt@growspace.farm' || email === 'matt.carlson@growspace.farm') {
    defaultRoles = ['Corporate Manager'];
  }

  const newStaff: StaffMember = {
    id: microsoftId,
    fullName: name,
    email: email,
    phone: '', // To be filled by manager
    location: defaultLocation,
    rolesAssigned: defaultRoles,
    dateHired: new Date().toISOString().split('T')[0],
    payRate: 0, // To be set by manager
    trainingCompleted: [],
    trainingInProgress: [],
    preferredHours: 'Flexible',
    activeStatus: 'active',
    lastTaskCompleted: null,
    managerNotes: 'Auto-created from Microsoft login',
    tasksCompleted: 0,
    avgTaskDuration: '0m',
    onTimeRate: 100,
    microsoftId: microsoftId,
    lastActive: new Date().toISOString()
  };

  // Add to staff list
  staff.push(newStaff);
  saveStaffData(staff);
  
  console.log('Created new staff member:', newStaff.fullName, newStaff.email);
  return newStaff;
};

// Update existing staff member
export const updateStaffMember = (updatedStaff: StaffMember): void => {
  const staff = getAllStaff();
  const index = staff.findIndex(member => member.id === updatedStaff.id);
  
  if (index !== -1) {
    staff[index] = updatedStaff;
    saveStaffData(staff);
  }
};

// Update last active time for staff member
export const updateLastActive = (microsoftId: string): void => {
  const staff = getAllStaff();
  const member = staff.find(s => s.microsoftId === microsoftId);
  
  if (member) {
    member.lastActive = new Date().toISOString();
    updateStaffMember(member);
  }
};

// Get available role options based on current user's role
export const getAvailableRoles = (currentUserRole: string): string[] => {
  const baseRoles = [
    'General Staff',
    'Seeding Tech',
    'Harvest Tech',
    'Packing',
    'Cleaning Crew',
    'Equipment Tech'
  ];
  
  if (currentUserRole === 'Manager' || currentUserRole === 'Corporate') {
    baseRoles.push('Manager');
  }
  
  if (currentUserRole === 'Corporate') {
    baseRoles.push('Corporate Manager');
  }
  
  return baseRoles;
};

// Check if user can assign a specific role
export const canAssignRole = (currentUserRole: string, roleToAssign: string): boolean => {
  // Corporate can assign any role
  if (currentUserRole === 'Corporate') return true;
  
  // Managers can assign all except Corporate Manager
  if (currentUserRole === 'Manager' && roleToAssign !== 'Corporate Manager') return true;
  
  // Staff can't assign roles
  return false;
};

// Clear all staff data (for testing/reset purposes)
export const clearAllStaffData = (): void => {
  localStorage.removeItem(STAFF_STORAGE_KEY);
  console.log('All staff data cleared');
};

// Add new staff member manually
export const addStaffMember = (staffData: Omit<StaffMember, 'id'>): StaffMember => {
  const staff = getAllStaff();
  const newStaff: StaffMember = {
    ...staffData,
    id: Date.now().toString(), // Generate simple ID for manual entries
  };
  
  staff.push(newStaff);
  saveStaffData(staff);
  return newStaff;
};

// Delete staff member
export const deleteStaffMember = (staffId: string): void => {
  const staff = getAllStaff();
  const filteredStaff = staff.filter(member => member.id !== staffId);
  saveStaffData(filteredStaff);
};