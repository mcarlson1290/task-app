import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Filter, Search, ChevronDown, X, Calendar } from "lucide-react";
import { format } from "date-fns";
import { isSameDay, formatDateForComparison, shouldTaskAppearOnDate, getTodayString, debugDateComparison } from "@/utils/dateUtils";
import TaskCard from "@/components/TaskCard";
import TaskModal from "@/components/TaskModal";
import { AddTaskModal } from "@/components/AddTaskModal";
import TaskActionModal from "@/components/TaskActionModal";
import { Task } from "@shared/schema";
import { TaskFilters, TaskType } from "@/types";
import { getStoredAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import confetti from "canvas-confetti";
import { TrayService } from "@/services/trayService";
import { TaskCompletionService } from "@/services/taskCompletionService";
import { useLocation } from "@/contexts/LocationContext";

const Tasks: React.FC = () => {
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = React.useState(false);
  const [taskActionModalOpen, setTaskActionModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filters, setFilters] = React.useState<TaskFilters>({});
  const [activeFilter, setActiveFilter] = React.useState<string>("all");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = React.useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = React.useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all");
  const [dateFilter, setDateFilter] = React.useState<string>(() => {
    const todayString = getTodayString();
    console.log('🗓️ Initial date filter set to:', todayString, '(Today)');
    return todayString;
  });

  const [dateDropdownOpen, setDateDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);
  const priorityDropdownRef = React.useRef<HTMLDivElement>(null);
  const dateDropdownRef = React.useRef<HTMLDivElement>(null);
  const filtersRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  
  const auth = getStoredAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentLocation, isViewingAllLocations } = useLocation();
  
  // Add refresh state for loading indicator
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);



  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setPriorityDropdownOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setDateDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll indicators functionality
  React.useEffect(() => {
    const checkScroll = () => {
      if (filtersRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = filtersRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
      }
    };
    
    checkScroll();
    const resizeObserver = new ResizeObserver(checkScroll);
    if (filtersRef.current) {
      resizeObserver.observe(filtersRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [activeFilter, statusFilter, priorityFilter, dateFilter]);

  const { data: tasks = [], isLoading, refetch } = useQuery<Task[]>({
    queryKey: ["/api/tasks", { userId: auth.user?.id, location: currentLocation.name }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (auth.user?.role === 'technician') {
        params.append('userId', auth.user.id.toString());
      }
      if (!isViewingAllLocations) {
        params.append('location', currentLocation.name);
      }
      const url = `/api/tasks?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      

      
      return data;
    },
    enabled: !!auth.user,
  });
  
  // Refresh function to update tasks immediately
  const refreshTasks = React.useCallback(async () => {
    try {
      setIsRefreshing(true);
      // Force refetch to get latest data
      await refetch();
      // Also invalidate queries to ensure cache coherence
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
    } finally {
      // Brief delay to show the refresh indicator
      setTimeout(() => setIsRefreshing(false), 300);
    }
  }, [refetch, queryClient]);

  const { data: recurringTasks = [] } = useQuery({
    queryKey: ["/api/recurring-tasks", { location: currentLocation.name }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (!isViewingAllLocations) {
        params.append('location', currentLocation.name);
      }
      const url = `/api/recurring-tasks?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch recurring tasks');
      return response.json();
    },
    enabled: !!auth.user,
  });



  // Automatic overdue task skipping
  React.useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    
    const overdueTaskIds = tasks
      .filter(task => 
        task.status !== 'completed' && 
        task.status !== 'approved' && 
        task.status !== 'skipped' && 
        isOverdue(task)
      )
      .map(task => task.id);
    
    if (overdueTaskIds.length > 0) {
      autoSkipOverdueMutation.mutate(overdueTaskIds);
    }
  }, [tasks]);

  // Periodic overdue status check (every minute)
  React.useEffect(() => {
    const checkOverdueStatus = () => {
      refetch();
    };
    
    checkOverdueStatus();
    const interval = setInterval(checkOverdueStatus, 60000);
    
    return () => clearInterval(interval);
  }, [refetch]);

  // Task update mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: number; updates: Partial<Task> }) => {
      return await apiRequest("PATCH", `/api/tasks/${taskId}`, updates);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      // Immediately refresh tasks for instant UI update
      await refreshTasks();
    },
  });

  const resetTasksMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/tasks/reset", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tasks Reset",
        description: "All tasks have been reset to their original state.",
      });
    },
    onError: (error) => {
      console.error("Error resetting tasks:", error);
      toast({
        title: "Failed to reset tasks",
        description: "There was an error resetting the tasks. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-skip overdue tasks mutation
  const autoSkipOverdueMutation = useMutation({
    mutationFn: async (taskIds: number[]) => {
      const promises = taskIds.map(taskId => 
        apiRequest("PATCH", `/api/tasks/${taskId}`, { 
          status: 'skipped', 
          skipReason: 'Automatically skipped - overdue' 
        })
      );
      return await Promise.all(promises);
    },
    onSuccess: async (_, taskIds) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      console.log(`Automatically skipped ${taskIds.length} overdue tasks`);
      // Immediately refresh tasks for instant UI update
      await refreshTasks();
    },
    onError: (error) => {
      console.error("Error skipping overdue tasks:", error);
    },
  });

  const taskTypes = [
    { value: "all", label: "All Tasks", emoji: "📋" },
    { value: "seeding-microgreens", label: "Seeding - Microgreens", emoji: "🌱" },
    { value: "seeding-leafy-greens", label: "Seeding - Leafy Greens", emoji: "🌿" },
    { value: "harvest-microgreens", label: "Harvest - Microgreens", emoji: "🌾" },
    { value: "harvest-leafy-greens", label: "Harvest - Leafy Greens", emoji: "🥬" },
    { value: "blackout-tasks", label: "Blackout Tasks", emoji: "🌑" },
    { value: "moving", label: "Moving", emoji: "📦" },
    { value: "packing", label: "Packing", emoji: "📦" },
    { value: "cleaning", label: "Cleaning", emoji: "🧹" },
    { value: "inventory", label: "Inventory", emoji: "📊" },
    { value: "equipment-maintenance", label: "Equipment Maintenance", emoji: "🔧" },
    { value: "other", label: "Other", emoji: "📝" },
  ];

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Assigned" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "completed-late", label: "Completed Late" },
    { value: "approved", label: "Approved" },
    { value: "paused", label: "Paused" },
    { value: "skipped", label: "Skipped" },
    { value: "overdue", label: "Overdue" }
  ];

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" }
  ];

  // Calculate task counts
  const taskCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    taskTypes.forEach(type => {
      if (type.value === "all") {
        counts[type.value] = tasks.length;
      } else {
        counts[type.value] = tasks.filter(task => task.type === type.value).length;
      }
    });
    return counts;
  }, [tasks]);

  // Late task detection functions - moved here before filteredTasks to avoid initialization errors
  const isOverdue = (task: Task): boolean => {
    // Check if dev overdue protection is enabled
    const overdueProtection = localStorage.getItem('devOverdueProtection') === 'true';
    if (overdueProtection) {
      return false; // Never show as overdue in dev mode
    }
    
    // Can't be overdue if already completed
    if (!task.dueDate || task.status === 'completed' || task.status === 'approved') {
      return false;
    }
    
    const now = new Date();
    
    // Handle both Date objects and strings
    let dateString: string;
    if (task.dueDate instanceof Date) {
      const year = task.dueDate.getFullYear();
      const month = String(task.dueDate.getMonth() + 1).padStart(2, '0');
      const day = String(task.dueDate.getDate()).padStart(2, '0');
      dateString = `${year}-${month}-${day}`;
    } else {
      dateString = (task.dueDate as string)?.split('T')[0] || '';
    }
    
    const [year, month, day] = dateString.split('-');
    const dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Set time to 8:30 PM Chicago time for due date
    const chicagoTime = new Date(dueDate);
    chicagoTime.setHours(20, 30, 0, 0); // 8:30 PM cutoff
    
    // Task is overdue if current time is past 8:30 PM on due date
    return now > chicagoTime;
  };

  const filteredTasks = React.useMemo(() => {
    let filtered = tasks;
    
    // Location filter
    if (!isViewingAllLocations) {
      filtered = filtered.filter(task => task.location === currentLocation.name);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (activeFilter !== "all") {
      filtered = filtered.filter(task => task.type === activeFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      switch (statusFilter) {
        case 'completed-late':
          filtered = filtered.filter(task => isTaskLate(task));
          break;
        case 'overdue':
          filtered = filtered.filter(task => isOverdue(task));
          break;
        default:
          filtered = filtered.filter(task => task.status === statusFilter);
          break;
      }
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // NEW DATE FILTER LOGIC - Show tasks based on visibility rules
    if (dateFilter) {
      const today = new Date().toISOString().split('T')[0];
      const isViewingToday = dateFilter === today;
      
      filtered = filtered.filter(task => {
        // Rule 1: Always show overdue tasks when viewing today
        if (isViewingToday && isOverdue(task)) {
          return true;
        }
        
        // Rule 2: Check task visibility based on type and frequency
        const taskDueDate = task.dueDate;
        if (!taskDueDate) return false;
        
        // Format the task due date for comparison
        const taskDateStr = formatDateForComparison(taskDueDate);
        
        // Get recurring task frequency if available
        const frequency = '';
        
        // For monthly tasks - visible from 1st to due date
        if (frequency.includes('monthly')) {
          const taskMonth = taskDateStr.substring(0, 7); // YYYY-MM
          const selectedMonth = dateFilter.substring(0, 7);
          if (taskMonth === selectedMonth) {
            const selectedDay = parseInt(dateFilter.substring(8));
            const dueDay = parseInt(taskDateStr.substring(8));
            return selectedDay <= dueDay;
          }
        }
        
        // For bi-weekly tasks
        if (frequency.includes('bi-weekly') || frequency.includes('biweekly')) {
          const taskMonth = taskDateStr.substring(0, 7);
          const selectedMonth = dateFilter.substring(0, 7);
          if (taskMonth === selectedMonth) {
            const selectedDay = parseInt(dateFilter.substring(8));
            const dueDay = parseInt(taskDateStr.substring(8));
            
            // First half: due on 14th, visible days 1-14
            if (dueDay === 14) {
              return selectedDay >= 1 && selectedDay <= 14;
            }
            // Second half: due on last day, visible days 15-end
            if (dueDay >= 28) { // Last day of month
              return selectedDay >= 15;
            }
          }
        }
        
        // For regular tasks - only show on due date
        return taskDateStr === dateFilter;
      });
      
      // Log for testing
      console.log(`Filtered ${filtered.length} tasks from ${tasks.length} total`);
      if (dateFilter) {
        console.log(`Showing tasks for date: ${dateFilter}`);
      }
    }

    // CRITICAL: Remove any duplicate tasks based on ID to prevent ghost duplicates
    const taskIds = new Set<number>();
    const uniqueFiltered = filtered.filter(task => {
      if (taskIds.has(task.id)) {
        console.warn(`Duplicate task detected and removed: ${task.id} - ${task.title}`);
        return false;
      }
      taskIds.add(task.id);
      return true;
    });
    
    // Log summary for debugging
    console.log(`Filtered from ${tasks.length} to ${uniqueFiltered.length} tasks (removed ${filtered.length - uniqueFiltered.length} duplicates)`);
    
    return uniqueFiltered;
  }, [tasks, searchTerm, activeFilter, statusFilter, priorityFilter, dateFilter, currentLocation.name, isViewingAllLocations]);

  // Clear all filters function
  const clearAllFilters = async () => {
    setActiveFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setDateFilter("");
    setSearchTerm("");
    // Refresh tasks to ensure immediate UI update
    await refreshTasks();
  };

  // Late task detection functions - fixed to avoid false positives
  // Check if task was completed AFTER becoming overdue (8:30 AM on due date)
  const isTaskCompletedLate = (task: Task): boolean => {
    // Must be completed to be late
    if (task.status !== 'completed' || !task.completedAt || !task.dueDate) {
      return false;
    }
    
    // For TEST tasks or tasks without proper dates, return false
    if (!task.dueDate) return false;
    
    try {
      const dueDate = new Date(task.dueDate);
      const completedTime = new Date(task.completedAt);
      
      // Check if dates are valid
      if (isNaN(dueDate.getTime()) || isNaN(completedTime.getTime())) return false;
      
      // Create overdue cutoff time: 8:30 PM on due date
      const overdueTime = new Date(dueDate);
      overdueTime.setHours(20, 30, 0, 0);
      
      // Task is late if completed AFTER the overdue time (8:30 PM on due date)
      return completedTime > overdueTime;
    } catch (error) {
      // If any date parsing fails, task is not late
      return false;
    }
  };

  // Legacy function name for compatibility
  const isTaskLate = isTaskCompletedLate;

  // Task status update functions
  const updateTaskStatus = (taskId: number, newStatus: string) => {
    const updates: any = { status: newStatus };
    
    if (newStatus === 'in_progress') {
      updates.startedAt = new Date().toISOString();
    } else if (newStatus === 'completed') {
      updates.completedAt = new Date().toISOString();
      updates.progress = 100;
    }
    
    updateTaskMutation.mutate({ taskId, updates });
  };

  const handleStartTask = async (taskId: number) => {
    updateTaskStatus(taskId, 'in_progress');
    const task = tasks.find(t => t.id === taskId || t.id.toString() === taskId.toString());
    if (task) {
      setSelectedTask({ ...task, status: 'in_progress' });
      setModalOpen(true);
    }
    // Refresh tasks to ensure immediate UI update
    await refreshTasks();
  };

  const handleCompleteTask = async (taskId: number) => {
    updateTaskStatus(taskId, 'completed');
    setModalOpen(false);
    
    const task = tasks.find(t => t.id === taskId || t.id.toString() === taskId.toString());
    
    if (auth.user && task) {
      TaskCompletionService.handleTaskCompletion({
        taskId: task.id,
        title: task.title,
        type: task.type,
        checklistData: task.checklist || [],
        completedBy: auth.user.id
      });
    }
    
    toast({
      title: "🎉 Task completed!",
      description: "Great job! The task has been marked as completed.",
    });
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    // Refresh tasks to ensure immediate UI update
    await refreshTasks();
  };

  // Single task action handler
  const handleTaskAction = async (taskId: number, action: 'start' | 'collaborate' | 'complete' | 'pause' | 'skip' | 'view' | 'resume', reason?: string) => {
    const task = tasks.find(t => t.id === taskId || t.id.toString() === taskId.toString());
    if (!task) return;

    switch (action) {
      case 'start':
        await handleStartTask(taskId);
        break;
        
      case 'collaborate':
        setSelectedTask(task);
        setModalOpen(true);
        // Refresh tasks in case status changed
        await refreshTasks();
        break;
        
      case 'complete':
        await handleCompleteTask(taskId);
        break;
        
      case 'view':
        setSelectedTask(task);
        setModalOpen(true);
        // Refresh tasks in case status changed
        await refreshTasks();
        break;
        
      case 'pause':
        updateTaskMutation.mutate({
          taskId,
          updates: { 
            status: 'paused',
            pausedAt: new Date().toISOString()
          } as any
        });
        setModalOpen(false);
        toast({
          title: "Task Paused",
          description: "The task has been paused and can be resumed later.",
        });
        await refreshTasks();
        break;
        
      case 'skip':
        updateTaskMutation.mutate({
          taskId,
          updates: { 
            status: 'skipped',
            skipReason: reason || 'No reason provided',
            skippedAt: new Date().toISOString()
          } as any
        });
        setModalOpen(false);
        toast({
          title: "Task Skipped",
          description: reason ? `Task skipped: ${reason}` : "Task has been skipped.",
        });
        await refreshTasks();
        break;
        
      case 'resume':
        updateTaskMutation.mutate({
          taskId,
          updates: {
            status: 'in_progress',
            resumedAt: new Date().toISOString()
          } as any
        });
        setSelectedTask({ ...task, status: 'in_progress' });
        setModalOpen(true);
        toast({
          title: "Task Resumed",
          description: "The task has been resumed and you can continue working.",
        });
        await refreshTasks();
        break;
    }
  };

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => apiRequest('POST', '/api/tasks', taskData),
    onSuccess: async () => {
      // Invalidate all task queries to ensure proper cache refresh
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
      
      // Immediately refresh tasks for instant UI update
      await refreshTasks();
      
      setAddTaskModalOpen(false);
      toast({
        title: "Task Created",
        description: "New task has been added successfully",
      });
    },
    onError: (error) => {
      console.error('Create task error:', error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleAddTask = async (taskData: any) => {
    console.log('handleAddTask called with:', taskData);
    
    const newTask = {
      ...taskData,
      // Send date as string, server will handle conversion
      dueDate: taskData.dueDate,
      // Add location to the task
      location: currentLocation.code,
    };
    
    console.log('Calling createTaskMutation with:', newTask);
    createTaskMutation.mutate(newTask);
    // Additional refresh to ensure immediate UI update
    await refreshTasks();
  };

  const handleNewTask = async () => {
    setAddTaskModalOpen(true);
    // Refresh tasks when opening modal to ensure latest data
    await refreshTasks();
  };



  // Task Summary Component - now responsive to filters
  const TaskSummary = ({ 
    tasks, 
    activeFilter, 
    statusFilter, 
    dateFilter 
  }: { 
    tasks: Task[], 
    activeFilter: string, 
    statusFilter: string, 
    dateFilter: string 
  }) => {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const lateTasks = completedTasks.filter(t => isTaskLate(t));
    const onTimeTasks = completedTasks.length - lateTasks.length;
    const overdueTasks = tasks.filter(t => isOverdue(t));
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    
    // Calculate completion rate only if there are completed tasks
    const completionRate = completedTasks.length > 0 
      ? Math.round((onTimeTasks / completedTasks.length) * 100) 
      : 0;
    
    // Get filter description for context
    const getFilterDescription = () => {
      let desc = '';
      
      // Add date context
      if (dateFilter) {
        const today = new Date().toISOString().split('T')[0];
        if (dateFilter === today) {
          desc += "Today's ";
        } else {
          desc += `${dateFilter} `;
        }
      }
      
      // Add type filter context
      if (activeFilter !== 'all') {
        const taskType = taskTypes.find(t => t.value === activeFilter);
        desc += taskType ? taskType.label + ' ' : '';
      }
      
      // Add status filter context
      if (statusFilter !== 'all') {
        const statusOption = statusOptions.find(s => s.value === statusFilter);
        desc += statusOption ? statusOption.label + ' ' : '';
      }
      
      return desc || 'All ';
    };
    
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-[#203B17]">Task Statistics</h3>
          <span className="text-sm text-gray-600 font-medium">{getFilterDescription()}Tasks</span>
        </div>
        
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-2xl mb-2">📭</div>
            <p>No tasks match the current filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{tasks.length}</div>
              <div className="text-xs text-blue-700">Total</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-600">{pendingTasks.length}</div>
              <div className="text-xs text-gray-700">Pending</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-xl font-bold text-yellow-600">{inProgressTasks.length}</div>
              <div className="text-xs text-yellow-700">In Progress</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">{onTimeTasks}</div>
              <div className="text-xs text-green-700">On Time</div>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <div className="text-xl font-bold text-amber-600">{lateTasks.length}</div>
              <div className="text-xs text-amber-700">Late</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-600">{overdueTasks.length}</div>
              <div className="text-xs text-red-700">Overdue</div>
            </div>
          </div>
        )}
        
        {completedTasks.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completion Performance:</span>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${
                  completionRate >= 80 ? 'text-green-600' : 
                  completionRate >= 60 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {completionRate}%
                </span>
                <span className="text-xs text-gray-500">
                  ({onTimeTasks} on time, {lateTasks.length} late)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="task-manager">
      {/* Updated filter bar with New Task button */}
      <div className={`task-filters-wrapper ${canScrollLeft ? 'can-scroll-left' : ''} ${canScrollRight ? 'can-scroll-right' : ''}`}>
        <div 
          className="task-filters tasks-filter-container"
          ref={filtersRef}
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            setCanScrollLeft(target.scrollLeft > 0);
            setCanScrollRight(target.scrollLeft + target.clientWidth < target.scrollWidth - 5);
          }}
        >
          {/* Category Select */}
          <select 
            value={activeFilter}
            onChange={async (e) => {
              setActiveFilter(e.target.value);
              await refreshTasks();
            }}
            className="filter-select"
          >
            <option value="all">Category</option>
            {taskTypes.filter(type => type.value !== "all").map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={async (e) => {
              setStatusFilter(e.target.value);
              await refreshTasks();
            }}
            className="filter-select"
          >
            <option value="all">Status</option>
            {statusOptions.filter(option => option.value !== "all").map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Priority Select */}
          <select
            value={priorityFilter}
            onChange={async (e) => {
              setPriorityFilter(e.target.value);
              await refreshTasks();
            }}
            className="filter-select"
          >
            <option value="all">Priority</option>
            {priorityOptions.filter(option => option.value !== "all").map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Date Input */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={async (e) => {
                setDateFilter(e.target.value);
                await refreshTasks();
              }}
              className="date-input"
            />
            <button
              onClick={async () => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const todayString = `${year}-${month}-${day}`;
                console.log('🗓️ Today button clicked, setting date to:', todayString);
                setDateFilter(todayString);
                await refreshTasks();
              }}
              className="btn-today"
              title="Go to today"
            >
              Today
            </button>
          </div>

          {/* Clear Filters Button */}
          <button 
            className="btn-clear-filters"
            onClick={clearAllFilters}
          >
            <X size={16} /> Clear Filters
          </button>

          {/* Search Box */}
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={async (e) => {
                setSearchTerm(e.target.value);
                // Debounce search to avoid too many refreshes
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                }
                searchTimeoutRef.current = setTimeout(async () => {
                  await refreshTasks();
                }, 300);
              }}
              className="search-input"
            />
          </div>

          {/* New Task Button */}
          <button 
            className="btn-new-task"
            onClick={handleNewTask}
          >
            <Plus size={16} /> New Task
          </button>

          {/* Refresh Tasks Button */}
          <button 
            className="btn-refresh"
            onClick={async () => {
              console.log('=== REFRESHING TASKS ===');
              await refreshTasks();
              toast({
                title: "Tasks Refreshed",
                description: "All tasks reloaded successfully",
              });
            }}
            disabled={isRefreshing}
            title="Refresh and reload all tasks"
          >
            {isRefreshing ? '⏳ Refreshing...' : '🔄 Refresh Tasks'}
          </button>
        </div>
      </div>

      {/* Refresh Loading Indicator */}
      {isRefreshing && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '8px 16px',
          background: '#2D8028',
          color: 'white',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div className="animate-spin" style={{
            width: '16px',
            height: '16px',
            border: '2px solid transparent',
            borderTop: '2px solid white',
            borderRadius: '50%'
          }}></div>
          Updating tasks...
        </div>
      )}

      {/* Task Summary Statistics - now responsive to filters */}
      <TaskSummary 
        tasks={filteredTasks} 
        activeFilter={activeFilter}
        statusFilter={statusFilter}
        dateFilter={dateFilter}
      />

      {/* Task Content */}
      <div className="task-content">
        {filteredTasks.length === 0 ? (
          <div className="no-tasks">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
            <h3>No tasks found</h3>
            <p>You're all caught up! No tasks available right now.</p>
          </div>
        ) : (
          <div className="task-list">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onTaskAction={handleTaskAction}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onTaskAction={handleTaskAction}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        open={addTaskModalOpen}
        onClose={() => setAddTaskModalOpen(false)}
        onSave={handleAddTask}
      />

      {/* Task Action Modal */}
      <TaskActionModal
        task={selectedTask}
        open={taskActionModalOpen}
        onClose={() => setTaskActionModalOpen(false)}
      />
      </div>
    </div>
  );
};

export default Tasks;
