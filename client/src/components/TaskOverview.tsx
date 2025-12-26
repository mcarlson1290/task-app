import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, Filter, BarChart3, Users, Clock, CheckCircle, AlertTriangle, SkipForward } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

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

// Helper function to format dates without timezone issues
const formatDueDate = (dateInput: string | Date): string => {
  if (!dateInput) return '';
  
  let dateString: string;
  
  // Handle both Date objects and strings
  if (dateInput instanceof Date) {
    // Convert Date to YYYY-MM-DD format without timezone issues
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const day = String(dateInput.getDate()).padStart(2, '0');
    dateString = `${year}-${month}-${day}`;
  } else {
    // Handle ISO string format by extracting date part
    dateString = dateInput.split('T')[0];
  }
  
  // Parse the date string without timezone conversion
  const [year, month, day] = dateString.split('-');
  
  // Create month names array
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Return formatted date (e.g., "Jan 18, 2025")
  return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
};

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
                      {formatDueDate(task.dueDate)}
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
  const { currentLocation, isViewingAllLocations } = useLocation();
  const [dateRange, setDateRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('completion');
  
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
    queryKey: ["/api/tasks", { location: currentLocation.code }],
    queryFn: async () => {
      const response = await fetch(`/api/tasks?location=${currentLocation.code}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
    enabled: true,
  });

  // Calculate comprehensive analytics from task data
  const analyticsData = useMemo(() => {
    // Map full location names to codes for backwards compatibility
    const locationNameToCode: { [key: string]: string } = { 'Kenosha': 'K', 'kenosha': 'K' };
    const locationFilteredTasks = isViewingAllLocations 
      ? tasks 
      : tasks.filter(task => {
          const taskCode = locationNameToCode[task.location] || task.location;
          return taskCode === currentLocation.code;
        });
    
    const totalTasks = locationFilteredTasks.length;
    const completedTasks = locationFilteredTasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = locationFilteredTasks.filter(task => task.status === 'in_progress').length;
    const pendingTasks = locationFilteredTasks.filter(task => task.status === 'pending').length;
    const skippedTasks = locationFilteredTasks.filter(task => task.status === 'skipped').length;
    const pausedTasks = locationFilteredTasks.filter(task => task.status === 'paused').length;
    
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const avgCompletionTime = completedTasks > 0 
      ? locationFilteredTasks.filter(task => task.actualTime).reduce((sum, task) => sum + (task.actualTime || 0), 0) / completedTasks
      : 0;
    
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todaysTasks = locationFilteredTasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return taskDate >= today && taskDate < tomorrow;
    });
    
    const overdueRate = locationFilteredTasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate < now && task.status !== 'completed';
    }).length;
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      skippedTasks,
      pausedTasks,
      avgCompletionTime,
      overdueRate: totalTasks > 0 ? (overdueRate / totalTasks) * 100 : 0,
      skipRate: totalTasks > 0 ? (skippedTasks / totalTasks) * 100 : 0,
      todaysTasks: todaysTasks.length,
      todaysCompleted: todaysTasks.filter(task => task.status === 'completed').length,
      completionRate
    };
  }, [tasks, currentLocation.code, isViewingAllLocations]);

  // Generate trend data for charts
  const trendData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= dayStart && taskDate <= dayEnd;
      });
      
      data.push({
        date: days[date.getDay()],
        completed: dayTasks.filter(task => task.status === 'completed').length,
        assigned: dayTasks.length
      });
    }
    
    return data;
  }, [tasks]);

  // Task type distribution
  const taskTypeData = useMemo(() => {
    const types = {};
    tasks.forEach(task => {
      types[task.type] = (types[task.type] || 0) + 1;
    });
    
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#6b7280'];
    return Object.entries(types).map(([type, count], index) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1).replace(/[-_]/g, ' '),
      value: count,
      color: colors[index % colors.length]
    }));
  }, [tasks]);

  // Time distribution
  const timeDistribution = useMemo(() => {
    const ranges = {
      '0-5 min': 0,
      '5-10 min': 0,
      '10-20 min': 0,
      '20-30 min': 0,
      '30+ min': 0
    };
    
    tasks.forEach(task => {
      const time = task.actualTime || task.estimatedTime;
      if (time <= 5) ranges['0-5 min']++;
      else if (time <= 10) ranges['5-10 min']++;
      else if (time <= 20) ranges['10-20 min']++;
      else if (time <= 30) ranges['20-30 min']++;
      else ranges['30+ min']++;
    });
    
    return Object.entries(ranges).map(([range, count]) => ({
      range,
      count
    }));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Location filter - only show tasks for current location unless viewing all locations
      // Map full location names to codes for backwards compatibility
      if (!isViewingAllLocations) {
        const locationNameToCode: { [key: string]: string } = { 'Kenosha': 'K', 'kenosha': 'K' };
        const taskCode = locationNameToCode[task.location] || task.location;
        if (taskCode !== currentLocation.code) return false;
      }
      
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
  }, [tasks, filters, currentLocation.code, isViewingAllLocations]);

  // Key metrics for display
  const metrics = [
    {
      label: 'Completion Rate',
      value: `${analyticsData.completionRate.toFixed(1)}%`,
      change: '+2.3%',
      positive: true,
      icon: CheckCircle
    },
    {
      label: 'Avg. Completion Time',
      value: `${analyticsData.avgCompletionTime.toFixed(1)} min`,
      change: '-1.2 min',
      positive: true,
      icon: Clock
    },
    {
      label: 'Overdue Rate',
      value: `${analyticsData.overdueRate.toFixed(1)}%`,
      change: '+0.5%',
      positive: false,
      icon: AlertTriangle
    },
    {
      label: 'Tasks Today',
      value: `${analyticsData.todaysCompleted}/${analyticsData.todaysTasks}`,
      change: analyticsData.todaysTasks > 0 ? `${((analyticsData.todaysCompleted / analyticsData.todaysTasks) * 100).toFixed(1)}%` : '0%',
      positive: true,
      icon: BarChart3
    }
  ];

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
      {/* Date Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#203B17] mb-2">Task Overview</h2>
          <p className="text-gray-600">Comprehensive analytics for {isViewingAllLocations ? 'all locations' : currentLocation.name}</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              onClick={() => setDateRange(range)}
              className="text-sm"
            >
              {range === '24h' ? '24h' : range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className={`text-sm ${metric.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <metric.icon className="w-6 h-6 text-[#2D8028]" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Trend */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Task Completion Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Completed"
                />
                <Line 
                  type="monotone" 
                  dataKey="assigned" 
                  stroke="#6b7280" 
                  strokeDasharray="5 5"
                  name="Assigned"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Task Type Distribution */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Tasks by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Time Distribution */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Completion Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Location Breakdown (if viewing all) */}
        {isViewingAllLocations && (
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Performance by Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Kenosha</h4>
                  <div className="flex justify-between text-sm">
                    <span>Completion Rate:</span>
                    <span className="font-medium">94.2%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg. Time:</span>
                    <span className="font-medium">22.1 min</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Racine (Dev)</h4>
                  <div className="flex justify-between text-sm">
                    <span>Completion Rate:</span>
                    <span className="font-medium">91.8%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg. Time:</span>
                    <span className="font-medium">24.9 min</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Milwaukee</h4>
                  <div className="flex justify-between text-sm">
                    <span>Completion Rate:</span>
                    <span className="font-medium">89.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg. Time:</span>
                    <span className="font-medium">26.3 min</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Recent Activity Table */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Recent Task Completions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Task</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-left p-2 font-medium">Time Taken</th>
                  <th className="text-left p-2 font-medium">Priority</th>
                  <th className="text-left p-2 font-medium">Completed</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks
                  .filter(task => task.status === 'completed')
                  .sort((a, b) => {
                    // Sort by completedAt date, most recent first
                    const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
                    const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
                    return dateB - dateA;
                  })
                  .slice(0, 10)
                  .map((task) => (
                  <tr key={task.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-gray-500">{task.description}</div>
                    </td>
                    <td className="p-2">
                      <Badge variant={
                        task.status === 'completed' ? 'default' : 
                        task.status === 'in_progress' ? 'secondary' : 
                        'outline'
                      }>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm">
                      {task.actualTime || task.estimatedTime || 0} min
                    </td>
                    <td className="p-2">
                      <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'}>
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm text-gray-500">
                      {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Original filters and table for backward compatibility */}
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