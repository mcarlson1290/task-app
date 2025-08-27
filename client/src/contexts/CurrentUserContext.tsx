import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredAuth } from '@/lib/auth';

interface CurrentUser {
  id: number | null;
  email: string;
  fullName: string;
  rolesAssigned: string[];
}

interface CurrentUserContextType {
  currentUser: CurrentUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const CurrentUserContext = createContext<CurrentUserContextType | null>(null);

export const useCurrentUser = () => {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error('useCurrentUser must be used within CurrentUserProvider');
  }
  return context;
};

export const CurrentUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadCurrentUser();
  }, []);
  
  const loadCurrentUser = async () => {
    try {
      setLoading(true);
      
      // Get the logged-in user from the auth system
      const auth = getStoredAuth();
      if (!auth?.user?.email) {
        console.warn('No authenticated user found');
        setCurrentUser(null);
        return;
      }
      
      const userEmail = auth.user.email;
      
      // Now find this user in staff data
      const staffResponse = await fetch('/api/staff');
      if (!staffResponse.ok) {
        throw new Error('Failed to fetch staff data');
      }
      
      const staffData = await staffResponse.json();
      
      // Find staff member by email (case-insensitive)
      const staffMember = staffData.find((s: any) => 
        (s.businessEmail || s.email)?.toLowerCase() === userEmail?.toLowerCase()
      );
      
      if (staffMember) {
        setCurrentUser({
          id: parseInt(staffMember.id),
          email: staffMember.businessEmail || staffMember.email || userEmail,
          fullName: staffMember.fullName,
          rolesAssigned: staffMember.rolesAssigned || []
        });
        
        console.log('Current user loaded from staff:', {
          id: staffMember.id,
          email: staffMember.email,
          fullName: staffMember.fullName,
          rolesAssigned: staffMember.rolesAssigned
        });
      } else {
        console.warn('Current user not found in staff data:', userEmail);
        // Create a basic user object for testing
        setCurrentUser({
          id: null,
          email: userEmail,
          fullName: auth.user.name || userEmail,
          rolesAssigned: []
        });
      }
    } catch (error) {
      console.error('Error loading current user:', error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <CurrentUserContext.Provider value={{ currentUser, loading, refresh: loadCurrentUser }}>
      {children}
    </CurrentUserContext.Provider>
  );
};