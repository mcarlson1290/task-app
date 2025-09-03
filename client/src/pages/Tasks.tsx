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
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { isMyTask } from "../utils/taskHelpers";
import DebugPanel from "@/components/DebugPanel";
import GamifiedProgressBars from "@/components/GamifiedProgressBars";

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
  const [assignedToMeFilter, setAssignedToMeFilter] = React.useState<boolean>(false);
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
  const { currentUser, loading: userLoading } = useCurrentUser();
  
  // Add refresh state for loading indicator
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // DEBUG: Add temporary show all recurring tasks for testing
  const [showAllRecurring, setShowAllRecurring] = React.useState(false);



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
    queryKey: ["/api/tasks", { userId: auth.user?.id, location: currentLocation.code }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (auth.user?.role === 'technician') {
        params.append('userId', auth.user.id.toString());
      }
      if (!isViewingAllLocations) {
        params.append('location', currentLocation.code);
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
    queryKey: ["/api/recurring-tasks", { location: currentLocation.code }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (!isViewingAllLocations) {
        params.append('location', currentLocation.code);
      }
      const url = `/api/recurring-tasks?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch recurring tasks');
      return response.json();
    },
    enabled: !!auth.user,
  });

  // Fetch staff data for assignment display
  const { data: staffData = [] } = useQuery({
    queryKey: ["/api/staff"],
    queryFn: async () => {
      const response = await fetch('/api/staff');
      if (!response.ok) throw new Error('Failed to fetch staff');
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
    
    // DEBUG: Show all recurring tasks option
    if (showAllRecurring) {
      const recurringOnly = tasks.filter(t => t.recurringTaskId);
      console.log(`🧪 DEBUG MODE: Showing ${recurringOnly.length} recurring tasks (bypassing filters)`);
      return recurringOnly;
    }
    
    // Location filter
    if (!isViewingAllLocations) {
      filtered = filtered.filter(task => task.location === currentLocation.code);
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

    // Only My Tasks filter
    if (assignedToMeFilter && currentUser) {
      console.log(`🎯 ASSIGNED TO ME FILTER ACTIVE - Before: ${filtered.length} tasks`);
      filtered = filtered.filter(task => {
        const isAssigned = isMyTask(task, currentUser);
        return isAssigned;
      });
      console.log(`🎯 ASSIGNED TO ME FILTER ACTIVE - After: ${filtered.length} tasks`);
    }

    // NEW DATE FILTER LOGIC - Show tasks based on visibility rules
    if (dateFilter) {
      const biweeklyTasks = filtered.filter(t => t.frequency === 'bi-weekly');
      console.log(`📅 DATE FILTER ACTIVE: ${dateFilter} - Before: ${filtered.length} tasks (${biweeklyTasks.length} bi-weekly)`);
      
      const today = new Date().toISOString().split('T')[0];
      const isViewingToday = dateFilter === today;
      
      filtered = filtered.filter(task => {
        // Handle completed/skipped tasks - they ONLY show on their action date
        if (task.status === 'completed' || task.status === 'skipped') {
          const actionDate = (task.completedAt || task.skippedAt || task.dueDate);
          const actionDateStr = actionDate ? new Date(actionDate).toISOString().split('T')[0] : null;
          return actionDateStr === dateFilter;
        }
        
        // For pending/in-progress tasks
        const taskDueDate = task.dueDate;
        if (!taskDueDate) return false;
        
        const taskDateStr = formatDateForComparison(taskDueDate);
        const isTaskOverdue = isOverdue(task) && (task.status === 'pending' || task.status === 'in_progress');
        
        if (isTaskOverdue) {
          // Overdue tasks show ONLY on today
          return dateFilter === today;
        } else {
          // NEW CLEAN FILTER LOGIC: Check for date ranges (monthly, bi-weekly, quarterly)
          if (task.visibleFromDate && task.dueDate && task.recurringTaskId) {
            const visibleFrom = new Date(task.visibleFromDate);
            const dueDate = new Date(task.dueDate);
            const viewDate = new Date(dateFilter);
            
            visibleFrom.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);
            viewDate.setHours(0, 0, 0, 0);
            
            // Show if current date is between visible and due dates
            const isVisible = viewDate >= visibleFrom && viewDate <= dueDate;
            
            // Debug ALL recurring tasks with date ranges
            if (task.recurringTaskId) {
              console.log(`🗓️ RECURRING TASK: "${task.title}" (${task.frequency}) | View: ${dateFilter} | Visible: ${task.visibleFromDate?.split('T')[0] || 'none'} to ${task.dueDate?.split('T')[0] || 'none'} | HasRecurringId: ${!!task.recurringTaskId} | Result: ${isVisible ? 'SHOW ✅' : 'HIDE ❌'}`);
            }
            
            return isVisible;
          }
          
          // For single-day tasks (daily/weekly)
          const taskDate = new Date(task.dueDate || task.completionDate);
          const viewDate = new Date(dateFilter);
          
          taskDate.setHours(0, 0, 0, 0);
          viewDate.setHours(0, 0, 0, 0);
          
          const matches = viewDate.getTime() === taskDate.getTime();
          return matches;
        }
      });
      
      const biweeklyAfter = filtered.filter(t => t.frequency === 'bi-weekly');
      console.log(`📅 Showing ${filtered.length} tasks for ${dateFilter} (${biweeklyAfter.length} bi-weekly after date filter)`);
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
  }, [tasks, searchTerm, activeFilter, statusFilter, priorityFilter, assignedToMeFilter, dateFilter, currentLocation.code, isViewingAllLocations, staffData]);

  // Clear all filters function
  const clearAllFilters = async () => {
    setActiveFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssignedToMeFilter(false);
    setDateFilter(getTodayString()); // Reset to today's date
    setSearchTerm("");
    // Refresh tasks to ensure immediate UI update
    await refreshTasks();
  };

  // DEBUG: Force regenerate all recurring tasks
  const regenerateAllRecurringTasks = async () => {
    try {
      const response = await fetch('/api/admin/generate-todays-tasks', {
        method: 'POST'
      });
      const result = await response.json();
      toast({
        title: "Tasks Generated",
        description: `Generated ${result.generatedCount} new tasks`,
      });
      await refetch();
    } catch (error) {
      toast({
        title: "Generation Failed", 
        description: "Failed to generate tasks",
        variant: "destructive"
      });
    }
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
      {/* Updated filter bar with responsive scroll */}
      <div className="filters-container">
        <div className="filters-scroll-wrapper">
          {/* Left scroll indicator */}
          {canScrollLeft && (
            <div 
              className="scroll-indicator left"
              onClick={() => {
                if (filtersRef.current) {
                  filtersRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                }
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 18l-6-6 6-6v12z"/>
              </svg>
            </div>
          )}
          
          {/* Right scroll indicator */}
          {canScrollRight && (
            <div 
              className="scroll-indicator right"
              onClick={() => {
                if (filtersRef.current) {
                  filtersRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                }
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 18l6-6-6-6v12z"/>
              </svg>
            </div>
          )}
          
          <div 
            className="filters-scroll-content task-filters tasks-filter-container"
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

          {/* Assigned to Me Toggle */}
          <label className="assigned-to-me-toggle flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50 whitespace-nowrap">
            <input
              type="checkbox"
              checked={assignedToMeFilter}
              onChange={async (e) => {
                setAssignedToMeFilter(e.target.checked);
                // When enabling "Assigned to Me", clear the date filter to show all assigned tasks
                if (e.target.checked) {
                  setDateFilter("");
                }
                await refreshTasks();
              }}
              className="h-4 w-4 text-[#2D8028] focus:ring-[#2D8028] border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">📌 Only My Tasks</span>
          </label>

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



      {/* Gamified Progress Bars */}
      <GamifiedProgressBars 
        tasks={tasks as any}
        currentUser={currentUser as any}
        selectedDate={dateFilter}
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
                  staff={staffData}
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
        currentUser={auth?.user}
      />

      {/* Task Action Modal */}
      <TaskActionModal
        task={selectedTask}
        open={taskActionModalOpen}
        onClose={() => setTaskActionModalOpen(false)}
      />
      
      {/* Debug Panel */}
      <DebugPanel 
        tasks={tasks}
        filteredTasks={filteredTasks}
        staff={staffData}
        filters={{ activeFilter, statusFilter, priorityFilter, assignedToMeFilter, dateFilter }}
      />
      </div>
    </div>
  );
};

export default Tasks;
