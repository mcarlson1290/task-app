import React from 'react';

// Data cleanup utilities for soft launch preparation

export const clearAllTestData = () => {
  const confirmClear = confirm(
    'This will clear ALL test data including tasks, inventory, courses, and staff records. ' +
    'This action cannot be undone. Are you sure you want to proceed?'
  );
  
  if (!confirmClear) return false;
  
  // Clear all localStorage data
  const keysToRemove = [
    'tasks',
    'taskHistory', 
    'completedTasks',
    'recurringTasks',
    'inventory',
    'inventoryItems',
    'courses',
    'courseProgress',
    'userCourses',
    'staffData',
    'hasVisitedBeta'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Clear all application state
  console.log('All test data cleared successfully');
  alert('All test data has been cleared. The page will now refresh to initialize clean state.');
  
  // Refresh to initialize clean state
  window.location.reload();
  
  return true;
};

export const initializeCleanState = () => {
  // Check if this is first run after cleanup
  const isCleanInstall = !localStorage.getItem('appInitialized');
  
  if (isCleanInstall) {
    // Set up clean initial state
    localStorage.setItem('appInitialized', 'true');
    
    // Initialize empty data structures
    const emptyData = JSON.stringify([]);
    localStorage.setItem('tasks', emptyData);
    localStorage.setItem('inventory', emptyData);
    localStorage.setItem('courses', emptyData);
    localStorage.setItem('recurringTasks', emptyData);
    
    console.log('Clean application state initialized');
  }
};

// Admin-only data reset component
export const AdminResetButton: React.FC<{ currentUser: any }> = ({ currentUser }) => {
  // Only show for Corporate users
  if (!currentUser || currentUser.role !== 'corporate') {
    return null;
  }
  
  const handleReset = () => {
    clearAllTestData();
  };
  
  return React.createElement(
    'button',
    {
      onClick: handleReset,
      className: "fixed bottom-4 right-4 opacity-30 hover:opacity-100 transition-opacity bg-red-600 text-white px-3 py-2 rounded text-xs",
      title: "Admin: Clear All Data"
    },
    'Reset Data'
  );
};