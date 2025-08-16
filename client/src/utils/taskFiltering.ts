// Clean, simple task filtering system
// No complex date conversions, no timezone hacks, no duplicate prevention

export interface TaskFilters {
  selectedDate?: string;
  selectedCategory?: string;
  selectedStatus?: string;
  selectedPriority?: string;
  searchTerm?: string;
}

export interface FilterableTask {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  status: string;
  type: string;
  priority?: string;
  visibleFromDate?: string;
  visibleToDate?: string;
  taskType?: 'regular' | 'monthly' | 'bi-weekly-first' | 'bi-weekly-second';
  isOverdue?: boolean;
}

// Main filter function - clean and simple
export const filterTasks = (tasks: FilterableTask[], filters: TaskFilters): FilterableTask[] => {
  const {
    selectedDate,
    selectedCategory,
    selectedStatus,
    selectedPriority,
    searchTerm
  } = filters;

  return tasks.filter(task => {
    // Step 1: Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(searchLower);
      const descMatch = task.description?.toLowerCase().includes(searchLower);
      if (!titleMatch && !descMatch) return false;
    }

    // Step 2: Date filtering
    if (selectedDate) {
      const passesDateFilter = checkDateFilter(task, selectedDate);
      if (!passesDateFilter) return false;
    }

    // Step 3: Category filtering
    if (selectedCategory && selectedCategory !== 'all') {
      if (task.type !== selectedCategory) return false;
    }

    // Step 4: Status filtering
    if (selectedStatus && selectedStatus !== 'all') {
      if (selectedStatus === 'overdue') {
        if (!task.isOverdue) return false;
      } else if (task.status !== selectedStatus) {
        return false;
      }
    }

    // Step 5: Priority filtering
    if (selectedPriority && selectedPriority !== 'all') {
      if (task.priority !== selectedPriority) return false;
    }

    // Task passes all filters
    return true;
  });
};

// Date filter logic - CLEAN AND SIMPLE
const checkDateFilter = (task: FilterableTask, selectedDate: string): boolean => {
  // Get today's date for comparison
  const today = new Date().toISOString().split('T')[0];
  const isViewingToday = selectedDate === today;

  // Rule 1: If viewing today, show overdue tasks
  if (isViewingToday && task.isOverdue) {
    return true;
  }

  // Rule 2: Check if selected date is within task's visible range
  if (task.visibleFromDate && task.visibleToDate) {
    return selectedDate >= task.visibleFromDate && 
           selectedDate <= task.visibleToDate;
  }

  // Rule 3: For regular tasks, check due date
  if (task.dueDate) {
    // Convert task due date to YYYY-MM-DD format
    const taskDateStr = task.dueDate.includes('T') 
      ? task.dueDate.split('T')[0] 
      : task.dueDate;
    return taskDateStr === selectedDate;
  }

  return false;
};

// Helper function to get today's date in YYYY-MM-DD format
export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Helper function to check if a task is overdue
export const isTaskOverdue = (task: FilterableTask): boolean => {
  if (!task.dueDate || task.status === 'completed' || task.status === 'approved') {
    return false;
  }

  const today = new Date().toISOString().split('T')[0];
  const taskDateStr = task.dueDate.includes('T') 
    ? task.dueDate.split('T')[0] 
    : task.dueDate;

  return taskDateStr < today;
};

// Debug function for testing
export const debugFiltering = (tasks: FilterableTask[], filters: TaskFilters): void => {
  console.log('=== CLEAN FILTER SYSTEM TEST ===');
  
  const filtered = filterTasks(tasks, filters);
  
  console.log(`Total tasks: ${tasks.length}`);
  console.log(`Applied filters:`, filters);
  console.log(`Filtered tasks: ${filtered.length}`);
  
  if (filters.selectedDate) {
    console.log(`\nTasks for ${filters.selectedDate}:`);
    filtered.forEach(task => {
      console.log(`- ${task.title}`);
      console.log(`  Due: ${task.dueDate}`);
      console.log(`  Status: ${task.status}`);
      if (task.visibleFromDate && task.visibleToDate) {
        console.log(`  Visible: ${task.visibleFromDate} to ${task.visibleToDate}`);
      }
    });
  }
};