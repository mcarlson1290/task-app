import { useLocation } from '../contexts/LocationContext';
import { useEffect, useState } from 'react';

export function useLocationData<T>(
  fetchSingleLocation: (locationId: string) => Promise<T>,
  fetchAllLocations?: () => Promise<T>,
  dependencies: any[] = []
) {
  const { currentLocation, isViewingAllLocations } = useLocation();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let result: T;
        
        if (isViewingAllLocations && fetchAllLocations) {
          result = await fetchAllLocations();
        } else {
          result = await fetchSingleLocation(currentLocation.id);
        }
        
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentLocation.id, isViewingAllLocations, ...dependencies]);
  
  return { data, loading, error };
}

// Helper hook for filtering data by location
export function useLocationFilter<T extends { location?: string }>(
  data: T[] | null,
  defaultLocation?: string
) {
  const { currentLocation, isViewingAllLocations } = useLocation();
  
  if (!data) return [];
  
  if (isViewingAllLocations) {
    return data;
  }
  
  // Filter by current location or default location
  const targetLocation = defaultLocation || currentLocation.code;
  return data.filter(item => 
    item.location === targetLocation || 
    (item.location === undefined && targetLocation === 'K') // Default to Kenosha
  );
}