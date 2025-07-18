import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, Filter, BarChart3, Users, Clock, CheckCircle, AlertTriangle, SkipForward } from "lucide-react";

interface TaskFilters {
  dateRange: string;
  startDate: string | null;
  endDate: string | null;
  location: string;
  role: string;
  taskType: string;
  status: string;
  priority: string;
  assignedUser: string;
  recurringTaskSource: string;
  checklistCompletionRate: string;
  approvalStatus: string;
  hasProcessLink: string;
}

interface TaskDataProps {
  id: number;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  assignedTo: number;
  createdBy: number;
  location?: string;
  estimatedTime: number;
  actualTime: number | null;
  progress: number;
  checklist: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
  startedAt: string | null;
  completedAt: string | null;
  dueDate: string;
  createdAt: string;
  data: any;
  isOverdue?: boolean;
  skippedAt?: string | null;
  skipReason?: string | null;
  pausedAt?: string | null;
  resumedAt?: string | null;
}

const TaskDataFilters: React.FC<{
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  tasks: TaskDataProps[];
}> = ({ filters, setFilters, tasks }) => {
  const uniqueUsers = [...new Set(tasks.map(t => t.assignedTo))].filter(Boolean);
  const uniqueTaskTypes = [...new Set(tasks.map(t => t.type))].filter(Boolean);

  const updateFilter = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    setFilters({
      dateRange: 'last7days',
      startDate: null,
      endDate: null,
      location: 'all',
      role: 'all',
      taskType: 'all',
      status: 'all',
      priority: 'all',
      assignedUser: 'all',
      recurringTaskSource: 'all',
      checklistCompletionRate: 'all',
      approvalStatus: 'all',
      hasProcessLink: 'all'
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Task Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Task Type</label>
            <Select value={filters.taskType} onValueChange={(value) => updateFilter('taskType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="seeding-microgreens">Seeding - Microgreens</SelectItem>
                <SelectItem value="seeding-leafy">Seeding - Leafy Greens</SelectItem>
                <SelectItem value="harvest-microgreens">Harvest - Microgreens</SelectItem>
                <SelectItem value="harvest-leafy">Harvest - Leafy Greens</SelectItem>
                <SelectItem value="blackout-tasks">Blackout Tasks</SelectItem>
                <SelectItem value="moving">Moving</SelectItem>
                <SelectItem value="packing">Packing</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="maintenance">Equipment Maintenance</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Checklist Completion */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Checklist Completion</label>
            <Select value={filters.checklistCompletionRate} onValueChange={(value) => updateFilter('checklistCompletionRate', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="under80">Under 80%</SelectItem>
                <SelectItem value="80to100">80-99%</SelectItem>
                <SelectItem value="100">100%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Date Range */}
        {filters.dateRange === 'custom' && (
          <div className="mt-4 flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => updateFilter('startDate', e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => updateFilter('endDate', e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        )}

        <div className="mt-6">
          <Button variant="outline" onClick={clearAllFilters}>
            Clear All Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const MetricsCards: React.FC<{ tasks: TaskDataProps[] }> = ({ tasks }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = tasks.filter(t => t.isOverdue).length;
  const skippedTasks = tasks.filter(t => t.status === 'skipped').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const avgCompletionTime = tasks
    .filter(t => t.actualTime)
    .reduce((acc, t) => acc + (t.actualTime || 0), 0) / completedTasks || 0;

  const avgChecklistCompletion = tasks
    .filter(t => t.checklist && t.checklist.length > 0)
    .reduce((acc, t) => {
      const completed = t.checklist.filter(item => item.completed).length;
      return acc + (completed / t.checklist.length) * 100;
    }, 0) / tasks.filter(t => t.checklist && t.checklist.length > 0).length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTasks}</div>
          <p className="text-xs text-muted-foreground">
            {inProgressTasks} in progress
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}%</div>
          <p className="text-xs text-muted-foreground">
            {completedTasks} of {totalTasks} completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(avgCompletionTime)}m</div>
          <p className="text-xs text-muted-foreground">
            Average time to complete
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Issues</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{overdueTasks + skippedTasks}</div>
          <p className="text-xs text-muted-foreground">
            {overdueTasks} overdue, {skippedTasks} skipped
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const TaskDataTable: React.FC<{ tasks: TaskDataProps[] }> = ({ tasks }) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      skipped: { label: 'Skipped', className: 'bg-gray-100 text-gray-800' },
      paused: { label: 'Paused', className: 'bg-orange-100 text-orange-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { label: 'High', className: 'bg-red-100 text-red-800' },
      medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
      low: { label: 'Low', className: 'bg-green-100 text-green-800' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-2 text-left">Task</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Type</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Priority</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Assigned To</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Progress</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Time</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2">
                    <div>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-gray-600">{task.description}</div>
                    </div>
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    <Badge variant="outline">{task.type}</Badge>
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {getStatusBadge(task.status)}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {getPriorityBadge(task.priority)}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    User {task.assignedTo}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm">{task.progress}%</span>
                    </div>
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    <div className="text-sm">
                      <div>Est: {task.estimatedTime}m</div>
                      {task.actualTime && <div>Act: {task.actualTime}m</div>}
                    </div>
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    <div className="text-sm">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export const TaskOverview: React.FC = () => {
  const [filters, setFilters] = useState<TaskFilters>({
    dateRange: 'last7days',
    startDate: null,
    endDate: null,
    location: 'all',
    role: 'all',
    taskType: 'all',
    status: 'all',
    priority: 'all',
    assignedUser: 'all',
    recurringTaskSource: 'all',
    checklistCompletionRate: 'all',
    approvalStatus: 'all',
    hasProcessLink: 'all'
  });

  const { data: tasks = [], isLoading } = useQuery<TaskDataProps[]>({
    queryKey: ["/api/tasks"],
    enabled: true,
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Apply filters
      if (filters.taskType !== 'all' && task.type !== filters.taskType) return false;
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      if (filters.assignedUser !== 'all' && task.assignedTo.toString() !== filters.assignedUser) return false;
      
      // Date range filtering
      const taskDate = new Date(task.createdAt);
      const now = new Date();
      
      if (filters.dateRange === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (taskDate < today || taskDate >= tomorrow) return false;
      } else if (filters.dateRange === 'last7days') {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (taskDate < sevenDaysAgo) return false;
      } else if (filters.dateRange === 'last30days') {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (taskDate < thirtyDaysAgo) return false;
      } else if (filters.dateRange === 'custom') {
        if (filters.startDate && new Date(filters.startDate) > taskDate) return false;
        if (filters.endDate && new Date(filters.endDate) < taskDate) return false;
      }
      
      // Checklist completion filtering
      if (filters.checklistCompletionRate !== 'all' && task.checklist && task.checklist.length > 0) {
        const completionRate = (task.checklist.filter(item => item.completed).length / task.checklist.length) * 100;
        if (filters.checklistCompletionRate === 'under80' && completionRate >= 80) return false;
        if (filters.checklistCompletionRate === '80to100' && (completionRate < 80 || completionRate >= 100)) return false;
        if (filters.checklistCompletionRate === '100' && completionRate < 100) return false;
      }
      
      return true;
    });
  }, [tasks, filters]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TaskDataFilters
        filters={filters}
        setFilters={setFilters}
        tasks={tasks}
      />
      
      <MetricsCards tasks={filteredTasks} />
      
      <TaskDataTable tasks={filteredTasks} />
    </div>
  );
};