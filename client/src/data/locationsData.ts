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
    createdDate: new Date('2023-01-01')
  },
  {
    id: 'racine-dev',
    name: 'Racine (Dev)',
    code: 'R',
    address: '456 Test Street, Racine, WI',
    isActive: true,
    createdDate: new Date('2024-01-01')
  }
];

// Update user mock data with location assignments
export const mockUsers = [
  {
    id: 1,
    name: 'Alex Martinez',
    email: 'alex@farm.com',
    role: 'staff',
    assignedLocation: 'kenosha',
    permissions: ['view_tasks', 'complete_tasks']
  },
  {
    id: 2,
    name: 'Dan Wilson',
    email: 'dan@farm.com',
    role: 'manager',
    assignedLocation: 'kenosha',
    permissions: ['view_tasks', 'complete_tasks', 'manage_staff', 'view_analytics']
  },
  {
    id: 3,
    name: 'Matt Carlson',
    email: 'matt@farm.com',
    role: 'corporate',
    assignedLocation: null, // Corporate can access all locations
    permissions: ['all']
  }
];