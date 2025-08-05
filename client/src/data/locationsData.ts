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
// Production launch - mock users removed, using dynamic Microsoft authentication