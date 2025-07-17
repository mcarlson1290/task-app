import React, { createContext, useContext, useState, useEffect } from 'react';
import { Location, locations } from '../data/locationsData';
import { getStoredAuth } from '../lib/auth';

interface LocationContextType {
  currentLocation: Location;
  availableLocations: Location[];
  switchLocation: (locationId: string) => void;
  viewMode: 'single' | 'all'; // For corporate managers
  setViewMode: (mode: 'single' | 'all') => void;
  canSwitchLocations: boolean;
  isViewingAllLocations: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = getStoredAuth();
  const isCorporate = auth.user?.role === 'corporate';
  
  // Get initial location
  const getInitialLocation = () => {
    if (isCorporate) {
      // Corporate users default to first location but can switch
      const saved = localStorage.getItem('selectedLocation');
      return locations.find(l => l.id === saved) || locations[0];
    } else {
      // Non-corporate users are locked to their assigned location
      // For now, default to Kenosha since our test users don't have assigned locations
      return locations.find(l => l.id === 'kenosha') || locations[0];
    }
  };
  
  const [currentLocation, setCurrentLocation] = useState<Location>(getInitialLocation());
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');
  
  const switchLocation = (locationId: string) => {
    if (!isCorporate) {
      console.warn('Non-corporate users cannot switch locations');
      return;
    }
    
    const newLocation = locations.find(l => l.id === locationId);
    if (newLocation) {
      setCurrentLocation(newLocation);
      localStorage.setItem('selectedLocation', locationId);
      setViewMode('single'); // Reset to single view when switching
    }
  };
  
  const handleViewModeChange = (mode: 'single' | 'all') => {
    if (!isCorporate) return;
    setViewMode(mode);
  };
  
  const contextValue: LocationContextType = {
    currentLocation,
    availableLocations: isCorporate ? locations : locations.filter(l => l.id === currentLocation.id),
    switchLocation,
    viewMode,
    setViewMode: handleViewModeChange,
    canSwitchLocations: isCorporate,
    isViewingAllLocations: isCorporate && viewMode === 'all'
  };
  
  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};