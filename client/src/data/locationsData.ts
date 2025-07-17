export interface Location {
  id: string;
  name: string;
  code: string; // Short code for IDs (K for Kenosha, R for Racine)
  address?: string;
  isActive: boolean;
  createdDate: Date;
  settings?: {
    timezone?: string;
    workingHours?: {
      start: string;
      end: string;
    };
  };
}

export const locations: Location[] = [
  {
    id: 'kenosha',
    name: 'Kenosha',
    code: 'K',
    address: '123 Farm Road, Kenosha, WI',
    isActive: true,
    createdDate: new Date('2023-01-01'),
    settings: {
      timezone: 'America/Chicago',
      workingHours: {
        start: '06:00',
        end: '18:00'
      }
    }
  },
  {
    id: 'racine-dev',
    name: 'Racine (Dev)',
    code: 'R',
    address: '456 Test Street, Racine, WI',
    isActive: true,
    createdDate: new Date('2024-01-01'),
    settings: {
      timezone: 'America/Chicago',
      workingHours: {
        start: '07:00',
        end: '17:00'
      }
    }
  }
];

// Enhanced user interface with location assignment
export interface LocationUser {
  id: string;
  name: string;
  email: string;
  role: 'Staff' | 'Manager' | 'Corporate';
  assignedLocation: string | null; // null for corporate users
  permissions: string[];
  isActive: boolean;
  createdDate: Date;
}

export const mockUsers: LocationUser[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@farm.com',
    role: 'Staff',
    assignedLocation: 'kenosha',
    permissions: ['view_tasks', 'complete_tasks'],
    isActive: true,
    createdDate: new Date('2023-01-01')
  },
  {
    id: '2',
    name: 'Dan Smith',
    email: 'dan@farm.com',
    role: 'Manager',
    assignedLocation: 'kenosha',
    permissions: ['view_tasks', 'complete_tasks', 'manage_staff', 'view_analytics'],
    isActive: true,
    createdDate: new Date('2023-01-01')
  },
  {
    id: '3',
    name: 'Matt Wilson',
    email: 'matt@farm.com',
    role: 'Corporate',
    assignedLocation: null, // Corporate can access all
    permissions: ['all'],
    isActive: true,
    createdDate: new Date('2023-01-01')
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@farm.com',
    role: 'Staff',
    assignedLocation: 'racine-dev',
    permissions: ['view_tasks', 'complete_tasks'],
    isActive: true,
    createdDate: new Date('2024-01-01')
  },
  {
    id: '5',
    name: 'Mike Rodriguez',
    email: 'mike@farm.com',
    role: 'Manager',
    assignedLocation: 'racine-dev',
    permissions: ['view_tasks', 'complete_tasks', 'manage_staff', 'view_analytics'],
    isActive: true,
    createdDate: new Date('2024-01-01')
  }
];

// Helper functions
export const getLocationByCode = (code: string): Location | undefined => {
  return locations.find(location => location.code === code);
};

export const getLocationById = (id: string): Location | undefined => {
  return locations.find(location => location.id === id);
};

export const getUsersByLocation = (locationId: string): LocationUser[] => {
  return mockUsers.filter(user => user.assignedLocation === locationId);
};

export const getActiveLocations = (): Location[] => {
  return locations.filter(location => location.isActive);
};