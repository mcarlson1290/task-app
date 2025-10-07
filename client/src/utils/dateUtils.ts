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
 * FIXED: Recurring tasks show on their taskDate, not dueDate
 */
export const shouldTaskAppearOnDate = (task: any, targetDate: string): boolean => {
  if (!task || !targetDate) return false;
  
  // RECURRING TASKS: Use taskDate (the day they should appear)
  // For weekly tasks, taskDate is the specific day (e.g., Monday) and dueDate is 6 days later
  const taskDate = formatDateForComparison(task.taskDate);
  
  if (taskDate) {
    const matches = targetDate === taskDate;
    return matches;
  }
  
  // Fallback: Use dueDate if no taskDate (for one-time tasks)
  const dueDate = formatDateForComparison(task.dueDate);
  if (dueDate) {
    const matches = targetDate === dueDate;
    return matches;
  }
  
  return false;
};

/**
 * Get today's date in YYYY-MM-DD format (UTC timezone)
 * TIMEZONE FIX: Now uses UTC to match database storage and server-side task generation
 */
export const getTodayString = (): string => {
  const today = new Date();
  // Use UTC methods to match database storage timezone
  const year = today.getUTCFullYear();
  const month = String(today.getUTCMonth() + 1).padStart(2, '0');
  const day = String(today.getUTCDate()).padStart(2, '0');
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