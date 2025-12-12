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
 * FIXED: Tasks now show ONLY on their exact due date (no more date ranges)
 */
export const shouldTaskAppearOnDate = (task: any, targetDate: string): boolean => {
  if (!task || !targetDate) return false;
  
  // ALL TASKS: Show only on exact due date
  const dueDate = formatDateForComparison(task.dueDate);
  
  if (dueDate) {
    const matches = targetDate === dueDate;
    if (!matches) {
      // Only log mismatches for debugging
      // console.log(`[dateUtils] ❌ "${task.title}" | DueDate: ${dueDate} ≠ ViewDate: ${targetDate}`);
    }
    return matches;
  }
  
  // Fallback: Use taskDate if no dueDate (shouldn't happen with new tasks)
  const taskDate = formatDateForComparison(task.taskDate);
  if (taskDate) {
    const matches = targetDate === taskDate;
    console.log(`[dateUtils] 📅 FALLBACK - "${task.title}" | TaskDate: ${taskDate} | ViewDate: ${targetDate} | Match: ${matches ? 'YES ✅' : 'NO ❌'}`);
    return matches;
  }
  
  console.log(`🔍 Task "${task.title}" has no valid dates - NO MATCH`);
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

/**
 * Check if a task is overdue
 * A task is overdue if its due date is before today and it's not completed/skipped
 */
export const isTaskOverdue = (task: { dueDate?: string | Date | null; status?: string }): boolean => {
  // Completed or skipped tasks are never overdue
  if (!task.dueDate || task.status === 'completed' || task.status === 'approved' || task.status === 'skipped') {
    return false;
  }
  
  // Check dev overdue protection mode
  if (typeof window !== 'undefined' && localStorage.getItem('devOverdueProtection') === 'true') {
    return false;
  }
  
  // Get current date at midnight (start of day) in local time
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Parse due date - use UTC to avoid timezone issues
  const dueDateStr = formatDateForComparison(task.dueDate);
  if (!dueDateStr) return false;
  
  const [year, month, day] = dueDateStr.split('-').map(Number);
  const dueDate = new Date(year, month - 1, day);
  
  // Task is overdue if due date is before today
  return dueDate < today;
};

/**
 * Calculate how many days a task is overdue
 * Returns 0 if not overdue
 */
export const getDaysOverdue = (task: { dueDate?: string | Date | null; status?: string }): number => {
  if (!isTaskOverdue(task)) return 0;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const dueDateStr = formatDateForComparison(task.dueDate);
  if (!dueDateStr) return 0;
  
  const [year, month, day] = dueDateStr.split('-').map(Number);
  const dueDate = new Date(year, month - 1, day);
  
  const diffTime = today.getTime() - dueDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Get overdue severity level for visual styling
 * Returns: 'critical' (7+ days), 'warning' (3-6 days), 'mild' (1-2 days), or null
 */
export const getOverdueSeverity = (task: { dueDate?: string | Date | null; status?: string }): 'critical' | 'warning' | 'mild' | null => {
  const daysOverdue = getDaysOverdue(task);
  
  if (daysOverdue >= 7) return 'critical';
  if (daysOverdue >= 3) return 'warning';
  if (daysOverdue >= 1) return 'mild';
  return null;
};

/**
 * Get a human-readable due date display with relative and absolute dates
 * Examples: "Overdue by 3 days (Dec 9)", "Due today (Dec 12)", "Due tomorrow (Dec 13)"
 */
export const getDueDateDisplay = (task: { dueDate?: string | Date | null; status?: string }): string => {
  if (!task.dueDate) return 'No due date';
  
  const dueDateStr = formatDateForComparison(task.dueDate);
  if (!dueDateStr) return 'Invalid date';
  
  const [year, month, day] = dueDateStr.split('-').map(Number);
  const dueDate = new Date(year, month - 1, day);
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Format the actual date (e.g., "Dec 12")
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateStr = `${months[month - 1]} ${day}`;
  
  // For completed/skipped tasks, just show the date
  if (task.status === 'completed' || task.status === 'approved' || task.status === 'skipped') {
    return `Due ${dateStr}`;
  }
  
  // Return both relative and absolute date
  if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays);
    if (daysOverdue === 1) {
      return `Overdue by 1 day (${dateStr})`;
    }
    return `Overdue by ${daysOverdue} days (${dateStr})`;
  } else if (diffDays === 0) {
    return `Due today (${dateStr})`;
  } else if (diffDays === 1) {
    return `Due tomorrow (${dateStr})`;
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days (${dateStr})`;
  } else {
    return `Due ${dateStr}`;
  }
};

/**
 * Check if a completed task was completed late (after end of due date)
 */
export const wasCompletedLate = (task: { dueDate?: string | Date | null; status?: string; completedAt?: string | Date | null }): boolean => {
  if (task.status !== 'completed' || !task.dueDate || !task.completedAt) {
    return false;
  }
  
  try {
    const dueDateStr = formatDateForComparison(task.dueDate);
    if (!dueDateStr) return false;
    
    const [year, month, day] = dueDateStr.split('-').map(Number);
    // End of due date is 11:59:59 PM
    const dueDateTime = new Date(year, month - 1, day, 23, 59, 59, 999);
    
    const completedDate = new Date(task.completedAt as string);
    
    // Check if dates are valid
    if (isNaN(dueDateTime.getTime()) || isNaN(completedDate.getTime())) return false;
    
    return completedDate > dueDateTime;
  } catch (error) {
    return false;
  }
};