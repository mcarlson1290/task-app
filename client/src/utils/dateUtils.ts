// Date utility functions for consistent date handling across the app

/**
 * Compare two dates to see if they represent the same calendar day
 * Handles both string and Date objects, avoiding timezone issues
 */
export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  if (!date1 || !date2) return false;
  
  try {
    // Convert both dates to YYYY-MM-DD format for comparison
    const d1Str = formatDateForComparison(date1);
    const d2Str = formatDateForComparison(date2);
    
    return d1Str === d2Str;
  } catch (error) {
    console.error('Date comparison error:', error);
    return false;
  }
};

/**
 * Format a date as YYYY-MM-DD for consistent comparison
 * Handles timezone issues by using UTC methods for stored UTC dates
 */
export const formatDateForComparison = (date: Date | string): string => {
  if (!date) return '';
  
  try {
    if (typeof date === 'string') {
      // Handle ISO strings like "2025-08-01T00:00:00.000Z"
      if (date.includes('T')) {
        return date.split('T')[0]; // Extract "2025-08-01" part
      }
      // Handle date strings like "2025-08-01"
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
      }
      // Try to parse other string formats
      date = new Date(date);
    }
    
    if (date instanceof Date) {
      // Use UTC methods to avoid timezone conversion
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return '';
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

/**
 * Check if a task should appear on a specific date
 * Handles different task types and their visibility rules
 */
export const shouldTaskAppearOnDate = (task: any, targetDate: string): boolean => {
  if (!task || !targetDate) return false;
  
  // ALL tasks should appear based on their due date, regardless of status
  // This is the key fix - completed tasks should still show on their due date, not completion date
  if (task.dueDate) {
    const matches = isSameDay(task.dueDate, targetDate);
    console.log(`🔍 Task "${task.title}" due ${task.dueDate} vs filter ${targetDate} = ${matches ? 'MATCH' : 'NO MATCH'}`);
    return matches;
  }
  
  // Tasks without due dates appear on their creation date
  if (task.createdAt) {
    const matches = isSameDay(task.createdAt, targetDate);
    console.log(`🔍 Task "${task.title}" created ${task.createdAt} vs filter ${targetDate} = ${matches ? 'MATCH' : 'NO MATCH'}`);
    return matches;
  }
  
  console.log(`🔍 Task "${task.title}" has no due date or creation date - NO MATCH`);
  return false;
};

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
export const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Debug function to log date comparison details
 */
export const debugDateComparison = (taskDate: any, filterDate: any, taskTitle?: string): void => {
  const task = taskTitle ? `"${taskTitle}"` : 'Task';
  const taskFormatted = formatDateForComparison(taskDate);
  const filterFormatted = formatDateForComparison(filterDate);
  const matches = isSameDay(taskDate, filterDate);
  
  console.log(`📅 ${task}: ${taskDate} → ${taskFormatted} vs ${filterFormatted} = ${matches ? '✅' : '❌'}`);
};