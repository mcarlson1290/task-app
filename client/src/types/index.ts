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

export type TaskType = 'seeding' | 'moving' | 'harvesting' | 'packing' | 'cleaning' | 'inventory';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'approved';
export type UserRole = 'technician' | 'manager' | 'corporate';
