import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';

export const LocationSelector: React.FC = () => {
  const { 
    currentLocation, 
    availableLocations, 
    switchLocation, 
    canSwitchLocations,
    viewMode,
    setViewMode,
    isViewingAllLocations 
  } = useLocation();
  
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  
  if (!canSwitchLocations) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg">
        <MapPin className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">{currentLocation.name}</span>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowLocationMenu(!showLocationMenu)}
        className="flex items-center space-x-2 min-w-40 bg-white border-gray-300 hover:bg-gray-50"
      >
        <MapPin className="h-4 w-4 text-green-600" />
        <span className="flex-1 text-left text-gray-700">
          {isViewingAllLocations ? 'All Locations' : currentLocation.name}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </Button>
      
      {showLocationMenu && (
        <Card className="absolute top-full mt-2 right-0 w-80 z-50 shadow-lg border border-gray-200">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-semibold text-sm text-gray-900">Select Location</h4>
            </div>
            
            {/* View Mode Toggle for Corporate */}
            <div className="p-4 border-b bg-gray-50">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="viewMode"
                    value="single"
                    checked={viewMode === 'single'}
                    onChange={() => setViewMode('single')}
                    className="text-green-600"
                  />
                  <span className="text-sm">Single Location</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="viewMode"
                    value="all"
                    checked={viewMode === 'all'}
                    onChange={() => {
                      setViewMode('all');
                      setShowLocationMenu(false);
                    }}
                    className="text-green-600"
                  />
                  <span className="text-sm">All Locations</span>
                </label>
              </div>
            </div>
            
            {viewMode === 'single' && (
              <div className="max-h-64 overflow-y-auto">
                {availableLocations.map(location => (
                  <button
                    key={location.id}
                    className={`w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between ${
                      currentLocation.id === location.id ? 'bg-green-50' : ''
                    }`}
                    onClick={() => {
                      switchLocation(location.id);
                      setShowLocationMenu(false);
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{location.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {location.code}
                        </Badge>
                      </div>
                      {location.address && (
                        <p className="text-xs text-gray-500 mt-1">{location.address}</p>
                      )}
                    </div>
                    {currentLocation.id === location.id && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};