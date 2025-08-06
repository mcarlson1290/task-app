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

const API_BASE = '/api';

// Get all staff members from API
export const getAllStaff = async (): Promise<StaffMember[]> => {
  try {
    const response = await fetch(`${API_BASE}/staff`);
    if (!response.ok) {
      throw new Error('Failed to fetch staff data');
    }
    const staff = await response.json();
    return staff;
  } catch (error) {
    console.error('Error loading staff data:', error);
    return [];
  }
};

// Save staff member to API
const saveStaffToAPI = async (staffMember: StaffMember): Promise<StaffMember> => {
  try {
    // Always use POST for new staff members (let backend handle ID creation)
    // For updates, find existing by email since Microsoft ID may not match backend ID
    const url = `${API_BASE}/staff`;
    const method = 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffMember)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`Failed to save staff member: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving staff member:', error);
    throw error;
  }
};

// Get staff member by email
export const getStaffByEmail = async (email: string): Promise<StaffMember | undefined> => {
  const staff = await getAllStaff();
  return staff.find(member => member.email === email);
};

// Get staff member by Microsoft ID
export const getStaffByMicrosoftId = async (microsoftId: string): Promise<StaffMember | undefined> => {
  const staff = await getAllStaff();
  return staff.find(member => member.microsoftId === microsoftId);
};

// Create new staff member from Microsoft login
export const createStaffFromMicrosoftLogin = async (
  microsoftId: string,
  name: string,
  email: string
): Promise<StaffMember> => {
  // Check if already exists by email (more reliable than checking staff array)
  const existing = await getStaffByEmail(email);
  if (existing) {
    console.log('Found existing staff member:', existing.fullName, existing.email);
    // Update last active and return existing
    existing.lastActive = new Date().toISOString();
    return existing; // Don't call update to avoid API call loops
  }

  // Determine role based on email
  let defaultRoles = ['General Staff'];
  let defaultLocation = 'K'; // Default to Kenosha
  
  // Corporate managers
  if (email === 'robert@growspace.farm' || email === 'matt@growspace.farm' || email === 'matt.carlson@growspace.farm') {
    defaultRoles = ['Corporate Manager'];
  }

  const newStaff: StaffMember = {
    id: '', // Will be set by the backend when user is created
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
    activeStatus: 'Active',
    lastTaskCompleted: null,
    managerNotes: 'Auto-created from Microsoft login',
    tasksCompleted: 0,
    avgTaskDuration: '0m',
    onTimeRate: 100,
    microsoftId: microsoftId,
    lastActive: new Date().toISOString()
  };

  // Add to staff list
  const savedMember = await saveStaffToAPI(newStaff);
  
  console.log('Created new staff member:', savedMember.fullName, savedMember.email);
  return savedMember;
};

// Update existing staff member
export const updateStaffMember = async (updatedStaff: StaffMember): Promise<void> => {
  await saveStaffToAPI(updatedStaff);
};

// Update last active time for staff member
export const updateLastActive = async (microsoftId: string): Promise<void> => {
  const member = await getStaffByMicrosoftId(microsoftId);
  
  if (member) {
    member.lastActive = new Date().toISOString();
    await updateStaffMember(member);
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

// Clear all staff data (for testing/reset purposes) - Now handled by API
export const clearAllStaffData = async (): Promise<void> => {
  console.log('Staff data clearing is now handled by the backend API');
  // This would require a backend endpoint to clear all staff data
};

// Add new staff member manually
export const addStaffMember = async (staffData: Omit<StaffMember, 'id'>): Promise<StaffMember> => {
  const newStaff: StaffMember = {
    ...staffData,
    id: Date.now().toString(), // Generate simple ID for manual entries
  };
  
  return await saveStaffToAPI(newStaff);
};

// Delete staff member
export const deleteStaffMember = async (staffId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/staff/${staffId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete staff member');
    }
  } catch (error) {
    console.error('Error deleting staff member:', error);
    throw error;
  }
};

// Initialize expected staff members who should have access
export const initializeExpectedStaff = async (): Promise<void> => {
  console.log('Checking for expected staff members...');
  
  // Define expected team members
  const expectedStaff = [
    {
      microsoftId: 'jane-expected',
      name: 'Jane Smith',
      email: 'jane@growspace.farm'
    },
    {
      microsoftId: 'matt-expected', 
      name: 'Matt Johnson',
      email: 'matt@growspace.farm'
    }
  ];

  // Create staff entries for expected members who haven't logged in yet
  for (const member of expectedStaff) {
    const existing = await getStaffByEmail(member.email);
    if (!existing) {
      console.log(`Creating expected staff member: ${member.name} (${member.email})`);
      await createStaffFromMicrosoftLogin(member.microsoftId, member.name, member.email);
    } else {
      console.log(`Expected staff member already exists: ${member.name}`);
    }
  }
};