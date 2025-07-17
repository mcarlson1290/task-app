export interface DashboardAnalytics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  totalUsers: number;
  totalInventoryItems: number;
  lowStockAlerts: number;
  totalTimeLogged: number;
  tasksByType: Record<string, number>;
  tasksByStatus: Record<string, number>;
}

export interface TaskFilters {
  status?: string;
  type?: string;
  assignedTo?: number;
}

export type TaskType = 'seeding-microgreens' | 'seeding-leafy-greens' | 'harvest-microgreens' | 'harvest-leafy-greens' | 'blackout-tasks' | 'moving' | 'packing' | 'cleaning' | 'inventory' | 'equipment-maintenance' | 'other';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'approved';
export type UserRole = 'technician' | 'manager' | 'corporate';
