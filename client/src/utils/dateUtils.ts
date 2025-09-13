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
  
  // Normalize frequency string to handle "bi-weekly" vs "biweekly" inconsistencies
  const freq = (task.frequency || task.comment || '').toLowerCase().replace(/[^a-z]/g, '');
  
  // DEBUG: Log frequency processing for Replace Fan task
  if (task.title?.includes('Replace Fan')) {
    console.log(`[dateUtils] DEBUG Replace Fan: frequency="${task.frequency}" → normalized="${freq}" | visibleFromDate="${task.visibleFromDate}" | dueDate="${task.dueDate}"`);
  }
  
  // Determine date range for the task
  const start = formatDateForComparison(task.visibleFromDate || task.taskDate || task.dueDate);
  const end = formatDateForComparison(task.dueDate || task.taskDate || task.visibleFromDate);
  
  // For bi-weekly and period tasks, use inclusive range filtering  
  if ((start && end && start !== end) || freq === 'biweekly') {
    const isVisible = targetDate >= start && targetDate <= end;
    console.log(`[dateUtils] 🔍 PERIOD TASK: "${task.title}" | Freq: ${freq} | Range: ${start} → ${end} | Check: ${targetDate} | Match: ${isVisible ? 'YES ✅' : 'NO ❌'}`);
    return isVisible;
  }
  
  // FALLBACK: For biweekly tasks missing visibleFromDate, calculate 14-day range
  if (freq === 'biweekly' && start === end) {
    const endDate = new Date(end);
    endDate.setUTCDate(endDate.getUTCDate() - 13); // Go back 13 days to create 14-day range
    const calculatedStart = formatDateForComparison(endDate);
    const isVisible = targetDate >= calculatedStart && targetDate <= end;
    console.log(`[dateUtils] 🔍 PERIOD TASK (fallback): "${task.title}" | Freq: ${freq} | Calculated Range: ${calculatedStart} → ${end} | Check: ${targetDate} | Match: ${isVisible ? 'YES ✅' : 'NO ❌'}`);
    return isVisible;
  }
  
  // For single-day tasks, check exact date match
  const taskDate = start || end;
  if (taskDate) {
    const matches = isSameDay(taskDate, targetDate);
    console.log(`[dateUtils] 🗓️ SINGLE DAY: "${task.title}" | TaskDate: ${taskDate} | ViewDate: ${targetDate} | Match: ${matches ? 'YES ✅' : 'NO ❌'}`);
    return matches;
  }
  
  console.log(`🔍 Task "${task.title}" has no valid dates - NO MATCH`);
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