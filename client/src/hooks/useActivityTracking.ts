import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

// Helper function to update user activity
export const updateUserActivity = async (userId: string) => {
  try {
    await apiRequest('POST', `/api/users/${userId}/activity`);
  } catch (error) {
    console.error('Failed to update user activity:', error);
  }
};

// Format the Last Active display
export const formatLastActive = (lastActive: string | null) => {
  if (!lastActive) return 'Never';
  
  const date = new Date(lastActive);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  // For older dates, show the actual date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

// Activity tracking hook
export const useActivityTracking = (userId: string | null) => {
  useEffect(() => {
    if (!userId) return;
    
    // Update immediately on mount
    updateUserActivity(userId);
    
    // Update every 5 minutes
    const interval = setInterval(() => {
      updateUserActivity(userId);
    }, 5 * 60 * 1000);
    
    // Update on user interaction
    const handleUserActivity = () => {
      updateUserActivity(userId);
    };
    
    // Listen for clicks or key presses
    document.addEventListener('click', handleUserActivity);
    document.addEventListener('keypress', handleUserActivity);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('click', handleUserActivity);
      document.removeEventListener('keypress', handleUserActivity);
    };
  }, [userId]);
};